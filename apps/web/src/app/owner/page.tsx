'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Building,
  QrCode,
  Plus,
  BarChart3,
  TrendingUp,
  Car,
  CheckCircle2,
  AlertCircle,
  Clock,
  Layers,
  Sparkles,
  Search,
} from 'lucide-react';
import { api, getAuthToken } from '@/lib/api';

export default function OwnerDashboard() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'facilities' | 'scanner'>('overview');

  // Gate Scanner state
  const [qrInput, setQrInput] = useState('');
  const [scanResult, setScanResult] = useState<any>(null);
  const [scanMessage, setScanMessage] = useState<string | null>(null);

  // New Facility Form State
  const [showAddFacility, setShowAddFacility] = useState(false);
  const [selectedFacilityId, setSelectedFacilityId] = useState('');
  const [slotPrefix, setSlotPrefix] = useState('B');
  const [slotCount, setSlotCount] = useState(20);

  const [fName, setFName] = useState('');
  const [fDesc, setFDesc] = useState('');
  const [fAddress, setFAddress] = useState('');
  const [fCity, setFCity] = useState('Bengaluru');
  const [fState, setFState] = useState('Karnataka');
  const [fZip, setFZip] = useState('560001');
  const [fLat, setFLat] = useState('12.9756');
  const [fLng, setFLng] = useState('77.6066');
  const [fOpen, setFOpen] = useState('06:00 AM');
  const [fClose, setFClose] = useState('11:00 PM');
  const [fIs247, setFIs247] = useState(true);
  const [fRate, setFRate] = useState('50');
  const [fMaxRate, setFMaxRate] = useState('350');
  const [fRules, setFRules] = useState('Keep vehicle locked. EV charging for electric vehicles only.');
  const [fPhotos, setFPhotos] = useState('https://images.unsplash.com/photo-1506521781263-d8422e82f27a?auto=format&fit=crop&w=800&q=80');
  const [fAmenities, setFAmenities] = useState<string[]>(['CCTV', 'Security', 'Covered', 'EV_CHARGING', '24/7']);
  const [autoGenCount, setAutoGenCount] = useState(25);

  const loadOwnerData = async () => {
    setLoading(true);
    const res = await api.getOwnerDashboard();
    if (res.success && res.data) {
      setData(res.data);
      if (res.data.ownerInfo?.facilities?.length > 0 && !selectedFacilityId) {
        setSelectedFacilityId(res.data.ownerInfo.facilities[0].id);
      }
    }
    setLoading(false);
  };

  useEffect(() => {
    loadOwnerData();
  }, []);

  const handleGateCheckIn = async () => {
    if (!qrInput) return;
    setScanMessage('Validating QR entry...');
    const res = await api.operatorCheckIn({ bookingCode: qrInput });
    if (res.success && res.data) {
      setScanResult(res.data);
      setScanMessage('✅ Gate Entry Approved! Barrier open.');
    } else {
      setScanMessage(`❌ Gate Entry Denied: ${res.message}`);
    }
  };

  const handleGateCheckOut = async () => {
    if (!qrInput) return;
    setScanMessage('Validating QR exit...');
    const res = await api.operatorCheckOut({ bookingCode: qrInput });
    if (res.success && res.data) {
      setScanResult(res.data);
      setScanMessage('✅ Gate Exit Approved! Barrier open.');
    } else {
      setScanMessage(`❌ Gate Exit Failed: ${res.message}`);
    }
  };

  // Toggle amenity selection
  const handleToggleAmenity = (amenityKey: string) => {
    if (fAmenities.includes(amenityKey)) {
      setFAmenities(fAmenities.filter((a) => a !== amenityKey));
    } else {
      setFAmenities([...fAmenities, amenityKey]);
    }
  };

  const handleCreateFacility = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fName || !fAddress || !fCity) {
      alert('Please fill in facility name, address, and city.');
      return;
    }

    const photoList = fPhotos.split(',').map((p) => p.trim()).filter(Boolean);

    const res = await api.createFacility({
      name: fName,
      description: fDesc || 'Modern parking facility with 24/7 access.',
      address: fAddress,
      city: fCity,
      state: fState,
      zipCode: fZip,
      latitude: parseFloat(fLat),
      longitude: parseFloat(fLng),
      openingTime: fOpen,
      closingTime: fClose,
      is247: fIs247,
      rules: fRules,
      photos: photoList,
      amenities: fAmenities,
      hourlyRate: parseFloat(fRate),
      dailyMaxRate: parseFloat(fMaxRate),
    });

    if (res.success && res.data) {
      const newFacilityId = res.data.id;
      // Auto-generate initial slots for facility
      if (autoGenCount > 0) {
        await api.bulkGenerateSlots(newFacilityId, {
          prefix: 'A',
          count: autoGenCount,
        });
      }

      alert(`🎉 Parking Facility "${fName}" created successfully with ${autoGenCount} slots!`);
      setShowAddFacility(false);
      // Reset form
      setFName('');
      setFAddress('');
      loadOwnerData();
    } else {
      alert(`Failed to create facility: ${res.message}`);
    }
  };

  const handleBulkGenerate = async () => {
    if (!selectedFacilityId) return;
    const res = await api.bulkGenerateSlots(selectedFacilityId, {
      prefix: slotPrefix,
      count: slotCount,
    });
    if (res.success) {
      alert(`Generated ${slotCount} slots for facility!`);
      loadOwnerData();
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center space-y-4">
        <div className="w-12 h-12 border-4 border-brand-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
        <p className="text-slate-500 font-semibold">Loading Parking Owner Management Portal...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Header */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <span className="text-[10px] font-black uppercase tracking-wider bg-brand-100 text-brand-800 px-2.5 py-0.5 rounded">
              Owner Management Portal
            </span>
            <h1 className="text-2xl font-extrabold text-navy-800 mt-1">
              {data?.ownerInfo?.businessName || 'Owner Portal'}
            </h1>
            <p className="text-xs text-slate-500">Live facility occupancy, revenue analytics, and gate QR check-ins.</p>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab('scanner')}
              className="px-4 py-2.5 bg-brand-600 hover:bg-brand-700 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow"
            >
              <QrCode className="w-4 h-4" /> Open Gate QR Scanner
            </button>
            <button
              onClick={() => setShowAddFacility(!showAddFacility)}
              className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" /> Add Facility
            </button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            <span className="text-xs text-slate-400 font-bold uppercase block">Today's Revenue</span>
            <span className="text-2xl font-black text-slate-900">₹{data?.todayRevenue || 0}</span>
            <span className="text-[10px] text-emerald-600 font-semibold block mt-1">+{data?.todayBookingsCount || 0} bookings today</span>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            <span className="text-xs text-slate-400 font-bold uppercase block">Total Gross Revenue</span>
            <span className="text-2xl font-black text-slate-900">₹{data?.totalRevenue || 0}</span>
            <span className="text-[10px] text-slate-400 font-medium block mt-1">All time bookings</span>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            <span className="text-xs text-slate-400 font-bold uppercase block">Occupancy Rate</span>
            <span className="text-2xl font-black text-brand-600">{data?.occupancyRate || 0}%</span>
            <span className="text-[10px] text-slate-500 font-medium block mt-1">
              {data?.activeOccupiedSlots} / {data?.totalSlots} slots filled
            </span>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            <span className="text-xs text-slate-400 font-bold uppercase block">Total Facilities</span>
            <span className="text-2xl font-black text-slate-900">{data?.facilitiesCount || 0}</span>
            <span className="text-[10px] text-emerald-600 font-semibold block mt-1">Status: Approved</span>
          </div>
        </div>

        {/* Add Facility Form */}
        {showAddFacility && (
          <form onSubmit={handleCreateFacility} className="bg-white p-6 sm:p-8 rounded-3xl border border-brand-200 space-y-5 shadow-xl animate-in fade-in duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-extrabold text-slate-900 text-base flex items-center gap-2">
                  <Building className="w-5 h-5 text-brand-600" /> Register New Parking Facility
                </h3>
                <p className="text-xs text-slate-500">Configure address, geo-location, pricing, amenities, and initial slots.</p>
              </div>
              <button
                type="button"
                onClick={() => setShowAddFacility(false)}
                className="text-xs font-bold text-slate-400 hover:text-slate-700 px-3 py-1 bg-slate-100 rounded-lg"
              >
                Close
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs font-semibold">
              <div className="sm:col-span-2">
                <label className="block text-slate-700 mb-1">Facility Name *</label>
                <input
                  type="text"
                  value={fName}
                  onChange={(e) => setFName(e.target.value)}
                  placeholder="e.g. Brigade Road Central Multi-Level Garage"
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold focus:ring-2 focus:ring-brand-500"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-700 mb-1">Hourly Base Rate (₹) *</label>
                <input
                  type="number"
                  value={fRate}
                  onChange={(e) => setFRate(e.target.value)}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold focus:ring-2 focus:ring-brand-500"
                  required
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-slate-700 mb-1">Street Address *</label>
                <input
                  type="text"
                  value={fAddress}
                  onChange={(e) => setFAddress(e.target.value)}
                  placeholder="e.g. 100 Feet Road, HAL 2nd Stage, Indiranagar"
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold focus:ring-2 focus:ring-brand-500"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-700 mb-1">Daily Max Rate Cap (₹)</label>
                <input
                  type="number"
                  value={fMaxRate}
                  onChange={(e) => setFMaxRate(e.target.value)}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold focus:ring-2 focus:ring-brand-500"
                />
              </div>

              <div>
                <label className="block text-slate-700 mb-1">City *</label>
                <input
                  type="text"
                  value={fCity}
                  onChange={(e) => setFCity(e.target.value)}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-700 mb-1">State</label>
                <input
                  type="text"
                  value={fState}
                  onChange={(e) => setFState(e.target.value)}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold"
                />
              </div>

              <div>
                <label className="block text-slate-700 mb-1">Pincode</label>
                <input
                  type="text"
                  value={fZip}
                  onChange={(e) => setFZip(e.target.value)}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold"
                />
              </div>

              <div>
                <label className="block text-slate-700 mb-1">Latitude Coordinate</label>
                <input
                  type="text"
                  value={fLat}
                  onChange={(e) => setFLat(e.target.value)}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold"
                />
              </div>

              <div>
                <label className="block text-slate-700 mb-1">Longitude Coordinate</label>
                <input
                  type="text"
                  value={fLng}
                  onChange={(e) => setFLng(e.target.value)}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold"
                />
              </div>

              <div>
                <label className="block text-slate-700 mb-1">Auto-Generate Slots Count</label>
                <input
                  type="number"
                  value={autoGenCount}
                  onChange={(e) => setAutoGenCount(parseInt(e.target.value) || 0)}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold"
                />
              </div>

              <div className="sm:col-span-3">
                <label className="block text-slate-700 mb-1">Description</label>
                <input
                  type="text"
                  value={fDesc}
                  onChange={(e) => setFDesc(e.target.value)}
                  placeholder="e.g. Modern covered multi-story parking deck near metro station"
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-medium"
                />
              </div>
            </div>

            {/* Amenities Checkboxes */}
            <div className="space-y-2 pt-1 border-t border-slate-100">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">Facility Amenities & Features</label>
              <div className="flex flex-wrap gap-2">
                {[
                  { id: 'CCTV', label: 'CCTV Surveillance' },
                  { id: 'Security', label: 'Security Guard' },
                  { id: 'Covered', label: 'Covered Roof' },
                  { id: 'EV_CHARGING', label: 'EV Charger Bays' },
                  { id: 'Valet', label: 'Valet Parking' },
                  { id: 'Restroom', label: 'Restroom Facilities' },
                  { id: 'Accessible', label: 'Disabled Access' },
                  { id: '24/7', label: '24/7 Gate Access' },
                ].map((item) => {
                  const isChecked = fAmenities.includes(item.id);
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => handleToggleAmenity(item.id)}
                      className={`px-3 py-1.5 rounded-xl border text-xs font-bold transition-colors ${
                        isChecked
                          ? 'bg-brand-600 text-white border-brand-600'
                          : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {isChecked ? '✓ ' : '+ '}{item.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowAddFacility(false)}
                className="px-5 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-2xl"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-6 py-3 bg-brand-600 hover:bg-brand-700 text-white font-extrabold text-xs rounded-2xl shadow-lg shadow-brand-600/30 transition-all hover:scale-105"
              >
                Create & Publish Facility
              </button>
            </div>
          </form>
        )}

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-200 gap-4">
          <button
            onClick={() => setActiveTab('overview')}
            className={`pb-3 font-extrabold text-xs border-b-2 ${
              activeTab === 'overview' ? 'border-brand-600 text-brand-600' : 'border-transparent text-slate-500'
            }`}
          >
            Live Reservations & Occupancy
          </button>
          <button
            onClick={() => setActiveTab('scanner')}
            className={`pb-3 font-extrabold text-xs border-b-2 flex items-center gap-1 ${
              activeTab === 'scanner' ? 'border-brand-600 text-brand-600' : 'border-transparent text-slate-500'
            }`}
          >
            <QrCode className="w-3.5 h-3.5" /> Gate Operator QR Scanner
          </button>
          <button
            onClick={() => setActiveTab('facilities')}
            className={`pb-3 font-extrabold text-xs border-b-2 ${
              activeTab === 'facilities' ? 'border-brand-600 text-brand-600' : 'border-transparent text-slate-500'
            }`}
          >
            Bulk Slot Matrix Builder
          </button>
        </div>

        {/* SECTION: GATE SCANNER OPERATOR PORTAL */}
        {activeTab === 'scanner' && (
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-md max-w-2xl mx-auto space-y-6">
            <div className="text-center space-y-1">
              <div className="w-12 h-12 bg-brand-100 text-brand-600 rounded-2xl flex items-center justify-center mx-auto">
                <QrCode className="w-6 h-6" />
              </div>
              <h3 className="font-extrabold text-slate-900 text-lg">Gate Check-in / Check-out Scanner</h3>
              <p className="text-xs text-slate-500">Scan customer QR Code or type Booking Ref Code (e.g. PE-2026-ACTIVE01)</p>
            </div>

            <div className="space-y-3">
              <input
                type="text"
                value={qrInput}
                onChange={(e) => setQrInput(e.target.value)}
                placeholder="Paste QR Token payload or Booking Code..."
                className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-2xl font-mono text-xs font-bold focus:ring-2 focus:ring-brand-500"
              />

              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={handleGateCheckIn}
                  className="py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl shadow"
                >
                  Allow Gate Entry (Mark Active)
                </button>

                <button
                  onClick={handleGateCheckOut}
                  className="py-3.5 bg-slate-800 hover:bg-slate-900 text-white font-extrabold text-xs rounded-xl shadow"
                >
                  Mark Gate Exit (Check Out)
                </button>
              </div>
            </div>

            {scanMessage && (
              <div className="p-4 rounded-2xl bg-slate-100 border border-slate-200 text-xs font-bold text-slate-800">
                {scanMessage}
              </div>
            )}

            {scanResult && (
              <div className="p-4 rounded-2xl bg-brand-50 border border-brand-200 text-xs space-y-2">
                <h4 className="font-bold text-brand-900">Validated Booking Record:</h4>
                <div className="grid grid-cols-2 gap-2 text-slate-700 font-semibold">
                  <div>Ref Code: <strong className="text-slate-900">{scanResult.bookingCode}</strong></div>
                  <div>Slot: <strong className="text-slate-900">{scanResult.slotNumber}</strong></div>
                  <div>Customer: <strong className="text-slate-900">{scanResult.customerName}</strong></div>
                  <div>Vehicle: <strong className="text-slate-900">{scanResult.vehicleNumber}</strong></div>
                  {scanResult.overstayFee > 0 && (
                    <div className="col-span-2 text-rose-600 font-bold pt-1">
                      ⚠️ Overstay Fee Penalty Charged: ₹{scanResult.overstayFee} ({scanResult.overstayMinutes} mins overstay)
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* SECTION: LIVE RESERVATIONS */}
        {activeTab === 'overview' && (
          <div className="bg-white rounded-3xl border border-slate-200 p-6 space-y-4 shadow-sm">
            <h3 className="font-extrabold text-slate-900 text-base">Recent Facility Bookings</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px]">
                  <tr>
                    <th className="p-3">Booking Code</th>
                    <th className="p-3">Facility</th>
                    <th className="p-3">Slot</th>
                    <th className="p-3">Customer</th>
                    <th className="p-3">Vehicle</th>
                    <th className="p-3">Total Paid</th>
                    <th className="p-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-semibold text-slate-800">
                  {data?.recentBookings?.map((b: any) => (
                    <tr key={b.id}>
                      <td className="p-3 font-mono">{b.bookingCode}</td>
                      <td className="p-3">{b.facility?.name}</td>
                      <td className="p-3">{b.slot?.slotNumber}</td>
                      <td className="p-3">{b.user?.name}</td>
                      <td className="p-3">{b.vehicle?.vehicleNumber}</td>
                      <td className="p-3 font-extrabold text-slate-900">₹{b.totalAmount}</td>
                      <td className="p-3">
                        <span className="px-2 py-0.5 rounded text-[10px] uppercase font-bold bg-emerald-100 text-emerald-800">
                          {b.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* SECTION: BULK SLOT BUILDER */}
        {activeTab === 'facilities' && (
          <div className="bg-white p-6 rounded-3xl border border-slate-200 space-y-4 shadow-sm max-w-xl">
            <h3 className="font-extrabold text-slate-900 text-base">Bulk Slot Matrix Generator</h3>
            <p className="text-xs text-slate-500">Generate 20+ slots automatically for your facility (e.g. Prefix B01-B20).</p>

            <div className="space-y-3 text-xs font-semibold">
              <div>
                <label className="block text-slate-600 mb-1">Select Facility</label>
                <select
                  value={selectedFacilityId}
                  onChange={(e) => setSelectedFacilityId(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border rounded-xl font-bold"
                >
                  {data?.ownerInfo?.facilities?.map((f: any) => (
                    <option key={f.id} value={f.id}>{f.name} ({f.slots?.length || 0} slots)</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 mb-1">Section Prefix</label>
                  <input
                    type="text"
                    value={slotPrefix}
                    onChange={(e) => setSlotPrefix(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border rounded-xl font-bold"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 mb-1">Number of Slots</label>
                  <input
                    type="number"
                    value={slotCount}
                    onChange={(e) => setSlotCount(parseInt(e.target.value))}
                    className="w-full p-2.5 bg-slate-50 border rounded-xl font-bold"
                  />
                </div>
              </div>

              <button
                onClick={handleBulkGenerate}
                className="w-full py-3 bg-brand-600 hover:bg-brand-700 text-white font-extrabold rounded-xl text-xs shadow"
              >
                Generate Slots Now
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
