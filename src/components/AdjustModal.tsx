'use client';

import { useState } from 'react';
import { StockItem } from '@/types/stock';
import { X, Plus, Minus, ArrowRight } from 'lucide-react';

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
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-sm">
      <div className="w-full max-w-md bg-[#121215] border border-zinc-800 rounded-t-2xl sm:rounded-2xl p-5 shadow-2xl relative">
        
        {/* Header */}
        <div className="flex items-start justify-between pb-3 border-b border-zinc-800">
          <div>
            <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-500 bg-zinc-900 px-2 py-0.5 rounded border border-zinc-800">
              {item.location}
            </span>
            <h2 className="text-base font-bold text-white mt-1.5 font-sans">
              {item.name}
            </h2>
            <p className="text-xs text-zinc-400 font-mono">
              Current: <strong className="text-white">{item.totalBags} bags</strong> ({item.kg.toLocaleString()} kg)
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
          
          {/* Action Toggle (+ Inward vs - Outward) */}
          <div className="grid grid-cols-2 gap-1.5 p-1 bg-[#09090b] rounded-lg border border-zinc-800 font-mono text-xs">
            <button
              type="button"
              onClick={() => setIsPlus(true)}
              className={`py-2 rounded-md font-bold flex items-center justify-center gap-1.5 transition-all ${
                isPlus
                  ? 'bg-white text-black shadow-sm'
                  : 'text-zinc-500 hover:text-white'
              }`}
            >
              <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>+ Inward Stock</span>
            </button>
            <button
              type="button"
              onClick={() => setIsPlus(false)}
              className={`py-2 rounded-md font-bold flex items-center justify-center gap-1.5 transition-all ${
                !isPlus
                  ? 'bg-zinc-800 text-white border border-zinc-700 shadow-sm'
                  : 'text-zinc-500 hover:text-white'
              }`}
            >
              <Minus className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>− Dispatch Stock</span>
            </button>
          </div>

          {/* Quantity Input */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-[11px] font-mono uppercase tracking-wider text-zinc-400">
                Quantity ({mode.toUpperCase()})
              </label>
              {!item.isBulk && (
                <div className="inline-flex rounded border border-zinc-800 bg-[#09090b] p-0.5 text-[10px] font-mono">
                  <button
                    type="button"
                    onClick={() => setMode('bags')}
                    className={`px-2 py-0.5 rounded ${mode === 'bags' ? 'bg-zinc-800 text-white' : 'text-zinc-500'}`}
                  >
                    Bags
                  </button>
                  <button
                    type="button"
                    onClick={() => setMode('kg')}
                    className={`px-2 py-0.5 rounded ${mode === 'kg' ? 'bg-zinc-800 text-white' : 'text-zinc-500'}`}
                  >
                    KG
                  </button>
                </div>
              )}
            </div>

            <div className="relative">
              <input
                type="number"
                min="1"
                step={mode === 'bags' ? '1' : '0.5'}
                value={qty}
                onChange={(e) => setQty(e.target.value === '' ? '' : Number(e.target.value))}
                placeholder={`Enter ${mode}`}
                className="w-full bg-[#09090b] border border-zinc-800 rounded-lg px-3.5 py-2.5 text-xl font-bold font-mono text-white focus:outline-none focus:border-white tabular-nums"
                autoFocus
              />
              <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-mono text-zinc-500 uppercase">
                {mode}
              </span>
            </div>

            {/* Quick Presets */}
            <div className="flex items-center gap-1 mt-2">
              <span className="text-[10px] font-mono text-zinc-500 mr-1">PRESET:</span>
              {presets.map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setQty(p)}
                  className="px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-[10px] font-mono font-bold text-zinc-400 hover:text-white"
                >
                  +{p}
                </button>
              ))}
            </div>
          </div>

          {/* Result Preview */}
          <div className="p-3 bg-[#09090b] rounded-lg border border-zinc-800 text-xs font-mono">
            <span className="text-zinc-500 text-[10px] uppercase block mb-1">
              Resulting Balance
            </span>
            <div className="flex items-center justify-between text-xs font-bold text-white">
              <div className="flex items-center gap-2">
                <span className="text-zinc-500">{item.totalBags} bags</span>
                <ArrowRight className="w-3.5 h-3.5 text-zinc-400" />
                <span className="text-white underline">{resultBags} bags</span>
              </div>
              <span className="text-zinc-400">{resultKg.toLocaleString()} KG</span>
            </div>
          </div>

          {/* Reference Note */}
          <div>
            <label className="block text-[11px] font-mono uppercase tracking-wider text-zinc-400 mb-1">
              Reference / Note (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g. Challan #104, Production run"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full bg-[#09090b] border border-zinc-800 rounded-lg px-3 py-2 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-white font-mono"
            />
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={!numQty || numQty <= 0}
            className="w-full py-2.5 rounded-lg font-mono font-bold text-xs uppercase tracking-wider text-black bg-white hover:bg-zinc-200 transition-all flex items-center justify-center gap-1.5 disabled:opacity-40"
          >
            <span>Confirm {isPlus ? '+ Add' : '− Deduct'} {numQty || 0} {mode}</span>
          </button>
        </form>
      </div>
    </div>
  );
}
