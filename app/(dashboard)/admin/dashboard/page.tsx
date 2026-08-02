"use client";

import React, { useState, useEffect } from "react";
import { PageHeader } from "@/components/shared/page-header";
import { StatGradientCard } from "@/components/dashboard/stat-gradient-card";
import { GlassCard } from "@/components/dashboard/glass-card";
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
  Activity,
  Calendar,
  Zap,
  ChevronRight,
  Shield,
} from "lucide-react";
import Link from "next/link";

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<AdminDashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
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
    <div className="space-y-6">
      {/* Top Page Header */}
      <PageHeader
        title="Dashboard System Overview"
        description="Ringkasan real-time inventaris tablet, sebaran lokasi operasional, dan status progres pengujian bulanan."
      />

      {/* 5 KPI Summary Cards Grid */}
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

      {/* Visualizations Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Inspection Progress Card */}
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
