'use client';

import { useState } from 'react';
import { StockItem, GodownLocation } from '@/types/stock';
import { GODOWN_LOCATIONS } from '@/data/initialStock';
import { X, ArrowRightLeft, ArrowRight } from 'lucide-react';

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
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-sm">
      <div className="w-full max-w-md bg-[#121215] border border-zinc-800 rounded-t-2xl sm:rounded-2xl p-5 shadow-2xl relative">
        
        {/* Header */}
        <div className="flex items-start justify-between pb-3 border-b border-zinc-800">
          <div>
            <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-400 flex items-center gap-1">
              <ArrowRightLeft className="w-3 h-3" />
              Inter-Godown Transfer
            </span>
            <h2 className="text-base font-bold text-white mt-1.5 font-sans">
              {item.name}
            </h2>
            <p className="text-xs text-zinc-400 font-mono">
              Source: <strong className="text-white">{item.location}</strong> ({item.totalBags} bags available)
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-zinc-500 hover:text-white hover:bg-zinc-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          
          {/* Target Location */}
          <div>
            <label className="block text-[11px] font-mono uppercase tracking-wider text-zinc-400 mb-1.5">
              Destination Godown / Plant
            </label>
            <select
              value={targetLocation}
              onChange={(e) => setTargetLocation(e.target.value as GodownLocation)}
              className="w-full bg-[#09090b] border border-zinc-800 rounded-lg px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-white font-semibold"
            >
              {availableLocations.map((loc) => (
                <option key={loc} value={loc} className="bg-[#121215] text-white">
                  {loc}
                </option>
              ))}
            </select>
          </div>

          {/* Bags to Move */}
          <div>
            <label className="block text-[11px] font-mono uppercase tracking-wider text-zinc-400 mb-1.5">
              Bags to Move (Max: {item.totalBags})
            </label>
            <div className="relative">
              <input
                type="number"
                min="1"
                max={item.totalBags}
                value={bags}
                onChange={(e) => setBags(e.target.value === '' ? '' : Number(e.target.value))}
                placeholder="Enter bags"
                className="w-full bg-[#09090b] border border-zinc-800 rounded-lg px-3.5 py-2.5 text-xl font-mono font-bold text-white focus:outline-none focus:border-white tabular-nums"
              />
              <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-mono text-zinc-500 uppercase">
                BAGS (~{transferKg} KG)
              </span>
            </div>

            {/* Quick buttons */}
            <div className="flex items-center gap-1 mt-2">
              <span className="text-[10px] font-mono text-zinc-500 mr-1">PRESET:</span>
              {[1, 5, 10, 20, item.totalBags].map((b) => (
                <button
                  key={b}
                  type="button"
                  onClick={() => setBags(Math.min(b, item.totalBags))}
                  disabled={b > item.totalBags}
                  className="px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-[10px] font-mono font-bold text-zinc-400 hover:text-white disabled:opacity-30"
                >
                  {b === item.totalBags ? 'All' : `${b}b`}
                </button>
              ))}
            </div>
          </div>

          {/* Route Preview */}
          <div className="p-3 bg-[#09090b] rounded-lg border border-zinc-800 text-xs font-mono space-y-1.5">
            <div className="flex items-center justify-between font-bold text-white">
              <span>{item.location}</span>
              <ArrowRight className="w-3.5 h-3.5 text-zinc-500" />
              <span className="underline">{targetLocation}</span>
            </div>
            <div className="flex justify-between text-[11px] text-zinc-400 pt-1 border-t border-zinc-800">
              <span>Remaining at source:</span>
              <span className="font-bold text-white">{Math.max(0, item.totalBags - numBags)} bags</span>
            </div>
          </div>

          {/* Transport Note */}
          <div>
            <label className="block text-[11px] font-mono uppercase tracking-wider text-zinc-400 mb-1">
              Dispatch Reference / Vehicle (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g. Rickshaw #12, Handover to supervisor"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full bg-[#09090b] border border-zinc-800 rounded-lg px-3 py-2 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-white font-mono"
            />
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={numBags <= 0 || numBags > item.totalBags}
            className="w-full py-2.5 rounded-lg font-mono font-bold text-xs uppercase tracking-wider text-black bg-white hover:bg-zinc-200 transition-all flex items-center justify-center gap-1.5 disabled:opacity-40"
          >
            <ArrowRightLeft className="w-3.5 h-3.5" />
            <span>Execute Transfer ({numBags} Bags)</span>
          </button>
        </form>
      </div>
    </div>
  );
}
