'use client';

import { useState, useEffect } from 'react';
import { Complaint, Depot, Category, StatusHistoryItem } from '@/lib/complaints';
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  Search,
  ShieldAlert,
  Building2,
  RefreshCw,
  Eye,
  History,
  User,
  ArrowRight,
} from 'lucide-react';

export default function DashboardTable({ initialDepotId }: { initialDepotId?: string }) {
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [depots, setDepots] = useState<Depot[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Filters
  const [selectedDepot, setSelectedDepot] = useState(initialDepotId || '');

  useEffect(() => {
    if (initialDepotId !== undefined) {
      setSelectedDepot(initialDepotId);
    }
  }, [initialDepotId]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [escalatedOnly, setEscalatedOnly] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Active complaint for detail modal
  const [activeComplaint, setActiveComplaint] = useState<Complaint | null>(null);

  const fetchComplaints = async () => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams();
      if (selectedDepot) queryParams.set('depot_id', selectedDepot);
      if (selectedCategory) queryParams.set('category', selectedCategory);
      if (selectedStatus) queryParams.set('status', selectedStatus);
      if (escalatedOnly) queryParams.set('escalated', 'true');
      if (searchTerm) queryParams.set('search', searchTerm);

      const res = await fetch(`/api/complaints?${queryParams.toString()}`);
      const data = await res.json();
      if (data.success) {
        setComplaints(data.data);
      }
    } catch (err) {
      console.error('Failed to load complaints', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    async function loadMeta() {
      try {
        const res = await fetch('/api/meta');
        const data = await res.json();
        if (data.success) {
          setDepots(data.data.depots);
          setCategories(data.data.categories);
        }
      } catch (err) {
        console.error('Meta load error', err);
      }
    }
    loadMeta();
  }, []);

  useEffect(() => {
    fetchComplaints();
  }, [selectedDepot, selectedCategory, selectedStatus, escalatedOnly, searchTerm]);

  const handleCategoryChange = async (id: number | string, newCategory: string) => {
    setErrorMsg(null);
    try {
      const res = await fetch(`/api/complaints/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category: newCategory,
          changed_by: 'DEPOT_ADMIN',
        }),
      });
      const data = await res.json();
      if (data.success) {
        fetchComplaints();
        if (activeComplaint && (activeComplaint.id === id || activeComplaint.reference_number === id)) {
          setActiveComplaint(data.data);
        }
      } else {
        setErrorMsg(data.error || 'Category update failed.');
      }
    } catch (err) {
      setErrorMsg('Network error while updating category.');
    }
  };

  const handleStatusChange = async (id: number | string, newStatus: string) => {
    setErrorMsg(null);
    try {
      const res = await fetch(`/api/complaints/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: newStatus,
          changed_by: 'DEPOT_ADMIN',
          notes: `Transitioned via Operations Dashboard to ${newStatus}`,
        }),
      });
      const data = await res.json();
      if (data.success) {
        fetchComplaints();
        if (activeComplaint && (activeComplaint.id === id || activeComplaint.reference_number === id)) {
          setActiveComplaint(data.data);
        }
      } else {
        setErrorMsg(data.error || 'Transition failed.');
      }
    } catch (err) {
      setErrorMsg('Network error while updating status.');
    }
  };

  // Stats calculation
  const totalCount = complaints.length;
  const submittedCount = complaints.filter((c) => c.status === 'SUBMITTED').length;
  const inProgressCount = complaints.filter(
    (c) => c.status === 'IN_PROGRESS' || c.status === 'ACKNOWLEDGED'
  ).length;
  const resolvedCount = complaints.filter((c) => c.status === 'RESOLVED').length;
  const escalatedCount = complaints.filter((c) => c.escalated === 1 || c.status === 'ESCALATED').length;

  const ALL_POSSIBLE_STATUSES = [
    'SUBMITTED',
    'ACKNOWLEDGED',
    'IN_PROGRESS',
    'ESCALATED',
    'RESOLVED',
    'REJECTED',
  ];

  return (
    <div className="space-y-6">
      {errorMsg && (
        <div className="bg-rose-50 border border-rose-200 text-rose-800 p-4 rounded-xl text-xs font-semibold flex items-center justify-between">
          <span>{errorMsg}</span>
          <button onClick={() => setErrorMsg(null)} className="text-rose-600 font-bold ml-2">
            ✕
          </button>
        </div>
      )}

      {/* KPI Stats Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Complaints</p>
            <h3 className="text-2xl font-black text-slate-900 mt-1">{totalCount}</h3>
          </div>
          <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center font-bold">
            <Building2 className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-amber-600 uppercase tracking-wider">Submitted</p>
            <h3 className="text-2xl font-black text-amber-700 mt-1">{submittedCount}</h3>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-blue-600 uppercase tracking-wider">In Progress</p>
            <h3 className="text-2xl font-black text-blue-700 mt-1">{inProgressCount}</h3>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <RefreshCw className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-emerald-600 uppercase tracking-wider">Resolved</p>
            <h3 className="text-2xl font-black text-emerald-700 mt-1">{resolvedCount}</h3>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-rose-200 bg-rose-50/30 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-rose-600 uppercase tracking-wider">SLA Escalated</p>
            <h3 className="text-2xl font-black text-rose-700 mt-1">{escalatedCount}</h3>
          </div>
          <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center animate-pulse">
            <ShieldAlert className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Active Depot Filter Notice Banner */}
      {selectedDepot && (
        <div className="bg-brand-50 border border-brand-200 text-brand-900 rounded-2xl p-4 text-xs font-semibold flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-sm">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 bg-brand-600 text-white rounded-xl shrink-0">
              <Building2 className="w-4 h-4" />
            </div>
            <div>
              <p className="font-extrabold text-sm text-brand-950">
                Depot Scope: {depots.find((d) => d.id === selectedDepot)?.name || selectedDepot} ({selectedDepot})
              </p>
              <p className="text-[11px] text-brand-700 font-medium">
                Filtering complaints received for buses and routes belonging to this depot.
              </p>
            </div>
          </div>
          <button
            onClick={() => setSelectedDepot('')}
            className="text-xs bg-white text-brand-700 border border-brand-300 hover:bg-brand-100 px-3 py-1.5 rounded-xl font-bold transition-all shrink-0"
          >
            Clear / View All Depots
          </button>
        </div>
      )}

      {/* Control & Filter Panel */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row gap-3 justify-between items-stretch md:items-center">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search reference number, description, or location..."
              className="w-full bg-slate-50 border border-slate-300 text-slate-900 rounded-xl pl-10 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          <button
            onClick={() => setEscalatedOnly(!escalatedOnly)}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 border ${
              escalatedOnly
                ? 'bg-rose-600 text-white border-rose-700 shadow'
                : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
            }`}
          >
            <AlertTriangle className="w-4 h-4" />
            <span>Escalated Only ({escalatedCount})</span>
          </button>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-slate-100">
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Filter by Depot</label>
            <select
              value={selectedDepot}
              onChange={(e) => setSelectedDepot(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 text-slate-900 rounded-lg p-2 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-brand-500"
            >
              <option value="">All Depots</option>
              {depots.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Filter by Category</label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 text-slate-900 rounded-lg p-2 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-brand-500"
            >
              <option value="">All Categories</option>
              {categories.map((c) => (
                <option key={c.id} value={c.name}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Filter by Status</label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 text-slate-900 rounded-lg p-2 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-brand-500"
            >
              <option value="">All Statuses</option>
              {ALL_POSSIBLE_STATUSES.map((st) => (
                <option key={st} value={st}>
                  {st}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Complaints Data Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-500">
            <div className="w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
            <p className="text-xs font-semibold">Refreshing Grievance Records...</p>
          </div>
        ) : complaints.length === 0 ? (
          <div className="p-12 text-center text-slate-500 space-y-2">
            <Building2 className="w-10 h-10 text-slate-300 mx-auto" />
            <p className="text-sm font-semibold text-slate-700">No grievances found matching criteria.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-600 uppercase tracking-wider">
                  <th className="p-4">Ref Number</th>
                  <th className="p-4">Depot & Route</th>
                  <th className="p-4">Category</th>
                  <th className="p-4">Description</th>
                  <th className="p-4">SLA Deadline</th>
                  <th className="p-4">State Machine Status</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {complaints.map((item) => {
                  const deadlineDate = new Date(item.sla_deadline);
                  const isPast = deadlineDate < new Date();
                  const isTerminal = item.status === 'RESOLVED' || item.status === 'REJECTED';
                  const allowedNext = item.allowed_next_statuses || [];

                  return (
                    <tr
                      key={item.id}
                      className={`hover:bg-slate-50/80 transition-colors ${
                        item.escalated ? 'bg-rose-50/40' : ''
                      }`}
                    >
                      <td className="p-4 font-mono font-bold text-slate-800 whitespace-nowrap">
                        <div className="flex items-center space-x-1.5">
                          {item.escalated ? (
                            <span title="Overdue - SLA Escalated" className="w-2 h-2 rounded-full bg-rose-600 animate-ping" />
                          ) : null}
                          <span>{item.reference_number}</span>
                        </div>
                        {item.is_duplicate ? (
                          <div className="mt-1">
                            <span className="bg-amber-100 text-amber-800 text-[10px] font-extrabold px-2 py-0.5 rounded-md border border-amber-200">
                              🔗 Dup of #{item.parent_reference_number || 'Parent'}
                            </span>
                          </div>
                        ) : null}
                      </td>

                      <td className="p-4 whitespace-nowrap">
                        <div className="font-semibold text-slate-800">{item.depot_name || 'Central Depot'}</div>
                        <div className="text-xs text-slate-500">{item.route_name || item.route_id || 'General Route'}</div>
                      </td>

                      <td className="p-4 font-medium text-slate-700 whitespace-nowrap">
                        <select
                          value={item.category}
                          onChange={(e) => handleCategoryChange(item.id, e.target.value)}
                          className="bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs px-2.5 py-1 rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-brand-500 font-bold cursor-pointer transition-colors"
                        >
                          {categories.map((c) => (
                            <option key={c.id} value={c.name}>
                              {c.name}
                            </option>
                          ))}
                        </select>
                      </td>

                      <td className="p-4 max-w-xs">
                        <p className="text-xs text-slate-700 font-medium line-clamp-2">{item.description}</p>
                        {item.location && (
                          <span className="text-[11px] text-slate-400 block mt-0.5">Location: {item.location}</span>
                        )}
                      </td>

                      <td className="p-4 whitespace-nowrap">
                        <div className="text-xs font-semibold">
                          {deadlineDate.toLocaleDateString()} {deadlineDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                        {!isTerminal && (
                          <div className={`text-[11px] font-bold mt-0.5 ${isPast ? 'text-rose-600' : 'text-amber-600'}`}>
                            {isPast ? 'OVERDUE (ESCALATED)' : 'Within SLA Target'}
                          </div>
                        )}
                      </td>

                      {/* State Machine Transition Selector */}
                      <td className="p-4 whitespace-nowrap">
                        {isTerminal ? (
                          <span
                            className={`text-xs font-extrabold px-3 py-1 rounded-lg ${
                              item.status === 'RESOLVED' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-700'
                            }`}
                          >
                            {item.status} (Terminal)
                          </span>
                        ) : (
                          <select
                            value={item.status}
                            onChange={(e) => handleStatusChange(item.id, e.target.value)}
                            className={`text-xs font-bold rounded-lg px-2.5 py-1 focus:outline-none border ${
                              item.status === 'ESCALATED'
                                ? 'bg-rose-100 text-rose-800 border-rose-300 font-black'
                                : item.status === 'IN_PROGRESS'
                                ? 'bg-blue-50 text-blue-800 border-blue-300'
                                : item.status === 'ACKNOWLEDGED'
                                ? 'bg-indigo-50 text-indigo-800 border-indigo-300'
                                : 'bg-amber-50 text-amber-800 border-amber-300'
                            }`}
                          >
                            <option value={item.status}>{item.status} (Current)</option>
                            {allowedNext.map((st) => (
                              <option key={st} value={st}>
                                → {st}
                              </option>
                            ))}
                          </select>
                        )}
                      </td>

                      <td className="p-4 text-right whitespace-nowrap">
                        <button
                          onClick={() => setActiveComplaint(item)}
                          className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors inline-flex items-center space-x-1"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Inspect & History</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Inspect & State Transition History Modal */}
      {activeComplaint && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-xl w-full p-6 space-y-4 border border-slate-200 max-h-[90vh] overflow-y-auto animate-scale-in">
            <div className="flex justify-between items-start border-b pb-3">
              <div>
                <span className="text-xs font-mono text-slate-500 font-bold">{activeComplaint.reference_number}</span>
                <h3 className="text-lg font-bold text-slate-900">{activeComplaint.category}</h3>
              </div>
              <button
                onClick={() => setActiveComplaint(null)}
                className="text-slate-400 hover:text-slate-700 text-sm font-bold bg-slate-100 w-8 h-8 rounded-full flex items-center justify-center"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 text-xs text-slate-700">
              <div>
                <strong className="text-slate-900 block text-xs uppercase tracking-wider mb-1">Description</strong>
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-sm leading-relaxed text-slate-800">
                  {activeComplaint.description}
                </div>
              </div>

              {/* Status History Audit Log */}
              <div className="border-t pt-3 space-y-2">
                <h4 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                  <History className="w-4 h-4 text-brand-600" />
                  <span>State Machine Transition Audit History</span>
                </h4>

                <div className="bg-slate-50 rounded-xl p-3 border border-slate-200 space-y-3">
                  {activeComplaint.status_history && activeComplaint.status_history.length > 0 ? (
                    activeComplaint.status_history.map((hist, idx) => (
                      <div key={hist.id || idx} className="flex items-start space-x-3 text-xs relative pb-2 border-b border-slate-200/60 last:border-b-0 last:pb-0">
                        <div className="w-6 h-6 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                          {idx + 1}
                        </div>
                        <div className="flex-1 space-y-0.5">
                          <div className="flex items-center gap-1.5 font-bold text-slate-800">
                            <span>{hist.from_status || 'CREATED'}</span>
                            <ArrowRight className="w-3 h-3 text-slate-400" />
                            <span className="text-brand-700">{hist.to_status}</span>
                          </div>
                          <p className="text-slate-600">{hist.notes}</p>
                          <div className="flex items-center gap-2 text-[10px] text-slate-400">
                            <span className="flex items-center gap-0.5">
                              <User className="w-3 h-3" /> {hist.changed_by}
                            </span>
                            <span>•</span>
                            <span>{new Date(hist.changed_at).toLocaleString()}</span>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-slate-400 italic">No transition history logged yet.</p>
                  )}
                </div>
              </div>
            </div>

            <div className="pt-2 flex justify-end gap-2 border-t">
              <button
                onClick={() => setActiveComplaint(null)}
                className="bg-slate-800 text-white px-5 py-2 rounded-xl text-xs font-bold hover:bg-slate-900 transition-colors"
              >
                Close Window
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
