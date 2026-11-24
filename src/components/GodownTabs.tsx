'use client';

import { GODOWN_LOCATIONS } from '@/data/initialStock';
import { StockItem } from '@/types/stock';

interface GodownTabsProps {
  selectedLocation: string;
  onSelectLocation: (loc: string) => void;
  items: StockItem[];
}

export default function GodownTabs({
  selectedLocation,
  onSelectLocation,
  items,
}: GodownTabsProps) {
  // Count items per location
  const counts = items.reduce((acc, item) => {
    acc[item.location] = (acc[item.location] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="relative border-b border-slate-800/80 -mx-3 sm:mx-0 px-3 sm:px-0">
      <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto no-scrollbar py-2">
        {GODOWN_LOCATIONS.map((loc) => {
          const isSelected = selectedLocation === loc;
          const count = loc === 'All Locations' ? items.length : (counts[loc] || 0);

          return (
            <button
              key={loc}
              onClick={() => onSelectLocation(loc)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all flex-shrink-0 ${
                isSelected
                  ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20 font-bold'
                  : 'bg-slate-800/70 text-slate-300 hover:bg-slate-800 hover:text-white border border-slate-700/50'
              }`}
            >
              <span>{loc}</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                  isSelected
                    ? 'bg-slate-950/20 text-slate-950'
                    : 'bg-slate-700 text-slate-300'
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
