'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { StockItem, StockLog, GodownLocation } from '@/types/stock';
import { ProductionBatch, PlantName } from '@/types/batch';
import { INITIAL_STOCK } from '@/data/initialStock';
import { 
  getStoredStock, 
  saveStoredStock, 
  getStoredLogs, 
  saveStoredLogs, 
  getStoredBatches,
  saveStoredBatches,
  fetchCloudBatches,
  saveBatchToCloud,
  deleteBatchFromCloud,
  appendLog, 
  calculateSummary, 
  exportToCSV,
  fetchCloudInventory,
  syncItemToCloud,
  deleteItemFromCloud,
  resetCloudDatabase
} from '@/lib/storage';
import { getCurrentSession, UserSession } from '@/lib/auth';

import Header from '@/components/Header';
import SummaryCards from '@/components/SummaryCards';
import GodownTabs from '@/components/GodownTabs';
import StockTable from '@/components/StockTable';
import StockCard from '@/components/StockCard';
import AdjustModal from '@/components/AdjustModal';
import PriceModal from '@/components/PriceModal';
import TransferModal from '@/components/TransferModal';
import AddItemModal from '@/components/AddItemModal';
import EditItemModal from '@/components/EditItemModal';
import HistoryDrawer from '@/components/HistoryDrawer';
import SettingsModal from '@/components/SettingsModal';
import PlantMixingView from '@/components/PlantMixingView';
import AddBatchModal from '@/components/AddBatchModal';
import ImageLightboxModal from '@/components/ImageLightboxModal';

import { PackageOpen, Plus } from 'lucide-react';

