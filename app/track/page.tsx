'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Complaint } from '@/lib/complaints';
import {
  Search,
  CheckCircle2,
  Clock,
  AlertCircle,
  Building2,
  Bus,
  MapPin,
  ArrowRight,
  FileText,
  Copy,
  Check,
  QrCode,
  ShieldCheck,
  Star,
  RefreshCw,
} from 'lucide-react';

function TrackContent() {
  const searchParams = useSearchParams();
  const initialRef = searchParams.get('ref') || '';

  const [referenceNumber, setReferenceNumber] = useState(initialRef);
  const [complaint, setComplaint] = useState<Complaint | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const fetchStatus = async (ref: string) => {
    if (!ref.trim()) return;
    setLoading(true);
    setError(null);
    setComplaint(null);

    // Sanitize leading row numbers, quotes, or symbols (e.g. "1 GRV-...", "#GRV-...")
    const cleanRef = ref.trim().replace(/^#?\s*\d+[\s.-]+(?=GRV)/i, '').replace(/^#/i, '').trim();

    try {
      const res = await fetch(`/api/complaints/${encodeURIComponent(cleanRef || ref.trim())}`);
      const data = await res.json();
      if (data.success) {
        setComplaint(data.data);
      } else {
        setError(data.error || 'No grievance found with this reference number.');
      }
    } catch (e) {
      setError('Unable to retrieve status. Please check your network connection.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (initialRef) {
      fetchStatus(initialRef);
    }
  }, [initialRef]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchStatus(referenceNumber);
  };

  const copyRef = () => {
    if (complaint) {
      navigator.clipboard.writeText(complaint.reference_number);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const WORKFLOW_STEPS = [
    { key: 'SUBMITTED', label: 'Submitted', desc: 'Grievance registered' },
    { key: 'ACKNOWLEDGED', label: 'Acknowledged', desc: 'Depot received' },
    { key: 'IN_PROGRESS', label: 'In Progress', desc: 'Action team dispatched' },
    { key: 'RESOLVED', label: 'Resolved', desc: 'Issue resolved' },
  ];

  const currentStatus = complaint?.status || 'SUBMITTED';
  const isEscalated = complaint?.escalated === 1 || currentStatus === 'ESCALATED';
  const isRejected = currentStatus === 'REJECTED';
  const isResolved = currentStatus === 'RESOLVED';

  const getStepIndex = (st: string) => {
    if (st === 'SUBMITTED') return 0;
    if (st === 'ACKNOWLEDGED') return 1;
    if (st === 'IN_PROGRESS') return 2;
    if (st === 'RESOLVED') return 3;
    return 1;
  };
  const activeStepIdx = getStepIndex(currentStatus);

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* ========================================================================= */}
      {/* SEARCH HEADER BAR (Desktop Navy/Orange vs Mobile YATRE Header)             */}
      {/* ========================================================================= */}
      <div className="bg-gradient-to-r from-desktop-deep via-desktop-hero to-desktop-navy text-white rounded-3xl p-6 md:p-8 shadow-2xl border border-white/10 space-y-4">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center text-desktop-accent shadow-inner">
            <Search className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] font-black uppercase tracking-widest text-blue-200">Public Status Portal</span>
            <h1 className="text-2xl font-black text-white tracking-tight">Track Grievance Live Status</h1>
          </div>
        </div>

        {/* Search Input Box */}
        <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            <input
              type="text"
              value={referenceNumber}
              onChange={(e) => setReferenceNumber(e.target.value)}
              placeholder="Enter Reference Tracking Code (e.g. RT101-20260923-0001)..."
              className="w-full bg-white text-slate-900 font-mono font-bold text-xs md:text-sm px-4 py-3.5 rounded-2xl shadow-inner focus:outline-none focus:ring-2 focus:ring-desktop-accent"
              required
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="bg-desktop-accent hover:bg-desktop-accentHover text-white px-7 py-3.5 rounded-2xl font-black text-xs md:text-sm transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2 uppercase tracking-wide disabled:opacity-50 cursor-pointer"
          >
            <span>{loading ? 'Searching...' : 'Track Status'}</span>
          </button>
        </form>
      </div>

      {error && (
        <div className="bg-rose-50 border border-rose-200 text-rose-800 p-5 rounded-2xl text-xs font-semibold flex items-center gap-2 shadow-sm animate-fade-in">
          <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {complaint && (
        <div className="space-y-8 animate-scale-in">
          {/* ========================================================================= */}
          {/* 1. DESKTOP VIEW: Card-Summary Pattern + Horizontal Timeline               */}
          {/* ========================================================================= */}
          <div className="hidden md:block">
            <div className="bg-white rounded-3xl shadow-2xl border border-slate-200/90 overflow-hidden">
              {/* Card Summary Header */}
              <div className="bg-gradient-to-r from-desktop-deep to-desktop-hero text-white p-6 flex justify-between items-center">
                <div>
                  <span className="text-[10px] uppercase font-black tracking-widest text-blue-200 block">
                    Reference Ticket Code
                  </span>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="font-mono text-2xl font-black text-white">{complaint.reference_number}</span>
                    <button
                      onClick={copyRef}
                      className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-blue-200 transition-colors"
                      title="Copy Reference"
                    >
                      {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                    </button>
                    {copied && <span className="text-[10px] text-emerald-300 font-bold">Copied!</span>}
                  </div>
                </div>

                <div className="text-right space-y-1">
                  <span
                    className={`px-4 py-1.5 rounded-full text-xs font-black shadow-md inline-block ${
                      isResolved
                        ? 'bg-emerald-500 text-white'
                        : isRejected
                        ? 'bg-slate-700 text-white'
                        : isEscalated
                        ? 'bg-rose-600 text-white animate-pulse'
                        : 'bg-amber-500 text-slate-950'
                    }`}
                  >
                    {isEscalated ? 'ESCALATED (OVERDUE)' : complaint.status}
                  </span>
                  <span className="text-xs font-bold text-blue-200 block">Category: {complaint.category}</span>
                </div>
              </div>

              {/* HORIZONTAL STATUS TIMELINE (Desktop) */}
              <div className="p-8 bg-desktop-bgTint border-b border-slate-200">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="text-xs font-black uppercase tracking-wider text-desktop-hero">
                    Live Workflow Progress Timeline
                  </h3>
                  <span className="text-[11px] font-bold text-slate-500">
                    SLA Target: {new Date(complaint.sla_deadline).toLocaleString()}
                  </span>
                </div>

                <div className="relative pt-6 pb-2">
                  {/* Progress Line */}
                  <div className="absolute top-10 left-8 right-8 h-1.5 bg-slate-200 -translate-y-1/2 z-0 rounded-full" />
                  <div
                    className="absolute top-10 left-8 h-1.5 bg-desktop-hero -translate-y-1/2 transition-all duration-500 z-0 rounded-full"
                    style={{
                      width: isResolved
                        ? 'calc(100% - 4rem)'
                        : `${(activeStepIdx / (WORKFLOW_STEPS.length - 1)) * 85}%`,
                    }}
                  />

                  {/* Step Nodes */}
                  <div className="flex justify-between items-center relative z-10">
                    {WORKFLOW_STEPS.map((step, idx) => {
                      const isDone = activeStepIdx > idx || isResolved;
                      const isCurrent = activeStepIdx === idx && !isResolved && !isRejected;

                      return (
                        <div key={step.key} className="flex flex-col items-center text-center">
                          <div
                            className={`w-10 h-10 rounded-full flex items-center justify-center font-black text-xs shadow-md transition-all ${
                              isDone
                                ? 'bg-emerald-600 text-white'
                                : isCurrent
                                ? 'bg-desktop-hero text-white ring-4 ring-blue-200 scale-110'
                                : 'bg-white border-2 border-slate-300 text-slate-400'
                            }`}
                          >
                            {isDone ? <CheckCircle2 className="w-5 h-5" /> : idx + 1}
                          </div>
                          <span
                            className={`text-xs font-extrabold mt-2.5 ${
                              isCurrent ? 'text-desktop-hero font-black' : isDone ? 'text-slate-800' : 'text-slate-400'
                            }`}
                          >
                            {step.label}
                          </span>
                          <span className="text-[10px] text-slate-500 mt-0.5 max-w-[100px]">{step.desc}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {isEscalated && (
                  <div className="mt-4 bg-rose-100 border border-rose-300 text-rose-900 p-3 rounded-xl text-xs font-extrabold flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
                    <span>⚠️ SLA Breached: Complaint auto-escalated and reassigned to Regional HQ Command (`DEP-HQ`).</span>
                  </div>
                )}
              </div>

              {/* Grid Summary Details */}
              <div className="p-8 space-y-6">
                <div>
                  <h4 className="text-xs font-black uppercase tracking-wider text-slate-500 mb-2">Complaint Description</h4>
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 text-xs text-slate-800 leading-relaxed font-semibold">
                    {complaint.description}
                  </div>
                </div>

                <div className="grid grid-cols-4 gap-4 text-xs">
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
                    <span className="text-slate-400 font-bold block mb-1">Bus Route</span>
                    <strong className="text-xs text-slate-800 font-extrabold flex items-center gap-1">
                      <Bus className="w-4 h-4 text-desktop-hero" />
                      {complaint.route_name || complaint.route_id || 'General Route'}
                    </strong>
                  </div>

                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
                    <span className="text-slate-400 font-bold block mb-1">Assigned Depot</span>
                    <strong className="text-xs text-slate-800 font-extrabold flex items-center gap-1">
                      <Building2 className="w-4 h-4 text-desktop-hero" />
                      {complaint.depot_name || 'Central Command'}
                    </strong>
                  </div>

                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
                    <span className="text-slate-400 font-bold block mb-1">Location</span>
                    <strong className="text-xs text-slate-800 font-extrabold flex items-center gap-1">
                      <MapPin className="w-4 h-4 text-rose-500" />
                      {complaint.location || 'Unspecified'}
                    </strong>
                  </div>

                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
                    <span className="text-slate-400 font-bold block mb-1">SLA Deadline</span>
                    <strong className={`text-xs font-extrabold flex items-center gap-1 ${isEscalated ? 'text-rose-600' : 'text-slate-800'}`}>
                      <Clock className="w-4 h-4" />
                      {new Date(complaint.sla_deadline).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </strong>
                  </div>
                </div>

                {/* Audit Log Timeline */}
                {complaint.status_history && complaint.status_history.length > 0 && (
                  <div className="border-t border-slate-200 pt-6 space-y-3">
                    <h4 className="text-xs font-black uppercase tracking-wider text-slate-900 flex items-center gap-2">
                      <FileText className="w-4 h-4 text-desktop-hero" />
                      <span>Status Transition Audit History Log</span>
                    </h4>

                    <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 space-y-3">
                      {complaint.status_history.map((hist, idx) => (
                        <div key={hist.id || idx} className="flex items-start space-x-3 text-xs pb-3 border-b border-slate-200/60 last:border-b-0 last:pb-0">
                          <div className="w-6 h-6 rounded-full bg-blue-100 text-desktop-hero flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                            {idx + 1}
                          </div>
                          <div className="flex-1 space-y-0.5">
                            <div className="flex items-center gap-1.5 font-extrabold text-slate-800">
                              <span>{hist.from_status || 'CREATED'}</span>
                              <ArrowRight className="w-3 h-3 text-slate-400" />
                              <span className="text-desktop-hero">{hist.to_status}</span>
                            </div>
                            <p className="text-slate-600 font-medium">{hist.notes}</p>
                            <div className="text-[10px] text-slate-400">
                              {new Date(hist.changed_at).toLocaleString()}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Post-Resolution Satisfaction Rating Widget */}
                {isResolved && (
                  <div className="border-t border-emerald-200 pt-6">
                    <FeedbackSection referenceNumber={complaint.reference_number} />
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* 2. MOBILE VIEW: YATRE Ticket/QR Confirmation + Vertical Stepper          */}
          {/* ========================================================================= */}
          <div className="block md:hidden">
            <div className="bg-white rounded-3xl shadow-2xl border border-mobile-border overflow-hidden">
              {/* YATRE Ticket Card Top Header */}
              <div className="bg-gradient-to-b from-mobile-header to-brand-700 text-white p-6 text-center relative space-y-3">
                <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center mx-auto text-white shadow-inner">
                  <QrCode className="w-7 h-7" />
                </div>

                <div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-blue-100 block">
                    Digital Ticket Tracking ID
                  </span>
                  <div className="flex items-center justify-center gap-2 mt-1">
                    <span className="font-mono text-2xl font-black text-white">{complaint.reference_number}</span>
                    <button
                      onClick={copyRef}
                      className="p-1 rounded-lg bg-white/20 text-white"
                      title="Copy Reference"
                    >
                      {copied ? <Check className="w-4 h-4 text-emerald-300" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Floating Status Pill */}
                <div className="pt-1">
                  <span
                    className={`px-4 py-1.5 rounded-full text-xs font-black shadow-lg uppercase inline-block ${
                      isResolved
                        ? 'bg-emerald-500 text-white'
                        : isEscalated
                        ? 'bg-rose-600 text-white animate-pulse'
                        : 'bg-amber-400 text-slate-950'
                    }`}
                  >
                    {isEscalated ? 'ESCALATED (OVERDUE)' : complaint.status}
                  </span>
                </div>
              </div>

              {/* VERTICAL STEPPER (Mobile YATRE Pattern) */}
              <div className="p-6 bg-mobile-cardTint border-b border-mobile-border space-y-4">
                <h3 className="text-xs font-black uppercase tracking-wider text-mobile-primaryBtn">
                  Workflow Status Stepper
                </h3>

                <div className="relative pl-6 space-y-6 before:absolute before:left-3 before:top-3 before:bottom-3 before:w-0.5 before:bg-mobile-border">
                  {WORKFLOW_STEPS.map((step, idx) => {
                    const isDone = activeStepIdx > idx || isResolved;
                    const isCurrent = activeStepIdx === idx && !isResolved && !isRejected;

                    return (
                      <div key={step.key} className="relative flex items-start space-x-3">
                        {/* Step Dot */}
                        <div
                          className={`absolute -left-6 top-0.5 w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black shadow-md ${
                            isDone
                              ? 'bg-emerald-500 text-white'
                              : isCurrent
                              ? 'bg-mobile-header text-white ring-4 ring-blue-200'
                              : 'bg-white border-2 border-slate-300 text-slate-400'
                          }`}
                        >
                          {isDone ? <CheckCircle2 className="w-3.5 h-3.5" /> : idx + 1}
                        </div>

                        {/* Step Details */}
                        <div>
                          <span
                            className={`text-xs font-extrabold block ${
                              isCurrent
                                ? 'text-mobile-primaryBtn font-black'
                                : isDone
                                ? 'text-slate-800'
                                : 'text-slate-400'
                            }`}
                          >
                            {step.label}
                          </span>
                          <span className="text-[10px] text-slate-500 font-medium">{step.desc}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Complaint Info & Ratings */}
              <div className="p-6 space-y-4">
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-1">
                  <span className="text-[10px] font-extrabold uppercase text-slate-400 block">Category & Route</span>
                  <strong className="text-xs font-bold text-slate-800 block">
                    {complaint.category} • {complaint.route_name || complaint.route_id || 'General Route'}
                  </strong>
                </div>

                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-1">
                  <span className="text-[10px] font-extrabold uppercase text-slate-400 block">Description</span>
                  <p className="text-xs text-slate-700 font-medium">{complaint.description}</p>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                    <span className="text-[10px] text-slate-400 font-bold block">Assigned Depot</span>
                    <strong className="text-xs text-slate-800 font-extrabold truncate block">
                      {complaint.depot_name || 'Central'}
                    </strong>
                  </div>

                  <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                    <span className="text-[10px] text-slate-400 font-bold block">SLA Target</span>
                    <strong className="text-xs text-rose-600 font-extrabold truncate block">
                      {new Date(complaint.sla_deadline).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </strong>
                  </div>
                </div>

                {/* Post-Resolution Feedback Rating Widget */}
                {isResolved && (
                  <div className="border-t border-emerald-200 pt-4">
                    <FeedbackSection referenceNumber={complaint.reference_number} />
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function FeedbackSection({ referenceNumber }: { referenceNumber: string }) {
  const [rating, setRating] = useState(5);
  const [comments, setComments] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmitFeedback = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reference_number: referenceNumber, rating, comments }),
      });
      const data = await res.json();
      if (data.success) {
        setSubmitted(true);
      } else {
        setError(data.error || 'Failed to submit feedback');
      }
    } catch (e) {
      setError('Network error submitting feedback.');
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-5 text-center space-y-2">
        <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto" />
        <h4 className="text-sm font-bold text-emerald-900">Thank you for your feedback!</h4>
        <p className="text-xs text-emerald-700">Your satisfaction rating has been anonymously recorded to improve transport operations.</p>
      </div>
    );
  }

  return (
    <div className="bg-emerald-50/60 border border-emerald-200 rounded-2xl p-5 space-y-3">
      <div className="flex items-center space-x-2">
        <span className="text-xs font-extrabold text-emerald-900">Rate Grievance Resolution</span>
        <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded font-bold">Anonymous</span>
      </div>

      <form onSubmit={handleSubmitFeedback} className="space-y-3">
        {error && <p className="text-xs text-rose-600 font-bold">{error}</p>}

        <div className="flex space-x-2">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => setRating(star)}
              className={`w-9 h-9 rounded-xl font-black text-sm transition-all border cursor-pointer ${
                rating >= star
                  ? 'bg-amber-400 text-slate-950 border-amber-500 shadow-sm'
                  : 'bg-white text-slate-400 border-slate-200 hover:border-amber-300'
              }`}
            >
              ★ {star}
            </button>
          ))}
        </div>

        <textarea
          value={comments}
          onChange={(e) => setComments(e.target.value)}
          rows={2}
          placeholder="Optional remarks regarding resolution speed or staff service..."
          className="w-full bg-white border border-slate-200 text-slate-900 rounded-xl p-2.5 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500"
        />

        <button
          type="submit"
          disabled={submitting}
          className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-5 py-2.5 rounded-xl transition-colors shadow cursor-pointer"
        >
          {submitting ? 'Submitting...' : 'Submit Satisfaction Rating'}
        </button>
      </form>
    </div>
  );
}

export default function PublicTrackPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center p-12 text-slate-500">
          <div className="w-8 h-8 border-4 border-desktop-hero border-t-transparent rounded-full animate-spin"></div>
        </div>
      }
    >
      <TrackContent />
    </Suspense>
  );
}
