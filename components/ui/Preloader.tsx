'use client';

import React, { useState, useEffect } from 'react';

export const Preloader: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [fading, setFading] = useState(false);
  const [iteration, setIteration] = useState(0);

  useEffect(() => {
    // 1. At 2.5s (when bus accelerates off-screen and progress hits 100%), start opacity fade-out
    const fadeTimer = setTimeout(() => {
      setFading(true);
    }, 2500);

    // 2. At 2.8s, complete fade-out and unmount preloader
    const removeTimer = setTimeout(() => {
      setLoading(false);
    }, 2800);

    // 3. Max-duration failsafe: If page load is delayed > 4s, restart the drive loop cleanly
    const failsafeTimer = setInterval(() => {
      setIteration((prev) => prev + 1);
    }, 3200);

    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(removeTimer);
      clearInterval(failsafeTimer);
    };
  }, []);

  if (!loading) return null;

  return (
    <div
      className={`fixed inset-0 z-[100] flex flex-col items-center justify-center bg-slate-950 text-white overflow-hidden transition-opacity duration-300 select-none ${
        fading ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
    >
      {/* Background Subtle Transit Radial Glow */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(9,44,177,0.45),transparent_75%)] pointer-events-none" />

      {/* Centered Integrated Module (Logo lockup positioned JUST ABOVE the moving bus) */}
      <div className="relative z-10 w-full max-w-4xl px-4 flex flex-col items-center space-y-6">
        {/* Brand Logo & Name (Positioned JUST ABOVE the moving bus) */}
        <div className="flex flex-col items-center text-center space-y-2">
          <img
            src="/logo-full-white.png"
            alt="Yathra Care Logo"
            className="h-32 sm:h-36 w-auto object-contain drop-shadow-xl"
          />
          <p className="text-xs sm:text-sm text-blue-200 font-medium tracking-wide">
            State Transport Passenger Grievance Portal
          </p>
        </div>

        {/* Track Line / Road with Moving Bus */}
        <div className="relative w-full h-24 flex items-end overflow-visible">
          {/* Animated Bus & Exhaust Smoke Container */}
          <div
            key={iteration}
            className="absolute bottom-3 left-0 animate-busDriveSequence"
          >
            {/* Exhaust Smoke Puffs (Positioned at rear bumper) */}
            <div className="absolute -left-6 bottom-2 flex space-x-1 pointer-events-none">
              <span className="w-4 h-4 rounded-full bg-slate-300/60 blur-[1px] animate-smokePuff1" />
              <span className="w-5 h-5 rounded-full bg-slate-200/50 blur-[1px] animate-smokePuff2" />
              <span className="w-6 h-6 rounded-full bg-white/40 blur-[2px] animate-smokePuff3" />
            </div>

            {/* Custom SVG Bus Silhouette (Primary/Accent Design System Colors) */}
            <div className="relative w-28 sm:w-32 h-14 sm:h-16">
              <svg
                viewBox="0 0 140 70"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="w-full h-full drop-shadow-2xl"
              >
                {/* Bus Body Base */}
                <rect
                  x="5"
                  y="10"
                  width="130"
                  height="45"
                  rx="10"
                  fill="#fd8f49"
                />
                {/* Roof Cap Gradient Curve */}
                <path
                  d="M15 10 C30 5, 110 5, 125 10 Z"
                  fill="#ea7c35"
                />
                {/* Front Windshield Curved Glass */}
                <path
                  d="M100 15 L128 15 C132 15, 134 20, 132 30 L100 30 Z"
                  fill="#e8f2fe"
                  fillOpacity="0.9"
                />
                {/* Side Passenger Windows */}
                <rect x="15" y="15" width="22" height="15" rx="3" fill="#e8f2fe" fillOpacity="0.85" />
                <rect x="42" y="15" width="22" height="15" rx="3" fill="#e8f2fe" fillOpacity="0.85" />
                <rect x="69" y="15" width="22" height="15" rx="3" fill="#e8f2fe" fillOpacity="0.85" />

                {/* Body Side Navy Accent Stripe */}
                <rect x="5" y="34" width="130" height="6" fill="#092cb1" />

                {/* Headlight Glow */}
                <circle cx="132" cy="45" r="4" fill="#fef08a" />
                <path d="M136 43 L146 39 L146 51 L136 47 Z" fill="#fef08a" fillOpacity="0.45" />

                {/* Rear Taillight */}
                <rect x="5" y="42" width="3" height="7" rx="1.5" fill="#f43f5e" />

                {/* Rotating Wheels */}
                <g className="animate-wheelSpin origin-[32px_55px]">
                  <circle cx="32" cy="55" r="9" fill="#1e293b" />
                  <circle cx="32" cy="55" r="5" fill="#94a3b8" />
                  <line x1="32" y1="46" x2="32" y2="64" stroke="#1e293b" strokeWidth="1.5" />
                  <line x1="23" y1="55" x2="41" y2="55" stroke="#1e293b" strokeWidth="1.5" />
                </g>

                <g className="animate-wheelSpin origin-[108px_55px]">
                  <circle cx="108" cy="55" r="9" fill="#1e293b" />
                  <circle cx="108" cy="55" r="5" fill="#94a3b8" />
                  <line x1="108" y1="46" x2="108" y2="64" stroke="#1e293b" strokeWidth="1.5" />
                  <line x1="99" y1="55" x2="117" y2="55" stroke="#1e293b" strokeWidth="1.5" />
                </g>
              </svg>
            </div>
          </div>

          {/* Road Baseline */}
          <div className="w-full h-1 bg-slate-800/90 rounded-full shadow-sm" />
        </div>

        {/* Thin Synchronized Progress Bar (Positioned under wheels) */}
        <div className="w-full max-w-xl mt-2">
          <div className="relative w-full h-1.5 bg-slate-800/80 rounded-full overflow-hidden border border-white/10 shadow-inner">
            <div
              key={iteration}
              className="h-full bg-gradient-to-r from-brand-500 via-desktop-accent to-amber-400 rounded-full animate-progressSync"
            />
          </div>
        </div>

        {/* Status Message */}
        <div className="mt-4 flex items-center space-x-2 text-[11px] text-slate-400 font-medium">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>Connecting to Command Depot & Route SLA Database...</span>
        </div>
      </div>

      {/* Bottom Operational Badge */}
      <div className="absolute bottom-8 z-10 text-[11px] text-slate-500 font-medium tracking-wider uppercase">
        100% Offline Operations Engine
      </div>
    </div>
  );
};

export default Preloader;
