"use client";

import React, { useState, useEffect } from "react";
import { StatusBadge } from "@/components/shared/status-badge";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { dashboardService, PicDashboardStats } from "@/services/dashboard.service";
import { periodsService } from "@/services/periods.service";
import { authService } from "@/services/auth.service";
import { User, InspectionPeriod } from "@/types";
import {
  QrCode,
  ArrowRight,
  Calendar,
  ClipboardList,
  Clock,
  BarChart3,
  CheckCircle2,
  AlertCircle,
  XCircle,
  MapPin,
  ChevronRight,
  Sparkles,
  Activity,
} from "lucide-react";
import Link from "next/link";

export default function PicDashboardPage() {
  const [stats, setStats] = useState<PicDashboardStats | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [activePeriod, setActivePeriod] = useState<InspectionPeriod | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      authService.getCurrentProfile(),
      periodsService.getActivePeriod(),
    ]).then(([u, p]) => {
      setCurrentUser(u);
      setActivePeriod(p);
      dashboardService.getPicStats(u?.id || "user-pic-demo").then((res) => {
        setStats(res);
        setLoading(false);
      });
    });
  }, []);

  const total = stats?.assignedTabletsCount || 10;
  const completed = stats?.completedCount || 4;
  const remaining = Math.max(0, total - completed);
  const progressPct = Math.min(100, Math.round((completed / total) * 100));

  // Today Date String (Indonesian Format)
  const todayFormatted = new Date().toLocaleDateString("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  const pendingInspections =
    stats?.recentInspections?.filter((i) => i.status === "pending").slice(0, 3) || [];

  return (
    <div className="space-y-4 animate-in fade-in pb-2">
      {/* ── 1. ACTIVE PERIOD CARD ── */}
      <div className="p-3 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/40 flex items-center justify-between text-xs">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-indigo-600 text-white shadow-sm shrink-0">
            <Calendar className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[10px] text-slate-500 dark:text-slate-400 font-bold block uppercase tracking-wider leading-none">
              Periode Aktif
            </span>
            <span className="font-extrabold text-slate-900 dark:text-slate-100 mt-0.5 block">
              {activePeriod ? activePeriod.name : "Agustus 2026"}
            </span>
          </div>
        </div>
        <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 uppercase tracking-wider">
          Aktif
        </span>
      </div>

      {/* ── 2. PRIMARY ACTION: SCAN QR BUTTON ── */}
      <Link href="/pic/scan" className="block">
        <Button className="w-full min-h-[56px] bg-[#473bf0] hover:bg-indigo-700 active:scale-[0.98] text-white font-extrabold py-3.5 px-4 rounded-2xl shadow-xl shadow-indigo-500/25 flex items-center justify-between transition-all duration-200 border border-indigo-400/30">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-white/20 text-white backdrop-blur-sm shrink-0">
              <QrCode className="w-6 h-6" />
            </div>
            <div className="text-left">
              <span className="text-sm block font-black leading-none">Scan QR Code Tablet</span>
              <span className="text-[11px] font-normal text-indigo-100 mt-1 block">
                Mulai Inspeksi Fisik
              </span>
            </div>
          </div>
          <ArrowRight className="w-5 h-5 text-indigo-200 shrink-0" />
        </Button>
      </Link>

      {/* ── 3. TODAY TARGET DASHBOARD CARD ── */}
      <Card className="border-slate-200 dark:border-slate-800 shadow-sm rounded-2xl overflow-hidden">
        <CardContent className="p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-slate-100">
                Target Hari Ini
              </h3>
              <span className="text-[10px] text-slate-400 font-medium block mt-0.5">
                {todayFormatted}
              </span>
            </div>
            <span className="text-xs font-mono font-black text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/50 px-2 py-0.5 rounded-lg border border-indigo-100 dark:border-indigo-900/50">
              Target: {total} Unit
            </span>
          </div>

          {/* Today KPI Grid + Circular SVG Gauge */}
          <div className="flex items-center justify-between gap-3 pt-1">
            {/* Left Counts */}
            <div className="space-y-2 flex-1">
              <div className="flex items-center justify-between p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-100 dark:border-emerald-900/40">
                <span className="text-[10px] text-emerald-700 dark:text-emerald-300 font-bold">
                  Selesai
                </span>
                <span className="text-sm font-black text-emerald-700 dark:text-emerald-300">
                  {loading ? "·" : completed}
                </span>
              </div>

              <div className="flex items-center justify-between p-2 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-100 dark:border-amber-900/40">
                <span className="text-[10px] text-amber-700 dark:text-amber-300 font-bold">
                  Sisa
                </span>
                <span className="text-sm font-black text-amber-700 dark:text-amber-300">
                  {loading ? "·" : remaining}
                </span>
              </div>
            </div>

            {/* Right Circular Gauge */}
            <div className="relative w-20 h-20 flex items-center justify-center shrink-0">
              <svg className="w-20 h-20 transform -rotate-90" viewBox="0 0 36 36">
                <path
                  className="text-slate-100 dark:text-slate-800"
                  strokeWidth="3.5"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
                <path
                  className="text-indigo-600 dark:text-indigo-400 transition-all duration-700 ease-out"
                  strokeDasharray={`${progressPct}, 100`}
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
              </svg>
              <div className="absolute flex flex-col items-center justify-center text-center">
                <span className="text-xs font-black text-slate-900 dark:text-slate-100 leading-none">
                  {progressPct}%
                </span>
                <span className="text-[8px] text-slate-400 font-semibold leading-none mt-0.5">
                  Completed
                </span>
              </div>
            </div>
          </div>

          {/* Motivational Helper Text */}
          <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 text-[11px] text-slate-600 dark:text-slate-300 font-medium flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-500 shrink-0" />
            <span>
              {remaining > 0
                ? `${remaining} unit lagi untuk mencapai target hari ini.`
                : "Semua target hari ini telah tercapai! Great job! 🎉"}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* ── 4. MONTHLY PROGRESS COMPACT CARD ── */}
      <Card className="border-slate-200 dark:border-slate-800 shadow-sm rounded-2xl">
        <CardContent className="p-3.5 space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black uppercase tracking-wider text-slate-500">
              Monthly Progress
            </span>
            <Link href="/pic/tasks">
              <span className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-0.5">
                Lihat Detail <ChevronRight className="w-3 h-3" />
              </span>
            </Link>
          </div>

          {/* Progress Bar */}
          <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-indigo-500 to-emerald-500 rounded-full transition-all duration-500"
              style={{ width: `${progressPct}%` }}
            />
          </div>

          <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 font-medium pt-0.5">
            <span>Progress: <strong className="text-slate-800 dark:text-slate-200">{progressPct}%</strong></span>
            <span>Total: <strong className="text-slate-800 dark:text-slate-200">{total} Unit</strong></span>
            <span>Selesai: <strong className="text-emerald-600">{completed}</strong></span>
            <span>Sisa: <strong className="text-amber-600">{remaining}</strong></span>
          </div>
        </CardContent>
      </Card>

      {/* ── 5. QUICK ACTIONS GRID ── */}
      <div className="space-y-2">
        <span className="text-xs font-black uppercase tracking-wider text-slate-500 px-1">
          Aksi Cepat
        </span>
        <div className="grid grid-cols-4 gap-2">
          {[
            {
              title: "Scan QR",
              sub: "Mulai inspeksi",
              icon: QrCode,
              href: "/pic/scan",
              bg: "bg-indigo-50 dark:bg-indigo-950/50",
              text: "text-indigo-600 dark:text-indigo-400",
              border: "border-indigo-100 dark:border-indigo-900/40",
            },
            {
              title: "Tugas",
              sub: "Daftar unit",
              icon: ClipboardList,
              href: "/pic/tasks",
              bg: "bg-sky-50 dark:bg-sky-950/50",
              text: "text-sky-600 dark:text-sky-400",
              border: "border-sky-100 dark:border-sky-900/40",
            },
            {
              title: "Pending",
              sub: "Menunggu",
              icon: Clock,
              href: "/pic/inspections?status=pending",
              bg: "bg-amber-50 dark:bg-amber-950/50",
              text: "text-amber-600 dark:text-amber-400",
              border: "border-amber-100 dark:border-amber-900/40",
            },
            {
              title: "Progress",
              sub: "Ringkasan",
              icon: BarChart3,
              href: "/pic/tasks",
              bg: "bg-emerald-50 dark:bg-emerald-950/50",
              text: "text-emerald-600 dark:text-emerald-400",
              border: "border-emerald-100 dark:border-emerald-900/40",
            },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <Link key={item.title} href={item.href} className="block">
                <div
                  className={`p-2.5 rounded-2xl border ${item.bg} ${item.border} text-center space-y-1 hover:scale-[1.02] active:scale-95 transition-all shadow-2xs min-h-[76px] flex flex-col items-center justify-center`}
                >
                  <Icon className={`w-5 h-5 ${item.text}`} />
                  <span className="text-[11px] font-black text-slate-800 dark:text-slate-100 block leading-tight">
                    {item.title}
                  </span>
                  <span className="text-[9px] text-slate-400 font-medium block leading-none">
                    {item.sub}
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      {/* ── 6. PENDING APPROVAL SECTION ── */}
      <div className="space-y-2">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-xs font-black uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-amber-500" />
            <span>Pengajuan Menunggu Persetujuan</span>
          </h3>

          <Link href="/pic/inspections?status=pending">
            <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline">
              Lihat Semua →
            </span>
          </Link>
        </div>

        {pendingInspections.length === 0 ? (
          <Card className="rounded-2xl border-slate-200 dark:border-slate-800">
            <CardContent className="p-4 text-center text-xs text-slate-500 font-medium">
              Tidak ada pengajuan yang sedang menunggu persetujuan.
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {pendingInspections.map((ins) => (
              <Card
                key={ins.id}
                className="rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-indigo-200 transition-all shadow-xs"
              >
                <CardContent className="p-3 flex items-center justify-between gap-2">
                  <div className="space-y-0.5 min-w-0">
                    <span className="font-mono font-black text-xs text-indigo-600 dark:text-indigo-400 block truncate">
                      {ins.tablet?.qr_code || "QR-TAB-001"}
                    </span>
                    <span className="text-[11px] font-semibold text-slate-800 dark:text-slate-200 block truncate">
                      {ins.tablet?.brand} {ins.tablet?.model || "Galaxy Tab Active 3"}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono block">
                      Waktu Kirim:{" "}
                      {new Date(ins.submitted_at).toLocaleTimeString("id-ID", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>

                  <div className="shrink-0 text-right">
                    <StatusBadge status={ins.status} className="text-[9px]" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* ── 7. TODAY ACTIVITY SECTION (TIMELINE) ── */}
      <div className="space-y-2">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-xs font-black uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
            <Activity className="w-3.5 h-3.5 text-indigo-500" />
            <span>Aktivitas Hari Ini</span>
          </h3>
        </div>

        <Card className="rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <CardContent className="p-3.5 space-y-3">
            {!stats?.recentInspections || stats.recentInspections.length === 0 ? (
              <p className="text-xs text-slate-500 text-center py-2">
                Belum ada aktivitas inspeksi hari ini.
              </p>
            ) : (
              stats.recentInspections.slice(0, 5).map((ins, idx, arr) => {
                const isApproved = ins.status === "approved";
                const isRejected = ins.status === "rejected";

                return (
                  <div key={ins.id} className="relative flex items-start gap-3 text-xs">
                    {/* Vertical Connecting Line */}
                    {idx < arr.length - 1 && (
                      <span className="absolute left-2.5 top-6 bottom-0 w-[1.5px] bg-slate-200 dark:bg-slate-800" />
                    )}

                    {/* Timeline Node Icon */}
                    <div
                      className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 z-10 ${
                        isApproved
                          ? "bg-emerald-100 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400"
                          : isRejected
                          ? "bg-rose-100 text-rose-600 dark:bg-rose-950 dark:text-rose-400"
                          : "bg-amber-100 text-amber-600 dark:bg-amber-950 dark:text-amber-400"
                      }`}
                    >
                      {isApproved ? (
                        <CheckCircle2 className="w-3.5 h-3.5" />
                      ) : isRejected ? (
                        <XCircle className="w-3.5 h-3.5" />
                      ) : (
                        <span className="w-2 h-2 rounded-full bg-amber-500" />
                      )}
                    </div>

                    {/* Activity Content */}
                    <div className="flex-1 min-w-0 flex items-center justify-between gap-2">
                      <div>
                        <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400 mr-1.5">
                          {ins.tablet?.qr_code || "TAB-001"}
                        </span>
                        <span className="text-slate-700 dark:text-slate-300 font-semibold">
                          {isApproved
                            ? "Inspeksi Disetujui"
                            : isRejected
                            ? "Inspeksi Perlu Perbaikan"
                            : "Menunggu Persetujuan"}
                        </span>
                      </div>
                      <span className="text-[10px] font-mono text-slate-400 shrink-0">
                        {new Date(ins.submitted_at).toLocaleTimeString("id-ID", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
