'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { StockItem, StockLog, GodownLocation } from '@/types/stock';
import { INITIAL_STOCK } from '@/data/initialStock';
import { 
  getStoredStock, 
  saveStoredStock, 
  getStoredLogs, 
  saveStoredLogs, 
  appendLog, 
  calculateSummary, 
  exportToCSV 
} from '@/lib/storage';
import { getCurrentSession, UserSession } from '@/lib/auth';

import Header from '@/components/Header';
import SummaryCards from '@/components/SummaryCards';
import GodownTabs from '@/components/GodownTabs';
import StockCard from '@/components/StockCard';
import AdjustModal from '@/components/AdjustModal';
import PriceModal from '@/components/PriceModal';
import TransferModal from '@/components/TransferModal';
import AddItemModal from '@/components/AddItemModal';
import HistoryDrawer from '@/components/HistoryDrawer';
import SettingsModal from '@/components/SettingsModal';

import { ArrowUpDown, SlidersHorizontal, PackageOpen, Plus } from 'lucide-react';

export default function DashboardPage() {
  const router = useRouter();

  // Authentication & User Session
  const [session, setSession] = useState<UserSession | null>(null);
  const [authChecked, setAuthChecked] = useState(false);

  // Core Data
  const [items, setItems] = useState<StockItem[]>([]);
  const [logs, setLogs] = useState<StockLog[]>([]);

  // Filters & Controls
  const [selectedLocation, setSelectedLocation] = useState<string>('All Locations');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [lowStockOnly, setLowStockOnly] = useState<boolean>(false);
  const [sortBy, setSortBy] = useState<'name' | 'bags-desc' | 'bags-asc' | 'value-desc' | 'price-desc'>('value-desc');

  // Modals
  const [adjustTarget, setAdjustTarget] = useState<{ item: StockItem; isPlus: boolean } | null>(null);
  const [priceTarget, setPriceTarget] = useState<StockItem | null>(null);
  const [transferTarget, setTransferTarget] = useState<StockItem | null>(null);
  const [addItemOpen, setAddItemOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  // Check login on mount
  useEffect(() => {
    const curSession = getCurrentSession();
    if (!curSession) {
      router.replace('/login');
    } else {
      setSession(curSession);
      setAuthChecked(true);
      // Load data
      const stored = getStoredStock();
      setItems(stored);
      setLogs(getStoredLogs());
    }
  }, [router]);

  // Persist items whenever changed
  const updateItems = (newItems: StockItem[]) => {
    setItems(newItems);
    saveStoredStock(newItems);
  };

  // Quick single-tap adjustment (+1, -1, +5, etc.)
  const handleQuickAdjust = (item: StockItem, deltaBags: number) => {
    const oldBags = item.totalBags;
    const oldKg = item.kg;
    const newBags = Math.max(0, oldBags + deltaBags);
    const avgKg = item.avgKgPerBag || 25;
    const newKg = Math.max(0, item.isBulk ? oldKg + deltaBags * avgKg : newBags * avgKg);
    const deltaKg = newKg - oldKg;

    const updatedItem: StockItem = {
      ...item,
      totalBags: newBags,
      kg: newKg,
      updatedAt: new Date().toISOString(),
    };

    const newItems = items.map((i) => (i.id === item.id ? updatedItem : i));
    updateItems(newItems);

    const log = appendLog({
      itemId: item.id,
      itemName: item.name,
      location: item.location,
      type: deltaBags > 0 ? 'INWARD' : 'OUTWARD',
      deltaBags,
      deltaKg,
      oldBags,
      newBags,
      oldKg,
      newKg,
      reason: deltaBags > 0 ? `Quick +${deltaBags} bags` : `Quick ${deltaBags} bags dispatch`,
      performedBy: session?.username || 'Admin',
    });

    setLogs((prev) => [log, ...prev]);
  };

  // Detailed Modal Custom Adjustment
  const handleCustomAdjustConfirm = (
    item: StockItem,
    deltaBags: number,
    deltaKg: number,
    reason: string
  ) => {
    const oldBags = item.totalBags;
    const oldKg = item.kg;
    const newBags = Math.max(0, oldBags + deltaBags);
    const newKg = Math.max(0, oldKg + deltaKg);

    const updatedItem: StockItem = {
      ...item,
      totalBags: newBags,
      kg: newKg,
      updatedAt: new Date().toISOString(),
    };

    const newItems = items.map((i) => (i.id === item.id ? updatedItem : i));
    updateItems(newItems);

    const log = appendLog({
      itemId: item.id,
      itemName: item.name,
      location: item.location,
      type: deltaBags >= 0 ? 'INWARD' : 'OUTWARD',
      deltaBags,
      deltaKg,
      oldBags,
      newBags,
      oldKg,
      newKg,
      reason,
      performedBy: session?.username || 'Admin',
    });

    setLogs((prev) => [log, ...prev]);
    setAdjustTarget(null);
  };

  // Price update with history
  const handlePriceConfirm = (item: StockItem, newPrice: number, note: string) => {
    const oldPrice = item.currentPrice;
    const now = new Date().toISOString();

    const newHistoryRecord = {
      id: 'ph-' + Date.now(),
      price: newPrice,
      changedAt: now,
      changedBy: session?.username || 'Admin',
      note: note || undefined,
    };

    const updatedItem: StockItem = {
      ...item,
      previousPrice: oldPrice,
      currentPrice: newPrice,
      updatedAt: now,
      priceHistory: [newHistoryRecord, ...(item.priceHistory || [])],
    };

    const newItems = items.map((i) => (i.id === item.id ? updatedItem : i));
    updateItems(newItems);

    const log = appendLog({
      itemId: item.id,
      itemName: item.name,
      location: item.location,
      type: 'PRICE_CHANGE',
      oldPrice,
      newPrice,
      reason: note || `Price updated: ₹${oldPrice} → ₹${newPrice}/kg`,
      performedBy: session?.username || 'Admin',
    });

    setLogs((prev) => [log, ...prev]);
    setPriceTarget(null);
  };

  // Transfer stock between godowns
  const handleTransferConfirm = (
    item: StockItem,
    targetLocation: GodownLocation,
    transferBags: number,
    transferKg: number,
    note: string
  ) => {
    // 1. Deduct from source item
    const newSourceBags = Math.max(0, item.totalBags - transferBags);
    const newSourceKg = Math.max(0, item.kg - transferKg);

    let updatedSource = {
      ...item,
      totalBags: newSourceBags,
      kg: newSourceKg,
      updatedAt: new Date().toISOString(),
    };

    let newItems = items.map((i) => (i.id === item.id ? updatedSource : i));

    // 2. Add to target godown (find if already exists or create new)
    const existingTargetIndex = newItems.findIndex(
      (i) => i.name.toLowerCase() === item.name.toLowerCase() && i.location === targetLocation
    );

    if (existingTargetIndex >= 0) {
      const targetItem = newItems[existingTargetIndex];
      const updatedTarget = {
        ...targetItem,
        totalBags: targetItem.totalBags + transferBags,
        kg: targetItem.kg + transferKg,
        updatedAt: new Date().toISOString(),
      };
      newItems[existingTargetIndex] = updatedTarget;
    } else {
      // Create new lot in destination godown
      const newLot: StockItem = {
        id: 'trans-' + Date.now(),
        name: item.name,
        location: targetLocation,
        totalBags: transferBags,
        kg: transferKg,
        avgKgPerBag: item.avgKgPerBag,
        currentPrice: item.currentPrice,
        previousPrice: null,
        lowStockThresholdBags: item.lowStockThresholdBags,
        lowStockThresholdKg: item.lowStockThresholdKg,
        updatedAt: new Date().toISOString(),
        priceHistory: [{ id: 'ph-' + Date.now(), price: item.currentPrice, changedAt: new Date().toISOString(), changedBy: session?.username || 'Transfer' }],
      };
      newItems = [newLot, ...newItems];
    }

    updateItems(newItems);

    const log = appendLog({
      itemId: item.id,
      itemName: item.name,
      location: item.location,
      targetLocation,
      type: 'TRANSFER',
      deltaBags: transferBags,
      deltaKg: transferKg,
      reason: note || `Transferred ${transferBags} bags from ${item.location} to ${targetLocation}`,
      performedBy: session?.username || 'Admin',
    });

    setLogs((prev) => [log, ...prev]);
    setTransferTarget(null);
  };

  // Add new item
  const handleAddItem = (data: Omit<StockItem, 'id' | 'updatedAt' | 'priceHistory'>) => {
    const now = new Date().toISOString();
    const newItem: StockItem = {
      ...data,
      id: 'custom-' + Date.now(),
      updatedAt: now,
      priceHistory: [{
        id: 'ph-' + Date.now(),
        price: data.currentPrice,
        changedAt: now,
        changedBy: session?.username || 'Admin',
      }],
    };

    const newItems = [newItem, ...items];
    updateItems(newItems);

    const log = appendLog({
      itemId: newItem.id,
      itemName: newItem.name,
      location: newItem.location,
      type: 'INWARD',
      deltaBags: newItem.totalBags,
      deltaKg: newItem.kg,
      reason: 'New stock item created',
      performedBy: session?.username || 'Admin',
    });

    setLogs((prev) => [log, ...prev]);
    setAddItemOpen(false);
  };

  // Delete item
  const handleDeleteItem = (item: StockItem) => {
    if (confirm(`Are you sure you want to delete "${item.name}" from ${item.location}?`)) {
      const newItems = items.filter((i) => i.id !== item.id);
      updateItems(newItems);

      const log = appendLog({
        itemId: item.id,
        itemName: item.name,
        location: item.location,
        type: 'OUTWARD',
        deltaBags: -item.totalBags,
        deltaKg: -item.kg,
        reason: 'Item deleted from inventory',
        performedBy: session?.username || 'Admin',
      });
      setLogs((prev) => [log, ...prev]);
    }
  };

  // Reset to original factory sheet
  const handleResetFactory = () => {
    updateItems(INITIAL_STOCK);
    localStorage.removeItem('polymer_stock_logs_v1');
    setLogs([]);
  };

  // Export CSV
  const handleExportCSV = () => {
    const csv = exportToCSV(items);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `polymer_stock_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Export JSON Backup
  const handleExportJSON = () => {
    const data = {
      exportedAt: new Date().toISOString(),
      items,
      logs,
    };
    const jsonStr = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `polymer_backup_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Import JSON Backup
  const handleImportJSON = (jsonStr: string) => {
    const parsed = JSON.parse(jsonStr);
    if (parsed.items && Array.isArray(parsed.items)) {
      updateItems(parsed.items);
      if (parsed.logs && Array.isArray(parsed.logs)) {
        saveStoredLogs(parsed.logs);
        setLogs(parsed.logs);
      }
    }
  };

  // Live Summary Calculation
  const summary = useMemo(() => calculateSummary(items), [items]);

  // Filter & Sort Items
  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      // Location filter
      if (selectedLocation !== 'All Locations' && item.location !== selectedLocation) {
        return false;
      }

      // Low Stock filter
      if (lowStockOnly) {
        const isLow = item.isBulk
          ? item.kg <= item.lowStockThresholdKg
          : item.totalBags <= item.lowStockThresholdBags;
        if (!isLow) return false;
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          item.name.toLowerCase().includes(q) ||
          item.location.toLowerCase().includes(q)
        );
      }

      return true;
    }).sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'bags-desc':
          return b.totalBags - a.totalBags;
        case 'bags-asc':
          return a.totalBags - b.totalBags;
        case 'value-desc':
          return (b.kg * b.currentPrice) - (a.kg * a.currentPrice);
        case 'price-desc':
          return b.currentPrice - a.currentPrice;
        default:
          return 0;
      }
    });
  }, [items, selectedLocation, lowStockOnly, searchQuery, sortBy]);

  // Loading state while checking auth
  if (!authChecked) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="w-8 h-8 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      
      {/* Sticky Header */}
      <Header
        session={session}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        lowStockOnly={lowStockOnly}
        onToggleLowStock={() => setLowStockOnly(!lowStockOnly)}
        lowStockCount={summary.lowStockCount}
        onOpenAddItem={() => setAddItemOpen(true)}
        onOpenHistory={() => setHistoryOpen(true)}
        onOpenSettings={() => setSettingsOpen(true)}
        onExportCSV={handleExportCSV}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 py-4 space-y-4">
        
        {/* Metric Summary Cards */}
        <SummaryCards
          summary={summary}
          items={items}
          selectedLocation={selectedLocation}
          onSelectLocation={setSelectedLocation}
        />

        {/* Godown Pills / Horizontal Tabs */}
        <GodownTabs
          selectedLocation={selectedLocation}
          onSelectLocation={setSelectedLocation}
          items={items}
        />

        {/* Filter Bar & Sort Controls */}
        <div className="flex items-center justify-between gap-2 text-xs">
          <div className="text-slate-400 font-semibold flex items-center gap-1.5">
            <span>Showing <strong className="text-white">{filteredItems.length}</strong> items</span>
            {lowStockOnly && (
              <span className="text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded-full border border-rose-500/20 font-bold">
                Low Stock Filter Active
              </span>
            )}
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-slate-500 hidden sm:inline">Sort:</span>
            <div className="relative">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="bg-slate-850 border border-slate-800 rounded-xl px-2.5 py-1.5 text-slate-300 hover:text-white text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-emerald-500 cursor-pointer"
              >
                <option value="value-desc">Highest Value (₹)</option>
                <option value="bags-desc">Bags: High → Low</option>
                <option value="bags-asc">Bags: Low → High</option>
                <option value="price-desc">Price: High → Low</option>
                <option value="name">Name (A-Z)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Stock Items Grid */}
        {filteredItems.length === 0 ? (
          <div className="text-center py-16 bg-slate-900/40 border border-slate-800/80 rounded-3xl p-6">
            <PackageOpen className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <h3 className="text-base font-bold text-white mb-1">
              No stock items found
            </h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto mb-4">
              {lowStockOnly
                ? 'No items are currently below low stock thresholds in this view.'
                : 'No items match your active filters or search terms.'}
            </p>
            {lowStockOnly ? (
              <button
                onClick={() => setLowStockOnly(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-xs font-bold text-white rounded-xl transition-all"
              >
                Clear Low Stock Filter
              </button>
            ) : (
              <button
                onClick={() => setAddItemOpen(true)}
                className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold rounded-xl transition-all inline-flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4 stroke-[2.5]" />
                <span>Add New Item Here</span>
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 pb-12">
            {filteredItems.map((item) => (
              <StockCard
                key={item.id}
                item={item}
                onQuickAdjust={handleQuickAdjust}
                onOpenCustomAdjust={(item, isPlus) => setAdjustTarget({ item, isPlus })}
                onOpenPriceUpdate={(item) => setPriceTarget(item)}
                onOpenTransfer={(item) => setTransferTarget(item)}
                onDelete={handleDeleteItem}
              />
            ))}
          </div>
        )}
      </main>

      {/* Floating Action Button on Mobile */}
      <div className="fixed bottom-4 right-4 sm:hidden z-30">
        <button
          onClick={() => setAddItemOpen(true)}
          className="w-14 h-14 rounded-full bg-emerald-500 text-slate-950 flex items-center justify-center shadow-xl shadow-emerald-500/40 active:scale-95 transition-all"
          title="Add New Stock Item"
        >
          <Plus className="w-7 h-7 stroke-[2.5]" />
        </button>
      </div>

      {/* Modals */}
      {adjustTarget && (
        <AdjustModal
          item={adjustTarget.item}
          initialPlus={adjustTarget.isPlus}
          onClose={() => setAdjustTarget(null)}
          onConfirm={handleCustomAdjustConfirm}
        />
      )}

      {priceTarget && (
        <PriceModal
          item={priceTarget}
          onClose={() => setPriceTarget(null)}
          onConfirm={handlePriceConfirm}
        />
      )}

      {transferTarget && (
        <TransferModal
          item={transferTarget}
          onClose={() => setTransferTarget(null)}
          onConfirm={handleTransferConfirm}
        />
      )}

      {addItemOpen && (
        <AddItemModal
          onClose={() => setAddItemOpen(false)}
          onAdd={handleAddItem}
        />
      )}

      {historyOpen && (
        <HistoryDrawer
          logs={logs}
          onClose={() => setHistoryOpen(false)}
        />
      )}

      {settingsOpen && (
        <SettingsModal
          onClose={() => setSettingsOpen(false)}
          onResetFactoryData={handleResetFactory}
          onExportCSV={handleExportCSV}
          onExportJSON={handleExportJSON}
          onImportJSON={handleImportJSON}
          items={items}
        />
      )}
    </div>
  );
}
