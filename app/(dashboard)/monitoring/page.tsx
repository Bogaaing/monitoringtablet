"use client";

import React, { useState, useEffect, useRef } from "react";
import { PageHeader } from "@/components/shared/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { StatGradientCard } from "@/components/dashboard/stat-gradient-card";
import { GlassCard } from "@/components/dashboard/glass-card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { dashboardService } from "@/services/dashboard.service";
import { inspectionsService, Inspection } from "@/services/inspections.service";
import { locationsService } from "@/services/locations.service";
import { tabletsService } from "@/services/tablets.service";
import { periodsService } from "@/services/periods.service";
import { Tablet, Location } from "@/types";
import {
  Activity,
  RefreshCw,
  Clock,
  CheckCircle2,
  AlertTriangle,
  MapPin,
  Tablet as TabletIcon,
  BatteryCharging,
  Eye,
  X,
  Radio,
  Maximize2,
  ShieldCheck,
  Search,
  Filter,
} from "lucide-react";

export default function LiveMonitoringPage() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [autoRefreshInterval, setAutoRefreshInterval] = useState<number>(10); // 10s default
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  // Operational Datasets
  const [inspections, setInspections] = useState<Inspection[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [tablets, setTablets] = useState<Tablet[]>([]);
  const [locationProgress, setLocationProgress] = useState<
    { id: string; name: string; total: number; completed: number; pending: number; rate: number }[]
  >([]);

  // Location Progress Filter & Search
  const [locationFilter, setLocationFilter] = useState<"all" | "uninspected" | "incomplete" | "completed">("all");
  const [searchLocation, setSearchLocation] = useState<string>("");

  // Selected Inspection Modal & Lightbox
  const [selectedInspection, setSelectedInspection] = useState<Inspection | null>(null);
  const [activePhotoUrl, setActivePhotoUrl] = useState<string | null>(null);

  const fetchLiveMonitoringData = async () => {
    setRefreshing(true);
    try {
      const now = new Date();
      const currentYear = now.getFullYear();
      const currentMonth = now.getMonth() + 1;

      // 1. Fetch current month's official period, locations, and registered tablets
      const [currentPeriod, locList, tabRes] = await Promise.all([
        periodsService.getCurrentMonthPeriod(),
        locationsService.getAllLocations(),
        tabletsService.getTablets({ limit: 500 }),
      ]);

      // 2. Fetch inspections strictly for the current month period
      let currentInspections: Inspection[] = [];
      if (currentPeriod?.id) {
        const inspRes = await inspectionsService.getInspections({
          periodId: currentPeriod.id,
          limit: 500,
        });
        currentInspections = (inspRes.data || []).filter((ins) => {
          // Verify both period_id and inspection timestamp match current month
          if (ins.period_id && ins.period_id !== currentPeriod.id) return false;
          if (ins.submitted_at) {
            const d = new Date(ins.submitted_at);
            if (d.getFullYear() !== currentYear || d.getMonth() + 1 !== currentMonth) {
              return false;
            }
          }
          return true;
        });
      }

      setInspections(currentInspections);
      setLocations(locList);
      setTablets(tabRes.data);

      // 3. Aggregate location progress strictly for current month (active tablets target)
      const locStats = locList.map((loc) => {
        const locActiveTablets = tabRes.data.filter((t) => t.location_id === loc.id && t.status === "active");
        const locInspections = currentInspections.filter((i) => i.tablet?.location_id === loc.id);
        const completed = locInspections.length;
        const total = locActiveTablets.length;
        const pending = Math.max(0, total - completed);
        const rate = total > 0 ? Math.min(100, Math.round((completed / total) * 100)) : 0;

        return {
          id: loc.id,
          name: loc.name,
          total,
          completed,
          pending,
          rate,
        };
      });

      setLocationProgress(locStats);
      setLastUpdated(new Date());
    } catch (e) {
      console.error("Failed to fetch live monitoring data:", e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchLiveMonitoringData();
  }, []);

  // Auto-refresh interval polling timer
  useEffect(() => {
    if (autoRefreshInterval <= 0) return;

    const timer = setInterval(() => {
      fetchLiveMonitoringData();
    }, autoRefreshInterval * 1000);

    return () => clearInterval(timer);
  }, [autoRefreshInterval]);

  // Derived metrics
  const activeTablets = tablets.filter((t) => t.status === "active");
  const totalActiveTablets = activeTablets.length;
  const completedCount = inspections.length;
  const completionRate = totalActiveTablets > 0 ? Math.min(100, Math.round((completedCount / totalActiveTablets) * 100)) : 0;
  
  // Critical devices (damaged status or reported issues)
  const damagedTablets = tablets.filter((t) => t.status === "maintenance" || t.status === "inactive");
  const lowBatteryInspections = inspections.filter((i) => (i.battery_pct || 100) < 20);
  const totalAlerts = damagedTablets.length + lowBatteryInspections.length;

  // Location counts for filter pills
  const locationCounts = {
    all: locationProgress.length,
    uninspected: locationProgress.filter((l) => l.total > 0 && l.completed === 0).length,
    incomplete: locationProgress.filter((l) => l.total > 0 && l.completed < l.total).length,
    completed: locationProgress.filter((l) => l.total > 0 && l.completed >= l.total).length,
  };

  // Filtered operational locations
  const filteredLocationProgress = locationProgress.filter((loc) => {
    // Search by location name
    if (searchLocation.trim()) {
      if (!loc.name.toLowerCase().includes(searchLocation.trim().toLowerCase())) {
        return false;
      }
    }

    // Status filter
    if (locationFilter === "uninspected") {
      return loc.total > 0 && loc.completed === 0;
    }
    if (locationFilter === "incomplete") {
      return loc.total > 0 && loc.completed < loc.total;
    }
    if (locationFilter === "completed") {
      return loc.total > 0 && loc.completed >= loc.total;
    }
    return true;
  });

  return (
    <div className="space-y-8">
      {/* Live Control Status Bar */}
      <div className="rounded-3xl bg-slate-900 p-6 text-white shadow-xl border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="relative flex h-4 w-4 items-center justify-center">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-extrabold text-white">Live Monitoring Center</h2>
              <Badge variant="outline" className="border-emerald-500/50 text-emerald-400 text-[10px] font-bold">
                LIVE STREAM
              </Badge>
            </div>
            <p className="text-xs text-slate-400">
              Terakhir diperbarui:{" "}
              <span className="font-mono text-slate-300">
                {lastUpdated.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
              </span>
            </p>
          </div>
        </div>

        {/* Live Control Controls */}
        <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-end">
          <div className="flex items-center gap-2 text-xs text-slate-300 bg-slate-800/90 px-3 py-1.5 rounded-xl border border-slate-700">
            <Radio className="h-3.5 w-3.5 text-indigo-400" />
            <span className="font-medium">Auto Refresh:</span>
            <select
              value={autoRefreshInterval}
              onChange={(e) => setAutoRefreshInterval(Number(e.target.value))}
              className="bg-slate-900 text-white text-xs font-bold rounded-lg px-2 py-1 border border-slate-700 focus:outline-none"
            >
              <option value={0}>Mati (Off)</option>
              <option value={5}>Setiap 5 Detik</option>
              <option value={10}>Setiap 10 Detik</option>
              <option value={30}>Setiap 30 Detik</option>
            </select>
          </div>

          <Button
            size="sm"
            onClick={fetchLiveMonitoringData}
            disabled={refreshing}
            className="gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? "animate-spin" : ""}`} />
            <span>Refresh</span>
          </Button>
        </div>
      </div>

      <PageHeader
        title="Pemantauan Operasional Real-Time"
        description="Pantau progres inspeksi bulanan, kondisi kesehatan tablet, dan aktivitas pengiriman secara langsung."
      />

      {/* Operational Summary Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <StatGradientCard
          title="Tingkat Penyelesaian"
          value={`${completionRate}%`}
          description={`${completedCount} dari ${totalActiveTablets} tablet terinspeksi`}
          icon={Activity}
          gradient="emerald"
          badgeText="Progres"
        />

        <StatGradientCard
          title="Total Tablet Active"
          value={totalActiveTablets}
          description="Unit operasional terdaftar"
          icon={TabletIcon}
          gradient="indigo"
          badgeText="Inventaris"
        />

        <StatGradientCard
          title="Peringatan Perangkat"
          value={totalAlerts}
          description="Baterai lemah / Perlu servis"
          icon={AlertTriangle}
          gradient="rose"
          badgeText="Perhatian"
        />

        <StatGradientCard
          title="Total Inspeksi Masuk"
          value={completedCount}
          description="Laporan bulan ini"
          icon={CheckCircle2}
          gradient="violet"
          badgeText="Live Data"
        />
      </div>

      {/* Location Operational Progress Section with Filter */}
      <div className="space-y-4">
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <MapPin className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
              <span>Progres Operasional per Lokasi Area</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Monitoring persentase keterisian inspeksi tablet periode berjalan di tiap area kerja.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
              Menampilkan {filteredLocationProgress.length} dari {locationProgress.length} Lokasi
            </span>
          </div>
        </div>

        {/* Filter Toolbar (Status Pills & Search) */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-3 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
          {/* Status Filter Buttons */}
          <div className="flex flex-wrap items-center gap-1.5">
            {/* 1. Semua Lokasi */}
            <button
              onClick={() => setLocationFilter("all")}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 ${
                locationFilter === "all"
                  ? "bg-slate-900 text-white dark:bg-indigo-600 shadow-xs"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
              }`}
            >
              <span>Semua Lokasi</span>
              <span
                className={`px-1.5 py-0.5 rounded-full text-[10px] ${
                  locationFilter === "all"
                    ? "bg-white/20 text-white"
                    : "bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300"
                }`}
              >
                {locationCounts.all}
              </span>
            </button>

            {/* 2. Belum Inspeksi (0%) */}
            <button
              onClick={() => setLocationFilter("uninspected")}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 ${
                locationFilter === "uninspected"
                  ? "bg-rose-600 text-white shadow-xs font-bold"
                  : "bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 hover:bg-rose-100 dark:hover:bg-rose-950/60 border border-rose-200/80 dark:border-rose-900/50"
              }`}
              title="Tampilkan lokasi yang sama sekali belum melakukan inspeksi (0%)"
            >
              <AlertTriangle className="w-3.5 h-3.5 text-rose-500" />
              <span>Belum Inspeksi (0%)</span>
              <span
                className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                  locationFilter === "uninspected"
                    ? "bg-white/25 text-white"
                    : "bg-rose-200/80 dark:bg-rose-900/70 text-rose-800 dark:text-rose-200"
                }`}
              >
                {locationCounts.uninspected}
              </span>
            </button>

            {/* 3. Belum Lengkap (< 100%) */}
            <button
              onClick={() => setLocationFilter("incomplete")}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 ${
                locationFilter === "incomplete"
                  ? "bg-amber-600 text-white shadow-xs font-bold"
                  : "bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-950/60 border border-amber-200/80 dark:border-amber-900/50"
              }`}
              title="Tampilkan lokasi yang belum 100% lengkap (ada tablet pending)"
            >
              <Clock className="w-3.5 h-3.5 text-amber-500" />
              <span>Belum Lengkap (&lt; 100%)</span>
              <span
                className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                  locationFilter === "incomplete"
                    ? "bg-white/25 text-white"
                    : "bg-amber-200/80 dark:bg-amber-900/70 text-amber-800 dark:text-amber-200"
                }`}
              >
                {locationCounts.incomplete}
              </span>
            </button>

            {/* 4. Selesai (100%) */}
            <button
              onClick={() => setLocationFilter("completed")}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 ${
                locationFilter === "completed"
                  ? "bg-emerald-600 text-white shadow-xs font-bold"
                  : "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-950/60 border border-emerald-200/80 dark:border-emerald-900/50"
              }`}
              title="Tampilkan lokasi yang seluruh tabletnya sudah selesai diinspeksi (100%)"
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
              <span>Selesai (100%)</span>
              <span
                className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                  locationFilter === "completed"
                    ? "bg-white/25 text-white"
                    : "bg-emerald-200/80 dark:bg-emerald-900/70 text-emerald-800 dark:text-emerald-200"
                }`}
              >
                {locationCounts.completed}
              </span>
            </button>
          </div>

          {/* Search Location Input */}
          <div className="relative w-full md:w-64">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchLocation}
              onChange={(e) => setSearchLocation(e.target.value)}
              placeholder="Cari nama area lokasi..."
              className="w-full text-xs pl-8 pr-7 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 placeholder:text-slate-400"
            />
            {searchLocation && (
              <button
                onClick={() => setSearchLocation("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                title="Hapus pencarian"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Location Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {filteredLocationProgress.length === 0 ? (
            <div className="col-span-full p-8 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center space-y-2">
              <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto text-slate-400 mb-2">
                <MapPin className="w-5 h-5" />
              </div>
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                {locationFilter === "uninspected"
                  ? "Bagus sekali! Tidak ada lokasi yang belum melakukan inspeksi (0%)."
                  : locationFilter === "incomplete"
                  ? "Seluruh lokasi operasional telah menyelesaikan 100% inspeksi!"
                  : "Tidak ada lokasi yang cocok dengan filter atau kata kunci pencarian."}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Ubah filter status atau bersihkan kotak pencarian di atas untuk melihat data lokasi lainnya.
              </p>
              <button
                onClick={() => {
                  setLocationFilter("all");
                  setSearchLocation("");
                }}
                className="mt-2 text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline inline-block"
              >
                Reset Semua Filter Lokasi
              </button>
            </div>
          ) : (
            filteredLocationProgress.map((loc) => {
              const isUninspected = loc.total > 0 && loc.completed === 0;
              const isCompleted = loc.total > 0 && loc.completed >= loc.total;
              const isInProgress = loc.completed > 0 && loc.completed < loc.total;
              const hasNoTablets = loc.total === 0;

              let glowColor: "indigo" | "rose" | "amber" | "emerald" = "indigo";
              if (isUninspected) glowColor = "rose";
              else if (isInProgress) glowColor = "amber";
              else if (isCompleted) glowColor = "emerald";

              return (
                <GlassCard
                  key={loc.id}
                  className={`p-5 space-y-3 transition-all ${
                    isUninspected
                      ? "border-rose-200/90 dark:border-rose-900/60 bg-rose-50/20 dark:bg-rose-950/15"
                      : isCompleted
                      ? "border-emerald-200/60 dark:border-emerald-900/40"
                      : ""
                  }`}
                  glowColor={glowColor}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100 truncate" title={loc.name}>
                        {loc.name}
                      </h4>
                      <span className="text-xs text-slate-500 font-mono">
                        {hasNoTablets ? "0 Unit Tablet" : `${loc.total} Unit Tablet`}
                      </span>
                    </div>

                    {/* Status Badge */}
                    {hasNoTablets ? (
                      <Badge variant="outline" className="text-[10px] text-slate-400 border-slate-200 shrink-0">
                        Kosong
                      </Badge>
                    ) : isUninspected ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-rose-100 text-rose-700 dark:bg-rose-950/80 dark:text-rose-300 border border-rose-200 dark:border-rose-900 shrink-0">
                        <AlertTriangle className="w-3 h-3 text-rose-500" />
                        0% Belum
                      </span>
                    ) : isCompleted ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-950/80 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900 shrink-0">
                        <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                        100% Selesai
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-100 text-amber-700 dark:bg-amber-950/80 dark:text-amber-300 border border-amber-200 dark:border-amber-900 shrink-0">
                        <Clock className="w-3 h-3 text-amber-500" />
                        {loc.rate}%
                      </span>
                    )}
                  </div>

                  {/* Progress Bar & Counter */}
                  <div className="space-y-1.5">
                    <div className="w-full bg-slate-100 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden border border-slate-200 dark:border-slate-700">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          isCompleted
                            ? "bg-emerald-500"
                            : isUninspected
                            ? "bg-rose-400"
                            : "bg-amber-500"
                        }`}
                        style={{ width: `${loc.rate}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-[11px] font-semibold">
                      <span className={loc.completed > 0 ? "text-emerald-600 dark:text-emerald-400" : "text-slate-400"}>
                        {loc.completed} Selesai
                      </span>
                      <span
                        className={
                          isUninspected
                            ? "text-rose-600 dark:text-rose-400 font-bold"
                            : loc.pending > 0
                            ? "text-amber-600 dark:text-amber-400"
                            : "text-slate-400"
                        }
                      >
                        {loc.pending} Belum
                      </span>
                    </div>
                  </div>
                </GlassCard>
              );
            })
          )}
        </div>
      </div>

      {/* Device Health & Critical Alerts Panel */}
      {totalAlerts > 0 && (
        <GlassCard className="p-6 border-rose-200 dark:border-rose-950" glowColor="rose">
          <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3 mb-4">
            <AlertTriangle className="h-5 w-5 text-rose-600" />
            <h3 className="text-base font-bold text-rose-600 dark:text-rose-400">
              Panel Peringatan Kesehatan Perangkat ({totalAlerts})
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            {/* Damaged Tablets Alert List */}
            {damagedTablets.map((t) => (
              <div
                key={t.id}
                className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 flex items-center justify-between"
              >
                <div>
                  <span className="font-mono font-bold text-rose-700 dark:text-rose-300">{t.qr_code}</span>
                  <p className="text-slate-600 dark:text-slate-300 font-medium">
                    {t.brand} {t.model} — {t.location?.name || "N/A"}
                  </p>
                </div>
                <Badge variant="destructive" className="uppercase text-[10px]">
                  {t.status}
                </Badge>
              </div>
            ))}

            {/* Low Battery Alert List */}
            {lowBatteryInspections.map((i) => (
              <div
                key={i.id}
                className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/50 flex items-center justify-between"
              >
                <div>
                  <span className="font-mono font-bold text-amber-700 dark:text-amber-300">
                    {i.tablet?.qr_code}
                  </span>
                  <p className="text-slate-600 dark:text-slate-300 font-medium">
                    Baterai Kritis ({i.battery_pct}%) — {i.tablet?.location?.name || "N/A"}
                  </p>
                </div>
                <span className="font-bold text-amber-600 flex items-center gap-1">
                  <BatteryCharging className="h-4 w-4" />
                  <span>{i.battery_pct}%</span>
                </span>
              </div>
            ))}
          </div>
        </GlassCard>
      )}

      {/* Live Stream Inspection Log Table */}
      <GlassCard className="p-6" glowColor="indigo">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4 mb-4">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Clock className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
              <span>Stream Aktivitas Inspeksi Terkini (Live Feed)</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Alur kronologis pengiriman inspeksi dan perubahan status persetujuan
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Kode Tablet</TableHead>
                <TableHead>Petugas (PIC)</TableHead>
                <TableHead>Lokasi Area</TableHead>
                <TableHead>Kondisi</TableHead>
                <TableHead>Waktu Kirim</TableHead>
                <TableHead>Status Review</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-slate-500">
                    Memuat data stream live...
                  </TableCell>
                </TableRow>
              ) : inspections.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-slate-500">
                    Belum ada pengiriman inspeksi pada periode ini.
                  </TableCell>
                </TableRow>
              ) : (
                inspections.map((ins) => (
                  <TableRow key={ins.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors">
                    <TableCell className="font-mono font-bold text-indigo-600 dark:text-indigo-400">
                      {ins.tablet?.qr_code || "QR-TAB-001"}
                    </TableCell>
                    <TableCell className="text-sm font-semibold">
                      {ins.pic?.name || "Ahmad Rizky (PIC)"}
                    </TableCell>
                    <TableCell className="text-xs text-slate-600 dark:text-slate-400">
                      {ins.tablet?.location?.name || "Gudang Utama A"}
                    </TableCell>
                    <TableCell className="text-xs uppercase font-bold text-slate-700 dark:text-slate-300">
                      {ins.tablet_condition || "good"}
                    </TableCell>
                    <TableCell className="text-xs font-mono text-slate-500">
                      {new Date(ins.submitted_at).toLocaleTimeString("id-ID", {
                        hour: "2-digit",
                        minute: "2-digit",
                        second: "2-digit",
                      })}
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={ins.status} />
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setSelectedInspection(ins)}
                        className="text-xs gap-1 text-indigo-600 hover:bg-indigo-50"
                      >
                        <Eye className="h-4 w-4" />
                        <span>Detail</span>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </GlassCard>

      {/* Inspection Detail Modal */}
      {selectedInspection && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-lg w-full p-6 space-y-4 relative max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <TabletIcon className="h-5 w-5 text-indigo-600" />
                <h3 className="text-base font-bold">Detail Live Inspeksi</h3>
              </div>
              <button onClick={() => setSelectedInspection(null)} className="text-slate-400 hover:text-slate-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 dark:bg-slate-800 rounded-xl">
                <div>
                  <span className="text-slate-500">Kode Tablet:</span>
                  <p className="font-mono font-bold text-indigo-600">{selectedInspection.tablet?.qr_code}</p>
                </div>
                <div>
                  <span className="text-slate-500">PIC Inspeksi:</span>
                  <p className="font-semibold">{selectedInspection.pic?.name || "Ahmad Rizky (PIC)"}</p>
                </div>
                <div>
                  <span className="text-slate-500">Kondisi Fisik:</span>
                  <p className="font-bold uppercase">{selectedInspection.tablet_condition || "good"}</p>
                </div>
                <div>
                  <span className="text-slate-500">Persentase Baterai:</span>
                  <p className="font-bold text-emerald-600">{selectedInspection.battery_pct || 85}%</p>
                </div>
              </div>

              {selectedInspection.notes && (
                <div className="space-y-1">
                  <span className="font-bold text-slate-700 dark:text-slate-300">Catatan PIC:</span>
                  <p className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 italic text-slate-600 dark:text-slate-300">
                    "{selectedInspection.notes}"
                  </p>
                </div>
              )}

              {/* Photos Gallery */}
              {selectedInspection.photos && selectedInspection.photos.length > 0 && (
                <div className="space-y-2">
                  <span className="font-bold text-slate-700 dark:text-slate-300">Foto Fisik Terlampir:</span>
                  <div className="grid grid-cols-2 gap-2">
                    {selectedInspection.photos.map((ph) => (
                      <div
                        key={ph.id}
                        onClick={() => setActivePhotoUrl(ph.photo_url)}
                        className="relative aspect-video rounded-xl overflow-hidden border border-slate-200 cursor-pointer shadow-sm"
                      >
                        <img src={ph.photo_url} alt="Foto" className="w-full h-full object-cover" />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end">
              <Button size="sm" variant="outline" onClick={() => setSelectedInspection(null)}>
                Tutup
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Lightbox Fullscreen Photo Viewer */}
      {activePhotoUrl && (
        <div
          onClick={() => setActivePhotoUrl(null)}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-8 bg-slate-950/90 backdrop-blur-md animate-in fade-in cursor-zoom-out"
        >
          <div className="relative max-w-full max-h-full flex items-center justify-center">
            <img
              src={activePhotoUrl}
              alt="Foto Inspeksi Full"
              className="max-w-[92vw] max-h-[85vh] w-auto h-auto object-contain rounded-2xl shadow-2xl border border-white/20"
            />
            <button
              onClick={(e) => {
                e.stopPropagation();
                setActivePhotoUrl(null);
              }}
              className="absolute -top-12 right-0 sm:top-4 sm:right-4 p-2 bg-slate-900/80 text-white rounded-full hover:bg-slate-800 border border-white/20 shadow-lg cursor-pointer"
              title="Tutup Preview Foto"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
