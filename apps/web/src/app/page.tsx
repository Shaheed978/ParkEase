'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Search,
  MapPin,
  Calendar,
  Clock,
  Navigation,
  ShieldCheck,
  Zap,
  CheckCircle2,
  Building2,
  ChevronRight,
  ArrowRight,
  HelpCircle,
  Car,
  ChevronDown,
} from 'lucide-react';

export default function LandingPage() {
  const router = useRouter();
  const [destination, setDestination] = useState('MG Road, Bengaluru');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [entryTime, setEntryTime] = useState('10:00');
  const [exitTime, setExitTime] = useState('13:00');
  const [isLocating, setIsLocating] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const query = encodeURIComponent(destination);
    router.push(`/search?query=${query}&date=${date}&entry=${entryTime}&exit=${exitTime}`);
  };

  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.');
      return;
    }
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setIsLocating(false);
        const { latitude, longitude } = pos.coords;
        router.push(
          `/search?lat=${latitude}&lng=${longitude}&date=${date}&entry=${entryTime}&exit=${exitTime}`
        );
      },
      (err) => {
        setIsLocating(false);
        alert('Could not access current location. Searching for default city center.');
        router.push(`/search?query=Bengaluru`);
      }
    );
  };

  const popularLocations = [
    { name: 'MG Road Metro Mall', city: 'Bengaluru', slots: '128 Available', price: '₹50/hr', query: 'MG Road' },
    { name: 'Forum Rex Walk', city: 'Brigade Road', slots: '94 Available', price: '₹60/hr', query: 'Brigade Road' },
    { name: 'Indiranagar 100ft Hub', city: 'Bengaluru', slots: '76 Available', price: '₹40/hr', query: 'Indiranagar' },
    { name: 'Mysuru Palace Gate 2', city: 'Mysuru', slots: '155 Available', price: '₹40/hr', query: 'Mysuru' },
    { name: 'Hitech Cyber Towers', city: 'Hyderabad', slots: '88 Available', price: '₹45/hr', query: 'Hyderabad' },
  ];

  const faqs = [
    {
      q: 'How does ParkEase guarantee my reserved parking slot?',
      a: 'ParkEase uses real-time double-booking protection and backend slot holds. When you select a slot, the system locks it for 10 minutes during payment. Once confirmed, no other customer can book that exact slot for your time window.',
    },
    {
      q: 'How do I enter the parking facility upon arrival?',
      a: 'After completing your booking, ParkEase generates a unique encrypted QR Code. Simply show or scan your QR code at the gate scanner (or to the parking attendant), and gate access is instantly validated.',
    },
    {
      q: 'Can I cancel my booking and get a refund?',
      a: 'Yes! You can cancel any upcoming booking from your dashboard. Cancellations made at least 2 hours before start time receive a 100% full refund.',
    },
    {
      q: 'What happens if I stay longer than my reserved time?',
      a: 'If your actual exit time exceeds your reserved window by more than 15 minutes, our system calculates overstay fees transparently at the exit scan based on the parking facility pricing policy.',
    },
  ];

  return (
    <div className="space-y-24 pb-16">
      {/* Hero Section */}
      <section className="relative pt-12 pb-20 md:pt-20 md:pb-32 overflow-hidden bg-gradient-to-b from-slate-900 via-navy-800 to-slate-900 text-white">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#10b981_1px,transparent_1px)] [background-size:24px_24px]"></div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center max-w-3xl mx-auto space-y-6">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-brand-500/10 border border-brand-500/30 text-brand-400 text-xs font-bold uppercase tracking-wider animate-bounce">
              <Zap className="w-4 h-4 fill-brand-400" /> Guaranteed Parking Before Arrival
            </div>

            <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-white leading-tight">
              Find parking <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-300">before you arrive.</span>
            </h1>

            <p className="text-lg text-slate-300 leading-relaxed font-normal">
              Skip circling the block. Search destination, select verified slots, pay securely, and scan your QR code at entry.
            </p>
          </div>

          {/* Search Box Component */}
          <div className="mt-10 max-w-4xl mx-auto bg-white rounded-3xl p-4 sm:p-6 shadow-2xl text-slate-900 border border-slate-200">
            <form onSubmit={handleSearch} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                {/* Destination Input */}
                <div className="md:col-span-2 space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                    <MapPin className="w-4 h-4 text-brand-600" /> Where are you going?
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={destination}
                      onChange={(e) => setDestination(e.target.value)}
                      placeholder="Enter city, landmark, or street name..."
                      className="w-full pl-4 pr-24 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500 focus:outline-none font-semibold text-slate-800 text-sm"
                      required
                    />
                    <button
                      type="button"
                      onClick={handleUseCurrentLocation}
                      disabled={isLocating}
                      className="absolute right-2 top-2 bottom-2 px-2.5 bg-brand-50 hover:bg-brand-100 text-brand-700 rounded-lg text-xs font-bold flex items-center gap-1 transition-colors border border-brand-200"
                    >
                      <Navigation className="w-3.5 h-3.5" />
                      {isLocating ? 'Locating...' : 'Near Me'}
                    </button>
                  </div>
                </div>

                {/* Date Input */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                    <Calendar className="w-4 h-4 text-brand-600" /> Date
                  </label>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full px-3 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500 focus:outline-none font-semibold text-slate-800 text-sm"
                  />
                </div>

                {/* Entry & Exit Time */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-brand-600" /> Time Window
                  </label>
                  <div className="grid grid-cols-2 gap-1">
                    <input
                      type="time"
                      value={entryTime}
                      onChange={(e) => setEntryTime(e.target.value)}
                      className="w-full px-2 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500 focus:outline-none font-semibold text-slate-800 text-xs"
                    />
                    <input
                      type="time"
                      value={exitTime}
                      onChange={(e) => setExitTime(e.target.value)}
                      className="w-full px-2 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500 focus:outline-none font-semibold text-slate-800 text-xs"
                    />
                  </div>
                </div>
              </div>

              {/* Submit CTA */}
              <button
                type="submit"
                className="w-full py-4 bg-gradient-to-r from-brand-600 to-emerald-500 hover:from-brand-700 hover:to-emerald-600 text-white font-extrabold rounded-2xl shadow-xl shadow-brand-600/30 flex items-center justify-center gap-2 text-base transition-all hover:scale-[1.01]"
              >
                <Search className="w-5 h-5 stroke-[2.5]" />
                Find Parking Now
              </button>
            </form>
          </div>
        </div>
      </section>

      {/* Popular Locations Carousel / Cards */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-end justify-between mb-8">
          <div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-navy-800">Popular Parking Hubs</h2>
            <p className="text-sm text-slate-500 mt-1">High-demand verified parking facilities near major landmarks</p>
          </div>
          <Link href="/search" className="text-sm font-bold text-brand-600 hover:text-brand-700 flex items-center gap-1">
            View All Locations <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {popularLocations.map((loc, idx) => (
            <Link
              key={idx}
              href={`/search?query=${encodeURIComponent(loc.query)}`}
              className="group p-4 bg-white rounded-2xl border border-slate-200 hover:border-brand-500 hover:shadow-lg transition-all"
            >
              <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
                <span className="font-semibold">{loc.city}</span>
                <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">{loc.slots}</span>
              </div>
              <h3 className="font-bold text-slate-900 text-sm group-hover:text-brand-600 transition-colors line-clamp-1">
                {loc.name}
              </h3>
              <div className="mt-4 flex items-center justify-between">
                <span className="text-sm font-extrabold text-slate-800">{loc.price}</span>
                <span className="text-xs font-bold text-brand-600 flex items-center gap-0.5">
                  Book <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                </span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* How It Works Section */}
      <section className="bg-slate-100/80 py-16 border-y border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto space-y-3 mb-12">
            <span className="text-xs font-bold uppercase tracking-wider text-brand-600">Simplicity First</span>
            <h2 className="text-3xl font-extrabold text-navy-800">How ParkEase Works in 4 Steps</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm relative">
              <div className="w-10 h-10 rounded-xl bg-brand-100 text-brand-700 flex items-center justify-center font-extrabold text-lg mb-4">
                1
              </div>
              <h3 className="font-bold text-slate-900 text-base mb-2">Search Location</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Enter your destination landmark or use browser GPS to see nearby parking options on an interactive map.
              </p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm relative">
              <div className="w-10 h-10 rounded-xl bg-brand-100 text-brand-700 flex items-center justify-center font-extrabold text-lg mb-4">
                2
              </div>
              <h3 className="font-bold text-slate-900 text-base mb-2">Choose Visual Slot</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Pick your preferred slot category (Regular, EV, Premium) on our interactive color-coded layout.
              </p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm relative">
              <div className="w-10 h-10 rounded-xl bg-brand-100 text-brand-700 flex items-center justify-center font-extrabold text-lg mb-4">
                3
              </div>
              <h3 className="font-bold text-slate-900 text-base mb-2">Pay & Hold</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                10-minute payment slot hold prevents double booking. Transparent breakdown with instant UPI/Razorpay.
              </p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm relative">
              <div className="w-10 h-10 rounded-xl bg-brand-100 text-brand-700 flex items-center justify-center font-extrabold text-lg mb-4">
                4
              </div>
              <h3 className="font-bold text-slate-900 text-base mb-2">Scan QR & Park</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Drive directly to your reserved slot. Show your digital QR code at gate check-in for seamless entry.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Why Choose ParkEase Features */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="p-8 rounded-3xl bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-200/80 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-lg shadow-emerald-600/20">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-navy-800">100% Concurrency Safe</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Our row-locking backend availability engine guarantees you never arrive at an already taken spot.
            </p>
          </div>

          <div className="p-8 rounded-3xl bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200/80 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-600 text-white flex items-center justify-center shadow-lg shadow-amber-600/20">
              <Zap className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-navy-800">EV Fast Charging Bays</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Filter parking facilities specifically equipped with high-speed EV chargers for your electric vehicles.
            </p>
          </div>

          <div className="p-8 rounded-3xl bg-gradient-to-br from-indigo-50 to-blue-50 border border-indigo-200/80 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-lg shadow-indigo-600/20">
              <Building2 className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-navy-800">For Facility Owners</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Monetize empty space. Easily register facilities, manage occupancy, configure pricing, and accept digital check-ins.
            </p>
          </div>
        </div>
      </section>

      {/* Partner CTA */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="rounded-3xl bg-navy-800 text-white p-8 sm:p-12 relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-8 border border-slate-700">
          <div className="space-y-4 max-w-xl">
            <span className="text-xs font-bold uppercase tracking-wider text-brand-400">Owner Partnership</span>
            <h2 className="text-3xl font-extrabold">Own a commercial parking lot or garage?</h2>
            <p className="text-sm text-slate-300 leading-relaxed">
              List your parking facility on ParkEase to start receiving instant pre-booked reservations, automated payouts, and real-time gate occupancy analytics.
            </p>
          </div>
          <Link
            href="/register?role=OWNER"
            className="px-6 py-3.5 bg-brand-600 hover:bg-brand-500 text-white font-extrabold rounded-xl shadow-xl shadow-brand-600/30 whitespace-nowrap transition-all"
          >
            Register Facility Now
          </Link>
        </div>
      </section>

      {/* FAQ Accordion */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="text-center space-y-2">
          <h2 className="text-3xl font-extrabold text-navy-800">Frequently Asked Questions</h2>
          <p className="text-sm text-slate-500">Everything you need to know about ParkEase reservations</p>
        </div>

        <div className="space-y-3">
          {faqs.map((faq, idx) => (
            <div key={idx} className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
              <button
                onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                className="w-full text-left p-5 font-bold text-slate-900 text-sm flex items-center justify-between hover:bg-slate-50"
              >
                <span>{faq.q}</span>
                <ChevronDown
                  className={`w-5 h-5 text-slate-400 transition-transform ${
                    openFaq === idx ? 'rotate-180 text-brand-600' : ''
                  }`}
                />
              </button>

              {openFaq === idx && (
                <div className="px-5 pb-5 text-xs text-slate-600 leading-relaxed border-t border-slate-100 pt-3">
                  {faq.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
