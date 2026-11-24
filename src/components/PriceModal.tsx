'use client';

import { useState } from 'react';
import { StockItem } from '@/types/stock';
import { X, IndianRupee, TrendingUp, TrendingDown, Clock, ArrowRight, Check } from 'lucide-react';

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
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-t-3xl sm:rounded-3xl p-5 sm:p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto">
        
        {/* Header */}
        <div className="flex items-start justify-between pb-3 border-b border-slate-800">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
              {item.location}
            </span>
            <h2 className="text-xl font-extrabold text-white mt-1">
              Update Rate / Price
            </h2>
            <p className="text-xs text-slate-400">
              {item.name} &bull; {item.kg.toLocaleString()} KG in stock
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
          
          {/* Price Overview Card */}
          <div className="grid grid-cols-2 gap-2 bg-slate-950 p-3 rounded-2xl border border-slate-800">
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Current Price
              </span>
              <div className="text-xl font-black text-white mt-0.5">
                ₹{item.currentPrice} <span className="text-xs font-normal text-slate-400">/kg</span>
              </div>
              {item.previousPrice !== null && (
                <span className="text-[10px] text-slate-500 block mt-0.5">
                  Previous: ₹{item.previousPrice}/kg
                </span>
              )}
            </div>

            <div className="border-l border-slate-800 pl-3">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Lot Valuation
              </span>
              <div className="text-xl font-black text-emerald-400 mt-0.5">
                ₹{oldTotalValue.toLocaleString('en-IN')}
              </div>
              <span className="text-[10px] text-slate-500 block mt-0.5">
                @ ₹{item.currentPrice} &times; {item.kg} kg
              </span>
            </div>
          </div>

          {/* New Price Input */}
          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
              New Price (₹ per KG)
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 font-bold">
                ₹
              </div>
              <input
                type="number"
                min="1"
                step="0.5"
                value={newPrice}
                onChange={(e) => setNewPrice(e.target.value === '' ? '' : Number(e.target.value))}
                placeholder="Enter new price"
                className="w-full bg-slate-950 border border-slate-700 rounded-2xl pl-9 pr-4 py-3 text-2xl font-black text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                autoFocus
              />
            </div>

            {/* Quick step adjustments */}
            <div className="flex items-center gap-1.5 mt-2">
              <span className="text-[11px] text-slate-500 mr-1">Adjust:</span>
              {[-5, -2, -1, 1, 2, 5].map((delta) => (
                <button
                  key={delta}
                  type="button"
                  onClick={() => setNewPrice(Math.max(1, (typeof newPrice === 'number' ? newPrice : item.currentPrice) + delta))}
                  className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-300 border border-slate-700/60"
                >
                  {delta > 0 ? `+₹${delta}` : `-₹${Math.abs(delta)}`}
                </button>
              ))}
            </div>
          </div>

          {/* Live Impact Preview */}
          {numPrice !== item.currentPrice && (
            <div className="p-3 bg-slate-950/80 rounded-2xl border border-slate-800 text-xs space-y-1.5">
              <span className="text-slate-400 font-semibold block">
                Price Change Comparison:
              </span>
              <div className="flex items-center justify-between font-bold">
                <div className="flex items-center gap-2">
                  <span className="text-slate-400">₹{item.currentPrice}/kg</span>
                  <ArrowRight className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-white text-sm">₹{numPrice}/kg</span>
                </div>
                <div className={`flex items-center ${priceDiff > 0 ? 'text-emerald-400' : 'text-blue-400'}`}>
                  {priceDiff > 0 ? <TrendingUp className="w-3.5 h-3.5 mr-1" /> : <TrendingDown className="w-3.5 h-3.5 mr-1" />}
                  <span>{priceDiff > 0 ? `+₹${priceDiff}` : `-₹${Math.abs(priceDiff)}`} ({percentDiff}%)</span>
                </div>
              </div>
              <div className="flex justify-between text-[11px] text-slate-400 pt-1 border-t border-slate-800">
                <span>Total Lot Valuation Change:</span>
                <span className={valueDiff >= 0 ? 'text-emerald-400 font-bold' : 'text-blue-400 font-bold'}>
                  {valueDiff >= 0 ? `+₹${valueDiff.toLocaleString('en-IN')}` : `-₹${Math.abs(valueDiff).toLocaleString('en-IN')}`}
                </span>
              </div>
            </div>
          )}

          {/* Note */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1.5">
              Reason for Price Update (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g., Raw material rate hike, Market price update"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {/* Past Price History List */}
          {item.priceHistory && item.priceHistory.length > 0 && (
            <div className="pt-2">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-slate-500" />
                Previous Price Revisions
              </span>
              <div className="space-y-1 max-h-28 overflow-y-auto pr-1">
                {item.priceHistory.slice(0, 4).map((h, i) => (
                  <div key={h.id || i} className="flex items-center justify-between text-[11px] bg-slate-950/50 px-2.5 py-1.5 rounded-lg border border-slate-800/60">
                    <span className="font-bold text-white">₹{h.price} / kg</span>
                    <span className="text-slate-400">{new Date(h.changedAt).toLocaleDateString()}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Confirm Button */}
          <button
            type="submit"
            disabled={typeof newPrice !== 'number' || newPrice <= 0 || newPrice === item.currentPrice}
            className="w-full py-3.5 rounded-2xl font-black text-sm bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-lg shadow-emerald-500/20 transition-all flex items-center justify-center gap-2 disabled:opacity-40 disabled:pointer-events-none active:scale-98"
          >
            <Check className="w-4 h-4 stroke-[3]" />
            <span>Save New Price (₹{numPrice}/kg)</span>
          </button>
        </form>
      </div>
    </div>
  );
}
