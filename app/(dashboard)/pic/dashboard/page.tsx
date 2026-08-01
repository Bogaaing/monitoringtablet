"use client";

import React, { useState, useEffect } from "react";
import { PageHeader } from "@/components/shared/page-header";
import { StatGradientCard } from "@/components/dashboard/stat-gradient-card";
import { GlassCard } from "@/components/dashboard/glass-card";
import { StatusBadge } from "@/components/shared/status-badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { dashboardService, PicDashboardStats } from "@/services/dashboard.service";
import { Tablet, CheckCircle2, Clock, QrCode, ArrowRight, Activity, MapPin, Sparkles } from "lucide-react";
import Link from "next/link";

export default function PicDashboardPage() {
  const [stats, setStats] = useState<PicDashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    dashboardService.getPicStats("20000000-0000-0000-0000-000000000002").then((res) => {
      setStats(res);
      setLoading(false);
    });
  }, []);

  return (
    <div className="space-y-8">
      {/* Interactive Glowing Scan Hero Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-indigo-950 via-slate-900 to-slate-950 p-8 text-white shadow-2xl border border-indigo-900/50">
        <div className="absolute top-0 right-0 -mt-12 -mr-12 w-96 h-96 rounded-full bg-gradient-to-br from-indigo-500/20 to-emerald-500/0 blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-2 text-center md:text-left">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 text-xs font-bold uppercase tracking-wider backdrop-blur-md">
              <Sparkles className="h-3.5 w-3.5 text-indigo-400 animate-pulse" />
              <span>Dashboard Kepala Regu (PIC)</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-black text-white tracking-tight">
              Siap Inspeksi Tablet Hari Ini?
            </h1>
            <p className="text-sm text-slate-300 max-w-lg">
              Pindai QR Code pada fisik tablet menggunakan kamera perangkat Anda untuk mengisi formulir inspeksi bulanan.
            </p>
          </div>

          {/* Prominent Glowing Scan Button */}
          <Link href="/pic/scan" className="relative z-10 shrink-0">
            <Button
              size="lg"
              className="gap-3.5 bg-gradient-to-r from-indigo-500 via-purple-600 to-emerald-500 hover:from-indigo-600 hover:to-emerald-600 text-white font-extrabold px-8 py-7 rounded-2xl shadow-xl hover:shadow-indigo-500/30 hover:scale-105 transition-all text-base border border-white/20"
            >
              <QrCode className="h-6 w-6 animate-pulse" />
              <span>Scan QR Code Tablet</span>
            </Button>
          </Link>
        </div>
      </div>

      <PageHeader
        title="Ringkasan Inspeksi Saya"
        description="Pantau status unit tablet yang ditugaskan pada area operasional Anda."
      />

      {/* 3 Stat Gradient Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <StatGradientCard
          title="Assigned Tablets"
          value={loading ? "..." : stats?.assignedTabletsCount || 0}
          description="Tablet di area penugasan"
          icon={Tablet}
          gradient="indigo"
          badgeText="Total Unit"
        />

        <StatGradientCard
          title="Completed"
          value={loading ? "..." : stats?.completedCount || 0}
          description="Sudah di-inspeksi"
          icon={CheckCircle2}
          gradient="emerald"
          badgeText="Selesai"
        />

        <StatGradientCard
          title="Remaining"
          value={loading ? "..." : stats?.remainingCount || 0}
          description="Belum di-inspeksi"
          icon={Clock}
          gradient="amber"
          badgeText="Belum Diisi"
        />
      </div>

      {/* Recent Inspections Section */}
      <GlassCard className="p-6" glowColor="indigo">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4 mb-4">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Activity className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
              <span>Inspeksi Terbaru Saya</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Daftar pengajuan inspeksi tablet yang baru dikirimkan
            </p>
          </div>

          <Link href="/pic/inspections">
            <Button variant="ghost" size="sm" className="gap-1.5 text-xs text-indigo-600 hover:bg-indigo-50">
              <span>Lihat Seluruh Riwayat</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          </Link>
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Kode Tablet</TableHead>
                <TableHead>Model / Merk</TableHead>
                <TableHead>Lokasi Area</TableHead>
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
                  <TableRow key={ins.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors">
                    <TableCell className="font-mono font-bold text-indigo-600 dark:text-indigo-400">
                      {ins.tablet?.qr_code || "QR-TAB-001"}
                    </TableCell>
                    <TableCell className="text-sm font-medium">
                      {ins.tablet?.model || "Galaxy Tab Active 3"}
                    </TableCell>
                    <TableCell className="text-xs text-slate-600 dark:text-slate-400">
                      <span className="inline-flex items-center gap-1.5">
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
        </div>
      </GlassCard>
    </div>
  );
}
