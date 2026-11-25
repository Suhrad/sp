'use client';

import { useState, useMemo, useRef, useEffect } from 'react';
import { StockItem, GodownLocation, ItemCategory } from '@/types/stock';
import { GODOWN_LOCATIONS } from '@/data/initialStock';
import { X, Plus, Sparkles, Check, ChevronDown } from 'lucide-react';

interface AddItemModalProps {
  onClose: () => void;
  onAdd: (item: Omit<StockItem, 'id' | 'updatedAt' | 'priceHistory'>) => void;
  existingItems?: StockItem[];
}

export default function AddItemModal({ onClose, onAdd, existingItems = [] }: AddItemModalProps) {
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

  // Auto-fill & Rate dropdown suggestions
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [autoFilledInfo, setAutoFilledInfo] = useState<{ location: string; price: number } | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close suggestions when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filter existing items matching the current name input
  const suggestions = useMemo(() => {
    if (!existingItems || existingItems.length === 0) return [];
    const query = name.trim().toLowerCase();

    // Group items by name + location
    const matched = existingItems.filter((item) => {
      if (!query) return true;
      return (
        item.name.toLowerCase().includes(query) ||
        item.location.toLowerCase().includes(query)
      );
    });

    // Sort: exact startsWith matches first, then contains
    return matched
      .sort((a, b) => {
        if (!query) return 0;
        const aStarts = a.name.toLowerCase().startsWith(query);
        const bStarts = b.name.toLowerCase().startsWith(query);
        if (aStarts && !bStarts) return -1;
        if (!aStarts && bStarts) return 1;
        return a.name.localeCompare(b.name);
      })
      .slice(0, 8); // Top 8 suggestions
  }, [existingItems, name]);

  // Existing rates for currently entered material name across all locations
  const knownRatesForName = useMemo(() => {
    if (!name.trim() || !existingItems) return [];
    const normalized = name.trim().toLowerCase();
    const matches = existingItems.filter(
      (item) => item.name.toLowerCase() === normalized
    );
    // Deduplicate by price + location
    const rateMap = new Map<string, { price: number; location: string }>();
    for (const m of matches) {
      const key = `${m.currentPrice}-${m.location}`;
      if (!rateMap.has(key)) {
        rateMap.set(key, { price: m.currentPrice, location: m.location });
      }
    }
    return Array.from(rateMap.values());
  }, [name, existingItems]);

  const handleSelectSuggestion = (item: StockItem) => {
    setName(item.name);
    setPrice(item.currentPrice);
    if (item.avgKgPerBag && !item.isBulk) {
      setAvgKgPerBag(item.avgKgPerBag);
    }
    if (item.category) {
      setCategory(item.category);
    }
    setIsBulk(Boolean(item.isBulk));
    setAutoFilledInfo({ location: item.location, price: item.currentPrice });
    setShowSuggestions(false);
  };

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
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-md bg-[#121215] border border-zinc-800 rounded-t-2xl sm:rounded-2xl p-5 shadow-2xl relative max-h-[92vh] overflow-y-auto">
        
        {/* Header */}
        <div className="flex items-start justify-between pb-3 border-b border-zinc-800">
          <div>
            <h2 className="text-base font-bold text-white font-sans">
              Register New Stock Lot
            </h2>
            <p className="text-xs text-zinc-400 font-mono">
              Auto-suggests known rates from existing godowns
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
          
          {/* Material Name with Smart Rate Dropdown */}
          <div className="relative" ref={dropdownRef}>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-[11px] font-mono uppercase tracking-wider text-zinc-400">
                Material Name *
              </label>
              {suggestions.length > 0 && !showSuggestions && (
                <button
                  type="button"
                  onClick={() => setShowSuggestions(true)}
                  className="text-[10px] text-zinc-500 hover:text-white font-mono flex items-center gap-1"
                >
                  <span>Select existing</span>
                  <ChevronDown className="w-3 h-3" />
                </button>
              )}
            </div>

            <input
              type="text"
              required
              placeholder="Type to search (e.g. Blue Chips, Gop Dori, Pareshbhai...)"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setShowSuggestions(true);
                setAutoFilledInfo(null);
              }}
              onFocus={() => setShowSuggestions(true)}
              className="w-full bg-[#09090b] border border-zinc-800 rounded-lg px-3 py-2 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-white font-mono font-semibold"
              autoFocus
            />

            {/* Auto-suggest Dropdown with Rates & Locations */}
            {showSuggestions && suggestions.length > 0 && (
              <div className="absolute left-0 right-0 top-full mt-1.5 z-50 bg-[#121215] border border-zinc-700 rounded-xl shadow-2xl max-h-56 overflow-y-auto no-scrollbar py-1">
                <div className="px-3 py-1.5 text-[10px] font-mono uppercase tracking-wider text-zinc-400 border-b border-zinc-800 flex items-center justify-between">
                  <span>Known Material</span>
                  <span>Benchmark Rate</span>
                </div>
                {suggestions.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleSelectSuggestion(item)}
                    className="w-full px-3 py-2 text-left hover:bg-zinc-900 border-b border-zinc-900 last:border-none flex items-center justify-between gap-2 transition-colors group"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-mono font-bold text-white group-hover:text-zinc-100 truncate">
                        {item.name}
                      </div>
                      <div className="text-[10px] font-mono text-zinc-400 flex items-center gap-1.5 mt-0.5">
                        <span className="px-1 py-0.2 rounded bg-zinc-800 text-zinc-300">
                          {item.location}
                        </span>
                        <span>•</span>
                        <span>{item.category || 'Raw Material'}</span>
                        {!item.isBulk && (
                          <>
                            <span>•</span>
                            <span>{item.avgKgPerBag}kg/bag</span>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <div className="text-xs font-mono font-bold text-white tabular-nums">
                        ₹{item.currentPrice}
                        <span className="text-[10px] font-normal text-zinc-400">/kg</span>
                      </div>
                      <div className="text-[9px] text-zinc-500 font-mono">
                        Click to auto-fill
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {/* Notification when Rate was auto-filled */}
            {autoFilledInfo && (
              <div className="mt-1.5 px-2.5 py-1 rounded-md bg-zinc-900 border border-zinc-700 text-[11px] font-mono text-zinc-300 flex items-center justify-between animate-fade-in">
                <span className="flex items-center gap-1.5">
                  <Sparkles className="w-3 h-3 text-white" />
                  <span>
                    Rate auto-set to <strong className="text-white">₹{autoFilledInfo.price}/kg</strong> from {autoFilledInfo.location}
                  </span>
                </span>
                <span className="text-[10px] text-zinc-500">(Editable below)</span>
              </div>
            )}
          </div>

          {/* Classification & New Destination Location */}
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
                Store in Location *
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
                  <option value={25}>25 KG / bag (Standard)</option>
                  <option value={50}>50 KG / bag (Gop Dori)</option>
                  <option value={55}>55 KG / bag (Semi Yarn)</option>
                  <option value={20}>20 KG / bag (Powder)</option>
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
              <div className="flex items-center justify-between mb-1">
                <label className="block text-[11px] font-mono uppercase tracking-wider text-zinc-400">
                  Rate (₹ / KG) *
                </label>
              </div>
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

          {/* Clickable Rate Chips if this material exists in other godowns */}
          {knownRatesForName.length > 0 && (
            <div className="p-2.5 bg-[#09090b] rounded-lg border border-zinc-800/80 font-mono text-[11px] space-y-1.5">
              <span className="text-[10px] text-zinc-400 uppercase tracking-wider block">
                Existing Rates for "{name}":
              </span>
              <div className="flex flex-wrap gap-1.5">
                {knownRatesForName.map((r, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => {
                      setPrice(r.price);
                      setAutoFilledInfo({ location: r.location, price: r.price });
                    }}
                    className={`px-2 py-1 rounded text-[10px] font-bold border transition-all flex items-center gap-1 ${
                      price === r.price
                        ? 'bg-white text-black border-white'
                        : 'bg-zinc-900 text-zinc-300 border-zinc-800 hover:border-zinc-600 hover:text-white'
                    }`}
                  >
                    <span>₹{r.price}/kg</span>
                    <span className="text-[9px] opacity-70">({r.location})</span>
                    {price === r.price && <Check className="w-2.5 h-2.5" />}
                  </button>
                ))}
              </div>
            </div>
          )}

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
