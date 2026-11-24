'use client';

import { useState } from 'react';
import { StockItem, GodownLocation } from '@/types/stock';
import { GODOWN_LOCATIONS } from '@/data/initialStock';
import { X, Plus, Package, IndianRupee, Scale } from 'lucide-react';

interface AddItemModalProps {
  onClose: () => void;
  onAdd: (item: Omit<StockItem, 'id' | 'updatedAt' | 'priceHistory'>) => void;
}

export default function AddItemModal({ onClose, onAdd }: AddItemModalProps) {
  const locations = GODOWN_LOCATIONS.filter((l) => l !== 'All Locations') as GodownLocation[];

  const [name, setName] = useState('');
  const [location, setLocation] = useState<GodownLocation>('Godown 1');
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
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-t-3xl sm:rounded-3xl p-5 sm:p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto">
        
        {/* Header */}
        <div className="flex items-start justify-between pb-3 border-b border-slate-800">
          <div>
            <h2 className="text-xl font-extrabold text-white">
              Add New Stock Lot
            </h2>
            <p className="text-xs text-slate-400">
              Create a new granule, dana, chips, or powder item
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          
          {/* Item Name */}
          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
              Material / Item Name *
            </label>
            <input
              type="text"
              required
              placeholder="e.g., Dharit Red Dana, Poojan Masterbatch"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm font-semibold"
              autoFocus
            />
          </div>

          {/* Location */}
          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
              Plant / Godown Location *
            </label>
            <select
              value={location}
              onChange={(e) => setLocation(e.target.value as GodownLocation)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 font-semibold"
            >
              {locations.map((loc) => (
                <option key={loc} value={loc} className="bg-slate-900 text-white">
                  {loc}
                </option>
              ))}
            </select>
          </div>

          {/* Bulk Loose vs Standard Bags */}
          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="bulkCheck"
              checked={isBulk}
              onChange={(e) => setIsBulk(e.target.checked)}
              className="w-4 h-4 rounded bg-slate-800 border-slate-700 text-emerald-500 focus:ring-emerald-500/30"
            />
            <label htmlFor="bulkCheck" className="text-xs text-slate-300 cursor-pointer select-none">
              Bulk Loose Material (No bags, weighed directly in KG)
            </label>
          </div>

          {/* Quantities */}
          {!isBulk ? (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">
                  Total Bags
                </label>
                <input
                  type="number"
                  min="0"
                  value={totalBags}
                  onChange={(e) => setTotalBags(e.target.value === '' ? '' : Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white text-sm font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">
                  Avg KG / Bag
                </label>
                <select
                  value={avgKgPerBag}
                  onChange={(e) => setAvgKgPerBag(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white text-sm font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value={25}>25 KG / bag (Standard)</option>
                  <option value={20}>20 KG / bag</option>
                  <option value={30}>30 KG / bag</option>
                  <option value={50}>50 KG / bag</option>
                </select>
              </div>
            </div>
          ) : (
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">
                Total Weight (KG)
              </label>
              <input
                type="number"
                min="1"
                value={bulkKg}
                onChange={(e) => setBulkKg(e.target.value === '' ? '' : Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white text-sm font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          )}

          {/* Price & Low Stock Threshold */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">
                Rate / Price (₹ per KG) *
              </label>
              <input
                type="number"
                min="1"
                step="0.5"
                required
                value={price}
                onChange={(e) => setPrice(e.target.value === '' ? '' : Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white text-sm font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">
                Low Stock Alert at
              </label>
              <input
                type="number"
                min="1"
                value={lowStockThreshold}
                onChange={(e) => setLowStockThreshold(Number(e.target.value))}
                placeholder="bags"
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white text-sm font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          {/* Valuation Preview */}
          <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800 text-xs flex items-center justify-between">
            <span className="text-slate-400">Total Lot Valuation:</span>
            <span className="text-sm font-black text-emerald-400">
              ₹{(calculatedKg * (typeof price === 'number' ? price : 0)).toLocaleString('en-IN')}
            </span>
          </div>

          {/* Submit */}
          <button
            type="submit"
            className="w-full py-3.5 rounded-2xl font-black text-sm bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-lg shadow-emerald-500/20 transition-all flex items-center justify-center gap-2 active:scale-98"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>Save & Add to Inventory</span>
          </button>
        </form>
      </div>
    </div>
  );
}
