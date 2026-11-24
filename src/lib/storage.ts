import { StockItem, StockLog, GodownLocation, StockSummary } from '@/types/stock';
import { INITIAL_STOCK } from '@/data/initialStock';

const STORAGE_KEY_STOCK = 'polymer_stock_items_v1';
const STORAGE_KEY_LOGS = 'polymer_stock_logs_v1';

export function getStoredStock(): StockItem[] {
  if (typeof window === 'undefined') return INITIAL_STOCK;
  try {
    const data = localStorage.getItem(STORAGE_KEY_STOCK);
    if (!data) {
      localStorage.setItem(STORAGE_KEY_STOCK, JSON.stringify(INITIAL_STOCK));
      return INITIAL_STOCK;
    }
    return JSON.parse(data);
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
    localStorage.setItem(STORAGE_KEY_LOGS, JSON.stringify(logs.slice(0, 500))); // keep latest 500 entries
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
  const headers = ['Location', 'Name', 'Total Bags', "KG's", 'Price (₹/KG)', 'Total Value (₹)', 'Low Stock Status', 'Last Updated'];
  const rows = items.map(item => {
    const isLow = item.isBulk
      ? item.kg <= item.lowStockThresholdKg
      : item.totalBags <= item.lowStockThresholdBags;
    const value = item.kg * item.currentPrice;
    return [
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
