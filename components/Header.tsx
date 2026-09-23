'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Bus, FileText, LayoutDashboard, RefreshCw, Bell, FastForward, Search, HelpCircle } from 'lucide-react';
import { useState } from 'react';

export default function Header() {
  const pathname = usePathname();
  const [reseeding, setReseeding] = useState(false);
  const [simulating, setSimulating] = useState(false);
  const [systemMessage, setSystemMessage] = useState<string | null>(null);

  const handleReseed = async () => {
    if (!confirm('Are you sure you want to reseed the database from /data/*.csv? Existing record updates will be merged.')) {
      return;
    }
    setReseeding(true);
    setSystemMessage(null);
    try {
      const res = await fetch('/api/seed', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        setSystemMessage('Reseeded database successfully!');
        setTimeout(() => window.location.reload(), 1000);
      } else {
        alert('Reseed failed: ' + data.error);
      }
    } catch (err) {
      alert('Reseed error occurred.');
    } finally {
      setReseeding(false);
    }
  };

  const handleSimulateTime = async () => {
    setSimulating(true);
    setSystemMessage(null);
    try {
      const res = await fetch('/api/simulate-time', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hours: 12 }),
      });
      const data = await res.json();
      if (data.success) {
        setSystemMessage(`⚡ ${data.message}`);
        setTimeout(() => window.location.reload(), 1200);
      } else {
        alert('Time simulation failed: ' + data.error);
      }
    } catch (err) {
      alert('Time simulation error occurred.');
    } finally {
      setSimulating(false);
    }
  };

  return (
    <header className="bg-slate-900 text-white shadow-2xl border-b border-slate-800 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo & Name (Native Transparent Logo Asset) */}
          <Link href="/" className="flex items-center space-x-3 group py-1 shrink-0">
            <img
              src="/yathra-care-logo.png"
              alt="Yathra Care Logo"
              className="h-8 sm:h-9 w-auto object-contain group-hover:scale-105 transition-transform shrink-0"
            />
            <div className="hidden md:block border-l border-white/20 pl-3">
              <p className="text-[11px] text-slate-300/80 font-medium tracking-wide">Passenger Grievance Portal</p>
            </div>
          </Link>

          {/* Navigation Links */}
          <nav className="flex items-center space-x-1 sm:space-x-2">
            <Link
              href="/#form"
              onClick={(e) => {
                if (pathname === '/') {
                  const el = document.getElementById('form');
                  if (el) {
                    e.preventDefault();
                    el.scrollIntoView({ behavior: 'smooth' });
                  }
                }
              }}
              className={`px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 ${
                pathname === '/'
                  ? 'bg-desktop-hero text-white shadow-md font-black ring-1 ring-white/30'
                  : 'text-slate-200 hover:text-white hover:bg-slate-800'
              }`}
            >
              <FileText className="w-4 h-4 text-desktop-accent" />
              <span className="hidden sm:inline">Report Grievance</span>
            </Link>

            <Link
              href="/track"
              className={`px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 ${
                pathname.startsWith('/track')
                  ? 'bg-desktop-hero text-white shadow-md font-black ring-1 ring-white/30'
                  : 'text-slate-200 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Search className="w-4 h-4 text-amber-400" />
              <span className="hidden sm:inline">Track Status</span>
            </Link>

            <Link
              href="/dashboard"
              className={`px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 ${
                pathname === '/dashboard'
                  ? 'bg-desktop-hero text-white shadow-md font-black ring-1 ring-white/30'
                  : 'text-slate-200 hover:text-white hover:bg-slate-800'
              }`}
            >
              <LayoutDashboard className="w-4 h-4 text-emerald-400" />
              <span className="hidden sm:inline">Depot Dashboard</span>
            </Link>

            <Link
              href="/help"
              className={`px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 ${
                pathname === '/help'
                  ? 'bg-desktop-hero text-white shadow-md font-black ring-1 ring-white/30'
                  : 'text-slate-200 hover:text-white hover:bg-slate-800'
              }`}
            >
              <HelpCircle className="w-4 h-4 text-indigo-400" />
              <span className="hidden sm:inline">Help</span>
            </Link>

            <Link
              href="/notifications"
              className={`px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 ${
                pathname === '/notifications'
                  ? 'bg-desktop-hero text-white shadow-md font-black ring-1 ring-white/30'
                  : 'text-slate-200 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Bell className="w-4 h-4 text-blue-400" />
              <span className="hidden sm:inline">Inbox</span>
            </Link>

            {/* Dev Action Buttons */}
            <button
              onClick={handleSimulateTime}
              disabled={simulating}
              title="Fast forward +12h to trigger SLA escalation engine for demo"
              className="px-3 py-2 rounded-xl text-xs font-black bg-desktop-accent hover:bg-desktop-accentHover text-white transition-all flex items-center space-x-1 disabled:opacity-50 shadow-md uppercase tracking-wider cursor-pointer"
            >
              <FastForward className={`w-3.5 h-3.5 ${simulating ? 'animate-bounce' : ''}`} />
              <span className="hidden md:inline">{simulating ? '+12h...' : '+12h SLA'}</span>
            </button>

            <button
              onClick={handleReseed}
              disabled={reseeding}
              title="Reseed database from /data/*.csv"
              className="px-3 py-2 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-all flex items-center space-x-1 disabled:opacity-50 cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${reseeding ? 'animate-spin text-desktop-accent' : ''}`} />
              <span className="hidden lg:inline">{reseeding ? 'Reseeding...' : 'Reseed CSV'}</span>
            </button>
          </nav>
        </div>
      </div>

      {systemMessage && (
        <div className="bg-amber-400 text-slate-950 text-xs text-center py-1.5 font-black animate-fade-in shadow-inner">
          {systemMessage}
        </div>
      )}
    </header>
  );
}
