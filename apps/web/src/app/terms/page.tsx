import React from 'react';
import Link from 'next/link';

export default function TermsPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-12 space-y-6 text-slate-800">
      <h1 className="text-3xl font-extrabold text-navy-800">Terms of Service & Cancellation Policy</h1>
      <p className="text-xs text-slate-500">Last updated: September 2026</p>

      <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm space-y-4 text-xs leading-relaxed">
        <h2 className="text-base font-bold text-slate-900">1. Booking & Slot Reservation Policy</h2>
        <p>
          ParkEase facilitates verified parking slot reservations. Once a slot is selected and held, you have 10 minutes to complete checkout payment.
        </p>

        <h2 className="text-base font-bold text-slate-900">2. Cancellation & Refund Policy</h2>
        <ul className="list-disc pl-5 space-y-1">
          <li><strong>More than 2 hours before booking start:</strong> 100% full refund to original payment source.</li>
          <li><strong>Between 1 and 2 hours before start:</strong> 50% partial refund.</li>
          <li><strong>Less than 1 hour before start:</strong> No refund applicable.</li>
        </ul>

        <h2 className="text-base font-bold text-slate-900">3. Overstay Policy</h2>
        <p>
          Vehicles remaining in the facility past their reserved exit window are subject to overstay fees calculated automatically upon gate check-out scan at 1.5x standard hourly rates.
        </p>
      </div>
    </div>
  );
}
