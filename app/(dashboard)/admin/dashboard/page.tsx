"use client";

import React, { useState, useEffect } from "react";
import { PageHeader } from "@/components/shared/page-header";
import { StatCard } from "@/components/shared/stat-card";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { dashboardService, AdminDashboardStats } from "@/services/dashboard.service";
import { Tablet, Users, MapPin, AlertTriangle, CheckCircle2, ArrowRight, Shield, Activity, Calendar } from "lucide-react";
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

  return (
    <div className="space-y-8">
      <PageHeader
        title="Admin Control Center"
        description="Ringkasan eksekutif seluruh inventaris tablet, pengguna, lokasi, dan progres inspeksi."
      />

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard
          title="Total Tablet"
          value={loading ? "..." : stats?.totalTablets || 0}
          description="Unit terdaftar"
          icon={Tablet}
          iconColor="text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/50"
        />

        <StatCard
          title="Total Users"
          value={loading ? "..." : stats?.totalUsers || 0}
          description="Akun terdaftar"
          icon={Users}
          iconColor="text-sky-600 dark:text-sky-400 bg-sky-50 dark:bg-sky-950/50"
        />

        <StatCard
          title="Total Lokasi"
          value={loading ? "..." : stats?.totalLocations || 0}
          description="Area operasional"
          icon={MapPin}
          iconColor="text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50"
        />

        <StatCard
          title="Progres Inspeksi"
          value={loading ? "..." : `${stats?.progressPercentage || 0}%`}
          description={stats?.activePeriodName || "Periode Aktif"}
          icon={Activity}
          iconColor="text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/50"
        />

        <StatCard
          title="Tablet Rusak"
          value={loading ? "..." : stats?.damagedTablets || 0}
          description="Perlu maintenance"
          icon={AlertTriangle}
          iconColor="text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/50"
        />
      </div>

      {/* Progress & Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Progress Card */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                  <span>Progres Inspeksi Periode Aktif</span>
                </CardTitle>
                <CardDescription className="mt-1">
                  {stats?.activePeriodName || "Periode Berjalan"}
                </CardDescription>
              </div>
              <span className="text-2xl font-black text-indigo-600 dark:text-indigo-400">
                {stats?.progressPercentage || 0}%
              </span>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <div className="w-full bg-slate-100 dark:bg-slate-800 h-4 rounded-full overflow-hidden p-0.5 border border-slate-200 dark:border-slate-700">
                <div
                  className="bg-gradient-to-r from-indigo-600 to-emerald-500 h-full rounded-full transition-all duration-1000 shadow-sm"
                  style={{ width: `${stats?.progressPercentage || 0}%` }}
                />
              </div>
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span>{stats?.completedInspections || 0} Terinspeksi</span>
                <span>{stats?.totalTablets || 0} Total Unit</span>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 grid grid-cols-3 gap-4 text-center">
              <div>
                <span className="text-xs text-slate-500">Total Unit</span>
                <p className="text-lg font-bold text-slate-900 dark:text-slate-100">
                  {stats?.totalTablets || 0}
                </p>
              </div>
              <div>
                <span className="text-xs text-slate-500">Sudah Diisi</span>
                <p className="text-lg font-bold text-emerald-600">
                  {stats?.completedInspections || 0}
                </p>
              </div>
              <div>
                <span className="text-xs text-slate-500">Rusak / Servis</span>
                <p className="text-lg font-bold text-amber-600">
                  {stats?.damagedTablets || 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Action Shortcuts Card */}
        <Card className="flex flex-col justify-between">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Shield className="h-5 w-5 text-indigo-600" />
              <span>Aksi Cepat Admin</span>
            </CardTitle>
            <CardDescription>Akses langsung ke manajemen master data</CardDescription>
          </CardHeader>

          <CardContent className="space-y-3">
            <Link href="/admin/tablets" className="block">
              <Button variant="outline" className="w-full justify-between hover:bg-indigo-50 dark:hover:bg-indigo-950">
                <span className="flex items-center gap-2">
                  <Tablet className="h-4 w-4 text-indigo-600" />
                  <span>Kelola Master Tablet</span>
                </span>
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>

            <Link href="/admin/locations" className="block">
              <Button variant="outline" className="w-full justify-between hover:bg-emerald-50 dark:hover:bg-emerald-950">
                <span className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-emerald-600" />
                  <span>Kelola Lokasi Area</span>
                </span>
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>

            <Link href="/admin/users" className="block">
              <Button variant="outline" className="w-full justify-between hover:bg-sky-50 dark:hover:bg-sky-950">
                <span className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-sky-600" />
                  <span>Kelola Akun Pengguna</span>
                </span>
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>

            <Link href="/admin/periods" className="block">
              <Button variant="outline" className="w-full justify-between hover:bg-amber-50 dark:hover:bg-amber-950">
                <span className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-amber-600" />
                  <span>Kelola Periode Inspeksi</span>
                </span>
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
