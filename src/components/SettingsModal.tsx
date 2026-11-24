'use client';

import { useState } from 'react';
import { 
  X, 
  KeyRound, 
  Download, 
  Upload, 
  RotateCcw, 
  Check, 
  ShieldAlert, 
  FileSpreadsheet, 
  UserCheck 
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
}

export default function SettingsModal({
  onClose,
  onResetFactoryData,
  onExportCSV,
  onExportJSON,
  onImportJSON,
  items,
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
    setMsg({ text: 'Password and Login ID updated successfully!', error: false });
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
        setMsg({ text: 'Backup restored successfully!', error: false });
      } catch (err) {
        setMsg({ text: 'Failed to read backup file.', error: true });
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-t-3xl sm:rounded-3xl p-5 sm:p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto">
        
        {/* Header */}
        <div className="flex items-start justify-between pb-3 border-b border-slate-800">
          <div>
            <h2 className="text-xl font-extrabold text-white">
              App Settings & Security
            </h2>
            <p className="text-xs text-slate-400">
              Manage your login password, data backups, and exports
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {msg && (
          <div
            className={`mt-4 p-3 rounded-xl text-xs font-semibold flex items-center gap-2 ${
              msg.error
                ? 'bg-rose-500/10 border border-rose-500/30 text-rose-400'
                : 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400'
            }`}
          >
            {msg.error ? <ShieldAlert className="w-4 h-4" /> : <Check className="w-4 h-4" />}
            <span>{msg.text}</span>
          </div>
        )}

        {/* Change Password Section */}
        <form onSubmit={handlePasswordChange} className="mt-5 space-y-3 pb-5 border-b border-slate-800">
          <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
            <KeyRound className="w-3.5 h-3.5 text-emerald-400" />
            <span>Change Owner Login Credentials</span>
          </h3>

          <div>
            <label className="block text-[11px] font-semibold text-slate-400 mb-1">
              Login ID / Username
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-emerald-500 font-semibold"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <div>
              <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                Current Password
              </label>
              <input
                type="password"
                placeholder="Current"
                value={currentPass}
                onChange={(e) => setCurrentPass(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                New Password
              </label>
              <input
                type="password"
                placeholder="New (min 6 chars)"
                value={newPass}
                onChange={(e) => setNewPass(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                Confirm New
              </label>
              <input
                type="password"
                placeholder="Confirm"
                value={confirmPass}
                onChange={(e) => setConfirmPass(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>
          </div>

          <button
            type="submit"
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-bold text-white rounded-xl transition-all"
          >
            Update Credentials
          </button>
        </form>

        {/* Data Backup & Export Section */}
        <div className="mt-5 space-y-3 pb-5 border-b border-slate-800">
          <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
            <Download className="w-3.5 h-3.5 text-blue-400" />
            <span>Backup & Export Inventory</span>
          </h3>

          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={onExportCSV}
              className="p-3 bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded-xl text-left flex items-center gap-2.5 transition-all text-xs"
            >
              <FileSpreadsheet className="w-5 h-5 text-emerald-400" />
              <div>
                <strong className="block text-white font-bold">Download Excel/CSV</strong>
                <span className="text-[10px] text-slate-400">All 75+ lots with valuation</span>
              </div>
            </button>

            <button
              type="button"
              onClick={onExportJSON}
              className="p-3 bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded-xl text-left flex items-center gap-2.5 transition-all text-xs"
            >
              <Download className="w-5 h-5 text-blue-400" />
              <div>
                <strong className="block text-white font-bold">Full JSON Backup</strong>
                <span className="text-[10px] text-slate-400">Save complete database</span>
              </div>
            </button>
          </div>

          <div>
            <label className="block p-3 bg-slate-950 hover:bg-slate-800 border border-slate-800 border-dashed rounded-xl cursor-pointer text-xs transition-all">
              <div className="flex items-center gap-2.5">
                <Upload className="w-5 h-5 text-purple-400" />
                <div>
                  <strong className="block text-white font-bold">Restore from JSON Backup</strong>
                  <span className="text-[10px] text-slate-400">Upload a previously downloaded .json file</span>
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

        {/* Factory Reset Section */}
        <div className="mt-5 space-y-2">
          <h3 className="text-xs font-bold text-rose-400 uppercase tracking-wider flex items-center gap-1.5">
            <RotateCcw className="w-3.5 h-3.5 text-rose-500" />
            <span>Danger Zone</span>
          </h3>
          <p className="text-[11px] text-slate-400">
            Reset all inventory back to the original sheet values (₹48,63,000 across all 6 godowns/plants).
          </p>
          <button
            type="button"
            onClick={() => {
              if (confirm('Are you sure you want to RESET all stock back to original factory sheet data? All custom adjustments will be wiped.')) {
                onResetFactoryData();
                onClose();
              }
            }}
            className="px-3.5 py-2 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-400 text-xs font-bold rounded-xl transition-all"
          >
            Reset to Original Stock Sheet
          </button>
        </div>
      </div>
    </div>
  );
}
