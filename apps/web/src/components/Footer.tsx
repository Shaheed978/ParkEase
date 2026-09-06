'use client';

import React from 'react';
import Link from 'next/link';
import { Car, ShieldCheck, MapPin, Phone, Mail, Award } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-navy-800 text-slate-300 pt-16 pb-12 border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 pb-12 border-b border-slate-800">
          {/* Brand Col */}
          <div className="space-y-4">
            <Link href="/" className="flex items-center space-x-2.5">
              <div className="w-9 h-9 rounded-xl bg-brand-500 flex items-center justify-center text-white font-bold">
                <Car className="w-5 h-5 stroke-[2.5]" />
              </div>
              <span className="text-2xl font-extrabold tracking-tight text-white">
                Park<span className="text-brand-500">Ease</span>
              </span>
            </Link>
            <p className="text-sm text-slate-400 leading-relaxed">
              Find, reserve, and park at nearby verified locations in seconds. Concurrency-safe slot guarantees, real-time availability, and instant QR gate access.
            </p>
            <div className="flex items-center space-x-3 text-xs text-brand-400 font-semibold bg-brand-950/60 border border-brand-800/50 px-3 py-2 rounded-lg w-fit">
              <Award className="w-4 h-4 text-brand-400" />
              Startup-Quality Smart Parking Platform
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-white font-bold text-sm uppercase tracking-wider mb-4">Discovery</h4>
            <ul className="space-y-2.5 text-sm text-slate-400">
              <li>
                <Link href="/search?query=MG+Road" className="hover:text-white transition-colors">
                  Parking in MG Road, Bengaluru
                </Link>
              </li>
              <li>
                <Link href="/search?query=Indiranagar" className="hover:text-white transition-colors">
                  Parking in Indiranagar
                </Link>
              </li>
              <li>
                <Link href="/search?query=Koramangala" className="hover:text-white transition-colors">
                  Parking in Koramangala
                </Link>
              </li>
              <li>
                <Link href="/search?query=Mysuru" className="hover:text-white transition-colors">
                  Parking in Mysuru
                </Link>
              </li>
              <li>
                <Link href="/search?query=Hyderabad" className="hover:text-white transition-colors">
                  Parking in Hyderabad Hitech City
                </Link>
              </li>
            </ul>
          </div>

          {/* Solutions */}
          <div>
            <h4 className="text-white font-bold text-sm uppercase tracking-wider mb-4">Partners & Portal</h4>
            <ul className="space-y-2.5 text-sm text-slate-400">
              <li>
                <Link href="/owner" className="hover:text-white transition-colors">
                  Parking Owner Dashboard
                </Link>
              </li>
              <li>
                <Link href="/admin" className="hover:text-white transition-colors">
                  Platform Admin Governance
                </Link>
              </li>
              <li>
                <Link href="/register?role=OWNER" className="hover:text-white transition-colors">
                  Partner With Us (Facility Registration)
                </Link>
              </li>
              <li>
                <Link href="/dashboard" className="hover:text-white transition-colors">
                  Gate Operator QR Scanner
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact & Policy */}
          <div>
            <h4 className="text-white font-bold text-sm uppercase tracking-wider mb-4">Policies & Support</h4>
            <ul className="space-y-2.5 text-sm text-slate-400">
              <li>
                <Link href="/terms" className="hover:text-white transition-colors">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="hover:text-white transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/terms" className="hover:text-white transition-colors">
                  Cancellation & Refund Policy
                </Link>
              </li>
              <li className="pt-2 text-xs text-slate-500 flex items-center gap-2">
                <Mail className="w-4 h-4 text-brand-500" /> support@parkease.com
              </li>
              <li className="text-xs text-slate-500 flex items-center gap-2">
                <Phone className="w-4 h-4 text-brand-500" /> +91 1800-PARK-EASE
              </li>
            </ul>
          </div>
        </div>

        <div className="pt-8 flex flex-col md:flex-row items-center justify-between text-xs text-slate-500">
          <p>© {new Date().getFullYear()} ParkEase Platforms Inc. All rights reserved. "Find. Book. Park."</p>
          <div className="flex space-x-6 mt-4 md:mt-0">
            <span>Built with Next.js, Express & Prisma</span>
            <span>PostgreSQL & Leaflet Maps</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
