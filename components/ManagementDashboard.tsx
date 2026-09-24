'use client';

import { useState, useEffect } from 'react';
import {
  AnonymisedComplaint,
  CategoryVolumeStat,
  DepotSLABreachStat,
  RouteTrendAlert,
} from '@/lib/management';
import {
  ShieldCheck,
  AlertOctagon,
  AlertTriangle,
  Flame,
  TrendingUp,
  Building2,
  PieChart,
  Clock,
  ArrowUpRight,
  RefreshCw,
  CheckCircle2,
  Lock,
  Bus,
  FastForward,
  Grid,
  ListFilter,
  BarChart3,
  Check,
} from 'lucide-react';
import Link from 'next/link';

export default function ManagementDashboard() {
  const [data, setData] = useState<{
    anonymised: boolean;
    totalComplaints: number;
    statusCounts: Record<string, number>;
    categoryVolumeStats: CategoryVolumeStat[];
    depotSLABreachStats: DepotSLABreachStat[];
    routeTrendAlerts?: RouteTrendAlert[];
    priorityNeedsAttention: AnonymisedComplaint[];
  } | null>(null);

  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState(7);
  const [simulating, setSimulating] = useState(false);
  const [simulationMsg, setSimulationMsg] = useState<string | null>(null);

  // Mobile Active View Switcher Tab ('OVERVIEW' | 'DEPOTS' | 'CATEGORIES' | 'PRIORITY')
  const [mobileTab, setMobileTab] = useState<'OVERVIEW' | 'DEPOTS' | 'CATEGORIES' | 'PRIORITY'>('OVERVIEW');

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/management-dashboard?days=${timeRange}`);
      const result = await res.json();
      if (result.success) {
        setData(result.data);
      }
    } catch (e) {
      console.error('Error fetching management metrics', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [timeRange]);

  const handleSimulateTime = async () => {
    setSimulating(true);
    setSimulationMsg(null);
    try {
      const res = await fetch('/api/simulate-time', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hours: 12 }),
      });
      const result = await res.json();
      if (result.success) {
        setSimulationMsg(`⏱️ Fast-Forward Complete: +12 hours simulated. ${result.data.escalated_count} grievance(s) auto-escalated to DEP-HQ.`);
        fetchData();
      }
    } catch (e) {
      setSimulationMsg('Failed to run time simulation.');
    } finally {
      setSimulating(false);
    }
  };

  if (loading || !data) {
    return (
      <div className="flex flex-col items-center justify-center p-16 text-slate-500">
        <div className="w-10 h-10 border-4 border-desktop-hero border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-xs font-black text-slate-700">Generating Anonymised Executive Intelligence Report...</p>
      </div>
    );
  }

  const { totalComplaints, statusCounts, categoryVolumeStats, depotSLABreachStats, routeTrendAlerts = [], priorityNeedsAttention } = data;

  const openCount = (statusCounts['SUBMITTED'] || 0) + (statusCounts['ACKNOWLEDGED'] || 0) + (statusCounts['IN_PROGRESS'] || 0);
  const escalatedCount = statusCounts['ESCALATED'] || 0;
  const resolvedCount = statusCounts['RESOLVED'] || 0;

  return (
    <div className="space-y-8">
      {/* Privacy Redaction Guarantee Banner & Dev Time Machine */}
      <div className="bg-gradient-to-r from-desktop-deep via-desktop-hero to-desktop-navy text-white rounded-3xl p-6 shadow-2xl border border-white/10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center space-x-3.5">
          <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-md text-emerald-300 border border-white/20 flex items-center justify-center shrink-0">
            <Lock className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-black text-white">Anonymised Management Dashboard</h2>
              <span className="bg-emerald-500/20 text-emerald-300 text-[10px] font-black px-2.5 py-0.5 rounded-full border border-emerald-500/30 uppercase tracking-wider">
                SQL Redaction Active
              </span>
            </div>
            <p className="text-xs text-blue-100 mt-0.5 font-medium">
              Complainant identity, phone numbers, exact locations, and raw allegations scrubbed at the database query layer.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Dev Control: Fast Forward +12h */}
          <button
            onClick={handleSimulateTime}
            disabled={simulating}
            className="bg-desktop-accent hover:bg-desktop-accentHover text-white px-3.5 py-2 rounded-xl text-xs font-black transition-all shadow flex items-center gap-1.5 uppercase tracking-wide cursor-pointer disabled:opacity-50"
          >
            <FastForward className="w-3.5 h-3.5" />
            <span>{simulating ? 'Simulating...' : 'Simulate +12h SLA'}</span>
          </button>

          <select
            value={timeRange}
            onChange={(e) => setTimeRange(parseInt(e.target.value, 10))}
            className="bg-white/10 border border-white/20 text-white text-xs font-bold rounded-xl px-3 py-2 focus:outline-none"
          >
            <option value={7} className="bg-slate-900">Last 7 Days</option>
            <option value={14} className="bg-slate-900">Last 14 Days</option>
            <option value={30} className="bg-slate-900">Last 30 Days</option>
          </select>

          <button
            onClick={fetchData}
            className="bg-white/10 hover:bg-white/20 text-white px-3 py-2 rounded-xl text-xs font-bold transition-colors flex items-center gap-1"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {simulationMsg && (
        <div className="bg-amber-50 border border-amber-300 text-amber-900 p-4 rounded-2xl text-xs font-bold flex items-center justify-between shadow-sm animate-fade-in">
          <span>{simulationMsg}</span>
          <button onClick={() => setSimulationMsg(null)} className="text-amber-700 font-extrabold ml-2">
            ✕
          </button>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 1. DESKTOP VIEW (Global Express Stats-Bar Pattern + Destination Tables)     */}
      {/* ========================================================================= */}
      <div className="hidden md:block space-y-8">
        {/* STATS-BAR PATTERN (Top-Line Numbers styled like Global Express "10K+ transported") */}
        <div className="bg-gradient-to-r from-desktop-deep via-desktop-hero to-desktop-navy text-white rounded-3xl p-6 shadow-2xl border border-white/10">
          <div className="text-xs font-black uppercase tracking-widest text-blue-200 mb-4 flex justify-between items-center">
            <span>Executive Grievance Operations Overview</span>
            <span className="bg-white/10 px-3 py-0.5 rounded-full text-[10px]">Real-Time Database Feed</span>
          </div>

          <div className="grid grid-cols-5 gap-4 divide-x divide-white/15">
            <div className="px-4 first:pl-0">
              <span className="text-xs font-bold text-blue-200 block">Total Grievances</span>
              <div className="text-3xl font-black text-white mt-1 font-heading">{totalComplaints}</div>
              <span className="text-[10px] text-blue-200 block mt-1">Ingested in window</span>
            </div>

            <div className="px-4">
              <span className="text-xs font-bold text-amber-300 block">Open Cases</span>
              <div className="text-3xl font-black text-amber-300 mt-1 font-heading">{openCount}</div>
              <span className="text-[10px] text-amber-200 block mt-1">Pending resolution</span>
            </div>

            <div className="px-4">
              <span className="text-xs font-bold text-rose-300 block">SLA Escalated</span>
              <div className="text-3xl font-black text-rose-300 mt-1 font-heading">{escalatedCount}</div>
              <span className="text-[10px] text-rose-200 block mt-1">Reassigned to HQ</span>
            </div>

            <div className="px-4">
              <span className="text-xs font-bold text-emerald-300 block">Resolved</span>
              <div className="text-3xl font-black text-emerald-300 mt-1 font-heading">{resolvedCount}</div>
              <span className="text-[10px] text-emerald-200 block mt-1">Successfully closed</span>
            </div>

            <div className="px-4">
              <span className="text-xs font-bold text-blue-200 block">Active Depots</span>
              <div className="text-3xl font-black text-white mt-1 font-heading">{depotSLABreachStats.length}</div>
              <span className="text-[10px] text-blue-200 block mt-1">Connected command hubs</span>
            </div>
          </div>
        </div>

        {/* REPEATED ROUTE ISSUES TREND ALERTS */}
        {routeTrendAlerts.length > 0 && (
          <div className="bg-amber-50 border-2 border-amber-300 rounded-3xl p-6 shadow-xl space-y-4 animate-fade-in">
            <div className="flex items-center justify-between border-b border-amber-200 pb-3">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-500 text-white flex items-center justify-center font-black shadow-md animate-bounce">
                  <Flame className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-black text-amber-950">Repeated Route Issues & Cluster Alerts</h3>
                    <span className="bg-amber-200 text-amber-950 text-[10px] font-black px-2.5 py-0.5 rounded-full border border-amber-300 uppercase">
                      Hotspot Detection Active
                    </span>
                  </div>
                  <p className="text-xs text-amber-800 font-medium mt-0.5">
                    Routes exhibiting clustered complaints require immediate operational inspection or depot driver coaching.
                  </p>
                </div>
              </div>
              <span className="text-xs font-black bg-amber-600 text-white px-3 py-1 rounded-full shadow">
                {routeTrendAlerts.length} Flagged Route Clusters
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {routeTrendAlerts.map((alert) => (
                <div
                  key={alert.route_id}
                  className={`p-4 rounded-2xl border-2 space-y-3 shadow-sm transition-all ${
                    alert.risk_level === 'HIGH_RISK'
                      ? 'bg-rose-50 border-rose-300 text-rose-950'
                      : 'bg-white border-amber-300 text-amber-950'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-1.5 font-mono font-black text-xs">
                      <Bus className="w-4 h-4 text-amber-600" />
                      <span>{alert.route_id}</span>
                    </div>
                    <span
                      className={`text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase ${
                        alert.risk_level === 'HIGH_RISK'
                          ? 'bg-rose-600 text-white animate-pulse'
                          : 'bg-amber-500 text-white'
                      }`}
                    >
                      {alert.risk_level === 'HIGH_RISK' ? 'Critical Hotspot' : 'Repeated Trend'}
                    </span>
                  </div>

                  <div>
                    <h4 className="font-extrabold text-sm text-slate-900 truncate">{alert.route_name}</h4>
                    <span className="text-[11px] text-slate-500">Depot: {alert.depot_name || 'Central'}</span>
                  </div>

                  <div className="bg-white/80 p-2.5 rounded-xl border border-amber-200 text-xs space-y-1">
                    <div className="flex justify-between font-bold text-slate-800">
                      <span>Recent Complaints:</span>
                      <strong className="text-rose-600 font-black">{alert.complaint_count} Tickets</strong>
                    </div>
                    <div className="text-[11px] text-slate-600">
                      Primary Issue: <strong className="text-slate-800">{alert.top_category}</strong>
                    </div>
                  </div>

                  <div className="pt-1 flex justify-between items-center text-[10px] text-slate-400">
                    <span>Latest: {new Date(alert.latest_complaint_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    <Link
                      href={`/dashboard?search=${encodeURIComponent(alert.route_id)}`}
                      className="text-amber-700 font-extrabold hover:underline flex items-center gap-0.5"
                    >
                      <span>Filter Route Tickets</span>
                      <ArrowUpRight className="w-3 h-3" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* SECTION 2: "NEEDS ATTENTION" PRIORITY RANKED LIST */}
        <div className="bg-white rounded-3xl p-8 shadow-xl border border-slate-200 space-y-6">
          <div className="flex justify-between items-center border-b border-slate-100 pb-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center font-black">
                <Flame className="w-6 h-6 animate-pulse" />
              </div>
              <div>
                <h2 className="text-xl font-black text-slate-900 tracking-tight">Needs Attention (Priority Ranked)</h2>
                <p className="text-xs text-slate-500 font-medium">
                  Priority Score = Severity Weight × (7D Route Volume + 1) × Overdue Multiplier
                </p>
              </div>
            </div>
            <span className="text-xs font-mono font-bold bg-rose-50 text-rose-700 px-3 py-1 rounded-full border border-rose-200">
              Top {priorityNeedsAttention.length} Critical Grievances
            </span>
          </div>

          {priorityNeedsAttention.length === 0 ? (
            <div className="text-center py-8 text-slate-400 text-xs font-medium">No open grievances requiring critical priority intervention.</div>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              {priorityNeedsAttention.map((item, idx) => (
                <div
                  key={item.id}
                  className="bg-slate-50 hover:bg-slate-100/90 transition-all rounded-2xl p-5 border border-slate-200 space-y-3 relative shadow-sm"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex items-center space-x-2">
                      <span className="w-7 h-7 rounded-xl bg-desktop-deep text-white font-mono font-black text-xs flex items-center justify-center shadow">
                        #{idx + 1}
                      </span>
                      <span className="font-mono text-xs font-bold text-slate-800">{item.reference_number}</span>
                    </div>

                    <span className="bg-rose-600 text-white text-[11px] font-black px-2.5 py-0.5 rounded-lg shadow-sm flex items-center gap-1">
                      <Flame className="w-3 h-3" /> Priority Score: {item.priority_score}
                    </span>
                  </div>

                  <div className="space-y-1">
                    <div className="text-sm font-extrabold text-slate-900">{item.category}</div>
                    <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">{item.sanitised_description}</p>
                  </div>

                  <div className="pt-2 border-t border-slate-200 flex justify-between items-center text-[11px] text-slate-500">
                    <div><strong className="text-slate-700">Depot:</strong> {item.depot_name || 'Central'}</div>
                    <div className="bg-amber-100 text-amber-900 font-bold px-2 py-0.5 rounded">7D Route Vol: {item.route_7day_volume}</div>
                    <div>
                      <strong className="text-slate-700">SLA:</strong>{' '}
                      <span className={item.escalated ? 'text-rose-600 font-bold' : 'text-slate-700'}>
                        {new Date(item.sla_deadline).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* SECTION 3 & 4: DESTINATION-LIST STYLE STRIPED ROWS (Depot & Category Breakdowns) */}
        <div className="grid grid-cols-2 gap-8">
          {/* Depot SLA Breach Table Rows */}
          <div className="bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden">
            <div className="bg-gradient-to-r from-desktop-deep to-desktop-hero text-white p-5 flex justify-between items-center">
              <div className="flex items-center space-x-2.5">
                <Building2 className="w-5 h-5 text-blue-200" />
                <h3 className="text-lg font-black text-white">Depot SLA Breach Performance</h3>
              </div>
              <span className="text-xs bg-white/20 px-2.5 py-0.5 rounded-full font-bold">Depot Level</span>
            </div>

            <div className="divide-y divide-slate-100 text-xs">
              {depotSLABreachStats.map((depot) => (
                <div
                  key={depot.depot_id}
                  className="p-4 hover:bg-desktop-bgTint transition-colors flex items-center justify-between odd:bg-slate-50/50"
                >
                  <div>
                    <h4 className="font-extrabold text-slate-900 text-xs">{depot.depot_name} ({depot.depot_id})</h4>
                    <span className="text-[11px] text-slate-500 font-medium">
                      Total: {depot.total_complaints} | Breached: <strong className="text-rose-600">{depot.breached_count}</strong>
                    </span>
                  </div>

                  <span
                    className={`px-3 py-1 rounded-full text-xs font-black shadow-sm ${
                      depot.breach_rate > 30
                        ? 'bg-rose-100 text-rose-800 border border-rose-200'
                        : depot.breach_rate > 0
                        ? 'bg-amber-100 text-amber-800 border border-amber-200'
                        : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                    }`}
                  >
                    {depot.breach_rate}% Breach Rate
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Category Volume Striped Rows */}
          <div className="bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden">
            <div className="bg-gradient-to-r from-desktop-deep to-desktop-hero text-white p-5 flex justify-between items-center">
              <div className="flex items-center space-x-2.5">
                <PieChart className="w-5 h-5 text-blue-200" />
                <h3 className="text-lg font-black text-white">Category Volume Breakdown</h3>
              </div>
              <span className="text-xs bg-white/20 px-2.5 py-0.5 rounded-full font-bold">Categories</span>
            </div>

            <div className="p-5 space-y-4 text-xs">
              {categoryVolumeStats.map((cat) => (
                <div key={cat.category} className="space-y-1.5">
                  <div className="flex justify-between items-center font-bold text-slate-800">
                    <div className="flex items-center space-x-2">
                      <span>{cat.category}</span>
                      <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-mono">
                        Weight: {cat.severity_weight}
                      </span>
                    </div>
                    <span className="font-mono text-desktop-hero">{cat.count} ({cat.percentage}%)</span>
                  </div>

                  <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden p-0.5 border border-slate-200/60">
                    <div
                      className="bg-desktop-hero h-full rounded-full transition-all duration-500"
                      style={{ width: `${Math.max(cat.percentage, 5)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. MOBILE VIEW (YATRE Colored-Grid Pattern + Bottom Nav Switcher)          */}
      {/* ========================================================================= */}
      <div className="block md:hidden space-y-6">
        {/* Mobile View Navigation Pills */}
        <div className="flex bg-mobile-cardTint p-1 rounded-2xl border border-mobile-border overflow-x-auto justify-between">
          {[
            { id: 'OVERVIEW', label: 'Overview', icon: <Grid className="w-3.5 h-3.5" /> },
            { id: 'DEPOTS', label: 'Depots', icon: <Building2 className="w-3.5 h-3.5" /> },
            { id: 'CATEGORIES', label: 'Categories', icon: <PieChart className="w-3.5 h-3.5" /> },
            { id: 'PRIORITY', label: 'Priority', icon: <Flame className="w-3.5 h-3.5" /> },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setMobileTab(tab.id as any)}
              className={`flex-1 py-2 px-2 rounded-xl text-[11px] font-black transition-all flex items-center justify-center space-x-1 ${
                mobileTab === tab.id
                  ? 'bg-mobile-header text-white shadow-md'
                  : 'text-mobile-primaryBtn hover:bg-white/50'
              }`}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* TAB 1: OVERVIEW & YATRE REIMAGINED COLORED SEAT-MAP GRID */}
        {mobileTab === 'OVERVIEW' && (
          <div className="space-y-6 animate-fade-in">
            {/* Top Stat Pills */}
            <div className="grid grid-cols-2 gap-3 text-center">
              <div className="bg-white p-4 rounded-2xl border border-mobile-border shadow-sm">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Total Ingested</span>
                <strong className="text-xl font-black text-mobile-primaryBtn">{totalComplaints}</strong>
              </div>
              <div className="bg-white p-4 rounded-2xl border border-mobile-border shadow-sm">
                <span className="text-[10px] uppercase font-bold text-rose-500 block">SLA Escalated</span>
                <strong className="text-xl font-black text-rose-600">{escalatedCount}</strong>
              </div>
            </div>

            {/* YATRE REIMAGINED COLORED SEAT-MAP GRID */}
            <div className="bg-white rounded-3xl p-5 border border-mobile-border shadow-xl space-y-4">
              <div>
                <span className="text-[10px] font-black uppercase tracking-widest text-mobile-header block">
                  Depot SLA Status Seat-Map Grid
                </span>
                <h3 className="text-base font-black text-slate-900">Color-Coded Depot Grid</h3>
                <p className="text-[11px] text-slate-500 font-medium">
                  Green = On-Track • Amber = At-Risk • Red = Breached SLA
                </p>
              </div>

              {/* Grid Cells (Color coded by breach rate) */}
              <div className="grid grid-cols-2 gap-3">
                {depotSLABreachStats.map((depot) => {
                  const isBreached = depot.breach_rate > 30;
                  const isAtRisk = depot.breach_rate > 0 && depot.breach_rate <= 30;

                  return (
                    <div
                      key={depot.depot_id}
                      className={`p-4 rounded-2xl border-2 transition-all flex flex-col justify-between space-y-2 shadow-sm ${
                        isBreached
                          ? 'bg-rose-100 border-rose-400 text-rose-950 animate-pulse'
                          : isAtRisk
                          ? 'bg-amber-100 border-amber-400 text-amber-950'
                          : 'bg-emerald-100 border-emerald-400 text-emerald-950'
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <span className="font-mono text-xs font-black">{depot.depot_id}</span>
                        {isBreached ? (
                          <AlertOctagon className="w-4 h-4 text-rose-600" />
                        ) : isAtRisk ? (
                          <Clock className="w-4 h-4 text-amber-600" />
                        ) : (
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        )}
                      </div>

                      <div>
                        <strong className="text-xs font-black block truncate">{depot.depot_name}</strong>
                        <span className="text-[10px] font-bold block opacity-80">
                          {depot.breach_rate}% Breach ({depot.breached_count}/{depot.total_complaints})
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: DEPOTS */}
        {mobileTab === 'DEPOTS' && (
          <div className="bg-white rounded-3xl p-5 border border-mobile-border shadow-xl space-y-3 animate-fade-in">
            <h3 className="text-sm font-black text-slate-900">Depot Compliance List</h3>
            <div className="space-y-2 text-xs">
              {depotSLABreachStats.map((depot) => (
                <div key={depot.depot_id} className="p-3 bg-mobile-cardTint rounded-2xl flex justify-between items-center">
                  <div>
                    <strong className="text-slate-900 block font-bold">{depot.depot_name}</strong>
                    <span className="text-[11px] text-slate-500">Total: {depot.total_complaints} | Breached: {depot.breached_count}</span>
                  </div>
                  <span className={`px-2.5 py-1 rounded-full text-[11px] font-black ${depot.breach_rate > 30 ? 'bg-rose-600 text-white' : 'bg-emerald-600 text-white'}`}>
                    {depot.breach_rate}%
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 3: CATEGORIES */}
        {mobileTab === 'CATEGORIES' && (
          <div className="bg-white rounded-3xl p-5 border border-mobile-border shadow-xl space-y-4 animate-fade-in text-xs">
            <h3 className="text-sm font-black text-slate-900">Category Grievance Volume</h3>
            {categoryVolumeStats.map((cat) => (
              <div key={cat.category} className="space-y-1">
                <div className="flex justify-between font-bold">
                  <span>{cat.category}</span>
                  <span className="text-mobile-header">{cat.count} ({cat.percentage}%)</span>
                </div>
                <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                  <div className="bg-mobile-header h-full rounded-full" style={{ width: `${cat.percentage}%` }} />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* TAB 4: PRIORITY NEEDS ATTENTION */}
        {mobileTab === 'PRIORITY' && (
          <div className="space-y-3 animate-fade-in">
            <h3 className="text-xs font-black uppercase text-slate-500 tracking-wider">Priority Ranked Needs Attention</h3>
            {priorityNeedsAttention.map((item, idx) => (
              <div key={item.id} className="bg-white p-4 rounded-2xl border border-mobile-border shadow-md space-y-2 text-xs">
                <div className="flex justify-between items-center">
                  <span className="font-mono font-bold text-slate-800">#{idx + 1} {item.reference_number}</span>
                  <span className="bg-rose-600 text-white text-[10px] font-black px-2 py-0.5 rounded">
                    Score: {item.priority_score}
                  </span>
                </div>
                <strong className="text-slate-900 block font-black">{item.category}</strong>
                <p className="text-slate-600 text-[11px] line-clamp-2">{item.sanitised_description}</p>
                <div className="pt-1 text-[10px] text-slate-400 flex justify-between">
                  <span>Depot: {item.depot_name || 'Central'}</span>
                  <span>SLA: {new Date(item.sla_deadline).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
