import { Response } from 'express';
import { prisma } from '../db';
import { sendError, sendSuccess } from '../utils/response';
import { AuthenticatedRequest } from '../middleware/auth';
import { calculateParkingPrice } from '../services/pricingEngine';
import { holdSlotForUser, isSlotOverlapping, releaseHold } from '../services/availabilityEngine';
import { generateSecureQrToken, generateQrCodeDataUrl, verifyQrToken } from '../utils/qr';
import crypto from 'crypto';

export const holdSlot = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) return sendError(res, 'Unauthenticated', 'UNAUTHORIZED', 401);
    const { slotId, startTime, endTime } = req.body;

    if (!slotId || !startTime || !endTime) {
      return sendError(res, 'slotId, startTime, and endTime are required', 'VALIDATION_ERROR', 400);
    }

    const start = new Date(startTime);
    const end = new Date(endTime);

    const holdResult = await holdSlotForUser(slotId, req.user.id, start, end, 10);
    return sendSuccess(res, 'Slot held successfully for 10 minutes', holdResult);
  } catch (error: any) {
    return sendError(res, error.message || 'Failed to hold slot', 'SLOT_UNAVAILABLE', 400);
  }
};

export const calculatePrice = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { facilityId, slotId, vehicleType, startTime, endTime, couponCode } = req.body;

    if (!facilityId || !startTime || !endTime || !vehicleType) {
      return sendError(res, 'facilityId, vehicleType, startTime, and endTime are required', 'VALIDATION_ERROR', 400);
    }

    const result = await calculateParkingPrice({
      facilityId,
      slotId,
      vehicleType,
      startTime,
      endTime,
      couponCode,
    });

    return sendSuccess(res, 'Price calculated successfully', result);
  } catch (error: any) {
    return sendError(res, error.message || 'Price calculation failed', 'CALCULATION_ERROR', 400);
  }
};

