"use client";

import React, { useState, useEffect } from "react";
import { User, InspectionPeriod } from "@/types";
import { MapPin, RefreshCw, Wifi, WifiOff } from "lucide-react";
import { offlineSyncService } from "@/services/offline-sync.service";

interface PicMobileHeaderProps {
  user?: User | null;
  activePeriod?: InspectionPeriod | null;
}

export function PicMobileHeader({ user }: PicMobileHeaderProps) {
  const [isOnline, setIsOnline] = useState(true);
  const [pendingCount, setPendingCount] = useState(0);
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

    setPendingCount(offlineSyncService.getPending().length);

    return () => {
      window.removeEventListener("online", updateOnline);
      window.removeEventListener("offline", updateOnline);
    };
  }, []);

  const handleAutoSync = async () => {
    setSyncing(true);
    try {
      await offlineSyncService.syncAll();
      setPendingCount(offlineSyncService.getPending().length);
    } catch (e) {
    } finally {
      setSyncing(false);
    }
  };

  const initials = user?.name
    ? user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "AR";

  return (
    <header className="sticky top-0 z-30 bg-white/95 dark:bg-slate-900/95 border-b border-slate-200/80 dark:border-slate-800 backdrop-blur-md px-3.5 py-2">
      <div className="flex items-center justify-between gap-2">
        {/* Left: Avatar + User Name + Location + Role Badge */}
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-full bg-indigo-600 text-white font-extrabold text-xs flex items-center justify-center shrink-0 shadow-sm shadow-indigo-500/20 border border-indigo-500/30">
            {initials}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 leading-none">
              <span className="text-xs font-black text-slate-900 dark:text-slate-100 truncate">
                {user?.name || "Ahmad Rizky"}
              </span>
              <span className="px-1.5 py-0.5 rounded text-[8px] font-extrabold bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300 border border-indigo-200/60 shrink-0 uppercase tracking-wider">
                PIC PWA
              </span>
            </div>
            <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium flex items-center gap-0.5 truncate mt-0.5">
              <MapPin className="w-2.5 h-2.5 text-indigo-500 shrink-0" />
              <span className="truncate">{user?.location?.name || "Gudang Utama A"}</span>
            </span>
          </div>
        </div>

        {/* Right: Connection Status & Pending Sync */}
        <div className="flex items-center gap-1.5 shrink-0">
          {pendingCount > 0 ? (
            <button
              onClick={handleAutoSync}
              disabled={syncing || !isOnline}
              className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950/60 border border-amber-200 text-amber-700 dark:text-amber-300 text-[9px] font-bold shadow-2xs"
              title="Klik untuk menyinkronkan data offline"
            >
              <RefreshCw className={`w-2.5 h-2.5 ${syncing ? "animate-spin" : ""}`} />
              <span>🟠 {pendingCount} Pending Sync</span>
            </button>
          ) : isOnline ? (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200/60 text-emerald-700 dark:text-emerald-300 text-[9px] font-bold">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              🟢 Online
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-rose-50 dark:bg-rose-950/40 border border-rose-200/60 text-rose-700 dark:text-rose-300 text-[9px] font-bold">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
              🔴 Offline
            </span>
          )}
        </div>
      </div>
    </header>
  );
}
