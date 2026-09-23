'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Bus, FileText, LayoutDashboard, Bell, FastForward, Search, HelpCircle } from 'lucide-react';
import { useState } from 'react';

export default function Header() {
  const pathname = usePathname();
  const [simulating, setSimulating] = useState(false);
  const [systemMessage, setSystemMessage] = useState<string | null>(null);

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
          {/* Brand Logo & Name (SVG Logo Asset - Direct Insertion on Dark Navy Header) */}
          <Link href="/" className="flex items-center space-x-3 group py-1 shrink-0">
            <img
              src="/yathra-care-logo.svg"
              onError={(e) => {
                e.currentTarget.src = '/yathra-care-logo.png';
              }}
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
              className={`hidden md:flex items-center space-x-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                pathname === '/'
                  ? 'bg-desktop-hero text-white shadow-md font-black ring-1 ring-white/30'
                  : 'text-slate-200 hover:text-white hover:bg-slate-800'
              }`}
            >
              <FileText className="w-4 h-4 text-desktop-accent" />
              <span>Report Grievance</span>
            </Link>

            <Link
              href="/track"
              className={`hidden md:flex items-center space-x-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                pathname.startsWith('/track')
                  ? 'bg-desktop-hero text-white shadow-md font-black ring-1 ring-white/30'
                  : 'text-slate-200 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Search className="w-4 h-4 text-amber-400" />
              <span>Track Status</span>
            </Link>

            <Link
              href="/dashboard"
              className={`hidden md:flex items-center space-x-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                pathname === '/dashboard'
                  ? 'bg-desktop-hero text-white shadow-md font-black ring-1 ring-white/30'
                  : 'text-slate-200 hover:text-white hover:bg-slate-800'
              }`}
            >
              <LayoutDashboard className="w-4 h-4 text-emerald-400" />
              <span>Depot Dashboard</span>
            </Link>

            <Link
              href="/help"
              className={`hidden md:flex items-center space-x-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                pathname === '/help'
                  ? 'bg-desktop-hero text-white shadow-md font-black ring-1 ring-white/30'
                  : 'text-slate-200 hover:text-white hover:bg-slate-800'
              }`}
            >
              <HelpCircle className="w-4 h-4 text-indigo-400" />
              <span>Help</span>
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
              <span className="hidden md:inline">Inbox</span>
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
