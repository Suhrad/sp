'use client';

import { useState } from 'react';
import { StockItem, GodownLocation } from '@/types/stock';
import { GODOWN_LOCATIONS } from '@/data/initialStock';
import { X, ArrowRightLeft, Building2, Package, ArrowRight } from 'lucide-react';

interface TransferModalProps {
  item: StockItem;
  onClose: () => void;
  onConfirm: (
    item: StockItem,
    targetLocation: GodownLocation,
    transferBags: number,
    transferKg: number,
    note: string
  ) => void;
}

export default function TransferModal({
  item,
  onClose,
  onConfirm,
}: TransferModalProps) {
  const availableLocations = GODOWN_LOCATIONS.filter(
    (loc) => loc !== 'All Locations' && loc !== item.location
  ) as GodownLocation[];

  const [targetLocation, setTargetLocation] = useState<GodownLocation>(
    availableLocations[0] || 'Godown 1'
  );
  const [bags, setBags] = useState<number | ''>(1);
  const [note, setNote] = useState('');

  const numBags = typeof bags === 'number' ? bags : 0;
  const transferKg = numBags * (item.avgKgPerBag || 25);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (numBags <= 0 || numBags > item.totalBags) return;
    onConfirm(item, targetLocation, numBags, transferKg, note.trim());
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-t-3xl sm:rounded-3xl p-5 sm:p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto">
        
        {/* Header */}
        <div className="flex items-start justify-between pb-3 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-1.5 text-blue-400 text-xs font-bold uppercase tracking-wider mb-1">
              <ArrowRightLeft className="w-4 h-4" />
              <span>Inter-Godown Transfer</span>
            </div>
            <h2 className="text-xl font-extrabold text-white">
              {item.name}
            </h2>
            <p className="text-xs text-slate-400">
              Current Location: <strong className="text-white">{item.location}</strong> ({item.totalBags} bags available)
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          
          {/* Target Location Selector */}
          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
              Transfer To Destination Godown
            </label>
            <select
              value={targetLocation}
              onChange={(e) => setTargetLocation(e.target.value as GodownLocation)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-semibold"
            >
              {availableLocations.map((loc) => (
                <option key={loc} value={loc} className="bg-slate-900 text-white">
                  {loc}
                </option>
              ))}
            </select>
          </div>

          {/* Transfer Quantity */}
          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
              Bags to Move (Max {item.totalBags})
            </label>
            <div className="relative">
              <input
                type="number"
                min="1"
                max={item.totalBags}
                value={bags}
                onChange={(e) => setBags(e.target.value === '' ? '' : Number(e.target.value))}
                placeholder="Enter bags to transfer"
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-2xl font-black text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 uppercase">
                BAGS (~{transferKg} KG)
              </span>
            </div>

            {/* Quick buttons */}
            <div className="flex items-center gap-1.5 mt-2">
              {[1, 5, 10, 20, item.totalBags].map((b) => (
                <button
                  key={b}
                  type="button"
                  onClick={() => setBags(Math.min(b, item.totalBags))}
                  disabled={b > item.totalBags}
                  className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-300 border border-slate-700/60 disabled:opacity-30"
                >
                  {b === item.totalBags ? 'All' : `${b} bags`}
                </button>
              ))}
            </div>
          </div>

          {/* Movement Flow Preview */}
          <div className="p-3 bg-slate-950/80 rounded-2xl border border-slate-800 text-xs space-y-2">
            <div className="flex items-center justify-between font-bold text-slate-300">
              <span>{item.location}</span>
              <ArrowRight className="w-4 h-4 text-blue-400" />
              <span className="text-blue-400">{targetLocation}</span>
            </div>
            <div className="flex justify-between text-[11px] text-slate-400 pt-1 border-t border-slate-800">
              <span>Source stock remaining:</span>
              <span className="font-bold text-white">{Math.max(0, item.totalBags - numBags)} bags</span>
            </div>
          </div>

          {/* Transfer Note */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1.5">
              Transfer Note / Vehicle / Driver
            </label>
            <input
              type="text"
              placeholder="e.g., Moved via Rickshaw/Truck by Ramu"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={numBags <= 0 || numBags > item.totalBags}
            className="w-full py-3.5 rounded-2xl font-black text-sm bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-600/25 transition-all flex items-center justify-center gap-2 disabled:opacity-40 disabled:pointer-events-none active:scale-98"
          >
            <ArrowRightLeft className="w-4 h-4" />
            <span>Confirm Transfer ({numBags} Bags)</span>
          </button>
        </form>
      </div>
    </div>
  );
}
