'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  FileText,
  Search,
  Clock,
  ShieldCheck,
  Lock,
  WifiOff,
  Flame,
  ChevronRight,
  ChevronDown,
  Bus,
  Building2,
  HelpCircle,
  ArrowRight,
  Sparkles,
} from 'lucide-react';

interface HelpItem {
  id: string;
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  content: React.ReactNode;
  actionHref?: string;
  actionLabel?: string;
}

export default function HelpPage() {
  const [expandedId, setExpandedId] = useState<string | null>('submit');

  const helpTopics: HelpItem[] = [
    {
      id: 'submit',
      title: 'How to submit a complaint',
      subtitle: 'Complete passenger grievance filing under 60 seconds',
      icon: <FileText className="w-5 h-5 text-mobile-header" />,
      actionHref: '/',
      actionLabel: 'Open Grievance Form',
      content: (
        <div className="space-y-3 text-xs text-slate-600 leading-relaxed font-medium">
          <p>
            Filing a passenger grievance is designed to take under 60 seconds with no complex account registration:
          </p>
          <ol className="list-decimal pl-4 space-y-1.5 font-bold text-slate-800">
            <li>Select or type your bus route code (e.g. <code className="bg-slate-100 px-1.5 py-0.5 rounded text-mobile-primaryBtn">RT101</code>).</li>
            <li>Choose the issue category (Fare Overcharge, Bus Skipped Stop, Rash Driving, etc.).</li>
            <li>Provide incident location or landmark (e.g. Attingal Bus Stand, Seat 12).</li>
            <li>Type a quick description (or use our local keyword auto-categorizer suggestion).</li>
            <li>Optionally attach ticket photo evidence and click <strong>Submit Grievance</strong>.</li>
          </ol>
          <p className="text-[11px] text-slate-500 pt-1 border-t border-slate-100">
            Every submission generates a digital tracking code (e.g. <code className="font-mono text-slate-800 font-extrabold">RT101-20260923-0001</code>) and auto-assigns the depot SLA target.
          </p>
        </div>
      ),
    },
    {
      id: 'track',
      title: 'How to track status',
      subtitle: 'Lookup resolution progress & state machine workflow log',
      icon: <Search className="w-5 h-5 text-amber-500" />,
      actionHref: '/track',
      actionLabel: 'Go to Status Tracker',
      content: (
        <div className="space-y-3 text-xs text-slate-600 leading-relaxed font-medium">
          <p>
            Track your complaint in real time using your unique reference number:
          </p>
          <ul className="list-disc pl-4 space-y-1.5">
            <li><strong>State Machine Stepper:</strong> View live progress through <span className="font-bold text-slate-800">Submitted → Acknowledged → In Progress → Resolved</span>.</li>
            <li><strong>Audit Log:</strong> Inspect complete timestamped audit history of state transitions logged by depot managers.</li>
            <li><strong>Digital QR Verification:</strong> Display your digital QR code at depot station terminals for updates.</li>
            <li><strong>Anonymous Feedback:</strong> Submit a 1–5 star satisfaction rating once resolved.</li>
          </ul>
        </div>
      ),
    },
    {
      id: 'escalation',
      title: 'How escalation works',
      subtitle: 'Automated SLA overdue breach monitoring & HQ reassignment',
      icon: <Clock className="w-5 h-5 text-rose-500" />,
      actionHref: '/dashboard',
      actionLabel: 'View Escalation Engine',
      content: (
        <div className="space-y-3 text-xs text-slate-600 leading-relaxed font-medium">
          <p>
            The system continuously monitors resolution deadlines based on category targets (e.g., Safety: 12h, Staff Misconduct: 24h, Refund: 48h):
          </p>
          <ul className="list-disc pl-4 space-y-1.5">
            <li>If a grievance exceeds its SLA target without being resolved, the <strong>Escalation Engine</strong> automatically triggers.</li>
            <li>Status transitions to <span className="bg-rose-100 text-rose-800 font-extrabold px-1.5 py-0.5 rounded">ESCALATED</span> and the case is reassigned to Regional HQ Command (<code className="font-mono">DEP-HQ</code>).</li>
            <li>Simulated SMS & Email alerts are dispatched to depot supervisors.</li>
          </ul>
        </div>
      ),
    },
    {
      id: 'offline',
      title: 'Offline queue & auto-sync',
      subtitle: 'Local browser storage for unreliable venue internet',
      icon: <WifiOff className="w-5 h-5 text-indigo-500" />,
      actionHref: '/',
      actionLabel: 'Test Offline Storage',
      content: (
        <div className="space-y-3 text-xs text-slate-600 leading-relaxed font-medium">
          <p>
            Designed to operate 100% offline at venues with weak cellular signal:
          </p>
          <ul className="list-disc pl-4 space-y-1.5">
            <li>If offline during submission, the report is saved safely to local browser <code className="font-mono bg-slate-100 text-slate-800 px-1 py-0.5 rounded">localStorage</code>.</li>
            <li>A temporary offline tracking reference is issued immediately.</li>
            <li>As soon as network connectivity is restored, an auto-sync process registers the grievance into the main SQLite database.</li>
          </ul>
        </div>
      ),
    },
    {
      id: 'privacy',
      title: 'Privacy & SQL redaction',
      subtitle: 'Database query layer scrubbing for complete complainant privacy',
      icon: <Lock className="w-5 h-5 text-emerald-500" />,
      actionHref: '/dashboard',
      actionLabel: 'View Anonymised View',
      content: (
        <div className="space-y-3 text-xs text-slate-600 leading-relaxed font-medium">
          <p>
            The system enforces strict privacy at the SQL query layer:
          </p>
          <ul className="list-disc pl-4 space-y-1.5">
            <li>Complainant identity, phone numbers, exact home addresses, and unverified allegations are scrubbed before API payloads leave the server.</li>
            <li>Management dashboards and public views receive anonymised aggregate metrics only.</li>
          </ul>
        </div>
      ),
    },
    {
      id: 'priority',
      title: 'Depot priority scoring',
      subtitle: 'Ranking open grievances combining severity and 7-day route volume',
      icon: <Flame className="w-5 h-5 text-amber-600" />,
      actionHref: '/dashboard',
      actionLabel: 'View Priority List',
      content: (
        <div className="space-y-3 text-xs text-slate-600 leading-relaxed font-medium">
          <p>
            Depot managers view a priority-ranked <strong>Needs Attention</strong> section computed via:
          </p>
          <div className="bg-slate-100 p-3 rounded-xl border border-slate-200 font-mono text-[11px] text-slate-900 font-bold text-center">
            Priority Score = Category Weight × (7D Route Volume + 1) × Overdue Multiplier
          </div>
          <p>
            This ensures high-volume routes experiencing urgent safety issues receive immediate operational resources.
          </p>
        </div>
      ),
    },
  ];

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header Banner (Matches YATRE Mobile Banner Style) */}
      <div className="bg-gradient-to-r from-mobile-header via-brand-700 to-desktop-hero text-white rounded-3xl p-6 md:p-8 shadow-xl relative overflow-hidden space-y-3">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white shadow-inner">
            <HelpCircle className="w-7 h-7" />
          </div>
          <div>
            <span className="text-[10px] font-black uppercase tracking-widest text-blue-100 bg-white/20 px-2.5 py-0.5 rounded-full">
              System Support & FAQ
            </span>
            <h1 className="text-2xl font-black text-white mt-1 tracking-tight">Help & Knowledge Center</h1>
          </div>
        </div>
        <p className="text-xs text-blue-100 max-w-xl font-medium">
          Instant guidance for passenger grievance reporting, status tracking, automated SLA escalations, and offline operations.
        </p>
      </div>

      {/* YATRE CARD-LIST PATTERN (Icon + Short Label per Row) */}
      <div className="space-y-3">
        <h3 className="text-xs font-black uppercase tracking-wider text-slate-500 px-1">Frequent Help Topics</h3>

        {helpTopics.map((topic) => {
          const isExpanded = expandedId === topic.id;

          return (
            <div
              key={topic.id}
              className="bg-white rounded-2xl border border-mobile-border shadow-sm overflow-hidden transition-all duration-200"
            >
              {/* Row Header */}
              <div
                onClick={() => setExpandedId(isExpanded ? null : topic.id)}
                className="p-4 flex items-center justify-between cursor-pointer hover:bg-mobile-cardTint/50 transition-colors group"
              >
                <div className="flex items-center space-x-3.5">
                  <div className="w-10 h-10 rounded-2xl bg-mobile-cardTint flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                    {topic.icon}
                  </div>
                  <div>
                    <h4 className="text-sm font-black text-slate-900 group-hover:text-mobile-header transition-colors">
                      {topic.title}
                    </h4>
                    <p className="text-xs text-slate-500 font-medium">{topic.subtitle}</p>
                  </div>
                </div>

                <div className="p-1 rounded-xl bg-slate-100 text-slate-500 group-hover:bg-mobile-cardTint group-hover:text-mobile-header transition-colors">
                  {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                </div>
              </div>

              {/* Expandable Details Content */}
              {isExpanded && (
                <div className="px-5 pb-5 pt-2 border-t border-mobile-border bg-slate-50/50 space-y-4 animate-fade-in">
                  {topic.content}

                  {topic.actionHref && (
                    <div className="pt-2 flex justify-end">
                      <Link
                        href={topic.actionHref}
                        className="bg-mobile-header hover:bg-mobile-primaryBtn text-white text-xs font-extrabold px-4 py-2 rounded-xl transition-colors shadow-sm flex items-center gap-1.5"
                      >
                        <span>{topic.actionLabel}</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Quick Portal Shortcuts */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-md text-center space-y-3">
        <h4 className="text-xs font-black uppercase tracking-wider text-slate-500">Need Immediate Assistance?</h4>
        <div className="flex flex-wrap justify-center gap-3">
          <Link
            href="/#form"
            className="bg-desktop-accent hover:bg-desktop-accentHover text-white text-xs font-black py-2.5 px-5 rounded-xl transition-all shadow uppercase tracking-wide"
          >
            File New Grievance
          </Link>
          <Link
            href="/track"
            className="bg-desktop-hero hover:bg-desktop-navy text-white text-xs font-bold py-2.5 px-5 rounded-xl transition-all shadow"
          >
            Track Reference Code
          </Link>
          <Link
            href="/notifications"
            className="bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold py-2.5 px-5 rounded-xl transition-all"
          >
            View Mock Notification Inbox
          </Link>
        </div>
      </div>
    </div>
  );
}
