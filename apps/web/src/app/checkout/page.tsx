'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Car,
  Clock,
  ShieldCheck,
  Tag,
  CheckCircle2,
  AlertCircle,
  CreditCard,
  Lock,
  ArrowRight,
  ChevronLeft,
  Zap,
} from 'lucide-react';
import { api, getAuthToken } from '@/lib/api';
import confetti from 'canvas-confetti';

function CheckoutPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const facilityId = searchParams.get('facilityId') || '';
  const slotId = searchParams.get('slotId') || '';
  const startTime = searchParams.get('startTime') || '';
  const endTime = searchParams.get('endTime') || '';

  const [user, setUser] = useState<any>(null);
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [selectedVehicleId, setSelectedVehicleId] = useState<string>('');
  const [newVehicleNumber, setNewVehicleNumber] = useState('KA-01-MJ-4050');

  const [holdToken, setHoldToken] = useState<string | null>(null);
  const [holdExpiresAt, setHoldExpiresAt] = useState<Date | null>(null);
  const [timeLeftSeconds, setTimeLeftSeconds] = useState<number>(600); // 10 mins

  const [couponCode, setCouponCode] = useState('PARK50');
  const [pricing, setPricing] = useState<any>(null);
  const [pricingLoading, setPricingLoading] = useState(false);

  const [paymentMethod, setPaymentMethod] = useState<'UPI' | 'CARD' | 'NETBANKING'>('UPI');
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);

  // Auth check & load vehicles
  useEffect(() => {
    const token = getAuthToken();
    if (!token) {
      router.push(`/login?redirect=/checkout?facilityId=${facilityId}&slotId=${slotId}&startTime=${startTime}&endTime=${endTime}`);
      return;
    }

    api.getMe().then((res) => {
      if (res.success && res.data) {
        setUser(res.data);
      }
    });

    api.getVehicles().then((res) => {
      if (res.success && res.data) {
        setVehicles(res.data);
        if (res.data.length > 0) {
          const defaultV = res.data.find((v: any) => v.isDefault) || res.data[0];
          setSelectedVehicleId(defaultV.id);
        }
      }
    });

    // Hold slot for 10 mins
    if (slotId && startTime && endTime) {
      api.holdSlot({ slotId, startTime, endTime }).then((res) => {
        if (res.success && res.data) {
          setHoldToken(res.data.holdToken);
          setHoldExpiresAt(new Date(res.data.expiresAt));
        }
      });
    }
  }, [slotId, startTime, endTime]);

  // Hold countdown timer
  useEffect(() => {
    if (!holdExpiresAt) return;
    const interval = setInterval(() => {
      const diff = Math.max(0, Math.floor((holdExpiresAt.getTime() - Date.now()) / 1000));
      setTimeLeftSeconds(diff);
      if (diff <= 0) {
        clearInterval(interval);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [holdExpiresAt]);

  // Recalculate price whenever coupon or parameters change
  const calculatePrice = async () => {
    if (!facilityId || !startTime || !endTime) return;
    setPricingLoading(true);

    const vehicle = vehicles.find((v) => v.id === selectedVehicleId);
    const vehicleType = vehicle ? vehicle.vehicleType : 'FOUR_WHEELER';

    const res = await api.calculatePrice({
      facilityId,
      slotId,
      vehicleType,
      startTime,
      endTime,
      couponCode,
    });

    if (res.success && res.data) {
      setPricing(res.data);
    }
    setPricingLoading(false);
  };

  useEffect(() => {
    calculatePrice();
  }, [facilityId, slotId, selectedVehicleId, couponCode, vehicles]);

  // Add new vehicle inline if user has no saved vehicles
  const handleAddQuickVehicle = async () => {
    if (!newVehicleNumber) return;
    const res = await api.addVehicle({
      vehicleNumber: newVehicleNumber,
      vehicleType: 'FOUR_WHEELER',
      brand: 'Tata',
      model: 'Nexon',
      isEv: true,
      isDefault: true,
    });
    if (res.success && res.data) {
      setVehicles([res.data, ...vehicles]);
      setSelectedVehicleId(res.data.id);
    }
  };

  // Process Booking & Razorpay Payment Simulation
  const handleConfirmAndPay = async () => {
    if (!selectedVehicleId) {
      if (!newVehicleNumber) {
        setPaymentError('Please enter a vehicle license plate number.');
        return;
      }
      // Create vehicle on the fly
      const vRes = await api.addVehicle({
        vehicleNumber: newVehicleNumber,
        vehicleType: 'FOUR_WHEELER',
        isDefault: true,
      });
      if (vRes.success && vRes.data) {
        setSelectedVehicleId(vRes.data.id);
        executePayment(vRes.data.id);
      }
    } else {
      executePayment(selectedVehicleId);
    }
  };

  const executePayment = async (vehicleId: string) => {
    setIsProcessingPayment(true);
    setPaymentError(null);

    try {
      const res = await api.createBooking({
        facilityId,
        slotId,
        vehicleId,
        startTime,
        endTime,
        couponCode,
        holdToken,
        paymentMethod,
      });

      if (res.success && res.data) {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
        });

        const bookingId = res.data.booking.id;
        router.push(`/booking/${bookingId}`);
      } else {
        setPaymentError(res.message || 'Payment or booking creation failed.');
      }
    } catch (e: any) {
      setPaymentError(e.message || 'Payment simulation failed.');
    } finally {
      setIsProcessingPayment(false);
    }
  };

  const minutes = Math.floor(timeLeftSeconds / 60);
  const seconds = timeLeftSeconds % 60;
  const formattedTimer = `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;

  return (
    <div className="min-h-screen bg-slate-50 py-10">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        {/* Top Back Link & Header */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => router.back()}
            className="text-xs font-bold text-slate-600 hover:text-slate-900 flex items-center gap-1"
          >
            <ChevronLeft className="w-4 h-4" /> Back to Facility
          </button>
          <span className="text-xs font-bold uppercase tracking-wider text-brand-600">Secure Checkout</span>
        </div>

        {/* Slot Hold Countdown Banner */}
        <div className="bg-gradient-to-r from-amber-500 to-orange-500 text-white p-4 rounded-2xl shadow-md flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Clock className="w-6 h-6 animate-pulse" />
            <div>
              <span className="font-extrabold text-sm block">Slot Held For You</span>
              <span className="text-xs opacity-90">Finish payment before timer expires to guarantee your slot.</span>
            </div>
          </div>
          <div className="bg-white/20 backdrop-blur-md px-3.5 py-1.5 rounded-xl font-black text-xl font-mono">
            {formattedTimer}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          {/* Left Column: Vehicle & Payment Details */}
          <div className="md:col-span-7 space-y-6">
            {/* Step 1: Vehicle Selection */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
              <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
                <Car className="w-4 h-4 text-brand-600" /> Select Saved Vehicle
              </h3>

              {vehicles.length > 0 ? (
                <div className="space-y-2">
                  {vehicles.map((v) => (
                    <label
                      key={v.id}
                      className={`flex items-center justify-between p-3.5 rounded-2xl border cursor-pointer transition-all ${
                        selectedVehicleId === v.id
                          ? 'border-brand-500 bg-brand-50/50 ring-2 ring-brand-500/20'
                          : 'border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <input
                          type="radio"
                          name="vehicle"
                          checked={selectedVehicleId === v.id}
                          onChange={() => setSelectedVehicleId(v.id)}
                          className="w-4 h-4 text-brand-600 focus:ring-brand-500"
                        />
                        <div>
                          <span className="font-extrabold text-slate-900 text-sm block">
                            {v.vehicleNumber}
                          </span>
                          <span className="text-xs text-slate-500">
                            {v.brand} {v.model} ({v.vehicleType})
                          </span>
                        </div>
                      </div>
                      {v.isEv && (
                        <span className="text-[10px] font-bold uppercase bg-amber-100 text-amber-800 px-2 py-0.5 rounded flex items-center gap-1">
                          <Zap className="w-3 h-3 fill-amber-600" /> EV
                        </span>
                      )}
                    </label>
                  ))}
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="text-xs text-slate-500">Enter your vehicle license plate number to proceed:</p>
                  <input
                    type="text"
                    value={newVehicleNumber}
                    onChange={(e) => setNewVehicleNumber(e.target.value)}
                    placeholder="e.g. KA-01-MJ-4050"
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 text-sm focus:ring-2 focus:ring-brand-500"
                  />
                  <button
                    type="button"
                    onClick={handleAddQuickVehicle}
                    className="px-4 py-2 bg-brand-600 text-white rounded-xl font-bold text-xs"
                  >
                    Save Vehicle
                  </button>
                </div>
              )}
            </div>

            {/* Step 2: Payment Method */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
              <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-brand-600" /> Payment Gateway (Razorpay Simulated)
              </h3>

              <div className="grid grid-cols-3 gap-3">
                {[
                  { id: 'UPI', label: 'UPI / GPay' },
                  { id: 'CARD', label: 'Credit/Debit Card' },
                  { id: 'NETBANKING', label: 'NetBanking' },
                ].map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setPaymentMethod(m.id as any)}
                    className={`p-3 rounded-2xl border text-center font-bold text-xs transition-all ${
                      paymentMethod === m.id
                        ? 'border-brand-500 bg-brand-50 text-brand-700 ring-2 ring-brand-500/20'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    {m.label}
                  </button>
                ))}
              </div>

              {paymentError && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" /> {paymentError}
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Price Breakdown & Coupon */}
          <div className="md:col-span-5 space-y-6">
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-lg space-y-6">
              <h3 className="font-extrabold text-slate-900 text-base border-b border-slate-100 pb-3">
                Price Calculation
              </h3>

              {/* Coupon Code input */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                  <Tag className="w-3.5 h-3.5 text-brand-600" /> Promo Code
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                    placeholder="Try PARK50 or WELCOME20"
                    className="flex-grow p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:ring-2 focus:ring-brand-500"
                  />
                  <button
                    type="button"
                    onClick={calculatePrice}
                    className="px-3.5 py-2.5 bg-slate-800 hover:bg-slate-900 text-white rounded-xl font-bold text-xs"
                  >
                    Apply
                  </button>
                </div>
              </div>

              {/* Price Breakdown items */}
              {pricingLoading ? (
                <div className="py-6 text-center text-slate-400 text-xs font-semibold animate-pulse">
                  Calculating final pricing...
                </div>
              ) : pricing ? (
                <div className="space-y-2.5 border-t border-slate-100 pt-3">
                  {pricing.breakdown?.map((b: any, idx: number) => (
                    <div key={idx} className="flex justify-between text-xs font-medium text-slate-600">
                      <span>{b.label}</span>
                      <span className={`font-bold ${b.amount < 0 ? 'text-emerald-600' : 'text-slate-800'}`}>
                        {b.amount < 0 ? `-₹${Math.abs(b.amount)}` : `₹${b.amount}`}
                      </span>
                    </div>
                  ))}

                  <div className="border-t border-slate-200 pt-3 flex justify-between items-center">
                    <div>
                      <span className="text-xs font-bold text-slate-400 block uppercase">Total Payable</span>
                      <span className="text-2xl font-black text-slate-900">₹{pricing.finalTotal}</span>
                    </div>
                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">
                      GST Included
                    </span>
                  </div>
                </div>
              ) : null}

              {/* Confirm & Pay CTA */}
              <button
                onClick={handleConfirmAndPay}
                disabled={isProcessingPayment || timeLeftSeconds <= 0}
                className="w-full py-4 bg-brand-600 hover:bg-brand-700 disabled:bg-slate-300 text-white font-extrabold rounded-2xl shadow-xl shadow-brand-600/30 flex items-center justify-center gap-2 text-sm transition-all hover:scale-[1.01]"
              >
                <Lock className="w-4 h-4" />
                {isProcessingPayment ? 'Creating Booking & Order...' : `Pay ₹${pricing?.finalTotal || ''} & Confirm`}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-slate-500">Loading Checkout...</div>}>
      <CheckoutPageContent />
    </Suspense>
  );
}
