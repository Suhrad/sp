'use client';

import { useState, useMemo } from 'react';
import { StockItem } from '@/types/stock';
import { ProductionBatch, BatchItem, PlantName } from '@/types/batch';
import { X, Plus, Trash2, Scale, Sparkles, Check, ChevronDown } from 'lucide-react';

interface AddBatchModalProps {
  onClose: () => void;
  onSaveBatch: (batch: ProductionBatch) => void;
  stockItems: StockItem[];
  defaultPlant?: PlantName;
  initialBatch?: ProductionBatch | null;
}

export default function AddBatchModal({
  onClose,
  onSaveBatch,
  stockItems,
  defaultPlant = 'Single Plant',
  initialBatch = null,
}: AddBatchModalProps) {
  // Available Raw Materials from inventory
  const rawMaterials = useMemo(() => {
    return stockItems.filter(
      (item) => item.category === 'Raw Material' || item.name.toLowerCase().includes('dana') || item.name.toLowerCase().includes('powder') || item.name.toLowerCase().includes('chips')
    );
  }, [stockItems]);

  const [plant, setPlant] = useState<PlantName>(initialBatch?.plant || defaultPlant);
  const [shift, setShift] = useState<'Morning' | 'Day' | 'Night'>(initialBatch?.shift || 'Day');
  const [targetProduct, setTargetProduct] = useState(initialBatch?.targetProduct || '');
  const [operator, setOperator] = useState(initialBatch?.operator || '');
  const [notes, setNotes] = useState(initialBatch?.notes || '');

  // Plant-specific materials vs other godowns
  const { plantMaterials, godownMaterials } = useMemo(() => {
    const pm: StockItem[] = [];
    const gm: StockItem[] = [];
    for (const item of rawMaterials) {
      if (item.location === plant) {
        pm.push(item);
      } else {
        gm.push(item);
      }
    }
    return { plantMaterials: pm, godownMaterials: gm };
  }, [rawMaterials, plant]);

  // Auto-generate batch number with today's date if not editing
  const todayStr = useMemo(() => {
    const d = new Date();
    return d.toISOString().split('T')[0];
  }, []);

  const defaultBatchNo = useMemo(() => {
    if (initialBatch) return initialBatch.batchNumber;
    const d = new Date();
    const timePart = `${d.getHours().toString().padStart(2, '0')}${d.getMinutes().toString().padStart(2, '0')}`;
    const plantCode = plant === 'Single Plant' ? 'SP' : 'RP';
    return `${plantCode}-${todayStr.replace(/-/g, '').slice(2)}-${timePart}`;
  }, [plant, todayStr, initialBatch]);

  const [batchNumber, setBatchNumber] = useState(initialBatch?.batchNumber || defaultBatchNo);
  const [date, setDate] = useState(initialBatch?.date || todayStr);

  // Initial ingredient rows
  const [items, setItems] = useState<BatchItem[]>(
    initialBatch?.items && initialBatch.items.length > 0
      ? initialBatch.items
      : [
          {
            id: `item-1-${Date.now()}`,
            materialName: rawMaterials[0]?.name || 'PP Mix Dana',
            bowls: 4,
            kgPerBowl: 5,
            totalKg: 20,
            ratePerKg: rawMaterials[0]?.currentPrice || 90,
            sourceGodown: rawMaterials[0]?.location || 'Godown 1',
            itemId: rawMaterials[0]?.id,
          },
          {
            id: `item-2-${Date.now()}`,
            materialName: rawMaterials[1]?.name || 'Powder / Additive',
            bowls: 1,
            kgPerBowl: 5,
            totalKg: 5,
            ratePerKg: rawMaterials[1]?.currentPrice || 85,
            sourceGodown: rawMaterials[1]?.location || 'Godown 1',
            itemId: rawMaterials[1]?.id,
          },
        ]
  );

  // Adjust an item's fields
  const updateItem = (id: string, updates: Partial<BatchItem>) => {
    setItems((prev) =>
      prev.map((it) => {
        if (it.id !== id) return it;
        const merged = { ...it, ...updates };
        // Recalculate totalKg whenever bowls or kgPerBowl changes
        if (updates.bowls !== undefined || updates.kgPerBowl !== undefined) {
          merged.totalKg = parseFloat(((merged.bowls || 0) * (merged.kgPerBowl || 0)).toFixed(2));
        }
        return merged;
      })
    );
  };

  // When a raw material is picked from dropdown
  const handleSelectMaterial = (rowId: string, selectedValue: string) => {
    // Check if selectedValue is an item id, or matches item name
    const matched = stockItems.find((m) => m.id === selectedValue || m.name === selectedValue);
    if (matched) {
      updateItem(rowId, {
        materialName: matched.name,
        itemId: matched.id,
        sourceGodown: matched.location,
        ratePerKg: matched.currentPrice || 0,
      });
    } else {
      updateItem(rowId, {
        materialName: selectedValue,
      });
    }
  };

  // Add new ingredient row
  const addIngredientRow = () => {
    const nextMat = rawMaterials[items.length % rawMaterials.length] || rawMaterials[0];
    const newItem: BatchItem = {
      id: `item-${Date.now()}-${Math.random()}`,
      materialName: nextMat?.name || 'Raw Material',
      bowls: 2,
      kgPerBowl: 5,
      totalKg: 10,
      ratePerKg: nextMat?.currentPrice || 90,
      sourceGodown: nextMat?.location || 'Godown 1',
      itemId: nextMat?.id,
    };
    setItems((prev) => [...prev, newItem]);
  };

  // Remove row
  const removeRow = (id: string) => {
    if (items.length <= 1) return;
    setItems((prev) => prev.filter((it) => it.id !== id));
  };

  // Total metrics
  const totalBowls = useMemo(() => {
    return items.reduce((sum, it) => sum + (Number(it.bowls) || 0), 0);
  }, [items]);

  const totalKg = useMemo(() => {
    return parseFloat(items.reduce((sum, it) => sum + (Number(it.totalKg) || 0), 0).toFixed(2));
  }, [items]);

  const totalCost = useMemo(() => {
    return items.reduce((sum, it) => sum + (Number(it.totalKg) || 0) * (Number(it.ratePerKg) || 0), 0);
  }, [items]);

  const avgCostPerKg = useMemo(() => {
    if (totalKg <= 0) return 0;
    return Math.round(totalCost / totalKg);
  }, [totalCost, totalKg]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!batchNumber.trim()) {
      alert('Please enter a Batch Number');
      return;
    }
    if (items.length === 0 || totalKg <= 0) {
      alert('Please add at least one material with valid bowls / weight');
      return;
    }

    const savedBatch: ProductionBatch = {
      id: initialBatch?.id || `batch-${Date.now()}`,
      batchNumber: batchNumber.trim(),
      plant,
      date,
      time: initialBatch?.time || new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }),
      shift,
      targetProduct: targetProduct.trim() || undefined,
      operator: operator.trim() || undefined,
      notes: notes.trim() || undefined,
      items,
      totalBowls,
      totalKg,
      totalCost,
      createdAt: initialBatch?.createdAt || new Date().toISOString(),
    };

    onSaveBatch(savedBatch);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-3xl bg-[#121215] border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden my-auto">
        
        {/* Header */}
        <div className="px-5 py-4 border-b border-zinc-800/80 flex items-center justify-between bg-zinc-900/60">
          <div>
            <div className="flex items-center gap-2">
              <span className={`w-2.5 h-2.5 rounded-full ${initialBatch ? 'bg-blue-400' : 'bg-orange-500'} animate-pulse`} />
              <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
                {initialBatch ? 'Edit Mixer Batch' : 'New Mixer Batch Entry'}
              </h2>
            </div>
            <p className="text-xs text-zinc-400 mt-0.5">
              {initialBatch
                ? `Editing ${initialBatch.batchNumber} • ${plant}`
                : 'Record materials & bowls added into the mixer • Log & Recipe tracking'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-5 max-h-[80vh] overflow-y-auto">
          
          {/* Top Config Row: Plant Selection & Shift */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            
            {/* Plant Selector */}
            <div>
              <label className="block text-xs font-mono font-medium text-zinc-400 uppercase tracking-wider mb-2">
                Production Plant
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setPlant('Single Plant')}
                  className={`py-2 px-3 rounded-lg text-xs font-bold border transition-all flex items-center justify-center gap-2 ${
                    plant === 'Single Plant'
                      ? 'bg-blue-600/20 border-blue-500 text-blue-400 shadow-sm'
                      : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  <span>Single Plant</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPlant('Ramu Plant')}
                  className={`py-2 px-3 rounded-lg text-xs font-bold border transition-all flex items-center justify-center gap-2 ${
                    plant === 'Ramu Plant'
                      ? 'bg-emerald-600/20 border-emerald-500 text-emerald-400 shadow-sm'
                      : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  <span>Ramu Plant</span>
                </button>
              </div>
            </div>

            {/* Shift & Date */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-mono font-medium text-zinc-400 uppercase tracking-wider mb-2">
                  Shift
                </label>
                <select
                  value={shift}
                  onChange={(e) => setShift(e.target.value as any)}
                  className="w-full bg-zinc-900 border border-zinc-800 text-white rounded-lg px-2.5 py-2 text-xs focus:outline-none focus:border-zinc-500"
                >
                  <option value="Day">Day Shift</option>
                  <option value="Morning">Morning Shift</option>
                  <option value="Night">Night Shift</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-mono font-medium text-zinc-400 uppercase tracking-wider mb-2">
                  Batch Date
                </label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-800 text-white rounded-lg px-2.5 py-2 text-xs focus:outline-none focus:border-zinc-500"
                />
              </div>
            </div>
          </div>

          {/* Batch Number & Target Product */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-mono font-medium text-zinc-400 uppercase tracking-wider mb-1.5">
                Batch ID / Number
              </label>
              <input
                type="text"
                value={batchNumber}
                onChange={(e) => setBatchNumber(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-800 text-white font-mono rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-zinc-500"
                placeholder="e.g. SP-261125-01"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-mono font-medium text-zinc-400 uppercase tracking-wider mb-1.5">
                Target Product (Optional)
              </label>
              <input
                type="text"
                value={targetProduct}
                onChange={(e) => setTargetProduct(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-800 text-white rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-zinc-500"
                placeholder="e.g. Gop Dori 16 TAR, Semi Yarn, Bo PP"
              />
            </div>
          </div>

          {/* Raw Materials Added in Mixer (Bowl Section) */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Scale className="w-4 h-4 text-orange-400" />
                <span className="text-xs font-mono font-bold text-zinc-200 uppercase tracking-wider">
                  Raw Materials Added in Mixer (By Bowls)
                </span>
              </div>
              <span className="text-[11px] text-zinc-500 font-mono">
                {items.length} {items.length === 1 ? 'material' : 'materials'} in mix
              </span>
            </div>

            <div className="space-y-2.5">
              {items.map((it, idx) => (
                <div
                  key={it.id}
                  className="bg-zinc-900/80 border border-zinc-800/90 rounded-xl p-3 sm:p-3.5 space-y-3 relative group"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <label className="block text-[10px] font-mono text-zinc-400 uppercase">
                          Material #{idx + 1}
                        </label>
                        {/* Live Stock Badge */}
                        {(() => {
                          const matched = stockItems.find((s) => s.id === it.itemId || s.name === it.materialName);
                          if (!matched) return null;
                          const isLow = matched.totalBags <= 5;
                          return (
                            <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded font-semibold ${
                              isLow ? 'bg-amber-950/60 text-amber-400 border border-amber-800/60' : 'bg-emerald-950/50 text-emerald-400 border border-emerald-800/40'
                            }`}>
                              Available: {matched.totalBags} bags ({matched.kg} kg) • {matched.location}
                            </span>
                          );
                        })()}
                      </div>
                      <select
                        value={it.itemId || it.materialName}
                        onChange={(e) => handleSelectMaterial(it.id, e.target.value)}
                        className="w-full bg-zinc-950 border border-zinc-800 text-white rounded-lg px-2.5 py-1.5 text-xs font-medium focus:outline-none focus:border-zinc-500 font-mono"
                      >
                        {plantMaterials.length > 0 && (
                          <optgroup label={`🏭 In ${plant} Stock`}>
                            {plantMaterials.map((rm) => (
                              <option key={rm.id} value={rm.id}>
                                {rm.name} — {rm.totalBags} bags ({rm.kg} kg) • ₹{rm.currentPrice}/kg
                              </option>
                            ))}
                          </optgroup>
                        )}
                        <optgroup label="📦 Other Godowns & Yard">
                          {godownMaterials.map((rm) => (
                            <option key={rm.id} value={rm.id}>
                              {rm.name} ({rm.location}) — {rm.totalBags} bags ({rm.kg} kg) • ₹{rm.currentPrice}/kg
                            </option>
                          ))}
                        </optgroup>
                      </select>
                    </div>

                    {items.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeRow(it.id)}
                        className="p-1.5 text-zinc-500 hover:text-red-400 hover:bg-zinc-800/80 rounded-lg transition-colors mt-4"
                        title="Remove material row"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  {/* Bowls & Weight Stepper */}
                  <div className="grid grid-cols-3 gap-2 sm:gap-3 items-center">
                    
                    {/* Bowls Count */}
                    <div className="bg-zinc-950/60 p-2 rounded-lg border border-zinc-800/60">
                      <span className="block text-[10px] font-mono text-orange-400 uppercase font-semibold mb-1">
                        🥣 Bowls Count
                      </span>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => updateItem(it.id, { bowls: Math.max(0.5, Number((it.bowls - 1).toFixed(1))) })}
                          className="w-7 h-7 flex items-center justify-center bg-zinc-800 hover:bg-zinc-700 text-white rounded font-bold text-sm"
                        >
                          -
                        </button>
                        <input
                          type="number"
                          step="0.5"
                          min="0.5"
                          value={it.bowls}
                          onChange={(e) => updateItem(it.id, { bowls: parseFloat(e.target.value) || 0 })}
                          className="w-full bg-transparent text-center font-mono font-bold text-white text-xs focus:outline-none"
                        />
                        <button
                          type="button"
                          onClick={() => updateItem(it.id, { bowls: Number((it.bowls + 1).toFixed(1)) })}
                          className="w-7 h-7 flex items-center justify-center bg-zinc-800 hover:bg-zinc-700 text-white rounded font-bold text-sm"
                        >
                          +
                        </button>
                      </div>
                    </div>

                    {/* KG per Bowl */}
                    <div className="bg-zinc-950/60 p-2 rounded-lg border border-zinc-800/60">
                      <span className="block text-[10px] font-mono text-zinc-400 uppercase mb-1">
                        ⚖️ KG / Bowl
                      </span>
                      <div className="flex items-center gap-1">
                        <input
                          type="number"
                          step="0.5"
                          min="0.5"
                          value={it.kgPerBowl}
                          onChange={(e) => updateItem(it.id, { kgPerBowl: parseFloat(e.target.value) || 0 })}
                          className="w-full bg-zinc-900 border border-zinc-800 rounded px-2 py-1 text-center font-mono text-white text-xs focus:outline-none"
                        />
                        <span className="text-[10px] text-zinc-500 font-mono">KG</span>
                      </div>
                    </div>

                    {/* Total KG */}
                    <div className="bg-zinc-950/60 p-2 rounded-lg border border-zinc-800/60">
                      <span className="block text-[10px] font-mono text-zinc-400 uppercase mb-1">
                        Total Weight
                      </span>
                      <div className="text-center font-mono font-bold text-white text-xs sm:text-sm py-0.5">
                        {it.totalKg} <span className="text-[10px] text-zinc-400 font-normal">KG</span>
                      </div>
                    </div>
                  </div>

                  {/* Subtotal line */}
                  <div className="flex items-center justify-between text-[11px] font-mono text-zinc-400 pt-1 border-t border-zinc-800/40">
                    <span>Rate: ₹{it.ratePerKg || 0}/kg</span>
                    <span className="text-zinc-200">
                      Item Cost: <span className="font-bold">₹{Math.round((it.totalKg || 0) * (it.ratePerKg || 0)).toLocaleString('en-IN')}</span>
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Add Material Button */}
            <button
              type="button"
              onClick={addIngredientRow}
              className="w-full py-2.5 px-3 border border-dashed border-zinc-700 hover:border-zinc-500 hover:bg-zinc-900/60 rounded-xl text-xs font-mono font-medium text-zinc-300 hover:text-white transition-all flex items-center justify-center gap-2"
            >
              <Plus className="w-4 h-4 text-orange-400" />
              <span>+ Add Another Material to Mixer</span>
            </button>
          </div>

          {/* Batch Summary Box */}
          <div className="bg-gradient-to-br from-zinc-900 via-zinc-900 to-zinc-950 border border-zinc-800 rounded-xl p-4 space-y-3">
            <span className="text-xs font-mono font-bold text-zinc-300 uppercase tracking-wider block">
              Batch Summary & Recipe Ratio
            </span>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-center">
              <div className="bg-zinc-950/80 p-2.5 rounded-lg border border-zinc-800/60">
                <span className="text-[10px] font-mono text-zinc-400 uppercase block">Total Bowls</span>
                <span className="text-base sm:text-lg font-bold font-mono text-orange-400">{totalBowls}</span>
              </div>
              <div className="bg-zinc-950/80 p-2.5 rounded-lg border border-zinc-800/60">
                <span className="text-[10px] font-mono text-zinc-400 uppercase block">Total Weight</span>
                <span className="text-base sm:text-lg font-bold font-mono text-white">{totalKg} <span className="text-xs">KG</span></span>
              </div>
              <div className="bg-zinc-950/80 p-2.5 rounded-lg border border-zinc-800/60">
                <span className="text-[10px] font-mono text-zinc-400 uppercase block">Est. Batch Cost</span>
                <span className="text-base sm:text-lg font-bold font-mono text-white">₹{Math.round(totalCost).toLocaleString('en-IN')}</span>
              </div>
              <div className="bg-zinc-950/80 p-2.5 rounded-lg border border-zinc-800/60">
                <span className="text-[10px] font-mono text-zinc-400 uppercase block">Effective Rate</span>
                <span className="text-base sm:text-lg font-bold font-mono text-emerald-400">₹{avgCostPerKg}/kg</span>
              </div>
            </div>

            {/* Recipe Percentages */}
            {totalKg > 0 && (
              <div className="pt-1 flex flex-wrap gap-1.5">
                {items.map((it) => {
                  const pct = Math.round(((it.totalKg || 0) / totalKg) * 100);
                  return (
                    <span
                      key={it.id}
                      className="px-2 py-0.5 rounded text-[10px] font-mono bg-zinc-800/90 text-zinc-300 border border-zinc-700"
                    >
                      {it.materialName}: <strong className="text-white">{pct}%</strong> ({it.bowls} bowls)
                    </span>
                  );
                })}
              </div>
            )}
          </div>

          {/* Operator & Notes */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-mono font-medium text-zinc-400 uppercase tracking-wider mb-1">
                Plant Operator / Supervisor
              </label>
              <input
                type="text"
                value={operator}
                onChange={(e) => setOperator(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-800 text-white rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-zinc-500"
                placeholder="e.g. Ramubhai / Operator 1"
              />
            </div>
            <div>
              <label className="block text-xs font-mono font-medium text-zinc-400 uppercase tracking-wider mb-1">
                Mixing Notes (Optional)
              </label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-800 text-white rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-zinc-500"
                placeholder="e.g. High speed mix 15 mins, moisture low"
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-2 flex items-center justify-end gap-3 border-t border-zinc-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 bg-white hover:bg-zinc-200 text-black font-bold text-xs rounded-lg transition-all shadow-md flex items-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              <span>{initialBatch ? 'Update Mixer Batch' : 'Save Mixer Batch'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
