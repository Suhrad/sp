'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { clearSession, UserSession } from '@/lib/auth';
import { 
  Boxes, 
  Search, 
  AlertTriangle, 
  Plus, 
  History, 
  Download, 
  Settings, 
  LogOut, 
  X,
  Layers
} from 'lucide-react';

interface HeaderProps {
  session: UserSession | null;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  lowStockOnly: boolean;
  onToggleLowStock: () => void;
  lowStockCount: number;
  onOpenAddItem: () => void;
  onOpenHistory: () => void;
  onOpenSettings: () => void;
  onExportCSV: () => void;
}

export default function Header({
  session,
  searchQuery,
  onSearchChange,
  lowStockOnly,
  onToggleLowStock,
  lowStockCount,
  onOpenAddItem,
  onOpenHistory,
  onOpenSettings,
  onExportCSV,
}: HeaderProps) {
  const router = useRouter();
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);

  const handleLogout = () => {
    if (confirm('Are you sure you want to log out of Stock Portal?')) {
      clearSession();
      router.replace('/login');
    }
  };

  return (
    <header className="sticky top-0 z-30 bg-slate-900/95 backdrop-blur-md border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 py-2.5">
        <div className="flex items-center justify-between gap-2 sm:gap-4">
          
          {/* Logo & Brand */}
          <div className="flex items-center gap-2.5 min-w-max">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center shadow-md shadow-emerald-500/20">
              <Boxes className="w-5 h-5 text-slate-950 stroke-[2.2]" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-base sm:text-lg text-white tracking-tight">
                  STOCK PORTAL
                </span>
                <span className="text-[10px] bg-emerald-500/10 text-emerald-400 font-semibold px-1.5 py-0.5 rounded border border-emerald-500/20">
                  LIVE
                </span>
              </div>
              <p className="text-[11px] text-slate-400 hidden sm:block">
                Godown & Plant Polymer Inventory
              </p>
            </div>
          </div>

          {/* Desktop Search Bar */}
          <div className="hidden md:flex flex-1 max-w-md mx-2">
            <div className="relative w-full">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                placeholder="Search dana, chips, powder, godown..."
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                className="w-full bg-slate-800/80 border border-slate-700 rounded-xl pl-9 pr-8 py-2 text-sm text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
              />
              {searchQuery && (
                <button
                  onClick={() => onSearchChange('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* Actions & Filters */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            {/* Mobile Search Toggle */}
            <button
              onClick={() => setMobileSearchOpen(!mobileSearchOpen)}
              className="md:hidden p-2 rounded-xl text-slate-300 hover:text-white bg-slate-800/80 border border-slate-700/60"
              title="Search items"
            >
              <Search className="w-4 h-4" />
            </button>

            {/* Low Stock Filter Button */}
            <button
              onClick={onToggleLowStock}
              className={`flex items-center gap-1 px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                lowStockOnly
                  ? 'bg-rose-500 text-white border-rose-400 shadow-lg shadow-rose-500/25 animate-pulse'
                  : 'bg-slate-800/80 text-rose-300 border-rose-500/30 hover:bg-rose-500/10'
              }`}
              title="Filter Low Stock Items"
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              <span className="hidden xs:inline">Low Stock</span>
              <span className="bg-rose-950/60 px-1.5 py-0.2 rounded-full text-[11px] font-bold text-rose-200">
                {lowStockCount}
              </span>
            </button>

            {/* Add Item Button */}
            <button
              onClick={onOpenAddItem}
              className="flex items-center gap-1 px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-semibold bg-emerald-500 text-slate-950 hover:bg-emerald-400 shadow-md shadow-emerald-500/20 active:scale-95 transition-all"
              title="Add New Stock Item"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span className="hidden sm:inline">Add Item</span>
            </button>

            {/* History Logs */}
            <button
              onClick={onOpenHistory}
              className="p-2 rounded-xl text-slate-300 hover:text-white bg-slate-800/80 border border-slate-700/60 hover:bg-slate-700/50 transition-all"
              title="Stock Movement History"
            >
              <History className="w-4 h-4" />
            </button>

            {/* Export CSV / Excel */}
            <button
              onClick={onExportCSV}
              className="p-2 rounded-xl text-slate-300 hover:text-white bg-slate-800/80 border border-slate-700/60 hover:bg-slate-700/50 transition-all hidden sm:flex"
              title="Export to Excel / CSV"
            >
              <Download className="w-4 h-4" />
            </button>

            {/* Settings */}
            <button
              onClick={onOpenSettings}
              className="p-2 rounded-xl text-slate-300 hover:text-white bg-slate-800/80 border border-slate-700/60 hover:bg-slate-700/50 transition-all"
              title="App Settings & Password"
            >
              <Settings className="w-4 h-4" />
            </button>

            {/* Logout */}
            <button
              onClick={handleLogout}
              className="p-2 rounded-xl text-rose-400 hover:text-rose-300 bg-rose-500/10 border border-rose-500/20 hover:bg-rose-500/20 transition-all"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Mobile Search Expansion */}
        {mobileSearchOpen && (
          <div className="mt-2 pt-2 border-t border-slate-800/80 md:hidden flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                autoFocus
                placeholder="Search dana, chips, powder..."
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-9 pr-8 py-2 text-sm text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
              />
              {searchQuery && (
                <button
                  onClick={() => onSearchChange('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
            <button
              onClick={() => {
                setMobileSearchOpen(false);
                onSearchChange('');
              }}
              className="text-xs text-slate-400 hover:text-white px-2 py-2"
            >
              Close
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
