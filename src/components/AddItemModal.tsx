'use client';

import { useState } from 'react';
import { StockItem, GodownLocation, ItemCategory } from '@/types/stock';
import { GODOWN_LOCATIONS } from '@/data/initialStock';
import { X, Plus } from 'lucide-react';

interface AddItemModalProps {
  onClose: () => void;
  onAdd: (item: Omit<StockItem, 'id' | 'updatedAt' | 'priceHistory'>) => void;
}

export default function AddItemModal({ onClose, onAdd }: AddItemModalProps) {
  const locations = GODOWN_LOCATIONS.filter((l) => l !== 'All Locations') as GodownLocation[];

  const [name, setName] = useState('');
  const [location, setLocation] = useState<GodownLocation>('Godown 1');
  const [category, setCategory] = useState<ItemCategory>('Raw Material');
  const [totalBags, setTotalBags] = useState<number | ''>(10);
  const [avgKgPerBag, setAvgKgPerBag] = useState<number>(25);
  const [price, setPrice] = useState<number | ''>(75);
  const [lowStockThreshold, setLowStockThreshold] = useState<number>(10);
  const [isBulk, setIsBulk] = useState(false);
  const [bulkKg, setBulkKg] = useState<number | ''>(500);

  const calculatedKg = isBulk
    ? (typeof bulkKg === 'number' ? bulkKg : 0)
    : (typeof totalBags === 'number' ? totalBags : 0) * avgKgPerBag;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || typeof price !== 'number' || price <= 0) return;

    onAdd({
      name: name.trim(),
      location,
      category,
      totalBags: isBulk ? 0 : (typeof totalBags === 'number' ? totalBags : 0),
      kg: calculatedKg,
      avgKgPerBag: isBulk ? 0 : avgKgPerBag,
      currentPrice: price,
      previousPrice: null,
      lowStockThresholdBags: isBulk ? 0 : lowStockThreshold,
      lowStockThresholdKg: isBulk ? (typeof bulkKg === 'number' ? Math.round(bulkKg * 0.2) : 100) : lowStockThreshold * avgKgPerBag,
      isBulk,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-sm">
      <div className="w-full max-w-md bg-[#121215] border border-zinc-800 rounded-t-2xl sm:rounded-2xl p-5 shadow-2xl relative">
        
        {/* Header */}
        <div className="flex items-start justify-between pb-3 border-b border-zinc-800">
          <div>
            <h2 className="text-base font-bold text-white font-sans">
              Register New Stock Lot
            </h2>
            <p className="text-xs text-zinc-400 font-mono">
              Add raw material, chips, powder or finished goods
            </p>
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
              Material Name *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Gop Dori - 16 TAR - 500g"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-[#09090b] border border-zinc-800 rounded-lg px-3 py-2 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-white font-mono font-semibold"
              autoFocus
            />
          </div>

          {/* Category & Location */}
          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className="block text-[11px] font-mono uppercase tracking-wider text-zinc-400 mb-1">
                Classification *
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as ItemCategory)}
                className="w-full bg-[#09090b] border border-zinc-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-white font-mono font-semibold"
              >
                <option value="Raw Material" className="bg-[#121215]">Raw Material</option>
                <option value="Finished Goods" className="bg-[#121215]">Finished Goods</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-mono uppercase tracking-wider text-zinc-400 mb-1">
                Location *
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
          </div>

          {/* Bulk Checkbox */}
          <div className="flex items-center gap-2 pt-0.5">
            <input
              type="checkbox"
              id="bulkCheck"
              checked={isBulk}
              onChange={(e) => setIsBulk(e.target.checked)}
              className="w-3.5 h-3.5 rounded bg-zinc-900 border-zinc-800 text-white accent-white"
            />
            <label htmlFor="bulkCheck" className="text-xs font-mono text-zinc-400 cursor-pointer">
              Loose bulk item (measured in KG directly)
            </label>
          </div>

          {/* Quantities */}
          {!isBulk ? (
            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="block text-[11px] font-mono uppercase tracking-wider text-zinc-400 mb-1">
                  Total Bags
                </label>
                <input
                  type="number"
                  min="0"
                  value={totalBags}
                  onChange={(e) => setTotalBags(e.target.value === '' ? '' : Number(e.target.value))}
                  className="w-full bg-[#09090b] border border-zinc-800 rounded-lg px-3 py-2 text-xs text-white font-mono font-bold focus:outline-none focus:border-white tabular-nums"
                />
              </div>

              <div>
                <label className="block text-[11px] font-mono uppercase tracking-wider text-zinc-400 mb-1">
                  KG / Bag
                </label>
                <select
                  value={avgKgPerBag}
                  onChange={(e) => setAvgKgPerBag(Number(e.target.value))}
                  className="w-full bg-[#09090b] border border-zinc-800 rounded-lg px-3 py-2 text-xs text-white font-mono font-bold focus:outline-none focus:border-white"
                >
                  <option value={25}>25 KG / bag</option>
                  <option value={50}>50 KG / bag</option>
                  <option value={55}>55 KG / bag</option>
                  <option value={20}>20 KG / bag</option>
                  <option value={30}>30 KG / bag</option>
                </select>
              </div>
            </div>
          ) : (
            <div>
              <label className="block text-[11px] font-mono uppercase tracking-wider text-zinc-400 mb-1">
                Net Weight (KG)
              </label>
              <input
                type="number"
                min="1"
                value={bulkKg}
                onChange={(e) => setBulkKg(e.target.value === '' ? '' : Number(e.target.value))}
                className="w-full bg-[#09090b] border border-zinc-800 rounded-lg px-3 py-2 text-xs text-white font-mono font-bold focus:outline-none focus:border-white tabular-nums"
              />
            </div>
          )}

          {/* Rate & Threshold */}
          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className="block text-[11px] font-mono uppercase tracking-wider text-zinc-400 mb-1">
                Rate (₹ / KG) *
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
                Low Stock Alert at
              </label>
              <input
                type="number"
                min="1"
                value={lowStockThreshold}
                onChange={(e) => setLowStockThreshold(Number(e.target.value))}
                className="w-full bg-[#09090b] border border-zinc-800 rounded-lg px-3 py-2 text-xs text-white font-mono font-bold focus:outline-none focus:border-white tabular-nums"
              />
            </div>
          </div>

          {/* Valuation preview */}
          <div className="p-2.5 bg-[#09090b] rounded-lg border border-zinc-800 text-xs font-mono flex items-center justify-between">
            <span className="text-zinc-500">Initial Lot Valuation:</span>
            <span className="font-bold text-white tabular-nums">
              ₹{(calculatedKg * (typeof price === 'number' ? price : 0)).toLocaleString('en-IN')}
            </span>
          </div>

          {/* Submit */}
          <button
            type="submit"
            className="w-full py-2.5 rounded-lg font-mono font-bold text-xs uppercase tracking-wider text-black bg-white hover:bg-zinc-200 transition-all flex items-center justify-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>Register Lot in Inventory</span>
          </button>
        </form>
      </div>
    </div>
  );
}
