export type PlantName = 'Single Plant' | 'Ramu Plant';

export interface BatchItem {
  id: string;
  itemId?: string;
  materialName: string;
  bowls: number;
  kgPerBowl: number;
  totalKg: number;
  ratePerKg?: number;
  sourceGodown?: string;
}

export interface ProductionBatch {
  id: string;
  batchNumber: string;
  plant: PlantName;
  date: string; // YYYY-MM-DD
  time?: string; // HH:mm
  shift?: 'Morning' | 'Day' | 'Night';
  targetProduct?: string; // e.g., "Gop Dori 16 TAR", "Bo PP"
  operator?: string;
  notes?: string;
  items: BatchItem[];
  totalBowls: number;
  totalKg: number;
  totalCost?: number;
  createdAt: string;
}
