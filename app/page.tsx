'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import BottomNav from '@/components/ui/BottomNav';
import GrievanceForm from '@/components/GrievanceForm';
import {
  Bus,
  FileText,
  Search,
  LayoutDashboard,
  Clock,
  ShieldCheck,
  ChevronRight,
  ArrowRight,
  Building2,
  Users,
  CheckCircle2,
  AlertCircle,
  QrCode,
  MapPin,
  Send,
  Sparkles,
} from 'lucide-react';

export default function EntryPage() {
  const router = useRouter();

  // Mobile Intro Slider State
  const [activeSlide, setActiveSlide] = useState(0);
  const slides = [
    {
      title: 'Welcome to Yathra Care Grievance Portal',
      subtitle: 'Fast, offline passenger complaint registration and route SLA management.',
      icon: <Bus className="w-16 h-16 text-mobile-header" />,
      tag: 'OFFLINE FIRST',
    },
    {
      title: 'Quick & Reliable SLA Tracking',
      subtitle: 'Every report is assigned an automated resolution deadline per depot SLA targets.',
      icon: <Clock className="w-16 h-16 text-amber-500" />,
      tag: 'AUTOMATED SLA',
    },
    {
      title: 'Effortless Route Resolution',
      subtitle: 'Scan route QR codes or pick your bus service to lodge issues in under 60 seconds.',
      icon: <ShieldCheck className="w-16 h-16 text-emerald-500" />,
      tag: '60-SECOND FORM',
    },
  ];

  // Auto-advance slides every 5 seconds on mobile
  useEffect(() => {
    const timer = setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % slides.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [slides.length]);

  // Quick Search & Hero Problem State
  const [searchRef, setSearchRef] = useState('');
  const [selectedQuickRoute, setSelectedQuickRoute] = useState('');
  const [routesList, setRoutesList] = useState<{ id: string; name: string }[]>([]);

  useEffect(() => {
    async function loadMeta() {
      try {
        const res = await fetch('/api/meta');
        const data = await res.json();
        if (data.success) {
          setRoutesList(data.data.routes);
        }
      } catch (e) {
        console.error('Meta load error', e);
      }
    }
    loadMeta();
  }, []);

  const handleQuickSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchRef.trim()) {
      router.push(`/track?ref=${encodeURIComponent(searchRef.trim())}`);
    }
  };

  const handleQuickRouteSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedQuickRoute) {
      router.push(`/?route=${encodeURIComponent(selectedQuickRoute)}#form`);
    }
  };

  return (
    <div className="w-full pb-20 md:pb-12">
      {/* ========================================================================= */}
      {/* 1. DESKTOP HERO SECTION (Full-Bleed 100% Width Bus Illustration Background) */}
      {/* ========================================================================= */}
      <div className="hidden md:flex flex-col justify-center min-h-[calc(100vh-4rem)] w-full bg-slate-900 text-white relative shadow-2xl overflow-hidden border-b border-blue-900/30">
        {/* Unblurred Sharp Background Bus Illustration (Extends 100% Edge-to-Edge) */}
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat z-0 pointer-events-none"
          style={{ backgroundImage: "url('/hero-bg.jpg')" }}
        />

        {/* Dark Royal-Blue Gradient Overlay: Darker on left for heading contrast, lighter in center/right */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#061452]/95 via-[#092cb1]/70 to-[#0b30a8]/25 z-0 pointer-events-none" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(20,53,176,0.25),transparent_70%)] z-0 pointer-events-none" />

        {/* Centered Content Container */}
        <div className="max-w-7xl w-full mx-auto px-6 lg:px-8 py-10 lg:py-12 relative z-10 space-y-10 flex-1 flex flex-col justify-center">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            {/* Left Content */}
            <div className="lg:col-span-7 space-y-5">
              <h1 className="text-3xl lg:text-4xl xl:text-5xl font-heading text-white tracking-tight leading-tight drop-shadow-md">
                Regular & Express Bus <br />
                <span className="text-desktop-accent">Passenger Grievance Portal</span>
              </h1>

              <p className="text-sm text-blue-100 max-w-xl font-medium leading-relaxed drop-shadow-sm">
                Register operational issues, bus delays, or staff misconduct. Every report is automatically assigned a guaranteed SLA deadline and routed to depot command.
              </p>
            </div>

            {/* Right Hero Action Card with Glassmorphism Frosted Glass */}
            <div className="lg:col-span-5 flex justify-center relative">
              <div className="w-full max-w-sm rounded-3xl bg-[#082490]/40 backdrop-blur-xl border border-white/25 p-8 shadow-2xl space-y-6 text-center transition-all hover:scale-105 duration-300 flex flex-col items-center justify-center">
                <div className="w-14 h-14 rounded-2xl bg-desktop-accent text-white flex items-center justify-center shadow-xl mb-1">
                  <FileText className="w-7 h-7" />
                </div>

                <div>
                  <h3 className="text-xl md:text-2xl font-heading text-white tracking-tight drop-shadow-sm">Have a Passenger Grievance?</h3>
                </div>

                {/* Primary Button: Drop Your Problem Here */}
                <a
                  href="#form"
                  className="w-full bg-desktop-accent hover:bg-desktop-accentHover text-white py-4 px-6 rounded-2xl font-black text-xs uppercase tracking-wider transition-all shadow-xl hover:shadow-2xl flex items-center justify-center space-x-2 cursor-pointer transform hover:scale-105 block text-center"
                >
                  <Send className="w-4 h-4" />
                  <span>DROP YOUR PROBLEM HERE</span>
                </a>
              </div>
            </div>
          </div>

          {/* OVERLAPPING SEARCH / ENTRY PANEL (Frosted Glass Panel - Bus Visible Through) */}
          <div>
            <div className="bg-white/15 backdrop-blur-xl text-white rounded-3xl p-5 lg:p-6 shadow-2xl border border-white/25">
              <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
                {/* Mode 1: Quick Route Selection */}
                <div className="md:col-span-5 space-y-2">
                  <label className="block text-[11px] font-black text-white/90 uppercase tracking-widest drop-shadow-sm">
                    LODGE COMPLAINT FOR BUS ROUTE
                  </label>
                  <form onSubmit={handleQuickRouteSubmit} className="flex gap-2">
                    <select
                      value={selectedQuickRoute}
                      onChange={(e) => setSelectedQuickRoute(e.target.value)}
                      className="flex-1 bg-white text-slate-900 border border-white/40 rounded-2xl py-3 px-4 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-desktop-accent shadow-sm"
                    >
                      <option value="">-- Select Bus Route --</option>
                      {routesList.map((r) => (
                        <option key={r.id} value={r.id}>
                          {r.id}: {r.name}
                        </option>
                      ))}
                    </select>
                    <button
                      type="submit"
                      className="bg-desktop-accent hover:bg-desktop-accentHover text-white px-5 py-3 rounded-2xl text-xs font-black uppercase tracking-wider transition-all shadow-md shrink-0 cursor-pointer"
                    >
                      GO TO FORM
                    </button>
                  </form>
                </div>

                {/* Divider */}
                <div className="hidden md:flex md:col-span-2 justify-center items-center text-white/90 font-bold text-xs drop-shadow-sm">
                  OR
                </div>

                {/* Mode 2: Quick Reference Tracker */}
                <div className="md:col-span-5 space-y-2">
                  <label className="block text-[11px] font-black text-white/90 uppercase tracking-widest drop-shadow-sm">
                    QUICK TRACK REFERENCE CODE
                  </label>
                  <form onSubmit={handleQuickSearch} className="flex gap-2">
                    <input
                      type="text"
                      value={searchRef}
                      onChange={(e) => setSearchRef(e.target.value)}
                      placeholder="o. g.  R1101-28260922-0001"
                      className="flex-1 bg-white text-slate-900 border border-white/40 rounded-2xl px-4 py-3 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-desktop-accent shadow-sm placeholder:text-slate-400"
                    />
                    <button
                      type="submit"
                      className="bg-[#1231a2] hover:bg-desktop-hero text-white px-6 py-3 rounded-2xl text-xs font-bold transition-all shadow-md shrink-0 cursor-pointer"
                    >
                      Track
                    </button>
                  </form>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. LOWER CONTENT SECTIONS (Centered Container)                            */}
      {/* ========================================================================= */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-12">
        {/* QUICK ACTION CARD GRID (Styled like Global Express Destination Cards) */}
        <div className="hidden md:block space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-xl font-black text-slate-900 tracking-tight">System Operational Portals</h2>
              <p className="text-xs text-slate-500 font-medium">Select an action portal to proceed</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Card 1: Report Complaint */}
            <Card
              title="Report a Grievance"
              subtitle="Submit incident details in under 60 seconds"
              className="hover:border-desktop-hero transition-all group hover:-translate-y-1"
              footer={
                <Link href="#form">
                  <Button variant="accent" size="sm" className="w-full">
                    Open Submission Form
                  </Button>
                </Link>
              }
            >
              <div className="flex items-center space-x-4">
                <div className="w-14 h-14 rounded-2xl bg-desktop-bgTint text-desktop-hero flex items-center justify-center shrink-0">
                  <FileText className="w-7 h-7" />
                </div>
                <div className="text-xs text-slate-600 space-y-1">
                  <p className="font-semibold">• Route Autocomplete</p>
                  <p className="font-semibold">• Auto Depot Mapping</p>
                  <p className="font-semibold">• Offline Local Storage Queue</p>
                </div>
              </div>
            </Card>

            {/* Card 2: Track Status */}
            <Card
              title="Track Live Status"
              subtitle="Lookup grievance progress & SLA history"
              className="hover:border-desktop-hero transition-all group hover:-translate-y-1"
              footer={
                <Link href="/track">
                  <Button variant="primary" size="sm" className="w-full">
                    Track Complaint
                  </Button>
                </Link>
              }
            >
              <div className="flex items-center space-x-4">
                <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                  <Search className="w-7 h-7" />
                </div>
                <div className="text-xs text-slate-600 space-y-1">
                  <p className="font-semibold">• Workflow Stepper</p>
                  <p className="font-semibold">• State Transition Audit Log</p>
                  <p className="font-semibold">• Post-Resolution Feedback</p>
                </div>
              </div>
            </Card>

            {/* Card 3: Depot Dashboard */}
            <Card
              title="Depot Dashboard"
              subtitle="Executive analytics & SLA engine controls"
              className="hover:border-desktop-hero transition-all group hover:-translate-y-1"
              footer={
                <Link href="/dashboard">
                  <Button variant="outline" size="sm" className="w-full">
                    Open Operations Dashboard
                  </Button>
                </Link>
              }
            >
              <div className="flex items-center space-x-4">
                <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                  <LayoutDashboard className="w-7 h-7" />
                </div>
                <div className="text-xs text-slate-600 space-y-1">
                  <p className="font-semibold">• Priority Needs Attention Section</p>
                  <p className="font-semibold">• SQL Privacy Redaction</p>
                  <p className="font-semibold">• SLA Escalation Engine</p>
                </div>
              </div>
            </Card>
          </div>
        </div>



        {/* MOBILE ONBOARDING INTRO SECTION (Matches YATRE Mobile Reference) */}
        <div className="block md:hidden space-y-6">
          {/* Full-bleed Illustrated Header Banner */}
          <div className="bg-gradient-to-b from-mobile-header to-brand-700 text-white rounded-3xl p-6 shadow-xl relative overflow-hidden text-center space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center mx-auto text-white shadow-inner">
              <Bus className="w-7 h-7" />
            </div>

            <div>
              <span className="text-[10px] font-black uppercase tracking-widest bg-white/20 text-white px-3 py-1 rounded-full">
                {slides[activeSlide].tag}
              </span>
              <h1 className="text-xl font-black text-white mt-2 leading-tight">
                {slides[activeSlide].title}
              </h1>
              <p className="text-xs text-blue-100 font-medium mt-1">
                {slides[activeSlide].subtitle}
              </p>
            </div>

            {/* Slide Progress Dots */}
            <div className="flex justify-center space-x-2 pt-2">
              {slides.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveSlide(idx)}
                  className={`h-2 rounded-full transition-all ${
                    activeSlide === idx ? 'w-6 bg-white' : 'w-2 bg-white/40'
                  }`}
                />
              ))}
            </div>
          </div>

          {/* Mobile Action Buttons */}
          <div className="grid grid-cols-2 gap-3">
            <Link href="#form">
              <Button variant="mobile-primary" size="md" className="w-full text-xs">
                Report Complaint
              </Button>
            </Link>
            <Link href="/track">
              <Button variant="outline" size="md" className="w-full text-xs border-mobile-header text-mobile-header">
                Track Status
              </Button>
            </Link>
          </div>

          {/* Mobile Card List Rows (YATRE Profile/Settings Card Style) */}
          <div className="space-y-3">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-500 px-1">Quick Portals</h3>

            <Card
              variant="row"
              title="Passenger Grievance Form"
              subtitle="File incident report directly"
              leadingIcon={<FileText className="w-5 h-5 text-mobile-header" />}
              onClick={() => {
                const el = document.getElementById('form');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }}
            />

            <Card
              variant="row"
              title="Public Status Lookup"
              subtitle="Track complaint status by reference code"
              leadingIcon={<Search className="w-5 h-5 text-amber-500" />}
              onClick={() => router.push('/track')}
            />

            <Card
              variant="row"
              title="Depot Management View"
              subtitle="Executive analytics & SLA engine"
              leadingIcon={<LayoutDashboard className="w-5 h-5 text-emerald-500" />}
              onClick={() => router.push('/dashboard')}
            />
          </div>
        </div>

        {/* SUBMISSION FORM CONTAINER */}
        <div id="form" className="scroll-mt-20">
          <GrievanceForm />
        </div>
      </div>
    </div>
  );
}
