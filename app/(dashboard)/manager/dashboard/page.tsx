"use client";

import React, { useState, useEffect } from "react";
import { PageHeader } from "@/components/shared/page-header";
import { StatCard } from "@/components/shared/stat-card";
import { StatusBadge } from "@/components/shared/status-badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
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
import { Clock, CheckCircle2, XCircle, ArrowRight, Activity, MapPin, Layers } from "lucide-react";
import Link from "next/link";

export default function ManagerDashboardPage() {
  const [stats, setStats] = useState<ManagerDashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    dashboardService.getManagerStats().then((res) => {
      setStats(res);
      setLoading(false);
    });
  }, []);

  return (
    <div className="space-y-8">
      <PageHeader
        title="Manager Approval & Operations Dashboard"
        description="Pantau progres inspeksi tablet per lokasi, antrean persetujuan, dan statistik kelayakan perangkat."
      />

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Waiting Approval"
          value={loading ? "..." : stats?.waitingApprovalCount || 0}
          description="Antrean perlu review"
          icon={Clock}
          iconColor="text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/50"
        />

        <StatCard
          title="Approved"
          value={loading ? "..." : stats?.approvedCount || 0}
          description="Telah disetujui"
          icon={CheckCircle2}
          iconColor="text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50"
        />

        <StatCard
          title="Rejected"
          value={loading ? "..." : stats?.rejectedCount || 0}
          description="Ditolak / Perlu perbaikan"
          icon={XCircle}
          iconColor="text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/50"
        />

        <StatCard
          title="Total Submitted"
          value={loading ? "..." : stats?.totalSubmittedCount || 0}
          description="Inspeksi dikirimkan"
          icon={Activity}
          iconColor="text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/50"
        />
      </div>

      {/* Recharts Data Visualization Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Progress by Location Bar Chart */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <MapPin className="h-5 w-5 text-indigo-600" />
              <span>Progress by Location (Progres per Lokasi)</span>
            </CardTitle>
            <CardDescription>
              Jumlah tablet yang telah disetujui (Completed) vs Menunggu (Pending) per lokasi area
            </CardDescription>
          </CardHeader>
          <CardContent className="h-[320px] pt-4">
            {loading ? (
              <div className="h-full flex items-center justify-center text-slate-400">
                Memuat grafik lokasi...
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={stats?.locationProgress || []}
                  margin={{ top: 10, right: 30, left: 0, bottom: 20 }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
                  <XAxis dataKey="locationName" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#0f172a",
                      color: "#fff",
                      borderRadius: "12px",
                      border: "none",
                      boxShadow: "0 10px 15px -3px rgba(0,0,0,0.3)",
                    }}
                  />
                  <Legend />
                  <Bar dataKey="completed" name="Disetujui (Approved)" fill="#10b981" radius={[6, 6, 0, 0]} />
                  <Bar dataKey="pending" name="Menunggu / Belum" fill="#f59e0b" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Approval Status Pie Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Layers className="h-5 w-5 text-indigo-600" />
              <span>Status Distribution</span>
            </CardTitle>
            <CardDescription>Proporsi status review inspeksi</CardDescription>
          </CardHeader>
          <CardContent className="h-[320px] flex flex-col items-center justify-center">
            {loading ? (
              <div className="text-slate-400">Memuat distribusi status...</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={stats?.statusDistribution || []}
                    cx="50%"
                    cy="45%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={4}
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
                    }}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity Table */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-base">Antrean Approval & Aktivitas Terbaru</CardTitle>
            <CardDescription>Inspeksi terkini yang membutuhkan tindakan persetujuan Manager</CardDescription>
          </div>
          <Link href="/manager/approvals">
            <Button variant="ghost" size="sm" className="gap-1.5 text-xs text-indigo-600">
              <span>Buka Menu Approval</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          </Link>
        </CardHeader>
        <CardContent className="p-0">
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
                  <TableRow key={ins.id}>
                    <TableCell className="font-mono font-bold text-indigo-600">
                      {ins.tablet?.qr_code || "QR-TAB-001"}
                    </TableCell>
                    <TableCell className="text-sm">
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
                        <Button size="sm" variant="outline" className="text-xs gap-1 text-indigo-600">
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
        </CardContent>
      </Card>
    </div>
  );
}
