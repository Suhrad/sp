'use client';

import { useState } from 'react';
import { StockLog, MovementType } from '@/types/stock';
import { X, History, ArrowDownLeft, ArrowUpRight, ArrowRightLeft, DollarSign, Search, Filter } from 'lucide-react';

interface HistoryDrawerProps {
  logs: StockLog[];
  onClose: () => void;
}

export default function HistoryDrawer({ logs, onClose }: HistoryDrawerProps) {
  const [filterType, setFilterType] = useState<string>('ALL');
  const [search, setSearch] = useState('');

  const filteredLogs = logs.filter((log) => {
    if (filterType !== 'ALL' && log.type !== filterType) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return (
        log.itemName.toLowerCase().includes(q) ||
        log.location.toLowerCase().includes(q) ||
        (log.reason && log.reason.toLowerCase().includes(q))
      );
    }
    return true;
  });

  const getBadge = (type: MovementType) => {
    switch (type) {
      case 'INWARD':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
            <ArrowDownLeft className="w-3 h-3" />
            + INWARD
          </span>
        );
      case 'OUTWARD':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/30">
            <ArrowUpRight className="w-3 h-3" />
            − DISPATCH
          </span>
        );
      case 'TRANSFER':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/30">
            <ArrowRightLeft className="w-3 h-3" />
            TRANSFER
          </span>
        );
      case 'PRICE_CHANGE':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30">
            <DollarSign className="w-3 h-3" />
            RATE CHANGE
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-700 text-slate-300">
            UPDATE
          </span>
        );
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-end p-0 sm:p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div className="w-full sm:max-w-md h-[90vh] sm:h-[85vh] bg-slate-900 border border-slate-800 rounded-t-3xl sm:rounded-3xl p-5 shadow-2xl flex flex-col">
        
        {/* Header */}
        <div className="flex items-start justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-slate-800 flex items-center justify-center text-emerald-400">
              <History className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-extrabold text-white">
                Activity & Audit Log
              </h2>
              <p className="text-xs text-slate-400">
                {logs.length} logged stock adjustments & price changes
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filters */}
        <div className="pt-3 pb-2 space-y-2">
          {/* Search */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search activity..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>

          {/* Type Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar text-xs">
            {['ALL', 'INWARD', 'OUTWARD', 'TRANSFER', 'PRICE_CHANGE'].map((t) => (
              <button
                key={t}
                onClick={() => setFilterType(t)}
                className={`px-2.5 py-1 rounded-lg font-semibold whitespace-nowrap text-[11px] transition-all ${
                  filterType === t
                    ? 'bg-emerald-500 text-slate-950 font-bold'
                    : 'bg-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                {t === 'ALL' ? 'All' : t.replace('_', ' ')}
              </button>
            ))}
          </div>
        </div>

        {/* Logs Timeline List */}
        <div className="flex-1 overflow-y-auto pr-1 space-y-2.5 mt-2">
          {filteredLogs.length === 0 ? (
            <div className="text-center py-12 text-slate-500 text-xs">
              No stock logs matching filters yet. Every `+` or `−` bag adjustment will appear here.
            </div>
          ) : (
            filteredLogs.map((log) => (
              <div
                key={log.id}
                className="p-3 rounded-2xl bg-slate-950/70 border border-slate-800/80 text-xs space-y-1.5"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="font-extrabold text-white text-sm block">
                      {log.itemName}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      {log.location} {log.targetLocation ? `→ ${log.targetLocation}` : ''}
                    </span>
                  </div>
                  {getBadge(log.type)}
                </div>

                {/* Change details */}
                <div className="bg-slate-900/80 px-2.5 py-1.5 rounded-xl border border-slate-800 text-[11px] font-semibold flex items-center justify-between">
                  {log.type === 'PRICE_CHANGE' ? (
                    <span>Rate: ₹{log.oldPrice} → ₹{log.newPrice}/kg</span>
                  ) : (
                    <span>
                      {log.deltaBags && log.deltaBags > 0 ? `+${log.deltaBags}` : log.deltaBags} bags
                      {log.newBags !== undefined ? ` (Now: ${log.newBags} bags)` : ''}
                    </span>
                  )}
                  <span className="text-slate-400 font-normal">
                    {log.performedBy}
                  </span>
                </div>

                {/* Note and Timestamp */}
                <div className="flex items-center justify-between text-[10px] text-slate-500 pt-0.5">
                  <span className="italic truncate max-w-[200px]">
                    {log.reason || 'Quick update'}
                  </span>
                  <span>{new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} &bull; {new Date(log.timestamp).toLocaleDateString()}</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
