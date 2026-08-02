"use client";

import React, { useState, useEffect, useCallback } from "react";
import { authService } from "@/services/auth.service";
import { tabletsService } from "@/services/tablets.service";
import { periodsService } from "@/services/periods.service";
import { inspectionsService, Inspection } from "@/services/inspections.service";
import { User, Tablet, InspectionPeriod } from "@/types";
import {
  ClipboardList,
  Search,
  QrCode,
  CheckCircle2,
  Clock,
  AlertCircle,
  Hourglass,
  Wrench,
  MapPin,
  ArrowUpDown,
  SlidersHorizontal,
  RefreshCw,
  PartyPopper,
} from "lucide-react";
import { useRouter } from "next/navigation";

// ─── Types ────────────────────────────────────────────────────────────────────
type TaskStatus =
  | "belum_diperiksa"
  | "sedang_diproses"
  | "menunggu_approval"
  | "disetujui"
  | "perlu_perbaikan";

type SortKey = "qr_code" | "priority" | "latest" | "oldest";
type FilterKey = "all" | "belum_diperiksa" | "menunggu_approval" | "selesai";

interface TaskItem {
  tablet: Tablet;
  status: TaskStatus;
  inspection?: Inspection;
  lastInspectionDate?: string | null;
  priority: "High" | "Normal" | "Low";
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function resolveTaskStatus(inspection?: Inspection): TaskStatus {
  if (!inspection) return "belum_diperiksa";
  if (inspection.status === "approved") return "disetujui";
  if (inspection.status === "rejected") return "perlu_perbaikan";
  if (inspection.status === "pending") return "menunggu_approval";
  return "sedang_diproses";
}

function statusConfig(status: TaskStatus) {
  switch (status) {
    case "belum_diperiksa":
      return {
        label: "Belum Diperiksa",
        bg: "bg-slate-100 dark:bg-slate-800",
        text: "text-slate-600 dark:text-slate-300",
        dot: "bg-slate-400",
        icon: Clock,
      };
    case "sedang_diproses":
      return {
        label: "Sedang Diproses",
        bg: "bg-blue-50 dark:bg-blue-950/50",
        text: "text-blue-700 dark:text-blue-300",
        dot: "bg-blue-500",
        icon: Hourglass,
      };
    case "menunggu_approval":
      return {
        label: "Menunggu Approval",
        bg: "bg-amber-50 dark:bg-amber-950/50",
        text: "text-amber-700 dark:text-amber-300",
        dot: "bg-amber-500",
        icon: AlertCircle,
      };
    case "disetujui":
      return {
        label: "Disetujui",
        bg: "bg-emerald-50 dark:bg-emerald-950/50",
        text: "text-emerald-700 dark:text-emerald-300",
        dot: "bg-emerald-500",
        icon: CheckCircle2,
      };
    case "perlu_perbaikan":
      return {
        label: "Perlu Perbaikan",
        bg: "bg-rose-50 dark:bg-rose-950/50",
        text: "text-rose-700 dark:text-rose-300",
        dot: "bg-rose-500",
        icon: Wrench,
      };
  }
}

function StatusBadge({ status }: { status: TaskStatus }) {
  const cfg = statusConfig(status);
  const Icon = cfg.icon;
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border border-transparent ${cfg.bg} ${cfg.text}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      {cfg.label}
    </span>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function PicTasksPage() {
  const router = useRouter();
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<FilterKey>("all");
  const [sort, setSort] = useState<SortKey>("qr_code");
  const [showSortMenu, setShowSortMenu] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [activePeriod, setActivePeriod] = useState<InspectionPeriod | null>(null);

  // ─── Load user + period ───────────────────────────────────────────────────
  useEffect(() => {
    Promise.all([authService.getCurrentProfile(), periodsService.getActivePeriod()]).then(
      ([u, p]) => {
        setCurrentUser(u);
        setActivePeriod(p);
      }
    );
  }, []);

  // ─── Load tasks ───────────────────────────────────────────────────────────
  const loadTasks = useCallback(async () => {
    if (!currentUser) return;
    setLoading(true);
    try {
      const locationId = currentUser.location_id || undefined;

      // Load tablets at PIC's location
      const tabletsRes = await tabletsService.getTablets({
        locationId,
        limit: 200,
      });
      const tablets = tabletsRes.data;

      // Load inspections for active period
      let inspections: Inspection[] = [];
      if (activePeriod) {
        const inspRes = await inspectionsService.getInspections({
          periodId: activePeriod.id,
          limit: 200,
        });
        inspections = inspRes.data;
      }

      // Map each tablet → task
      const taskItems: TaskItem[] = tablets.map((tablet) => {
        const ins = inspections.find((i) => i.tablet_id === tablet.id);
        return {
          tablet,
          status: resolveTaskStatus(ins),
          inspection: ins,
          lastInspectionDate: ins?.submitted_at ?? null,
          priority: "Normal",
        };
      });

      setTasks(taskItems);
    } catch (e) {
      console.error("loadTasks error", e);
    } finally {
      setLoading(false);
    }
  }, [currentUser, activePeriod]);

  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  // ─── Derived list ─────────────────────────────────────────────────────────
  const filtered = tasks
    .filter((t) => {
      // filter tab
      if (filter === "belum_diperiksa") return t.status === "belum_diperiksa";
      if (filter === "menunggu_approval") return t.status === "menunggu_approval";
      if (filter === "selesai") return t.status === "disetujui";
      return true;
    })
    .filter((t) => {
      if (!search) return true;
      const s = search.toLowerCase();
      return (
        t.tablet.qr_code?.toLowerCase().includes(s) ||
        t.tablet.model?.toLowerCase().includes(s) ||
        t.tablet.brand?.toLowerCase().includes(s)
      );
    })
    .sort((a, b) => {
      if (sort === "qr_code") return a.tablet.qr_code.localeCompare(b.tablet.qr_code);
      if (sort === "latest")
        return (
          new Date(b.lastInspectionDate || 0).getTime() -
          new Date(a.lastInspectionDate || 0).getTime()
        );
      if (sort === "oldest")
        return (
          new Date(a.lastInspectionDate || 0).getTime() -
          new Date(b.lastInspectionDate || 0).getTime()
        );
      return a.tablet.qr_code.localeCompare(b.tablet.qr_code);
    });

  // ─── Summary KPIs ─────────────────────────────────────────────────────────
  const total = tasks.length;
  const completed = tasks.filter((t) => t.status === "disetujui").length;
  const remaining = tasks.filter((t) => t.status === "belum_diperiksa").length;
  const pendingApproval = tasks.filter((t) => t.status === "menunggu_approval").length;
  const allDone = total > 0 && remaining === 0;

  const FILTER_TABS: { key: FilterKey; label: string; count: number }[] = [
    { key: "all", label: "Semua", count: total },
    { key: "belum_diperiksa", label: "Belum Diperiksa", count: remaining },
    { key: "menunggu_approval", label: "Menunggu Approval", count: pendingApproval },
    { key: "selesai", label: "Selesai", count: completed },
  ];

  const SORT_OPTIONS: { key: SortKey; label: string }[] = [
    { key: "qr_code", label: "Kode Tablet (A-Z)" },
    { key: "priority", label: "Prioritas" },
    { key: "latest", label: "Terbaru" },
    { key: "oldest", label: "Terlama" },
  ];

  // ─── Start Inspection ─────────────────────────────────────────────────────
  const handleStartInspection = (qrCode: string) => {
    router.push(`/pic/scan?qr=${encodeURIComponent(qrCode)}`);
  };

  return (
    <div className="space-y-4 animate-in fade-in pb-2">
      {/* ── Page Header ── */}
      <div className="space-y-0.5">
        <div className="flex items-center gap-2">
          <ClipboardList className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
          <h1 className="text-base font-black text-slate-900 dark:text-slate-100">
            Tugas Inspeksi
          </h1>
          <button
            onClick={loadTasks}
            disabled={loading}
            className="ml-auto p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 active:scale-95 transition-all"
            title="Muat ulang"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
        <p className="text-[11px] text-slate-500 dark:text-slate-400">
          {activePeriod
            ? `Periode: ${activePeriod.name} · ${currentUser?.location?.name || "Semua Lokasi"}`
            : "Daftar tablet yang harus diperiksa pada periode aktif."}
        </p>
      </div>

      {/* ── Summary KPIs ── */}
      <div className="grid grid-cols-4 gap-1.5">
        {[
          { label: "Total", value: total, color: "text-slate-700 dark:text-slate-200", bg: "bg-slate-50 dark:bg-slate-800" },
          { label: "Selesai", value: completed, color: "text-emerald-700 dark:text-emerald-300", bg: "bg-emerald-50 dark:bg-emerald-950/40" },
          { label: "Belum", value: remaining, color: "text-amber-700 dark:text-amber-300", bg: "bg-amber-50 dark:bg-amber-950/40" },
          { label: "Pending", value: pendingApproval, color: "text-blue-700 dark:text-blue-300", bg: "bg-blue-50 dark:bg-blue-950/40" },
        ].map((kpi) => (
          <div
            key={kpi.label}
            className={`${kpi.bg} rounded-xl p-2.5 text-center border border-slate-100 dark:border-slate-800`}
          >
            <span className={`text-lg font-black leading-none block ${kpi.color}`}>
              {loading ? "·" : kpi.value}
            </span>
            <span className="text-[9px] font-semibold text-slate-500 dark:text-slate-400 mt-0.5 block">
              {kpi.label}
            </span>
          </div>
        ))}
      </div>

      {/* ── Search + Sort ── */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
          <input
            type="text"
            placeholder="Cari kode atau nama tablet..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-10 pl-8 pr-3 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-400"
          />
        </div>
        <div className="relative">
          <button
            onClick={() => setShowSortMenu((v) => !v)}
            className="h-10 w-10 flex items-center justify-center rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:border-indigo-400 hover:text-indigo-600 transition-colors active:scale-95"
          >
            <ArrowUpDown className="w-4 h-4" />
          </button>
          {showSortMenu && (
            <div className="absolute right-0 top-12 w-44 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xl z-50 py-1 animate-in fade-in zoom-in-95">
              {SORT_OPTIONS.map((opt) => (
                <button
                  key={opt.key}
                  onClick={() => {
                    setSort(opt.key);
                    setShowSortMenu(false);
                  }}
                  className={`w-full text-left px-3 py-2 text-xs font-semibold transition-colors ${
                    sort === opt.key
                      ? "text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/50"
                      : "text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700"
                  }`}
                >
                  {sort === opt.key && "✓ "}
                  {opt.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Filter Tabs ── */}
      <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden -mx-1 px-1">
        {FILTER_TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setFilter(tab.key)}
            className={`flex-shrink-0 flex items-center gap-1 px-3 py-1.5 rounded-full text-[11px] font-bold border transition-all min-h-[32px] ${
              filter === tab.key
                ? "bg-indigo-600 text-white border-indigo-600 shadow-sm"
                : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-indigo-300"
            }`}
          >
            {tab.label}
            <span
              className={`px-1.5 py-0.5 rounded-full text-[9px] font-black ${
                filter === tab.key
                  ? "bg-white/20 text-white"
                  : "bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300"
              }`}
            >
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* ── Content ── */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((n) => (
            <div
              key={n}
              className="h-28 rounded-2xl bg-slate-100 dark:bg-slate-800 animate-pulse"
            />
          ))}
        </div>
      ) : allDone && filter === "all" && !search ? (
        /* ── Empty: All Done ── */
        <div className="flex flex-col items-center justify-center py-14 text-center space-y-3">
          <PartyPopper className="w-14 h-14 text-indigo-400 dark:text-indigo-500" />
          <h3 className="text-base font-black text-slate-800 dark:text-slate-100">
            Semua Tablet Telah Diperiksa!
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-[220px]">
            Semua tablet pada periode ini telah diperiksa. <strong>Great job!</strong> 🎉
          </p>
        </div>
      ) : filtered.length === 0 ? (
        /* ── Empty: No match ── */
        <div className="flex flex-col items-center justify-center py-12 text-center space-y-2">
          <SlidersHorizontal className="w-10 h-10 text-slate-300 dark:text-slate-600" />
          <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">
            Tidak ada tugas sesuai filter.
          </p>
        </div>
      ) : (
        /* ── Task Cards ── */
        <div className="space-y-3">
          {filtered.map(({ tablet, status, inspection, lastInspectionDate, priority }) => {
            const cfg = statusConfig(status);
            const isDone = status === "disetujui";
            const canStart = status === "belum_diperiksa" || status === "perlu_perbaikan";

            return (
              <div
                key={tablet.id}
                className={`rounded-2xl border bg-white dark:bg-slate-900 shadow-sm transition-all ${
                  isDone
                    ? "border-emerald-100 dark:border-emerald-900/50 opacity-70"
                    : "border-slate-200 dark:border-slate-800 hover:border-indigo-200 dark:hover:border-indigo-800"
                }`}
              >
                <div className="p-4 space-y-3">
                  {/* ─ Header row ─ */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-0.5">
                      <span className="font-mono font-black text-sm text-indigo-600 dark:text-indigo-400 block leading-none">
                        {tablet.qr_code}
                      </span>
                      <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 block">
                        {tablet.brand} {tablet.model}
                      </span>
                      <span className="flex items-center gap-1 text-[10px] text-slate-500 dark:text-slate-400">
                        <MapPin className="w-3 h-3 text-indigo-400" />
                        {tablet.location?.name || "—"}
                      </span>
                    </div>

                    <div className="flex flex-col items-end gap-1.5 shrink-0">
                      <StatusBadge status={status} />
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                          priority === "High"
                            ? "bg-rose-50 text-rose-600 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800"
                            : priority === "Low"
                            ? "bg-slate-50 text-slate-500 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700"
                            : "bg-sky-50 text-sky-600 border-sky-200 dark:bg-sky-950/40 dark:text-sky-300 dark:border-sky-800"
                        }`}
                      >
                        {priority}
                      </span>
                    </div>
                  </div>

                  {/* ─ Last inspection date ─ */}
                  {lastInspectionDate && (
                    <p className="text-[10px] text-slate-400 dark:text-slate-500 font-mono">
                      Terakhir diperiksa:{" "}
                      {new Date(lastInspectionDate).toLocaleDateString("id-ID", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  )}

                  {/* ─ QR indicator row ─ */}
                  <div className="flex items-center justify-between gap-2">
                    <span className="flex items-center gap-1 text-[10px] font-semibold text-slate-400 dark:text-slate-500">
                      <QrCode className="w-3 h-3" />
                      QR tersedia
                    </span>

                    {canStart && (
                      <button
                        onClick={() => handleStartInspection(tablet.qr_code)}
                        className="flex items-center gap-1.5 min-h-[40px] px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white text-xs font-black shadow-md shadow-indigo-500/25 transition-all"
                      >
                        <QrCode className="w-3.5 h-3.5" />
                        Mulai Inspeksi
                      </button>
                    )}

                    {status === "menunggu_approval" && (
                      <span className="flex items-center gap-1 text-[10px] font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 px-2.5 py-1.5 rounded-lg border border-amber-200 dark:border-amber-800">
                        <Hourglass className="w-3 h-3" />
                        Menunggu
                      </span>
                    )}

                    {status === "disetujui" && (
                      <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-1.5 rounded-lg border border-emerald-200 dark:border-emerald-800">
                        <CheckCircle2 className="w-3 h-3" />
                        Selesai
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
