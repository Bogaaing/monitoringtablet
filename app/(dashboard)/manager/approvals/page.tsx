"use client";

import React, { useState, useEffect } from "react";
import { PageHeader } from "@/components/shared/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { SearchFilterBar } from "@/components/shared/search-filter-bar";
import { StatGradientCard } from "@/components/dashboard/stat-gradient-card";
import { GlassCard } from "@/components/dashboard/glass-card";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { inspectionsService, Inspection } from "@/services/inspections.service";
import { locationsService } from "@/services/locations.service";
import { Location } from "@/types";
import {
  Clock,
  CheckCircle2,
  XCircle,
  Activity,
  QrCode,
  MapPin,
  Eye,
  X,
  AlertTriangle,
  BatteryCharging,
  Maximize2,
  ShieldCheck,
  UserCheck,
  Send,
} from "lucide-react";

export default function ManagerApprovalsPage() {
  const [inspections, setInspections] = useState<Inspection[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("pending");
  const [locationFilter, setLocationFilter] = useState("all");

  // Selected Inspection for Detail Modal
  const [selectedInspection, setSelectedInspection] = useState<Inspection | null>(null);
  
  // Rejection Dialog State
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  // Lightbox Image Preview State
  const [activePhotoUrl, setActivePhotoUrl] = useState<string | null>(null);

  const fetchApprovalData = async () => {
    setLoading(true);
    try {
      const [inspRes, locList] = await Promise.all([
        inspectionsService.getInspections({
          status: "all",
          limit: 100,
        }),
        locationsService.getAllLocations(),
      ]);
      setInspections(inspRes.data);
      setLocations(locList);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApprovalData();
  }, []);

  // Metrics summary counts
  const pendingCount = inspections.filter((i) => i.status === "pending").length;
  const approvedCount = inspections.filter((i) => i.status === "approved").length;
  const rejectedCount = inspections.filter((i) => i.status === "rejected").length;
  const totalCount = inspections.length;

  const filteredList = inspections.filter((ins) => {
    // Status filter
    if (statusFilter !== "all" && ins.status !== statusFilter) return false;

    // Location filter
    if (locationFilter !== "all" && ins.tablet?.location_id !== locationFilter) return false;
    
    // Search query
    if (!search) return true;
    const s = search.toLowerCase();
    return (
      ins.tablet?.qr_code?.toLowerCase().includes(s) ||
      (ins.pic?.name && ins.pic.name.toLowerCase().includes(s)) ||
      (ins.tablet?.location?.name && ins.tablet.location.name.toLowerCase().includes(s)) ||
      (ins.notes && ins.notes.toLowerCase().includes(s))
    );
  });

  const handleApprove = async (inspectionId: string) => {
    setActionLoading(true);
    try {
      await inspectionsService.reviewInspection(
        inspectionId,
        "30000000-0000-0000-0000-000000000003", // Manager ID
        "approved"
      );
      setSelectedInspection(null);
      fetchApprovalData();
    } catch (e) {
      alert("Gagal menyetujui inspeksi.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleRejectSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInspection || !rejectionReason.trim()) {
      alert("Wajib mengisi alasan penolakan.");
      return;
    }

    setActionLoading(true);
    try {
      await inspectionsService.reviewInspection(
        selectedInspection.id,
        "30000000-0000-0000-0000-000000000003", // Manager ID
        "rejected",
        rejectionReason.trim()
      );
      setShowRejectModal(false);
      setRejectionReason("");
      setSelectedInspection(null);
      fetchApprovalData();
    } catch (e) {
      alert("Gagal menolak inspeksi.");
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <PageHeader
        title="Antrean Approval Inspeksi"
        description="Verifikasi kelayakan hasil pengujian tablet yang dikirimkan oleh Kepala Regu (PIC)."
      />

      {/* Metrics Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <StatGradientCard
          title="Menunggu Review"
          value={pendingCount}
          description="Antrean perlu tindakan"
          icon={Clock}
          gradient="amber"
          badgeText="Perlu Review"
        />

        <StatGradientCard
          title="Disetujui"
          value={approvedCount}
          description="Telah diverifikasi"
          icon={CheckCircle2}
          gradient="emerald"
          badgeText="Approved"
        />

        <StatGradientCard
          title="Ditolak"
          value={rejectedCount}
          description="Perlu perbaikan ulang"
          icon={XCircle}
          gradient="rose"
          badgeText="Rejected"
        />

        <StatGradientCard
          title="Total Pengajuan"
          value={totalCount}
          description="Total laporan masuk"
          icon={Activity}
          gradient="indigo"
          badgeText="Total Input"
        />
      </div>

      {/* Search & Filter Toolbar */}
      <SearchFilterBar
        placeholder="Cari kode tablet, nama PIC, atau lokasi area..."
        searchQuery={search}
        onSearchChange={setSearch}
        filterGroups={[
          {
            key: "status",
            placeholder: "Semua Status Review",
            value: statusFilter,
            options: [
              { label: "Menunggu Review (Pending)", value: "pending" },
              { label: "Disetujui (Approved)", value: "approved" },
              { label: "Ditolak (Rejected)", value: "rejected" },
            ],
            onChange: (val) => setStatusFilter(val),
          },
          {
            key: "location",
            placeholder: "Semua Lokasi Area",
            value: locationFilter,
            options: locations.map((l) => ({ label: l.name, value: l.id })),
            onChange: (val) => setLocationFilter(val),
          },
        ]}
      />

      {/* Queue Table */}
      <GlassCard className="p-0" glowColor="indigo">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Kode Tablet</TableHead>
              <TableHead>Pengirim (PIC)</TableHead>
              <TableHead>Lokasi Area</TableHead>
              <TableHead>Kondisi Fisik</TableHead>
              <TableHead>Waktu Kirim</TableHead>
              <TableHead>Status Review</TableHead>
              <TableHead className="text-right">Aksi Review</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-slate-500">
                  Memuat antrean persetujuan...
                </TableCell>
              </TableRow>
            ) : filteredList.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-slate-500">
                  Tidak ada antrean inspeksi yang cocok dengan filter.
                </TableCell>
              </TableRow>
            ) : (
              filteredList.map((ins) => (
                <TableRow key={ins.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors">
                  <TableCell className="font-mono font-bold text-indigo-600 dark:text-indigo-400">
                    {ins.tablet?.qr_code || "QR-TAB-001"}
                  </TableCell>
                  <TableCell className="text-sm font-semibold">
                    {ins.pic?.name || "Ahmad Rizky (PIC)"}
                  </TableCell>
                  <TableCell className="text-xs text-slate-600 dark:text-slate-400">
                    <span className="inline-flex items-center gap-1.5">
                      <MapPin className="h-3.5 w-3.5 text-indigo-500" />
                      <span>{ins.tablet?.location?.name || "Gudang Utama A"}</span>
                    </span>
                  </TableCell>
                  <TableCell className="text-xs uppercase font-bold text-slate-700 dark:text-slate-300">
                    {ins.tablet_condition || "good"}
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
                    <Button
                      size="sm"
                      onClick={() => setSelectedInspection(ins)}
                      className="text-xs gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold"
                    >
                      <Eye className="h-3.5 w-3.5" />
                      <span>Review & Approval</span>
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </GlassCard>

      {/* Inspection Review Detail Modal */}
      {selectedInspection && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-2xl w-full p-6 space-y-6 relative max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400">
                  <ShieldCheck className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900 dark:text-slate-100">
                    Detail Review Inspeksi Tablet
                  </h3>
                  <span className="text-xs text-slate-500 font-mono">
                    Kode: <strong className="text-indigo-600">{selectedInspection.tablet?.qr_code}</strong>
                  </span>
                </div>
              </div>
              <button
                onClick={() => setSelectedInspection(null)}
                className="p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Tablet & PIC Info */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs">
              <div>
                <span className="text-slate-400 block">Serial Number</span>
                <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                  {selectedInspection.tablet?.serial_number}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block">Merk / Model</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  {selectedInspection.tablet?.brand} - {selectedInspection.tablet?.model}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block">Petugas PIC</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  {selectedInspection.pic?.name || "Ahmad Rizky (PIC)"}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block">Lokasi Penempatan</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  {selectedInspection.tablet?.location?.name || "Gudang Utama A"}
                </span>
              </div>
            </div>

            {/* Conditions Breakdown Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                <span className="text-slate-500 block">Fisik Tablet</span>
                <span className="font-extrabold uppercase text-indigo-600">
                  {selectedInspection.tablet_condition || "Good"}
                </span>
              </div>
              <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                <span className="text-slate-500 block">Charger</span>
                <span className="font-extrabold uppercase text-slate-800 dark:text-slate-200">
                  {selectedInspection.charger_condition || "Available"}
                </span>
              </div>
              <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                <span className="text-slate-500 block">Casing</span>
                <span className="font-extrabold uppercase text-slate-800 dark:text-slate-200">
                  {selectedInspection.case_condition || "Good"}
                </span>
              </div>
              <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                <span className="text-slate-500 block">Status Baterai</span>
                <span className="font-extrabold text-emerald-600 flex items-center gap-1">
                  <BatteryCharging className="h-3.5 w-3.5" />
                  <span>{selectedInspection.battery_pct || 85}%</span>
                </span>
              </div>
            </div>

            {/* Notes Section */}
            {selectedInspection.notes && (
              <div className="space-y-1 text-xs">
                <span className="font-bold text-slate-700 dark:text-slate-300">Catatan Inspeksi PIC:</span>
                <p className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 italic">
                  "{selectedInspection.notes}"
                </p>
              </div>
            )}

            {/* Rejection Reason (If already rejected) */}
            {selectedInspection.rejection_reason && (
              <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 text-xs text-rose-700 dark:text-rose-300 space-y-1">
                <span className="font-bold block">Alasan Penolakan Manager:</span>
                <p className="italic">"{selectedInspection.rejection_reason}"</p>
              </div>
            )}

            {/* Photos Gallery */}
            <div className="space-y-2">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Foto Fisik Terlampir ({selectedInspection.photos?.length || 0}):
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {(selectedInspection.photos || []).map((ph) => (
                  <div
                    key={ph.id}
                    onClick={() => setActivePhotoUrl(ph.photo_url)}
                    className="relative aspect-square rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 cursor-pointer group shadow-sm hover:scale-105 transition-transform"
                  >
                    <img src={ph.photo_url} alt="Inspeksi" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                      <Maximize2 className="h-5 w-5" />
                    </div>
                    <span className="absolute bottom-1 left-1 bg-slate-900/80 text-white text-[9px] font-bold px-1.5 py-0.5 rounded uppercase">
                      {ph.photo_type}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Manager Action Buttons */}
            {selectedInspection.status === "pending" && (
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                <Button
                  type="button"
                  disabled={actionLoading}
                  onClick={() => setShowRejectModal(true)}
                  className="bg-rose-600 hover:bg-rose-700 text-white font-bold gap-2 text-xs"
                >
                  <XCircle className="h-4 w-4" />
                  <span>Tolak (Reject)</span>
                </Button>

                <Button
                  type="button"
                  disabled={actionLoading}
                  onClick={() => handleApprove(selectedInspection.id)}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold gap-2 text-xs"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  <span>{actionLoading ? "Memproses..." : "Setujui (Approve)"}</span>
                </Button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Rejection Reason Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in zoom-in-95">
          <form
            onSubmit={handleRejectSubmit}
            className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-md w-full p-6 space-y-4"
          >
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h4 className="text-base font-bold text-rose-600 flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                <span>Alasan Penolakan Inspeksi</span>
              </h4>
              <button
                type="button"
                onClick={() => setShowRejectModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <p className="text-xs text-slate-500">
              Jelaskan alasan penolakan inspeksi ini agar PIC dapat melakukan perbaikan ulang.
            </p>

            <textarea
              rows={4}
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="Contoh: Foto fisik tablet buram/tidak jelas, periksa ulang kondisi layar..."
              required
              className="w-full p-3 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-rose-500"
            />

            <div className="flex items-center justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowRejectModal(false)}
                disabled={actionLoading}
              >
                Batal
              </Button>
              <Button
                type="submit"
                disabled={actionLoading}
                className="bg-rose-600 hover:bg-rose-700 text-white font-bold gap-2 text-xs"
              >
                <Send className="h-3.5 w-3.5" />
                <span>{actionLoading ? "Menyimpan..." : "Kirim Penolakan"}</span>
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* Lightbox Fullscreen Photo Viewer */}
      {activePhotoUrl && (
        <div
          onClick={() => setActivePhotoUrl(null)}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-8 bg-slate-950/90 backdrop-blur-md animate-in fade-in cursor-zoom-out"
        >
          <div className="relative max-w-full max-h-full flex items-center justify-center">
            <img
              src={activePhotoUrl}
              alt="Foto Inspeksi Full"
              className="max-w-[92vw] max-h-[85vh] w-auto h-auto object-contain rounded-2xl shadow-2xl border border-white/20"
            />
            <button
              onClick={(e) => {
                e.stopPropagation();
                setActivePhotoUrl(null);
              }}
              className="absolute -top-12 right-0 sm:top-4 sm:right-4 p-2 bg-slate-900/80 text-white rounded-full hover:bg-slate-800 border border-white/20 shadow-lg cursor-pointer"
              title="Tutup Preview Foto"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
