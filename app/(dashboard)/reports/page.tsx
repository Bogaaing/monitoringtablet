"use client";

import React, { useState, useEffect } from "react";
import { PageHeader } from "@/components/shared/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { periodsService } from "@/services/periods.service";
import { locationsService } from "@/services/locations.service";
import { usersService } from "@/services/users.service";
import {
  reportsService,
  InspectionSummaryData,
  ApprovalSummaryData,
  ReportFilterOptions,
} from "@/services/reports.service";
import { Tablet } from "@/types";
import { Inspection } from "@/services/inspections.service";
import { exportToExcel, exportToPdf } from "@/lib/export-utils";
import {
  FileSpreadsheet,
  Printer,
  Filter,
  RefreshCw,
  MapPin,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Activity,
  History,
  Tablet as TabletIcon,
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

  // Report datasets
  const [summaryData, setSummaryData] = useState<InspectionSummaryData[]>([]);
  const [damagedData, setDamagedData] = useState<Tablet[]>([]);
  const [approvalData, setApprovalData] = useState<ApprovalSummaryData | null>(null);
  const [historyData, setHistoryData] = useState<Inspection[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch Master Filter Options
  useEffect(() => {
    Promise.all([
      periodsService.getAllPeriods(),
      locationsService.getAllLocations(),
      usersService.getUsers({ role: "pic", limit: 100 }),
    ]).then(([pList, lList, uRes]) => {
      setPeriods(pList);
      setLocations(lList);
      setPics(uRes.data);
    });
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

  return (
    <div className="space-y-8">
      {/* Top Header & Export Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-6 print:hidden">
        <PageHeader
          title="Laporan & Ekspor Data Inspeksi"
          description="Rekapitulasi progres inspeksi tablet, unit rusak, statistik approval, dan riwayat historis."
        />

        <div className="flex items-center gap-2">
          <Button
            onClick={handleExportExcel}
            className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs"
          >
            <FileSpreadsheet className="h-4 w-4" />
            <span>Ekspor Excel (.xlsx)</span>
          </Button>

          <Button
            onClick={exportToPdf}
            variant="outline"
            className="gap-2 text-xs font-semibold"
          >
            <Printer className="h-4 w-4 text-indigo-600" />
            <span>Cetak PDF</span>
          </Button>
        </div>
      </div>

      {/* Multi-Criteria Filter Bar */}
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

      {/* Tab Navigation Bar */}
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

      {/* Tab 1: Inspection Summary */}
      {activeTab === "summary" && (
        <Card>
          <CardHeader>
            <CardTitle>Ringkasan Inspeksi per Lokasi Area</CardTitle>
            <CardDescription>Persentase keterisian dan progres inspeksi tablet per lokasi</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nama Lokasi Area</TableHead>
                  <TableHead className="text-center">Total Tablet</TableHead>
                  <TableHead className="text-center">Sudah Diisi</TableHead>
                  <TableHead className="text-center">Belum Diisi</TableHead>
                  <TableHead className="text-right">Tingkat Penyelesaian (%)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-slate-500">
                      Memuat ringkasan inspeksi...
                    </TableCell>
                  </TableRow>
                ) : summaryData.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-slate-500">
                      Tidak ada data inspeksi yang cocok dengan filter.
                    </TableCell>
                  </TableRow>
                ) : (
                  summaryData.map((item, idx) => (
                    <TableRow key={idx}>
                      <TableCell className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-indigo-600" />
                        <span>{item.locationName}</span>
                      </TableCell>
                      <TableCell className="text-center font-semibold">{item.totalTablets}</TableCell>
                      <TableCell className="text-center text-emerald-600 font-bold">{item.completed}</TableCell>
                      <TableCell className="text-center text-amber-600 font-bold">{item.pending}</TableCell>
                      <TableCell className="text-right">
                        <Badge variant={item.completionRate === 100 ? "success" : "warning"}>
                          {item.completionRate}%
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Tab 2: Damaged Tablets */}
      {activeTab === "damaged" && (
        <Card>
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

      {/* Tab 3: Approval Summary */}
      {activeTab === "approval" && (
        <div className="space-y-6">
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

      {/* Tab 4: Inspection History */}
      {activeTab === "history" && (
        <Card>
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

      {/* Embedded CSS for Clean PDF Document Printing */}
      <style jsx global>{`
        @media print {
          body {
            background-color: white !important;
            color: black !important;
          }
          .print\\:hidden {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
}
