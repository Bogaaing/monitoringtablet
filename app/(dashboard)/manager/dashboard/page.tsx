"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { dashboardService, ManagerDashboardStats } from "@/services/dashboard.service";
import { StatusBadge } from "@/components/shared/status-badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
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
} from "recharts";
import {
  Clock,
  CheckCircle2,
  XCircle,
  Activity,
  ArrowRight,
  ChevronDown,
  FileSpreadsheet,
  ShieldCheck,
  MapPin,
  PieChart as PieChartIcon,
} from "lucide-react";

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

  // Compute status proportion percentages for Donut Chart Legend
  const totalSub = stats?.totalSubmittedCount || 0;
  const approvedCount = stats?.approvedCount || 0;
  const pendingCount = stats?.waitingApprovalCount || 0;
  const rejectedCount = stats?.rejectedCount || 0;

  const approvedPct = totalSub > 0 ? Math.round((approvedCount / totalSub) * 100) : 0;
  const pendingPct = totalSub > 0 ? Math.round((pendingCount / totalSub) * 100) : 0;
  const rejectedPct = totalSub > 0 ? Math.round((rejectedCount / totalSub) * 100) : 0;

  const donutData = [
    { name: "Disetujui (Approved)", value: approvedCount, color: "#10B981" },
    { name: "Menunggu (Pending)", value: pendingCount, color: "#F59E0B" },
    { name: "Ditolak (Rejected)", value: rejectedCount, color: "#EF4444" },
  ];

  const fadeUp = {
    initial: { opacity: 0, y: 12 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.2 },
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] -m-4 md:-m-8 p-4 md:p-8 space-y-6">
      
      {/* ==================== HEADER SECTION ==================== */}
      <motion.div {...fadeUp} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-[34px] font-bold text-[#111827] tracking-tight leading-tight">
            Dashboard Manager
          </h1>
          <p className="text-[16px] text-[#64748B] font-normal mt-1">
            {loading ? "Memuat data persetujuan..." : `${stats?.waitingApprovalCount || 0} inspeksi menunggu persetujuan hari ini.`}
          </p>
        </div>

        {/* Header Actions */}
        <div className="flex items-center gap-3">
          {/* Secondary Outline Export Button */}
          <Link href="/reports">
            <Button
              variant="outline"
              className="bg-white border border-[#ECEEF5] text-slate-700 hover:bg-slate-50 font-semibold px-4 py-2.5 rounded-xl shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow"
            >
              <FileSpreadsheet className="h-4 w-4 mr-2 text-slate-500" />
              <span>Export</span>
            </Button>
          </Link>

          {/* Primary Review Approval Button */}
          <Link href="/manager/approvals">
            <Button className="bg-[#4F46E5] hover:bg-[#4338CA] text-white font-bold px-5 py-2.5 rounded-xl shadow-md shadow-indigo-600/20 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg flex items-center gap-2">
              <ShieldCheck className="h-4 w-4" />
              <span>Review Approval</span>
              <span className="bg-white/20 text-white text-xs font-bold px-2 py-0.5 rounded-full ml-1">
                {stats?.waitingApprovalCount || 0} Pending
              </span>
            </Button>
          </Link>
        </div>
      </motion.div>

      {/* ==================== 4 KPI CARDS ==================== */}
      <motion.div {...fadeUp} transition={{ duration: 0.2, delay: 0.05 }} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        
        {/* KPI 1: Waiting Approval */}
        <div className="bg-white border border-[#ECEEF5] rounded-[20px] p-6 shadow-[0_8px_24px_rgba(15,23,42,0.06)] hover:-translate-y-0.5 transition-all duration-200">
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Clock className="h-5 w-5" />
            </div>
            <span className="bg-amber-50 text-amber-700 border border-amber-200/60 rounded-full px-2.5 py-0.5 text-xs font-semibold">
              Perlu Review
            </span>
          </div>
          <div className="text-[34px] font-extrabold text-[#111827] mt-3 mb-1">
            {loading ? "..." : stats?.waitingApprovalCount || 0}
          </div>
          <div className="text-[14px] font-medium text-[#64748B]">
            Waiting Approval
          </div>
        </div>

        {/* KPI 2: Approved */}
        <div className="bg-white border border-[#ECEEF5] rounded-[20px] p-6 shadow-[0_8px_24px_rgba(15,23,42,0.06)] hover:-translate-y-0.5 transition-all duration-200">
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="h-5 w-5" />
            </div>
            <span className="bg-emerald-50 text-emerald-700 border border-emerald-200/60 rounded-full px-2.5 py-0.5 text-xs font-semibold">
              Disetujui
            </span>
          </div>
          <div className="text-[34px] font-extrabold text-[#111827] mt-3 mb-1">
            {loading ? "..." : stats?.approvedCount || 0}
          </div>
          <div className="text-[14px] font-medium text-[#64748B]">
            Approved
          </div>
        </div>

        {/* KPI 3: Rejected */}
        <div className="bg-white border border-[#ECEEF5] rounded-[20px] p-6 shadow-[0_8px_24px_rgba(15,23,42,0.06)] hover:-translate-y-0.5 transition-all duration-200">
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
              <XCircle className="h-5 w-5" />
            </div>
            <span className="bg-rose-50 text-rose-700 border border-rose-200/60 rounded-full px-2.5 py-0.5 text-xs font-semibold">
              Ditolak
            </span>
          </div>
          <div className="text-[34px] font-extrabold text-[#111827] mt-3 mb-1">
            {loading ? "..." : stats?.rejectedCount || 0}
          </div>
          <div className="text-[14px] font-medium text-[#64748B]">
            Rejected
          </div>
        </div>

        {/* KPI 4: Total Submitted */}
        <div className="bg-white border border-[#ECEEF5] rounded-[20px] p-6 shadow-[0_8px_24px_rgba(15,23,42,0.06)] hover:-translate-y-0.5 transition-all duration-200">
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Activity className="h-5 w-5" />
            </div>
            <span className="bg-indigo-50 text-indigo-700 border border-indigo-200/60 rounded-full px-2.5 py-0.5 text-xs font-semibold">
              Total Input
            </span>
          </div>
          <div className="text-[34px] font-extrabold text-[#111827] mt-3 mb-1">
            {loading ? "..." : stats?.totalSubmittedCount || 0}
          </div>
          <div className="text-[14px] font-medium text-[#64748B]">
            Total Submitted
          </div>
        </div>

      </motion.div>

      {/* ==================== CHARTS GRID ==================== */}
      <motion.div {...fadeUp} transition={{ duration: 0.2, delay: 0.1 }} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Progress by Location Bar Chart (2 columns) */}
        <div className="lg:col-span-2 bg-white border border-[#ECEEF5] rounded-[20px] p-6 shadow-[0_8px_24px_rgba(15,23,42,0.06)]">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
            <div>
              <h3 className="text-[16px] font-semibold text-[#111827] flex items-center gap-2">
                <MapPin className="h-4 w-4 text-[#4F46E5]" />
                <span>Progress by Location</span>
              </h3>
              <p className="text-[12px] text-[#64748B] mt-0.5">
                Jumlah tablet disetujui vs menunggu per lokasi
              </p>
            </div>

            {/* Period Selector inside chart header */}
            <div className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs font-medium text-slate-700 flex items-center gap-1.5 hover:bg-slate-100 transition-colors cursor-pointer select-none">
              <span>Agustus 2026</span>
              <ChevronDown className="h-3.5 w-3.5 text-slate-500" />
            </div>
          </div>

          <div className="h-[250px] w-full pt-1">
            {!mounted || loading ? (
              <div className="h-full flex items-center justify-center text-slate-400 text-xs">
                Memuat grafik lokasi...
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={stats?.locationProgress || []}
                  margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.15} />
                  <XAxis dataKey="locationName" tick={{ fontSize: 11, fill: "#64748B" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: "#64748B" }} axisLine={false} tickLine={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#1E293B",
                      color: "#FFFFFF",
                      borderRadius: "12px",
                      border: "none",
                      boxShadow: "0 10px 25px -5px rgba(0,0,0,0.2)",
                    }}
                  />
                  <Bar dataKey="completed" name="Disetujui (Approved)" fill="#4F46E5" radius={[6, 6, 0, 0]} />
                  <Bar dataKey="pending" name="Menunggu (Pending)" fill="#F59E0B" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Donut Chart with Legend on the Right */}
        <div className="bg-white border border-[#ECEEF5] rounded-[20px] p-6 shadow-[0_8px_24px_rgba(15,23,42,0.06)] flex flex-col justify-between">
          <div className="border-b border-slate-100 pb-4 mb-2">
            <h3 className="text-[16px] font-semibold text-[#111827] flex items-center gap-2">
              <PieChartIcon className="h-4 w-4 text-[#4F46E5]" />
              <span>Status Distribution</span>
            </h3>
            <p className="text-[12px] text-[#64748B] mt-0.5">Proporsi status review inspeksi</p>
          </div>

          <div className="flex-1 flex flex-col sm:flex-row items-center justify-between gap-4 py-2">
            {/* Donut Chart Canvas */}
            <div className="w-full sm:w-[55%] h-[180px] flex items-center justify-center">
              {!mounted || loading ? (
                <div className="text-slate-400 text-xs">Memuat status...</div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={donutData}
                      cx="50%"
                      cy="50%"
                      innerRadius={48}
                      outerRadius={72}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {donutData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#1E293B",
                        color: "#FFFFFF",
                        borderRadius: "12px",
                        border: "none",
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>

            {/* Legend on the Right */}
            <div className="w-full sm:w-[45%] flex flex-col justify-center space-y-3 pl-2">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-[#10B981] shrink-0" />
                  <span className="font-medium text-slate-700">Approved</span>
                </div>
                <span className="font-bold text-slate-900">{approvedCount} ({approvedPct}%)</span>
              </div>

              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-[#F59E0B] shrink-0" />
                  <span className="font-medium text-slate-700">Pending</span>
                </div>
                <span className="font-bold text-slate-900">{pendingCount} ({pendingPct}%)</span>
              </div>

              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-[#EF4444] shrink-0" />
                  <span className="font-medium text-slate-700">Rejected</span>
                </div>
                <span className="font-bold text-slate-900">{rejectedCount} ({rejectedPct}%)</span>
              </div>
            </div>
          </div>

          {/* Total Inspections Under Chart */}
          <div className="pt-3 border-t border-slate-100 text-center">
            <p className="text-[12px] font-semibold text-[#64748B]">
              Total: <span className="text-[#111827] font-bold">{totalSub} Inspeksi</span>
            </p>
          </div>
        </div>

      </motion.div>

      {/* ==================== RECENT APPROVAL TABLE SECTION ==================== */}
      <motion.div {...fadeUp} transition={{ duration: 0.2, delay: 0.15 }} className="bg-white border border-[#ECEEF5] rounded-[20px] p-6 shadow-[0_8px_24px_rgba(15,23,42,0.06)]">
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4 mb-4">
          <div>
            <h2 className="text-[24px] font-bold text-[#111827]">
              Approval Terbaru
            </h2>
            <p className="text-[14px] text-[#64748B] mt-0.5">
              Inspeksi terbaru yang menunggu persetujuan.
            </p>
          </div>

          <Link href="/manager/approvals">
            <Button variant="ghost" size="sm" className="gap-1.5 text-xs text-[#4F46E5] hover:bg-indigo-50 font-semibold">
              <span>Buka Semua Approval</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          </Link>
        </div>

        {/* Clean Table */}
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-b border-slate-100 hover:bg-transparent">
                <TableHead className="text-xs font-semibold text-slate-500">Inspection ID</TableHead>
                <TableHead className="text-xs font-semibold text-slate-500">Location</TableHead>
                <TableHead className="text-xs font-semibold text-slate-500">Area</TableHead>
                <TableHead className="text-xs font-semibold text-slate-500">Submitted By</TableHead>
                <TableHead className="text-xs font-semibold text-slate-500">Date</TableHead>
                <TableHead className="text-xs font-semibold text-slate-500">Status</TableHead>
                <TableHead className="text-xs font-semibold text-slate-500 text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-slate-400 text-xs">
                    Memuat antrean persetujuan...
                  </TableCell>
                </TableRow>
              ) : !stats?.recentInspections || stats.recentInspections.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-slate-400 text-xs">
                    Tidak ada inspeksi yang membutuhkan approval.
                  </TableCell>
                </TableRow>
              ) : (
                stats.recentInspections.map((ins) => (
                  <TableRow key={ins.id} className="hover:bg-slate-50/70 border-b border-slate-100 transition-colors">
                    {/* Inspection ID */}
                    <TableCell className="font-mono font-bold text-xs text-[#4F46E5]">
                      {ins.tablet?.qr_code || "QR-TAB-001"}
                    </TableCell>

                    {/* Location */}
                    <TableCell className="text-sm font-semibold text-slate-800">
                      {ins.tablet?.location?.name || "Gudang Utama A"}
                    </TableCell>

                    {/* Area */}
                    <TableCell className="text-xs text-slate-500">
                      {(ins.tablet?.location as any)?.area || ins.tablet?.location?.address || "Area Pabrik 1"}
                    </TableCell>

                    {/* Submitted By */}
                    <TableCell className="text-sm text-slate-700 font-medium">
                      {ins.pic?.name || "PIC Penguji"}
                    </TableCell>

                    {/* Date */}
                    <TableCell className="text-xs font-mono text-slate-500">
                      {new Date(ins.submitted_at).toLocaleDateString("id-ID", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </TableCell>

                    {/* Status */}
                    <TableCell>
                      <StatusBadge status={ins.status} />
                    </TableCell>

                    {/* Action Button: Review → */}
                    <TableCell className="text-right">
                      <Link href="/manager/approvals">
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-xs gap-1 text-[#4F46E5] hover:bg-indigo-50 border-indigo-200 font-semibold rounded-lg"
                        >
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

      </motion.div>

    </div>
  );
}