export const createBooking = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) return sendError(res, 'Unauthenticated', 'UNAUTHORIZED', 401);
    const {
      facilityId,
      slotId,
      vehicleId,
      startTime,
      endTime,
      couponCode,
      holdToken,
      paymentMethod = 'UPI',
    } = req.body;

    if (!facilityId || !slotId || !vehicleId || !startTime || !endTime) {
      return sendError(res, 'Missing required booking parameters', 'VALIDATION_ERROR', 400);
    }

    const start = new Date(startTime);
    const end = new Date(endTime);

    // Double booking protection check
    const hasOverlap = await isSlotOverlapping({ slotId, startTime: start, endTime: end });
    if (hasOverlap && !holdToken) {
      return sendError(
        res,
        'This slot has already been booked or held by another customer for the selected time.',
        'SLOT_DOUBLE_BOOKED',
        409
      );
    }

    // Vehicle verification
    const vehicle = await prisma.vehicle.findFirst({
      where: { id: vehicleId, userId: req.user.id },
    });
    if (!vehicle) {
      return sendError(res, 'Invalid vehicle selected', 'NOT_FOUND', 404);
    }

    // Slot verification
    const slot = await prisma.parkingSlot.findUnique({ where: { id: slotId } });
    if (!slot) {
      return sendError(res, 'Selected slot does not exist', 'NOT_FOUND', 404);
    }

    // Server side price calculation
    const pricingResult = await calculateParkingPrice({
      facilityId,
      slotId,
      vehicleType: vehicle.vehicleType as any,
      startTime,
      endTime,
      couponCode,
    });

    const bookingCode = `PE-${new Date().getFullYear()}-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;
    const qrToken = generateSecureQrToken(bookingCode, slot.slotNumber, req.user.id);

    // Create booking record inside a database transaction
    const booking = await prisma.$transaction(async (tx) => {
      const newBooking = await tx.booking.create({
        data: {
          bookingCode,
          qrToken,
          userId: req.user!.id,
          vehicleId,
          facilityId,
          slotId,
          startTime: start,
          endTime: end,
          basePrice: pricingResult.basePrice,
          taxAmount: pricingResult.taxAmount,
          platformFee: pricingResult.platformFee,
          discountAmount: pricingResult.discountAmount,
          totalAmount: pricingResult.finalTotal,
          status: 'CONFIRMED',
        },
        include: {
          facility: true,
          slot: true,
          vehicle: true,
        },
      });

      // Create Payment Record
      const orderId = `order_${crypto.randomBytes(8).toString('hex')}`;
      const paymentId = `pay_${crypto.randomBytes(8).toString('hex')}`;

      await tx.payment.create({
        data: {
          bookingId: newBooking.id,
          orderId,
          paymentId,
          signature: `sig_${crypto.randomBytes(8).toString('hex')}`,
          amount: pricingResult.finalTotal,
          paymentMethod,
          status: 'SUCCESS',
        },
      });

      // Record Coupon Usage if coupon applied
      if (pricingResult.appliedCoupon) {
        const coupon = await tx.coupon.findUnique({
          where: { code: pricingResult.appliedCoupon.code },
        });
        if (coupon) {
          await tx.couponUsage.create({
            data: {
              couponId: coupon.id,
              userId: req.user!.id,
              bookingId: newBooking.id,
              discountAmount: pricingResult.discountAmount,
            },
          });
        }
      }

      // Create Notification
      await tx.notification.create({
        data: {
          userId: req.user!.id,
          category: 'BOOKING',
          title: 'Booking Confirmed!',
          message: `Your slot ${slot.slotNumber} at ${newBooking.facility.name} is reserved for ${bookingCode}.`,
          link: `/booking/${newBooking.id}`,
        },
      });

      // Release slot hold if present
      if (holdToken) {
        await tx.slotHold.deleteMany({ where: { holdToken } });
      }

      return newBooking;
    });

    const qrDataUrl = await generateQrCodeDataUrl(qrToken);

    return sendSuccess(
      res,
      'Booking confirmed successfully',
      {
        booking: {
          ...booking,
          qrDataUrl,
        },
        payment: {
          status: 'SUCCESS',
          amount: pricingResult.finalTotal,
        },
      },
      201
    );
  } catch (error: any) {
    return sendError(res, error.message || 'Failed to create booking', 'BOOKING_FAILED', 500);
  }
};

export const getMyBookings = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) return sendError(res, 'Unauthenticated', 'UNAUTHORIZED', 401);

    const bookings = await prisma.booking.findMany({
      where: { userId: req.user.id },
      include: {
        facility: {
          select: { name: true, address: true, city: true, photos: true },
        },
        slot: true,
        vehicle: true,
        payment: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    const enriched = await Promise.all(
      bookings.map(async (b) => {
        const qrDataUrl = await generateQrCodeDataUrl(b.qrToken);
        let parsedPhotos: string[] = [];
        try {
          parsedPhotos = JSON.parse(b.facility.photos || '[]');
        } catch (e) {
          parsedPhotos = [];
        }

        return {
          ...b,
          facility: {
            ...b.facility,
            thumbnail: parsedPhotos[0] || null,
          },
          qrDataUrl,
        };
      })
    );

    return sendSuccess(res, 'My bookings retrieved', enriched);
  } catch (error: any) {
    return sendError(res, error.message || 'Failed to fetch bookings', 'SERVER_ERROR', 500);
  }
};

export const getBookingById = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) return sendError(res, 'Unauthenticated', 'UNAUTHORIZED', 401);
    const { id } = req.params;

    const booking = await prisma.booking.findFirst({
      where: { id, userId: req.user.id },
      include: {
        facility: {
          select: { name: true, address: true, city: true, phone: true, photos: true, rules: true, latitude: true, longitude: true },
        },
        slot: true,
        vehicle: true,
        payment: true,
        refund: true,
        review: true,
      },
    });

    if (!booking) {
      return sendError(res, 'Booking record not found', 'NOT_FOUND', 404);
    }

    const qrDataUrl = await generateQrCodeDataUrl(booking.qrToken);

    return sendSuccess(res, 'Booking details fetched', {
      ...booking,
      qrDataUrl,
    });
  } catch (error: any) {
    return sendError(res, error.message || 'Failed to fetch booking', 'SERVER_ERROR', 500);
  }
};

export const cancelBooking = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) return sendError(res, 'Unauthenticated', 'UNAUTHORIZED', 401);
    const { id } = req.params;
    const { reason } = req.body;

    const booking = await prisma.booking.findFirst({
      where: { id, userId: req.user.id },
      include: { payment: true, facility: true },
    });

    if (!booking) {
      return sendError(res, 'Booking not found', 'NOT_FOUND', 404);
    }

    if (booking.status === 'CANCELLED' || booking.status === 'REFUNDED') {
      return sendError(res, 'Booking is already cancelled', 'ALREADY_CANCELLED', 400);
    }

    if (booking.status === 'ACTIVE' || booking.status === 'COMPLETED') {
      return sendError(res, 'Active or completed bookings cannot be cancelled', 'INVALID_STATE', 400);
    }

    // Cancellation refund policy calculation
    const now = new Date();
    const hoursUntilStart = (booking.startTime.getTime() - now.getTime()) / (1000 * 60 * 60);

    let refundPercent = 0;
    if (hoursUntilStart >= 2) {
      refundPercent = 1.0; // 100% full refund
    } else if (hoursUntilStart >= 1) {
      refundPercent = 0.5; // 50% partial refund
    } else {
      refundPercent = 0.0; // No refund if less than 1 hr
    }

    const refundAmount = Math.round(booking.totalAmount * refundPercent * 100) / 100;
    const refundId = `ref_${crypto.randomBytes(8).toString('hex')}`;

    const updatedBooking = await prisma.$transaction(async (tx) => {
      const updated = await tx.booking.update({
        where: { id },
        data: { status: 'CANCELLED' },
      });

      if (refundAmount > 0 && booking.payment) {
        await tx.refund.create({
          data: {
            bookingId: id,
            paymentId: booking.payment.id,
            refundId,
            amount: refundAmount,
            reason: reason || 'Customer requested cancellation',
            status: 'PROCESSED',
          },
        });
      }

      await tx.notification.create({
        data: {
          userId: req.user!.id,
          category: 'BOOKING',
          title: 'Booking Cancelled',
          message: `Your booking ${booking.bookingCode} was cancelled. Refund of ₹${refundAmount} has been processed.`,
        },
      });

      return updated;
    });

    return sendSuccess(res, 'Booking cancelled successfully', {
      booking: updatedBooking,
      refundAmount,
      refundPercent: refundPercent * 100,
    });
  } catch (error: any) {
    return sendError(res, error.message || 'Failed to cancel booking', 'SERVER_ERROR', 500);
  }
};

// Operator Gate QR Scanner & Entry/Exit Check-in/out
export const operatorCheckIn = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { qrToken, bookingCode } = req.body;

    let targetBookingCode = bookingCode;
    if (qrToken) {
      const qrVerification = verifyQrToken(qrToken);
      if (!qrVerification.valid || !qrVerification.bookingCode) {
        return sendError(res, 'Invalid or forged QR Code scanned', 'INVALID_QR', 400);
      }
      targetBookingCode = qrVerification.bookingCode;
    }

    if (!targetBookingCode) {
      return sendError(res, 'QR Token or Booking Code is required', 'VALIDATION_ERROR', 400);
    }

    const booking = await prisma.booking.findUnique({
      where: { bookingCode: targetBookingCode },
      include: { user: true, vehicle: true, facility: true, slot: true },
    });

    if (!booking) {
      return sendError(res, 'Booking code not found', 'NOT_FOUND', 404);
    }

    if (booking.status === 'ACTIVE') {
      return sendError(res, 'Vehicle is already checked in and active', 'ALREADY_CHECKED_IN', 400);
    }

    const entryTime = new Date();
    const updated = await prisma.booking.update({
      where: { id: booking.id },
      data: {
        status: 'ACTIVE',
        actualEntryTime: entryTime,
      },
    });

    return sendSuccess(res, 'Vehicle entry validated and allowed!', {
      bookingId: booking.id,
      bookingCode: booking.bookingCode,
      customerName: booking.user.name,
      vehicleNumber: booking.vehicle.vehicleNumber,
      slotNumber: booking.slot.slotNumber,
      entryTime,
      status: 'ACTIVE',
    });
  } catch (error: any) {
    return sendError(res, error.message || 'Check-in failed', 'SERVER_ERROR', 500);
  }
};

export const operatorCheckOut = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { qrToken, bookingCode } = req.body;

    let targetBookingCode = bookingCode;
    if (qrToken) {
      const qrVerification = verifyQrToken(qrToken);
      if (qrVerification.valid && qrVerification.bookingCode) {
        targetBookingCode = qrVerification.bookingCode;
      }
    }

    const booking = await prisma.booking.findUnique({
      where: { bookingCode: targetBookingCode },
      include: { facility: { include: { pricing: true } }, slot: true, vehicle: true },
    });

    if (!booking) {
      return sendError(res, 'Booking record not found', 'NOT_FOUND', 404);
    }

    const exitTime = new Date();
    let overstayFee = 0;
    let overstayMinutes = 0;

    // Overstay logic: If actual exit time exceeds reserved exit time by more than 15 minutes grace period
    if (exitTime.getTime() > booking.endTime.getTime() + 15 * 60 * 1000) {
      overstayMinutes = Math.ceil((exitTime.getTime() - booking.endTime.getTime()) / (1000 * 60));
      const extraHours = Math.ceil(overstayMinutes / 60);
      const hourlyRate = booking.facility.pricing?.hourlyRate || 40;
      overstayFee = extraHours * hourlyRate * 1.5; // 1.5x penalty rate for overstay
      overstayFee = Math.round(overstayFee * 100) / 100;
    }

    const updated = await prisma.booking.update({
      where: { id: booking.id },
      data: {
        status: 'COMPLETED',
        actualExitTime: exitTime,
        overstayFee,
        totalAmount: booking.totalAmount + overstayFee,
      },
    });

    return sendSuccess(res, 'Vehicle checkout completed successfully', {
      bookingCode: booking.bookingCode,
      slotNumber: booking.slot.slotNumber,
      reservedUntil: booking.endTime,
      actualExit: exitTime,
      overstayMinutes,
      overstayFee,
      finalTotal: booking.totalAmount + overstayFee,
      status: 'COMPLETED',
    });
  } catch (error: any) {
    return sendError(res, error.message || 'Check-out failed', 'SERVER_ERROR', 500);
  }
};
