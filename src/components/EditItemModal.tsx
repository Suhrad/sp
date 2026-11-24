'use client';

import { useState } from 'react';
import { StockItem, GodownLocation } from '@/types/stock';
import { GODOWN_LOCATIONS } from '@/data/initialStock';
import { X, Check, Edit3 } from 'lucide-react';

interface EditItemModalProps {
  item: StockItem;
  onClose: () => void;
  onConfirm: (updatedItem: StockItem) => void;
}

export default function EditItemModal({
  item,
  onClose,
  onConfirm,
}: EditItemModalProps) {
  const locations = GODOWN_LOCATIONS.filter((l) => l !== 'All Locations') as GodownLocation[];

  const [name, setName] = useState(item.name);
  const [location, setLocation] = useState<GodownLocation>(item.location);
  const [totalBags, setTotalBags] = useState<number | ''>(item.totalBags);
  const [avgKgPerBag, setAvgKgPerBag] = useState<number>(item.avgKgPerBag || 25);
  const [kg, setKg] = useState<number | ''>(item.kg);
  const [price, setPrice] = useState<number | ''>(item.currentPrice);
  const [lowStockThresholdBags, setLowStockThresholdBags] = useState<number>(item.lowStockThresholdBags || 10);
  const [lowStockThresholdKg, setLowStockThresholdKg] = useState<number>(item.lowStockThresholdKg || 250);
  const [isBulk, setIsBulk] = useState(Boolean(item.isBulk));

  // Auto-sync KG when bags change if not bulk
  const handleBagsChange = (val: string) => {
    if (val === '') {
      setTotalBags('');
      return;
    }
    const num = Number(val);
    setTotalBags(num);
    if (!isBulk && avgKgPerBag > 0) {
      setKg(num * avgKgPerBag);
    }
  };

  const handleAvgKgChange = (val: number) => {
    setAvgKgPerBag(val);
    if (!isBulk && typeof totalBags === 'number') {
      setKg(totalBags * val);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const numBags = isBulk ? 0 : (typeof totalBags === 'number' ? totalBags : 0);
    const numKg = typeof kg === 'number' ? kg : (numBags * (avgKgPerBag || 25));
    const numPrice = typeof price === 'number' ? price : item.currentPrice;

    const priceChanged = numPrice !== item.currentPrice;

    const updated: StockItem = {
      ...item,
      name: name.trim(),
      location,
      totalBags: numBags,
      kg: numKg,
      avgKgPerBag: isBulk ? 0 : avgKgPerBag,
      currentPrice: numPrice,
      previousPrice: priceChanged ? item.currentPrice : item.previousPrice,
      lowStockThresholdBags,
      lowStockThresholdKg,
      isBulk,
      updatedAt: new Date().toISOString(),
      priceHistory: priceChanged ? [
        {
          id: 'ph-' + Date.now(),
          price: numPrice,
          changedAt: new Date().toISOString(),
          changedBy: 'Admin (Edit)',
          note: 'Price modified during item edit'
        },
        ...(item.priceHistory || [])
      ] : (item.priceHistory || [])
    };

    onConfirm(updated);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-lg bg-[#121215] border border-zinc-800 rounded-t-2xl sm:rounded-2xl p-5 shadow-2xl relative max-h-[90vh] overflow-y-auto">
        
        {/* Header */}
        <div className="flex items-start justify-between pb-3 border-b border-zinc-800">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center text-white">
              <Edit3 className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white font-sans">
                Edit Material Details
              </h2>
              <p className="text-xs text-zinc-400 font-mono">
                Update name, location, bag weights, and thresholds
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-zinc-500 hover:text-white hover:bg-zinc-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-3.5">
          
          {/* Item Name */}
          <div>
            <label className="block text-[11px] font-mono uppercase tracking-wider text-zinc-400 mb-1">
              Material / Item Name *
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. PP Mamri, Dharit Yellow Waste Dana"
              className="w-full bg-[#09090b] border border-zinc-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-white font-mono font-bold"
              autoFocus
            />
          </div>

          {/* Plant / Godown Location */}
          <div>
            <label className="block text-[11px] font-mono uppercase tracking-wider text-zinc-400 mb-1">
              Godown / Plant Location
            </label>
            <select
              value={location}
              onChange={(e) => setLocation(e.target.value as GodownLocation)}
              className="w-full bg-[#09090b] border border-zinc-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-white font-mono font-semibold"
            >
              {locations.map((loc) => (
                <option key={loc} value={loc} className="bg-[#121215] text-white">
                  {loc}
                </option>
              ))}
            </select>
          </div>

          {/* Bulk Checkbox */}
          <div className="flex items-center gap-2 pt-0.5">
            <input
              type="checkbox"
              id="bulkEditCheck"
              checked={isBulk}
              onChange={(e) => setIsBulk(e.target.checked)}
              className="w-3.5 h-3.5 rounded bg-zinc-900 border-zinc-800 text-white accent-white"
            />
            <label htmlFor="bulkEditCheck" className="text-xs font-mono text-zinc-400 cursor-pointer">
              Loose bulk material (no bag packaging)
            </label>
          </div>

          {/* Bags & Weight */}
          {!isBulk ? (
            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="block text-[10px] font-mono uppercase text-zinc-400 mb-1">
                  Bags
                </label>
                <input
                  type="number"
                  min="0"
                  value={totalBags}
                  onChange={(e) => handleBagsChange(e.target.value)}
                  className="w-full bg-[#09090b] border border-zinc-800 rounded-lg px-2.5 py-1.5 text-xs text-white font-mono font-bold focus:outline-none focus:border-white tabular-nums"
                />
              </div>

              <div>
                <label className="block text-[10px] font-mono uppercase text-zinc-400 mb-1">
                  KG / Bag
                </label>
                <select
                  value={avgKgPerBag}
                  onChange={(e) => handleAvgKgChange(Number(e.target.value))}
                  className="w-full bg-[#09090b] border border-zinc-800 rounded-lg px-2 py-1.5 text-xs text-white font-mono font-bold focus:outline-none focus:border-white"
                >
                  <option value={25}>25 KG</option>
                  <option value={20}>20 KG</option>
                  <option value={30}>30 KG</option>
                  <option value={50}>50 KG</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-mono uppercase text-zinc-400 mb-1">
                  Net KG
                </label>
                <input
                  type="number"
                  min="0"
                  value={kg}
                  onChange={(e) => setKg(e.target.value === '' ? '' : Number(e.target.value))}
                  className="w-full bg-[#09090b] border border-zinc-800 rounded-lg px-2.5 py-1.5 text-xs text-white font-mono font-bold focus:outline-none focus:border-white tabular-nums"
                />
              </div>
            </div>
          ) : (
            <div>
              <label className="block text-[11px] font-mono uppercase tracking-wider text-zinc-400 mb-1">
                Net Weight (KG)
              </label>
              <input
                type="number"
                min="0"
                value={kg}
                onChange={(e) => setKg(e.target.value === '' ? '' : Number(e.target.value))}
                className="w-full bg-[#09090b] border border-zinc-800 rounded-lg px-3 py-2 text-xs text-white font-mono font-bold focus:outline-none focus:border-white tabular-nums"
              />
            </div>
          )}

          {/* Rate / Price & Threshold */}
          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className="block text-[11px] font-mono uppercase tracking-wider text-zinc-400 mb-1">
                Rate (₹ / KG)
              </label>
              <input
                type="number"
                min="1"
                step="0.5"
                required
                value={price}
                onChange={(e) => setPrice(e.target.value === '' ? '' : Number(e.target.value))}
                className="w-full bg-[#09090b] border border-zinc-800 rounded-lg px-3 py-2 text-xs text-white font-mono font-bold focus:outline-none focus:border-white tabular-nums"
              />
            </div>

            <div>
              <label className="block text-[11px] font-mono uppercase tracking-wider text-zinc-400 mb-1">
                Low Stock Alert ({isBulk ? 'KG' : 'Bags'})
              </label>
              <input
                type="number"
                min="1"
                value={isBulk ? lowStockThresholdKg : lowStockThresholdBags}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  if (isBulk) {
                    setLowStockThresholdKg(val);
                  } else {
                    setLowStockThresholdBags(val);
                    setLowStockThresholdKg(val * (avgKgPerBag || 25));
                  }
                }}
                className="w-full bg-[#09090b] border border-zinc-800 rounded-lg px-3 py-2 text-xs text-white font-mono font-bold focus:outline-none focus:border-white tabular-nums"
              />
            </div>
          </div>

          {/* Live Valuation */}
          <div className="p-2.5 bg-[#09090b] rounded-lg border border-zinc-800 text-xs font-mono flex items-center justify-between">
            <span className="text-zinc-500">Calculated Valuation:</span>
            <span className="font-bold text-white tabular-nums">
              ₹{((typeof kg === 'number' ? kg : 0) * (typeof price === 'number' ? price : 0)).toLocaleString('en-IN')}
            </span>
          </div>

          {/* Submit */}
          <button
            type="submit"
            className="w-full py-2.5 rounded-lg font-mono font-bold text-xs uppercase tracking-wider text-black bg-white hover:bg-zinc-200 transition-all flex items-center justify-center gap-1.5"
          >
            <Check className="w-3.5 h-3.5" />
            <span>Save Changes</span>
          </button>
        </form>
      </div>
    </div>
  );
}
