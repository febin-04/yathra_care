'use client';

import { useState, useEffect } from 'react';
import DashboardTable from '@/components/DashboardTable';
import ManagementDashboard from '@/components/ManagementDashboard';
import { BarChart3, Table, ShieldCheck, Lock, Unlock, KeyRound, AlertCircle, X, Building2 } from 'lucide-react';

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState<'MANAGEMENT' | 'OPERATIONS'>('MANAGEMENT');
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [showAuthModal, setShowAuthModal] = useState<boolean>(false);
  const [passwordInput, setPasswordInput] = useState<string>('');
  const [authError, setAuthError] = useState<string>('');
  const [depotsList, setDepotsList] = useState<{ id: string; name: string }[]>([]);
  const [selectedDepotId, setSelectedDepotId] = useState<string>('');
  const [authenticatedDepotId, setAuthenticatedDepotId] = useState<string>('');

  useEffect(() => {
    async function loadDepots() {
      try {
        const res = await fetch('/api/meta');
        const data = await res.json();
        if (data.success && data.data.depots) {
          setDepotsList(data.data.depots);
        }
      } catch (e) {
        console.error('Failed to load depots metadata', e);
      }
    }
    loadDepots();
  }, []);

  useEffect(() => {
    // Force password authentication on every page reload/refresh
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('depot_auth');
      const params = new URLSearchParams(window.location.search);
      if (params.get('tab') === 'operations') {
        setActiveTab('OPERATIONS');
        setShowAuthModal(true);
      }
    }
  }, []);

  const handleTabClick = (tab: 'MANAGEMENT' | 'OPERATIONS') => {
    if (tab === 'OPERATIONS' && !isAuthenticated) {
      setShowAuthModal(true);
      setAuthError('');
      setPasswordInput('');
      return;
    }
    setActiveTab(tab);
  };

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Default passcodes: depot123 or admin2026
    if (passwordInput === 'depot123' || passwordInput === 'admin2026') {
      setIsAuthenticated(true);
      setAuthenticatedDepotId(selectedDepotId);
      setShowAuthModal(false);
      setActiveTab('OPERATIONS');
      setAuthError('');
    } else {
      setAuthError('Invalid authority passcode. Access denied.');
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('depot_auth');
    }
    setActiveTab('MANAGEMENT');
  };

  return (
    <div className="space-y-6">
      {/* Top Title & View Switcher Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/80 pb-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            Depot Intelligence & Operations
            {isAuthenticated && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
                <ShieldCheck className="w-3.5 h-3.5 mr-1 text-emerald-600" />
                Authority Verified
              </span>
            )}
          </h1>
          <p className="text-xs text-slate-500">
            Anonymised executive analytics, priority ranking engine, and depot grievance management.
          </p>
        </div>

        {/* View Switcher Tabs & Lock controls */}
        <div className="flex items-center space-x-2">
          <div className="flex bg-slate-200/80 p-1 rounded-2xl border border-slate-300/60 shadow-inner">
            <button
              onClick={() => handleTabClick('MANAGEMENT')}
              className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all flex items-center space-x-2 ${
                activeTab === 'MANAGEMENT'
                  ? 'bg-brand-600 text-white shadow-md'
                  : 'text-slate-700 hover:text-slate-900'
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              <span>Anonymised Executive View</span>
            </button>

            <button
              onClick={() => handleTabClick('OPERATIONS')}
              className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all flex items-center space-x-2 ${
                activeTab === 'OPERATIONS'
                  ? 'bg-brand-600 text-white shadow-md'
                  : 'text-slate-700 hover:text-slate-900'
              }`}
            >
              {isAuthenticated ? <Unlock className="w-4 h-4 text-emerald-400" /> : <Lock className="w-4 h-4 text-amber-500" />}
              <span>Depot Operations Table</span>
            </button>
          </div>

          {isAuthenticated && (
            <button
              onClick={handleLogout}
              title="Lock Operations View"
              className="p-2 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all border border-slate-200"
            >
              <Lock className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Auth Gate Modal */}
      {showAuthModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-md w-full p-6 relative overflow-hidden">
            <button
              onClick={() => setShowAuthModal(false)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-all"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center space-x-3 mb-4">
              <div className="w-12 h-12 rounded-2xl bg-brand-50 border border-brand-200 flex items-center justify-center text-brand-600 shadow-sm">
                <KeyRound className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-black text-slate-900">Depot Authority Verification</h3>
                <p className="text-xs text-slate-500">Restricted operational access</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 mb-4 leading-relaxed">
              The <strong>Depot Operations Table</strong> contains internal complaint handling and status workflow controls reserved strictly for station masters and depot authorities.
            </p>

            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center justify-between">
                  <span>Select Station / Depot ID</span>
                  <span className="text-[10px] text-slate-400 font-normal">Mapped to depot's buses</span>
                </label>
                <div className="relative">
                  <Building2 className="w-4 h-4 text-slate-400 absolute left-3.5 top-3 pointer-events-none" />
                  <select
                    value={selectedDepotId}
                    onChange={(e) => setSelectedDepotId(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 text-slate-900 rounded-xl py-2.5 pl-10 pr-4 text-xs font-semibold focus:ring-2 focus:ring-brand-500 outline-none cursor-pointer"
                  >
                    <option value="">All Depots (Regional HQ View)</option>
                    {depotsList.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.id} — {d.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Enter Authority Passcode
                </label>
                <input
                  type="password"
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  placeholder="Enter passcode (e.g. depot123)"
                  autoFocus
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none transition-all"
                />
              </div>

              {authError && (
                <div className="flex items-center space-x-2 text-xs text-rose-600 bg-rose-50 p-3 rounded-xl border border-rose-200">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{authError}</span>
                </div>
              )}

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-[11px] text-slate-500 flex items-center justify-between">
                <span>Default Passcode for Demo:</span>
                <code className="font-mono bg-white px-2 py-0.5 rounded border border-slate-300 text-brand-700 font-bold">depot123</code>
              </div>

              <div className="flex justify-end space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAuthModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-xs font-extrabold text-white bg-brand-600 hover:bg-brand-700 shadow-md shadow-brand-600/20 transition-all flex items-center space-x-2"
                >
                  <Unlock className="w-3.5 h-3.5" />
                  <span>Unlock Operations</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Tab Content */}
      {activeTab === 'MANAGEMENT' ? <ManagementDashboard /> : <DashboardTable initialDepotId={authenticatedDepotId} />}
    </div>
  );
}