export default function DashboardPage() {
  const router = useRouter();

  // Authentication
  const [session, setSession] = useState<UserSession | null>(null);
  const [authChecked, setAuthChecked] = useState(false);

  // Core Data
  const [items, setItems] = useState<StockItem[]>([]);
  const [logs, setLogs] = useState<StockLog[]>([]);

  // Plant Mixing Batches
  const [activeSection, setActiveSection] = useState<'inventory' | 'mixing'>('inventory');
  const [batches, setBatches] = useState<ProductionBatch[]>([]);
  const [addBatchOpen, setAddBatchOpen] = useState(false);
  const [editingBatch, setEditingBatch] = useState<ProductionBatch | null>(null);
  const [defaultBatchPlant, setDefaultBatchPlant] = useState<PlantName>('Single Plant');

  // Cloud Sync State
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [isPostgresConnected, setIsPostgresConnected] = useState<boolean>(false);

  // View & Filters
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');
  const [selectedLocation, setSelectedLocation] = useState<string>('All Locations');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [lowStockOnly, setLowStockOnly] = useState<boolean>(false);
  const [sortBy, setSortBy] = useState<'name' | 'bags-desc' | 'bags-asc' | 'value-desc' | 'price-desc'>('value-desc');

  // Modals
  const [adjustTarget, setAdjustTarget] = useState<{ item: StockItem; isPlus: boolean } | null>(null);
  const [priceTarget, setPriceTarget] = useState<StockItem | null>(null);
  const [transferTarget, setTransferTarget] = useState<StockItem | null>(null);
  const [editTarget, setEditTarget] = useState<StockItem | null>(null);
  const [addItemOpen, setAddItemOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [previewImage, setPreviewImage] = useState<{ url: string; title: string } | null>(null);

  // Sync with Cloud Database
  const syncWithCloud = useCallback(async () => {
    setIsSyncing(true);
    const cloudData = await fetchCloudInventory();
    if (cloudData) {
      if (cloudData.items && cloudData.items.length > 0) {
        setItems(cloudData.items);
        saveStoredStock(cloudData.items);
      }
      if (cloudData.logs && cloudData.logs.length > 0) {
        setLogs(cloudData.logs);
        saveStoredLogs(cloudData.logs);
      }
      setIsPostgresConnected(cloudData.postgresActive);
    }
    const cloudBatches = await fetchCloudBatches();
    if (cloudBatches) {
      setBatches(cloudBatches);
      saveStoredBatches(cloudBatches);
    }
    setIsSyncing(false);
  }, []);

  useEffect(() => {
    const curSession = getCurrentSession();
    if (!curSession) {
      router.replace('/login');
    } else {
      setSession(curSession);
      setAuthChecked(true);

      // Fast immediate cache load
      const cached = getStoredStock();
      setItems(cached);
      setLogs(getStoredLogs());
      setBatches(getStoredBatches());

      if (typeof window !== 'undefined' && window.innerWidth < 768) {
        setViewMode('cards');
      }

      // Initial cloud pull
      syncWithCloud();

      // Poll cloud database every 5 seconds for multi-device sync
      const interval = setInterval(syncWithCloud, 5000);

      // Sync immediately when switching back to tab/window
      const onFocus = () => syncWithCloud();
      window.addEventListener('focus', onFocus);

      return () => {
        clearInterval(interval);
        window.removeEventListener('focus', onFocus);
      };
    }
  }, [router, syncWithCloud]);

  const updateItems = (newItems: StockItem[]) => {
    setItems(newItems);
    saveStoredStock(newItems);
  };

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

    const logPayload = {
      itemId: item.id,
      itemName: item.name,
      location: item.location,
      type: deltaBags > 0 ? ('INWARD' as const) : ('OUTWARD' as const),
      deltaBags,
      deltaKg,
      oldBags,
      newBags,
      oldKg,
      newKg,
      reason: deltaBags > 0 ? `Quick +${deltaBags} bags` : `Quick ${deltaBags} bags dispatch`,
      performedBy: session?.username || 'Admin',
    };

    const log = appendLog(logPayload);
    setLogs((prev) => [log, ...prev]);

    // Background push to Cloud DB
    syncItemToCloud(updatedItem, logPayload);
  };

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

    const logPayload = {
      itemId: item.id,
      itemName: item.name,
      location: item.location,
      type: deltaBags >= 0 ? ('INWARD' as const) : ('OUTWARD' as const),
      deltaBags,
      deltaKg,
      oldBags,
      newBags,
      oldKg,
      newKg,
      reason,
      performedBy: session?.username || 'Admin',
    };

    const log = appendLog(logPayload);
    setLogs((prev) => [log, ...prev]);

    // Background push to Cloud DB
    syncItemToCloud(updatedItem, logPayload);
    setAdjustTarget(null);
  };

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

    const logPayload = {
      itemId: item.id,
      itemName: item.name,
      location: item.location,
      type: 'PRICE_CHANGE' as const,
      oldPrice,
      newPrice,
      reason: note || `Price updated: ₹${oldPrice} → ₹${newPrice}/kg`,
      performedBy: session?.username || 'Admin',
    };

    const log = appendLog(logPayload);
    setLogs((prev) => [log, ...prev]);

    // Background push to Cloud DB
    syncItemToCloud(updatedItem, logPayload);
    setPriceTarget(null);
  };

  const handleTransferConfirm = (
    item: StockItem,
    targetLocation: GodownLocation,
    transferBags: number,
    transferKg: number,
    note: string
  ) => {
    const newSourceBags = Math.max(0, item.totalBags - transferBags);
    const newSourceKg = Math.max(0, item.kg - transferKg);

    let updatedSource = {
      ...item,
      totalBags: newSourceBags,
      kg: newSourceKg,
      updatedAt: new Date().toISOString(),
    };

    let newItems = items.map((i) => (i.id === item.id ? updatedSource : i));

    const existingTargetIndex = newItems.findIndex(
      (i) => i.name.toLowerCase() === item.name.toLowerCase() && i.location === targetLocation
    );

    let updatedTarget: StockItem;

    if (existingTargetIndex >= 0) {
      const targetItem = newItems[existingTargetIndex];
      updatedTarget = {
        ...targetItem,
        totalBags: targetItem.totalBags + transferBags,
        kg: targetItem.kg + transferKg,
        updatedAt: new Date().toISOString(),
      };
      newItems[existingTargetIndex] = updatedTarget;
    } else {
      updatedTarget = {
        id: 'trans-' + Date.now(),
        name: item.name,
        location: targetLocation,
        category: item.category,
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
      newItems = [updatedTarget, ...newItems];
    }

    updateItems(newItems);

    const logPayload = {
      itemId: item.id,
      itemName: item.name,
      location: item.location,
      targetLocation,
      type: 'TRANSFER' as const,
      deltaBags: transferBags,
      deltaKg: transferKg,
      reason: note || `Transferred ${transferBags} bags from ${item.location} to ${targetLocation}`,
      performedBy: session?.username || 'Admin',
    };

    const log = appendLog(logPayload);
    setLogs((prev) => [log, ...prev]);

    // Push source and target to cloud
    syncItemToCloud(updatedSource);
    syncItemToCloud(updatedTarget, logPayload);

    setTransferTarget(null);
  };

  const handleEditConfirm = (updatedItem: StockItem) => {
    const oldItem = items.find((i) => i.id === updatedItem.id);
    const nameChanged = oldItem && oldItem.name !== updatedItem.name;
    const locationChanged = oldItem && oldItem.location !== updatedItem.location;

    const newItems = items.map((i) => (i.id === updatedItem.id ? updatedItem : i));
    updateItems(newItems);

    const logPayload = {
      itemId: updatedItem.id,
      itemName: updatedItem.name,
      location: updatedItem.location,
      type: 'CORRECTION' as const,
      reason: `Edited details${nameChanged ? ` (renamed from "${oldItem?.name}")` : ''}${locationChanged ? ` (moved from ${oldItem?.location})` : ''}`,
      performedBy: session?.username || 'Admin',
    };

    const log = appendLog(logPayload);
    setLogs((prev) => [log, ...prev]);

    // Push update to Cloud DB
    syncItemToCloud(updatedItem, logPayload);
    setEditTarget(null);
  };

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

    const logPayload = {
      itemId: newItem.id,
      itemName: newItem.name,
      location: newItem.location,
      type: 'INWARD' as const,
      deltaBags: newItem.totalBags,
      deltaKg: newItem.kg,
      reason: 'New stock item created',
      performedBy: session?.username || 'Admin',
    };

    const log = appendLog(logPayload);
    setLogs((prev) => [log, ...prev]);

    // Push new item to Cloud DB
    syncItemToCloud(newItem, logPayload);
    setAddItemOpen(false);
  };

  const handleDeleteItem = (item: StockItem) => {
    if (confirm(`Remove "${item.name}" from ${item.location}?`)) {
      const newItems = items.filter((i) => i.id !== item.id);
      updateItems(newItems);

      const logPayload = {
        itemId: item.id,
        itemName: item.name,
        location: item.location,
        type: 'OUTWARD' as const,
        deltaBags: -item.totalBags,
        deltaKg: -item.kg,
        reason: 'Item deleted from inventory',
        performedBy: session?.username || 'Admin',
      };

      const log = appendLog(logPayload);
      setLogs((prev) => [log, ...prev]);

      // Delete from Cloud DB
      deleteItemFromCloud(item.id, logPayload);
    }
  };

  const handleResetFactory = async () => {
    updateItems(INITIAL_STOCK);
    localStorage.removeItem('polymer_stock_logs_v4');
    setLogs([]);
    await resetCloudDatabase();
  };

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

  const handleImportJSON = (jsonStr: string) => {
    const parsed = JSON.parse(jsonStr);
    if (parsed.items && Array.isArray(parsed.items)) {
      updateItems(parsed.items);
      for (const it of parsed.items) {
        syncItemToCloud(it);
      }
      if (parsed.logs && Array.isArray(parsed.logs)) {
        saveStoredLogs(parsed.logs);
        setLogs(parsed.logs);
      }
    }
  };

  const handleAddBatch = (savedBatch: ProductionBatch) => {
    setBatches((prev) => {
      const exists = prev.some((b) => b.id === savedBatch.id);
      let updated: ProductionBatch[];
      if (exists) {
        updated = prev.map((b) => (b.id === savedBatch.id ? savedBatch : b));
      } else {
        updated = [savedBatch, ...prev];
      }
      saveStoredBatches(updated);
      return updated;
    });
    saveBatchToCloud(savedBatch);
    setEditingBatch(null);
  };

  const handleDeleteBatch = (id: string) => {
    setBatches((prev) => prev.filter((b) => b.id !== id));
    const updated = batches.filter((b) => b.id !== id);
    saveStoredBatches(updated);
    deleteBatchFromCloud(id);
  };

  const summary = useMemo(() => calculateSummary(items), [items]);

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      if (selectedLocation !== 'All Locations' && item.location !== selectedLocation) {
        return false;
      }
      if (categoryFilter === 'RAW MATERIAL' && item.category !== 'Raw Material') {
        return false;
      }
      if (categoryFilter === 'FINISHED GOODS' && item.category !== 'Finished Goods') {
        return false;
      }
      if (lowStockOnly) {
        const isLow = item.isBulk
          ? item.kg <= item.lowStockThresholdKg
          : item.totalBags <= item.lowStockThresholdBags;
        if (!isLow) return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          item.name.toLowerCase().includes(q) ||
          item.location.toLowerCase().includes(q) ||
          (item.category && item.category.toLowerCase().includes(q))
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
  }, [items, selectedLocation, categoryFilter, lowStockOnly, searchQuery, sortBy]);

  if (!authChecked) {
    return (
      <div className="min-h-screen bg-[#09090b] flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#09090b] text-zinc-100 flex flex-col font-sans">
      
      {/* Navigation Header */}
      <Header
        session={session}
        activeSection={activeSection}
        onSectionChange={setActiveSection}
        batchCount={batches.length}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        lowStockOnly={lowStockOnly}
        onToggleLowStock={() => setLowStockOnly(!lowStockOnly)}
        lowStockCount={summary.lowStockCount}
        categoryFilter={categoryFilter}
        onCategoryFilterChange={setCategoryFilter}
        onOpenAddItem={() => setAddItemOpen(true)}
        onOpenHistory={() => setHistoryOpen(true)}
        onOpenSettings={() => setSettingsOpen(true)}
        onExportCSV={handleExportCSV}
        viewMode={viewMode}
        onToggleViewMode={setViewMode}
        isSyncing={isSyncing}
        isPostgresConnected={isPostgresConnected}
        onManualSync={syncWithCloud}
      />

      {/* Main Workspace Container */}
      <main className="flex-1 w-full max-w-[1920px] mx-auto px-3 sm:px-6 lg:px-8 py-4 space-y-4">
        {activeSection === 'mixing' ? (
          <PlantMixingView
            batches={batches}
            stockItems={items}
            onOpenAddBatch={(plant) => {
              if (plant) setDefaultBatchPlant(plant);
              setEditingBatch(null);
              setAddBatchOpen(true);
            }}
            onEditBatch={(batch) => {
              setEditingBatch(batch);
              setAddBatchOpen(true);
            }}
            onDeleteBatch={handleDeleteBatch}
          />
        ) : (
          <>
            {/* Metric Bar */}
            <SummaryCards
              summary={summary}
              items={items}
              selectedLocation={selectedLocation}
              onSelectLocation={setSelectedLocation}
            />

        {/* Location Tabs */}
        <GodownTabs
          selectedLocation={selectedLocation}
          onSelectLocation={setSelectedLocation}
          items={items}
        />

        {/* Filter & Sorting Controls */}
        <div className="flex items-center justify-between gap-2 text-xs font-mono">
          <div className="text-zinc-500 flex items-center gap-2">
            <span>SHOWING <strong className="text-white">{filteredItems.length}</strong> LOTS</span>
            {categoryFilter !== 'ALL' && (
              <span className="text-zinc-300 bg-zinc-800 px-2 py-0.5 rounded text-[10px] font-bold">
                {categoryFilter}
              </span>
            )}
            {lowStockOnly && (
              <span className="text-red-400 bg-red-950 px-2 py-0.5 rounded border border-red-800 text-[10px] font-bold">
                LOW STOCK FILTER
              </span>
            )}
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-zinc-500 hidden sm:inline">SORT:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-[#121215] border border-zinc-800 rounded-lg px-2.5 py-1 text-zinc-300 text-xs font-mono focus:outline-none focus:border-zinc-500 cursor-pointer"
            >
              <option value="value-desc">VALUATION (HIGH → LOW)</option>
              <option value="bags-desc">BAGS (HIGH → LOW)</option>
              <option value="bags-asc">BAGS (LOW → HIGH)</option>
              <option value="price-desc">RATE (HIGH → LOW)</option>
              <option value="name">NAME (A-Z)</option>
            </select>
          </div>
        </div>

        {/* Main Content: Table View vs Card View */}
        {filteredItems.length === 0 ? (
          <div className="text-center py-16 bg-[#121215] border border-zinc-800 rounded-xl p-6 font-mono">
            <PackageOpen className="w-10 h-10 text-zinc-600 mx-auto mb-2.5 stroke-[1.5]" />
            <h3 className="text-sm font-bold text-white mb-1">
              NO INVENTORY RECORDS FOUND
            </h3>
            <p className="text-xs text-zinc-500 max-w-sm mx-auto mb-3">
              {lowStockOnly
                ? 'No items currently below low-stock threshold in this view.'
                : 'No items match your active search filter.'}
            </p>
            {lowStockOnly ? (
              <button
                onClick={() => setLowStockOnly(false)}
                className="px-3.5 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-bold rounded-lg transition-all"
              >
                Clear Filter
              </button>
            ) : (
              <button
                onClick={() => setAddItemOpen(true)}
                className="px-3.5 py-1.5 bg-white text-black text-xs font-bold rounded-lg transition-all"
              >
                + Register New Lot
              </button>
            )}
          </div>
        ) : (
          <>
            {/* Desktop View (Widescreen Table or Grid Cards) */}
            <div className="hidden md:block">
              {viewMode === 'table' ? (
                <StockTable
                  items={filteredItems}
                  onQuickAdjust={handleQuickAdjust}
                  onOpenCustomAdjust={(item, isPlus) => setAdjustTarget({ item, isPlus })}
                  onOpenPriceUpdate={(item) => setPriceTarget(item)}
                  onOpenTransfer={(item) => setTransferTarget(item)}
                  onOpenEditItem={(item) => setEditTarget(item)}
                  onDelete={handleDeleteItem}
                  onPreviewImage={(url, title) => setPreviewImage({ url, title })}
                />
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                  {filteredItems.map((item) => (
                    <StockCard
                      key={item.id}
                      item={item}
                      onQuickAdjust={handleQuickAdjust}
                      onOpenCustomAdjust={(item, isPlus) => setAdjustTarget({ item, isPlus })}
                      onOpenPriceUpdate={(item) => setPriceTarget(item)}
                      onOpenTransfer={(item) => setTransferTarget(item)}
                      onOpenEditItem={(item) => setEditTarget(item)}
                      onDelete={handleDeleteItem}
                      onPreviewImage={(url, title) => setPreviewImage({ url, title })}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Mobile View (100% Zero Horizontal Scroll - Dedicated Touch Cards) */}
            <div className="block md:hidden space-y-2.5">
              {filteredItems.map((item) => (
                <StockCard
                  key={item.id}
                  item={item}
                  onQuickAdjust={handleQuickAdjust}
                  onOpenCustomAdjust={(item, isPlus) => setAdjustTarget({ item, isPlus })}
                  onOpenPriceUpdate={(item) => setPriceTarget(item)}
                  onOpenTransfer={(item) => setTransferTarget(item)}
                  onOpenEditItem={(item) => setEditTarget(item)}
                  onDelete={handleDeleteItem}
                  onPreviewImage={(url, title) => setPreviewImage({ url, title })}
                />
              ))}
            </div>
          </>
        )}
      </>
    )}
  </main>

  {/* Floating Add on Mobile */}
  <div className="fixed bottom-4 right-4 sm:hidden z-30">
    <button
      onClick={() => {
        if (activeSection === 'mixing') {
          setEditingBatch(null);
          setAddBatchOpen(true);
        } else {
          setAddItemOpen(true);
        }
      }}
      className="w-12 h-12 rounded-full bg-white text-black flex items-center justify-center shadow-xl active:scale-95 transition-all"
      title={activeSection === 'mixing' ? 'New Mixer Batch' : 'Add New Lot'}
    >
      <Plus className="w-6 h-6 stroke-[2.5]" />
    </button>
  </div>

  {/* Modals */}
  {addBatchOpen && (
    <AddBatchModal
      onClose={() => {
        setAddBatchOpen(false);
        setEditingBatch(null);
      }}
      onSaveBatch={handleAddBatch}
      stockItems={items}
      defaultPlant={defaultBatchPlant}
      initialBatch={editingBatch}
    />
  )}
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

      {editTarget && (
        <EditItemModal
          item={editTarget}
          onClose={() => setEditTarget(null)}
          onConfirm={handleEditConfirm}
        />
      )}

      {addItemOpen && (
        <AddItemModal
          onClose={() => setAddItemOpen(false)}
          onAdd={handleAddItem}
          existingItems={items}
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
          isPostgresConnected={isPostgresConnected}
          onManualSync={syncWithCloud}
        />
      )}

      {previewImage && (
        <ImageLightboxModal
          imageUrl={previewImage.url}
          title={previewImage.title}
          onClose={() => setPreviewImage(null)}
        />
      )}
    </div>
  );
}
