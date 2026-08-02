"use client";

import React, { useState, useEffect } from "react";
import { PageHeader } from "@/components/shared/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { SearchFilterBar } from "@/components/shared/search-filter-bar";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { inspectionsService, Inspection } from "@/services/inspections.service";
import { authService } from "@/services/auth.service";
import { User } from "@/types";
import { QrCode, MapPin, Eye, X } from "lucide-react";
import Link from "next/link";

export default function PicInspectionsPage() {
  const [inspections, setInspections] = useState<Inspection[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedInspection, setSelectedInspection] = useState<Inspection | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  useEffect(() => {
    authService.getCurrentProfile().then((u) => setCurrentUser(u));
  }, []);

  const fetchInspections = async () => {
    setLoading(true);
    try {
      const res = await inspectionsService.getInspections({
        status: statusFilter,
        limit: 100,
      });

      if (res.data && res.data.length > 0 && currentUser) {
        const myInspections = res.data.filter(
          (i) =>
            i.pic_id === currentUser.id ||
            i.pic?.email?.toLowerCase() === currentUser.email?.toLowerCase() ||
            (currentUser.location_id && i.tablet?.location_id === currentUser.location_id)
        );
        setInspections(myInspections.length > 0 ? myInspections : res.data);
      } else {
        setInspections(res.data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInspections();
  }, [currentUser, statusFilter]);

  const filteredList = inspections.filter((ins) => {
    if (!search) return true;
    const s = search.toLowerCase();
    return (
      ins.tablet?.qr_code?.toLowerCase().includes(s) ||
      ins.tablet?.model?.toLowerCase().includes(s) ||
      (ins.tablet?.location?.name && ins.tablet.location.name.toLowerCase().includes(s))
    );
  });

  return (
    <div className="space-y-8">
      <PageHeader
        title="Riwayat Inspeksi Saya"
        description="Daftar pengajuan inspeksi tablet yang telah Anda kirimkan untuk peninjauan Manager."
      >
        <Link href="/pic/scan">
          <Button className="gap-2 bg-indigo-600 hover:bg-indigo-700">
            <QrCode className="h-4 w-4" />
            <span>Scan Tablet Baru</span>
          </Button>
        </Link>
      </PageHeader>

      {/* Search & Filter Bar */}
      <SearchFilterBar
        placeholder="Cari kode tablet, model, atau lokasi..."
        searchQuery={search}
        onSearchChange={setSearch}
        filterGroups={[
          {
            key: "status",
            placeholder: "Semua Status Review",
            value: statusFilter,
            options: [
              { label: "Menunggu Approval", value: "pending" },
              { label: "Disetujui (Approved)", value: "approved" },
              { label: "Ditolak (Rejected)", value: "rejected" },
            ],
            onChange: (val: string) => setStatusFilter(val),
          },
        ]}
      />

      {/* Inspections Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Kode Tablet</TableHead>
                <TableHead>Model / Merk</TableHead>
                <TableHead>Lokasi Area</TableHead>
                <TableHead>Waktu Kirim</TableHead>
                <TableHead>Status Review</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-slate-500">
                    Memuat riwayat inspeksi...
                  </TableCell>
                </TableRow>
              ) : filteredList.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-slate-500">
                    Belum ada data inspeksi yang sesuai.
                  </TableCell>
                </TableRow>
              ) : (
                filteredList.map((ins) => (
                  <TableRow key={ins.id}>
                    <TableCell className="font-mono font-bold text-indigo-600">
                      {ins.tablet?.qr_code || "QR-TAB-001"}
                    </TableCell>
                    <TableCell className="text-sm font-medium">
                      {ins.tablet?.brand || "Samsung"} - {ins.tablet?.model || "Galaxy Tab"}
                    </TableCell>
                    <TableCell className="text-xs text-slate-600 dark:text-slate-400">
                      <span className="inline-flex items-center gap-1">
                        <MapPin className="h-3.5 w-3.5 text-indigo-500" />
                        <span>{ins.tablet?.location?.name || "Gudang Utama A"}</span>
                      </span>
                    </TableCell>
                    <TableCell className="text-xs font-mono text-slate-500">
                      {new Date(ins.submitted_at).toLocaleDateString("id-ID", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
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
                        variant="ghost"
                        onClick={() => setSelectedInspection(ins)}
                        className="text-xs gap-1 text-indigo-600 hover:bg-indigo-50"
                      >
                        <Eye className="h-4 w-4" />
                        <span>Detail</span>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Detail Inspection Modal */}
      {selectedInspection && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-lg w-full p-6 space-y-4 relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setSelectedInspection(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1 rounded-lg"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
              <QrCode className="h-5 w-5 text-indigo-600" />
              <h3 className="text-lg font-bold">Detail Inspeksi Tablet</h3>
              <StatusBadge status={selectedInspection.status} className="ml-auto text-xs" />
            </div>

            <div className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 dark:bg-slate-800 rounded-xl">
                <div>
                  <span className="text-slate-500">Kode Tablet:</span>
                  <p className="font-mono font-bold text-indigo-600 text-sm">
                    {selectedInspection.tablet?.qr_code}
                  </p>
                </div>
                <div>
                  <span className="text-slate-500">Serial Number:</span>
                  <p className="font-mono font-semibold">{selectedInspection.tablet?.serial_number}</p>
                </div>
                <div>
                  <span className="text-slate-500">Kondisi Fisik:</span>
                  <p className="font-bold text-slate-800 dark:text-slate-200 uppercase">
                    {selectedInspection.tablet_condition || "Good"}
                  </p>
                </div>
                <div>
                  <span className="text-slate-500">Persentase Baterai:</span>
                  <p className="font-bold text-emerald-600">{selectedInspection.battery_pct || 85}%</p>
                </div>
              </div>

              {selectedInspection.notes && (
                <div className="space-y-1">
                  <span className="font-bold text-slate-700 dark:text-slate-300">Catatan PIC:</span>
                  <p className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 italic">
                    "{selectedInspection.notes}"
                  </p>
                </div>
              )}

              {selectedInspection.rejection_reason && (
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-300 space-y-1">
                  <span className="font-bold">Alasan Penolakan Manager:</span>
                  <p className="italic">"{selectedInspection.rejection_reason}"</p>
                </div>
              )}

              {/* Photos Gallery */}
              {selectedInspection.photos && selectedInspection.photos.length > 0 && (
                <div className="space-y-2">
                  <span className="font-bold text-slate-700 dark:text-slate-300">Foto Fisik Tablet ({selectedInspection.photos.length}):</span>
                  <div className="grid grid-cols-2 gap-2">
                    {selectedInspection.photos.map((ph) => (
                      <div key={ph.id} className="relative aspect-video rounded-xl overflow-hidden border border-slate-200 shadow-sm">
                        <img src={ph.photo_url} alt="Foto Inspeksi" className="w-full h-full object-cover" />
                        <span className="absolute bottom-1 left-1 bg-slate-900/70 text-white text-[9px] font-bold px-1.5 py-0.5 rounded uppercase">
                          {ph.photo_type}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end">
              <Button size="sm" variant="outline" onClick={() => setSelectedInspection(null)}>
                Tutup
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
