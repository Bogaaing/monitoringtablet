"use client";

import React, { useState, useEffect } from "react";
import { periodsService } from "@/services/periods.service";
import { authService } from "@/services/auth.service";
import { tabletsService } from "@/services/tablets.service";
import { inspectionsService, Inspection } from "@/services/inspections.service";
import { User, InspectionPeriod } from "@/types";
import { InstallAppCard } from "@/components/pic/install-app-card";
import {
  QrCode,
  Calendar,
  ClipboardList,
  Clock,
  CheckCircle2,
  XCircle,
  Tablet as TabletIcon,
  MapPin,
  ChevronRight,
  Sparkles,
  ArrowRight,
  Battery,
  AlertTriangle,
  X,
  FileText,
} from "lucide-react";
import Link from "next/link";

export default function PicDashboardPage() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [activePeriod, setActivePeriod] = useState<InspectionPeriod | null>(null);
  const [inspectionsList, setInspectionsList] = useState<Inspection[]>([]);
  const [assignedTabletsCount, setAssignedTabletsCount] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [selectedInspection, setSelectedInspection] = useState<Inspection | null>(null);

  useEffect(() => {
    Promise.all([
      authService.getCurrentProfile(),
      periodsService.getActivePeriod(),
    ]).then(async ([u, p]) => {
      setCurrentUser(u);
      setActivePeriod(p);

      try {
        const userLocId = u?.location_id || u?.location?.id;
        const userLocName = u?.location?.name?.trim().toLowerCase();

        const tabRes = await tabletsService.getTablets({
          locationId: userLocId || undefined,
          limit: 500,
        });
        const inspRes = await inspectionsService.getInspections({
          periodId: p?.id,
          limit: 500,
        });

        const rawInspections = inspRes.data || [];

        // Filter inspections strictly matching the logged in user's assigned location
        const filteredInspections = (userLocId || userLocName)
          ? rawInspections.filter((ins) => {
              const tabLocId = ins.tablet?.location_id || ins.tablet?.location?.id;
              const tabLocName = ins.tablet?.location?.name?.trim().toLowerCase();
              const matchId = userLocId && tabLocId && userLocId === tabLocId;
              const matchName = userLocName && tabLocName && userLocName === tabLocName;
              const matchPic = ins.pic_id && u?.id && ins.pic_id === u.id;
              return Boolean(matchId || matchName || matchPic);
            })
          : rawInspections;

        setAssignedTabletsCount(tabRes.data.length || 0);
        setInspectionsList(filteredInspections);
      } catch (e) {
        console.error("Dashboard data load error:", e);
      } finally {
        setLoading(false);
      }
    });
  }, []);

  // Compute Live Statistics
  const totalTablets = assignedTabletsCount > 0 ? assignedTabletsCount : Math.max(inspectionsList.length, 5);
  const completedCount = inspectionsList.filter((i) => i.status === "approved" || i.status === "completed").length;
  const pendingCount = inspectionsList.filter((i) => i.status === "pending" || i.status === "submitted").length;
  const needRepairCount = inspectionsList.filter((i) => i.status === "rejected").length;
  const progressPct = totalTablets > 0 ? Math.min(100, Math.round((completedCount / totalTablets) * 100)) : 0;

  const pendingInspections = inspectionsList
    .filter((i) => i.status === "pending" || i.status === "submitted")
    .slice(0, 3);

  const recentInspections = inspectionsList.slice(0, 4);

  // Status Badge Helper matching modern system
  const renderStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
      case "submitted":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#FEF3C7] text-[#B45309] text-[10px] font-bold border border-amber-200/60">
            <Clock className="w-3 h-3 text-[#D97706]" />
            <span>Pending Review</span>
          </span>
        );
      case "approved":
      case "completed":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#D1FAE5] text-[#047857] text-[10px] font-bold border border-emerald-200/60">
            <CheckCircle2 className="w-3 h-3 text-[#059669]" />
            <span>Selesai</span>
          </span>
        );
      case "rejected":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#FFE4E6] text-[#BE123C] text-[10px] font-bold border border-rose-200/60">
            <XCircle className="w-3 h-3 text-[#E11D48]" />
            <span>Ditolak</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[10px] font-bold">
            <span>{status}</span>
          </span>
        );
    }
  };

  return (
    <div className="space-y-4 animate-in fade-in pb-10 select-none">
      {/* ─── 1. HERO GREETING & ACTIVE PERIOD BANNER ─── */}
      <div className="bg-white dark:bg-slate-800/90 rounded-3xl p-4 sm:p-5 border border-slate-100 dark:border-slate-800 shadow-[0_2px_12px_rgba(0,0,0,0.03)] space-y-3">
        <div className="flex items-center justify-between gap-2">
          <div>
            <span className="text-[11px] font-bold text-[#3842E2] dark:text-indigo-400 uppercase tracking-wider block">
              Selamat Bertugas
            </span>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight leading-tight mt-0.5">
              {currentUser?.name || "Joko Maryono"}
            </h1>
          </div>

          <div className="px-3 py-1.5 rounded-2xl bg-[#EEF2FF] dark:bg-indigo-950/60 border border-indigo-100 dark:border-indigo-900/50 text-right shrink-0">
            <span className="text-[9px] font-bold text-slate-400 block uppercase tracking-wider leading-none">
              Periode
            </span>
            <span className="text-xs font-black text-[#3842E2] dark:text-indigo-300 block mt-0.5">
              {activePeriod?.name || "Agustus 2026"}
            </span>
          </div>
        </div>

        <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
          Pantau dan laporkan kondisi fisik tablet di area <strong className="text-slate-700 dark:text-slate-200">{currentUser?.location?.name || "Politur"}</strong>.
        </p>
      </div>

      {/* ─── 1.5 PWA INSTALL BANNER (If not installed) ─── */}
      <InstallAppCard />

      {/* ─── 2. PROGRESS INSPEKSI BULANAN (HERO KPI CARD) ─── */}
      <div className="bg-white dark:bg-slate-800/90 rounded-3xl p-5 border border-slate-100 dark:border-slate-800 shadow-[0_2px_12px_rgba(0,0,0,0.03)] space-y-4">
        {/* Header Title + Percentage */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-black text-slate-900 dark:text-slate-100">
              Progres Inspeksi Periode Ini
            </h2>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Target bulanan area penugasan
            </p>
          </div>
          <div className="text-right">
            <span className="text-2xl font-black text-[#3842E2] dark:text-indigo-400 font-mono leading-none">
              {progressPct}%
            </span>
            <span className="text-[10px] text-slate-400 font-bold block mt-0.5">
              Tercapai
            </span>
          </div>
        </div>

        {/* Segmented Progress Bar */}
        <div className="w-full bg-slate-100 dark:bg-slate-700/60 h-2.5 rounded-full overflow-hidden flex">
          <div
            className="bg-emerald-500 h-full transition-all duration-700 rounded-l-full"
            style={{ width: `${(completedCount / totalTablets) * 100}%` }}
            title="Selesai"
          />
          <div
            className="bg-amber-500 h-full transition-all duration-700"
            style={{ width: `${(pendingCount / totalTablets) * 100}%` }}
            title="Pending"
          />
          <div
            className="bg-rose-500 h-full transition-all duration-700 rounded-r-full"
            style={{ width: `${(needRepairCount / totalTablets) * 100}%` }}
            title="Perlu Perbaikan"
          />
        </div>

        {/* 4 Clean Metric Tiles (2x2 Grid with Generous Spacing) */}
        <div className="grid grid-cols-2 gap-2.5 pt-1">
          {/* Tile 1: Total Target */}
          <div className="p-3 rounded-2xl bg-[#F8FAFC] dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Total Target
              </span>
              <span className="text-base font-black text-slate-900 dark:text-slate-100 font-mono mt-0.5 block">
                {totalTablets} <span className="text-xs font-semibold text-slate-500 font-sans">Unit</span>
              </span>
            </div>
            <div className="w-8 h-8 rounded-xl bg-indigo-50 text-[#3842E2] flex items-center justify-center shrink-0">
              <TabletIcon className="w-4 h-4" />
            </div>
          </div>

          {/* Tile 2: Selesai (Approved) */}
          <div className="p-3 rounded-2xl bg-[#F0FDF4] dark:bg-emerald-950/30 border border-emerald-100/80 dark:border-emerald-900/40 flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider block">
                Selesai
              </span>
              <span className="text-base font-black text-[#047857] dark:text-emerald-300 font-mono mt-0.5 block">
                {completedCount} <span className="text-xs font-semibold text-emerald-600 font-sans">Unit</span>
              </span>
            </div>
            <div className="w-8 h-8 rounded-xl bg-emerald-100 text-[#059669] flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>

          {/* Tile 3: Pending Review */}
          <div className="p-3 rounded-2xl bg-[#FFFBEB] dark:bg-amber-950/30 border border-amber-100/80 dark:border-amber-900/40 flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wider block">
                Pending
              </span>
              <span className="text-base font-black text-[#B45309] dark:text-amber-300 font-mono mt-0.5 block">
                {pendingCount} <span className="text-xs font-semibold text-amber-600 font-sans">Unit</span>
              </span>
            </div>
            <div className="w-8 h-8 rounded-xl bg-amber-100 text-[#D97706] flex items-center justify-center shrink-0">
              <Clock className="w-4 h-4" />
            </div>
          </div>

          {/* Tile 4: Perlu Servis (Rejected) */}
          <div className="p-3 rounded-2xl bg-[#FFF1F2] dark:bg-rose-950/30 border border-rose-100/80 dark:border-rose-900/40 flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold text-rose-700 dark:text-rose-400 uppercase tracking-wider block">
                Perlu Servis
              </span>
              <span className="text-base font-black text-[#BE123C] dark:text-rose-300 font-mono mt-0.5 block">
                {needRepairCount} <span className="text-xs font-semibold text-rose-600 font-sans">Unit</span>
              </span>
            </div>
            <div className="w-8 h-8 rounded-xl bg-rose-100 text-[#E11D48] flex items-center justify-center shrink-0">
              <XCircle className="w-4 h-4" />
            </div>
          </div>
        </div>
      </div>

      {/* ─── 3. PRIMARY ACTION BUTTONS (CLEAN 2-HERO TILES) ─── */}
      <div className="grid grid-cols-2 gap-3">
        {/* Primary Scan Button */}
        <Link href="/pic/scan" className="block">
          <div className="p-4 rounded-3xl bg-gradient-to-tr from-[#3842E2] to-[#6366F1] text-white shadow-md shadow-indigo-500/20 active:scale-[0.98] transition-all flex flex-col justify-between h-28">
            <div className="w-9 h-9 rounded-2xl bg-white/20 backdrop-blur-xs flex items-center justify-center">
              <QrCode className="w-5 h-5 text-white stroke-[2.2]" />
            </div>
            <div>
              <span className="text-sm font-black block leading-tight">
                Scan QR Code
              </span>
              <span className="text-[10px] text-white/80 font-medium block mt-0.5">
                Mulai inspeksi unit
              </span>
            </div>
          </div>
        </Link>

        {/* Secondary Task List Button */}
        <Link href="/pic/tasks" className="block">
          <div className="p-4 rounded-3xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-800 shadow-[0_2px_12px_rgba(0,0,0,0.03)] hover:border-indigo-100 dark:hover:border-indigo-900/50 active:scale-[0.98] transition-all flex flex-col justify-between h-28">
            <div className="w-9 h-9 rounded-2xl bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400 flex items-center justify-center">
              <ClipboardList className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div>
              <span className="text-sm font-black text-slate-900 dark:text-slate-100 block leading-tight">
                Daftar Tugas
              </span>
              <span className="text-[10px] text-slate-400 font-medium block mt-0.5">
                Lihat daftar tablet
              </span>
            </div>
          </div>
        </Link>
      </div>

      {/* ─── 4. PENDING APPROVAL SECTION ─── */}
      <div className="space-y-2.5 pt-1">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-[#D97706]" />
            <span>Menunggu Persetujuan Manager</span>
          </h3>
          <Link href="/pic/inspections?status=pending">
            <span className="text-xs font-bold text-[#3842E2] dark:text-indigo-400 flex items-center gap-0.5 hover:underline">
              <span>Semua</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </span>
          </Link>
        </div>

        {pendingInspections.length === 0 ? (
          <div className="p-4 rounded-3xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-800 text-center text-xs text-slate-400 py-6">
            Tidak ada pengajuan yang sedang menunggu persetujuan.
          </div>
        ) : (
          <div className="space-y-2.5">
            {pendingInspections.map((ins) => (
              <div
                key={ins.id}
                onClick={() => setSelectedInspection(ins)}
                className="bg-white dark:bg-slate-800/90 rounded-3xl p-4 border border-slate-100 dark:border-slate-800 shadow-[0_2px_12px_rgba(0,0,0,0.03)] hover:border-indigo-100 dark:hover:border-indigo-900/50 transition-all cursor-pointer flex items-center justify-between gap-3 active:scale-[0.99]"
              >
                <div className="w-12 h-12 rounded-2xl bg-[#EEF2FF] dark:bg-indigo-950/60 text-[#3842E2] dark:text-indigo-400 flex items-center justify-center shrink-0 border border-indigo-100/60 dark:border-indigo-900/40">
                  <TabletIcon className="w-6 h-6 stroke-[1.8]" />
                </div>

                <div className="flex-1 min-w-0 space-y-0.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-base font-black text-[#3842E2] dark:text-indigo-400 leading-tight truncate">
                      {ins.tablet?.qr_code || "TB 10"}
                    </span>
                    <div className="shrink-0">
                      {renderStatusBadge(ins.status)}
                    </div>
                  </div>
                  <div className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    {ins.tablet?.model || "P9000"} • {ins.tablet?.brand || "Exproof"}
                  </div>
                  <div className="text-[11px] text-slate-400 flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-[#3842E2]" />
                    <span>{ins.tablet?.location?.name || "Politur"}</span>
                  </div>
                </div>

                <ChevronRight className="w-5 h-5 text-slate-400 shrink-0" />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ─── 5. RECENT INSPECTION ACTIVITY ─── */}
      <div className="space-y-2.5 pt-1">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-[#3842E2]" />
            <span>Aktivitas Inspeksi Terbaru</span>
          </h3>
          <Link href="/pic/inspections">
            <span className="text-xs font-bold text-[#3842E2] dark:text-indigo-400 flex items-center gap-0.5 hover:underline">
              <span>Riwayat</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </span>
          </Link>
        </div>

        {recentInspections.length === 0 ? (
          <div className="p-4 rounded-3xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-800 text-center text-xs text-slate-400 py-6">
            Belum ada aktivitas inspeksi pada periode ini.
          </div>
        ) : (
          <div className="space-y-2.5">
            {recentInspections.map((ins) => (
              <div
                key={ins.id}
                onClick={() => setSelectedInspection(ins)}
                className="bg-white dark:bg-slate-800/90 rounded-3xl p-4 border border-slate-100 dark:border-slate-800 shadow-[0_2px_12px_rgba(0,0,0,0.03)] hover:border-indigo-100 dark:hover:border-indigo-900/50 transition-all cursor-pointer flex items-center justify-between gap-3 active:scale-[0.99]"
              >
                <div className="w-12 h-12 rounded-2xl bg-[#EEF2FF] dark:bg-indigo-950/60 text-[#3842E2] dark:text-indigo-400 flex items-center justify-center shrink-0 border border-indigo-100/60 dark:border-indigo-900/40">
                  <TabletIcon className="w-6 h-6 stroke-[1.8]" />
                </div>

                <div className="flex-1 min-w-0 space-y-0.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-base font-black text-[#3842E2] dark:text-indigo-400 leading-tight truncate">
                      {ins.tablet?.qr_code || "TB 04"}
                    </span>
                    <div className="shrink-0">
                      {renderStatusBadge(ins.status)}
                    </div>
                  </div>
                  <div className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    {ins.tablet?.model || "P9000"} • {ins.tablet?.brand || "Exproof"}
                  </div>
                  <div className="text-[11px] text-slate-400 flex items-center gap-1">
                    <Clock className="w-3 h-3 text-[#3842E2]" />
                    <span>
                      {new Date(ins.submitted_at).toLocaleTimeString("id-ID", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                      {" • "}
                      {ins.tablet?.location?.name || "Politur"}
                    </span>
                  </div>
                </div>

                <ChevronRight className="w-5 h-5 text-slate-400 shrink-0" />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ─── Detail Inspection Modal ─── */}
      {selectedInspection && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-t-3xl sm:rounded-3xl border-t sm:border border-slate-200 dark:border-slate-800 shadow-2xl max-w-md w-full p-5 space-y-4 relative max-h-[88vh] overflow-y-auto animate-in slide-in-from-bottom duration-200">
            <div className="w-12 h-1.5 bg-slate-300 dark:bg-slate-700 rounded-full mx-auto sm:hidden" />

            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3 pt-1">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-950 text-[#3842E2] flex items-center justify-center">
                  <TabletIcon className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900 dark:text-slate-100 leading-tight">
                    {selectedInspection.tablet?.qr_code}
                  </h3>
                  <p className="text-[11px] text-slate-500">Detail Hasil Inspeksi</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedInspection(null)}
                className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-700 flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
                  Status Review
                </span>
                <div className="mt-1">
                  {renderStatusBadge(selectedInspection.status)}
                </div>
              </div>
              <div className="text-right">
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
                  Baterai
                </span>
                <span className="text-sm font-black text-emerald-600 dark:text-emerald-400 flex items-center justify-end gap-1 mt-1">
                  <Battery className="w-4 h-4" />
                  <span>{selectedInspection.battery_pct || 85}%</span>
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2.5 text-xs">
              <div className="p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700/60 space-y-0.5">
                <span className="text-slate-400 text-[10px] font-medium">Model / Merk</span>
                <p className="font-bold text-slate-800 dark:text-slate-200">
                  {selectedInspection.tablet?.model || "P9000"} ({selectedInspection.tablet?.brand || "Exproof"})
                </p>
              </div>

              <div className="p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700/60 space-y-0.5">
                <span className="text-slate-400 text-[10px] font-medium">Serial Number</span>
                <p className="font-mono font-bold text-slate-800 dark:text-slate-200 truncate">
                  {selectedInspection.tablet?.serial_number || "-"}
                </p>
              </div>

              <div className="p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700/60 space-y-0.5">
                <span className="text-slate-400 text-[10px] font-medium">Lokasi</span>
                <p className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-[#3842E2]" />
                  <span>{selectedInspection.tablet?.location?.name || "Politur"}</span>
                </p>
              </div>

              <div className="p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700/60 space-y-0.5">
                <span className="text-slate-400 text-[10px] font-medium">Waktu Kirim</span>
                <p className="font-bold text-slate-800 dark:text-slate-200">
                  {new Date(selectedInspection.submitted_at).toLocaleTimeString("id-ID", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>
            </div>

            {selectedInspection.notes && (
              <div className="space-y-1 text-xs">
                <span className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                  <FileText className="w-3.5 h-3.5 text-[#3842E2]" />
                  <span>Catatan PIC:</span>
                </span>
                <p className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 text-xs">
                  {selectedInspection.notes}
                </p>
              </div>
            )}

            <div className="pt-2">
              <button
                onClick={() => setSelectedInspection(null)}
                className="w-full py-3 bg-[#3842E2] hover:bg-indigo-700 text-white font-bold text-xs rounded-2xl shadow-xs transition-colors"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
