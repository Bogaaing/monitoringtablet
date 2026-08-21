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
    : "JM";

  return (
    <header className="sticky top-0 z-30 bg-white/95 dark:bg-slate-900/95 border-b border-slate-100 dark:border-slate-800 backdrop-blur-md px-4 py-3">
      <div className="flex items-center justify-between gap-3">
        {/* Left: Avatar + User Name + Location + Role Badge */}
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-full bg-[#3B40E8] text-white font-bold text-sm flex items-center justify-center shrink-0 shadow-sm">
            {initials}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 leading-none">
              <span className="text-sm font-bold text-slate-900 dark:text-slate-100 truncate">
                {user?.name || "Joko Maryono"}
              </span>
              <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-[#EDE9FE] text-[#6D28D9] dark:bg-purple-950/80 dark:text-purple-300 shrink-0 uppercase tracking-wide">
                PIC PWA
              </span>
            </div>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium flex items-center gap-1 truncate mt-1">
              <MapPin className="w-3.5 h-3.5 text-[#4F46E5] shrink-0" />
              <span className="truncate">{user?.location?.name || "Politur"}</span>
            </span>
          </div>
        </div>

        {/* Right: Connection Status & Pending Sync */}
        <div className="flex items-center gap-2 shrink-0">
          {pendingCount > 0 ? (
            <button
              onClick={handleAutoSync}
              disabled={syncing || !isOnline}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-50 dark:bg-amber-950/60 border border-amber-200/80 text-amber-700 dark:text-amber-300 text-xs font-semibold shadow-2xs"
              title="Klik untuk menyinkronkan data offline"
            >
              <RefreshCw className={`w-3 h-3 ${syncing ? "animate-spin" : ""}`} />
              <span>{pendingCount} Pending</span>
            </button>
          ) : isOnline ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#ECFDF5] dark:bg-emerald-950/40 border border-emerald-200/60 text-[#059669] dark:text-emerald-400 text-xs font-semibold">
              <span className="w-2 h-2 rounded-full bg-[#10B981] animate-pulse" />
              <span>Online</span>
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-50 dark:bg-rose-950/40 border border-rose-200/60 text-rose-700 dark:text-rose-400 text-xs font-semibold">
              <span className="w-2 h-2 rounded-full bg-rose-500" />
              <span>Offline</span>
            </span>
          )}
        </div>
      </div>
    </header>
  );
}
