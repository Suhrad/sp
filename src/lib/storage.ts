import { StockItem, StockLog, GodownLocation, StockSummary } from '@/types/stock';
import { ProductionBatch } from '@/types/batch';
import { INITIAL_STOCK } from '@/data/initialStock';

const STORAGE_KEY_STOCK = 'polymer_stock_items_v4';
const STORAGE_KEY_LOGS = 'polymer_stock_logs_v4';
const STORAGE_KEY_BATCHES = 'polymer_plant_batches_v1';

export function getStoredStock(): StockItem[] {
  if (typeof window === 'undefined') return INITIAL_STOCK;
  try {
    const data = localStorage.getItem(STORAGE_KEY_STOCK);
    if (!data) {
      localStorage.setItem(STORAGE_KEY_STOCK, JSON.stringify(INITIAL_STOCK));
      return INITIAL_STOCK;
    }
    const items: StockItem[] = JSON.parse(data);
    return items.map((item) => {
      if (!item.category) {
        const found = INITIAL_STOCK.find((i) => i.id === item.id);
        item.category = found?.category || 'Raw Material';
      }
      if (item.id.startsWith('g1-fg-') || item.id.startsWith('g1-rm-')) {
        item.location = 'Outside Godown 1';
      } else if (item.id.startsWith('g3-fg-') || item.id.startsWith('g3-rm-')) {
        item.location = 'Outside Godown 2';
      }
      return item;
    });
  } catch (err) {
    console.error('Failed to read stock from localStorage', err);
    return INITIAL_STOCK;
  }
}

export function saveStoredStock(items: StockItem[]) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY_STOCK, JSON.stringify(items));
  } catch (err) {
    console.error('Failed to save stock to localStorage', err);
  }
}

export function getStoredLogs(): StockLog[] {
  if (typeof window === 'undefined') return [];
  try {
    const data = localStorage.getItem(STORAGE_KEY_LOGS);
    return data ? JSON.parse(data) : [];
  } catch (err) {
    console.error('Failed to read logs from localStorage', err);
    return [];
  }
}

export function saveStoredLogs(logs: StockLog[]) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY_LOGS, JSON.stringify(logs.slice(0, 500)));
  } catch (err) {
    console.error('Failed to save logs to localStorage', err);
  }
}

export function appendLog(log: Omit<StockLog, 'id' | 'timestamp'>) {
  const currentLogs = getStoredLogs();
  const newLog: StockLog = {
    ...log,
    id: 'log-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
    timestamp: new Date().toISOString(),
  };
  saveStoredLogs([newLog, ...currentLogs]);
  return newLog;
}

export function getStoredBatches(): ProductionBatch[] {
  if (typeof window === 'undefined') return [];
  try {
    const data = localStorage.getItem(STORAGE_KEY_BATCHES);
    return data ? JSON.parse(data) : [];
  } catch (err) {
    console.error('Failed to read batches from localStorage', err);
    return [];
  }
}

export function saveStoredBatches(batches: ProductionBatch[]) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY_BATCHES, JSON.stringify(batches));
  } catch (err) {
    console.error('Failed to save batches to localStorage', err);
  }
}

export async function fetchCloudBatches(): Promise<ProductionBatch[] | null> {
  try {
    const res = await fetch('/api/batches');
    if (!res.ok) return null;
    const data = await res.json();
    return data.batches || [];
  } catch (err) {
    console.warn('Failed to fetch batches from cloud:', err);
    return null;
  }
}

export async function saveBatchToCloud(batch: ProductionBatch): Promise<void> {
  try {
    await fetch('/api/batches', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'SAVE_BATCH',
        batch,
      }),
    });
  } catch (err) {
    console.warn('Background cloud sync failed for batch:', batch.id);
  }
}

export async function deleteBatchFromCloud(id: string): Promise<void> {
  try {
    await fetch('/api/batches', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'DELETE_BATCH',
        id,
      }),
    });
  } catch (err) {
    console.warn('Background cloud delete failed for batch:', id);
  }
}

// -------------------------------------------------------------
// Real-Time Cloud Sync API Integration
// -------------------------------------------------------------

export async function fetchCloudInventory(): Promise<{
  items: StockItem[];
  logs: StockLog[];
  postgresActive: boolean;
} | null> {
  try {
    const res = await fetch('/api/inventory', {
      headers: { 'Cache-Control': 'no-cache' },
    });
    if (!res.ok) return null;
    const data = await res.json();
    if (data.success && Array.isArray(data.items)) {
      return {
        items: data.items,
        logs: Array.isArray(data.logs) ? data.logs : [],
        postgresActive: Boolean(data.postgresActive),
      };
    }
  } catch (err) {
    console.warn('Could not sync with cloud DB, using local copy:', err);
  }
  return null;
}

export async function syncItemToCloud(item: StockItem, log?: Omit<StockLog, 'id' | 'timestamp'>) {
  try {
    await fetch('/api/inventory', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'UPSERT_ITEM',
        item,
        log,
      }),
    });
  } catch (err) {
    console.warn('Background cloud sync failed for item:', item.name);
  }
}

export async function deleteItemFromCloud(id: string, log?: Omit<StockLog, 'id' | 'timestamp'>) {
  try {
    await fetch('/api/inventory', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'DELETE_ITEM',
        id,
        log,
      }),
    });
  } catch (err) {
    console.warn('Background cloud sync failed for delete:', id);
  }
}

export async function resetCloudDatabase(): Promise<boolean> {
  try {
    const res = await fetch('/api/inventory/reset', { method: 'POST' });
    return res.ok;
  } catch (err) {
    return false;
  }
}

export function calculateSummary(items: StockItem[]): StockSummary {
  let totalValuation = 0;
  let totalBags = 0;
  let totalKg = 0;
  let lowStockCount = 0;

  for (const item of items) {
    totalValuation += item.kg * item.currentPrice;
    totalBags += item.totalBags || 0;
    totalKg += item.kg || 0;

    const isLow = item.isBulk
      ? item.kg <= item.lowStockThresholdKg
      : item.totalBags <= item.lowStockThresholdBags;

    if (isLow) {
      lowStockCount++;
    }
  }

  return {
    totalValuation,
    totalBags,
    totalKg,
    totalItems: items.length,
    lowStockCount,
  };
}

export function exportToCSV(items: StockItem[]): string {
  const headers = ['Category', 'Location', 'Name', 'Total Bags', "KG's", 'Price (₹/KG)', 'Total Value (₹)', 'Low Stock Status', 'Last Updated'];
  const rows = items.map(item => {
    const isLow = item.isBulk
      ? item.kg <= item.lowStockThresholdKg
      : item.totalBags <= item.lowStockThresholdBags;
    const value = item.kg * item.currentPrice;
    return [
      `"${item.category || 'Raw Material'}"`,
      `"${item.location}"`,
      `"${item.name.replace(/"/g, '""')}"`,
      item.totalBags,
      item.kg,
      item.currentPrice,
      value,
      isLow ? 'LOW STOCK' : 'OK',
      `"${new Date(item.updatedAt).toLocaleDateString()}"`
    ].join(',');
  });

  return [headers.join(','), ...rows].join('\n');
}
