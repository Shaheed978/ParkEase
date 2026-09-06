'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  CheckCircle2,
  Navigation,
  Download,
  Calendar,
  Clock,
  Car,
  MapPin,
  QrCode,
  AlertTriangle,
  ArrowLeft,
  ChevronRight,
} from 'lucide-react';
import { api } from '@/lib/api';

export default function BookingConfirmationPage() {
  const params = useParams();
  const router = useRouter();
  const bookingId = params.id as string;

  const [booking, setBooking] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);

  const fetchBooking = async () => {
    setLoading(true);
    const res = await api.getBookingById(bookingId);
    if (res.success && res.data) {
      setBooking(res.data);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchBooking();
  }, [bookingId]);

  const handleCancelBooking = async () => {
    if (!confirm('Are you sure you want to cancel this booking? Refund policy will apply.')) return;
    setCancelling(true);
    const res = await api.cancelBooking(bookingId, { reason: 'User requested cancellation' });
    if (res.success) {
      alert(`Booking cancelled! Refund of ₹${res.data.refundAmount} (${res.data.refundPercent}%) processed.`);
      fetchBooking();
    } else {
      alert(res.message || 'Failed to cancel booking');
    }
    setCancelling(false);
  };

  if (loading || !booking) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center space-y-4">
        <div className="w-12 h-12 border-4 border-brand-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
        <p className="text-slate-500 font-semibold">Retrieving Digital Ticket & QR Code...</p>
      </div>
    );
  }

  const directionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${booking.facility.latitude},${booking.facility.longitude}`;

  return (
    <div className="min-h-screen bg-slate-50 py-10">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        {/* Header Confirmation Banner */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-md text-center space-y-3 relative overflow-hidden">
          <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto shadow-inner">
            <CheckCircle2 className="w-8 h-8" />
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold text-navy-800">Parking Booked Successfully!</h1>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Your slot is reserved. Present the digital QR code below at the gate check-in scanner upon arrival.
          </p>

          <div className="inline-block bg-slate-100 text-slate-800 px-4 py-1.5 rounded-xl font-mono text-sm font-extrabold border border-slate-200">
            Booking Ref: {booking.bookingCode}
          </div>
        </div>

        {/* Digital Ticket Card */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden divide-y divide-slate-100">
          {/* Top Ticket Info */}
          <div className="p-6 flex flex-col md:flex-row items-center justify-between gap-6 bg-gradient-to-br from-slate-900 via-navy-800 to-slate-900 text-white">
            <div className="space-y-2 text-center md:text-left">
              <span className="text-[10px] font-black uppercase tracking-wider text-brand-400 bg-brand-950 px-2 py-0.5 rounded border border-brand-800">
                Status: {booking.status}
              </span>
              <h2 className="text-xl font-extrabold text-white">{booking.facility.name}</h2>
              <p className="text-xs text-slate-300 flex items-center justify-center md:justify-start gap-1">
                <MapPin className="w-3.5 h-3.5 text-brand-400" /> {booking.facility.address}, {booking.facility.city}
              </p>
            </div>

            {/* QR Code Container */}
            <div className="bg-white p-3 rounded-2xl shadow-xl border-4 border-emerald-400 flex flex-col items-center">
              {booking.qrDataUrl ? (
                <img src={booking.qrDataUrl} alt="Booking QR Code" className="w-36 h-36 object-contain" />
              ) : (
                <QrCode className="w-32 h-32 text-slate-800" />
              )}
              <span className="text-[10px] font-bold text-slate-700 mt-1 uppercase tracking-wider">Gate Check-in Scan</span>
            </div>
          </div>

          {/* Ticket Details Grid */}
          <div className="p-6 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
            <div>
              <span className="text-slate-400 font-bold block uppercase text-[10px]">Reserved Slot</span>
              <span className="font-black text-slate-900 text-base text-brand-600">
                Slot {booking.slot.slotNumber} ({booking.slot.category})
              </span>
            </div>
            <div>
              <span className="text-slate-400 font-bold block uppercase text-[10px]">Vehicle Plate</span>
              <span className="font-bold text-slate-900 text-sm">{booking.vehicle.vehicleNumber}</span>
            </div>
            <div>
              <span className="text-slate-400 font-bold block uppercase text-[10px]">Entry Window</span>
              <span className="font-bold text-slate-900 text-sm">
                {new Date(booking.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
            <div>
              <span className="text-slate-400 font-bold block uppercase text-[10px]">Exit Window</span>
              <span className="font-bold text-slate-900 text-sm">
                {new Date(booking.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          </div>

          {/* Invoice Summary */}
          <div className="p-6 bg-slate-50 space-y-2 text-xs">
            <h4 className="font-extrabold text-slate-800 mb-2 uppercase tracking-wider text-[11px]">Payment Receipt</h4>
            <div className="flex justify-between text-slate-600">
              <span>Base Parking Amount</span>
              <span className="font-bold text-slate-800">₹{booking.basePrice}</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>Platform Fee & Tax</span>
              <span className="font-bold text-slate-800">₹{booking.platformFee + booking.taxAmount}</span>
            </div>
            {booking.discountAmount > 0 && (
              <div className="flex justify-between text-emerald-600 font-semibold">
                <span>Discount Applied</span>
                <span>-₹{booking.discountAmount}</span>
              </div>
            )}
            <div className="flex justify-between text-slate-900 font-black text-sm pt-2 border-t border-slate-200">
              <span>Total Paid</span>
              <span>₹{booking.totalAmount}</span>
            </div>
          </div>
        </div>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-3">
          <a
            href={directionsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 py-3.5 bg-brand-600 hover:bg-brand-700 text-white font-extrabold rounded-2xl shadow-md text-sm text-center flex items-center justify-center gap-2 transition-all"
          >
            <Navigation className="w-4 h-4" /> Get Directions on Map
          </a>

          <Link
            href="/dashboard"
            className="px-6 py-3.5 bg-slate-800 hover:bg-slate-900 text-white font-extrabold rounded-2xl text-sm text-center transition-all"
          >
            View Dashboard
          </Link>

          {booking.status === 'CONFIRMED' && (
            <button
              onClick={handleCancelBooking}
              disabled={cancelling}
              className="px-4 py-3.5 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold rounded-2xl text-xs border border-rose-200 transition-colors"
            >
              Cancel Booking
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
