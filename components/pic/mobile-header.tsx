"use client";

import React, { useState, useEffect } from "react";
import { User, InspectionPeriod } from "@/types";
import { Calendar, Wifi, WifiOff, Download, User as UserIcon, RefreshCw } from "lucide-react";
import { offlineSyncService } from "@/services/offline-sync.service";

interface PicMobileHeaderProps {
  user?: User | null;
  activePeriod?: InspectionPeriod | null;
}

export function PicMobileHeader({ user, activePeriod }: PicMobileHeaderProps) {
  const [isOnline, setIsOnline] = useState(true);
  const [pendingCount, setPendingCount] = useState(0);
  const [installPrompt, setInstallPrompt] = useState<any>(null);
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    setIsOnline(navigator.onLine);
    const updateOnline = () => {
      const online = navigator.onLine;
      setIsOnline(online);
      if (online) {
        handleAutoSync();
      }
    };

    window.addEventListener("online", updateOnline);
    window.addEventListener("offline", updateOnline);

    // Listen for PWA install prompt
    const handleInstallPrompt = (e: any) => {
      e.preventDefault();
      setInstallPrompt(e);
    };

    window.addEventListener("beforeinstallprompt", handleInstallPrompt);

    // Initial check for offline pending syncs
    setPendingCount(offlineSyncService.getPending().length);

    return () => {
      window.removeEventListener("online", updateOnline);
      window.removeEventListener("offline", updateOnline);
      window.removeEventListener("beforeinstallprompt", handleInstallPrompt);
    };
  }, []);

  const handleAutoSync = async () => {
    setSyncing(true);
    try {
      const res = await offlineSyncService.syncAll();
      setPendingCount(offlineSyncService.getPending().length);
    } catch (e) {
    } finally {
      setSyncing(false);
    }
  };

  const handleInstallClick = () => {
    if (installPrompt) {
      installPrompt.prompt();
      installPrompt.userChoice.then(() => setInstallPrompt(null));
    }
  };

  return (
    <header className="sticky top-0 z-30 bg-white/95 dark:bg-slate-900/95 border-b border-slate-200 dark:border-slate-800 backdrop-blur-md px-4 py-3">
      <div className="flex items-center justify-between gap-2">
        {/* Left: App Logo & Role Badge */}
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-black text-sm shadow-md shadow-indigo-200 dark:shadow-none">
            T
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-sm font-black tracking-tight text-slate-900 dark:text-slate-100">
                TabMonitor
              </span>
              <span className="px-1.5 py-0.5 rounded text-[9px] font-black bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-200 dark:border-slate-700 uppercase">
                PIC PWA
              </span>
            </div>
            <span className="text-[10px] text-slate-500 font-medium block leading-none">
              {user?.name || "Kepala Regu"}
            </span>
          </div>
        </div>

        {/* Right: Network Status & PWA Install */}
        <div className="flex items-center gap-1.5">
          {/* Offline / Pending Sync Badge */}
          {pendingCount > 0 && (
            <button
              onClick={handleAutoSync}
              disabled={syncing || !isOnline}
              className="flex items-center gap-1 px-2 py-1 rounded-lg bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-300 text-[10px] font-bold"
              title="Klik untuk menyinkronkan data offline"
            >
              <RefreshCw className={`w-3 h-3 ${syncing ? "animate-spin" : ""}`} />
              <span>Pending Sync ({pendingCount})</span>
            </button>
          )}

          {/* Network Indicator */}
          <div
            className={`flex items-center gap-1 px-2 py-1 rounded-lg border text-[10px] font-bold ${
              isOnline
                ? "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300"
                : "bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300"
            }`}
          >
            {isOnline ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
            <span className="hidden xs:inline">{isOnline ? "Online" : "Offline"}</span>
          </div>

          {/* PWA Install Button */}
          {installPrompt && (
            <button
              onClick={handleInstallClick}
              className="p-1.5 rounded-lg bg-indigo-600 text-white font-bold text-xs flex items-center gap-1 hover:bg-indigo-700 transition"
              title="Install TabMonitor PWA ke layar utama"
            >
              <Download className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Active Period Banner */}
      {activePeriod && (
        <div className="mt-2.5 flex items-center justify-between px-3 py-1.5 rounded-xl bg-indigo-50/80 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/40 text-indigo-700 dark:text-indigo-300 text-[11px] font-semibold">
          <div className="flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5" />
            <span>{activePeriod.name}</span>
          </div>
          <span className="text-[10px] uppercase tracking-wider font-extrabold px-1.5 py-0.5 rounded bg-indigo-200/50 dark:bg-indigo-900/50">
            Aktif
          </span>
        </div>
      )}
    </header>
  );
}
