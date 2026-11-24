'use client';

import { useState } from 'react';
import { StockItem } from '@/types/stock';
import { X, Plus, Minus, ArrowRight, Package, Scale, FileText } from 'lucide-react';

interface AdjustModalProps {
  item: StockItem;
  initialPlus: boolean;
  onClose: () => void;
  onConfirm: (
    item: StockItem,
    deltaBags: number,
    deltaKg: number,
    reason: string
  ) => void;
}

export default function AdjustModal({
  item,
  initialPlus,
  onClose,
  onConfirm,
}: AdjustModalProps) {
  const [isPlus, setIsPlus] = useState(initialPlus);
  const [mode, setMode] = useState<'bags' | 'kg'>(item.isBulk ? 'kg' : 'bags');
  const [qty, setQty] = useState<number | ''>(1);
  const [reason, setReason] = useState<string>('');

  const numQty = typeof qty === 'number' ? qty : 0;

  // Calculate resulting bags and kgs
  let deltaBags = 0;
  let deltaKg = 0;

  if (mode === 'bags') {
    deltaBags = isPlus ? numQty : -numQty;
    deltaKg = deltaBags * (item.avgKgPerBag || 25);
  } else {
    deltaKg = isPlus ? numQty : -numQty;
    deltaBags = item.avgKgPerBag > 0 ? Math.round(deltaKg / item.avgKgPerBag) : 0;
  }

  const resultBags = Math.max(0, item.totalBags + deltaBags);
  const resultKg = Math.max(0, item.kg + deltaKg);

  const presets = mode === 'bags' ? [1, 5, 10, 20, 50] : [25, 50, 100, 250, 500];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!numQty || numQty <= 0) return;
    onConfirm(item, deltaBags, deltaKg, reason.trim() || (isPlus ? 'Stock Inward' : 'Stock Dispatch'));
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
              {item.name}
            </h2>
            <p className="text-xs text-slate-400">
              Current: <strong className="text-white">{item.totalBags} bags</strong> ({item.kg.toLocaleString()} kg)
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
          
          {/* Action Toggle (+ Inward vs - Outward) */}
          <div className="grid grid-cols-2 gap-2 p-1 bg-slate-950 rounded-2xl border border-slate-800">
            <button
              type="button"
              onClick={() => setIsPlus(true)}
              className={`py-2.5 rounded-xl font-black text-sm flex items-center justify-center gap-1.5 transition-all ${
                isPlus
                  ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>+ Stock Inward</span>
            </button>
            <button
              type="button"
              onClick={() => setIsPlus(false)}
              className={`py-2.5 rounded-xl font-black text-sm flex items-center justify-center gap-1.5 transition-all ${
                !isPlus
                  ? 'bg-rose-500 text-white shadow-md shadow-rose-500/20'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Minus className="w-4 h-4 stroke-[3]" />
              <span>− Stock Outward</span>
            </button>
          </div>

          {/* Unit Toggle (Bags vs KG) */}
          {!item.isBulk && (
            <div className="flex items-center justify-between text-xs text-slate-400 pt-1">
              <span>Adjust by:</span>
              <div className="inline-flex rounded-lg bg-slate-800 p-0.5 border border-slate-700">
                <button
                  type="button"
                  onClick={() => setMode('bags')}
                  className={`px-3 py-1 rounded-md font-semibold transition-all ${
                    mode === 'bags'
                      ? 'bg-emerald-500 text-slate-950'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Bags
                </button>
                <button
                  type="button"
                  onClick={() => setMode('kg')}
                  className={`px-3 py-1 rounded-md font-semibold transition-all ${
                    mode === 'kg'
                      ? 'bg-emerald-500 text-slate-950'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  KG
                </button>
              </div>
            </div>
          )}

          {/* Quantity Input */}
          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
              Quantity ({mode === 'bags' ? 'Total Bags' : "KG's"})
            </label>
            <div className="relative">
              <input
                type="number"
                min="1"
                step={mode === 'bags' ? '1' : '0.5'}
                value={qty}
                onChange={(e) => setQty(e.target.value === '' ? '' : Number(e.target.value))}
                placeholder={`Enter ${mode}`}
                className="w-full bg-slate-950 border border-slate-700 rounded-2xl px-4 py-3 text-2xl font-black text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                autoFocus
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-400 uppercase">
                {mode}
              </span>
            </div>

            {/* Presets */}
            <div className="flex items-center gap-1.5 mt-2 overflow-x-auto no-scrollbar">
              <span className="text-[11px] text-slate-500 mr-1">Quick:</span>
              {presets.map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setQty(p)}
                  className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-300 border border-slate-700/60"
                >
                  +{p}
                </button>
              ))}
            </div>
          </div>

          {/* Result Preview Card */}
          <div className="p-3 bg-slate-950/80 rounded-2xl border border-slate-800 text-xs">
            <span className="text-slate-400 font-semibold block mb-1">
              New Stock After Adjustment:
            </span>
            <div className="flex items-center justify-between text-sm font-black">
              <div className="flex items-center gap-2">
                <span className="text-slate-400">{item.totalBags} bags</span>
                <ArrowRight className="w-4 h-4 text-emerald-400" />
                <span className={resultBags < item.lowStockThresholdBags ? 'text-rose-400' : 'text-emerald-400'}>
                  {resultBags} bags
                </span>
              </div>
              <div className="text-slate-400">
                {resultKg.toLocaleString()} KG
              </div>
            </div>
          </div>

          {/* Reason / Notes */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1.5">
              Reason or Reference (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g., Client dispatch, Challan #104, Production batch"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {/* Confirm Button */}
          <button
            type="submit"
            disabled={!numQty || numQty <= 0}
            className={`w-full py-3.5 rounded-2xl font-black text-sm flex items-center justify-center gap-2 shadow-lg transition-all active:scale-98 ${
              isPlus
                ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-emerald-500/20'
                : 'bg-rose-500 hover:bg-rose-400 text-white shadow-rose-500/20'
            } disabled:opacity-40 disabled:pointer-events-none`}
          >
            <span>Confirm {isPlus ? '+ Add' : '− Deduct'} {numQty || 0} {mode}</span>
          </button>
        </form>
      </div>
    </div>
  );
}
