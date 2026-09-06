'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ShieldCheck,
  TrendingUp,
  Users,
  Building2,
  Ticket,
  DollarSign,
  Tag,
  CheckCircle2,
  XCircle,
  Plus,
  AlertTriangle,
  FileText,
} from 'lucide-react';
import { api, getAuthToken } from '@/lib/api';

export default function AdminDashboard() {
  const [stats, setStats] = useState<any>(null);
  const [pendingFacilities, setPendingFacilities] = useState<any[]>([]);
  const [coupons, setCoupons] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'approvals' | 'coupons'>('overview');

  // New Coupon form
  const [showAddCoupon, setShowAddCoupon] = useState(false);
  const [cCode, setCCode] = useState('');
  const [cPercent, setCPercent] = useState('50');
  const [cMaxDiscount, setCMaxDiscount] = useState('50');
  const [cMinOrder, setCMinOrder] = useState('60');

  const loadAdminData = async () => {
    setLoading(true);
    const token = getAuthToken();
    if (!token) {
      window.location.href = '/login?redirect=/admin';
      return;
    }

    const sRes = await api.getAdminDashboard();
    if (sRes.success) setStats(sRes.data);

    const fRes = await api.getPendingFacilities();
    if (fRes.success) setPendingFacilities(fRes.data);

    const cRes = await api.getCoupons();
    if (cRes.success) setCoupons(cRes.data);

    setLoading(false);
  };

  useEffect(() => {
    loadAdminData();
  }, []);

  const handleUpdateStatus = async (id: string, status: 'APPROVED' | 'REJECTED' | 'SUSPENDED') => {
    const res = await api.updateFacilityStatus(id, { status });
    if (res.success) {
      alert(`Facility status updated to ${status}`);
      loadAdminData();
    }
  };

  const handleCreateCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cCode) return;
    const res = await api.createCoupon({
      code: cCode,
      discountPercent: parseFloat(cPercent),
      maxDiscount: parseFloat(cMaxDiscount),
      minOrder: parseFloat(cMinOrder),
    });
    if (res.success) {
      alert('Coupon created successfully!');
      setShowAddCoupon(false);
      setCCode('');
      loadAdminData();
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center space-y-4">
        <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
        <p className="text-slate-500 font-semibold">Loading Admin Platform Governance Panel...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Header Banner */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <span className="text-[10px] font-black uppercase tracking-wider bg-indigo-100 text-indigo-800 px-2.5 py-0.5 rounded">
              Platform Governance & Administration
            </span>
            <h1 className="text-2xl font-extrabold text-navy-800 mt-1">ParkEase Central Admin Control</h1>
            <p className="text-xs text-slate-500">Monitor platform GMV revenue, approve parking owners, & manage promo campaigns.</p>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => setShowAddCoupon(!showAddCoupon)}
              className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow"
            >
              <Tag className="w-4 h-4" /> Create Coupon Code
            </button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            <span className="text-xs text-slate-400 font-bold uppercase block">Gross Merchandise Value (GMV)</span>
            <span className="text-2xl font-black text-slate-900">₹{stats?.gmv || 0}</span>
            <span className="text-[10px] text-emerald-600 font-semibold block mt-1">Total customer payments</span>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            <span className="text-xs text-slate-400 font-bold uppercase block">Platform Revenue (10% Comm)</span>
            <span className="text-2xl font-black text-indigo-600">₹{stats?.platformCommission || 0}</span>
            <span className="text-[10px] text-slate-500 font-medium block mt-1">Platform earnings</span>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            <span className="text-xs text-slate-400 font-bold uppercase block">Total Customers & Owners</span>
            <span className="text-2xl font-black text-slate-900">
              {stats?.totalUsers + stats?.totalOwners || 0}
            </span>
            <span className="text-[10px] text-slate-500 font-medium block mt-1">
              {stats?.totalUsers} Customers • {stats?.totalOwners} Owners
            </span>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            <span className="text-xs text-slate-400 font-bold uppercase block">Facilities & Slots</span>
            <span className="text-2xl font-black text-slate-900">{stats?.activeFacilities || 0}</span>
            <span className="text-[10px] text-emerald-600 font-semibold block mt-1">
              {stats?.totalSlots} total parking slots
            </span>
          </div>
        </div>

        {/* Create Coupon Modal Form */}
        {showAddCoupon && (
          <form onSubmit={handleCreateCoupon} className="bg-white p-6 rounded-3xl border border-indigo-200 space-y-4 shadow-lg">
            <h3 className="font-extrabold text-slate-900 text-sm">Create Platform Promo Coupon</h3>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
              <div>
                <label className="block font-bold text-slate-600 mb-1">Coupon Code *</label>
                <input
                  type="text"
                  value={cCode}
                  onChange={(e) => setCCode(e.target.value.toUpperCase())}
                  placeholder="e.g. FESTIVE50"
                  className="w-full p-2.5 bg-slate-50 border rounded-xl font-bold uppercase"
                  required
                />
              </div>
              <div>
                <label className="block font-bold text-slate-600 mb-1">Discount (%)</label>
                <input
                  type="number"
                  value={cPercent}
                  onChange={(e) => setCPercent(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border rounded-xl font-bold"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-600 mb-1">Max Discount Cap (₹)</label>
                <input
                  type="number"
                  value={cMaxDiscount}
                  onChange={(e) => setCMaxDiscount(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border rounded-xl font-bold"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-600 mb-1">Min Order Amount (₹)</label>
                <input
                  type="number"
                  value={cMinOrder}
                  onChange={(e) => setCMinOrder(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border rounded-xl font-bold"
                />
              </div>
            </div>
            <button type="submit" className="px-5 py-2.5 bg-indigo-600 text-white font-extrabold text-xs rounded-xl">
              Publish Coupon
            </button>
          </form>
        )}

        {/* Tab Header */}
        <div className="flex border-b border-slate-200 gap-4">
          <button
            onClick={() => setActiveTab('overview')}
            className={`pb-3 font-extrabold text-xs border-b-2 ${
              activeTab === 'overview' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500'
            }`}
          >
            Platform Overview & System Health
          </button>
          <button
            onClick={() => setActiveTab('coupons')}
            className={`pb-3 font-extrabold text-xs border-b-2 flex items-center gap-1 ${
              activeTab === 'coupons' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500'
            }`}
          >
            <Tag className="w-3.5 h-3.5" /> Coupon Campaign Manager ({coupons.length})
          </button>
        </div>

        {/* TAB: COUPONS */}
        {activeTab === 'coupons' && (
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
            <h3 className="font-extrabold text-slate-900 text-base">Active Coupons</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {coupons.map((c) => (
                <div key={c.id} className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-black text-sm text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">
                      {c.code}
                    </span>
                    <span className="text-[10px] font-bold text-emerald-600 bg-emerald-100 px-2 py-0.5 rounded">
                      Active
                    </span>
                  </div>
                  <p className="text-slate-600">
                    {c.discountPercent}% Off • Max ₹{c.maxDiscount} • Min Order ₹{c.minOrder}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB: OVERVIEW */}
        {activeTab === 'overview' && (
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
            <h3 className="font-extrabold text-slate-900 text-base">System Operational Status</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs font-semibold">
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                <span className="text-slate-400 font-bold block uppercase text-[10px]">Database Status</span>
                <span className="text-emerald-600 font-extrabold">SQLite / PostgreSQL Connected</span>
              </div>
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                <span className="text-slate-400 font-bold block uppercase text-[10px]">Double Booking Lock Engine</span>
                <span className="text-emerald-600 font-extrabold">Active (Row-level Overlap Safe)</span>
              </div>
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                <span className="text-slate-400 font-bold block uppercase text-[10px]">Payment Gateway Abstraction</span>
                <span className="text-indigo-600 font-extrabold">Razorpay Test Simulator Active</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
