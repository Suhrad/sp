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

interface StockTableProps {
  items: StockItem[];
  onQuickAdjust: (item: StockItem, deltaBags: number) => void;
  onOpenCustomAdjust: (item: StockItem, isPlus: boolean) => void;
  onOpenPriceUpdate: (item: StockItem) => void;
  onOpenTransfer: (item: StockItem) => void;
  onOpenEditItem: (item: StockItem) => void;
  onDelete: (item: StockItem) => void;
}

export default function StockTable({
  items,
  onQuickAdjust,
  onOpenCustomAdjust,
  onOpenPriceUpdate,
  onOpenTransfer,
  onOpenEditItem,
  onDelete,
}: StockTableProps) {
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);

  const formatRupees = (num: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(num);
  };

  return (
    <div className="w-full bg-[#121215] border border-zinc-800 rounded-xl overflow-hidden shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-zinc-800 bg-[#09090b] text-zinc-400 font-mono uppercase text-[11px] tracking-wider">
              <th className="py-3 px-4 font-semibold">Material / Item</th>
              <th className="py-3 px-4 font-semibold">Category</th>
              <th className="py-3 px-4 font-semibold">Location</th>
              <th className="py-3 px-4 font-semibold text-center">Bags Adjust (±)</th>
              <th className="py-3 px-4 font-semibold text-right">Net Weight</th>
              <th className="py-3 px-4 font-semibold text-right">Rate / KG</th>
              <th className="py-3 px-4 font-semibold text-right">Lot Valuation</th>
              <th className="py-3 px-3 text-center w-12">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800/60 font-mono">
            {items.map((item) => {
              const isLow = item.isBulk
                ? item.kg <= item.lowStockThresholdKg
                : item.totalBags <= item.lowStockThresholdBags;

              const totalVal = item.kg * item.currentPrice;
              const hasPriceChange = item.previousPrice !== null && item.previousPrice !== item.currentPrice;
              const priceDiff = hasPriceChange ? item.currentPrice - (item.previousPrice ?? 0) : 0;

              return (
                <tr
                  key={item.id}
                  className={`hover:bg-zinc-800/30 transition-colors group ${
                    isLow ? 'bg-red-950/10' : ''
                  }`}
                >
                  {/* Name with inline edit trigger */}
                  <td className="py-2.5 px-4 font-sans font-bold text-white">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => onOpenEditItem(item)}
                        className="text-left hover:underline truncate max-w-[210px] flex items-center gap-1.5 group/name"
                        title="Click to edit item name and details"
                      >
                        <span className="truncate">{item.name}</span>
                        <Pencil className="w-3 h-3 text-zinc-600 opacity-0 group-hover/name:opacity-100 transition-opacity flex-shrink-0" />
                      </button>
                      {isLow && (
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-red-950 text-red-400 border border-red-800 flex items-center gap-1 flex-shrink-0">
                          <AlertTriangle className="w-2.5 h-2.5" />
                          LOW
                        </span>
                      )}
                    </div>
                  </td>

                  {/* Category Tag */}
                  <td className="py-2.5 px-4 text-zinc-400 text-[10px] whitespace-nowrap">
                    <span className={`px-2 py-0.5 rounded border ${
                      item.category === 'Finished Goods'
                        ? 'bg-zinc-800 text-white border-zinc-600 font-bold'
                        : 'bg-zinc-900/80 text-zinc-400 border-zinc-800'
                    }`}>
                      {item.category || 'Raw Material'}
                    </span>
                  </td>

                  {/* Location */}
                  <td className="py-2.5 px-4 text-zinc-400 text-[11px] whitespace-nowrap">
                    <span className="px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800">
                      {item.location}
                    </span>
                  </td>

                  {/* Inline Bags Adjust Controls */}
                  <td className="py-2.5 px-4">
                    <div className="flex items-center justify-center gap-1">
                      {/* Minus button */}
                      <button
                        onClick={() => onQuickAdjust(item, -1)}
                        disabled={item.totalBags <= 0 && !item.isBulk}
                        className="w-7 h-7 rounded bg-zinc-900 border border-zinc-800 hover:border-zinc-600 hover:bg-zinc-800 text-zinc-300 font-bold flex items-center justify-center active:scale-95 disabled:opacity-30 disabled:pointer-events-none transition-all"
                        title="Deduct 1 bag (-1)"
                      >
                        <Minus className="w-3 h-3 stroke-[2.5]" />
                      </button>

                      {/* Current count display */}
                      <button
                        onClick={() => onOpenCustomAdjust(item, true)}
                        className="min-w-[54px] px-2 py-1 rounded bg-[#09090b] border border-zinc-800 hover:border-zinc-500 text-center font-bold text-white text-xs tabular-nums"
                        title="Click to enter custom ± quantity"
                      >
                        {item.totalBags} <span className="text-[10px] text-zinc-500 font-normal">bg</span>
                      </button>

                      {/* Plus button */}
                      <button
                        onClick={() => onQuickAdjust(item, 1)}
                        className="w-7 h-7 rounded bg-white text-black font-bold flex items-center justify-center hover:bg-zinc-200 active:scale-95 transition-all shadow-sm"
                        title="Add 1 bag (+1)"
                      >
                        <Plus className="w-3 h-3 stroke-[2.5]" />
                      </button>

                      {/* Quick +5 */}
                      <button
                        onClick={() => onQuickAdjust(item, 5)}
                        className="px-1.5 py-1 rounded bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-zinc-400 hover:text-white text-[10px] font-bold"
                        title="Add 5 bags (+5)"
                      >
                        +5
                      </button>
                    </div>
                  </td>

                  {/* Net Weight */}
                  <td className="py-2.5 px-4 text-right tabular-nums whitespace-nowrap">
                    <span className="font-bold text-white text-xs">
                      {item.kg.toLocaleString()}
                    </span>
                    <span className="text-zinc-500 text-[11px] ml-1">KG</span>
                    <span className="block text-[10px] text-zinc-500 font-normal">
                      {(item.kg / 1000).toFixed(2)} MT
                    </span>
                  </td>

                  {/* Rate / Price with Previous Price comparison */}
                  <td className="py-2.5 px-4 text-right tabular-nums whitespace-nowrap">
                    <button
                      onClick={() => onOpenPriceUpdate(item)}
                      className="font-bold text-white hover:underline hover:text-zinc-200 text-xs inline-flex items-center gap-1 group/rate"
                      title="Click to update rate"
                    >
                      <span>₹{item.currentPrice}</span>
                      <Edit3 className="w-2.5 h-2.5 text-zinc-500 group-hover/rate:text-white" />
                    </button>
                    {hasPriceChange && (
                      <span className="block text-[10px] text-zinc-500">
                        {priceDiff > 0 ? (
                          <span className="text-zinc-300 font-bold inline-flex items-center">
                            <TrendingUp className="w-2.5 h-2.5 mr-0.5 text-white" />
                            +₹{priceDiff}
                          </span>
                        ) : (
                          <span className="text-zinc-400 font-bold inline-flex items-center">
                            <TrendingDown className="w-2.5 h-2.5 mr-0.5" />
                            -₹{Math.abs(priceDiff)}
                          </span>
                        )}
                        {' '}(was ₹{item.previousPrice})
                      </span>
                    )}
                  </td>

                  {/* Valuation */}
                  <td className="py-2.5 px-4 text-right font-bold text-white tabular-nums text-xs whitespace-nowrap">
                    {formatRupees(totalVal)}
                  </td>

                  {/* Action Menu */}
                  <td className="py-2.5 px-3 text-center relative">
                    <button
                      onClick={() => setActiveMenuId(activeMenuId === item.id ? null : item.id)}
                      className="p-1 rounded text-zinc-500 hover:text-white hover:bg-zinc-800"
                    >
                      <MoreHorizontal className="w-4 h-4" />
                    </button>

                    {activeMenuId === item.id && (
                      <>
                        <div
                          className="fixed inset-0 z-40"
                          onClick={() => setActiveMenuId(null)}
                        />
                        <div className="absolute right-2 top-8 z-50 w-44 bg-[#121215] border border-zinc-800 rounded-lg shadow-2xl py-1 text-xs text-left font-sans">
                          <button
                            onClick={() => {
                              setActiveMenuId(null);
                              onOpenEditItem(item);
                            }}
                            className="w-full px-3 py-1.5 text-zinc-300 hover:bg-zinc-800 flex items-center gap-2"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                            <span>Edit Name & Details</span>
                          </button>
                          <button
                            onClick={() => {
                              setActiveMenuId(null);
                              onOpenTransfer(item);
                            }}
                            className="w-full px-3 py-1.5 text-zinc-300 hover:bg-zinc-800 flex items-center gap-2"
                          >
                            <ArrowRightLeft className="w-3.5 h-3.5" />
                            <span>Transfer Godown</span>
                          </button>
                          <button
                            onClick={() => {
                              setActiveMenuId(null);
                              onOpenPriceUpdate(item);
                            }}
                            className="w-full px-3 py-1.5 text-zinc-300 hover:bg-zinc-800 flex items-center gap-2"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                            <span>Update Rate</span>
                          </button>
                          <button
                            onClick={() => {
                              setActiveMenuId(null);
                              onDelete(item);
                            }}
                            className="w-full px-3 py-1.5 text-red-400 hover:bg-red-950/40 flex items-center gap-2"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Delete Lot</span>
                          </button>
                        </div>
                      </>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
