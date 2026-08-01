"use client";

import React, { useState, useEffect } from "react";
import { PageHeader } from "@/components/shared/page-header";
import { StatCard } from "@/components/shared/stat-card";
import { StatusBadge } from "@/components/shared/status-badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { dashboardService, PicDashboardStats } from "@/services/dashboard.service";
import { Tablet, CheckCircle2, Clock, QrCode, ArrowRight, Activity, MapPin } from "lucide-react";
import Link from "next/link";

export default function PicDashboardPage() {
  const [stats, setStats] = useState<PicDashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    dashboardService.getPicStats("user-pic-1").then((res) => {
      setStats(res);
      setLoading(false);
    });
  }, []);

  return (
    <div className="space-y-8">
      {/* Top Banner with Prominent Scan QR Button */}
      <div className="bg-gradient-to-r from-indigo-900 via-slate-900 to-indigo-950 text-white rounded-3xl p-6 md:p-8 shadow-xl flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden">
        <div className="space-y-2 text-center md:text-left relative z-10">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 text-xs font-bold uppercase tracking-wider">
            <Activity className="h-3.5 w-3.5" />
            <span>Dashboard Kepala Regu (PIC)</span>
          </div>
          <h2 className="text-2xl md:text-3xl font-extrabold text-white">
            Siap Melakukan Inspeksi Tablet?
          </h2>
          <p className="text-sm text-slate-300 max-w-lg">
            Pindai QR Code pada fisik tablet menggunakan kamera perangkat Anda untuk mengisi formulir inspeksi bulanan.
          </p>
        </div>

        {/* Prominent Scan Button */}
        <Link href="/pic/scan" className="relative z-10 shrink-0">
          <Button
            size="lg"
            className="gap-3 bg-gradient-to-r from-indigo-500 to-emerald-500 hover:from-indigo-600 hover:to-emerald-600 text-white font-extrabold px-8 py-6 rounded-2xl shadow-xl hover:scale-105 transition-all text-base"
          >
            <QrCode className="h-6 w-6" />
            <span>Scan QR Code Tablet</span>
          </Button>
        </Link>
      </div>

      <PageHeader
        title="Ringkasan Inspeksi Saya"
        description="Pantau status unit tablet yang ditugaskan pada area operasional Anda."
      />

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <StatCard
          title="Assigned Tablets"
          value={loading ? "..." : stats?.assignedTabletsCount || 0}
          description="Tablet di area penugasan"
          icon={Tablet}
          iconColor="text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/50"
        />

        <StatCard
          title="Completed"
          value={loading ? "..." : stats?.completedCount || 0}
          description="Sudah di-inspeksi"
          icon={CheckCircle2}
          iconColor="text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50"
        />

        <StatCard
          title="Remaining"
          value={loading ? "..." : stats?.remainingCount || 0}
          description="Belum di-inspeksi"
          icon={Clock}
          iconColor="text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/50"
        />
      </div>

      {/* Recent Inspection Table */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-base">Recent Inspection</CardTitle>
            <CardDescription>Daftar inspeksi terbaru yang telah Anda kirimkan</CardDescription>
          </div>
          <Link href="/pic/inspections">
            <Button variant="ghost" size="sm" className="gap-1.5 text-xs text-indigo-600">
              <span>Lihat Semua</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          </Link>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Kode Tablet</TableHead>
                <TableHead>Model / Merk</TableHead>
                <TableHead>Lokasi</TableHead>
                <TableHead>Waktu Kirim</TableHead>
                <TableHead>Status Review</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-slate-500">
                    Memuat inspeksi terbaru...
                  </TableCell>
                </TableRow>
              ) : !stats?.recentInspections || stats.recentInspections.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-slate-500">
                    Belum ada inspeksi yang dikirimkan periode ini.
                  </TableCell>
                </TableRow>
              ) : (
                stats.recentInspections.map((ins) => (
                  <TableRow key={ins.id}>
                    <TableCell className="font-mono font-bold text-indigo-600">
                      {ins.tablet?.qr_code || "QR-TAB-001"}
                    </TableCell>
                    <TableCell className="text-sm">
                      {ins.tablet?.model || "Galaxy Tab Active 3"}
                    </TableCell>
                    <TableCell className="text-xs text-slate-600 dark:text-slate-400">
                      <span className="inline-flex items-center gap-1">
                        <MapPin className="h-3.5 w-3.5 text-indigo-500" />
                        <span>{ins.tablet?.location?.name || "Gudang Utama A"}</span>
                      </span>
                    </TableCell>
                    <TableCell className="text-xs font-mono text-slate-500">
                      {new Date(ins.submitted_at).toLocaleTimeString("id-ID", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={ins.status} />
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
