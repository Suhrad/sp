'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getCurrentSession, setSession, verifyLogin, DEFAULT_CREDENTIALS } from '@/lib/auth';
import { ArrowRight, AlertCircle, Eye, EyeOff } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  useEffect(() => {
    const session = getCurrentSession();
    if (session) {
      router.replace('/');
    }
  }, [router]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!username.trim() || !password) {
      setError('Please provide both User ID and Password');
      return;
    }

    setLoading(true);

    setTimeout(() => {
      const isValid = verifyLogin(username, password);
      if (isValid) {
        setSession(username.trim());
        router.replace('/');
      } else {
        setError('Invalid credentials. Check your Login ID and password.');
        setLoading(false);
      }
    }, 250);
  };

  const fillDefaultAdmin = () => {
    setUsername(DEFAULT_CREDENTIALS.username);
    setPassword(DEFAULT_CREDENTIALS.password);
    setError('');
  };

  return (
    <div className="min-h-screen bg-[#09090b] flex flex-col justify-between items-center px-4 py-8 relative">
      {/* Subtle top subtle border highlight */}
      <div className="w-full max-w-7xl mx-auto flex justify-between items-center pt-2 pb-6 border-b border-zinc-900">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 bg-white text-black flex items-center justify-center font-black text-xs rounded-md tracking-tighter">
            OS
          </div>
          <span className="text-xs font-mono uppercase tracking-widest text-zinc-400 font-bold">
            STOCK PLATFORM &bull; ENTERPRISE
          </span>
        </div>
        <div className="flex items-center gap-2 text-xs text-zinc-500 font-mono">
          <span className="w-1.5 h-1.5 rounded-full bg-white"></span>
          <span>SYSTEM ONLINE</span>
        </div>
      </div>

      {/* Main Login Card */}
      <div className="w-full max-w-sm my-auto">
        <div className="bg-[#121215] border border-zinc-800/80 rounded-2xl p-7 shadow-2xl">
          <div className="mb-6">
            <h1 className="text-xl font-bold text-white tracking-tight">
              Sign In
            </h1>
            <p className="text-xs text-zinc-400 mt-1">
              Authorized access to polymer godown inventory
            </p>
          </div>

          {error && (
            <div className="mb-5 p-3 rounded-lg bg-zinc-900 border border-zinc-700/80 flex items-start gap-2.5 text-zinc-200 text-xs font-mono">
              <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-[11px] font-mono uppercase tracking-wider text-zinc-400 mb-1.5">
                Login ID
              </label>
              <input
                type="text"
                autoCapitalize="none"
                autoCorrect="off"
                placeholder="Enter user id"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full bg-[#09090b] border border-zinc-800 rounded-lg px-3.5 py-2.5 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-white transition-colors font-mono"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-[11px] font-mono uppercase tracking-wider text-zinc-400">
                  Password
                </label>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-[#09090b] border border-zinc-800 rounded-lg px-3.5 py-2.5 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-white transition-colors font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-zinc-500 hover:text-zinc-300"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs text-zinc-400 pt-0.5">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-3.5 h-3.5 rounded bg-zinc-900 border-zinc-700 text-white accent-white"
                />
                <span>Remember device</span>
              </label>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-2.5 px-4 rounded-lg font-bold text-xs uppercase tracking-wider text-black bg-white hover:bg-zinc-200 active:scale-[0.99] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <span>Authenticate</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </form>

          {/* Quick-fill helper */}
          <div className="mt-6 pt-5 border-t border-zinc-800/80 text-center">
            <button
              type="button"
              onClick={fillDefaultAdmin}
              className="text-xs text-zinc-400 hover:text-white font-mono transition-colors underline underline-offset-4"
            >
              Auto-fill default admin credentials
            </button>
          </div>
        </div>
      </div>

      <div className="w-full max-w-7xl mx-auto flex justify-between items-center text-[11px] text-zinc-600 font-mono pt-4 border-t border-zinc-900">
        <span>SECURITY PROTOCOL 2.4</span>
        <span>&copy; {new Date().getFullYear()} STOCK OS</span>
      </div>
    </div>
  );
}
