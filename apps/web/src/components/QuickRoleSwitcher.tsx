'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { User, Building, ShieldCheck, Zap } from 'lucide-react';
import { api, setAuthToken } from '@/lib/api';

export const QuickRoleSwitcher: React.FC = () => {
  const router = useRouter();
  const [loadingRole, setLoadingRole] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  const handleQuickLogin = async (role: 'CUSTOMER' | 'OWNER' | 'ADMIN') => {
    setLoadingRole(role);
    const email =
      role === 'CUSTOMER'
        ? 'user@parkease.com'
        : role === 'OWNER'
        ? 'owner@parkease.com'
        : 'admin@parkease.com';

    try {
      const res = await api.login({ email, password: 'Password123' });
      if (res.success && res.data) {
        setAuthToken(res.data.token);
        localStorage.setItem('parkease_user', JSON.stringify(res.data.user));

        if (role === 'CUSTOMER') router.push('/search');
        else if (role === 'OWNER') router.push('/owner');
        else if (role === 'ADMIN') router.push('/admin');

        setTimeout(() => window.location.reload(), 300);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingRole(null);
    }
  };

  return (
    <div className="fixed bottom-5 right-5 z-50">
      {isOpen ? (
        <div className="bg-slate-900 text-white rounded-2xl shadow-2xl p-4 border border-slate-700 w-72 space-y-3 animate-in fade-in slide-in-from-bottom-5 duration-200">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <div className="flex items-center gap-1.5 font-bold text-xs text-brand-400 uppercase tracking-wider">
              <Zap className="w-4 h-4" /> 1-Click Role Switcher
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-slate-400 hover:text-white text-xs font-semibold px-2 py-0.5 rounded bg-slate-800"
            >
              Close
            </button>
          </div>
          <p className="text-[11px] text-slate-400">
            Instant demo sign-in to test end-to-end features without typing credentials.
          </p>

          <div className="space-y-2">
            <button
              onClick={() => handleQuickLogin('CUSTOMER')}
              disabled={loadingRole !== null}
              className="w-full flex items-center justify-between px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-semibold transition-all group"
            >
              <span className="flex items-center gap-2 text-emerald-400">
                <User className="w-4 h-4" /> Customer Role
              </span>
              <span className="text-[10px] bg-emerald-950 text-emerald-300 px-2 py-0.5 rounded border border-emerald-800">
                Search & Book
              </span>
            </button>

            <button
              onClick={() => handleQuickLogin('OWNER')}
              disabled={loadingRole !== null}
              className="w-full flex items-center justify-between px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-semibold transition-all group"
            >
              <span className="flex items-center gap-2 text-brand-400">
                <Building className="w-4 h-4" /> Parking Owner
              </span>
              <span className="text-[10px] bg-brand-950 text-brand-300 px-2 py-0.5 rounded border border-brand-800">
                Gate QR Scanner
              </span>
            </button>

            <button
              onClick={() => handleQuickLogin('ADMIN')}
              disabled={loadingRole !== null}
              className="w-full flex items-center justify-between px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-semibold transition-all group"
            >
              <span className="flex items-center gap-2 text-indigo-400">
                <ShieldCheck className="w-4 h-4" /> Platform Admin
              </span>
              <span className="text-[10px] bg-indigo-950 text-indigo-300 px-2 py-0.5 rounded border border-indigo-800">
                Approvals & GMV
              </span>
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setIsOpen(true)}
          className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-brand-400 px-4 py-2.5 rounded-full shadow-2xl border border-slate-700 text-xs font-bold transition-transform hover:scale-105"
        >
          <Zap className="w-4 h-4 text-brand-400 animate-pulse" />
          Demo Role Switcher
        </button>
      )}
    </div>
  );
};
