import React from 'react';

export default function PrivacyPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-12 space-y-6 text-slate-800">
      <h1 className="text-3xl font-extrabold text-navy-800">Privacy Policy</h1>
      <p className="text-xs text-slate-500">Last updated: September 2026</p>

      <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm space-y-4 text-xs leading-relaxed">
        <h2 className="text-base font-bold text-slate-900">Data Collection & Privacy</h2>
        <p>
          ParkEase collects necessary account credentials, vehicle registration numbers, and geolocation coordinates strictly for location-based parking discovery and gate check-in validation.
        </p>
        <p>
          We do not store plain-text passwords or full payment credit card numbers. All passwords use bcrypt hashing and payment tokens are processed via secure Razorpay gateways.
        </p>
      </div>
    </div>
  );
}
