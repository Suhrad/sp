'use client';

import { StockItem } from '@/types/stock';
import { 
  Plus, 
  Minus, 
  AlertTriangle, 
  ArrowRightLeft, 
  Edit3, 
  MoreHorizontal, 
  Trash2,
  TrendingUp,
  TrendingDown,
  Pencil
} from 'lucide-react';
import { useState } from 'react';

interface StockCardProps {
  item: StockItem;
  onQuickAdjust: (item: StockItem, deltaBags: number) => void;
  onOpenCustomAdjust: (item: StockItem, isPlus: boolean) => void;
  onOpenPriceUpdate: (item: StockItem) => void;
  onOpenTransfer: (item: StockItem) => void;
  onOpenEditItem: (item: StockItem) => void;
  onDelete: (item: StockItem) => void;
}

export default function StockCard({
  item,
  onQuickAdjust,
  onOpenCustomAdjust,
  onOpenPriceUpdate,
  onOpenTransfer,
  onOpenEditItem,
  onDelete,
}: StockCardProps) {
  const [menuOpen, setMenuOpen] = useState(false);

  const isLowStock = item.isBulk
    ? item.kg <= item.lowStockThresholdKg
    : item.totalBags <= item.lowStockThresholdBags;

  const totalValue = item.kg * item.currentPrice;

  const hasPriceChange = item.previousPrice !== null && item.previousPrice !== item.currentPrice;
  const priceDiff = hasPriceChange ? item.currentPrice - (item.previousPrice ?? 0) : 0;

  return (
    <div
      className={`relative bg-[#121215] rounded-xl border transition-all duration-150 flex flex-col justify-between ${
        isLowStock
          ? 'border-red-900/80 bg-gradient-to-b from-red-950/10 to-[#121215]'
          : 'border-zinc-800 hover:border-zinc-700'
      }`}
    >
      <div className="p-3 sm:p-4 pb-2.5 sm:pb-3">
        {/* Top Header */}
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap mb-1">
              <span className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded bg-zinc-900 text-zinc-400 border border-zinc-800">
                {item.location}
              </span>
              <span className={`text-[10px] font-mono uppercase tracking-wider px-1.5 py-0.5 rounded border ${
                item.category === 'Finished Goods'
                  ? 'bg-zinc-800 text-white border-zinc-600 font-bold'
                  : 'bg-zinc-900/60 text-zinc-500 border-zinc-800'
              }`}>
                {item.category || 'Raw Material'}
              </span>
              {isLowStock && (
                <span className="inline-flex items-center gap-1 text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded bg-red-950 text-red-400 border border-red-800">
                  <AlertTriangle className="w-2.5 h-2.5" />
                  Low Stock
                </span>
              )}
            </div>
            <button
              onClick={() => onOpenEditItem(item)}
              className="font-bold text-white text-base leading-tight truncate font-sans text-left hover:underline flex items-center gap-1.5 group/cardname"
              title="Click to edit item name and details"
            >
              <span className="truncate">{item.name}</span>
              <Pencil className="w-3 h-3 text-zinc-600 opacity-0 group-hover/cardname:opacity-100 transition-opacity flex-shrink-0" />
            </button>
          </div>

          {/* Menu */}
          <div className="relative">
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="p-1.5 rounded-lg text-zinc-500 hover:text-white hover:bg-zinc-800 transition-colors"
            >
              <MoreHorizontal className="w-4 h-4" />
            </button>

            {menuOpen && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setMenuOpen(false)}
                />
                <div className="absolute right-0 top-8 z-50 w-44 bg-[#121215] border border-zinc-800 rounded-lg shadow-2xl py-1 text-xs font-sans">
                  <button
                    onClick={() => {
                      setMenuOpen(false);
                      onOpenEditItem(item);
                    }}
                    className="w-full text-left px-3 py-2 text-zinc-300 hover:bg-zinc-800 flex items-center gap-2"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                    <span>Edit Name & Details</span>
                  </button>
                  <button
                    onClick={() => {
                      setMenuOpen(false);
                      onOpenTransfer(item);
                    }}
                    className="w-full text-left px-3 py-2 text-zinc-300 hover:bg-zinc-800 flex items-center gap-2"
                  >
                    <ArrowRightLeft className="w-3.5 h-3.5" />
                    <span>Transfer Godown</span>
                  </button>
                  <button
                    onClick={() => {
                      setMenuOpen(false);
                      onOpenPriceUpdate(item);
                    }}
                    className="w-full text-left px-3 py-2 text-zinc-300 hover:bg-zinc-800 flex items-center gap-2"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>Update Rate</span>
                  </button>
                  <button
                    onClick={() => {
                      setMenuOpen(false);
                      onDelete(item);
                    }}
                    className="w-full text-left px-3 py-2 text-red-400 hover:bg-red-950/40 flex items-center gap-2"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete Lot</span>
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Quantities */}
        <div className="grid grid-cols-2 gap-2 bg-[#09090b] rounded-lg p-2.5 border border-zinc-800/80 font-mono">
          <div>
            <span className="text-[10px] uppercase tracking-wider text-zinc-500 block">
              Packed Stock
            </span>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className="text-2xl font-bold text-white tabular-nums">
                {item.totalBags}
              </span>
              <span className="text-xs text-zinc-500">bags</span>
            </div>
            {item.avgKgPerBag > 0 && (
              <span className="text-[10px] text-zinc-500 block">
                ~{item.avgKgPerBag}kg/bag
              </span>
            )}
          </div>

          <div className="border-l border-zinc-800/80 pl-2.5">
            <span className="text-[10px] uppercase tracking-wider text-zinc-500 block">
              Net Weight
            </span>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className="text-2xl font-bold text-white tabular-nums">
                {item.kg.toLocaleString()}
              </span>
              <span className="text-xs text-zinc-500">KG</span>
            </div>
            <span className="text-[10px] text-zinc-500 block">
              {(item.kg / 1000).toFixed(2)} MT
            </span>
          </div>
        </div>

        {/* Rate & Total Value */}
        <div className="mt-2.5 flex items-center justify-between text-xs pt-1 border-t border-zinc-800/60 font-mono">
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-zinc-500">Rate:</span>
              <button
                onClick={() => onOpenPriceUpdate(item)}
                className="font-bold text-white hover:underline flex items-center gap-1"
                title="Click to update rate"
              >
                <span>₹{item.currentPrice}/kg</span>
                <Edit3 className="w-2.5 h-2.5 text-zinc-500" />
              </button>
            </div>

            {hasPriceChange && (
              <div className="flex items-center gap-1 text-[10px] mt-0.5 text-zinc-500">
                <span>was ₹{item.previousPrice}</span>
                {priceDiff > 0 ? (
                  <span className="text-zinc-300 font-bold inline-flex items-center">
                    <TrendingUp className="w-2.5 h-2.5 mr-0.5" />
                    +₹{priceDiff}
                  </span>
                ) : (
                  <span className="text-zinc-400 font-bold inline-flex items-center">
                    <TrendingDown className="w-2.5 h-2.5 mr-0.5" />
                    -₹{Math.abs(priceDiff)}
                  </span>
                )}
              </div>
            )}
          </div>

          <div className="text-right">
            <span className="text-zinc-500 text-[10px] block">Valuation</span>
            <span className="font-bold text-white text-sm tabular-nums">
              ₹{totalValue.toLocaleString('en-IN')}
            </span>
          </div>
        </div>
      </div>

      {/* +/- Action Bar */}
      <div className="bg-[#09090b] border-t border-zinc-800 p-2 rounded-b-xl">
        <div className="flex items-center gap-1.5">
          {/* Minus 1 */}
          <button
            onClick={() => onQuickAdjust(item, -1)}
            disabled={item.totalBags <= 0 && !item.isBulk}
            className="flex-1 py-2 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-800 font-mono font-bold text-xs flex items-center justify-center gap-1 active:scale-95 disabled:opacity-20 transition-all"
            title="Deduct 1 bag (-1)"
          >
            <Minus className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>1</span>
          </button>

          {/* Quick -5 */}
          <button
            onClick={() => onQuickAdjust(item, -5)}
            disabled={item.totalBags < 5 && !item.isBulk}
            className="px-2.5 py-2 rounded-lg bg-zinc-900/60 hover:bg-zinc-800 text-zinc-400 border border-zinc-800/80 font-mono text-[11px] font-bold disabled:opacity-20"
          >
            -5
          </button>

          {/* Custom dialog */}
          <button
            onClick={() => onOpenCustomAdjust(item, true)}
            className="px-2.5 py-2 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-800 font-mono text-xs font-semibold"
            title="Custom inward or dispatch"
          >
            &plusmn;Qty
          </button>

          {/* Quick +5 */}
          <button
            onClick={() => onQuickAdjust(item, 5)}
            className="px-2.5 py-2 rounded-lg bg-zinc-900/60 hover:bg-zinc-800 text-zinc-400 border border-zinc-800/80 font-mono text-[11px] font-bold"
          >
            +5
          </button>

          {/* Plus 1 */}
          <button
            onClick={() => onQuickAdjust(item, 1)}
            className="flex-1 py-2 rounded-lg bg-white hover:bg-zinc-200 text-black font-mono font-bold text-xs flex items-center justify-center gap-1 shadow-sm active:scale-95 transition-all"
            title="Add 1 bag (+1)"
          >
            <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>1</span>
          </button>
        </div>
      </div>
    </div>
  );
}
