'use client';

import { useState } from 'react';
import { StockLog, MovementType } from '@/types/stock';
import { X, Clock, Search } from 'lucide-react';

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
          <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-zinc-800 text-white border border-zinc-700">
            + INWARD
          </span>
        );
      case 'OUTWARD':
        return (
          <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-zinc-900 text-zinc-400 border border-zinc-800">
            − DISPATCH
          </span>
        );
      case 'TRANSFER':
        return (
          <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-zinc-900 text-zinc-300 border border-zinc-800">
            TRANSFER
          </span>
        );
      case 'PRICE_CHANGE':
        return (
          <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-white text-black">
            RATE REVISION
          </span>
        );
      default:
        return (
          <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-zinc-900 text-zinc-500">
            AUDIT
          </span>
        );
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-end p-0 sm:p-4 bg-black/80 backdrop-blur-sm">
      <div className="w-full sm:max-w-md h-[90vh] sm:h-[85vh] bg-[#121215] border border-zinc-800 rounded-t-2xl sm:rounded-2xl p-5 shadow-2xl flex flex-col">
        
        {/* Header */}
        <div className="flex items-start justify-between pb-3 border-b border-zinc-800">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center text-white">
              <Clock className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white font-sans">
                Audit Trail & Log
              </h2>
              <p className="text-xs text-zinc-400 font-mono">
                {logs.length} logged stock movements
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-zinc-500 hover:text-white hover:bg-zinc-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Filter controls */}
        <div className="pt-3 pb-2 space-y-2">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search logs..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-[#09090b] border border-zinc-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-white font-mono"
            />
          </div>

          <div className="flex items-center gap-1 overflow-x-auto no-scrollbar text-xs font-mono">
            {['ALL', 'INWARD', 'OUTWARD', 'TRANSFER', 'PRICE_CHANGE'].map((t) => (
              <button
                key={t}
                onClick={() => setFilterType(t)}
                className={`px-2 py-0.5 rounded text-[10px] font-bold whitespace-nowrap transition-all ${
                  filterType === t
                    ? 'bg-white text-black'
                    : 'bg-[#09090b] text-zinc-500 hover:text-white border border-zinc-800'
                }`}
              >
                {t === 'ALL' ? 'ALL' : t.replace('_', ' ')}
              </button>
            ))}
          </div>
        </div>

        {/* Log rows */}
        <div className="flex-1 overflow-y-auto pr-1 space-y-2 mt-2 font-mono">
          {filteredLogs.length === 0 ? (
            <div className="text-center py-12 text-zinc-600 text-xs">
              No audit records matching active filters.
            </div>
          ) : (
            filteredLogs.map((log) => (
              <div
                key={log.id}
                className="p-3 rounded-lg bg-[#09090b] border border-zinc-800/80 text-xs space-y-1.5"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="font-bold text-white block font-sans">
                      {log.itemName}
                    </span>
                    <span className="text-[10px] text-zinc-500">
                      {log.location} {log.targetLocation ? `→ ${log.targetLocation}` : ''}
                    </span>
                  </div>
                  {getBadge(log.type)}
                </div>

                <div className="bg-[#121215] px-2 py-1 rounded border border-zinc-800/60 text-[11px] flex items-center justify-between">
                  {log.type === 'PRICE_CHANGE' ? (
                    <span className="text-white font-bold">Rate: ₹{log.oldPrice} → ₹{log.newPrice}/kg</span>
                  ) : (
                    <span className="text-white font-bold">
                      {log.deltaBags && log.deltaBags > 0 ? `+${log.deltaBags}` : log.deltaBags} bags
                      {log.newBags !== undefined ? ` (Bal: ${log.newBags})` : ''}
                    </span>
                  )}
                  <span className="text-zinc-500 text-[10px]">
                    {log.performedBy}
                  </span>
                </div>

                <div className="flex items-center justify-between text-[10px] text-zinc-500 pt-0.5">
                  <span className="truncate max-w-[200px] italic">
                    {log.reason || 'Direct adjustment'}
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
