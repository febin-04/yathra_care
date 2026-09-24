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
  Mail,
  Send,
  X,
  Check,
  Share2,
  AlertOctagon,
  FileText,
  Lock,
} from 'lucide-react';

const HIGHER_OFFICIALS = [
  {
    id: 'MD',
    name: 'Managing Director (MD), KSRTC',
    email: 'md@ksrtc.kerala.gov.in',
    role: 'Executive Headquarters & Command',
    icon: '👔',
  },
  {
    id: 'CVO',
    name: 'Chief Vigilance & Anti-Corruption Officer',
    email: 'vigilance@ksrtc.kerala.gov.in',
    role: 'Vigilance & Disciplinary Oversight',
    icon: '🛡️',
  },
  {
    id: 'ED_OPS',
    name: 'Executive Director (Operations - ED-Ops)',
    email: 'edoperations@ksrtc.kerala.gov.in',
    role: 'Statewide Fleet & Scheduling Control',
    icon: '🚌',
  },
  {
    id: 'TC_MVD',
    name: 'Transport Commissioner, Motor Vehicles Dept (MVD)',
    email: 'tc.mvd@kerala.gov.in',
    role: 'State Transport Regulatory Authority',
    icon: '⚖️',
  },
  {
    id: 'ZONAL_HQ',
    name: 'Zonal Executive Officer (Central Command)',
    email: 'zonal.command@ksrtc.kerala.gov.in',
    role: 'Regional Zonal Operations',
    icon: '🏢',
  },
  {
    id: 'CUSTOM',
    name: 'Custom Recipient / Official Email Address',
    email: '',
    role: 'Specify custom official destination',
    icon: '✉️',
  },
];

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

  // Row Selection for Forwarding Mails
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [showForwardModal, setShowForwardModal] = useState(false);
  const [selectedOfficialId, setSelectedOfficialId] = useState<string>('MD');
  const [customName, setCustomName] = useState<string>('');
  const [customEmail, setCustomEmail] = useState<string>('');
  const [forwardPriority, setForwardPriority] = useState<'HIGH' | 'URGENT' | 'NORMAL'>('HIGH');
  const [officerRemarks, setOfficerRemarks] = useState<string>('');
  const [forwarding, setForwarding] = useState(false);
  const [forwardSuccessMsg, setForwardSuccessMsg] = useState<string | null>(null);

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

  const handleExecuteForward = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedIds.length === 0) return;

    let targetName = '';
    let targetEmail = '';

    if (selectedOfficialId === 'CUSTOM') {
      if (!customEmail.trim()) {
        setErrorMsg('Please enter a valid recipient email address.');
        return;
      }
      targetName = customName.trim() || 'Higher Authority';
      targetEmail = customEmail.trim();
    } else {
      const matched = HIGHER_OFFICIALS.find((o) => o.id === selectedOfficialId);
      if (matched) {
        targetName = matched.name;
        targetEmail = matched.email;
      }
    }

    setForwarding(true);
    setErrorMsg(null);

    try {
      const res = await fetch('/api/forward-complaints', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          complaint_ids: selectedIds,
          official_name: targetName,
          official_email: targetEmail,
          priority: forwardPriority,
          forwarded_by: 'Depot Command Unit (Station Master)',
          remarks: officerRemarks.trim() || 'Forwarded for executive scrutiny and departmental action.',
        }),
      });

      const result = await res.json();
      if (result.success) {
        setForwardSuccessMsg(`✉️ Official Dossier Dispatched: ${selectedIds.length} grievance(s) successfully forwarded to ${targetName} (${targetEmail}).`);
        setShowForwardModal(false);
        setSelectedIds([]);
        setOfficerRemarks('');
        fetchComplaints();
      } else {
        setErrorMsg(result.error || 'Failed to forward grievances.');
      }
    } catch (err) {
      setErrorMsg('Network error while forwarding grievances to officials.');
    } finally {
      setForwarding(false);
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

  const selectedComplaintsObjects = complaints.filter((c) => selectedIds.includes(c.id));

  return (
    <div className="space-y-6">
      {/* Error & Success Messages */}
      {errorMsg && (
        <div className="bg-rose-50 border border-rose-200 text-rose-800 p-4 rounded-xl text-xs font-semibold flex items-center justify-between animate-fade-in shadow-sm">
          <span>{errorMsg}</span>
          <button onClick={() => setErrorMsg(null)} className="text-rose-600 font-bold ml-2">
            ✕
          </button>
        </div>
      )}

      {forwardSuccessMsg && (
        <div className="bg-emerald-50 border border-emerald-300 text-emerald-900 p-4 rounded-2xl text-xs font-bold flex items-center justify-between shadow-md animate-fade-in">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>{forwardSuccessMsg}</span>
          </div>
          <button onClick={() => setForwardSuccessMsg(null)} className="text-emerald-700 font-extrabold ml-2">
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

      {/* FLOATING / STICKY SELECTION BAR: Forward to Higher Officials */}
      {selectedIds.length > 0 && (
        <div className="bg-gradient-to-r from-slate-900 via-desktop-deep to-desktop-hero text-white p-4 rounded-3xl shadow-2xl flex flex-col sm:flex-row items-center justify-between gap-3 animate-scale-in border border-blue-400/40">
          <div className="flex items-center space-x-3.5">
            <div className="w-10 h-10 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 text-white flex items-center justify-center font-black text-sm shadow-inner">
              {selectedIds.length}
            </div>
            <div>
              <span className="font-black text-sm block tracking-tight">
                {selectedIds.length} Grievance Ticket{selectedIds.length > 1 ? 's' : ''} Selected
              </span>
              <span className="text-[11px] text-blue-200">
                Ready for executive briefing & forwarding to higher authorities
              </span>
            </div>
          </div>

          <div className="flex items-center space-x-2.5 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={() => setSelectedIds([])}
              className="px-3.5 py-2 rounded-xl text-xs font-bold text-slate-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            >
              Clear Selection
            </button>
            <button
              type="button"
              onClick={() => setShowForwardModal(true)}
              className="bg-desktop-accent hover:bg-desktop-accentHover text-white px-5 py-2.5 rounded-2xl text-xs font-black transition-all shadow-xl hover:shadow-2xl flex items-center gap-2 uppercase tracking-wide cursor-pointer transform hover:scale-105"
            >
              <Mail className="w-4 h-4" />
              <span>Forward to Higher Officials ({selectedIds.length})</span>
            </button>
          </div>
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
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden">
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
                  <th className="p-4 w-12 text-center">
                    <input
                      type="checkbox"
                      checked={complaints.length > 0 && selectedIds.length === complaints.length}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedIds(complaints.map((c) => c.id));
                        } else {
                          setSelectedIds([]);
                        }
                      }}
                      title="Select All Grievances"
                      className="w-4 h-4 rounded text-desktop-hero focus:ring-desktop-hero cursor-pointer"
                    />
                  </th>
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
                  const isChecked = selectedIds.includes(item.id);

                  return (
                    <tr
                      key={item.id}
                      className={`hover:bg-slate-50/80 transition-colors ${
                        isChecked ? 'bg-blue-50/50' : item.escalated ? 'bg-rose-50/40' : ''
                      }`}
                    >
                      {/* Selection Checkbox */}
                      <td className="p-4 text-center">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedIds((prev) => [...prev, item.id]);
                            } else {
                              setSelectedIds((prev) => prev.filter((id) => id !== item.id));
                            }
                          }}
                          className="w-4 h-4 rounded text-desktop-hero focus:ring-desktop-hero cursor-pointer"
                        />
                      </td>

                      {/* Ref Number */}
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

                      {/* Depot & Route */}
                      <td className="p-4 whitespace-nowrap">
                        <div className="font-semibold text-slate-800">{item.depot_name || 'Central Depot'}</div>
                        <div className="text-xs text-slate-500">{item.route_name || item.route_id || 'General Route'}</div>
                      </td>

                      {/* Category Selector */}
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

                      {/* Description */}
                      <td className="p-4 max-w-xs">
                        <p className="text-xs text-slate-700 font-medium line-clamp-2">{item.description}</p>
                        {item.location && (
                          <span className="text-[11px] text-slate-400 block mt-0.5">Location: {item.location}</span>
                        )}
                      </td>

                      {/* SLA Deadline */}
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

                      {/* Action Button */}
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

      {/* FORWARD TO HIGHER OFFICIALS MODAL */}
      {showForwardModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full p-6 sm:p-8 space-y-6 border border-slate-200 max-h-[90vh] overflow-y-auto animate-scale-in">
            {/* Header */}
            <div className="flex justify-between items-start border-b border-slate-100 pb-4">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-r from-desktop-deep to-desktop-hero text-white flex items-center justify-center shadow-md">
                  <Mail className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-black text-slate-900">Forward to Higher Authorities</h3>
                  <p className="text-xs text-slate-500 font-medium">
                    Dispatch executive escalation dossier for {selectedIds.length} selected grievance ticket{selectedIds.length > 1 ? 's' : ''}.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowForwardModal(false)}
                className="text-slate-400 hover:text-slate-700 text-sm font-bold bg-slate-100 hover:bg-slate-200 w-8 h-8 rounded-full flex items-center justify-center transition-colors"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleExecuteForward} className="space-y-5">
              {/* Selected Grievance Tags Preview */}
              <div>
                <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-2">
                  Selected Grievance Tickets ({selectedIds.length})
                </label>
                <div className="flex flex-wrap gap-2 max-h-24 overflow-y-auto p-2 bg-slate-50 rounded-2xl border border-slate-200">
                  {selectedComplaintsObjects.map((c) => (
                    <span
                      key={c.id}
                      className="bg-white border border-slate-300 text-slate-800 text-[11px] font-mono font-bold px-2.5 py-1 rounded-xl shadow-sm flex items-center gap-1.5"
                    >
                      <span>#{c.reference_number}</span>
                      <span className="text-[10px] font-sans text-slate-500">({c.category})</span>
                    </span>
                  ))}
                </div>
              </div>

              {/* Destination Official Selection */}
              <div>
                <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-2">
                  Select Destination Official / Command Authority <span className="text-rose-500">*</span>
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {HIGHER_OFFICIALS.map((official) => (
                    <div
                      key={official.id}
                      onClick={() => setSelectedOfficialId(official.id)}
                      className={`p-3.5 rounded-2xl border text-xs font-semibold cursor-pointer transition-all flex items-start space-x-2.5 ${
                        selectedOfficialId === official.id
                          ? 'bg-blue-50/80 border-desktop-hero text-desktop-hero shadow-md ring-2 ring-desktop-hero/20'
                          : 'bg-slate-50/60 border-slate-200 text-slate-700 hover:bg-slate-100/80'
                      }`}
                    >
                      <span className="text-xl mt-0.5">{official.icon}</span>
                      <div className="flex-1 min-w-0">
                        <span className="font-extrabold text-slate-900 block truncate">{official.name}</span>
                        <span className="text-[11px] text-slate-500 block truncate">{official.role}</span>
                        {official.email && (
                          <span className="text-[10px] font-mono text-desktop-hero font-bold block mt-0.5 truncate">
                            {official.email}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Custom Official Input if CUSTOM is chosen */}
              {selectedOfficialId === 'CUSTOM' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-200 animate-fade-in">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Official Name / Title</label>
                    <input
                      type="text"
                      value={customName}
                      onChange={(e) => setCustomName(e.target.value)}
                      placeholder="e.g. Regional Transport Officer (RTO)"
                      className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-desktop-hero"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Official Email Address <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="email"
                      value={customEmail}
                      onChange={(e) => setCustomEmail(e.target.value)}
                      placeholder="e.g. officer@ksrtc.gov.in"
                      className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-desktop-hero"
                      required
                    />
                  </div>
                </div>
              )}

              {/* Urgency / Priority Level */}
              <div>
                <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-1.5">
                  Escalation Urgency Level
                </label>
                <div className="flex gap-2">
                  {(['NORMAL', 'HIGH', 'URGENT'] as const).map((lvl) => (
                    <button
                      key={lvl}
                      type="button"
                      onClick={() => setForwardPriority(lvl)}
                      className={`flex-1 py-2 px-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all border cursor-pointer ${
                        forwardPriority === lvl
                          ? lvl === 'URGENT'
                            ? 'bg-rose-600 text-white border-rose-700 shadow-md'
                            : lvl === 'HIGH'
                            ? 'bg-orange-600 text-white border-orange-700 shadow-md'
                            : 'bg-desktop-hero text-white border-blue-900 shadow-md'
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {lvl === 'URGENT' ? '🚨 Immediate (Critical)' : lvl === 'HIGH' ? '⚡ High Priority' : 'ℹ️ Normal Review'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Remarks / Action Notes */}
              <div>
                <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-1.5">
                  Officer Remarks & Recommended Action
                </label>
                <textarea
                  value={officerRemarks}
                  onChange={(e) => setOfficerRemarks(e.target.value)}
                  rows={3}
                  placeholder="Specify context (e.g. repeated driver reckless driving complaints, route schedule breach requiring fleet redistribution, vigilance probe recommended)..."
                  className="w-full bg-slate-50 border border-slate-300 text-slate-900 rounded-2xl p-3 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-desktop-hero"
                />
              </div>

              {/* Submit CTA Bar */}
              <div className="pt-2 flex justify-end gap-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowForwardModal(false)}
                  className="px-5 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={forwarding}
                  className="bg-desktop-accent hover:bg-desktop-accentHover text-white px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-lg hover:shadow-xl flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <Send className="w-4 h-4" />
                  <span>{forwarding ? 'Dispatching Dossier...' : 'Dispatch Dossier Now'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Inspect & State Transition History Modal */}
      {activeComplaint && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-3xl shadow-2xl max-w-xl w-full p-6 space-y-4 border border-slate-200 max-h-[90vh] overflow-y-auto animate-scale-in">
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
                className="bg-slate-800 text-white px-5 py-2 rounded-xl text-xs font-bold hover:bg-slate-900 transition-colors cursor-pointer"
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
