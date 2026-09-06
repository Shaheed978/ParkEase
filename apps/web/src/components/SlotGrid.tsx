'use client';

import React from 'react';
import { Zap, Shield, Accessibility, Car, Lock } from 'lucide-react';

interface SlotItem {
  id: string;
  slotNumber: string;
  floor: string;
  section: string;
  vehicleType: string;
  category: string;
  priceModifier: number;
  computedStatus: 'AVAILABLE' | 'HELD' | 'RESERVED' | 'OCCUPIED' | 'MAINTENANCE' | 'BLOCKED';
}

interface SlotGridProps {
  slots: SlotItem[];
  selectedSlotId?: string;
  onSelectSlot: (slot: SlotItem) => void;
}

export const SlotGrid: React.FC<SlotGridProps> = ({ slots, selectedSlotId, onSelectSlot }) => {
  // Group slots by floor or section
  const floors = Array.from(new Set(slots.map((s) => s.floor || 'G')));

  const getSlotBadgeClass = (status: string, isSelected: boolean) => {
    if (isSelected) {
      return 'bg-brand-600 text-white ring-4 ring-brand-400/50 shadow-lg scale-105 z-10 font-black';
    }
    switch (status) {
      case 'AVAILABLE':
        return 'bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-500 hover:text-white hover:border-emerald-600 shadow-sm cursor-pointer';
      case 'HELD':
        return 'bg-amber-100 text-amber-800 border-amber-300 cursor-not-allowed opacity-80';
      case 'RESERVED':
        return 'bg-indigo-100 text-indigo-800 border-indigo-300 cursor-not-allowed opacity-80';
      case 'OCCUPIED':
        return 'bg-rose-100 text-rose-800 border-rose-300 cursor-not-allowed opacity-80';
      case 'MAINTENANCE':
        return 'bg-slate-200 text-slate-600 border-slate-300 cursor-not-allowed opacity-60';
      default:
        return 'bg-slate-100 text-slate-500 border-slate-200 cursor-not-allowed';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'EV':
        return <Zap className="w-3 h-3 text-amber-500" />;
      case 'PREMIUM':
        return <Shield className="w-3 h-3 text-indigo-500" />;
      case 'DISABLED':
        return <Accessibility className="w-3 h-3 text-blue-500" />;
      default:
        return <Car className="w-3 h-3 text-slate-400" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Legend */}
      <div className="flex flex-wrap items-center gap-3 text-xs font-semibold text-slate-600 p-3 bg-slate-50 rounded-xl border border-slate-200">
        <span className="font-bold text-slate-800">Legend:</span>
        <div className="flex items-center gap-1.5">
          <span className="w-3.5 h-3.5 rounded bg-emerald-500 inline-block"></span> Available
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3.5 h-3.5 rounded bg-brand-600 ring-2 ring-brand-400 inline-block"></span> Selected
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3.5 h-3.5 rounded bg-indigo-500 inline-block"></span> Reserved
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3.5 h-3.5 rounded bg-rose-500 inline-block"></span> Occupied
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3.5 h-3.5 rounded bg-amber-500 inline-block"></span> Held (Payment Pending)
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3.5 h-3.5 rounded bg-slate-400 inline-block"></span> Maintenance
        </div>
      </div>

      {/* Grid Floor by Floor */}
      {floors.map((floor) => {
        const floorSlots = slots.filter((s) => (s.floor || 'G') === floor);
        return (
          <div key={floor} className="space-y-3">
            <h4 className="text-xs font-bold uppercase text-slate-400 tracking-wider flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-brand-500"></span> Floor {floor} Slot Layout
            </h4>

            <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-6 gap-3">
              {floorSlots.map((slot) => {
                const isSelected = slot.id === selectedSlotId;
                const isAvailable = slot.computedStatus === 'AVAILABLE';

                return (
                  <button
                    key={slot.id}
                    disabled={!isAvailable}
                    onClick={() => onSelectSlot(slot)}
                    className={`relative p-3 rounded-xl border flex flex-col items-center justify-center transition-all duration-200 ${getSlotBadgeClass(
                      slot.computedStatus,
                      isSelected
                    )}`}
                  >
                    <div className="flex items-center gap-1">
                      {getCategoryIcon(slot.category)}
                      <span className="font-bold text-sm">{slot.slotNumber}</span>
                    </div>

                    <span className="text-[10px] mt-0.5 opacity-80 uppercase font-semibold">
                      {slot.category === 'EV' ? 'EV Slot' : slot.category === 'PREMIUM' ? '+₹20 Prem' : slot.category}
                    </span>

                    {!isAvailable && (
                      <span className="text-[9px] uppercase font-bold mt-1 px-1.5 py-0.2 rounded bg-black/10">
                        {slot.computedStatus}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
};
