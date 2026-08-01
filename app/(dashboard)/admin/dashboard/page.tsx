"use client";

import React, { useState, useEffect } from "react";
import { PageHeader } from "@/components/shared/page-header";
import { StatGradientCard } from "@/components/dashboard/stat-gradient-card";
import { GlassCard } from "@/components/dashboard/glass-card";
import { CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
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
  Legend,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import {
  Tablet,
  Users,
  MapPin,
  AlertTriangle,
  CheckCircle2,
  ArrowRight,
  Shield,
  Activity,
  Calendar,
  Sparkles,
  Zap,
  ChevronRight,
} from "lucide-react";
import Link from "next/link";

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<AdminDashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    dashboardService.getAdminStats().then((res) => {
      setStats(res);
      setLoading(false);
    });
  }, []);

  const deviceDistributionData = [
    { name: "Aktif (Active)", value: (stats?.totalTablets || 0) - (stats?.damagedTablets || 0), color: "#10b981" },
    { name: "Perlu Servis", value: stats?.damagedTablets || 0, color: "#f59e0b" },
  ];

  return (
    <div className="space-y-8">
      {/* Executive Clean Solid Hero Banner */}
      <div className="rounded-3xl bg-slate-900 p-8 text-white shadow-xl border border-slate-800">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-950 border border-indigo-800 text-indigo-400 text-xs font-bold uppercase tracking-wider">
              <Sparkles className="h-3.5 w-3.5 text-indigo-400" />
              <span>Admin Control Center</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-black text-white tracking-tight">
              Executive System Overview
            </h1>
            <p className="text-sm text-slate-400 max-w-xl">
              Ringkasan real-time inventaris tablet, sebaran lokasi operasional, dan status progres pengujian bulanan.
            </p>
          </div>

          <div className="flex items-center gap-3 bg-slate-800/90 p-3 rounded-2xl border border-slate-700">
            <div className="p-2.5 bg-indigo-950 rounded-xl text-indigo-400 border border-indigo-800">
              <Calendar className="h-5 w-5" />
            </div>
            <div className="pr-4 text-xs">
              <span className="text-slate-400 block font-medium">Periode Inspeksi</span>
              <span className="font-bold text-white text-sm">
                {stats?.activePeriodName || "Periode Aktif"}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 5 Solid Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <StatGradientCard
          title="Total Tablet"
          value={loading ? "..." : stats?.totalTablets || 0}
          description="Unit terdaftar"
          icon={Tablet}
          gradient="indigo"
          badgeText="Inventaris"
        />

        <StatGradientCard
          title="Total Users"
          value={loading ? "..." : stats?.totalUsers || 0}
          description="Akun terdaftar"
          icon={Users}
          gradient="sky"
          badgeText="Pengguna"
        />

        <StatGradientCard
          title="Total Lokasi"
          value={loading ? "..." : stats?.totalLocations || 0}
          description="Area operasional"
          icon={MapPin}
          gradient="emerald"
          badgeText="Area"
        />

        <StatGradientCard
          title="Progres Inspeksi"
          value={loading ? "..." : `${stats?.progressPercentage || 0}%`}
          description={stats?.activePeriodName || "Periode Aktif"}
          icon={Activity}
          gradient="violet"
          badgeText="Periode Ini"
        />

        <StatGradientCard
          title="Tablet Rusak"
          value={loading ? "..." : stats?.damagedTablets || 0}
          description="Perlu maintenance"
          icon={AlertTriangle}
          gradient="amber"
          badgeText="Perhatian"
        />
      </div>

      {/* Recharts 3 Visualizations Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Inspection Progress Bar Chart */}
        <GlassCard className="lg:col-span-2 p-6" glowColor="indigo">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4 mb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Activity className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                <span>Progres Inspeksi & Aktivitas Perangkat</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Perbandingan unit terinspeksi vs total perangkat terdaftar
              </p>
            </div>
            <span className="text-2xl font-black text-indigo-600 dark:text-indigo-400">
              {stats?.progressPercentage || 0}%
            </span>
          </div>

          <div className="space-y-6">
            {/* Solid Clean Progress Bar */}
            <div className="space-y-2">
              <div className="w-full bg-slate-100 dark:bg-slate-800 h-4 rounded-full overflow-hidden p-0.5 border border-slate-200 dark:border-slate-700">
                <div
                  className="bg-indigo-600 h-full rounded-full transition-all duration-700"
                  style={{ width: `${stats?.progressPercentage || 0}%` }}
                />
              </div>
              <div className="flex items-center justify-between text-xs text-slate-500 font-semibold">
                <span>{stats?.completedInspections || 0} Unit Selesai</span>
                <span>{stats?.totalTablets || 0} Total Unit</span>
              </div>
            </div>

            {/* Sub-Metrics Summary Box */}
            <div className="grid grid-cols-3 gap-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-center">
              <div>
                <span className="text-xs text-slate-500 block font-medium">Total Tablet</span>
                <span className="text-xl font-extrabold text-slate-900 dark:text-slate-100">
                  {stats?.totalTablets || 0}
                </span>
              </div>
              <div>
                <span className="text-xs text-slate-500 block font-medium">Sudah Diinspeksi</span>
                <span className="text-xl font-extrabold text-emerald-600 dark:text-emerald-400">
                  {stats?.completedInspections || 0}
                </span>
              </div>
              <div>
                <span className="text-xs text-slate-500 block font-medium">Perlu Perbaikan</span>
                <span className="text-xl font-extrabold text-amber-600 dark:text-amber-400">
                  {stats?.damagedTablets || 0}
                </span>
              </div>
            </div>
          </div>
        </GlassCard>

        {/* Device Status Donut Chart */}
        <GlassCard className="p-6 flex flex-col justify-between" glowColor="emerald">
          <div className="border-b border-slate-100 dark:border-slate-800 pb-4 mb-2">
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Zap className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
              <span>Kelayakan Perangkat</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">Proporsi kondisi fisik tablet</p>
          </div>

          <div className="h-[220px] flex items-center justify-center">
            {loading ? (
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
                    paddingAngle={5}
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
                    }}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </GlassCard>
      </div>

      {/* Quick Action Cards Grid */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
          <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
            Aksi Cepat Manajemen Master Data
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Link href="/admin/tablets" className="block">
            <GlassCard className="p-5 flex items-center justify-between group" glowColor="indigo">
              <div className="flex items-center gap-3.5">
                <div className="p-3 rounded-2xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900">
                  <Tablet className="h-6 w-6" />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100">
                    Master Tablet
                  </h4>
                  <span className="text-xs text-slate-500">Kelola unit & QR</span>
                </div>
              </div>
              <ChevronRight className="h-5 w-5 text-slate-400 group-hover:translate-x-1 transition-transform" />
            </GlassCard>
          </Link>

          <Link href="/admin/locations" className="block">
            <GlassCard className="p-5 flex items-center justify-between group" glowColor="emerald">
              <div className="flex items-center gap-3.5">
                <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900">
                  <MapPin className="h-6 w-6" />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100">
                    Master Lokasi
                  </h4>
                  <span className="text-xs text-slate-500">Kelola area gudang</span>
                </div>
              </div>
              <ChevronRight className="h-5 w-5 text-slate-400 group-hover:translate-x-1 transition-transform" />
            </GlassCard>
          </Link>

          <Link href="/admin/users" className="block">
            <GlassCard className="p-5 flex items-center justify-between group" glowColor="sky">
              <div className="flex items-center gap-3.5">
                <div className="p-3 rounded-2xl bg-sky-50 dark:bg-sky-950/50 text-sky-600 dark:text-sky-400 border border-sky-100 dark:border-sky-900">
                  <Users className="h-6 w-6" />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100">
                    Master User
                  </h4>
                  <span className="text-xs text-slate-500">Kelola akun & role</span>
                </div>
              </div>
              <ChevronRight className="h-5 w-5 text-slate-400 group-hover:translate-x-1 transition-transform" />
            </GlassCard>
          </Link>

          <Link href="/admin/periods" className="block">
            <GlassCard className="p-5 flex items-center justify-between group" glowColor="amber">
              <div className="flex items-center gap-3.5">
                <div className="p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 border border-amber-100 dark:border-amber-900">
                  <Calendar className="h-6 w-6" />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100">
                    Periode Inspeksi
                  </h4>
                  <span className="text-xs text-slate-500">Kelola bulan aktif</span>
                </div>
              </div>
              <ChevronRight className="h-5 w-5 text-slate-400 group-hover:translate-x-1 transition-transform" />
            </GlassCard>
          </Link>
        </div>
      </div>
    </div>
  );
}
