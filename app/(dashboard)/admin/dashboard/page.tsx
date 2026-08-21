"use client";

import React, { useState, useEffect } from "react";
import { PageHeader } from "@/components/shared/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { dashboardService, AdminDashboardStats } from "@/services/dashboard.service";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import {
  Tablet,
  Users,
  MapPin,
  AlertTriangle,
  Activity,
  Calendar,
  CheckCircle2,
  Clock,
  XCircle,
  ChevronRight,
  Shield,
  ArrowRight,
  Sparkles,
  RefreshCw,
} from "lucide-react";
import Link from "next/link";

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<AdminDashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);

  const fetchStats = () => {
    setLoading(true);
    dashboardService.getAdminStats().then((res) => {
      setStats(res);
      setLoading(false);
    });
  };

  useEffect(() => {
    setMounted(true);
    fetchStats();
  }, []);

  const activeCount = (stats?.totalTablets || 0) - (stats?.damagedTablets || 0);
  const damagedCount = stats?.damagedTablets || 0;

  const deviceDistributionData = [
    { name: "Aktif Siap Pakai", value: Math.max(0, activeCount), color: "#10B981" },
    { name: "Perlu Servis / Rusak", value: damagedCount, color: "#F59E0B" },
  ];

  return (
    <div className="space-y-6">
      {/* ── Top Page Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <PageHeader
          title="Dashboard Admin"
          description="Monitoring real-time inventaris tablet, progres inspeksi bulanan, dan status operasional perangkat."
        />
        <div className="flex items-center gap-2 shrink-0">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchStats}
            disabled={loading}
            className="gap-1.5 text-xs font-semibold bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin text-indigo-600" : "text-slate-500"}`} />
            <span>Segarkan</span>
          </Button>
          <div className="px-3 py-1.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-100 dark:border-indigo-900/60 text-xs font-bold text-indigo-700 dark:text-indigo-300 flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
            <span>{stats?.activePeriodName || "Agustus 2026"}</span>
          </div>
        </div>
      </div>

      {/* ── 4 Primary KPI Summary Cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Tablet Card */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Total Tablet
            </span>
            <div className="p-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400">
              <Tablet className="h-5 w-5" />
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <div className="text-3xl font-black text-slate-900 dark:text-slate-100 font-mono">
              {loading ? "..." : stats?.totalTablets || 0}
            </div>
            <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
              {stats?.activeTablets ?? activeCount} Aktif
            </span>
          </div>
          <div className="text-xs text-slate-500 font-medium">
            {stats?.damagedTablets || 0} unit dalam perbaikan / servis
          </div>
        </div>

        {/* Progres Inspeksi Card */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Progres Inspeksi
            </span>
            <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400">
              <Activity className="h-5 w-5" />
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <div className="text-3xl font-black text-emerald-600 dark:text-emerald-400 font-mono">
              {loading ? "..." : `${stats?.progressPercentage || 0}%`}
            </div>
            <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
              {stats?.completedInspections || 0} / {stats?.totalTablets || 0} Selesai
            </span>
          </div>
          <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
            <div
              className="bg-emerald-500 h-full rounded-full transition-all duration-500"
              style={{ width: `${stats?.progressPercentage || 0}%` }}
            />
          </div>
        </div>

        {/* Total Lokasi Operasional */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Lokasi / Area
            </span>
            <div className="p-2.5 rounded-xl bg-sky-50 dark:bg-sky-950 text-sky-600 dark:text-sky-400">
              <MapPin className="h-5 w-5" />
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <div className="text-3xl font-black text-slate-900 dark:text-slate-100 font-mono">
              {loading ? "..." : stats?.totalLocations || 0}
            </div>
            <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-sky-50 text-sky-700 dark:bg-sky-950 dark:text-sky-300 border border-sky-200 dark:border-sky-800">
              Produksi dan Pengemasan
            </span>
          </div>
          <div className="text-xs text-slate-500 font-medium">
            Semua Group Proses
          </div>
        </div>

        {/* Total Pengguna Terdaftar */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Pengguna Sistem
            </span>
            <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950 text-amber-600 dark:text-amber-400">
              <Users className="h-5 w-5" />
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <div className="text-3xl font-black text-slate-900 dark:text-slate-100 font-mono">
              {loading ? "..." : stats?.totalUsers || 0}
            </div>
            <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
              Akun Aktif
            </span>
          </div>
          <div className="text-xs text-slate-500 font-medium">
            Manager,Admin,PIC (Kepala Regu)
          </div>
        </div>
      </div>

      {/* ── Visualizations Grid: 2 Columns ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Location Progress Bar Chart (2 columns) */}
        <div className="lg:col-span-2 p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4 flex flex-col justify-between">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <MapPin className="h-4.5 w-4.5 text-indigo-600 dark:text-indigo-400" />
                <span>Progres Inspeksi per Lokasi Area</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Perbandingan jumlah tablet yang telah disetujui vs menunggu approval per lokasi
              </p>
            </div>
            <Link href="/reports">
              <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1">
                Laporan Lengkap <ChevronRight className="w-3.5 h-3.5" />
              </span>
            </Link>
          </div>

          <div className="h-[260px] w-full pt-2">
            {!mounted || loading ? (
              <div className="h-full flex items-center justify-center text-slate-400 text-xs">
                Memuat visualisasi data...
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={stats?.locationProgress || []}
                  margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.15} />
                  <XAxis
                    dataKey="locationName"
                    tick={{ fontSize: 11, fill: "#64748B" }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: "#64748B" }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#0f172a",
                      color: "#FFFFFF",
                      borderRadius: "12px",
                      border: "none",
                      boxShadow: "0 10px 25px -5px rgba(0,0,0,0.3)",
                      fontSize: "12px",
                    }}
                  />
                  <Bar
                    dataKey="completed"
                    name="Disetujui (Approved)"
                    fill="#10B981"
                    radius={[6, 6, 0, 0]}
                  />
                  <Bar
                    dataKey="pending"
                    name="Menunggu Approval"
                    fill="#F59E0B"
                    radius={[6, 6, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Mini Legend & Summary Pills */}
          <div className="flex flex-wrap items-center gap-4 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-emerald-500" />
              <span className="text-slate-600 dark:text-slate-400 font-semibold">
                Disetujui: <strong className="text-slate-900 dark:text-slate-100">{stats?.completedInspections || 0} Unit</strong>
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-amber-500" />
              <span className="text-slate-600 dark:text-slate-400 font-semibold">
                Menunggu: <strong className="text-slate-900 dark:text-slate-100">{stats?.pendingInspections || 0} Unit</strong>
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-rose-500" />
              <span className="text-slate-600 dark:text-slate-400 font-semibold">
                Perlu Perbaikan: <strong className="text-slate-900 dark:text-slate-100">{stats?.rejectedInspections || 0} Unit</strong>
              </span>
            </div>
          </div>
        </div>

        {/* Right: Device Status Donut Chart (1 column) */}
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4 flex flex-col justify-between">
          <div className="border-b border-slate-100 dark:border-slate-800 pb-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Shield className="h-4.5 w-4.5 text-emerald-600 dark:text-emerald-400" />
              <span>Kelayakan Fisik Tablet</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Proporsi kesiapan operasional perangkat
            </p>
          </div>

          <div className="h-[220px] flex items-center justify-center relative">
            {!mounted || loading ? (
              <div className="text-slate-400 text-xs">Memuat grafik...</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={deviceDistributionData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={80}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {deviceDistributionData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#0f172a",
                      color: "#fff",
                      borderRadius: "12px",
                      border: "none",
                      fontSize: "12px",
                    }}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>

          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-300 font-medium flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-500 shrink-0" />
            <span>
              {activeCount} dari {stats?.totalTablets || 0} unit tablet berada dalam kondisi prima siap beroperasi.
            </span>
          </div>
        </div>
      </div>

      {/* ── Bottom Section: Recent Inspections & Master Data Shortcuts ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Recent Activity List (2 columns) */}
        <div className="lg:col-span-2 p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Clock className="h-4.5 w-4.5 text-indigo-600 dark:text-indigo-400" />
                <span>Pengajuan & Aktivitas Inspeksi Terbaru</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Riwayat transaksi pemeriksaan tablet yang baru saja dikirimkan oleh PIC
              </p>
            </div>
            <Link href="/reports">
              <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline">
                Lihat Semua →
              </span>
            </Link>
          </div>

          {(!stats?.recentInspections || stats.recentInspections.length === 0) ? (
            <div className="p-8 text-center text-xs text-slate-400">
              Belum ada riwayat transaksi inspeksi pada periode ini.
            </div>
          ) : (
            <div className="space-y-2.5">
              {stats.recentInspections.map((ins) => (
                <div
                  key={ins.id}
                  className="p-3.5 rounded-xl border border-slate-100 dark:border-slate-800 hover:border-indigo-200 dark:hover:border-indigo-900/50 transition-all flex items-center justify-between gap-3 bg-slate-50/50 dark:bg-slate-800/30"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 shrink-0">
                      <Tablet className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-black text-xs text-indigo-600 dark:text-indigo-400">
                          {ins.tablet?.qr_code || "QR-TAB"}
                        </span>
                        <span className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
                          {ins.tablet?.brand} {ins.tablet?.model || "-"}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-400 flex items-center gap-2 mt-0.5">
                        <span>{ins.tablet?.location?.name || "Lokasi"}</span>
                        <span>•</span>
                        <span>
                          {new Date(ins.submitted_at).toLocaleTimeString("id-ID", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="shrink-0 text-right">
                    <StatusBadge status={ins.status} className="text-[10px]" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right: Master Data Shortcuts (1 column) */}
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
          <div className="border-b border-slate-100 dark:border-slate-800 pb-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Shield className="h-4.5 w-4.5 text-indigo-600 dark:text-indigo-400" />
              <span>Manajemen Master Data</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Pintasan cepat pengelolaan database
            </p>
          </div>

          <div className="space-y-2.5">
            {[
              {
                title: "Master Tablet",
                desc: "Kelola unit, S/N & QR",
                icon: Tablet,
                href: "/admin/tablets",
                color: "text-indigo-600 dark:text-indigo-400",
                bg: "bg-indigo-50 dark:bg-indigo-950",
                count: `${stats?.totalTablets || 0} Unit`,
              },
              {
                title: "Master Lokasi",
                desc: "Area gudang & plant",
                icon: MapPin,
                href: "/admin/locations",
                color: "text-emerald-600 dark:text-emerald-400",
                bg: "bg-emerald-50 dark:bg-emerald-950",
                count: `${stats?.totalLocations || 0} Area`,
              },
              {
                title: "Master User",
                desc: "Akun PIC & Manager",
                icon: Users,
                href: "/admin/users",
                color: "text-sky-600 dark:text-sky-400",
                bg: "bg-sky-50 dark:bg-sky-950",
                count: `${stats?.totalUsers || 0} User`,
              },
              {
                title: "Periode Inspeksi",
                desc: "Jadwal & siklus bulanan",
                icon: Calendar,
                href: "/admin/periods",
                color: "text-amber-600 dark:text-amber-400",
                bg: "bg-amber-50 dark:bg-amber-950",
                count: stats?.activePeriodName || "Aktif",
              },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <Link key={item.title} href={item.href} className="block group">
                  <div className="p-3 rounded-xl border border-slate-100 dark:border-slate-800 hover:border-indigo-300 dark:hover:border-indigo-800 transition-all flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/30">
                    <div className="flex items-center gap-3">
                      <div className={`p-2.5 rounded-xl ${item.bg} ${item.color}`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 group-hover:text-indigo-600 transition-colors">
                          {item.title}
                        </h4>
                        <span className="text-[10px] text-slate-400">{item.desc}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 text-right">
                      <span className="text-[11px] font-mono font-bold text-slate-500">
                        {item.count}
                      </span>
                      <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
