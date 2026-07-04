import React, { useState } from 'react';
import { Shield, Lock, User, AlertCircle, ArrowLeft } from 'lucide-react';

interface MPLoginProps {
  onLoginSuccess: () => void;
  onCancel: () => void;
}

export default function MPLogin({ onLoginSuccess, onCancel }: MPLoginProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    // Simple delay to simulate authentication check
    setTimeout(() => {
      if (username === 'mp_admin' && password === 'MP_Secure_2026') {
        onLoginSuccess();
      } else {
        setError('Invalid Secretariat username or password. Please verify your credentials.');
      }
      setIsLoading(false);
    }, 600);
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12" id="mp-login-view">
      <div className="bg-white border border-slate-100 max-w-md w-full rounded-2xl shadow-xl overflow-hidden">
        {/* Banner */}
        <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-emerald-950 text-white p-6 relative">
          <div className="absolute top-4 right-4 bg-emerald-500/20 text-emerald-300 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-500/30 font-mono">
            SECURE PORTAL
          </div>
          <div className="flex items-center space-x-3 mb-2">
            <div className="bg-emerald-600 p-2 rounded-lg text-white">
              <Shield className="h-5 w-5" />
            </div>
            <h3 className="font-display font-extrabold text-lg">MP Secretariat Sign In</h3>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed font-medium">
            Access to the constituency prioritizer priority weights, AI cluster configurations, and project funding controls.
          </p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-150 p-3.5 rounded-xl text-xs text-red-700 flex items-start space-x-2.5 font-medium leading-relaxed">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-red-600" />
              <span>{error}</span>
            </div>
          )}

          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider font-mono">
              Secretariat Username
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 pointer-events-none">
                <User className="h-4 w-4" />
              </span>
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="e.g. mp_admin"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 pl-10 pr-3 text-xs font-semibold placeholder-slate-400 focus:outline-none focus:border-emerald-600 focus:bg-white focus:ring-1 focus:ring-emerald-600 transition-all text-slate-800"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider font-mono">
              Access Password
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 pointer-events-none">
                <Lock className="h-4 w-4" />
              </span>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 pl-10 pr-3 text-xs font-semibold placeholder-slate-400 focus:outline-none focus:border-emerald-600 focus:bg-white focus:ring-1 focus:ring-emerald-600 transition-all text-slate-800"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-emerald-700 hover:bg-emerald-800 text-white font-bold py-2.5 rounded-xl shadow-xs text-xs flex items-center justify-center space-x-1.5 cursor-pointer transition-colors"
          >
            {isLoading ? (
              <span className="inline-block animate-pulse">Verifying credentials...</span>
            ) : (
              <span>Authorize Access</span>
            )}
          </button>

          <button
            type="button"
            onClick={onCancel}
            className="w-full bg-slate-50 border border-slate-200 text-slate-600 font-semibold py-2 rounded-xl text-xs flex items-center justify-center space-x-1 hover:bg-slate-100 transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Return to Citizen Portal</span>
          </button>
        </form>
      </div>
    </div>
  );
}
