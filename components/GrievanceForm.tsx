'use client';

import { useState, useEffect, useRef } from 'react';
import { Depot, Route, Category, Complaint } from '@/lib/complaints';
import {
  Send,
  CheckCircle2,
  Clock,
  AlertCircle,
  Search,
  MapPin,
  Bus,
  UploadCloud,
  FileText,
  Copy,
  Check,
  Building2,
  QrCode,
  ShieldCheck,
  ChevronDown,
  ChevronRight,
  ChevronLeft,
  X,
  WifiOff,
  RefreshCw,
  Sparkles,
  ArrowRight,
} from 'lucide-react';
import { classifyDescriptionLocal } from '@/lib/classifier';
import Link from 'next/link';

interface GrievanceFormProps {
  initialRouteId?: string;
}

export default function GrievanceForm({ initialRouteId }: GrievanceFormProps = {}) {
  const [routes, setRoutes] = useState<Route[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [depots, setDepots] = useState<Depot[]>([]);
  const [loadingMeta, setLoadingMeta] = useState(true);

  // Form Fields
  const [selectedRouteId, setSelectedRouteId] = useState('');
  const [routeQuery, setRouteQuery] = useState('');
  const [showRouteDropdown, setShowRouteDropdown] = useState(false);

  const [selectedCategory, setSelectedCategory] = useState('');
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const [location, setLocation] = useState('');
  const [description, setDescription] = useState('');
  const [evidenceFileName, setEvidenceFileName] = useState('');
  const [evidenceUrl, setEvidenceUrl] = useState('');

  // Mobile Step Wizard State (1: Route, 2: Category, 3: Location, 4: Description & Evidence)
  const [mobileStep, setMobileStep] = useState(1);

  // UI States
  const [submitting, setSubmitting] = useState(false);
  const [submittedComplaint, setSubmittedComplaint] = useState<Complaint | null>(null);
  const [offlineQueued, setOfflineQueued] = useState<any | null>(null);
  const [offlineQueueCount, setOfflineQueueCount] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [copiedRef, setCopiedRef] = useState(false);

  // Quick Lookup bar states
  const [lookupRef, setLookupRef] = useState('');
  const [searchedComplaint, setSearchedComplaint] = useState<Complaint | null>(null);
  const [lookupError, setLookupError] = useState<string | null>(null);

  const desktopDropdownRef = useRef<HTMLDivElement>(null);
  const mobileDropdownRef = useRef<HTMLDivElement>(null);
  const desktopCategoryDropdownRef = useRef<HTMLDivElement>(null);

  const handleSelectRoute = (id: string, name: string) => {
    setSelectedRouteId(id);
    setRouteQuery(id ? `${id} - ${name}` : '');
    setShowRouteDropdown(false);
  };

  // Helper to load offline queue count
  const updateOfflineCount = () => {
    if (typeof window !== 'undefined') {
      const q = JSON.parse(localStorage.getItem('aanavandi_offline_queue') || '[]');
      setOfflineQueueCount(q.length);
    }
  };

  // Sync Offline Queue Function
  const syncOfflineQueue = async () => {
    if (typeof window === 'undefined') return;
    const queue = JSON.parse(localStorage.getItem('aanavandi_offline_queue') || '[]');
    if (queue.length === 0) return;

    let syncedCount = 0;
    const remaining = [];

    for (const item of queue) {
      try {
        const res = await fetch('/api/complaints', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(item.payload),
        });
        const data = await res.json();
        if (data.success) {
          syncedCount++;
        } else {
          remaining.push(item);
        }
      } catch (e) {
        remaining.push(item);
      }
    }

    localStorage.setItem('aanavandi_offline_queue', JSON.stringify(remaining));
    setOfflineQueueCount(remaining.length);

    if (syncedCount > 0) {
      alert(`📶 Auto-Sync Complete: ${syncedCount} queued offline grievance(s) successfully registered!`);
    }
  };

  useEffect(() => {
    async function loadMeta() {
      try {
        const res = await fetch('/api/meta');
        const data = await res.json();
        if (data.success) {
          setRoutes(data.data.routes);
          setCategories(data.data.categories);
          setDepots(data.data.depots);

          if (typeof window !== 'undefined') {
            const urlParams = new URLSearchParams(window.location.search);
            const routeParam = urlParams.get('route');
            const descParam = urlParams.get('desc') || urlParams.get('description');
            if (routeParam) {
              const matchedRoute = data.data.routes.find(
                (r: Route) => r.id.toLowerCase() === routeParam.toLowerCase()
              );
              if (matchedRoute) {
                setSelectedRouteId(matchedRoute.id);
                setRouteQuery(`${matchedRoute.id} - ${matchedRoute.name}`);
              }
            }
            if (descParam) {
              setDescription(descParam);
            }
          }
        }
      } catch (e) {
        setErrorMessage('Offline system initialized in fallback mode.');
      } finally {
        setLoadingMeta(false);
      }
    }

    loadMeta();
    updateOfflineCount();

    if (typeof window !== 'undefined') {
      window.addEventListener('online', syncOfflineQueue);
      return () => window.removeEventListener('online', syncOfflineQueue);
    }
  }, []);

  useEffect(() => {
    if (initialRouteId && routes.length > 0) {
      const matched = routes.find(
        (r) => r.id.toLowerCase() === initialRouteId.toLowerCase()
      );
      if (matched) {
        setSelectedRouteId(matched.id);
        setRouteQuery(`${matched.id} - ${matched.name}`);
      }
    }
  }, [initialRouteId, routes]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node;
      const insideDesktop = desktopDropdownRef.current?.contains(target);
      const insideMobile = mobileDropdownRef.current?.contains(target);
      if (!insideDesktop && !insideMobile) {
        setShowRouteDropdown(false);
      }
      const insideCategory = desktopCategoryDropdownRef.current?.contains(target);
      if (!insideCategory) {
        setShowCategoryDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredRoutes = routes.filter(
    (r) =>
      r.id.toLowerCase().includes(routeQuery.toLowerCase()) ||
      r.name.toLowerCase().includes(routeQuery.toLowerCase())
  );

  const selectedRouteObj = routes.find((r) => r.id === selectedRouteId);
  const mappedDepotObj = selectedRouteObj
    ? depots.find((d) => d.id === selectedRouteObj.depot_id)
    : null;

  const currentCategoryObj = categories.find((c) => c.name === selectedCategory || c.id === selectedCategory);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setEvidenceFileName(file.name);
      setEvidenceUrl(`/uploads/${file.name}`);
    }
  };

  const executeSubmission = async () => {
    if (!selectedCategory) {
      setErrorMessage('Please select a grievance category.');
      if (mobileStep !== 2) setMobileStep(2);
      return;
    }
    if (!description.trim()) {
      setErrorMessage('Please provide a brief description of the incident.');
      if (mobileStep !== 4) setMobileStep(4);
      return;
    }

    setSubmitting(true);
    setErrorMessage(null);

    const payload = {
      route_id: selectedRouteId || undefined,
      category: selectedCategory,
      location,
      description,
      evidence_url: evidenceUrl || undefined,
      depot_id: mappedDepotObj?.id || undefined,
    };

    // Check if offline
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      handleOfflineSave(payload);
      setSubmitting(false);
      return;
    }

    try {
      const res = await fetch('/api/complaints', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (data.success) {
        setSubmittedComplaint(data.data);
      } else {
        setErrorMessage(data.error || 'Failed to submit grievance');
      }
    } catch (err) {
      handleOfflineSave(payload);
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    executeSubmission();
  };

  const handleOfflineSave = (payload: any) => {
    const tempRef = `OFFLINE-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
    const offlineItem = {
      tempRef,
      payload,
      createdAt: new Date().toISOString(),
    };

    const existing = JSON.parse(localStorage.getItem('aanavandi_offline_queue') || '[]');
    existing.push(offlineItem);
    localStorage.setItem('aanavandi_offline_queue', JSON.stringify(existing));

    setOfflineQueued(offlineItem);
    updateOfflineCount();
  };

  const handleLookup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!lookupRef.trim()) return;
    setLookupError(null);
    setSearchedComplaint(null);

    try {
      const res = await fetch(`/api/complaints/${encodeURIComponent(lookupRef.trim())}`);
      const data = await res.json();
      if (data.success) {
        setSearchedComplaint(data.data);
      } else {
        setLookupError('No grievance found for: ' + lookupRef);
      }
    } catch (err) {
      setLookupError('Lookup failed.');
    }
  };

  const copyReference = () => {
    if (submittedComplaint) {
      navigator.clipboard.writeText(submittedComplaint.reference_number);
      setCopiedRef(true);
      setTimeout(() => setCopiedRef(false), 2000);
    }
  };

  const handleNextMobileStep = () => {
    if (mobileStep === 1 && !selectedRouteId) {
      // Optional, user can proceed without route if needed
    }
    if (mobileStep === 2 && !selectedCategory) {
      setErrorMessage('Please select a category to continue.');
      return;
    }
    setErrorMessage(null);
    if (mobileStep < 4) {
      setMobileStep(mobileStep + 1);
    } else {
      executeSubmission();
    }
  };

  if (loadingMeta) {
    return (
      <div className="flex flex-col items-center justify-center p-16 text-slate-500">
        <div className="w-10 h-10 border-4 border-desktop-hero border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-xs font-bold text-slate-700">Loading Yathra Care Offline System...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Offline Queue Badge & Sync Banner */}
      {offlineQueueCount > 0 && (
        <div className="bg-amber-50 border border-amber-300 text-amber-900 rounded-2xl p-4 shadow-sm flex items-center justify-between animate-fade-in">
          <div className="flex items-center space-x-2.5">
            <WifiOff className="w-5 h-5 text-amber-600" />
            <div>
              <strong className="text-xs font-bold block">Offline Queue Active ({offlineQueueCount} pending)</strong>
              <span className="text-[11px] text-amber-700">Will auto-sync with depot database when connection restores.</span>
            </div>
          </div>
          <button
            onClick={syncOfflineQueue}
            className="bg-amber-600 hover:bg-amber-700 text-white px-3 py-1.5 rounded-xl text-xs font-extrabold transition-colors flex items-center gap-1 shadow"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Sync Now</span>
          </button>
        </div>
      )}

      {/* SUCCESS SCREENS (Offline Queued or Online Submitted) */}
      {offlineQueued ? (
        <div className="bg-amber-50 border border-amber-200 rounded-3xl p-8 text-center space-y-4 shadow-xl animate-scale-in max-w-xl mx-auto">
          <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto text-amber-700">
            <WifiOff className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-black text-amber-950">Grievance Saved Offline!</h2>
          <p className="text-xs text-amber-800 max-w-md mx-auto">
            Your grievance report was safely stored in local browser storage (`localStorage`). It will auto-sync with the depot database as soon as connection is re-established.
          </p>

          <div className="bg-white p-5 rounded-2xl border border-amber-200 text-left font-mono text-xs space-y-2 max-w-md mx-auto shadow-sm">
            <div className="flex justify-between">
              <span className="text-slate-400 font-sans">Temporary Reference:</span>
              <strong className="text-amber-800">{offlineQueued.tempRef}</strong>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400 font-sans">Category:</span>
              <strong className="text-slate-800 font-sans">{offlineQueued.payload.category}</strong>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400 font-sans">Sync Status:</span>
              <strong className="text-amber-600 font-sans">QUEUED FOR AUTO-SYNC</strong>
            </div>
          </div>

          <div className="pt-2 flex justify-center gap-3">
            <button
              onClick={() => {
                setOfflineQueued(null);
                setSelectedRouteId('');
                setRouteQuery('');
                setSelectedCategory('');
                setLocation('');
                setDescription('');
                setMobileStep(1);
              }}
              className="bg-desktop-hero hover:bg-desktop-navy text-white px-6 py-2.5 rounded-xl font-bold text-xs transition-colors shadow"
            >
              Submit Another Report
            </button>
          </div>
        </div>
      ) : submittedComplaint ? (
        /* ONLINE SUCCESS TICKET SCREEN */
        <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden animate-scale-in max-w-2xl mx-auto">
          {/* Header Ticket Banner */}
          <div className="bg-gradient-to-r from-desktop-deep via-desktop-hero to-desktop-navy text-white p-6 text-center relative">
            <div className="w-12 h-12 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center mx-auto mb-3 text-emerald-300 shadow-inner">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <span className="text-xs uppercase tracking-widest text-blue-200 font-bold">Grievance Ticket Registered</span>
            <h2 className="text-2xl font-black mt-1">Official Reference Issued</h2>
            <p className="text-xs text-blue-100 mt-1">Assigned directly to Depot Command Operations</p>

            {submittedComplaint.is_duplicate ? (
              <div className="mt-3 bg-amber-400 text-slate-950 text-xs font-black py-1 px-3 rounded-full inline-block shadow-md">
                ⚠️ Clustered with Active Case #{submittedComplaint.parent_reference_number}
              </div>
            ) : null}
          </div>

          {/* Ticket Details Body */}
          <div className="p-6 md:p-8 space-y-6">
            {/* Reference Number Box */}
            <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200 text-center relative group">
              <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider block mb-1">
                Reference Tracking Code
              </span>
              <div className="text-2xl md:text-3xl font-mono font-black text-desktop-hero tracking-tight flex items-center justify-center gap-2">
                <span>{submittedComplaint.reference_number}</span>
                <button
                  onClick={copyReference}
                  title="Copy Reference Code"
                  className="p-1.5 rounded-lg bg-white border border-slate-200 hover:bg-slate-100 text-slate-600 transition-colors"
                >
                  {copiedRef ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
              {copiedRef && <span className="text-[11px] text-emerald-600 font-bold block mt-1">Copied to Clipboard!</span>}
            </div>

            {/* Ticket Grid Info */}
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                <span className="text-slate-400 font-medium block">Category</span>
                <strong className="text-slate-800 text-sm">{submittedComplaint.category}</strong>
              </div>

              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                <span className="text-slate-400 font-medium block">Route</span>
                <strong className="text-slate-800 text-sm truncate block">{submittedComplaint.route_name || submittedComplaint.route_id || 'General'}</strong>
              </div>

              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                <span className="text-slate-400 font-medium block">Assigned Depot</span>
                <strong className="text-slate-800 text-sm flex items-center gap-1">
                  <Building2 className="w-3.5 h-3.5 text-desktop-hero" />
                  {submittedComplaint.depot_name || 'Central Command'}
                </strong>
              </div>

              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                <span className="text-slate-400 font-medium block">Guaranteed SLA Target</span>
                <strong className="text-rose-600 text-sm font-bold flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  {new Date(submittedComplaint.sla_deadline).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} ({new Date(submittedComplaint.sla_deadline).toLocaleDateString()})
                </strong>
              </div>
            </div>

            {/* Digital Verification Barcode */}
            <div className="border-t border-dashed border-slate-300 pt-4 flex items-center justify-between bg-slate-50/50 p-4 rounded-xl">
              <div className="flex items-center space-x-3">
                <div className="bg-white p-2 rounded-lg border border-slate-200 shadow-sm">
                  <QrCode className="w-10 h-10 text-slate-800" />
                </div>
                <div>
                  <span className="text-xs font-bold text-slate-800 block">Digital Verification QR</span>
                  <span className="text-[11px] text-slate-500">Scan at depot station terminals for updates</span>
                </div>
              </div>
              <ShieldCheck className="w-8 h-8 text-desktop-hero opacity-60" />
            </div>

            {/* CTAs */}
            <div className="pt-2 flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => {
                  setSubmittedComplaint(null);
                  setSelectedRouteId('');
                  setRouteQuery('');
                  setSelectedCategory('');
                  setLocation('');
                  setDescription('');
                  setEvidenceFileName('');
                  setEvidenceUrl('');
                  setMobileStep(1);
                }}
                className="flex-1 bg-desktop-accent hover:bg-desktop-accentHover text-white py-3 px-4 rounded-xl font-black text-sm transition-all shadow-md text-center uppercase tracking-wide"
              >
                Submit Another Grievance
              </button>
              <Link
                href={`/track?ref=${encodeURIComponent(submittedComplaint.reference_number)}`}
                className="flex-1 bg-desktop-hero hover:bg-desktop-navy text-white py-3 px-4 rounded-xl font-bold text-sm transition-colors text-center"
              >
                Track Live Status
              </Link>
            </div>
          </div>
        </div>
      ) : (
        /* FORM VIEWS */
        <>
          {/* ========================================================================= */}
          {/* 1. DESKTOP VIEW (Floating "Step 1 of 2" Summary Card Pattern - Global Express) */}
          {/* ========================================================================= */}
          <div className="hidden md:block">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              {/* Left Column: Form Fields */}
              <div className="lg:col-span-7 bg-white rounded-3xl p-8 shadow-xl border border-slate-200 space-y-6">
                <div className="border-b border-slate-100 pb-4">
                  <span className="text-[11px] font-black uppercase tracking-widest text-desktop-hero bg-desktop-bgTint px-3 py-1 rounded-full">
                    Grievance Form
                  </span>
                  <h2 className="text-2xl font-black text-slate-900 mt-2 tracking-tight">Report Incident Details</h2>
                  <p className="text-xs text-slate-500 font-medium mt-0.5">
                    Submittable in under 60 seconds with automatic SLA calculation.
                  </p>
                </div>

                {errorMessage && (
                  <div className="bg-rose-50 border border-rose-200 text-rose-800 p-3.5 rounded-xl text-xs font-semibold flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
                    <span>{errorMessage}</span>
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-5">
                  {/* 1. Route / Bus Autocomplete */}
                  <div className="relative" ref={desktopDropdownRef}>
                    <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-1.5">
                      1. Route / Bus Service
                    </label>
                    <div className="relative">
                      <Bus className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                      <input
                        type="text"
                        value={selectedRouteObj ? `${selectedRouteObj.id} - ${selectedRouteObj.name}` : routeQuery}
                        onChange={(e) => {
                          setRouteQuery(e.target.value);
                          setSelectedRouteId('');
                          setShowRouteDropdown(true);
                        }}
                        onFocus={() => setShowRouteDropdown(true)}
                        placeholder="Type route name or code (e.g. RT-101)..."
                        className="w-full bg-slate-50 border border-slate-300 text-slate-900 rounded-xl py-3 pl-10 pr-9 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-desktop-hero"
                      />
                      {selectedRouteId ? (
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedRouteId('');
                            setRouteQuery('');
                          }}
                          className="absolute right-3 top-3.5 text-slate-400 hover:text-slate-600"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      ) : (
                        <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-3.5 pointer-events-none" />
                      )}
                    </div>

                    {/* Autocomplete Dropdown Menu */}
                    {showRouteDropdown && (
                      <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-slate-200 rounded-xl shadow-xl max-h-48 overflow-y-auto z-50 divide-y divide-slate-100">
                        <div
                          onMouseDown={(e) => {
                            e.preventDefault();
                            handleSelectRoute('', '');
                          }}
                          onClick={() => handleSelectRoute('', '')}
                          className="p-2.5 text-xs text-slate-500 hover:bg-slate-50 cursor-pointer font-medium"
                        >
                          -- Unspecified / General Route --
                        </div>
                        {filteredRoutes.length === 0 ? (
                          <div className="p-3 text-xs text-slate-400 text-center font-medium">No matching bus routes found</div>
                        ) : (
                          filteredRoutes.map((rt) => (
                            <div
                              key={rt.id}
                              onMouseDown={(e) => {
                                e.preventDefault();
                                handleSelectRoute(rt.id, rt.name);
                              }}
                              onClick={() => handleSelectRoute(rt.id, rt.name)}
                              className={`p-3 text-xs hover:bg-desktop-bgTint cursor-pointer transition-colors flex justify-between items-center ${
                                selectedRouteId === rt.id ? 'bg-desktop-bgTint font-bold text-desktop-hero' : 'text-slate-800'
                              }`}
                            >
                              <div>
                                <span className="font-mono font-bold text-desktop-hero mr-2">{rt.id}</span>
                                <span>{rt.name}</span>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    )}
                  </div>

                  {/* 2. Category */}
                  <div className="relative" ref={desktopCategoryDropdownRef}>
                    <div className="flex justify-between items-center mb-1.5">
                      <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider">
                        2. Grievance Category <span className="text-rose-500">*</span>
                      </label>
                      {currentCategoryObj && (
                        <span className="text-[11px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200 flex items-center gap-1">
                          <Clock className="w-3 h-3 text-amber-600" /> SLA: {currentCategoryObj.sla_hours}h Target
                        </span>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => setShowCategoryDropdown(!showCategoryDropdown)}
                      className="w-full bg-slate-50 border border-slate-300 text-slate-900 rounded-xl p-3 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-desktop-hero flex items-center justify-between text-left shadow-sm hover:border-slate-400 transition-colors cursor-pointer"
                    >
                      <span className={selectedCategory ? 'text-slate-900 font-bold' : 'text-slate-400 font-medium'}>
                        {selectedCategory || '-- Select Category --'}
                      </span>
                      <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${showCategoryDropdown ? 'rotate-180 text-desktop-hero' : ''}`} />
                    </button>

                    {showCategoryDropdown && (
                      <div className="absolute left-0 right-0 top-full mt-1.5 bg-white border border-slate-200 rounded-2xl shadow-2xl max-h-60 overflow-y-auto z-50 divide-y divide-slate-100 py-1">
                        <div
                          onMouseDown={(e) => {
                            e.preventDefault();
                            setSelectedCategory('');
                            setShowCategoryDropdown(false);
                          }}
                          onClick={() => {
                            setSelectedCategory('');
                            setShowCategoryDropdown(false);
                          }}
                          className="p-3 text-xs text-slate-500 hover:bg-slate-50 cursor-pointer font-medium"
                        >
                          -- Unspecified / Select Category --
                        </div>
                        {categories.map((cat) => (
                          <div
                            key={cat.id}
                            onMouseDown={(e) => {
                              e.preventDefault();
                              setSelectedCategory(cat.name);
                              setShowCategoryDropdown(false);
                            }}
                            onClick={() => {
                              setSelectedCategory(cat.name);
                              setShowCategoryDropdown(false);
                            }}
                            className={`p-3 text-xs cursor-pointer transition-colors flex items-center justify-between group ${
                              selectedCategory === cat.name
                                ? 'bg-desktop-bgTint font-bold text-desktop-hero'
                                : 'hover:bg-slate-50 text-slate-800'
                            }`}
                          >
                            <div className="flex items-center space-x-2.5">
                              <div className={`w-2 h-2 rounded-full ${selectedCategory === cat.name ? 'bg-desktop-hero' : 'bg-slate-300 group-hover:bg-slate-400'}`}></div>
                              <span className="font-semibold">{cat.name}</span>
                            </div>
                            <span className="text-[11px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-md flex items-center gap-1">
                              <Clock className="w-3 h-3 text-amber-600" />
                              {cat.sla_hours}h SLA
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* 3. Location */}
                  <div>
                    <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-1.5">
                      3. Incident Location / Bus Stop
                    </label>
                    <div className="relative">
                      <MapPin className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                      <input
                        type="text"
                        value={location}
                        onChange={(e) => setLocation(e.target.value)}
                        placeholder="e.g. Attingal Bus Stand, Seat 14, or Highway KM 42..."
                        className="w-full bg-slate-50 border border-slate-300 text-slate-900 rounded-xl py-3 pl-10 pr-4 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-desktop-hero"
                      />
                    </div>
                  </div>

                  {/* 4. Description */}
                  <div>
                    <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-1.5">
                      4. Description <span className="text-rose-500">*</span>
                    </label>
                    <textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      rows={3}
                      placeholder="Describe the issue clearly (staff behavior, overcharging amount, driver rashness, etc.)..."
                      className="w-full bg-slate-50 border border-slate-300 text-slate-900 rounded-xl p-3 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-desktop-hero"
                      required
                    />
                    {/* Local Auto-Categorization Suggestion */}
                    {(() => {
                      const suggested = classifyDescriptionLocal(description, categories);
                      if (suggested && suggested !== selectedCategory) {
                        return (
                          <button
                            type="button"
                            onClick={() => setSelectedCategory(suggested)}
                            className="mt-1.5 bg-amber-50 border border-amber-300 text-amber-900 hover:bg-amber-100 text-[11px] font-bold px-3 py-1 rounded-lg transition-colors flex items-center gap-1.5"
                          >
                            <span>💡 Suggested Category: <strong>{suggested}</strong></span>
                            <span className="underline text-desktop-hero">Click to apply</span>
                          </button>
                        );
                      }
                      return null;
                    })()}
                  </div>

                  {/* 5. Photo Upload */}
                  <div>
                    <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-1.5">
                      5. Photo / Ticket Evidence (Optional)
                    </label>
                    <div className="border-2 border-dashed border-slate-200 hover:border-desktop-hero bg-slate-50/50 rounded-2xl p-4 text-center transition-colors cursor-pointer relative">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleFileUpload}
                        className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                      />
                      <div className="flex flex-col items-center justify-center space-y-1">
                        <UploadCloud className="w-6 h-6 text-desktop-hero" />
                        <span className="text-xs font-semibold text-slate-700">
                          {evidenceFileName ? evidenceFileName : 'Click or drop ticket photo / evidence image here'}
                        </span>
                        <span className="text-[10px] text-slate-400">Supports JPG, PNG up to 5MB</span>
                      </div>
                    </div>
                  </div>
                </form>
              </div>

              {/* Right Column: Floating "Step 1 of 2" Summary Card (Global Express Pattern) */}
              <div className="lg:col-span-5 sticky top-6">
                <div className="bg-white rounded-3xl shadow-2xl border border-slate-200/90 overflow-hidden space-y-0">
                  {/* Summary Header */}
                  <div className="bg-gradient-to-r from-desktop-deep to-desktop-hero text-white p-5 flex justify-between items-center">
                    <div>
                      <span className="text-[10px] uppercase font-black tracking-widest text-blue-200 block">
                        Grievance Details
                      </span>
                      <h3 className="text-lg font-black text-white">Summary Review</h3>
                    </div>
                    <span className="bg-white/20 text-white font-bold text-xs px-3 py-1 rounded-full border border-white/30 backdrop-blur-sm">
                      Step 1 of 2
                    </span>
                  </div>

                  {/* Summary Content Fields */}
                  <div className="p-6 space-y-4 text-xs bg-slate-50/50">
                    <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-sm space-y-1">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">Selected Route</span>
                      <div className="font-bold text-slate-800 text-sm flex items-center gap-1.5">
                        <Bus className="w-4 h-4 text-desktop-hero" />
                        <span>{selectedRouteObj ? `${selectedRouteObj.id} - ${selectedRouteObj.name}` : 'Not selected yet'}</span>
                      </div>
                    </div>

                    <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-sm space-y-1">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">Assigned Depot Preview</span>
                      <div className="font-bold text-slate-800 text-sm flex items-center gap-1.5">
                        <Building2 className="w-4 h-4 text-desktop-hero" />
                        <span>{mappedDepotObj ? `${mappedDepotObj.name} (${mappedDepotObj.id})` : 'Central Operations'}</span>
                      </div>
                    </div>

                    <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-sm space-y-1">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">Grievance Category</span>
                      <div className="font-bold text-slate-800 text-sm flex items-center justify-between">
                        <span>{selectedCategory || 'Not chosen yet'}</span>
                        {currentCategoryObj && (
                          <span className="text-[11px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md">
                            {currentCategoryObj.sla_hours}h SLA
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-sm space-y-1">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">Incident Location</span>
                      <div className="font-semibold text-slate-700 text-xs truncate">
                        {location || 'Optional / Unspecified'}
                      </div>
                    </div>

                    {/* Requirements Checklist */}
                    <div className="pt-2 border-t border-slate-200 space-y-1.5 text-[11px] font-semibold text-slate-600">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className={`w-4 h-4 ${selectedCategory ? 'text-emerald-500' : 'text-slate-300'}`} />
                        <span>Category Selected</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className={`w-4 h-4 ${description.trim() ? 'text-emerald-500' : 'text-slate-300'}`} />
                        <span>Incident Description Provided</span>
                      </div>
                    </div>
                  </div>

                  {/* Summary Footer Action: ORANGE PRIMARY BUTTON (Global Express Accent) */}
                  <div className="p-6 bg-white border-t border-slate-200 space-y-2">
                    <button
                      type="button"
                      onClick={executeSubmission}
                      disabled={submitting || !selectedCategory || !description.trim()}
                      className="w-full bg-desktop-accent hover:bg-desktop-accentHover text-white py-4 px-6 rounded-xl font-black text-sm uppercase tracking-wide transition-all shadow-lg hover:shadow-xl flex items-center justify-center space-x-2 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transform hover:scale-[1.01]"
                    >
                      <Send className="w-4 h-4" />
                      <span>{submitting ? 'Registering...' : 'Submit Grievance Now'}</span>
                    </button>
                    <p className="text-[10px] text-slate-400 text-center font-medium">
                      Instant reference generated • 100% Offline SQLite database
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* 2. MOBILE VIEW (Single-Field Step Wizard Flow - YATRE Mobile Reference)    */}
          {/* ========================================================================= */}
          <div className="block md:hidden">
            <div className="bg-white rounded-3xl shadow-xl border border-mobile-border overflow-hidden">
              {/* Top Header & Step Progress Bar */}
              <div className="bg-gradient-to-r from-mobile-header to-brand-700 text-white p-5 space-y-3">
                <div className="flex justify-between items-center">
                  <div className="flex items-center space-x-2">
                    <Bus className="w-5 h-5 text-white" />
                    <span className="text-xs font-black uppercase tracking-wider text-blue-100">
                      Step {mobileStep} of 4
                    </span>
                  </div>
                  <span className="text-[10px] bg-white/20 font-extrabold px-2.5 py-0.5 rounded-full text-white">
                    {mobileStep === 1
                      ? 'Route Selection'
                      : mobileStep === 2
                      ? 'Category'
                      : mobileStep === 3
                      ? 'Location'
                      : 'Description & Evidence'}
                  </span>
                </div>

                {/* Visual Progress Bar */}
                <div className="w-full bg-white/20 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-white h-full transition-all duration-300 rounded-full"
                    style={{ width: `${(mobileStep / 4) * 100}%` }}
                  />
                </div>

                {/* Interactive Step Dots */}
                <div className="flex justify-between text-[11px] font-bold text-blue-100 pt-1">
                  {[1, 2, 3, 4].map((stepNum) => (
                    <button
                      key={stepNum}
                      type="button"
                      onClick={() => setMobileStep(stepNum)}
                      className={`px-2 py-0.5 rounded-lg transition-colors ${
                        mobileStep === stepNum ? 'bg-white text-mobile-header font-black shadow' : 'text-blue-100/70 hover:text-white'
                      }`}
                    >
                      Step {stepNum}
                    </button>
                  ))}
                </div>
              </div>

              {/* Mobile Step Content Body */}
              <div className="p-6 space-y-6">
                {errorMessage && (
                  <div className="bg-rose-50 border border-rose-200 text-rose-800 p-3 rounded-xl text-xs font-semibold flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
                    <span>{errorMessage}</span>
                  </div>
                )}

                {/* STEP 1: ROUTE SELECTION */}
                {mobileStep === 1 && (
                  <div className="space-y-4 animate-fade-in">
                    <div>
                      <h3 className="text-lg font-black text-slate-900">Select Bus Route</h3>
                      <p className="text-xs text-slate-500 font-medium">Which bus service was involved?</p>
                    </div>

                    <div className="relative" ref={mobileDropdownRef}>
                      <div className="relative">
                        <Bus className="w-5 h-5 text-mobile-header absolute left-3.5 top-3.5" />
                        <input
                          type="text"
                          value={selectedRouteObj ? `${selectedRouteObj.id} - ${selectedRouteObj.name}` : routeQuery}
                          onChange={(e) => {
                            setRouteQuery(e.target.value);
                            setSelectedRouteId('');
                            setShowRouteDropdown(true);
                          }}
                          onFocus={() => setShowRouteDropdown(true)}
                          placeholder="Search route name or code..."
                          className="w-full bg-mobile-cardTint border border-mobile-border text-slate-900 rounded-2xl py-3.5 pl-11 pr-10 text-xs font-extrabold focus:outline-none focus:ring-2 focus:ring-mobile-header"
                        />
                        {selectedRouteId ? (
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedRouteId('');
                              setRouteQuery('');
                            }}
                            className="absolute right-3.5 top-3.5 text-slate-400"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        ) : (
                          <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3.5 top-3.5 pointer-events-none" />
                        )}
                      </div>

                      {/* Mapped Depot Preview Badge */}
                      {mappedDepotObj && (
                        <div className="mt-2 text-xs font-bold text-mobile-primaryBtn bg-blue-50 border border-blue-200 p-2.5 rounded-xl flex items-center gap-2">
                          <Building2 className="w-4 h-4 text-mobile-header" />
                          <span>Mapped Depot: {mappedDepotObj.name} ({mappedDepotObj.id})</span>
                        </div>
                      )}

                      {/* Dropdown Options */}
                      {showRouteDropdown && (
                        <div className="mt-2 bg-white border border-mobile-border rounded-2xl shadow-xl max-h-52 overflow-y-auto divide-y divide-slate-100">
                          <div
                            onMouseDown={(e) => {
                              e.preventDefault();
                              handleSelectRoute('', '');
                            }}
                            onClick={() => handleSelectRoute('', '')}
                            className="p-2.5 text-xs text-slate-500 hover:bg-slate-50 cursor-pointer font-medium"
                          >
                            -- Unspecified / General Route --
                          </div>
                          {filteredRoutes.length === 0 ? (
                            <div className="p-3 text-xs text-slate-400 text-center font-medium">No matching bus routes found</div>
                          ) : (
                            filteredRoutes.map((rt) => (
                              <div
                                key={rt.id}
                                onMouseDown={(e) => {
                                  e.preventDefault();
                                  handleSelectRoute(rt.id, rt.name);
                                }}
                                onClick={() => handleSelectRoute(rt.id, rt.name)}
                                className="p-3 text-xs font-bold hover:bg-mobile-cardTint cursor-pointer flex justify-between"
                              >
                                <span className="text-mobile-header font-mono">{rt.id}</span>
                                <span className="text-slate-800">{rt.name}</span>
                              </div>
                            ))
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* STEP 2: CATEGORY */}
                {mobileStep === 2 && (
                  <div className="space-y-4 animate-fade-in">
                    <div>
                      <h3 className="text-lg font-black text-slate-900">Choose Grievance Category</h3>
                      <p className="text-xs text-slate-500 font-medium">SLA resolution targets will be applied automatically.</p>
                    </div>

                    <div className="space-y-2">
                      {categories.map((cat) => (
                        <div
                          key={cat.id}
                          onClick={() => setSelectedCategory(cat.name)}
                          className={`p-4 rounded-2xl border text-xs font-bold cursor-pointer transition-all flex justify-between items-center ${
                            selectedCategory === cat.name
                              ? 'bg-mobile-cardTint border-mobile-header text-mobile-primaryBtn shadow-md'
                              : 'bg-slate-50 border-slate-200 text-slate-800'
                          }`}
                        >
                          <div className="flex items-center space-x-3">
                            <Clock className={`w-4 h-4 ${selectedCategory === cat.name ? 'text-mobile-header' : 'text-slate-400'}`} />
                            <span>{cat.name}</span>
                          </div>
                          <span className="text-[11px] font-extrabold bg-amber-100 text-amber-800 px-2.5 py-1 rounded-full">
                            {cat.sla_hours}h SLA Target
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* STEP 3: LOCATION */}
                {mobileStep === 3 && (
                  <div className="space-y-4 animate-fade-in">
                    <div>
                      <h3 className="text-lg font-black text-slate-900">Incident Location</h3>
                      <p className="text-xs text-slate-500 font-medium">Bus stand name, landmark, or seat position.</p>
                    </div>

                    <div className="relative">
                      <MapPin className="w-5 h-5 text-mobile-header absolute left-3.5 top-3.5" />
                      <input
                        type="text"
                        value={location}
                        onChange={(e) => setLocation(e.target.value)}
                        placeholder="e.g. Attingal Stand, Seat 12, or Highway KM 40..."
                        className="w-full bg-mobile-cardTint border border-mobile-border text-slate-900 rounded-2xl py-3.5 pl-11 pr-4 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-mobile-header"
                      />
                    </div>
                  </div>
                )}

                {/* STEP 4: DESCRIPTION & EVIDENCE */}
                {mobileStep === 4 && (
                  <div className="space-y-4 animate-fade-in">
                    <div>
                      <h3 className="text-lg font-black text-slate-900">Description & Photo Evidence</h3>
                      <p className="text-xs text-slate-500 font-medium">Explain the issue clearly to help depot managers.</p>
                    </div>

                    <div className="space-y-3">
                      <div className="relative">
                        <textarea
                          value={description}
                          onChange={(e) => setDescription(e.target.value)}
                          rows={4}
                          placeholder="Type details (e.g. conductor overcharged fare, bus skipped scheduled stop)..."
                          className="w-full bg-mobile-cardTint border border-mobile-border text-slate-900 rounded-2xl p-4 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-mobile-header"
                          required
                        />
                      </div>

                      {/* Local Auto-Categorizer Suggestion */}
                      {(() => {
                        const suggested = classifyDescriptionLocal(description, categories);
                        if (suggested && suggested !== selectedCategory) {
                          return (
                            <button
                              type="button"
                              onClick={() => setSelectedCategory(suggested)}
                              className="w-full bg-amber-50 border border-amber-300 text-amber-900 text-xs font-bold p-3 rounded-xl flex items-center justify-between"
                            >
                              <span>💡 Auto-suggest: <strong>{suggested}</strong></span>
                              <span className="underline text-mobile-header">Apply</span>
                            </button>
                          );
                        }
                        return null;
                      })()}

                      {/* Photo Upload */}
                      <div className="border-2 border-dashed border-mobile-border bg-slate-50 rounded-2xl p-4 text-center relative cursor-pointer">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleFileUpload}
                          className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                        />
                        <div className="flex flex-col items-center justify-center space-y-1">
                          <UploadCloud className="w-5 h-5 text-mobile-header" />
                          <span className="text-xs font-bold text-slate-700">
                            {evidenceFileName ? evidenceFileName : 'Attach Ticket / Photo Evidence'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* PINNED BOTTOM ACTION BAR (YATRE Primary Blue Button) */}
              <div className="p-4 bg-white border-t border-mobile-border space-y-2">
                <button
                  type="button"
                  onClick={handleNextMobileStep}
                  disabled={submitting}
                  className="w-full bg-mobile-primaryBtn hover:opacity-95 text-white py-4 px-6 rounded-2xl font-black text-sm transition-all shadow-lg flex items-center justify-center space-x-2"
                >
                  {mobileStep < 4 ? (
                    <>
                      <span>Next Step ({mobileStep}/4)</span>
                      <ChevronRight className="w-4 h-4" />
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      <span>{submitting ? 'Registering...' : 'Submit Grievance Now'}</span>
                    </>
                  )}
                </button>

                {mobileStep > 1 && (
                  <button
                    type="button"
                    onClick={() => setMobileStep(mobileStep - 1)}
                    className="w-full text-slate-500 font-bold text-xs text-center py-2 hover:text-slate-800"
                  >
                    ← Back to Previous Step
                  </button>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
