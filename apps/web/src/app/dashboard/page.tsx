'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Ticket,
  Car,
  Heart,
  Bell,
  HelpCircle,
  Plus,
  Trash2,
  CheckCircle2,
  Clock,
  MapPin,
  QrCode,
  Zap,
  ChevronRight,
  Star,
} from 'lucide-react';
import { api, getAuthToken } from '@/lib/api';

export default function CustomerDashboard() {
  const [activeTab, setActiveTab] = useState<'bookings' | 'vehicles' | 'favorites' | 'tickets' | 'notifications'>('bookings');
  const [user, setUser] = useState<any>(null);
  const [bookings, setBookings] = useState<any[]>([]);
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [favorites, setFavorites] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // New vehicle form state
  const [showAddVehicle, setShowAddVehicle] = useState(false);
  const [vPlate, setVPlate] = useState('');
  const [vBrand, setVBrand] = useState('Tata');
  const [vType, setVType] = useState('FOUR_WHEELER');
  const [isEv, setIsEv] = useState(false);

  // New ticket form state
  const [showAddTicket, setShowAddTicket] = useState(false);
  const [tSubject, setTSubject] = useState('');
  const [tDesc, setTDesc] = useState('');

  const loadData = async () => {
    setLoading(true);
    const token = getAuthToken();
    if (!token) {
      window.location.href = '/login';
      return;
    }

    const meRes = await api.getMe();
    if (meRes.success) setUser(meRes.data);

    const bRes = await api.getMyBookings();
    if (bRes.success) setBookings(bRes.data);

    const vRes = await api.getVehicles();
    if (vRes.success) setVehicles(vRes.data);

    const fRes = await api.getFavorites();
    if (fRes.success) setFavorites(fRes.data);

    const nRes = await api.getNotifications();
    if (nRes.success) setNotifications(nRes.data.notifications || []);

    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleAddVehicle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!vPlate) return;
    const res = await api.addVehicle({
      vehicleNumber: vPlate,
      vehicleType: vType,
      brand: vBrand,
      isEv,
      isDefault: vehicles.length === 0,
    });
    if (res.success) {
      setVPlate('');
      setShowAddVehicle(false);
      loadData();
    }
  };

  const handleDeleteVehicle = async (id: string) => {
    if (!confirm('Remove this vehicle plate?')) return;
    await api.deleteVehicle(id);
    loadData();
  };

  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tSubject || !tDesc) return;
    const res = await api.createTicket({ subject: tSubject, description: tDesc });
    if (res.success) {
      alert('Support ticket created successfully!');
      setShowAddTicket(false);
      setTSubject('');
      setTDesc('');
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center space-y-4">
        <div className="w-12 h-12 border-4 border-brand-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
        <p className="text-slate-500 font-semibold">Loading Customer Dashboard...</p>
      </div>
    );
  }

  const activeBookings = bookings.filter((b) => b.status === 'CONFIRMED' || b.status === 'ACTIVE');
  const pastBookings = bookings.filter((b) => b.status !== 'CONFIRMED' && b.status !== 'ACTIVE');

  return (
    <div className="min-h-screen bg-slate-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* User Welcome Card */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-brand-600 text-white font-extrabold text-2xl flex items-center justify-center shadow-lg shadow-brand-600/20">
              {user?.name?.charAt(0) || 'U'}
            </div>
            <div>
              <h1 className="text-2xl font-extrabold text-navy-800">Welcome, {user?.name}!</h1>
              <p className="text-xs text-slate-500">{user?.email} • Customer Portal</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/search"
              className="px-5 py-2.5 bg-brand-600 hover:bg-brand-700 text-white font-bold rounded-xl text-xs shadow transition-all"
            >
              + Find & Book Parking
            </Link>
          </div>
        </div>

        {/* Dashboard Tabs Header */}
        <div className="flex border-b border-slate-200 overflow-x-auto gap-2">
          {[
            { id: 'bookings', label: 'My Bookings', icon: Ticket, badge: activeBookings.length },
            { id: 'vehicles', label: 'Saved Vehicles', icon: Car, badge: vehicles.length },
            { id: 'favorites', label: 'Favorite Spots', icon: Heart, badge: favorites.length },
            { id: 'notifications', label: 'Notifications', icon: Bell, badge: notifications.length },
            { id: 'tickets', label: 'Support Tickets', icon: HelpCircle },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-4 py-3 border-b-2 font-extrabold text-xs flex items-center gap-2 transition-all whitespace-nowrap ${
                  isActive
                    ? 'border-brand-600 text-brand-600 bg-white rounded-t-xl'
                    : 'border-transparent text-slate-500 hover:text-slate-900'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
                {tab.badge !== undefined && tab.badge > 0 && (
                  <span
                    className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${
                      isActive ? 'bg-brand-100 text-brand-700' : 'bg-slate-200 text-slate-600'
                    }`}
                  >
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* TAB 1: BOOKINGS */}
        {activeTab === 'bookings' && (
          <div className="space-y-6">
            {/* Active Bookings Section */}
            <div className="space-y-3">
              <h3 className="font-extrabold text-slate-900 text-base">Active & Upcoming Reservations</h3>
              {activeBookings.length === 0 ? (
                <div className="bg-white p-8 rounded-2xl border border-slate-200 text-center space-y-2">
                  <p className="text-xs text-slate-500">No active parking reservations.</p>
                  <Link href="/search" className="inline-block text-xs font-bold text-brand-600">
                    Book a slot now →
                  </Link>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {activeBookings.map((b) => (
                    <div key={b.id} className="bg-white rounded-2xl border border-brand-200 p-5 shadow-sm space-y-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <span className="text-[10px] font-black uppercase bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded">
                            {b.status}
                          </span>
                          <h4 className="font-extrabold text-slate-900 text-base mt-1">{b.facility.name}</h4>
                          <p className="text-xs text-slate-500">{b.facility.address}</p>
                        </div>
                        <span className="font-black text-brand-600 text-lg">
                          Slot {b.slot.slotNumber}
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-xs text-slate-600 pt-2 border-t border-slate-100">
                        <span>Plate: <strong>{b.vehicle.vehicleNumber}</strong></span>
                        <span>Paid: <strong>₹{b.totalAmount}</strong></span>
                      </div>

                      <Link
                        href={`/booking/${b.id}`}
                        className="w-full py-2.5 bg-brand-600 hover:bg-brand-700 text-white font-bold rounded-xl text-xs text-center flex items-center justify-center gap-1.5"
                      >
                        <QrCode className="w-4 h-4" /> View Digital QR Ticket
                      </Link>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Past History */}
            <div className="space-y-3 pt-4">
              <h3 className="font-extrabold text-slate-900 text-base">Booking History</h3>
              <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px]">
                    <tr>
                      <th className="p-3">Ref Code</th>
                      <th className="p-3">Facility</th>
                      <th className="p-3">Slot</th>
                      <th className="p-3">Amount</th>
                      <th className="p-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-semibold text-slate-800">
                    {pastBookings.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="p-4 text-center text-slate-400">
                          No past bookings found.
                        </td>
                      </tr>
                    ) : (
                      pastBookings.map((b) => (
                        <tr key={b.id}>
                          <td className="p-3 font-mono">{b.bookingCode}</td>
                          <td className="p-3">{b.facility.name}</td>
                          <td className="p-3">{b.slot.slotNumber}</td>
                          <td className="p-3">₹{b.totalAmount}</td>
                          <td className="p-3">
                            <span className="px-2 py-0.5 rounded text-[10px] uppercase font-bold bg-slate-100 text-slate-600">
                              {b.status}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: VEHICLES */}
        {activeTab === 'vehicles' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-extrabold text-slate-900 text-base">My Registered Vehicles</h3>
              <button
                onClick={() => setShowAddVehicle(!showAddVehicle)}
                className="px-3.5 py-2 bg-brand-600 text-white rounded-xl font-bold text-xs flex items-center gap-1"
              >
                <Plus className="w-4 h-4" /> Add Vehicle
              </button>
            </div>

            {showAddVehicle && (
              <form onSubmit={handleAddVehicle} className="bg-white p-5 rounded-2xl border border-slate-200 space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div>
                    <label className="block font-bold text-slate-600 mb-1">Registration Plate Number *</label>
                    <input
                      type="text"
                      value={vPlate}
                      onChange={(e) => setVPlate(e.target.value)}
                      placeholder="e.g. KA-01-MJ-4050"
                      className="w-full p-2.5 bg-slate-50 border rounded-xl font-bold uppercase"
                      required
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-600 mb-1">Vehicle Type</label>
                    <select
                      value={vType}
                      onChange={(e) => setVType(e.target.value)}
                      className="w-full p-2.5 bg-slate-50 border rounded-xl font-bold"
                    >
                      <option value="FOUR_WHEELER">Four-Wheeler Car</option>
                      <option value="TWO_WHEELER">Two-Wheeler Bike</option>
                      <option value="EV">EV Electric Vehicle</option>
                    </select>
                  </div>
                  <div>
                    <label className="block font-bold text-slate-600 mb-1">Brand Name</label>
                    <input
                      type="text"
                      value={vBrand}
                      onChange={(e) => setVBrand(e.target.value)}
                      className="w-full p-2.5 bg-slate-50 border rounded-xl font-bold"
                    />
                  </div>
                </div>
                <button type="submit" className="px-4 py-2 bg-slate-900 text-white font-bold text-xs rounded-xl">
                  Save Vehicle Plate
                </button>
              </form>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {vehicles.map((v) => (
                <div key={v.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex justify-between items-center">
                  <div>
                    <span className="font-extrabold text-slate-900 text-base block">{v.vehicleNumber}</span>
                    <span className="text-xs text-slate-500">{v.brand} • {v.vehicleType}</span>
                  </div>
                  <button
                    onClick={() => handleDeleteVehicle(v.id)}
                    className="p-2 text-rose-600 hover:bg-rose-50 rounded-lg"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 3: FAVORITES */}
        {activeTab === 'favorites' && (
          <div className="space-y-4">
            <h3 className="font-extrabold text-slate-900 text-base">Favorite Saved Parking Hubs</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {favorites.map((f) => (
                <div key={f.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-2">
                  <h4 className="font-extrabold text-slate-900 text-sm">{f.facility.name}</h4>
                  <p className="text-xs text-slate-500">{f.facility.address}</p>
                  <Link
                    href={`/parking/${f.facility.id}`}
                    className="inline-block text-xs font-bold text-brand-600 pt-2"
                  >
                    Book Slot Now →
                  </Link>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 4: NOTIFICATIONS */}
        {activeTab === 'notifications' && (
          <div className="space-y-3">
            <h3 className="font-extrabold text-slate-900 text-base">Recent Notifications</h3>
            <div className="bg-white rounded-2xl border border-slate-200 divide-y divide-slate-100">
              {notifications.map((n) => (
                <div key={n.id} className="p-4 text-xs space-y-1">
                  <span className="font-bold text-slate-900 block">{n.title}</span>
                  <p className="text-slate-600">{n.message}</p>
                  <span className="text-[10px] text-slate-400 block pt-1">{new Date(n.createdAt).toLocaleString()}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 5: TICKETS */}
        {activeTab === 'tickets' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-extrabold text-slate-900 text-base">Customer Support Tickets</h3>
              <button
                onClick={() => setShowAddTicket(!showAddTicket)}
                className="px-3.5 py-2 bg-brand-600 text-white rounded-xl font-bold text-xs flex items-center gap-1"
              >
                <Plus className="w-4 h-4" /> Create Support Ticket
              </button>
            </div>

            {showAddTicket && (
              <form onSubmit={handleCreateTicket} className="bg-white p-5 rounded-2xl border border-slate-200 space-y-3">
                <input
                  type="text"
                  value={tSubject}
                  onChange={(e) => setTSubject(e.target.value)}
                  placeholder="Ticket Subject..."
                  className="w-full p-2.5 bg-slate-50 border rounded-xl text-xs font-bold"
                  required
                />
                <textarea
                  value={tDesc}
                  onChange={(e) => setTDesc(e.target.value)}
                  placeholder="Describe your issue or query..."
                  className="w-full p-2.5 bg-slate-50 border rounded-xl text-xs font-medium h-24"
                  required
                />
                <button type="submit" className="px-4 py-2 bg-slate-900 text-white font-bold text-xs rounded-xl">
                  Submit Ticket
                </button>
              </form>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
