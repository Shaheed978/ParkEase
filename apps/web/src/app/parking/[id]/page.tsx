'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  MapPin,
  Star,
  Clock,
  Shield,
  Zap,
  CheckCircle2,
  Calendar,
  Navigation,
  Car,
  ChevronRight,
  User,
  Heart,
  Share2,
  Info,
  ArrowRight,
} from 'lucide-react';
import { api } from '@/lib/api';
import { SlotGrid } from '@/components/SlotGrid';

export default function ParkingDetailPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();

  const facilityId = params.id as string;
  const initialDate = searchParams.get('date') || new Date().toISOString().split('T')[0];
  const initialEntry = searchParams.get('entry') || '10:00';
  const initialExit = searchParams.get('exit') || '13:00';

  const [facility, setFacility] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedSlot, setSelectedSlot] = useState<any>(null);

  const [date, setDate] = useState(initialDate);
  const [entryTime, setEntryTime] = useState(initialEntry);
  const [exitTime, setExitTime] = useState(initialExit);
  const [isFavorite, setIsFavorite] = useState(false);

  const fetchFacility = async () => {
    setLoading(true);
    const startStr = `${date}T${entryTime}:00`;
    const endStr = `${date}T${exitTime}:00`;
    const res = await api.getFacilityDetails(facilityId, `startTime=${startStr}&endTime=${endStr}`);
    if (res.success && res.data) {
      setFacility(res.data);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchFacility();
  }, [facilityId, date, entryTime, exitTime]);

  const handleToggleFavorite = async () => {
    const res = await api.toggleFavorite({ facilityId });
    if (res.success) {
      setIsFavorite(res.data.isFavorite);
    }
  };

  const handleProceedToCheckout = () => {
    if (!selectedSlot) {
      alert('Please click and select an available parking slot first.');
      return;
    }
    const startStr = `${date}T${entryTime}`;
    const endStr = `${date}T${exitTime}`;
    router.push(
      `/checkout?facilityId=${facilityId}&slotId=${selectedSlot.id}&startTime=${startStr}&endTime=${endStr}`
    );
  };

  if (loading || !facility) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center space-y-4">
        <div className="w-12 h-12 border-4 border-brand-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
        <p className="text-slate-500 font-semibold">Loading Parking Facility Details & Real-Time Availability...</p>
      </div>
    );
  }

  const directionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${facility.latitude},${facility.longitude}`;

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      {/* Breadcrumb Header */}
      <div className="bg-white border-b border-slate-200 py-3">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between text-xs font-semibold text-slate-500">
          <div className="flex items-center gap-1.5">
            <Link href="/" className="hover:text-slate-900">Home</Link>
            <ChevronRight className="w-3.5 h-3.5" />
            <Link href="/search" className="hover:text-slate-900">Parking Search</Link>
            <ChevronRight className="w-3.5 h-3.5" />
            <span className="text-slate-900 font-bold truncate max-w-[200px]">{facility.name}</span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleToggleFavorite}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-lg border transition-colors ${
                isFavorite ? 'bg-rose-50 text-rose-600 border-rose-200' : 'bg-slate-50 text-slate-700 border-slate-200'
              }`}
            >
              <Heart className={`w-4 h-4 ${isFavorite ? 'fill-rose-500 text-rose-500' : ''}`} />
              {isFavorite ? 'Saved' : 'Save'}
            </button>
            <a
              href={directionsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-brand-600 hover:bg-brand-700 text-white font-bold rounded-lg shadow transition-colors"
            >
              <Navigation className="w-3.5 h-3.5" /> Get Directions
            </a>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 space-y-8">
        {/* Title & Info Banner */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 uppercase">
                  Verified Facility
                </span>
                <span className="text-xs font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded flex items-center gap-1">
                  <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" /> {facility.rating} ({facility.reviewCount} reviews)
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-navy-800">{facility.name}</h1>
              <p className="text-xs text-slate-500 flex items-center gap-1 mt-1 font-medium">
                <MapPin className="w-4 h-4 text-slate-400" /> {facility.address}, {facility.city}, {facility.state}
              </p>
            </div>

            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 flex items-center gap-6">
              <div>
                <span className="text-xs text-slate-400 font-bold block uppercase">Starting Price</span>
                <span className="text-2xl font-black text-slate-900">₹{facility.pricing?.hourlyRate || 40}</span>
                <span className="text-xs text-slate-500 font-medium">/hr</span>
              </div>
              <div className="h-8 w-px bg-slate-200"></div>
              <div>
                <span className="text-xs text-slate-400 font-bold block uppercase">Daily Max</span>
                <span className="text-lg font-extrabold text-slate-800">₹{facility.pricing?.dailyMaxRate || 300}</span>
              </div>
            </div>
          </div>

          {/* Photo Gallery Grid */}
          {facility.photos && facility.photos.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
              {facility.photos.map((photo: string, idx: number) => (
                <div key={idx} className="h-44 rounded-2xl overflow-hidden bg-slate-100">
                  <img src={photo} alt={`${facility.name} photo ${idx}`} className="w-full h-full object-cover" />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Main Grid: Left Slot Selection & Right Sidebar Summary */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
          {/* Left Column: Interactive Slot Grid & Rules */}
          <div className="md:col-span-8 space-y-8">
            {/* Time Window Selector Bar */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
              <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
                <Clock className="w-4 h-4 text-brand-600" /> Select Reservation Time Window
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div>
                  <label className="block text-slate-500 font-bold mb-1">Date</label>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-slate-500 font-bold mb-1">Entry Time</label>
                  <input
                    type="time"
                    value={entryTime}
                    onChange={(e) => setEntryTime(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-slate-500 font-bold mb-1">Exit Time</label>
                  <input
                    type="time"
                    value={exitTime}
                    onChange={(e) => setExitTime(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800"
                  />
                </div>
              </div>
            </div>

            {/* Interactive Visual Slot Matrix */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-extrabold text-slate-900 text-base">Select Parking Slot</h3>
                  <p className="text-xs text-slate-500">
                    Real-time slot availability for {date} ({entryTime} to {exitTime})
                  </p>
                </div>
                <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg">
                  {facility.availabilitySummary?.availableSlots || 0} Slots Free
                </span>
              </div>

              <SlotGrid
                slots={facility.slots || []}
                selectedSlotId={selectedSlot?.id}
                onSelectSlot={(slot) => setSelectedSlot(slot)}
              />
            </div>

            {/* Facility Amenities & Rules */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
              <h3 className="font-extrabold text-slate-900 text-base">Amenities & Facility Rules</h3>

              <div className="flex flex-wrap gap-2">
                {facility.amenities?.map((amenity: string, idx: number) => (
                  <span key={idx} className="px-3 py-1.5 rounded-xl bg-slate-100 text-slate-700 text-xs font-bold flex items-center gap-1.5 border border-slate-200">
                    <CheckCircle2 className="w-3.5 h-3.5 text-brand-600" /> {amenity.replace('_', ' ')}
                  </span>
                ))}
              </div>

              {facility.rules && (
                <div className="p-4 rounded-2xl bg-amber-50/80 border border-amber-200/80 text-xs text-amber-900 space-y-1">
                  <span className="font-bold block uppercase tracking-wider text-[10px] text-amber-700">Parking Rules & Regulations</span>
                  <p className="leading-relaxed">{facility.rules}</p>
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Reservation Action Card */}
          <div className="md:col-span-4 space-y-6">
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-lg sticky top-28 space-y-6">
              <h3 className="font-extrabold text-slate-900 text-base border-b border-slate-100 pb-3">
                Reservation Summary
              </h3>

              <div className="space-y-3 text-xs">
                <div className="flex justify-between py-1 text-slate-600">
                  <span>Selected Date</span>
                  <span className="font-bold text-slate-900">{date}</span>
                </div>
                <div className="flex justify-between py-1 text-slate-600">
                  <span>Time Window</span>
                  <span className="font-bold text-slate-900">{entryTime} - {exitTime}</span>
                </div>
                <div className="flex justify-between py-1 text-slate-600">
                  <span>Selected Slot</span>
                  <span className="font-bold text-brand-600 bg-brand-50 px-2 py-0.5 rounded">
                    {selectedSlot ? `Slot ${selectedSlot.slotNumber} (${selectedSlot.category})` : 'Click a slot on map'}
                  </span>
                </div>
                <div className="flex justify-between py-1 text-slate-600">
                  <span>Base Rate</span>
                  <span className="font-bold text-slate-900">₹{facility.pricing?.hourlyRate || 40}/hr</span>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs space-y-2">
                <div className="flex items-center gap-1.5 text-brand-700 font-bold">
                  <Shield className="w-4 h-4" /> 10-Minute Hold Guarantee
                </div>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  Proceeding to checkout holds your chosen slot on our server so no other driver can take it while you pay.
                </p>
              </div>

            </div>
          </div>
        </div>
      </div>

      {/* Mobile Bottom Floating Sticky Checkout Bar */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 p-4 bg-white/95 backdrop-blur-md border-t border-slate-200 shadow-2xl z-40 flex items-center justify-between gap-3">
        <div>
          <span className="text-[10px] uppercase font-bold text-slate-400 block">Selected Slot</span>
          <span className="text-sm font-extrabold text-brand-600 block truncate max-w-[140px]">
            {selectedSlot ? `Slot ${selectedSlot.slotNumber}` : 'Tap a Slot Above'}
          </span>
        </div>

        <button
          onClick={handleProceedToCheckout}
          disabled={!selectedSlot}
          className={`px-5 py-3 rounded-xl font-extrabold text-xs shadow-lg flex items-center gap-1.5 transition-all ${
            selectedSlot
              ? 'bg-brand-600 text-white shadow-brand-600/30'
              : 'bg-slate-200 text-slate-400 cursor-not-allowed'
          }`}
        >
          Checkout <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
