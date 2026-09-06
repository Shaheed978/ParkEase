import { PriceCalculationRequest, PriceCalculationResult, VehicleType } from '@parkease/shared';
import { prisma } from '../db';

export const calculateParkingPrice = async (
  params: PriceCalculationRequest
): Promise<PriceCalculationResult> => {
  const { facilityId, slotId, vehicleType, startTime, endTime, couponCode } = params;

  const start = new Date(startTime);
  const end = new Date(endTime);

  if (isNaN(start.getTime()) || isNaN(end.getTime()) || end <= start) {
    throw new Error('Invalid start or end time format. End time must be after start time.');
  }

  // Calculate duration in hours (rounded up to nearest 0.5 hour, minimum 1 hour)
  const durationMs = end.getTime() - start.getTime();
  let durationHours = durationMs / (1000 * 60 * 60);
  durationHours = Math.max(1, Math.ceil(durationHours * 2) / 2);

  // Fetch facility pricing configuration
  const facility = await prisma.parkingFacility.findUnique({
    where: { id: facilityId },
    include: { pricing: true },
  });

  if (!facility || !facility.pricing) {
    throw new Error('Parking facility or pricing configuration not found.');
  }

  const p = facility.pricing;
  const baseHourlyRate = p.hourlyRate;
  const dailyMaxRate = p.dailyMaxRate;

  // Check weekend status (Saturday = 6, Sunday = 0)
  const dayOfWeek = start.getDay();
  const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

  // Vehicle type multiplier
  let vehicleMultiplier = 1.0;
  let vehicleLabel = 'Four-Wheeler Standard Rate';

  if (vehicleType === VehicleType.TWO_WHEELER) {
    vehicleMultiplier = 0.5;
    vehicleLabel = 'Two-Wheeler Rate (50% of base)';
  } else if (vehicleType === VehicleType.EV) {
    vehicleMultiplier = 1.1;
    vehicleLabel = 'EV Rate (Includes Priority EV Infrastructure)';
  } else if (vehicleType === VehicleType.ACCESSIBLE) {
    vehicleMultiplier = 0.9;
    vehicleLabel = 'Accessible Parking Discount Rate';
  }

  // Slot specific modifier
  let slotTypeModifier = 0.0;
  if (slotId) {
    const slot = await prisma.parkingSlot.findUnique({ where: { id: slotId } });
    if (slot && slot.priceModifier) {
      slotTypeModifier = slot.priceModifier;
    }
  }

  // Base Calculation
  let hourlySubtotal = (baseHourlyRate + slotTypeModifier) * vehicleMultiplier * durationHours;

  // Apply Daily Max Cap
  if (hourlySubtotal > dailyMaxRate && durationHours >= 8) {
    hourlySubtotal = dailyMaxRate;
  }

  // Weekend Surge
  const weekendSurge = isWeekend ? (hourlySubtotal * p.weekendSurgePercent) / 100 : 0;

  // EV charging fee if applicable
  const evChargingFee = vehicleType === VehicleType.EV ? p.evChargeRate * durationHours : 0;

  const subtotal = Math.round((hourlySubtotal + weekendSurge + evChargingFee) * 100) / 100;

  // Coupon Calculation
  let discountAmount = 0;
  let appliedCoupon: PriceCalculationResult['appliedCoupon'] | undefined = undefined;

  if (couponCode && couponCode.trim().length > 0) {
    const coupon = await prisma.coupon.findUnique({
      where: { code: couponCode.trim().toUpperCase() },
    });

    if (coupon && coupon.active && new Date() >= coupon.startDate && new Date() <= coupon.endDate) {
      if (subtotal >= coupon.minOrder) {
        if (coupon.discountPercent) {
          discountAmount = (subtotal * coupon.discountPercent) / 100;
          if (coupon.maxDiscount && discountAmount > coupon.maxDiscount) {
            discountAmount = coupon.maxDiscount;
          }
        } else if (coupon.fixedDiscount) {
          discountAmount = coupon.fixedDiscount;
        }

        discountAmount = Math.min(discountAmount, subtotal);
        discountAmount = Math.round(discountAmount * 100) / 100;

        appliedCoupon = {
          code: coupon.code,
          discount: discountAmount,
        };
      }
    }
  }

  const taxableBase = Math.max(0, subtotal - discountAmount);

  // Platform Fee (10% default)
  const platformFee = Math.round(((taxableBase * p.platformFeePercent) / 100) * 100) / 100;

  // Tax (18% GST)
  const taxAmount = Math.round(((taxableBase * 0.18) + (platformFee * 0.18)) * 100) / 100;

  // Final Total
  const finalTotal = Math.round((taxableBase + platformFee + taxAmount) * 100) / 100;

  // Breakdown items for clear transparent user invoice display
  const breakdown = [
    { label: `Parking Fee (${durationHours} hrs @ ₹${baseHourlyRate}/hr)`, amount: Math.round(hourlySubtotal * 100) / 100 },
  ];

  if (weekendSurge > 0) {
    breakdown.push({ label: `Weekend Surcharge (${p.weekendSurgePercent}%)`, amount: Math.round(weekendSurge * 100) / 100 });
  }

  if (evChargingFee > 0) {
    breakdown.push({ label: `EV Charging Facility Fee`, amount: Math.round(evChargingFee * 100) / 100 });
  }

  if (discountAmount > 0) {
    breakdown.push({ label: `Promo Discount (${appliedCoupon?.code})`, amount: -discountAmount });
  }

  breakdown.push({ label: `Platform Service Fee (${p.platformFeePercent}%)`, amount: platformFee });
  breakdown.push({ label: `Government GST (18%)`, amount: taxAmount });

  return {
    basePrice: Math.round(hourlySubtotal * 100) / 100,
    hours: durationHours,
    isWeekend,
    weekendSurge: Math.round(weekendSurge * 100) / 100,
    vehicleTypeMultiplier: vehicleMultiplier,
    vehicleModifierAmount: Math.round((hourlySubtotal * (vehicleMultiplier - 1)) * 100) / 100,
    slotTypeModifier,
    evChargingFee: Math.round(evChargingFee * 100) / 100,
    subtotal,
    discountAmount,
    platformFee,
    taxAmount,
    finalTotal,
    breakdown,
    appliedCoupon,
  };
};
