"use client";

import React, { useState, useEffect } from "react";
import { StatusBadge } from "@/components/shared/status-badge";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { periodsService } from "@/services/periods.service";
import { authService } from "@/services/auth.service";
import { tabletsService } from "@/services/tablets.service";
import { inspectionsService, Inspection } from "@/services/inspections.service";
import { User, InspectionPeriod } from "@/types";
import { InstallAppCard } from "@/components/pic/install-app-card";
import {
  QrCode,
  ArrowRight,
  Calendar,
  ClipboardList,
  Clock,
  BarChart3,
  CheckCircle2,
  XCircle,
  ChevronRight,
  Sparkles,
  Activity,
} from "lucide-react";
import Link from "next/link";

export default function PicDashboardPage() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [activePeriod, setActivePeriod] = useState<InspectionPeriod | null>(null);
  const [inspectionsList, setInspectionsList] = useState<Inspection[]>([]);
  const [assignedTabletsCount, setAssignedTabletsCount] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      authService.getCurrentProfile(),
      periodsService.getActivePeriod(),
    ]).then(async ([u, p]) => {
      setCurrentUser(u);
      setActivePeriod(p);

      try {
        let tabRes = await tabletsService.getTablets({ locationId: u?.location_id || undefined, limit: 500 });
        if ((!tabRes.data || tabRes.data.length === 0) && u?.location_id) {
          tabRes = await tabletsService.getTablets({ limit: 500 });
        }
        const inspRes = await inspectionsService.getInspections({ periodId: p?.id, limit: 500 });

        setAssignedTabletsCount(tabRes.data.length || 0);
        setInspectionsList(inspRes.data || []);
      } catch (e) {
        console.error("Dashboard data load error:", e);
      } finally {
        setLoading(false);
      }
    });
  }, []);

  // Compute Live Statistics from Supabase
  const totalTablets = assignedTabletsCount > 0 ? assignedTabletsCount : Math.max(inspectionsList.length, 1);
  const completedCount = inspectionsList.filter((i) => i.status === "approved").length;
  const pendingCount = inspectionsList.filter((i) => i.status === "pending").length;
  const needRepairCount = inspectionsList.filter((i) => i.status === "rejected").length;
  const remainingCount = Math.max(0, totalTablets - (completedCount + pendingCount + needRepairCount));
  const progressPct = totalTablets > 0 ? Math.min(100, Math.round((completedCount / totalTablets) * 100)) : 0;

  const pendingInspections = inspectionsList.filter((i) => i.status === "pending").slice(0, 3);

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

      {/* ── 1.5 CUSTOM INSTALL APP CARD (PWA) ── */}
      <InstallAppCard />

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

      {/* ── 3. PROGRES INSPEKSI BULANAN CARD ── */}
      <Card className="border-slate-200 dark:border-slate-800 shadow-sm rounded-2xl overflow-hidden">
        <CardContent className="p-4 space-y-3.5">
          {/* Header Row */}
          <div className="flex items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-2.5">
            <div>
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                <BarChart3 className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                <span>Progres Inspeksi Bulanan</span>
              </h3>
              <span className="text-[10px] text-slate-500 font-semibold block mt-0.5">
                Periode: <strong className="text-indigo-600 dark:text-indigo-400">{activePeriod?.name || "Agustus 2026"}</strong>
              </span>
            </div>

            <Link href="/pic/tasks">
              <span className="text-[11px] font-extrabold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-0.5 shrink-0 bg-indigo-50 dark:bg-indigo-950/50 px-2 py-1 rounded-lg border border-indigo-100 dark:border-indigo-900/50">
                Lihat Detail <ChevronRight className="w-3.5 h-3.5" />
              </span>
            </Link>
          </div>

          {/* Center Circular Progress + 5 Color-Coded Stats */}
          <div className="flex items-center gap-3">
            {/* Circular Progress Gauge (Blue/Indigo) */}
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
                <span className="text-xs font-black text-indigo-600 dark:text-indigo-400 leading-none">
                  {progressPct}%
                </span>
                <span className="text-[8px] text-slate-400 font-semibold leading-none mt-0.5">
                  Progres
                </span>
              </div>
            </div>

            {/* 5 Color-Coded Stats Grid */}
            <div className="grid grid-cols-2 gap-1.5 flex-1 text-[10px]">
              {/* Total Tablet (Blue/Indigo) */}
              <div className="p-1.5 rounded-xl bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/40 flex items-center justify-between">
                <span className="text-slate-600 dark:text-slate-400 font-semibold">Total Tablet</span>
                <span className="font-black text-indigo-600 dark:text-indigo-400 font-mono text-xs">{loading ? "·" : `${totalTablets} Unit`}</span>
              </div>

              {/* Completed (Green) */}
              <div className="p-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-100 dark:border-emerald-900/40 flex items-center justify-between">
                <span className="text-emerald-700 dark:text-emerald-300 font-semibold">Completed</span>
                <span className="font-black text-emerald-700 dark:text-emerald-300 font-mono text-xs">{loading ? "·" : `${completedCount} Unit`}</span>
              </div>

              {/* Pending Approval (Orange) */}
              <div className="p-1.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-100 dark:border-amber-900/40 flex items-center justify-between">
                <span className="text-amber-700 dark:text-amber-300 font-semibold">Pending</span>
                <span className="font-black text-amber-700 dark:text-amber-300 font-mono text-xs">{loading ? "·" : `${pendingCount} Unit`}</span>
              </div>

              {/* Need Repair (Red) */}
              <div className="p-1.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-100 dark:border-rose-900/40 flex items-center justify-between">
                <span className="text-rose-700 dark:text-rose-300 font-semibold">Need Repair</span>
                <span className="font-black text-rose-700 dark:text-rose-300 font-mono text-xs">{loading ? "·" : `${needRepairCount} Unit`}</span>
              </div>

              {/* Remaining (Gray) */}
              <div className="col-span-2 p-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-between">
                <span className="text-slate-600 dark:text-slate-400 font-semibold">Remaining</span>
                <span className="font-black text-slate-700 dark:text-slate-300 font-mono text-xs">{loading ? "·" : `${remainingCount} Unit`}</span>
              </div>
            </div>
          </div>

          {/* Helper Message Text */}
          <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 text-[11px] text-slate-600 dark:text-slate-300 font-medium flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-500 shrink-0" />
            <span>
              {completedCount > 0
                ? `${completedCount} dari ${totalTablets} tablet telah berhasil diperiksa.`
                : `Masih tersisa ${remainingCount} tablet untuk menyelesaikan inspeksi periode ${activePeriod?.name || "Agustus 2026"}.`}
            </span>
          </div>

          {/* Multi-Color Segmented Progress Bar */}
          <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden flex">
            {totalTablets > 0 && (
              <>
                <div
                  className="h-full bg-emerald-500 transition-all duration-500"
                  style={{ width: `${(completedCount / totalTablets) * 100}%` }}
                  title="Completed"
                />
                <div
                  className="h-full bg-amber-500 transition-all duration-500"
                  style={{ width: `${(pendingCount / totalTablets) * 100}%` }}
                  title="Pending Approval"
                />
                <div
                  className="h-full bg-rose-500 transition-all duration-500"
                  style={{ width: `${(needRepairCount / totalTablets) * 100}%` }}
                  title="Need Repair"
                />
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* ── 4. QUICK ACTIONS GRID ── */}
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

      {/* ── 5. PENDING APPROVAL SECTION ── */}
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

      {/* ── 6. TODAY ACTIVITY SECTION (TIMELINE) ── */}
      <div className="space-y-2">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-xs font-black uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
            <Activity className="w-3.5 h-3.5 text-indigo-500" />
            <span>Aktivitas Hari Ini</span>
          </h3>
        </div>

        <Card className="rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <CardContent className="p-3.5 space-y-3">
            {inspectionsList.length === 0 ? (
              <p className="text-xs text-slate-500 text-center py-2">
                Belum ada aktivitas inspeksi hari ini.
              </p>
            ) : (
              inspectionsList.slice(0, 5).map((ins, idx, arr) => {
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
