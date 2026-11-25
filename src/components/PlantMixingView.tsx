'use client';

import { useState, useMemo } from 'react';
import { ProductionBatch, PlantName } from '@/types/batch';
import { StockItem } from '@/types/stock';
import { 
  Plus, 
  Search, 
  Download, 
  Trash2, 
  Scale, 
  Calendar, 
  Clock, 
  Factory, 
  FileSpreadsheet, 
  Filter,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Layers
} from 'lucide-react';

interface PlantMixingViewProps {
  batches: ProductionBatch[];
  stockItems: StockItem[];
  onOpenAddBatch: (defaultPlant?: PlantName) => void;
  onDeleteBatch: (id: string) => void;
}

export default function PlantMixingView({
  batches,
  stockItems,
  onOpenAddBatch,
  onDeleteBatch,
}: PlantMixingViewProps) {
  const [selectedPlant, setSelectedPlant] = useState<'All' | PlantName>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFilter, setDateFilter] = useState<'all' | 'today' | 'week'>('all');
  const [expandedBatchId, setExpandedBatchId] = useState<string | null>(null);

  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);

  // Filtered batches
  const filteredBatches = useMemo(() => {
    return batches.filter((batch) => {
      // Plant filter
      if (selectedPlant !== 'All' && batch.plant !== selectedPlant) {
        return false;
      }

      // Date filter
      if (dateFilter === 'today' && batch.date !== todayStr) {
        return false;
      }
      if (dateFilter === 'week') {
        const batchDate = new Date(batch.date).getTime();
        const oneWeekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
        if (batchDate < oneWeekAgo) return false;
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesBatchNo = batch.batchNumber.toLowerCase().includes(q);
        const matchesProduct = (batch.targetProduct || '').toLowerCase().includes(q);
        const matchesOperator = (batch.operator || '').toLowerCase().includes(q);
        const matchesMaterial = batch.items.some((it) => it.materialName.toLowerCase().includes(q));
        if (!matchesBatchNo && !matchesProduct && !matchesOperator && !matchesMaterial) {
          return false;
        }
      }

      return true;
    });
  }, [batches, selectedPlant, dateFilter, searchQuery, todayStr]);

  // Aggregate stats
  const stats = useMemo(() => {
    const relevant = selectedPlant === 'All' ? batches : batches.filter((b) => b.plant === selectedPlant);
    const todayBatches = relevant.filter((b) => b.date === todayStr);

    const totalBowlsAll = relevant.reduce((s, b) => s + (b.totalBowls || 0), 0);
    const totalKgAll = relevant.reduce((s, b) => s + (b.totalKg || 0), 0);
    const totalCostAll = relevant.reduce((s, b) => s + (b.totalCost || 0), 0);

    const totalBowlsToday = todayBatches.reduce((s, b) => s + (b.totalBowls || 0), 0);
    const totalKgToday = todayBatches.reduce((s, b) => s + (b.totalKg || 0), 0);

    const singlePlantCount = batches.filter((b) => b.plant === 'Single Plant').length;
    const ramuPlantCount = batches.filter((b) => b.plant === 'Ramu Plant').length;

    return {
      totalBatches: relevant.length,
      todayBatchesCount: todayBatches.length,
      totalBowlsAll,
      totalKgAll,
      totalCostAll,
      totalBowlsToday,
      totalKgToday,
      singlePlantCount,
      ramuPlantCount,
    };
  }, [batches, selectedPlant, todayStr]);

  // Export to CSV
  const handleExportCSV = () => {
    if (filteredBatches.length === 0) {
      alert('No batches to export');
      return;
    }

    const headers = [
      'Batch Number',
      'Plant',
      'Date',
      'Time',
      'Shift',
      'Target Product',
      'Operator',
      'Material Name',
      'Bowls',
      'KG per Bowl',
      'Total KG',
      'Rate per KG',
      'Line Cost',
      'Batch Total Bowls',
      'Batch Total KG',
      'Batch Total Cost',
      'Notes',
    ];

    const rows: string[][] = [];

    for (const b of filteredBatches) {
      for (const it of b.items) {
        rows.push([
          `"${b.batchNumber}"`,
          `"${b.plant}"`,
          `"${b.date}"`,
          `"${b.time || ''}"`,
          `"${b.shift || ''}"`,
          `"${b.targetProduct || ''}"`,
          `"${b.operator || ''}"`,
          `"${it.materialName}"`,
          `${it.bowls}`,
          `${it.kgPerBowl}`,
          `${it.totalKg}`,
          `${it.ratePerKg || 0}`,
          `${Math.round((it.totalKg || 0) * (it.ratePerKg || 0))}`,
          `${b.totalBowls}`,
          `${b.totalKg}`,
          `${Math.round(b.totalCost || 0)}`,
          `"${(b.notes || '').replace(/"/g, '""')}"`,
        ]);
      }
    }

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `SP_Stock_Plant_Batches_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const toggleExpand = (id: string) => {
    setExpandedBatchId((prev) => (prev === id ? null : id));
  };

  return (
    <div className="space-y-6">
      
      {/* Top Banner Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        
        {/* Total Batches */}
        <div className="bg-[#121215] border border-zinc-800/80 rounded-xl p-3.5 sm:p-4">
          <div className="flex items-center justify-between text-zinc-400 mb-1">
            <span className="text-[10px] sm:text-xs font-mono uppercase tracking-wider">
              {selectedPlant === 'All' ? 'Total Batches' : `${selectedPlant} Batches`}
            </span>
            <Factory className="w-4 h-4 text-zinc-500" />
          </div>
          <div className="text-xl sm:text-2xl font-bold font-mono text-white">
            {stats.totalBatches}
            <span className="text-xs text-zinc-500 font-normal ml-2">
              ({stats.todayBatchesCount} today)
            </span>
          </div>
          <div className="text-[10px] font-mono text-zinc-400 mt-1">
            Single: {stats.singlePlantCount} • Ramu: {stats.ramuPlantCount}
          </div>
        </div>

        {/* Total Bowls */}
        <div className="bg-[#121215] border border-zinc-800/80 rounded-xl p-3.5 sm:p-4">
          <div className="flex items-center justify-between text-zinc-400 mb-1">
            <span className="text-[10px] sm:text-xs font-mono uppercase tracking-wider">
              Total Bowls Mixed
            </span>
            <span className="text-sm">🥣</span>
          </div>
          <div className="text-xl sm:text-2xl font-bold font-mono text-orange-400">
            {stats.totalBowlsAll}
            <span className="text-xs text-zinc-400 font-normal ml-1">bowls</span>
          </div>
          <div className="text-[10px] font-mono text-zinc-400 mt-1">
            Today: {stats.totalBowlsToday} bowls
          </div>
        </div>

        {/* Total Weight Mixed */}
        <div className="bg-[#121215] border border-zinc-800/80 rounded-xl p-3.5 sm:p-4">
          <div className="flex items-center justify-between text-zinc-400 mb-1">
            <span className="text-[10px] sm:text-xs font-mono uppercase tracking-wider">
              Total Material Mixed
            </span>
            <Scale className="w-4 h-4 text-zinc-500" />
          </div>
          <div className="text-xl sm:text-2xl font-bold font-mono text-white">
            {stats.totalKgAll.toLocaleString('en-IN')}
            <span className="text-xs text-zinc-400 font-normal ml-1">KG</span>
          </div>
          <div className="text-[10px] font-mono text-zinc-400 mt-1">
            Today: {stats.totalKgToday.toLocaleString('en-IN')} KG ({((stats.totalKgToday || 0) / 1000).toFixed(2)} MT)
          </div>
        </div>

        {/* Total Mixed Value */}
        <div className="bg-[#121215] border border-zinc-800/80 rounded-xl p-3.5 sm:p-4">
          <div className="flex items-center justify-between text-zinc-400 mb-1">
            <span className="text-[10px] sm:text-xs font-mono uppercase tracking-wider">
              Est. Material Valuation
            </span>
            <Layers className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-xl sm:text-2xl font-bold font-mono text-white">
            ₹{Math.round(stats.totalCostAll).toLocaleString('en-IN')}
          </div>
          <div className="text-[10px] font-mono text-zinc-400 mt-1">
            Avg: {stats.totalKgAll > 0 ? `₹${Math.round(stats.totalCostAll / stats.totalKgAll)}/kg` : '₹0/kg'}
          </div>
        </div>
      </div>

      {/* Control Bar: Plant Switcher, Search, Date & Add Button */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        
        {/* Plant Selector Pills */}
        <div className="flex items-center gap-1.5 p-1 bg-[#121215] border border-zinc-800 rounded-xl overflow-x-auto">
          <button
            onClick={() => setSelectedPlant('All')}
            className={`px-3 py-1.5 text-xs font-mono font-bold rounded-lg transition-all ${
              selectedPlant === 'All'
                ? 'bg-zinc-800 text-white shadow-sm'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            All Plants ({batches.length})
          </button>
          <button
            onClick={() => setSelectedPlant('Single Plant')}
            className={`px-3 py-1.5 text-xs font-mono font-bold rounded-lg transition-all flex items-center gap-1.5 ${
              selectedPlant === 'Single Plant'
                ? 'bg-blue-600/30 text-blue-400 border border-blue-500/50 shadow-sm'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <span>Single Plant</span>
            <span className="text-[10px] bg-zinc-800/80 px-1 rounded">{stats.singlePlantCount}</span>
          </button>
          <button
            onClick={() => setSelectedPlant('Ramu Plant')}
            className={`px-3 py-1.5 text-xs font-mono font-bold rounded-lg transition-all flex items-center gap-1.5 ${
              selectedPlant === 'Ramu Plant'
                ? 'bg-emerald-600/30 text-emerald-400 border border-emerald-500/50 shadow-sm'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <span>Ramu Plant</span>
            <span className="text-[10px] bg-zinc-800/80 px-1 rounded">{stats.ramuPlantCount}</span>
          </button>
        </div>

        {/* Right side: Search, Filters & Actions */}
        <div className="flex items-center gap-2 flex-wrap">
          
          {/* Search Input */}
          <div className="relative flex-1 sm:w-64">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search batch, material, product..."
              className="w-full bg-[#121215] border border-zinc-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-500"
            />
          </div>

          {/* Date Filter */}
          <select
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value as any)}
            className="bg-[#121215] border border-zinc-800 text-zinc-300 rounded-xl px-2.5 py-2 text-xs focus:outline-none focus:border-zinc-500"
          >
            <option value="all">All Dates</option>
            <option value="today">Today Only</option>
            <option value="week">Past 7 Days</option>
          </select>

          {/* CSV Export */}
          <button
            onClick={handleExportCSV}
            className="p-2 sm:px-3 sm:py-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 hover:text-white text-xs font-mono rounded-xl transition-all flex items-center gap-1.5"
            title="Export mixing log to CSV"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Export</span>
          </button>

          {/* New Batch Button */}
          <button
            onClick={() => onOpenAddBatch(selectedPlant === 'All' ? 'Single Plant' : selectedPlant)}
            className="px-3.5 py-2 bg-white hover:bg-zinc-200 text-black font-bold text-xs rounded-xl transition-all shadow-md flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>New Batch</span>
          </button>
        </div>
      </div>

      {/* Batches List */}
      {filteredBatches.length === 0 ? (
        <div className="bg-[#121215] border border-zinc-800/80 rounded-2xl p-8 text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center mx-auto text-xl">
            🥣
          </div>
          <h3 className="text-sm font-bold text-white font-mono">No Mixer Batches Logged</h3>
          <p className="text-xs text-zinc-500 max-w-md mx-auto">
            {selectedPlant === 'All'
              ? 'Start recording materials and bowls added into the mixer for Single Plant or Ramu Plant.'
              : `No batches found for ${selectedPlant}. Record a new batch using the button below.`}
          </p>
          <button
            onClick={() => onOpenAddBatch(selectedPlant === 'All' ? 'Single Plant' : selectedPlant)}
            className="px-4 py-2 bg-white hover:bg-zinc-200 text-black font-bold text-xs rounded-xl transition-all inline-flex items-center gap-1.5 mt-2"
          >
            <Plus className="w-4 h-4" />
            <span>Record First Mixer Batch</span>
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredBatches.map((batch) => {
            const isExpanded = expandedBatchId === batch.id;
            const isSingle = batch.plant === 'Single Plant';

            return (
              <div
                key={batch.id}
                className="bg-[#121215] border border-zinc-800/90 rounded-2xl p-4 sm:p-5 transition-all hover:border-zinc-700 shadow-lg space-y-3"
              >
                {/* Batch Top Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    
                    {/* Plant Badge */}
                    <span
                      className={`px-2.5 py-1 rounded-md text-[11px] font-mono font-bold border ${
                        isSingle
                          ? 'bg-blue-950/60 text-blue-400 border-blue-800/80'
                          : 'bg-emerald-950/60 text-emerald-400 border-emerald-800/80'
                      }`}
                    >
                      {batch.plant}
                    </span>

                    {/* Batch Number */}
                    <span className="font-mono font-bold text-sm text-white">
                      {batch.batchNumber}
                    </span>

                    {/* Shift & Time */}
                    <span className="text-[11px] font-mono text-zinc-400 bg-zinc-900 px-2 py-0.5 rounded border border-zinc-800">
                      {batch.date} • {batch.shift || 'Day'} Shift {batch.time ? `(${batch.time})` : ''}
                    </span>

                    {/* Target Product (if specified) */}
                    {batch.targetProduct && (
                      <span className="text-[11px] font-mono text-orange-400 bg-orange-950/40 px-2 py-0.5 rounded border border-orange-800/50">
                        Target: {batch.targetProduct}
                      </span>
                    )}
                  </div>

                  {/* Summary Metric Badges */}
                  <div className="flex items-center gap-2 self-end sm:self-auto">
                    <div className="flex items-center gap-2 font-mono text-xs">
                      <span className="px-2 py-1 rounded-lg bg-zinc-900 border border-zinc-800 text-orange-400 font-bold">
                        🥣 {batch.totalBowls} Bowls
                      </span>
                      <span className="px-2 py-1 rounded-lg bg-zinc-900 border border-zinc-800 text-white font-bold">
                        {batch.totalKg} KG
                      </span>
                      {batch.totalCost ? (
                        <span className="hidden md:inline px-2 py-1 rounded-lg bg-zinc-900 border border-zinc-800 text-emerald-400 font-bold">
                          ₹{Math.round(batch.totalCost).toLocaleString('en-IN')}
                        </span>
                      ) : null}
                    </div>

                    {/* Expand/Collapse Button */}
                    <button
                      onClick={() => toggleExpand(batch.id)}
                      className="p-1.5 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800 transition-colors"
                      title={isExpanded ? 'Collapse' : 'Expand ingredients'}
                    >
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>

                    {/* Delete Batch */}
                    <button
                      onClick={() => {
                        if (confirm(`Delete batch ${batch.batchNumber}?`)) {
                          onDeleteBatch(batch.id);
                        }
                      }}
                      className="p-1.5 text-zinc-500 hover:text-red-400 rounded-lg hover:bg-zinc-800 transition-colors"
                      title="Delete batch"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Ingredients Pills Preview (When Collapsed) */}
                {!isExpanded && (
                  <div className="flex flex-wrap items-center gap-1.5 pt-1 text-xs">
                    <span className="text-[11px] font-mono text-zinc-500 mr-1">Materials:</span>
                    {batch.items.map((it) => (
                      <span
                        key={it.id}
                        className="px-2 py-0.5 rounded text-[11px] font-mono bg-zinc-900 border border-zinc-800 text-zinc-300"
                      >
                        {it.materialName}: <strong className="text-orange-400">{it.bowls}b</strong> ({it.totalKg} kg)
                      </span>
                    ))}
                  </div>
                )}

                {/* Detailed Table (When Expanded) */}
                {isExpanded && (
                  <div className="pt-2 border-t border-zinc-800/80 space-y-3">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs font-mono">
                        <thead>
                          <tr className="text-zinc-500 border-b border-zinc-800 text-[10px] uppercase">
                            <th className="pb-2">Material</th>
                            <th className="pb-2 text-center">Bowls</th>
                            <th className="pb-2 text-center">KG / Bowl</th>
                            <th className="pb-2 text-right">Total Weight</th>
                            <th className="pb-2 text-right">Rate</th>
                            <th className="pb-2 text-right">Amount</th>
                            <th className="pb-2 text-right">Recipe %</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-800/50">
                          {batch.items.map((it) => {
                            const pct = batch.totalKg > 0 ? Math.round(((it.totalKg || 0) / batch.totalKg) * 100) : 0;
                            return (
                              <tr key={it.id} className="text-zinc-300">
                                <td className="py-2 font-medium text-white">
                                  {it.materialName}
                                  {it.sourceGodown && (
                                    <span className="text-[10px] text-zinc-500 block">
                                      from {it.sourceGodown}
                                    </span>
                                  )}
                                </td>
                                <td className="py-2 text-center text-orange-400 font-bold">
                                  {it.bowls}
                                </td>
                                <td className="py-2 text-center text-zinc-400">
                                  {it.kgPerBowl} kg
                                </td>
                                <td className="py-2 text-right text-white font-bold">
                                  {it.totalKg} kg
                                </td>
                                <td className="py-2 text-right text-zinc-400">
                                  ₹{it.ratePerKg || 0}
                                </td>
                                <td className="py-2 text-right text-zinc-200 font-bold">
                                  ₹{Math.round((it.totalKg || 0) * (it.ratePerKg || 0)).toLocaleString('en-IN')}
                                </td>
                                <td className="py-2 text-right text-zinc-400">
                                  {pct}%
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                        <tfoot>
                          <tr className="border-t border-zinc-800 text-white font-bold">
                            <td className="pt-2">Total Batch Mix</td>
                            <td className="pt-2 text-center text-orange-400">{batch.totalBowls} bowls</td>
                            <td className="pt-2 text-center">-</td>
                            <td className="pt-2 text-right">{batch.totalKg} kg</td>
                            <td className="pt-2 text-right text-zinc-400">
                              {batch.totalKg > 0 ? `₹${Math.round((batch.totalCost || 0) / batch.totalKg)}/kg` : '-'}
                            </td>
                            <td className="pt-2 text-right text-emerald-400">
                              ₹{Math.round(batch.totalCost || 0).toLocaleString('en-IN')}
                            </td>
                            <td className="pt-2 text-right">100%</td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>

                    {/* Operator and Notes */}
                    {(batch.operator || batch.notes) && (
                      <div className="flex flex-wrap items-center gap-4 text-xs font-mono text-zinc-400 bg-zinc-950/60 p-2.5 rounded-lg border border-zinc-800/60">
                        {batch.operator && (
                          <span>
                            Supervisor / Operator: <strong className="text-white">{batch.operator}</strong>
                          </span>
                        )}
                        {batch.notes && (
                          <span>
                            Notes: <span className="text-zinc-300">{batch.notes}</span>
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
