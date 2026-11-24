export type GodownLocation =
  | 'Single Plant'
  | 'Bhayabhai Godown'
  | 'Ramu Plant'
  | 'Godown 1'
  | 'Godown 2'
  | 'Godown 3'
  | 'Yard / Other';

export interface PriceHistoryRecord {
  id: string;
  price: number;
  changedAt: string; // ISO date
  changedBy: string;
  note?: string;
}

export interface StockItem {
  id: string;
  name: string;
  location: GodownLocation;
  totalBags: number;
  kg: number;
  avgKgPerBag: number; // usually 25, or 20, or 0 if bulk loose
  currentPrice: number;
  previousPrice: number | null;
  lowStockThresholdBags: number; // default: 10 bags
  lowStockThresholdKg: number; // default: 250 kg
  isBulk?: boolean; // For items with no bags (e.g. WASTE, BOBIN YARN)
  updatedAt: string;
  priceHistory: PriceHistoryRecord[];
}

export type MovementType = 'INWARD' | 'OUTWARD' | 'TRANSFER' | 'PRICE_CHANGE' | 'CORRECTION';

export interface StockLog {
  id: string;
  timestamp: string;
  itemId: string;
  itemName: string;
  location: GodownLocation;
  type: MovementType;
  deltaBags?: number;
  deltaKg?: number;
  oldBags?: number;
  newBags?: number;
  oldKg?: number;
  newKg?: number;
  oldPrice?: number;
  newPrice?: number;
  targetLocation?: GodownLocation;
  reason?: string;
  performedBy: string;
}

export interface StockSummary {
  totalValuation: number;
  totalBags: number;
  totalKg: number;
  totalItems: number;
  lowStockCount: number;
}
