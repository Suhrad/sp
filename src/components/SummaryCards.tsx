'use client';

import { useState } from 'react';
import { StockSummary, StockItem, GodownLocation } from '@/types/stock';
import { IndianRupee, Package, Scale, AlertTriangle, ChevronDown, ChevronUp, Building2 } from 'lucide-react';

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

  // Calculate per-location breakdowns
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

  // Format currency in Indian locale
  const formatRupees = (num: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(num);
  };

  // Convert kg to tons for summary
  const tons = (summary.totalKg / 1000).toFixed(2);

  return (
    <div className="space-y-3">
      {/* 4 Top Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3.5">
        
        {/* Total Stock Valuation */}
        <div className="bg-slate-850/90 border border-slate-800 rounded-2xl p-3 sm:p-4 bg-gradient-to-br from-emerald-950/30 to-slate-900 shadow-md relative overflow-hidden">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[11px] sm:text-xs font-semibold text-emerald-400 uppercase tracking-wider">
              Total Valuation
            </span>
            <div className="w-7 h-7 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400">
              <IndianRupee className="w-4 h-4" />
            </div>
          </div>
          <div className="text-lg sm:text-2xl font-black text-white tracking-tight">
            {formatRupees(summary.totalValuation)}
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Across {items.length} lots
          </p>
        </div>

        {/* Total Bags */}
        <div className="bg-slate-850/90 border border-slate-800 rounded-2xl p-3 sm:p-4 bg-gradient-to-br from-blue-950/30 to-slate-900 shadow-md">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[11px] sm:text-xs font-semibold text-blue-400 uppercase tracking-wider">
              Total Bags
            </span>
            <div className="w-7 h-7 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-400">
              <Package className="w-4 h-4" />
            </div>
          </div>
          <div className="text-lg sm:text-2xl font-black text-white tracking-tight">
            {summary.totalBags.toLocaleString()} <span className="text-xs font-medium text-slate-400">bags</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Packaged granules & chips
          </p>
        </div>

        {/* Total Weight in Tons & KGs */}
        <div className="bg-slate-850/90 border border-slate-800 rounded-2xl p-3 sm:p-4 bg-gradient-to-br from-amber-950/30 to-slate-900 shadow-md">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[11px] sm:text-xs font-semibold text-amber-400 uppercase tracking-wider">
              Total Weight
            </span>
            <div className="w-7 h-7 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-400">
              <Scale className="w-4 h-4" />
            </div>
          </div>
          <div className="text-lg sm:text-2xl font-black text-white tracking-tight">
            {tons} <span className="text-xs font-medium text-slate-400">Tons</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">
            ({summary.totalKg.toLocaleString()} KG)
          </p>
        </div>

        {/* Low Stock Items */}
        <div className={`border rounded-2xl p-3 sm:p-4 shadow-md transition-all ${
          summary.lowStockCount > 0
            ? 'bg-gradient-to-br from-rose-950/40 to-slate-900 border-rose-500/30 text-rose-300'
            : 'bg-slate-850/90 border-slate-800 text-slate-400'
        }`}>
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[11px] sm:text-xs font-semibold text-rose-400 uppercase tracking-wider">
              Low Stock Alerts
            </span>
            <div className="w-7 h-7 rounded-lg bg-rose-500/10 flex items-center justify-center text-rose-400">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="text-lg sm:text-2xl font-black text-white tracking-tight">
            {summary.lowStockCount} <span className="text-xs font-medium text-slate-400">items</span>
          </div>
          <p className="text-[11px] text-rose-400/80 mt-0.5">
            {summary.lowStockCount > 0 ? 'Requires replenishment' : 'All stock healthy'}
          </p>
        </div>
      </div>

      {/* Godown Breakdown Toggle */}
      <div className="flex justify-end">
        <button
          onClick={() => setShowBreakdown(!showBreakdown)}
          className="text-xs text-slate-400 hover:text-emerald-400 flex items-center gap-1.5 transition-colors py-1 px-2 rounded-lg bg-slate-850 border border-slate-800"
        >
          <Building2 className="w-3.5 h-3.5" />
          <span>{showBreakdown ? 'Hide Godown Breakdown' : 'View Godown Breakdown'}</span>
          {showBreakdown ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>
      </div>

      {/* Expanded Breakdown Table */}
      {showBreakdown && (
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-3 sm:p-4 shadow-xl overflow-x-auto">
          <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2.5">
            Godown & Plant-wise Inventory Breakdown
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
            {Object.entries(locationStats).map(([loc, stat]) => (
              <div
                key={loc}
                onClick={() => onSelectLocation(loc)}
                className={`p-3 rounded-xl border cursor-pointer transition-all ${
                  selectedLocation === loc
                    ? 'bg-emerald-950/40 border-emerald-500/50'
                    : 'bg-slate-800/40 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between text-xs font-bold text-white mb-1">
                  <span>{loc}</span>
                  <span className="text-emerald-400 font-extrabold">{formatRupees(stat.valuation)}</span>
                </div>
                <div className="flex justify-between text-[11px] text-slate-400">
                  <span>{stat.bags} bags ({stat.kg.toLocaleString()} kg)</span>
                  <span>{stat.itemsCount} items</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
