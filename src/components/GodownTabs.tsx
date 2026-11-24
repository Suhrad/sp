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
  const counts = items.reduce((acc, item) => {
    acc[item.location] = (acc[item.location] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="border-b border-zinc-800 -mx-3 sm:mx-0 px-3 sm:px-0">
      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
        {GODOWN_LOCATIONS.map((loc) => {
          const isSelected = selectedLocation === loc;
          const count = loc === 'All Locations' ? items.length : (counts[loc] || 0);

          return (
            <button
              key={loc}
              onClick={() => onSelectLocation(loc)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono whitespace-nowrap transition-all ${
                isSelected
                  ? 'bg-white text-black font-bold shadow-sm'
                  : 'bg-[#121215] text-zinc-400 hover:text-white border border-zinc-800'
              }`}
            >
              <span>{loc}</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded font-mono font-bold ${
                  isSelected ? 'bg-zinc-200 text-black' : 'bg-zinc-800 text-zinc-400'
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
