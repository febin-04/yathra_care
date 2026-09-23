'use client';

import React, { useState, useEffect } from 'react';

export const Preloader: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [fading, setFading] = useState(false);

  useEffect(() => {
    // Start fading out after 900ms, then unmount at 1400ms
    const fadeTimer = setTimeout(() => {
      setFading(true);
    }, 900);

    const removeTimer = setTimeout(() => {
      setLoading(false);
    }, 1400);

    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(removeTimer);
    };
  }, []);

  if (!loading) return null;

  return (
    <div
      className={`fixed inset-0 z-[100] flex flex-col items-center justify-center bg-slate-950 text-white transition-opacity duration-500 ${
        fading ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
    >
      {/* Background Subtle Radial Gradient */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(9,44,177,0.35),transparent_70%)] pointer-events-none" />

      {/* Main Preloader Content */}
      <div className="relative z-10 flex flex-col items-center space-y-6 text-center px-4">
        {/* Pulsing Animated Logo Ring */}
        <div className="relative flex items-center justify-center">
          <div className="absolute w-24 h-24 rounded-full bg-brand-500/30 animate-ping" />
          <div className="w-24 h-24 rounded-3xl bg-white/10 backdrop-blur-md p-3 shadow-2xl border border-white/20 relative flex items-center justify-center">
            <img
              src="/logo-icon-white.png"
              alt="Yathra Care Logo"
              className="w-full h-full object-contain"
            />
          </div>
        </div>

        {/* Brand Name & Tagline */}
        <div className="space-y-1.5">
          <h1 className="text-2xl sm:text-3xl font-heading font-black tracking-wider text-white uppercase drop-shadow-md">
            Yathra Care
          </h1>
          <p className="text-xs text-blue-200 font-medium tracking-wide">
            Passenger Grievance Portal
          </p>
        </div>

        {/* Sleek Animated Progress Bar */}
        <div className="w-48 sm:w-56 h-1.5 bg-slate-800 rounded-full overflow-hidden border border-white/10 shadow-inner">
          <div className="h-full bg-gradient-to-r from-brand-400 via-desktop-accent to-brand-500 rounded-full animate-preloaderProgress" />
        </div>

        {/* Status Text */}
        <div className="flex items-center space-x-2 text-[11px] text-slate-400 font-medium">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>Initializing Operations Engine...</span>
        </div>
      </div>
    </div>
  );
};

export default Preloader;
