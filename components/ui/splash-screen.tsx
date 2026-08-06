"use client";

import React, { useEffect, useState } from "react";

export function SplashScreen() {
  const [isVisible, setIsVisible] = useState(true);
  const [isFadingOut, setIsFadingOut] = useState(false);

  useEffect(() => {
    // Keep splash screen visible briefly for smooth enterprise PWA startup, then fade out
    const timer = setTimeout(() => {
      setIsFadingOut(true);
      const removeTimer = setTimeout(() => {
        setIsVisible(false);
      }, 500);
      return () => clearTimeout(removeTimer);
    }, 1200);

    return () => clearTimeout(timer);
  }, []);

  if (!isVisible) return null;

  return (
    <div
      aria-label="Memuat aplikasi TabMonitor"
      className={`fixed inset-0 z-[99999] flex flex-col items-center justify-center bg-white selection:bg-indigo-100 overflow-hidden transition-opacity duration-500 ${
        isFadingOut ? "opacity-0 pointer-events-none" : "opacity-100"
      }`}
    >
      {/* Top-Right subtle purple dotted pattern */}
      <div
        className="absolute top-0 right-0 w-[240px] h-[240px] pointer-events-none opacity-[0.06]"
        style={{
          backgroundImage: "radial-gradient(#4F46E5 2px, transparent 2px)",
          backgroundSize: "16px 16px",
          WebkitMaskImage: "radial-gradient(circle at top right, black 30%, transparent 80%)",
          maskImage: "radial-gradient(circle at top right, black 30%, transparent 80%)",
        }}
      />

      {/* Bottom-Left subtle purple dotted pattern */}
      <div
        className="absolute bottom-0 left-0 w-[240px] h-[240px] pointer-events-none opacity-[0.06]"
        style={{
          backgroundImage: "radial-gradient(#4F46E5 2px, transparent 2px)",
          backgroundSize: "16px 16px",
          WebkitMaskImage: "radial-gradient(circle at bottom left, black 30%, transparent 80%)",
          maskImage: "radial-gradient(circle at bottom left, black 30%, transparent 80%)",
        }}
      />

      {/* Top-Left subtle circular line decorations */}
      <div className="absolute -top-20 -left-20 w-[280px] h-[280px] border [border-width:1.5px] border-[#4F46E5] rounded-full pointer-events-none opacity-[0.06]" />
      <div className="absolute -top-10 -left-10 w-[200px] h-[200px] border border-dashed border-[#4F46E5] rounded-full pointer-events-none opacity-[0.06]" />

      {/* Bottom-Right subtle circular line decorations */}
      <div className="absolute -bottom-24 -right-24 w-[320px] h-[320px] border [border-width:1.5px] border-[#4F46E5] rounded-full pointer-events-none opacity-[0.06]" />
      <div className="absolute -bottom-14 -right-14 w-[240px] h-[240px] border border-dashed border-[#4F46E5] rounded-full pointer-events-none opacity-[0.06]" />

      {/* Center Layout Stack */}
      <div className="relative z-10 flex flex-col items-center text-center px-6">
        
        {/* App Icon: 104px squircle with purple gradient (#4F46E5 -> #6D5DFE) & soft purple glow */}
        <div
          className="w-[104px] h-[104px] rounded-[26px] flex items-center justify-center mb-[40px]"
          style={{
            background: "linear-gradient(135deg, #4F46E5 0%, #6D5DFE 100%)",
            boxShadow:
              "0 14px 28px rgba(79, 70, 229, 0.25), 0 6px 12px rgba(109, 93, 254, 0.15)",
          }}
        >
          <svg
            className="w-[52px] h-[52px] text-white"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <rect x="4" y="2" width="16" height="20" rx="2" ry="2" />
            <line x1="12" y1="18" x2="12.01" y2="18" strokeWidth="3" />
          </svg>
        </div>

        {/* Title: Tab (Dark Charcoal #1F2937) Monitor (Primary Purple #4F46E5) 58px */}
        <h1 className="text-[52px] sm:text-[58px] font-extrabold tracking-tight leading-none mb-4 select-none">
          <span className="text-[#1F2937]">Tab</span>
          <span className="text-[#4F46E5]">Monitor</span>
        </h1>

        {/* Short centered purple divider line (40px width) */}
        <div className="w-[40px] h-[3.5px] bg-[#4F46E5] rounded-full mb-9" />

        {/* Modern thin rounded progress bar (220px width, primary #4F46E5, track #ECECFF) */}
        <div className="w-[220px] h-[4px] bg-[#ECECFF] rounded-full overflow-hidden relative mb-4">
          <div
            className="absolute top-0 left-0 h-full rounded-full bg-gradient-to-r from-[#4F46E5] to-[#6D5DFE] animate-pulse"
            style={{
              width: "70%",
              animation: "pwaLoad 1.8s cubic-bezier(0.4, 0, 0.2, 1) infinite",
            }}
          />
        </div>

        {/* Loading text: "Memuat aplikasi..." */}
        <p className="text-[18px] font-medium text-[#6B7280] tracking-tight">
          Memuat aplikasi...
        </p>

      </div>

      <style jsx>{`
        @keyframes pwaLoad {
          0% {
            left: -35%;
            width: 35%;
          }
          60% {
            left: 30%;
            width: 65%;
          }
          100% {
            left: 100%;
            width: 25%;
          }
        }
      `}</style>
    </div>
  );
}
