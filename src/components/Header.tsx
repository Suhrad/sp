'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { serverLogout, UserSession } from '@/lib/auth';
import { 
  Search, 
  AlertTriangle, 
  Plus, 
  Clock, 
  Download, 
  Settings, 
  LogOut, 
  X,
  LayoutGrid,
  Table as TableIcon,
  Cloud,
  RefreshCw,
  Maximize2,
  Minimize2
} from 'lucide-react';

interface HeaderProps {
  session: UserSession | null;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  lowStockOnly: boolean;
  onToggleLowStock: () => void;
  lowStockCount: number;
  categoryFilter: string;
  onCategoryFilterChange: (cat: string) => void;
  onOpenAddItem: () => void;
  onOpenHistory: () => void;
  onOpenSettings: () => void;
  onExportCSV: () => void;
  viewMode: 'table' | 'cards';
  onToggleViewMode: (mode: 'table' | 'cards') => void;
  isSyncing?: boolean;
  isPostgresConnected?: boolean;
  onManualSync?: () => void;
}

export default function Header({
  session,
  searchQuery,
  onSearchChange,
  lowStockOnly,
  onToggleLowStock,
  lowStockCount,
  categoryFilter,
  onCategoryFilterChange,
  onOpenAddItem,
  onOpenHistory,
  onOpenSettings,
  onExportCSV,
  viewMode,
  onToggleViewMode,
  isSyncing,
  isPostgresConnected,
  onManualSync,
}: HeaderProps) {
  const router = useRouter();
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const handler = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };
    document.addEventListener('fullscreenchange', handler);
    return () => document.removeEventListener('fullscreenchange', handler);
  }, []);

  const toggleFullscreen = () => {
    if (typeof document === 'undefined') return;
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

  const handleLogout = async () => {
    if (confirm('Log out from Stock Platform?')) {
      await serverLogout();
      router.replace('/login');
    }
  };

  return (
    <header className="sticky top-0 z-30 bg-[#09090b]/95 backdrop-blur-md border-b border-zinc-800 overflow-x-hidden">
      <div className="w-full max-w-[1920px] mx-auto px-2.5 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-13 sm:h-14 gap-2 sm:gap-3">
          
          {/* Brand & Cloud Status */}
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <div className="w-7 h-7 sm:w-8 sm:h-8 bg-white text-black font-black text-xs sm:text-sm flex items-center justify-center rounded-lg tracking-tight flex-shrink-0">
              OS
            </div>
            <div className="leading-none min-w-0">
              <div className="flex items-center gap-1 sm:gap-1.5">
                <span className="font-bold text-xs sm:text-sm tracking-tight text-white block truncate">
                  STOCK OS
                </span>
                {/* Cloud Live Badge */}
                <button
                  onClick={onManualSync}
                  className="hidden sm:inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white transition-colors"
                  title="Click to manually refresh from Cloud Database"
                >
                  <Cloud className={`w-2.5 h-2.5 ${isSyncing ? 'text-blue-400 animate-spin' : isPostgresConnected ? 'text-emerald-400' : 'text-zinc-400'}`} />
                  <span>{isPostgresConnected ? 'POSTGRES' : 'CLOUD SYNC'}</span>
                </button>
              </div>
              <span className="text-[9px] sm:text-[10px] font-mono text-zinc-500 uppercase tracking-widest block mt-0.5 truncate">
                ENTERPRISE ERP
              </span>
            </div>
          </div>

          {/* Search input */}
          <div className="flex-1 max-w-sm hidden md:block">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                placeholder="Search raw material, finished goods, godowns..."
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                className="w-full bg-[#121215] border border-zinc-800 rounded-lg pl-8 pr-7 py-1.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-500 transition-colors font-mono"
              />
              {searchQuery && (
                <button
                  onClick={() => onSearchChange('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>

          {/* Controls & Actions */}
          <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
            
            {/* Category Filter Toggle */}
            <div className="hidden lg:inline-flex rounded-lg border border-zinc-800 bg-[#121215] p-0.5 text-xs font-mono">
              {['ALL', 'RAW MATERIAL', 'FINISHED GOODS'].map((cat) => (
                <button
                  key={cat}
                  onClick={() => onCategoryFilterChange(cat)}
                  className={`px-2 py-1 rounded text-[10px] font-bold transition-colors ${
                    categoryFilter === cat
                      ? 'bg-zinc-800 text-white'
                      : 'text-zinc-500 hover:text-zinc-300'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* View Mode Switcher */}
            <div className="hidden sm:inline-flex rounded-lg border border-zinc-800 bg-[#121215] p-0.5">
              <button
                onClick={() => onToggleViewMode('table')}
                className={`p-1.5 rounded-md text-xs transition-colors flex items-center gap-1 ${
                  viewMode === 'table'
                    ? 'bg-zinc-800 text-white font-bold'
                    : 'text-zinc-400 hover:text-white'
                }`}
                title="Dense Table View"
              >
                <TableIcon className="w-3.5 h-3.5" />
                <span className="text-[11px] pr-0.5">Table</span>
              </button>
              <button
                onClick={() => onToggleViewMode('cards')}
                className={`p-1.5 rounded-md text-xs transition-colors flex items-center gap-1 ${
                  viewMode === 'cards'
                    ? 'bg-zinc-800 text-white font-bold'
                    : 'text-zinc-400 hover:text-white'
                }`}
                title="Card View"
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span className="text-[11px] pr-0.5">Cards</span>
              </button>
            </div>

            {/* Low stock filter toggle */}
            <button
              onClick={onToggleLowStock}
              className={`flex items-center gap-1 sm:gap-1.5 px-2 sm:px-2.5 py-1.5 rounded-lg text-xs font-mono transition-colors border ${
                lowStockOnly
                  ? 'bg-red-950/40 text-red-300 border-red-700/60 font-bold'
                  : 'bg-[#121215] text-zinc-400 border-zinc-800 hover:text-white'
              }`}
            >
              <AlertTriangle className={`w-3.5 h-3.5 ${lowStockOnly ? 'text-red-400' : 'text-zinc-500'}`} />
              <span className="hidden sm:inline">Low Stock</span>
              <span className="px-1.5 py-0.2 rounded bg-zinc-800 text-zinc-300 text-[10px] font-bold">
                {lowStockCount}
              </span>
            </button>

            {/* Add stock lot */}
            <button
              onClick={onOpenAddItem}
              className="flex items-center gap-1 px-2 sm:px-3 py-1.5 rounded-lg text-xs font-bold bg-white text-black hover:bg-zinc-200 transition-colors shadow-sm whitespace-nowrap"
            >
              <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
              <span className="hidden xs:inline">Add Lot</span>
            </button>

            {/* Audit Log */}
            <button
              onClick={onOpenHistory}
              className="p-1.5 rounded-lg bg-[#121215] border border-zinc-800 text-zinc-400 hover:text-white transition-colors hidden xs:block"
              title="Audit Logs"
            >
              <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </button>

            {/* CSV export */}
            <button
              onClick={onExportCSV}
              className="p-1.5 rounded-lg bg-[#121215] border border-zinc-800 text-zinc-400 hover:text-white transition-colors hidden sm:block"
              title="Export CSV"
            >
              <Download className="w-4 h-4" />
            </button>

            {/* Fullscreen toggle */}
            <button
              onClick={toggleFullscreen}
              className="p-1.5 rounded-lg bg-[#121215] border border-zinc-800 text-zinc-400 hover:text-white transition-colors hidden sm:flex items-center justify-center"
              title={isFullscreen ? 'Exit Full Screen (Esc)' : 'Enter Full Screen'}
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4 text-white" /> : <Maximize2 className="w-4 h-4" />}
            </button>

            {/* Settings */}
            <button
              onClick={onOpenSettings}
              className="p-1.5 rounded-lg bg-[#121215] border border-zinc-800 text-zinc-400 hover:text-white transition-colors"
              title="Settings & Credentials"
            >
              <Settings className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </button>

            {/* Logout */}
            <button
              onClick={handleLogout}
              className="p-1.5 rounded-lg bg-[#121215] border border-zinc-800 text-zinc-500 hover:text-red-400 transition-colors"
              title="Sign Out"
            >
              <LogOut className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </button>
          </div>
        </div>

        {/* Mobile search bar and category bar */}
        <div className="pb-2.5 md:hidden space-y-2">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Search items, godowns..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full bg-[#121215] border border-zinc-800 rounded-lg pl-8 pr-7 py-1.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-500 font-mono"
            />
          </div>
          <div className="flex items-center justify-between gap-1 overflow-x-auto no-scrollbar text-[11px] font-mono">
            <div className="flex items-center gap-1">
              {['ALL', 'RAW MATERIAL', 'FINISHED GOODS'].map((cat) => (
                <button
                  key={cat}
                  onClick={() => onCategoryFilterChange(cat)}
                  className={`px-2 py-0.5 rounded text-[10px] font-bold whitespace-nowrap transition-colors border ${
                    categoryFilter === cat
                      ? 'bg-white text-black border-white'
                      : 'bg-[#121215] text-zinc-400 border-zinc-800'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
            {/* Mobile Cloud sync button */}
            <button
              onClick={onManualSync}
              className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-zinc-900 border border-zinc-800 text-zinc-400 flex items-center gap-1"
            >
              <Cloud className={`w-2.5 h-2.5 ${isSyncing ? 'text-blue-400 animate-spin' : isPostgresConnected ? 'text-emerald-400' : 'text-zinc-400'}`} />
              <span>SYNC</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
