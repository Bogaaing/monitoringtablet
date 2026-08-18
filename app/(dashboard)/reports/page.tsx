"use client";

import React, { useState, useEffect } from "react";
import { PageHeader } from "@/components/shared/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { periodsService } from "@/services/periods.service";
import { locationsService } from "@/services/locations.service";
import { usersService } from "@/services/users.service";
import { authService } from "@/services/auth.service";
import {
  reportsService,
  InspectionSummaryData,
  ApprovalSummaryData,
  ReportFilterOptions,
} from "@/services/reports.service";
import { Tablet, User } from "@/types";
import { Inspection } from "@/services/inspections.service";
import { exportToExcel, exportToPdf } from "@/lib/export-utils";
import { QRCodeSVG } from "qrcode.react";
import {
  FileSpreadsheet,
  Printer,
  Filter,
  MapPin,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Activity,
  History,
  Tablet as TabletIcon,
  Check,
  TrendingUp,
  Calendar as CalendarIcon,
  User as UserIcon,
  Shield,
  FileText,
} from "lucide-react";

export default function ReportsPage() {
  const [activeTab, setActiveTab] = useState<"summary" | "damaged" | "approval" | "history">("summary");

  // Filter states
  const [filters, setFilters] = useState<ReportFilterOptions>({
    periodId: "all",
    locationId: "all",
    picId: "all",
    status: "all",
  });

  // Master dropdown data
  const [periods, setPeriods] = useState<any[]>([]);
  const [locations, setLocations] = useState<any[]>([]);
  const [pics, setPics] = useState<any[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  // Report datasets
  const [summaryData, setSummaryData] = useState<InspectionSummaryData[]>([]);
  const [damagedData, setDamagedData] = useState<Tablet[]>([]);
  const [approvalData, setApprovalData] = useState<ApprovalSummaryData | null>(null);
  const [historyData, setHistoryData] = useState<Inspection[]>([]);
  const [loading, setLoading] = useState(true);

  // Print timestamps (client-only to avoid hydration mismatch)
  const [currentDateStr, setCurrentDateStr] = useState("17 Agustus 2026");
  const [currentTimeStr, setCurrentTimeStr] = useState("21:41 WIB");

  // Fetch Master Filter Options & User Profile
  useEffect(() => {
    Promise.all([
      periodsService.getAllPeriods(),
      locationsService.getAllLocations(),
      usersService.getUsers({ role: "pic", limit: 100 }),
      authService.getCurrentProfile(),
    ]).then(([pList, lList, uRes, userProf]) => {
      setPeriods(pList);
      setLocations(lList);
      setPics(uRes.data);
      setCurrentUser(userProf);
    });

    const now = new Date();
    setCurrentDateStr(
      now.toLocaleDateString("id-ID", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    );
    setCurrentTimeStr(
      now.toLocaleTimeString("id-ID", {
        hour: "2-digit",
        minute: "2-digit",
      }) + " WIB"
    );
  }, []);

  // Fetch Report Data on Filter or Tab Change
  const fetchReportData = async () => {
    setLoading(true);
    try {
      const [sum, dam, app, hist] = await Promise.all([
        reportsService.getInspectionSummary(filters),
        reportsService.getDamagedTablets(filters),
        reportsService.getApprovalSummary(filters),
        reportsService.getInspectionHistory(filters),
      ]);
      setSummaryData(sum);
      setDamagedData(dam);
      setApprovalData(app);
      setHistoryData(hist);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReportData();
  }, [filters]);

  const handleExportExcel = () => {
    let exportDataset: Record<string, any>[] = [];
    let filename = `Laporan_Monitoring_Tablet_${activeTab}.xlsx`;

    if (activeTab === "summary") {
      exportDataset = summaryData.map((d) => ({
        "Nama Lokasi": d.locationName,
        "Total Tablet": d.totalTablets,
        "Sudah Diisi": d.completed,
        "Belum Diisi": d.pending,
        "Progres (%)": `${d.completionRate}%`,
      }));
    } else if (activeTab === "damaged") {
      exportDataset = damagedData.map((t) => ({
        "Kode Tablet": t.qr_code,
        "Serial Number": t.serial_number,
        "Brand": t.brand,
        "Model": t.model,
        "Lokasi": t.location?.name || "N/A",
        "Status Perangkat": t.status,
      }));
    } else if (activeTab === "approval") {
      exportDataset = [
        {
          "Total Pengajuan": approvalData?.totalSubmitted || 0,
          "Disetujui (Approved)": approvalData?.approvedCount || 0,
          "Ditolak (Rejected)": approvalData?.rejectedCount || 0,
          "Menunggu Review": approvalData?.pendingCount || 0,
          "Tingkat Persetujuan (%)": `${approvalData?.approvalRate || 0}%`,
        },
      ];
    } else if (activeTab === "history") {
      exportDataset = historyData.map((h) => ({
        "Kode Tablet": h.tablet?.qr_code || "N/A",
        "PIC Inspeksi": h.pic?.name || "N/A",
        "Lokasi Area": h.tablet?.location?.name || "N/A",
        "Waktu Kirim": h.submitted_at,
        "Status Review": h.status,
        "Catatan PIC": h.notes || "-",
        "Alasan Penolakan": h.rejection_reason || "-",
      }));
    }

    exportToExcel(exportDataset, filename);
  };

  // Calculations for KPI Summary
  const totalTablets = summaryData.reduce((acc, curr) => acc + curr.totalTablets, 0);
  const totalCompleted = summaryData.reduce((acc, curr) => acc + curr.completed, 0);
  const totalPending = summaryData.reduce((acc, curr) => acc + curr.pending, 0);
  const overallRate = totalTablets > 0 ? Math.round((totalCompleted / totalTablets) * 100) : 0;
  const completedRatePct = totalTablets > 0 ? ((totalCompleted / totalTablets) * 100).toFixed(2) : "0";
  const pendingRatePct = totalTablets > 0 ? ((totalPending / totalTablets) * 100).toFixed(2) : "0";

  // Active / Selected Period Name
  const selectedPeriodObj =
    periods.find((p) => p.id === filters.periodId) ||
    periods.find((p) => p.is_active) ||
    periods[0];
  const activePeriodName = selectedPeriodObj ? selectedPeriodObj.name : "Agustus 2026";
  const activePeriodStatus = selectedPeriodObj?.is_active ? "Periode Aktif" : "Arsip Periode";

  // Role display
  const userRoleDisplay =
    currentUser?.role === "admin"
      ? "Admin"
      : currentUser?.role === "manager"
      ? "Manager"
      : currentUser?.role === "pic"
      ? "PIC"
      : "Manager";

  return (
    <div className="space-y-8 print:space-y-0">
      {/* Top Header & Export Action Bar (Web Only) */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-6 print:hidden">
        <PageHeader
          title="Laporan & Ekspor Data Inspeksi"
          description="Rekapitulasi progres inspeksi tablet, unit rusak, statistik approval, dan riwayat historis."
        />

        <div className="flex items-center gap-2">
          <Button
            onClick={handleExportExcel}
            className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs h-9"
          >
            <FileSpreadsheet className="h-4 w-4" />
            <span>Ekspor Excel (.xlsx)</span>
          </Button>

          <Button
            onClick={exportToPdf}
            variant="outline"
            className="gap-2 text-xs font-semibold h-9 border-indigo-200 text-indigo-700 hover:bg-indigo-50 hover:text-indigo-800"
          >
            <Printer className="h-4 w-4 text-indigo-600" />
            <span>Cetak PDF</span>
          </Button>
        </div>
      </div>

      {/* Multi-Criteria Filter Bar (Web Only) */}
      <Card className="print:hidden border-indigo-100 dark:border-indigo-950 bg-gradient-to-r from-indigo-50/50 via-slate-50 to-indigo-50/30 dark:from-slate-900 dark:to-slate-900">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-3 text-xs font-bold uppercase tracking-wider text-indigo-900 dark:text-indigo-300">
            <Filter className="h-4 w-4 text-indigo-600" />
            <span>Filter Kriteria Laporan</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
            {/* Filter Period */}
            <div className="space-y-1">
              <label className="text-xs text-slate-500 font-medium">Periode Inspeksi</label>
              <select
                value={filters.periodId}
                onChange={(e) => setFilters({ ...filters, periodId: e.target.value })}
                className="w-full h-9 px-3 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
              >
                <option value="all">Semua Periode</option>
                {periods.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} {p.is_active ? "(Aktif)" : ""}
                  </option>
                ))}
              </select>
            </div>

            {/* Filter Location */}
            <div className="space-y-1">
              <label className="text-xs text-slate-500 font-medium">Lokasi Area</label>
              <select
                value={filters.locationId}
                onChange={(e) => setFilters({ ...filters, locationId: e.target.value })}
                className="w-full h-9 px-3 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
              >
                <option value="all">Semua Lokasi</option>
                {locations.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.name} ({l.code})
                  </option>
                ))}
              </select>
            </div>

            {/* Filter PIC */}
            <div className="space-y-1">
              <label className="text-xs text-slate-500 font-medium">Petugas (PIC)</label>
              <select
                value={filters.picId}
                onChange={(e) => setFilters({ ...filters, picId: e.target.value })}
                className="w-full h-9 px-3 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
              >
                <option value="all">Semua PIC</option>
                {pics.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Filter Status */}
            <div className="space-y-1">
              <label className="text-xs text-slate-500 font-medium">Status Review</label>
              <select
                value={filters.status}
                onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                className="w-full h-9 px-3 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
              >
                <option value="all">Semua Status</option>
                <option value="pending">Menunggu Review (Pending)</option>
                <option value="approved">Disetujui (Approved)</option>
                <option value="rejected">Ditolak (Rejected)</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tab Navigation Bar (Web Only) */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 space-x-2 print:hidden">
        <button
          onClick={() => setActiveTab("summary")}
          className={`pb-3 px-4 font-semibold text-sm transition-all border-b-2 flex items-center gap-2 ${
            activeTab === "summary"
              ? "border-indigo-600 text-indigo-600 dark:text-indigo-400"
              : "border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-slate-200"
          }`}
        >
          <Activity className="h-4 w-4" />
          <span>Inspection Summary</span>
        </button>

        <button
          onClick={() => setActiveTab("damaged")}
          className={`pb-3 px-4 font-semibold text-sm transition-all border-b-2 flex items-center gap-2 ${
            activeTab === "damaged"
              ? "border-indigo-600 text-indigo-600 dark:text-indigo-400"
              : "border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-slate-200"
          }`}
        >
          <AlertTriangle className="h-4 w-4 text-amber-500" />
          <span>Damaged Tablets</span>
        </button>

        <button
          onClick={() => setActiveTab("approval")}
          className={`pb-3 px-4 font-semibold text-sm transition-all border-b-2 flex items-center gap-2 ${
            activeTab === "approval"
              ? "border-indigo-600 text-indigo-600 dark:text-indigo-400"
              : "border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-slate-200"
          }`}
        >
          <CheckCircle2 className="h-4 w-4 text-emerald-500" />
          <span>Approval Summary</span>
        </button>

        <button
          onClick={() => setActiveTab("history")}
          className={`pb-3 px-4 font-semibold text-sm transition-all border-b-2 flex items-center gap-2 ${
            activeTab === "history"
              ? "border-indigo-600 text-indigo-600 dark:text-indigo-400"
              : "border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-slate-200"
          }`}
        >
          <History className="h-4 w-4 text-indigo-500" />
          <span>History Log</span>
        </button>
      </div>

      {/* ========================================================
          CORPORATE PRINT REPORT (Matches Reference Image Exactly)
          Visible on Summary Tab and Primary Printable Document
         ======================================================== */}
      {(activeTab === "summary" || typeof window !== "undefined") && (
        <div
          className={`bg-white text-slate-900 space-y-6 ${
            activeTab === "summary" ? "block" : "hidden print:block"
          }`}
          style={{ fontFamily: "'Inter', sans-serif" }}
        >
          {/* 1. Header Section */}
          <div className="flex items-center justify-between border-b border-indigo-100 pb-5">
            {/* Left: TabMonitor Branding */}
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-tr from-[#4F46E5] to-[#6366F1] text-white shadow-sm shrink-0">
                <TabletIcon className="h-6 w-6 stroke-[2.2]" />
              </div>
              <div className="flex flex-col">
                <span className="text-[20px] font-black tracking-tight leading-none">
                  <span className="text-[#111827]">Tab</span>
                  <span className="text-[#4F46E5]">Monitor</span>
                </span>
                <span className="text-[10px] uppercase font-bold tracking-[0.1em] text-[#94A3B8] mt-1">
                  MONTHLY INSPECTION
                </span>
              </div>
            </div>

            {/* Center: Title & Period */}
            <div className="text-center md:text-left flex flex-col justify-center">
              <h1 className="text-[20px] sm:text-[22px] font-black text-slate-900 tracking-tight leading-none uppercase">
                LAPORAN PROGRES INSPEKSI
              </h1>
              <p className="text-sm font-semibold text-slate-600 mt-1">
                Periode {activePeriodName}
              </p>
            </div>

            {/* Right Top: Clean Report QR Code */}
            <div className="flex items-center justify-center shrink-0">
              <div className="p-1 rounded-lg border border-slate-200 bg-white">
                <QRCodeSVG
                  value="https://monitoringtablet.vercel.app/reports"
                  size={52}
                  level="M"
                />
              </div>
            </div>
          </div>

          {/* 2. Metadata Grid Section */}
          <div className="grid grid-cols-2 gap-6 border-b border-slate-200/80 pb-5 text-xs text-slate-700">
            {/* Left Metadata */}
            <div className="space-y-2">
              <div className="flex items-center gap-2.5">
                <CalendarIcon className="w-4 h-4 text-indigo-600 shrink-0" />
                <span className="w-24 text-slate-500 font-medium">Periode</span>
                <span className="font-semibold text-slate-900">: {activePeriodName}</span>
              </div>
              <div className="flex items-center gap-2.5">
                <Clock className="w-4 h-4 text-indigo-600 shrink-0" />
                <span className="w-24 text-slate-500 font-medium">Status</span>
                <span className="font-semibold text-slate-900">: {activePeriodStatus}</span>
              </div>
              <div className="flex items-center gap-2.5">
                <UserIcon className="w-4 h-4 text-indigo-600 shrink-0" />
                <span className="w-24 text-slate-500 font-medium">Dicetak oleh</span>
                <span className="font-semibold text-slate-900">: {currentUser?.name || "Bambang Wijaya"}</span>
              </div>
              <div className="flex items-center gap-2.5">
                <Shield className="w-4 h-4 text-indigo-600 shrink-0" />
                <span className="w-24 text-slate-500 font-medium">Role</span>
                <span className="font-semibold text-slate-900">: {userRoleDisplay}</span>
              </div>
            </div>

            {/* Right Metadata */}
            <div className="space-y-2">
              <div className="flex items-center gap-2.5">
                <Clock className="w-4 h-4 text-indigo-600 shrink-0" />
                <span className="w-28 text-slate-500 font-medium">Tanggal Cetak</span>
                <span className="font-semibold text-slate-900">: {currentDateStr}</span>
              </div>
              <div className="flex items-center gap-2.5">
                <Clock className="w-4 h-4 text-indigo-600 shrink-0" />
                <span className="w-28 text-slate-500 font-medium">Waktu Cetak</span>
                <span className="font-semibold text-slate-900">: {currentTimeStr}</span>
              </div>
              <div className="flex items-center gap-2.5">
                <FileText className="w-4 h-4 text-indigo-600 shrink-0" />
                <span className="w-28 text-slate-500 font-medium">Jenis Laporan</span>
                <span className="font-semibold text-slate-900">: Ringkasan per Lokasi Area</span>
              </div>
            </div>
          </div>

          {/* 3. 4 Compact KPI Summary Cards */}
          <div className="grid grid-cols-4 gap-4">
            {/* KPI 1: TOTAL TABLET */}
            <div className="bg-white rounded-2xl border border-slate-200/90 p-4 flex items-center gap-3.5 shadow-sm">
              <div className="flex h-11 w-11 items-center justify-center rounded-full border-2 border-indigo-600 bg-white text-indigo-600 shrink-0">
                <TabletIcon className="h-5 w-5 stroke-[2.2]" />
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 truncate">
                  TOTAL TABLET
                </span>
                <span className="text-2xl font-black text-slate-900 leading-tight">
                  {totalTablets}
                </span>
                <span className="text-[10px] font-bold text-indigo-600 mt-0.5 truncate">
                  100% dari total
                </span>
              </div>
            </div>

            {/* KPI 2: SUDAH DIINSPEKSI */}
            <div className="bg-white rounded-2xl border border-slate-200/90 p-4 flex items-center gap-3.5 shadow-sm">
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-emerald-600 text-white shrink-0">
                <Check className="h-6 w-6 stroke-[2.8]" />
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 truncate">
                  SUDAH DIINSPEKSI
                </span>
                <span className="text-2xl font-black text-slate-900 leading-tight">
                  {totalCompleted}
                </span>
                <span className="text-[10px] font-bold text-emerald-600 mt-0.5 truncate">
                  {completedRatePct}% dari total
                </span>
              </div>
            </div>

            {/* KPI 3: BELUM DIINSPEKSI */}
            <div className="bg-white rounded-2xl border border-slate-200/90 p-4 flex items-center gap-3.5 shadow-sm">
              <div className="flex h-11 w-11 items-center justify-center rounded-full border-2 border-amber-500 bg-white text-amber-500 shrink-0">
                <div className="w-3.5 h-3.5 rounded-full border-2 border-amber-500" />
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 truncate">
                  BELUM DIINSPEKSI
                </span>
                <span className="text-2xl font-black text-slate-900 leading-tight">
                  {totalPending}
                </span>
                <span className="text-[10px] font-bold text-amber-600 mt-0.5 truncate">
                  {pendingRatePct}% dari total
                </span>
              </div>
            </div>

            {/* KPI 4: PROGRES KESELURUHAN */}
            <div className="bg-white rounded-2xl border border-slate-200/90 p-4 flex items-center gap-3.5 shadow-sm">
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-indigo-600 text-white shrink-0">
                <TrendingUp className="h-5 w-5 stroke-[2.5]" />
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-indigo-600 truncate">
                  PROGRES KESELURUHAN
                </span>
                <span className="text-2xl font-black text-slate-900 leading-tight">
                  {overallRate}%
                </span>
                <span className="text-[10px] font-semibold text-slate-600 mt-0.5 truncate">
                  Tingkat Penyelesaian
                </span>
              </div>
            </div>
          </div>

          {/* 4. Main Location Inspection Table Section */}
          <div className="bg-white rounded-2xl border border-slate-200/90 overflow-hidden shadow-sm">
            {/* Table Section Header */}
            <div className="px-5 py-4 border-b border-slate-100">
              <h2 className="text-[13px] font-black uppercase tracking-wider text-indigo-700">
                RINGKASAN INSPEKSI PER LOKASI AREA
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Persentase keterisian dan progres inspeksi tablet berdasarkan lokasi area.
              </p>
            </div>

            {/* Table */}
            <table className="w-full text-xs text-slate-800">
              <thead>
                <tr className="border-b border-slate-200/80 bg-slate-50/50 text-slate-700 font-bold">
                  <th className="py-3 px-4 text-center w-12">No.</th>
                  <th className="py-3 px-4 text-left">Nama Lokasi Area</th>
                  <th className="py-3 px-4 text-center">Total Tablet</th>
                  <th className="py-3 px-4 text-center text-emerald-600">Sudah Diisi</th>
                  <th className="py-3 px-4 text-center text-amber-600">Belum Diisi</th>
                  <th className="py-3 px-4 text-left w-52">Tingkat Penyelesaian</th>
                  <th className="py-3 px-4 text-center w-36">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-500 font-medium">
                      Memuat ringkasan inspeksi...
                    </td>
                  </tr>
                ) : summaryData.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-500 font-medium">
                      Tidak ada data inspeksi yang cocok dengan filter.
                    </td>
                  </tr>
                ) : (
                  summaryData.map((item, index) => {
                    const isCompleted = item.completionRate === 100;
                    const isWarning = item.completionRate < 70;
                    const isInProgress = item.completionRate >= 70 && item.completionRate < 100;

                    let barColor = "bg-[#10B981]";
                    if (isWarning) barColor = "bg-[#EA580C]";
                    else if (isInProgress) barColor = "bg-[#F59E0B]";

                    return (
                      <tr
                        key={item.locationName}
                        className="hover:bg-slate-50/50 transition-colors"
                        style={{ breakInside: "avoid" }}
                      >
                        <td className="py-3 px-4 text-center font-medium text-slate-500">
                          {index + 1}
                        </td>
                        <td className="py-3 px-4 font-semibold text-slate-900">
                          <div className="flex items-center gap-2">
                            <MapPin className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                            <span>{item.locationName}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-center font-medium text-slate-700">
                          {item.totalTablets}
                        </td>
                        <td className="py-3 px-4 text-center font-bold text-emerald-600">
                          {item.completed}
                        </td>
                        <td className="py-3 px-4 text-center font-bold text-amber-600">
                          {item.pending}
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            <span className="w-10 font-bold text-slate-800 shrink-0">
                              {item.completionRate}%
                            </span>
                            <div className="flex-1 h-2 rounded-full bg-slate-100 overflow-hidden">
                              <div
                                className={`h-full rounded-full ${barColor}`}
                                style={{ width: `${item.completionRate}%` }}
                              />
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-center">
                          {isWarning ? (
                            <span className="inline-flex items-center justify-center px-3 py-0.5 rounded-full text-[11px] font-bold bg-rose-50 text-rose-600 border border-rose-200/60">
                              Perlu Perhatian
                            </span>
                          ) : isInProgress ? (
                            <span className="inline-flex items-center justify-center px-3 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-600 border border-amber-200/60">
                              Dalam Proses
                            </span>
                          ) : (
                            <span className="inline-flex items-center justify-center px-3 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-600 border border-emerald-200/60">
                              Selesai
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>

            {/* Status Legend Row */}
            <div className="border-t border-slate-100 px-5 py-3 flex flex-wrap items-center gap-6 text-xs text-slate-600 font-medium bg-slate-50/30">
              <span className="font-bold text-slate-800">Keterangan Status:</span>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#EA580C]" />
                <span>Perlu Perhatian (&lt;70%)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#F59E0B]" />
                <span>Dalam Proses (70% - 99%)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#10B981]" />
                <span>Selesai (100%)</span>
              </div>
            </div>
          </div>

          {/* 5. Two-Column Empty Signature Box */}
          <div
            className="signature-section bg-white rounded-2xl border border-slate-200/90 p-6 grid grid-cols-2 divide-x divide-slate-200 text-center shadow-sm"
            style={{ breakInside: "avoid" }}
          >
            {/* PIC Signature Column */}
            <div className="flex flex-col items-center justify-between px-4">
              <span className="text-xs font-semibold text-slate-700">
                Disiapkan oleh (PIC)
              </span>

              {/* Clean Empty Signature Space */}
              <div className="h-20 w-full" />

              <div className="w-56 border-b border-slate-900" />
              <div className="mt-2">
                <span className="font-bold text-xs text-slate-900 block">
                  Ahmad Asep Suhendi
                </span>
                <span className="text-[11px] font-medium text-slate-500 block">
                  PIC
                </span>
              </div>
            </div>

            {/* Manager Signature Column */}
            <div className="flex flex-col items-center justify-between px-4">
              <span className="text-xs font-semibold text-slate-700">
                Disetujui oleh (Manager)
              </span>

              {/* Clean Empty Signature Space */}
              <div className="h-20 w-full" />

              <div className="w-56 border-b border-slate-900" />
              <div className="mt-2">
                <span className="font-bold text-xs text-slate-900 block">
                  Anggriani Setiawan Novi
                </span>
                <span className="text-[11px] font-medium text-slate-500 block">
                  Manager
                </span>
              </div>
            </div>
          </div>

          {/* 6. Document Footer */}
          <div className="flex items-center justify-between pt-2 text-[10px] text-slate-500">
            <div className="flex flex-col">
              <span className="font-semibold text-slate-700">
                TabMonitor – Monthly Inspection
              </span>
              <span className="italic text-slate-400">
                Confidential • Internal Use Only
              </span>
            </div>
            <div className="font-medium text-slate-500">
              Halaman 1 dari 1
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Damaged Tablets (Web Only) */}
      {activeTab === "damaged" && (
        <Card className="print:hidden">
          <CardHeader>
            <CardTitle className="text-rose-600 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              <span>Daftar Tablet Perlu Repair / Maintenance</span>
            </CardTitle>
            <CardDescription>Unit tablet dengan status maintenance atau inactive</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Kode Tablet</TableHead>
                  <TableHead>Serial Number</TableHead>
                  <TableHead>Brand / Model</TableHead>
                  <TableHead>Lokasi Penempatan</TableHead>
                  <TableHead>Status Perangkat</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-slate-500">
                      Memuat data tablet rusak...
                    </TableCell>
                  </TableRow>
                ) : damagedData.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-emerald-600 font-semibold">
                      Semua unit tablet dalam kondisi prima (0 unit rusak).
                    </TableCell>
                  </TableRow>
                ) : (
                  damagedData.map((t) => (
                    <TableRow key={t.id}>
                      <TableCell className="font-mono font-bold text-indigo-600">{t.qr_code}</TableCell>
                      <TableCell className="font-mono text-xs text-slate-600">{t.serial_number}</TableCell>
                      <TableCell className="text-sm font-medium">{t.brand} - {t.model}</TableCell>
                      <TableCell className="text-xs text-slate-600">{t.location?.name || "Belum Ditempatkan"}</TableCell>
                      <TableCell>
                        <StatusBadge status={t.status} />
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Tab 3: Approval Summary (Web Only) */}
      {activeTab === "approval" && (
        <div className="space-y-6 print:hidden">
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <Card className="p-6 text-center">
              <span className="text-xs text-slate-500 font-medium">Total Pengajuan</span>
              <p className="text-3xl font-extrabold text-slate-900 dark:text-slate-100 mt-1">
                {approvalData?.totalSubmitted || 0}
              </p>
            </Card>
            <Card className="p-6 text-center border-emerald-200 dark:border-emerald-950">
              <span className="text-xs text-slate-500 font-medium">Disetujui (Approved)</span>
              <p className="text-3xl font-extrabold text-emerald-600 mt-1">
                {approvalData?.approvedCount || 0}
              </p>
            </Card>
            <Card className="p-6 text-center border-rose-200 dark:border-rose-950">
              <span className="text-xs text-slate-500 font-medium">Ditolak (Rejected)</span>
              <p className="text-3xl font-extrabold text-rose-600 mt-1">
                {approvalData?.rejectedCount || 0}
              </p>
            </Card>
            <Card className="p-6 text-center border-amber-200 dark:border-amber-950">
              <span className="text-xs text-slate-500 font-medium">Tingkat Persetujuan</span>
              <p className="text-3xl font-extrabold text-indigo-600 mt-1">
                {approvalData?.approvalRate || 0}%
              </p>
            </Card>
          </div>
        </div>
      )}

      {/* Tab 4: Inspection History (Web Only) */}
      {activeTab === "history" && (
        <Card className="print:hidden">
          <CardHeader>
            <CardTitle>Riwayat Historis Inspeksi Lengkap</CardTitle>
            <CardDescription>Log kronologis pengiriman dan persetujuan pengujian tablet</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Kode Tablet</TableHead>
                  <TableHead>PIC Inspeksi</TableHead>
                  <TableHead>Lokasi Area</TableHead>
                  <TableHead>Waktu Kirim</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Catatan / Alasan Penolakan</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-slate-500">
                      Memuat riwayat inspeksi...
                    </TableCell>
                  </TableRow>
                ) : historyData.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-slate-500">
                      Belum ada riwayat inspeksi.
                    </TableCell>
                  </TableRow>
                ) : (
                  historyData.map((h) => (
                    <TableRow key={h.id}>
                      <TableCell className="font-mono font-bold text-indigo-600">{h.tablet?.qr_code || "QR-TAB-001"}</TableCell>
                      <TableCell className="text-sm font-semibold">{h.pic?.name || "Ahmad Rizky (PIC)"}</TableCell>
                      <TableCell className="text-xs text-slate-600">{h.tablet?.location?.name || "Gudang Utama A"}</TableCell>
                      <TableCell className="text-xs font-mono text-slate-500">
                        {new Date(h.submitted_at).toLocaleDateString("id-ID", {
                          day: "numeric",
                          month: "short",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={h.status} />
                      </TableCell>
                      <TableCell className="text-xs text-slate-600 max-w-xs truncate">
                        {h.status === "rejected" ? h.rejection_reason || "Ditolak" : h.notes || "-"}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Embedded CSS for Exact A4 Corporate PDF / Print Styling */}
      <style jsx global>{`
        @page {
          size: A4 portrait;
          margin: 14mm 16mm;
        }

        @media print {
          html, body {
            background-color: #ffffff !important;
            color: #0f172a !important;
            margin: 0 !important;
            padding: 0 !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }

          .print\\:hidden {
            display: none !important;
          }

          .print\\:block {
            display: block !important;
          }

          .signature-section,
          tr {
            break-inside: avoid !important;
            page-break-inside: avoid !important;
          }
        }
      `}</style>
    </div>
  );
}
