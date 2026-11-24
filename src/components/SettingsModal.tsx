'use client';

import { useState, useEffect } from 'react';
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
  RefreshCw,
  Server,
  Zap,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  Link2
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

interface DbStatus {
  connected: boolean;
  provider: string;
  host: string;
  rowCount: number;
  pingMs?: number;
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

  // Credentials
  const [username, setUsername] = useState(creds.username);
  const [currentPass, setCurrentPass] = useState('');
  const [newPass, setNewPass] = useState('');
  const [confirmPass, setConfirmPass] = useState('');
  const [msg, setMsg] = useState<{ text: string; error: boolean } | null>(null);

  // Cloud Database state
  const [dbStatus, setDbStatus] = useState<DbStatus | null>(null);
  const [loadingDbStatus, setLoadingDbStatus] = useState<boolean>(true);
  const [connectionString, setConnectionString] = useState<string>('');
  const [isConnecting, setIsConnecting] = useState<boolean>(false);
  const [dbMsg, setDbMsg] = useState<{ text: string; error: boolean } | null>(null);
  const [showSetupGuide, setShowSetupGuide] = useState<boolean>(false);

  // Fetch live database status
  const fetchDbStatus = async () => {
    setLoadingDbStatus(true);
    try {
      const res = await fetch('/api/database/status');
      if (res.ok) {
        const data = await res.json();
        setDbStatus(data);
      }
    } catch {
      // Fallback
    } finally {
      setLoadingDbStatus(false);
    }
  };

  useEffect(() => {
    fetchDbStatus();
  }, []);

