"use client";

import React, { useState, useEffect } from "react";
import { PageHeader } from "@/components/shared/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { dashboardService, PicDashboardStats } from "@/services/dashboard.service";
import { authService } from "@/services/auth.service";
import { User } from "@/types";
import { QrCode, ArrowRight, Activity, MapPin } from "lucide-react";
import Link from "next/link";

export default function PicDashboardPage() {
  const [stats, setStats] = useState<PicDashboardStats | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    authService.getCurrentProfile().then((u) => {
      setCurrentUser(u);
      dashboardService.getPicStats(u?.id || "user-pic-demo").then((res) => {
        setStats(res);
        setLoading(false);
      });
    });
  }, []);

  const total = stats?.assignedTabletsCount || 1;
  const completed = stats?.completedCount || 0;
  const remaining = stats?.remainingCount || 0;
  const progressPct = Math.min(100, Math.round((completed / total) * 100));

  return (
    <div className="space-y-5 animate-in fade-in">

      {/* Hero Scan QR Button (Large 56px Touch Target for Mobile) */}
      <Link href="/pic/scan" className="block">
        <Button className="w-full min-h-[56px] bg-[#473bf0] hover:bg-indigo-700 active:scale-[0.98] text-white font-extrabold py-3.5 px-5 rounded-2xl shadow-xl shadow-indigo-500/30 flex items-center justify-between transition-all duration-200 border-2 border-indigo-400/30">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-white/20 text-white backdrop-blur-sm">
              <QrCode className="w-6 h-6" />
            </div>
            <div className="text-left">
              <span className="text-sm block font-black leading-none">Scan QR Code Tablet</span>
              <span className="text-[11px] font-normal text-indigo-100 mt-1 block">
                Mulai Inspeksi Fisik Bulanan
              </span>
            </div>
          </div>
          <ArrowRight className="w-5 h-5 text-indigo-200" />
        </Button>
      </Link>

      {/* Target & Progress Cards */}
      <Card className="border-slate-200 dark:border-slate-800 shadow-sm">
        <CardContent className="p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-black uppercase text-slate-500 tracking-wider">
              Target Inspeksi Bulanan
            </h3>
            <span className="text-xs font-mono font-bold text-indigo-600">
              {progressPct}% Selesai
            </span>
          </div>

          {/* Progress Bar */}
          <div className="w-full h-2.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-indigo-500 to-emerald-500 rounded-full transition-all duration-500"
              style={{ width: `${progressPct}%` }}
            />
          </div>

          {/* 3 Metric Counts */}
          <div className="grid grid-cols-3 gap-2 pt-1 text-center">
            <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
              <span className="text-[10px] text-slate-500 block font-semibold">Total Unit</span>
              <span className="text-base font-black text-slate-900 dark:text-slate-100">
                {loading ? "..." : total}
              </span>
            </div>

            <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-100 dark:border-emerald-900/40">
              <span className="text-[10px] text-emerald-600 dark:text-emerald-400 block font-semibold">Selesai</span>
              <span className="text-base font-black text-emerald-700 dark:text-emerald-300">
                {loading ? "..." : completed}
              </span>
            </div>

            <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-100 dark:border-amber-900/40">
              <span className="text-[10px] text-amber-600 dark:text-amber-400 block font-semibold">Sisa</span>
              <span className="text-base font-black text-amber-700 dark:text-amber-300">
                {loading ? "..." : remaining}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recent Inspection History */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-xs font-black uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
            <Activity className="w-3.5 h-3.5 text-indigo-500" />
            <span>Pengajuan Terbaru</span>
          </h3>

          <Link href="/pic/inspections">
            <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline">
              Lihat Semua →
            </span>
          </Link>
        </div>

        {!stats?.recentInspections || stats.recentInspections.length === 0 ? (
          <Card>
            <CardContent className="p-6 text-center text-xs text-slate-500">
              Belum ada pengajuan inspeksi periode ini.
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {stats.recentInspections.slice(0, 5).map((ins) => (
              <Card key={ins.id} className="hover:border-indigo-300 transition-colors shadow-sm">
                <CardContent className="p-3 flex items-center justify-between gap-2">
                  <div className="space-y-0.5">
                    <span className="font-mono font-bold text-xs text-indigo-600 dark:text-indigo-400 block">
                      {ins.tablet?.qr_code || "QR-TAB-001"}
                    </span>
                    <span className="text-[11px] font-semibold text-slate-800 dark:text-slate-200 block">
                      {ins.tablet?.model || "Galaxy Tab Active 3"}
                    </span>
                    <span className="text-[10px] text-slate-500 flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-indigo-400" />
                      <span>{ins.tablet?.location?.name || "Gudang Utama A"}</span>
                    </span>
                  </div>

                  <div className="text-right space-y-1">
                    <StatusBadge status={ins.status} className="text-[10px]" />
                    <span className="text-[10px] font-mono text-slate-400 block">
                      {new Date(ins.submitted_at).toLocaleTimeString("id-ID", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
