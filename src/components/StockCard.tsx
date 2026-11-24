'use client';

import { StockItem } from '@/types/stock';
import { 
  Package, 
  Plus, 
  Minus, 
  AlertTriangle, 
  TrendingUp, 
  TrendingDown, 
  ArrowRightLeft, 
  Edit3, 
  MoreVertical,
  Sliders,
  Trash2
} from 'lucide-react';
import { useState } from 'react';

interface StockCardProps {
  item: StockItem;
  onQuickAdjust: (item: StockItem, deltaBags: number) => void;
  onOpenCustomAdjust: (item: StockItem, isPlus: boolean) => void;
  onOpenPriceUpdate: (item: StockItem) => void;
  onOpenTransfer: (item: StockItem) => void;
  onDelete: (item: StockItem) => void;
}

export default function StockCard({
  item,
  onQuickAdjust,
  onOpenCustomAdjust,
  onOpenPriceUpdate,
  onOpenTransfer,
  onDelete,
}: StockCardProps) {
  const [menuOpen, setMenuOpen] = useState(false);

  const isLowStock = item.isBulk
    ? item.kg <= item.lowStockThresholdKg
    : item.totalBags <= item.lowStockThresholdBags;

  const totalValue = item.kg * item.currentPrice;

  // Price difference calculation
  const hasPriceChange = item.previousPrice !== null && item.previousPrice !== item.currentPrice;
  const priceDiff = hasPriceChange ? item.currentPrice - (item.previousPrice ?? 0) : 0;
  const pricePercent = hasPriceChange && item.previousPrice
    ? ((priceDiff / item.previousPrice) * 100).toFixed(1)
    : null;

  return (
    <div
      className={`relative bg-slate-850/90 rounded-2xl border transition-all duration-200 overflow-hidden shadow-md flex flex-col justify-between ${
        isLowStock
          ? 'border-rose-500/40 bg-gradient-to-b from-rose-950/20 via-slate-850 to-slate-900 shadow-rose-950/20'
          : 'border-slate-800 hover:border-slate-700'
      }`}
    >
      {/* Top Header */}
      <div className="p-3.5 sm:p-4 pb-2">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap mb-1">
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700/60">
                {item.location}
              </span>
              {isLowStock && (
                <span className="inline-flex items-center gap-1 text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30 animate-pulse">
                  <AlertTriangle className="w-3 h-3" />
                  Low Stock
                </span>
              )}
            </div>
            <h3 className="font-extrabold text-white text-base sm:text-lg leading-tight truncate" title={item.name}>
              {item.name}
            </h3>
          </div>

          {/* Action Menu Toggle */}
          <div className="relative">
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <MoreVertical className="w-4 h-4" />
            </button>

            {menuOpen && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setMenuOpen(false)}
                />
                <div className="absolute right-0 top-8 z-50 w-44 bg-slate-800 border border-slate-700 rounded-xl shadow-xl py-1 text-xs">
                  <button
                    onClick={() => {
                      setMenuOpen(false);
                      onOpenTransfer(item);
                    }}
                    className="w-full text-left px-3 py-2 text-slate-200 hover:bg-slate-700 flex items-center gap-2"
                  >
                    <ArrowRightLeft className="w-3.5 h-3.5 text-blue-400" />
                    <span>Transfer to Godown</span>
                  </button>
                  <button
                    onClick={() => {
                      setMenuOpen(false);
                      onOpenPriceUpdate(item);
                    }}
                    className="w-full text-left px-3 py-2 text-slate-200 hover:bg-slate-700 flex items-center gap-2"
                  >
                    <Edit3 className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Update Price</span>
                  </button>
                  <button
                    onClick={() => {
                      setMenuOpen(false);
                      onDelete(item);
                    }}
                    className="w-full text-left px-3 py-2 text-rose-400 hover:bg-rose-500/10 flex items-center gap-2"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete Item</span>
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Quantities Section */}
        <div className="mt-3 grid grid-cols-2 gap-2 bg-slate-900/80 rounded-xl p-2.5 border border-slate-800">
          <div>
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
              Bags in Stock
            </span>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className="text-2xl font-black text-white">
                {item.totalBags}
              </span>
              <span className="text-xs text-slate-400">bags</span>
            </div>
            {item.avgKgPerBag > 0 && (
              <span className="text-[10px] text-slate-500">
                ~{item.avgKgPerBag} kg/bag
              </span>
            )}
          </div>

          <div className="border-l border-slate-800 pl-2.5">
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
              Total Weight
            </span>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className="text-2xl font-black text-emerald-400">
                {item.kg.toLocaleString()}
              </span>
              <span className="text-xs text-slate-400">KG</span>
            </div>
            <span className="text-[10px] text-slate-500">
              {(item.kg / 1000).toFixed(2)} Tons
            </span>
          </div>
        </div>

        {/* Price & Value Details */}
        <div className="mt-2.5 flex items-center justify-between text-xs pt-1 border-t border-slate-800/60">
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-slate-400">Rate:</span>
              <button
                onClick={() => onOpenPriceUpdate(item)}
                className="font-extrabold text-white hover:text-emerald-400 underline underline-offset-2 flex items-center gap-1"
                title="Click to change price"
              >
                <span>₹{item.currentPrice}/kg</span>
                <Edit3 className="w-3 h-3 text-emerald-500 inline" />
              </button>
            </div>

            {/* Price change badge */}
            {hasPriceChange && (
              <div className="flex items-center gap-1 text-[10px] mt-0.5">
                <span className="text-slate-400">Was: ₹{item.previousPrice}</span>
                {priceDiff > 0 ? (
                  <span className="inline-flex items-center text-emerald-400 font-bold">
                    <TrendingUp className="w-2.5 h-2.5 mr-0.5" />
                    +{priceDiff} ({pricePercent}%)
                  </span>
                ) : (
                  <span className="inline-flex items-center text-blue-400 font-bold">
                    <TrendingDown className="w-2.5 h-2.5 mr-0.5" />
                    {priceDiff} ({pricePercent}%)
                  </span>
                )}
              </div>
            )}
          </div>

          <div className="text-right">
            <span className="text-slate-400 text-[10px] block">Lot Value</span>
            <span className="font-extrabold text-emerald-400 text-sm">
              ₹{totalValue.toLocaleString('en-IN')}
            </span>
          </div>
        </div>
      </div>

      {/* +/- Action Bar (Optimized for Mobile Thumbs) */}
      <div className="bg-slate-900/90 border-t border-slate-800/80 p-2.5">
        <div className="flex items-center gap-1.5">
          
          {/* Main Minus Button (-1) */}
          <button
            onClick={() => onQuickAdjust(item, -1)}
            disabled={item.totalBags <= 0 && !item.isBulk}
            className="flex-1 py-2 rounded-xl bg-slate-800 hover:bg-rose-950/40 hover:text-rose-400 active:bg-rose-900/60 border border-slate-700 hover:border-rose-500/40 text-slate-200 font-black text-sm flex items-center justify-center gap-1 touch-active transition-all disabled:opacity-30 disabled:pointer-events-none"
            title="Deduct 1 Bag (-1)"
          >
            <Minus className="w-4 h-4 stroke-[3]" />
            <span>1</span>
          </button>

          {/* Quick presets for Mobile */}
          <button
            onClick={() => onQuickAdjust(item, -5)}
            disabled={item.totalBags < 5 && !item.isBulk}
            className="px-2.5 py-2 rounded-xl bg-slate-800/60 hover:bg-rose-950/30 text-slate-400 hover:text-rose-300 border border-slate-700/60 font-bold text-xs touch-active transition-all disabled:opacity-20 disabled:pointer-events-none"
            title="Deduct 5 Bags (-5)"
          >
            -5
          </button>

          <button
            onClick={() => onOpenCustomAdjust(item, true)}
            className="px-2.5 py-2 rounded-xl bg-slate-800/60 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700/60 font-semibold text-xs touch-active transition-all flex items-center gap-1"
            title="Custom Inward / Outward"
          >
            <Sliders className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden xs:inline">±Qty</span>
          </button>

          <button
            onClick={() => onQuickAdjust(item, 5)}
            className="px-2.5 py-2 rounded-xl bg-slate-800/60 hover:bg-emerald-950/30 text-slate-400 hover:text-emerald-300 border border-slate-700/60 font-bold text-xs touch-active transition-all"
            title="Add 5 Bags (+5)"
          >
            +5
          </button>

          {/* Main Plus Button (+1) */}
          <button
            onClick={() => onQuickAdjust(item, 1)}
            className="flex-1 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 active:bg-emerald-600 text-slate-950 font-black text-sm flex items-center justify-center gap-1 shadow-md shadow-emerald-500/20 touch-active transition-all"
            title="Add 1 Bag (+1)"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>1</span>
          </button>
        </div>
      </div>
    </div>
  );
}
