"use client";

import React, { useState, useEffect } from "react";
import { PageHeader } from "@/components/shared/page-header";
import { StatGradientCard } from "@/components/dashboard/stat-gradient-card";
import { GlassCard } from "@/components/dashboard/glass-card";
import { StatusBadge } from "@/components/shared/status-badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { dashboardService, ManagerDashboardStats } from "@/services/dashboard.service";
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
import { Clock, CheckCircle2, XCircle, ArrowRight, Activity, MapPin, Layers, ShieldCheck } from "lucide-react";
import Link from "next/link";

export default function ManagerDashboardPage() {
  const [stats, setStats] = useState<ManagerDashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    dashboardService.getManagerStats().then((res) => {
      setStats(res);
      setLoading(false);
    });
  }, []);

  return (
    <div className="space-y-6">
      {/* Top Page Header with Action Button */}
      <PageHeader
        title="Dashboard Operations Manager"
        description="Analisis grafik progres inspeksi per lokasi area dan verifikasi status persetujuan pengujian."
      >
        <Link href="/manager/approvals">
          <Button className="gap-2 bg-amber-600 hover:bg-amber-700 text-white font-bold px-5 py-2.5">
            <ShieldCheck className="h-4 w-4" />
            <span>Buka Menu Approval ({stats?.waitingApprovalCount || 0})</span>
          </Button>
        </Link>
      </PageHeader>

      {/* 4 KPI Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatGradientCard
          title="Waiting Approval"
          value={loading ? "..." : stats?.waitingApprovalCount || 0}
          description="Antrean perlu review"
          icon={Clock}
          gradient="amber"
          badgeText="Perlu Action"
        />

        <StatGradientCard
          title="Approved"
          value={loading ? "..." : stats?.approvedCount || 0}
          description="Telah disetujui"
          icon={CheckCircle2}
          gradient="emerald"
          badgeText="Disetujui"
        />

        <StatGradientCard
          title="Rejected"
          value={loading ? "..." : stats?.rejectedCount || 0}
          description="Ditolak / Perlu perbaikan"
          icon={XCircle}
          gradient="rose"
          badgeText="Ditolak"
        />

        <StatGradientCard
          title="Total Submitted"
          value={loading ? "..." : stats?.totalSubmittedCount || 0}
          description="Inspeksi dikirimkan"
          icon={Activity}
          gradient="indigo"
          badgeText="Total Input"
        />
      </div>

      {/* Recharts 3 Visualizations Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Progress by Location Bar Chart */}
        <GlassCard className="lg:col-span-2 p-6" glowColor="indigo">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4 mb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <MapPin className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                <span>Progress by Location (Progres per Lokasi)</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Jumlah tablet yang telah disetujui (Completed) vs Menunggu (Pending) per lokasi area
              </p>
            </div>
          </div>

          <div className="h-[300px] pt-2">
            {!mounted || loading ? (
              <div className="h-full flex items-center justify-center text-slate-400 text-xs">
                Memuat grafik lokasi...
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={stats?.locationProgress || []}
                  margin={{ top: 10, right: 30, left: 0, bottom: 20 }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.2} />
                  <XAxis dataKey="locationName" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#0f172a",
                      color: "#fff",
                      borderRadius: "14px",
                      border: "none",
                      boxShadow: "0 10px 25px -5px rgba(0,0,0,0.3)",
                    }}
                  />
                  <Legend />
                  <Bar dataKey="completed" name="Disetujui (Approved)" fill="#10b981" radius={[6, 6, 0, 0]} />
                  <Bar dataKey="pending" name="Menunggu / Belum" fill="#f59e0b" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </GlassCard>

        {/* Status Proportion Pie Chart */}
        <GlassCard className="p-6 flex flex-col justify-between" glowColor="amber">
          <div className="border-b border-slate-100 dark:border-slate-800 pb-4 mb-2">
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Layers className="h-5 w-5 text-amber-500" />
              <span>Status Distribution</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">Proporsi status review inspeksi</p>
          </div>

          <div className="h-[280px] flex items-center justify-center">
            {!mounted || loading ? (
              <div className="text-slate-400 text-xs">Memuat distribusi status...</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={stats?.statusDistribution || []}
                    cx="50%"
                    cy="45%"
                    innerRadius={55}
                    outerRadius={85}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {(stats?.statusDistribution || []).map((entry, index) => (
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

      {/* Recent Activity Feed */}
      <GlassCard className="p-6" glowColor="indigo">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4 mb-4">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Clock className="h-5 w-5 text-amber-500" />
              <span>Antrean Approval & Aktivitas Terbaru</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Inspeksi terkini yang membutuhkan tindakan persetujuan Manager
            </p>
          </div>

          <Link href="/manager/approvals">
            <Button variant="ghost" size="sm" className="gap-1.5 text-xs text-indigo-600 hover:bg-indigo-50">
              <span>Buka Menu Approval</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          </Link>
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Kode Tablet</TableHead>
                <TableHead>Pengirim (PIC)</TableHead>
                <TableHead>Lokasi Area</TableHead>
                <TableHead>Waktu Kirim</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-slate-500">
                    Memuat antrean persetujuan...
                  </TableCell>
                </TableRow>
              ) : !stats?.recentInspections || stats.recentInspections.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-slate-500">
                    Tidak ada inspeksi dalam antrean.
                  </TableCell>
                </TableRow>
              ) : (
                stats.recentInspections.map((ins) => (
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
                    <TableCell className="text-xs font-mono text-slate-500">
                      {new Date(ins.submitted_at).toLocaleDateString("id-ID", {
                        day: "numeric",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={ins.status} />
                    </TableCell>
                    <TableCell className="text-right">
                      <Link href="/manager/approvals">
                        <Button size="sm" variant="outline" className="text-xs gap-1 text-indigo-600 hover:bg-indigo-50">
                          <span>Review</span>
                          <ArrowRight className="h-3.5 w-3.5" />
                        </Button>
                      </Link>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </GlassCard>
    </div>
  );
}
