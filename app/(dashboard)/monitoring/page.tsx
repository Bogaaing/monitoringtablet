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

  // Selected Inspection Modal & Lightbox
  const [selectedInspection, setSelectedInspection] = useState<Inspection | null>(null);
  const [activePhotoUrl, setActivePhotoUrl] = useState<string | null>(null);

  const fetchLiveMonitoringData = async () => {
    setRefreshing(true);
    try {
      const [inspRes, locList, tabRes] = await Promise.all([
        inspectionsService.getInspections({ limit: 100 }),
        locationsService.getAllLocations(),
        tabletsService.getTablets({ limit: 100 }),
      ]);

      setInspections(inspRes.data);
      setLocations(locList);
      setTablets(tabRes.data);

      // Aggregate location progress
      const locStats = locList.map((loc) => {
        const locTablets = tabRes.data.filter((t) => t.location_id === loc.id);
        const locInspections = inspRes.data.filter((i) => i.tablet?.location_id === loc.id);
        const completed = locInspections.length;
        const total = locTablets.length || 1;
        const pending = Math.max(0, total - completed);
        const rate = Math.min(100, Math.round((completed / total) * 100));

        return {
          id: loc.id,
          name: loc.name,
          total: locTablets.length,
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
  const totalTablets = tablets.length;
  const completedCount = inspections.length;
  const completionRate = totalTablets > 0 ? Math.min(100, Math.round((completedCount / totalTablets) * 100)) : 0;
  
  // Critical devices (damaged status or reported issues)
  const damagedTablets = tablets.filter((t) => t.status === "maintenance" || t.status === "inactive");
  const lowBatteryInspections = inspections.filter((i) => (i.battery_pct || 100) < 20);
  const totalAlerts = damagedTablets.length + lowBatteryInspections.length;

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
          description={`${completedCount} dari ${totalTablets} tablet terinspeksi`}
          icon={Activity}
          gradient="emerald"
          badgeText="Progres"
        />

        <StatGradientCard
          title="Total Tablet Active"
          value={totalTablets}
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

      {/* Location Operational Progress Grid */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <MapPin className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
            <span>Progres Operasional per Lokasi Area</span>
          </h3>
          <span className="text-xs text-slate-500">{locationProgress.length} Lokasi Operasional</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {locationProgress.map((loc) => (
            <GlassCard key={loc.id} className="p-5 space-y-3" glowColor="indigo">
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100">{loc.name}</h4>
                  <span className="text-xs text-slate-500 font-mono">{loc.total} Unit Tablet</span>
                </div>
                <Badge variant={loc.rate === 100 ? "success" : "warning"} className="text-xs font-black">
                  {loc.rate}%
                </Badge>
              </div>

              {/* Solid Progress Bar */}
              <div className="space-y-1">
                <div className="w-full bg-slate-100 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden border border-slate-200 dark:border-slate-700">
                  <div
                    className="bg-indigo-600 h-full rounded-full transition-all duration-500"
                    style={{ width: `${loc.rate}%` }}
                  />
                </div>
                <div className="flex justify-between text-[11px] font-semibold text-slate-500">
                  <span className="text-emerald-600 dark:text-emerald-400">{loc.completed} Selesai</span>
                  <span className="text-amber-600 dark:text-amber-400">{loc.pending} Belum</span>
                </div>
              </div>
            </GlassCard>
          ))}
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