  const handleConnectDatabase = async (e: React.FormEvent) => {
    e.preventDefault();
    setDbMsg(null);

    if (!connectionString.trim()) {
      setDbMsg({ text: 'Please enter a valid PostgreSQL / Supabase connection URL.', error: true });
      return;
    }

    setIsConnecting(true);
    try {
      const res = await fetch('/api/database/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ connectionString: connectionString.trim() }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to connect to database');
      }

      setDbMsg({ 
        text: `Connected to ${data.host || 'PostgreSQL'}! ${data.rowCount || 95} stock lots synced live.`, 
        error: false 
      });
      setConnectionString('');
      await fetchDbStatus();
      if (onManualSync) onManualSync();
    } catch (err: any) {
      setDbMsg({ text: err.message || 'Could not connect. Check host, user, and password.', error: true });
    } finally {
      setIsConnecting(false);
    }
  };

  const handleDisconnectDatabase = async () => {
    if (!confirm('Disconnect dedicated cloud database and switch back to local edge server cache?')) return;
    setIsConnecting(true);
    try {
      const res = await fetch('/api/database/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ connectionString: '' }),
      });
      if (res.ok) {
        setDbMsg({ text: 'Cloud database disconnected. Reverted to local server mode.', error: false });
        await fetchDbStatus();
        if (onManualSync) onManualSync();
      }
    } catch {
      setDbMsg({ text: 'Failed to disconnect.', error: true });
    } finally {
      setIsConnecting(false);
    }
  };

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
      } catch {
        setMsg({ text: 'Failed to read backup file.', error: true });
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-xl bg-[#121215] border border-zinc-800 rounded-t-2xl sm:rounded-2xl p-5 shadow-2xl relative max-h-[92vh] overflow-y-auto">
        
        {/* Header */}
        <div className="flex items-start justify-between pb-3 border-b border-zinc-800">
          <div>
            <h2 className="text-base font-bold text-white font-sans flex items-center gap-2">
              <Database className="w-4 h-4 text-white" />
              <span>System Settings & Cloud Database</span>
            </h2>
            <p className="text-xs text-zinc-400 font-mono mt-0.5">
              Multi-device real-time sync, credentials, and backups
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

        {/* ------------------------------------------------------------- */}
        {/* Section 1: Real-Time Multi-Device Cloud Database */}
        {/* ------------------------------------------------------------- */}
        <div className="mt-4 p-4 bg-[#09090b] rounded-xl border border-zinc-800 font-mono space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] uppercase tracking-wider text-zinc-300 flex items-center gap-1.5 font-bold">
              <Cloud className="w-3.5 h-3.5 text-white" />
              <span>Real-Time Multi-Device Database</span>
            </span>
            <span className={`px-2 py-0.5 rounded text-[10px] font-bold flex items-center gap-1.5 ${
              dbStatus?.connected
                ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                : 'bg-zinc-900 text-zinc-300 border border-zinc-700'
            }`}>
              <span className={`w-1.5 h-1.5 rounded-full ${dbStatus?.connected ? 'bg-emerald-400 animate-pulse' : 'bg-zinc-500'}`} />
              <span>{dbStatus?.connected ? (dbStatus.provider || 'POSTGRESQL LIVE') : 'LOCAL EDGE MODE'}</span>
            </span>
          </div>

          <p className="text-[11px] text-zinc-400 leading-relaxed font-sans">
            Connects your iPhone in the godown, office laptop, and partner phones so any bag adjustment reflects across all screens within seconds.
          </p>

          {/* Live Status Indicators */}
          {dbStatus && (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1 text-[11px]">
              <div className="p-2 bg-zinc-900/80 rounded border border-zinc-800">
                <span className="text-[9px] text-zinc-500 block uppercase">Host / Cluster</span>
                <span className="text-white font-mono truncate block text-[10px]" title={dbStatus.host}>
                  {dbStatus.host || 'local'}
                </span>
              </div>
              <div className="p-2 bg-zinc-900/80 rounded border border-zinc-800">
                <span className="text-[9px] text-zinc-500 block uppercase">Synced Inventory</span>
                <span className="text-white font-mono font-bold block text-[10px]">
                  {dbStatus.rowCount ?? items.length} Lots Active
                </span>
              </div>
              <div className="p-2 bg-zinc-900/80 rounded border border-zinc-800 col-span-2 sm:col-span-1">
                <span className="text-[9px] text-zinc-500 block uppercase">Latency / Ping</span>
                <span className="text-emerald-400 font-mono font-bold block text-[10px]">
                  {dbStatus.pingMs ? `⚡ ${dbStatus.pingMs}ms` : 'Ready'}
                </span>
              </div>
            </div>
          )}

          {/* Feedback message for DB */}
          {dbMsg && (
            <div
              className={`p-2 rounded-lg text-xs font-mono flex items-center gap-2 ${
                dbMsg.error
                  ? 'bg-red-950/40 border border-red-800 text-red-300'
                  : 'bg-emerald-950/40 border border-emerald-800 text-emerald-300'
              }`}
            >
              {dbMsg.error ? <AlertCircle className="w-3.5 h-3.5 text-red-400 flex-shrink-0" /> : <Check className="w-3.5 h-3.5 flex-shrink-0" />}
              <span className="text-[11px] leading-tight">{dbMsg.text}</span>
            </div>
          )}

          {/* Connect PostgreSQL Form */}
          {!dbStatus?.connected ? (
            <form onSubmit={handleConnectDatabase} className="space-y-2 pt-1">
              <label className="block text-[10px] text-zinc-400 font-mono">
                CONNECT SUPABASE / NEON POSTGRESQL URL
              </label>
              <div className="flex gap-2">
                <input
                  type="password"
                  placeholder="postgresql://postgres:[password]@aws-0-...pooler.supabase.com:6543/postgres"
                  value={connectionString}
                  onChange={(e) => setConnectionString(e.target.value)}
                  className="flex-1 bg-[#121215] border border-zinc-800 rounded-lg px-2.5 py-1.5 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-zinc-500 font-mono"
                />
                <button
                  type="submit"
                  disabled={isConnecting}
                  className="px-3 py-1.5 bg-white text-black font-bold text-xs rounded-lg hover:bg-zinc-200 transition-all flex items-center gap-1.5 whitespace-nowrap disabled:opacity-50"
                >
                  {isConnecting ? (
                    <RefreshCw className="w-3 h-3 animate-spin" />
                  ) : (
                    <Link2 className="w-3 h-3" />
                  )}
                  <span>Connect & Sync</span>
                </button>
              </div>
            </form>
          ) : (
            <div className="pt-2 flex items-center justify-between border-t border-zinc-900">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={async () => {
                    await fetchDbStatus();
                    if (onManualSync) onManualSync();
                  }}
                  className="px-2.5 py-1 rounded bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 text-[11px] text-zinc-300 hover:text-white flex items-center gap-1.5 font-bold"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>Test Ping</span>
                </button>
                {onManualSync && (
                  <button
                    type="button"
                    onClick={() => {
                      onManualSync();
                      setDbMsg({ text: 'Cloud inventory synced successfully.', error: false });
                    }}
                    className="px-2.5 py-1 rounded bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 text-[11px] text-zinc-300 hover:text-white flex items-center gap-1.5 font-bold"
                  >
                    <Download className="w-3 h-3" />
                    <span>Force Sync Now</span>
                  </button>
                )}
              </div>
              <button
                type="button"
                onClick={handleDisconnectDatabase}
                disabled={isConnecting}
                className="text-[10px] text-zinc-500 hover:text-red-400 font-mono underline transition-colors"
              >
                Disconnect DB
              </button>
            </div>
          )}

          {/* Quick Setup Guide Accordion */}
          <div className="pt-1 border-t border-zinc-900">
            <button
              type="button"
              onClick={() => setShowSetupGuide(!showSetupGuide)}
              className="text-[10px] text-zinc-400 hover:text-white flex items-center justify-between w-full font-mono py-1"
            >
              <span className="flex items-center gap-1">
                <HelpCircle className="w-3 h-3" />
                <span>How to get a free Supabase or Neon PostgreSQL URL in 60 seconds</span>
              </span>
              {showSetupGuide ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            </button>

            {showSetupGuide && (
              <div className="mt-2 p-3 bg-zinc-950 rounded-lg border border-zinc-850 text-[11px] text-zinc-400 space-y-2 font-sans">
                <div className="space-y-1">
                  <strong className="text-white block font-mono text-[10px] uppercase">
                    Method 1: Neon Serverless Postgres (Recommended - 30 seconds)
                  </strong>
                  <ol className="list-decimal list-inside space-y-0.5 text-zinc-400 text-[11px]">
                    <li>Go to <a href="https://neon.tech" target="_blank" rel="noreferrer" className="text-white underline">neon.tech</a> (100% free, no credit card needed).</li>
                    <li>Click <strong>Create Project</strong> &rarr; Name it <code className="text-white">polymer-stock</code>.</li>
                    <li>Copy the <strong>Connection string</strong> (<code className="text-white">postgresql://...</code>).</li>
                    <li>Paste it in the box above and click <strong>Connect & Sync</strong>. All 95 items seed automatically!</li>
                  </ol>
                </div>

                <div className="space-y-1 pt-2 border-t border-zinc-900">
                  <strong className="text-white block font-mono text-[10px] uppercase">
                    Method 2: Supabase
                  </strong>
                  <ol className="list-decimal list-inside space-y-0.5 text-zinc-400 text-[11px]">
                    <li>Go to <a href="https://supabase.com" target="_blank" rel="noreferrer" className="text-white underline">supabase.com</a> &rarr; <strong>New Project</strong>.</li>
                    <li>Navigate to <strong>Project Settings</strong> &rarr; <strong>Database</strong> &rarr; <strong>Connection string</strong> (URI / Session pooler).</li>
                    <li>Paste it above (or add <code className="text-white">DATABASE_URL</code> in Vercel &rarr; Settings &rarr; Environment Variables).</li>
                  </ol>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ------------------------------------------------------------- */}
        {/* Section 2: Access Credentials */}
        {/* ------------------------------------------------------------- */}
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

        {/* ------------------------------------------------------------- */}
        {/* Section 3: Backup & Export */}
        {/* ------------------------------------------------------------- */}
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

        {/* ------------------------------------------------------------- */}
        {/* Section 4: Reset to Factory Initial Data */}
        {/* ------------------------------------------------------------- */}
        <div className="mt-4 space-y-1.5 font-mono">
          <span className="text-[11px] uppercase tracking-wider text-zinc-500 block">
            Factory Database Reset
          </span>
          <p className="text-[10px] text-zinc-500">
            Resets all quantities back to the initial ₹72,01,325 factory stock sheet across both local device and cloud database.
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
