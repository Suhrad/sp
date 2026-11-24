'use client';

import { useState } from 'react';
import { StockSummary, StockItem, GodownLocation } from '@/types/stock';
import { ChevronDown, ChevronUp } from 'lucide-react';

interface SummaryCardsProps {
  summary: StockSummary;
  items: StockItem[];
  selectedLocation: string;
  onSelectLocation: (loc: string) => void;
}

export default function SummaryCards({
  summary,
  items,
  selectedLocation,
  onSelectLocation,
}: SummaryCardsProps) {
  const [showBreakdown, setShowBreakdown] = useState(false);

  // Group by godown
  const locationStats = items.reduce((acc, item) => {
    if (!acc[item.location]) {
      acc[item.location] = { valuation: 0, bags: 0, kg: 0, itemsCount: 0 };
    }
    acc[item.location].valuation += item.kg * item.currentPrice;
    acc[item.location].bags += item.totalBags || 0;
    acc[item.location].kg += item.kg || 0;
    acc[item.location].itemsCount += 1;
    return acc;
  }, {} as Record<GodownLocation, { valuation: number; bags: number; kg: number; itemsCount: number }>);

  const formatRupees = (num: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(num);
  };

  const tons = (summary.totalKg / 1000).toFixed(2);

  return (
    <div className="space-y-2">
      {/* Executive Metric Bar */}
      <div className="grid grid-cols-2 lg:grid-cols-4 bg-[#121215] border border-zinc-800 rounded-xl divide-y lg:divide-y-0 lg:divide-x divide-zinc-800/80 overflow-hidden shadow-sm">
        
        {/* Total Valuation */}
        <div className="p-3.5 sm:p-4">
          <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-500 block mb-1">
            Total Valuation
          </span>
          <div className="text-xl sm:text-2xl font-bold font-mono tracking-tight text-white tabular-nums">
            {formatRupees(summary.totalValuation)}
          </div>
          <span className="text-[11px] font-mono text-zinc-500 mt-0.5 block">
            {items.length} lots inventory
          </span>
        </div>

        {/* Total Bags */}
        <div className="p-3.5 sm:p-4">
          <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-500 block mb-1">
            Packed Stock
          </span>
          <div className="text-xl sm:text-2xl font-bold font-mono tracking-tight text-white tabular-nums">
            {summary.totalBags.toLocaleString()} <span className="text-xs font-normal text-zinc-500 font-sans">bags</span>
          </div>
          <span className="text-[11px] font-mono text-zinc-500 mt-0.5 block">
            Standard 25kg lots
          </span>
        </div>

        {/* Total Tonnage */}
        <div className="p-3.5 sm:p-4">
          <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-500 block mb-1">
            Total Mass
          </span>
          <div className="text-xl sm:text-2xl font-bold font-mono tracking-tight text-white tabular-nums">
            {tons} <span className="text-xs font-normal text-zinc-500 font-sans">MT</span>
          </div>
          <span className="text-[11px] font-mono text-zinc-500 mt-0.5 block">
            {summary.totalKg.toLocaleString()} KG net
          </span>
        </div>

        {/* Low Stock Alerts */}
        <div className="p-3.5 sm:p-4">
          <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-500 block mb-1">
            Reorder Alert
          </span>
          <div className="flex items-baseline gap-2">
            <span className={`text-xl sm:text-2xl font-bold font-mono tracking-tight tabular-nums ${
              summary.lowStockCount > 0 ? 'text-white' : 'text-zinc-500'
            }`}>
              {summary.lowStockCount}
            </span>
            <span className="text-xs text-zinc-500 font-mono">critical lots</span>
          </div>
          <span className="text-[11px] font-mono text-zinc-500 mt-0.5 block">
            {summary.lowStockCount > 0 ? 'Below safety threshold' : 'All levels nominal'}
          </span>
        </div>
      </div>

      {/* Godown distribution breakdown toggle */}
      <div className="flex justify-between items-center px-1">
        <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-500">
          Distribution by Plant & Warehouse
        </span>
        <button
          onClick={() => setShowBreakdown(!showBreakdown)}
          className="text-[11px] font-mono text-zinc-400 hover:text-white flex items-center gap-1 transition-colors py-0.5"
        >
          <span>{showBreakdown ? 'Hide Breakdown' : 'View Breakdown'}</span>
          {showBreakdown ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
        </button>
      </div>

      {/* Collapsible detailed breakdown */}
      {showBreakdown && (
        <div className="bg-[#121215] border border-zinc-800 rounded-xl p-3 shadow-md">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
            {Object.entries(locationStats).map(([loc, stat]) => {
              const isSelected = selectedLocation === loc;
              const percent = ((stat.valuation / (summary.totalValuation || 1)) * 100).toFixed(1);

              return (
                <div
                  key={loc}
                  onClick={() => onSelectLocation(loc)}
                  className={`p-2.5 rounded-lg border cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-zinc-800/90 border-white text-white'
                      : 'bg-[#09090b] border-zinc-800/80 hover:border-zinc-700 text-zinc-300'
                  }`}
                >
                  <div className="flex items-center justify-between text-xs font-bold mb-1">
                    <span className="truncate">{loc}</span>
                    <span className="font-mono text-white text-[11px]">{percent}%</span>
                  </div>
                  <div className="text-xs font-mono font-bold text-white mb-0.5 tabular-nums">
                    {formatRupees(stat.valuation)}
                  </div>
                  <div className="flex justify-between text-[10px] font-mono text-zinc-500">
                    <span>{stat.bags} bags</span>
                    <span>{stat.itemsCount} lots</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
