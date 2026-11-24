'use client';

import { useState } from 'react';
import { StockItem } from '@/types/stock';
import { X, ArrowRight, TrendingUp, TrendingDown, Clock, Check } from 'lucide-react';

interface PriceModalProps {
  item: StockItem;
  onClose: () => void;
  onConfirm: (item: StockItem, newPrice: number, note: string) => void;
}

export default function PriceModal({
  item,
  onClose,
  onConfirm,
}: PriceModalProps) {
  const [newPrice, setNewPrice] = useState<number | ''>(item.currentPrice);
  const [note, setNote] = useState('');

  const numPrice = typeof newPrice === 'number' ? newPrice : item.currentPrice;
  const priceDiff = numPrice - item.currentPrice;
  const percentDiff = item.currentPrice > 0 ? ((priceDiff / item.currentPrice) * 100).toFixed(1) : '0';

  const oldTotalValue = item.kg * item.currentPrice;
  const newTotalValue = item.kg * numPrice;
  const valueDiff = newTotalValue - oldTotalValue;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (typeof newPrice !== 'number' || newPrice <= 0) return;
    onConfirm(item, newPrice, note.trim());
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-sm">
      <div className="w-full max-w-md bg-[#121215] border border-zinc-800 rounded-t-2xl sm:rounded-2xl p-5 shadow-2xl relative">
        
        {/* Header */}
        <div className="flex items-start justify-between pb-3 border-b border-zinc-800">
          <div>
            <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-500 bg-zinc-900 px-2 py-0.5 rounded border border-zinc-800">
              {item.location}
            </span>
            <h2 className="text-base font-bold text-white mt-1.5 font-sans">
              Update Rate: {item.name}
            </h2>
            <p className="text-xs text-zinc-400 font-mono">
              Net inventory: {item.kg.toLocaleString()} KG
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
          
          {/* Overview */}
          <div className="grid grid-cols-2 gap-2 bg-[#09090b] p-3 rounded-lg border border-zinc-800 font-mono">
            <div>
              <span className="text-[10px] uppercase tracking-wider text-zinc-500 block">
                Current Rate
              </span>
              <div className="text-lg font-bold text-white mt-0.5 tabular-nums">
                ₹{item.currentPrice} <span className="text-xs font-normal text-zinc-500">/kg</span>
              </div>
              {item.previousPrice !== null && (
                <span className="text-[10px] text-zinc-500 block mt-0.5">
                  Previous: ₹{item.previousPrice}/kg
                </span>
              )}
            </div>

            <div className="border-l border-zinc-800 pl-3">
              <span className="text-[10px] uppercase tracking-wider text-zinc-500 block">
                Current Valuation
              </span>
              <div className="text-lg font-bold text-white mt-0.5 tabular-nums">
                ₹{oldTotalValue.toLocaleString('en-IN')}
              </div>
              <span className="text-[10px] text-zinc-500 block mt-0.5">
                {item.kg.toLocaleString()} kg
              </span>
            </div>
          </div>

          {/* New Price Input */}
          <div>
            <label className="block text-[11px] font-mono uppercase tracking-wider text-zinc-400 mb-1.5">
              New Rate (₹ per KG)
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-500 font-mono font-bold">
                ₹
              </div>
              <input
                type="number"
                min="1"
                step="0.5"
                value={newPrice}
                onChange={(e) => setNewPrice(e.target.value === '' ? '' : Number(e.target.value))}
                placeholder="Enter new rate"
                className="w-full bg-[#09090b] border border-zinc-800 rounded-lg pl-8 pr-4 py-2.5 text-xl font-mono font-bold text-white focus:outline-none focus:border-white tabular-nums"
                autoFocus
              />
            </div>

            {/* Quick +/- adjustments */}
            <div className="flex items-center gap-1 mt-2">
              <span className="text-[10px] font-mono text-zinc-500 mr-1">STEP:</span>
              {[-5, -2, -1, 1, 2, 5].map((delta) => (
                <button
                  key={delta}
                  type="button"
                  onClick={() => setNewPrice(Math.max(1, (typeof newPrice === 'number' ? newPrice : item.currentPrice) + delta))}
                  className="px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-[10px] font-mono font-bold text-zinc-400 hover:text-white"
                >
                  {delta > 0 ? `+${delta}` : delta}
                </button>
              ))}
            </div>
          </div>

          {/* Comparison */}
          {numPrice !== item.currentPrice && (
            <div className="p-3 bg-[#09090b] rounded-lg border border-zinc-800 text-xs font-mono space-y-1.5">
              <span className="text-zinc-500 text-[10px] uppercase block">
                Impact Calculation
              </span>
              <div className="flex items-center justify-between font-bold text-white">
                <div className="flex items-center gap-2">
                  <span className="text-zinc-500">₹{item.currentPrice}</span>
                  <ArrowRight className="w-3.5 h-3.5 text-zinc-400" />
                  <span className="text-white underline">₹{numPrice}/kg</span>
                </div>
                <div className="text-zinc-300">
                  {priceDiff > 0 ? `+₹${priceDiff}` : `-₹${Math.abs(priceDiff)}`} ({percentDiff}%)
                </div>
              </div>
              <div className="flex justify-between text-[11px] text-zinc-400 pt-1 border-t border-zinc-800">
                <span>Valuation Change:</span>
                <span className="text-white font-bold tabular-nums">
                  {valueDiff >= 0 ? `+₹${valueDiff.toLocaleString('en-IN')}` : `-₹${Math.abs(valueDiff).toLocaleString('en-IN')}`}
                </span>
              </div>
            </div>
          )}

          {/* Note */}
          <div>
            <label className="block text-[11px] font-mono uppercase tracking-wider text-zinc-400 mb-1">
              Revision Reason (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g. Market price hike, Supplier revision"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full bg-[#09090b] border border-zinc-800 rounded-lg px-3 py-2 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-white font-mono"
            />
          </div>

          {/* Past revisions */}
          {item.priceHistory && item.priceHistory.length > 0 && (
            <div className="pt-1">
              <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-500 block mb-1">
                Historical Revisions
              </span>
              <div className="space-y-1 max-h-24 overflow-y-auto">
                {item.priceHistory.slice(0, 3).map((h, i) => (
                  <div key={h.id || i} className="flex items-center justify-between text-[11px] font-mono bg-[#09090b] px-2.5 py-1 rounded border border-zinc-800/80">
                    <span className="font-bold text-white">₹{h.price}/kg</span>
                    <span className="text-zinc-500">{new Date(h.changedAt).toLocaleDateString()}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={typeof newPrice !== 'number' || newPrice <= 0 || newPrice === item.currentPrice}
            className="w-full py-2.5 rounded-lg font-mono font-bold text-xs uppercase tracking-wider text-black bg-white hover:bg-zinc-200 transition-all flex items-center justify-center gap-1.5 disabled:opacity-40"
          >
            <Check className="w-3.5 h-3.5" />
            <span>Commit New Rate (₹{numPrice}/kg)</span>
          </button>
        </form>
      </div>
    </div>
  );
}
