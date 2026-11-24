'use client';

import { useState } from 'react';
import { 
  X, 
  KeyRound, 
  Download, 
  Upload, 
  RotateCcw, 
  Check, 
  AlertCircle,
  FileSpreadsheet,
  Database,
  Cloud,
  ExternalLink,
  RefreshCw
} from 'lucide-react';
import { getStoredCredentials, saveStoredCredentials } from '@/lib/auth';
import { StockItem } from '@/types/stock';

interface SettingsModalProps {
  onClose: () => void;
  onResetFactoryData: () => void;
  onExportCSV: () => void;
  onExportJSON: () => void;
  onImportJSON: (jsonStr: string) => void;
  items: StockItem[];
  isPostgresConnected?: boolean;
  onManualSync?: () => void;
}

export default function SettingsModal({
  onClose,
  onResetFactoryData,
  onExportCSV,
  onExportJSON,
  onImportJSON,
  items,
  isPostgresConnected,
  onManualSync,
}: SettingsModalProps) {
  const creds = getStoredCredentials();

  const [username, setUsername] = useState(creds.username);
  const [currentPass, setCurrentPass] = useState('');
  const [newPass, setNewPass] = useState('');
  const [confirmPass, setConfirmPass] = useState('');
  const [msg, setMsg] = useState<{ text: string; error: boolean } | null>(null);

  const handlePasswordChange = (e: React.FormEvent) => {
    e.preventDefault();
    setMsg(null);

    if (currentPass !== creds.password) {
      setMsg({ text: 'Current password is incorrect.', error: true });
      return;
    }

    if (newPass.length < 6) {
      setMsg({ text: 'New password must be at least 6 characters.', error: true });
      return;
    }

    if (newPass !== confirmPass) {
      setMsg({ text: 'New passwords do not match.', error: true });
      return;
    }

    saveStoredCredentials(username.trim(), newPass);
    setMsg({ text: 'Password and Login ID updated successfully.', error: false });
    setCurrentPass('');
    setNewPass('');
    setConfirmPass('');
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        onImportJSON(text);
        setMsg({ text: 'Backup restored successfully.', error: false });
      } catch (err) {
        setMsg({ text: 'Failed to read backup file.', error: true });
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-lg bg-[#121215] border border-zinc-800 rounded-t-2xl sm:rounded-2xl p-5 shadow-2xl relative max-h-[90vh] overflow-y-auto">
        
        {/* Header */}
        <div className="flex items-start justify-between pb-3 border-b border-zinc-800">
          <div>
            <h2 className="text-base font-bold text-white font-sans">
              System Settings & Cloud Database
            </h2>
            <p className="text-xs text-zinc-400 font-mono">
              Manage credentials, real-time sync, and backups
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-zinc-500 hover:text-white hover:bg-zinc-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {msg && (
          <div
            className={`mt-4 p-2.5 rounded-lg text-xs font-mono flex items-center gap-2 ${
              msg.error
                ? 'bg-zinc-900 border border-red-800/80 text-red-300'
                : 'bg-zinc-900 border border-zinc-700 text-white'
            }`}
          >
            {msg.error ? <AlertCircle className="w-3.5 h-3.5 text-red-400" /> : <Check className="w-3.5 h-3.5" />}
            <span>{msg.text}</span>
          </div>
        )}

        {/* Cloud Sync & Database Status Panel */}
        <div className="mt-4 p-3 bg-[#09090b] rounded-xl border border-zinc-800 font-mono space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] uppercase tracking-wider text-zinc-400 flex items-center gap-1.5 font-bold">
              <Database className="w-3.5 h-3.5 text-white" />
              <span>Multi-Device Cloud Sync</span>
            </span>
            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
              isPostgresConnected
                ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                : 'bg-zinc-900 text-zinc-300 border border-zinc-800'
            }`}>
              {isPostgresConnected ? 'POSTGRESQL ACTIVE' : 'CLOUD SERVER ACTIVE'}
            </span>
          </div>

          <p className="text-[11px] text-zinc-500 leading-relaxed font-sans">
            Every bag adjustment and rate update syncs across all your devices (iPhone in godown, office PC, partner's phone).
          </p>

          <div className="pt-1 flex items-center gap-2">
            {onManualSync && (
              <button
                type="button"
                onClick={() => {
                  onManualSync();
                  setMsg({ text: 'Cloud inventory synced successfully.', error: false });
                }}
                className="px-2.5 py-1 rounded bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-[11px] text-zinc-300 hover:text-white flex items-center gap-1.5 font-bold"
              >
                <RefreshCw className="w-3 h-3" />
                <span>Force Sync Now</span>
              </button>
            )}
            <span className="text-[10px] text-zinc-500">
              Auto-syncs on window focus & every 5s
            </span>
          </div>

          {/* How to connect dedicated Supabase/Neon PostgreSQL */}
          <div className="pt-2 border-t border-zinc-900 text-[10px] text-zinc-500 space-y-1">
            <span className="text-zinc-400 font-bold block">Optional: Connect Dedicated Supabase / Neon</span>
            <span>
              Add <code className="text-white bg-zinc-900 px-1 py-0.5 rounded">DATABASE_URL</code> in Vercel Project Settings &rarr; Environment Variables to hook up your own Postgres database.
            </span>
          </div>
        </div>

        {/* Change Password */}
        <form onSubmit={handlePasswordChange} className="mt-4 space-y-3 pb-4 border-b border-zinc-800">
          <span className="text-[11px] font-mono uppercase tracking-wider text-zinc-400 block font-bold">
            Access Credentials
          </span>

          <div>
            <label className="block text-[10px] font-mono text-zinc-500 mb-1">
              LOGIN ID
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full bg-[#09090b] border border-zinc-800 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-white font-mono"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <div>
              <label className="block text-[10px] font-mono text-zinc-500 mb-1">
                CURRENT PASS
              </label>
              <input
                type="password"
                placeholder="Current"
                value={currentPass}
                onChange={(e) => setCurrentPass(e.target.value)}
                className="w-full bg-[#09090b] border border-zinc-800 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-white font-mono"
              />
            </div>

            <div>
              <label className="block text-[10px] font-mono text-zinc-500 mb-1">
                NEW PASS
              </label>
              <input
                type="password"
                placeholder="Min 6 chars"
                value={newPass}
                onChange={(e) => setNewPass(e.target.value)}
                className="w-full bg-[#09090b] border border-zinc-800 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-white font-mono"
              />
            </div>

            <div>
              <label className="block text-[10px] font-mono text-zinc-500 mb-1">
                CONFIRM PASS
              </label>
              <input
                type="password"
                placeholder="Confirm"
                value={confirmPass}
                onChange={(e) => setConfirmPass(e.target.value)}
                className="w-full bg-[#09090b] border border-zinc-800 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-white font-mono"
              />
            </div>
          </div>

          <button
            type="submit"
            className="px-3.5 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-white border border-zinc-700 font-mono text-xs font-bold rounded-lg transition-all"
          >
            Update Credentials
          </button>
        </form>

        {/* Backup & Export */}
        <div className="mt-4 space-y-2.5 pb-4 border-b border-zinc-800">
          <span className="text-[11px] font-mono uppercase tracking-wider text-zinc-400 block font-bold">
            Data Backup & Export
          </span>

          <div className="grid grid-cols-2 gap-2 font-mono">
            <button
              type="button"
              onClick={onExportCSV}
              className="p-2.5 bg-[#09090b] hover:bg-zinc-850 border border-zinc-800 rounded-lg text-left flex items-center gap-2 transition-all text-xs"
            >
              <FileSpreadsheet className="w-4 h-4 text-white" />
              <div>
                <strong className="block text-white text-[11px]">Download CSV</strong>
                <span className="text-[10px] text-zinc-500">Excel spreadsheet</span>
              </div>
            </button>

            <button
              type="button"
              onClick={onExportJSON}
              className="p-2.5 bg-[#09090b] hover:bg-zinc-850 border border-zinc-800 rounded-lg text-left flex items-center gap-2 transition-all text-xs"
            >
              <Download className="w-4 h-4 text-white" />
              <div>
                <strong className="block text-white text-[11px]">JSON Database</strong>
                <span className="text-[10px] text-zinc-500">Full backup</span>
              </div>
            </button>
          </div>

          <div>
            <label className="block p-2.5 bg-[#09090b] hover:bg-zinc-850 border border-zinc-800 border-dashed rounded-lg cursor-pointer text-xs font-mono transition-all">
              <div className="flex items-center gap-2">
                <Upload className="w-4 h-4 text-zinc-400" />
                <div>
                  <strong className="block text-white text-[11px]">Restore Database</strong>
                  <span className="text-[10px] text-zinc-500">Select backup .json file</span>
                </div>
              </div>
              <input
                type="file"
                accept=".json"
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>
          </div>
        </div>

        {/* Reset to Original Data */}
        <div className="mt-4 space-y-1.5 font-mono">
          <span className="text-[11px] uppercase tracking-wider text-zinc-500 block">
            Factory Database Reset
          </span>
          <p className="text-[10px] text-zinc-500">
            Resets all quantities back to the initial ₹72,01,325 factory stock sheet.
          </p>
          <button
            type="button"
            onClick={() => {
              if (confirm('RESET all stock to the factory sheet values across both cloud and local storage?')) {
                onResetFactoryData();
                onClose();
              }
            }}
            className="px-3 py-1.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-400 hover:text-white text-xs font-bold rounded-lg transition-all"
          >
            Reset to Factory Stock
          </button>
        </div>
      </div>
    </div>
  );
}
