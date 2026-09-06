'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Search,
  MapPin,
  Filter,
  SlidersHorizontal,
  Star,
  Zap,
  Shield,
  Clock,
  ArrowUpDown,
  List,
  Map as MapIcon,
  Navigation,
  Check,
  Calendar,
} from 'lucide-react';
import { api } from '@/lib/api';
import { LeafletMap } from '@/components/LeafletMap';

function SearchPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const initialQuery = searchParams.get('query') || '';
  const initialLat = searchParams.get('lat') || '';
  const initialLng = searchParams.get('lng') || '';
  const initialDate = searchParams.get('date') || new Date().toISOString().split('T')[0];
  const initialEntry = searchParams.get('entry') || '10:00';
  const initialExit = searchParams.get('exit') || '13:00';

  const [query, setQuery] = useState(initialQuery);
  const [date, setDate] = useState(initialDate);
  const [entryTime, setEntryTime] = useState(initialEntry);
  const [exitTime, setExitTime] = useState(initialExit);

  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedFacilityId, setSelectedFacilityId] = useState<string | undefined>(undefined);
  const [viewMode, setViewMode] = useState<'split' | 'list' | 'map'>('split');

  // Filters state
  const [showFilters, setShowFilters] = useState(false);
  const [radius, setRadius] = useState(15);
  const [sortBy, setSortBy] = useState('nearest');
  const [minRating, setMinRating] = useState(0);
  const [evOnly, setEvOnly] = useState(false);

  const fetchSearchResults = async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (query) params.set('query', query);
    if (initialLat) params.set('latitude', initialLat);
    if (initialLng) params.set('longitude', initialLng);
    params.set('radius', radius.toString());
    params.set('sortBy', sortBy);
    if (minRating > 0) params.set('rating', minRating.toString());
    if (evOnly) params.set('amenities', 'EV_CHARGING');

    const res = await api.searchParking(params.toString());
    if (res.success && res.data) {
      setResults(res.data);
      if (res.data.length > 0 && !selectedFacilityId) {
        setSelectedFacilityId(res.data[0].id);
      }
    } else {
      setResults([]);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchSearchResults();
  }, [query, radius, sortBy, minRating, evOnly]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchSearchResults();
  };

  const selectedFacility = results.find((r) => r.id === selectedFacilityId) || results[0];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Top Search Filter Bar */}
      <div className="bg-white border-b border-slate-200 sticky top-16 z-30 shadow-sm px-4 py-3">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row gap-3 items-center justify-between">
          <form onSubmit={handleSearchSubmit} className="flex-grow w-full md:w-auto flex items-center gap-2">
            <div className="relative flex-grow">
              <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search city, street, or landmark (e.g. MG Road, Indiranagar)..."
                className="w-full pl-9 pr-4 py-2.5 bg-slate-100 border border-slate-200 rounded-xl text-sm font-semibold focus:ring-2 focus:ring-brand-500 focus:outline-none"
              />
            </div>
            <button
              type="submit"
              className="px-4 py-2.5 bg-brand-600 hover:bg-brand-700 text-white font-bold rounded-xl text-sm transition-colors flex items-center gap-1"
            >
              <Search className="w-4 h-4" /> Search
            </button>
          </form>

          {/* Quick Controls */}
          <div className="flex items-center gap-2 w-full md:w-auto justify-between">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`px-3 py-2 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition-colors ${
                  showFilters ? 'bg-brand-50 text-brand-700 border-brand-300' : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                }`}
              >
                <SlidersHorizontal className="w-3.5 h-3.5" /> Filters
              </button>

              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none"
              >
                <option value="nearest">Sort: Nearest First</option>
                <option value="lowest_price">Sort: Lowest Price</option>
                <option value="highest_rating">Sort: Highest Rating</option>
                <option value="most_available">Sort: Most Available</option>
              </select>
            </div>

            {/* Mobile View Toggle */}
            <div className="md:hidden flex bg-slate-200 p-1 rounded-xl">
              <button
                onClick={() => setViewMode('list')}
                className={`px-3 py-1 rounded-lg text-xs font-bold ${
                  viewMode === 'list' ? 'bg-white text-slate-900 shadow' : 'text-slate-600'
                }`}
              >
                List
              </button>
              <button
                onClick={() => setViewMode('map')}
                className={`px-3 py-1 rounded-lg text-xs font-bold ${
                  viewMode === 'map' ? 'bg-white text-slate-900 shadow' : 'text-slate-600'
                }`}
              >
                Map
              </button>
            </div>
          </div>
        </div>

        {/* Filter Drawer */}
        {showFilters && (
          <div className="max-w-7xl mx-auto mt-3 pt-3 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs font-semibold text-slate-700 animate-in fade-in duration-150">
            <div>
              <label className="block text-slate-400 font-bold mb-1">Search Radius: {radius} km</label>
              <input
                type="range"
                min="1"
                max="50"
                value={radius}
                onChange={(e) => setRadius(parseInt(e.target.value))}
                className="w-full accent-brand-600"
              />
            </div>

            <div>
              <label className="block text-slate-400 font-bold mb-1">Minimum Rating</label>
              <div className="flex gap-2">
                {[0, 4.0, 4.5, 4.8].map((r) => (
                  <button
                    key={r}
                    onClick={() => setMinRating(r)}
                    className={`px-2.5 py-1 rounded-lg border font-bold ${
                      minRating === r ? 'bg-amber-500 text-white border-amber-600' : 'bg-slate-50 border-slate-200'
                    }`}
                  >
                    {r === 0 ? 'Any' : `${r}+ ⭐`}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={evOnly}
                  onChange={(e) => setEvOnly(e.target.checked)}
                  className="w-4 h-4 text-brand-600 rounded"
                />
                <span className="font-bold flex items-center gap-1 text-slate-800">
                  <Zap className="w-4 h-4 text-amber-500 fill-amber-500" /> EV Charging Station Only
                </span>
              </label>
            </div>
          </div>
        )}
      </div>

      {/* Main Two-Column Layout */}
      <div className="flex-grow max-w-7xl w-full mx-auto p-4 grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Left Column: Cards List */}
        <div
          className={`md:col-span-6 lg:col-span-7 space-y-4 overflow-y-auto max-h-[calc(100vh-140px)] pr-1 ${
            viewMode === 'map' ? 'hidden md:block' : 'block'
          }`}
        >
          <div className="flex items-center justify-between text-xs text-slate-500 px-1">
            <span>
              Found <strong className="text-slate-800 font-extrabold">{results.length}</strong> parking spots nearby
            </span>
            <span>Real-time backend availability</span>
          </div>

          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((n) => (
                <div key={n} className="h-44 bg-white rounded-2xl border border-slate-200 animate-pulse p-4"></div>
              ))}
            </div>
          ) : results.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-3">
              <MapPin className="w-12 h-12 text-slate-300 mx-auto" />
              <h3 className="text-lg font-bold text-slate-800">No parking facilities found</h3>
              <p className="text-xs text-slate-500">Try expanding your search radius or changing location search query.</p>
              <button
                onClick={() => {
                  setQuery('');
                  setRadius(30);
                }}
                className="px-4 py-2 bg-brand-600 text-white rounded-xl text-xs font-bold"
              >
                Reset Search Filters
              </button>
            </div>
          ) : (
            results.map((facility) => {
              const isSelected = facility.id === selectedFacilityId;
              const hasEv = facility.amenities?.includes('EV_CHARGING');

              return (
                <div
                  key={facility.id}
                  onClick={() => setSelectedFacilityId(facility.id)}
                  className={`bg-white rounded-2xl border transition-all p-4 cursor-pointer relative ${
                    isSelected
                      ? 'border-brand-500 ring-2 ring-brand-500/20 shadow-md'
                      : 'border-slate-200 hover:border-slate-300 hover:shadow-sm'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row gap-4">
                    {/* Thumbnail */}
                    <div className="w-full sm:w-36 h-28 rounded-xl bg-slate-100 overflow-hidden relative flex-shrink-0">
                      {facility.photos && facility.photos.length > 0 ? (
                        <img
                          src={facility.photos[0]}
                          alt={facility.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-400">
                          <MapPin className="w-6 h-6" />
                        </div>
                      )}
                      {facility.featured && (
                        <span className="absolute top-2 left-2 text-[9px] font-black uppercase tracking-wider bg-amber-500 text-white px-2 py-0.5 rounded shadow">
                          Featured
                        </span>
                      )}
                    </div>

                    {/* Details */}
                    <div className="flex-grow space-y-1.5">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-extrabold text-slate-900 text-base leading-snug hover:text-brand-600 transition-colors">
                            {facility.name}
                          </h3>
                          <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                            <MapPin className="w-3.5 h-3.5 text-slate-400" /> {facility.address}, {facility.city}
                          </p>
                        </div>
                        <span className="text-xs font-bold text-amber-600 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-lg flex items-center gap-1">
                          <Star className="w-3 h-3 fill-amber-500 text-amber-500" /> {facility.rating}
                        </span>
                      </div>

                      <div className="flex flex-wrap gap-2 text-xs font-semibold pt-1">
                        <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                          {facility.distance} km away
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded ${
                            facility.availableSlots > 0
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          {facility.availableSlots > 0 ? `${facility.availableSlots} Slots Available` : 'Full / Occupied'}
                        </span>
                        {hasEv && (
                          <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-800 flex items-center gap-1">
                            <Zap className="w-3 h-3 fill-amber-600" /> EV Ready
                          </span>
                        )}
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t border-slate-100 mt-2">
                        <div>
                          <span className="text-xs text-slate-400 font-semibold block">Starting Price</span>
                          <span className="text-lg font-black text-slate-900">₹{facility.startingPrice}</span>
                          <span className="text-xs text-slate-500 font-medium">/hr</span>
                        </div>

                        <Link
                          href={`/parking/${facility.id}?date=${date}&entry=${entryTime}&exit=${exitTime}`}
                          className="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs rounded-xl shadow transition-all hover:scale-105"
                        >
                          Select Slot & Book
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Right Column: Interactive Map Area */}
        <div
          className={`md:col-span-6 lg:col-span-5 h-[calc(100vh-140px)] sticky top-28 ${
            viewMode === 'list' ? 'hidden md:block' : 'block'
          }`}
        >
          <div className="w-full h-full rounded-2xl border border-slate-200 overflow-hidden shadow-lg relative">
            <LeafletMap
              locations={results.map((r) => ({
                id: r.id,
                name: r.name,
                latitude: r.latitude,
                longitude: r.longitude,
                startingPrice: r.startingPrice,
                availableSlots: r.availableSlots,
                rating: r.rating,
                address: r.address,
              }))}
              selectedId={selectedFacilityId}
              onSelectLocation={(id) => setSelectedFacilityId(id)}
              centerLat={selectedFacility ? selectedFacility.latitude : 12.9716}
              centerLng={selectedFacility ? selectedFacility.longitude : 77.5946}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-slate-500">Loading Search Results...</div>}>
      <SearchPageContent />
    </Suspense>
  );
}
