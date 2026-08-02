"use client";

import React, { useState, useEffect } from "react";
import * as XLSX from "xlsx";
import { PageHeader } from "@/components/shared/page-header";
import { SearchFilterBar } from "@/components/shared/search-filter-bar";
import { DataTablePagination } from "@/components/shared/data-table-pagination";
import { ConfirmDeleteDialog } from "@/components/shared/confirm-delete-dialog";
import { StatusBadge } from "@/components/shared/status-badge";
import { TabletImportWizard } from "@/components/admin/tablet-import-wizard";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { tabletsService } from "@/services/tablets.service";
import { locationsService } from "@/services/locations.service";
import { Tablet, Location, TabletStatus } from "@/types";
import {
  Tablet as TabletIcon,
  Plus,
  Edit2,
  Trash2,
  X,
  QrCode,
  Download,
  Upload,
  FileSpreadsheet,
  Printer,
  CheckCircle2,
} from "lucide-react";
import Link from "next/link";
import { QRCodeSVG } from "qrcode.react";

export default function AdminTabletsPage() {
  const [tablets, setTablets] = useState<Tablet[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [locationFilter, setLocationFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);

  // Import Wizard Modal state
  const [isImportWizardOpen, setIsImportWizardOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Batch QR Modal state
  const [isBatchQrOpen, setIsBatchQrOpen] = useState(false);

  // Form Dialog states
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingTablet, setEditingTablet] = useState<Tablet | null>(null);
  const [formData, setFormData] = useState({
    qr_code: "",
    serial_number: "",
    brand: "Samsung",
    model: "",
    location_id: "",
    status: "active" as TabletStatus,
  });
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Delete state
  const [deletingTablet, setDeletingTablet] = useState<Tablet | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const fetchLocations = async () => {
    try {
      const list = await locationsService.getAllLocations();
      setLocations(list);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchTablets = async () => {
    setLoading(true);
    try {
      const res = await tabletsService.getTablets({
        search: searchQuery,
        status: statusFilter,
        locationId: locationFilter,
        page: currentPage,
        limit: 10,
      });
      setTablets(res.data);
      setTotalPages(res.totalPages);
      setTotalRecords(res.total);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLocations();
  }, []);

  useEffect(() => {
    fetchTablets();
  }, [searchQuery, statusFilter, locationFilter, currentPage]);

  const handleOpenCreate = () => {
    setEditingTablet(null);
    setFormData({
      qr_code: `QR-TAB-${Math.floor(100 + Math.random() * 900)}`,
      serial_number: "",
      brand: "Samsung",
      model: "",
      location_id: locations[0]?.id || "",
      status: "active",
    });
    setFormError(null);
    setIsFormOpen(true);
  };

  const handleOpenEdit = (tab: Tablet) => {
    setEditingTablet(tab);
    setFormData({
      qr_code: tab.qr_code,
      serial_number: tab.serial_number,
      brand: tab.brand || "Samsung",
      model: tab.model,
      location_id: tab.location_id || "",
      status: tab.status,
    });
    setFormError(null);
    setIsFormOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.qr_code.trim() || !formData.serial_number.trim() || !formData.model.trim()) {
      setFormError("Kode Tablet (QR), Serial Number, dan Model wajib diisi.");
      return;
    }

    setFormLoading(true);
    setFormError(null);

    try {
      if (editingTablet) {
        await tabletsService.updateTablet(editingTablet.id, formData);
        showToast("Data tablet berhasil diperbarui.");
      } else {
        await tabletsService.createTablet(formData);
        showToast("Tablet baru berhasil ditambahkan.");
      }
      setIsFormOpen(false);
      fetchTablets();
    } catch (err: any) {
      setFormError(err.message || "Gagal menyimpan data tablet.");
    } finally {
      setFormLoading(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deletingTablet) return;
    setDeleteLoading(true);
    try {
      await tabletsService.softDeleteTablet(deletingTablet.id);
      showToast(`Tablet ${deletingTablet.qr_code} berhasil dihapus.`);
      setDeletingTablet(null);
      fetchTablets();
    } catch (err) {
      console.error(err);
    } finally {
      setDeleteLoading(false);
    }
  };

  // 1. Download Template Handler
  const handleDownloadTemplate = () => {
    const templateData = [
      {
        "Tablet Code": "TAB001",
        "Serial Number": "SN-001",
        "Brand": "Samsung",
        "Model": "Galaxy Tab A9",
        "Location": "Gudang Utama A",
        "Assigned PIC": "Ahmad Rizky (Kepala Regu)",
        "Status": "Active",
      },
      {
        "Tablet Code": "TAB002",
        "Serial Number": "SN-002",
        "Brand": "Apple",
        "Model": "iPad 10th Gen",
        "Location": "Area Packing 2",
        "Assigned PIC": "",
        "Status": "Maintenance",
      },
    ];

    const ws = XLSX.utils.json_to_sheet(templateData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Template Import Tablet");
    XLSX.writeFile(wb, "tablet_import_template.xlsx");
    showToast("Template Excel berhasil diunduh.");
  };

  // 2. Export Excel Handler
  const handleExportExcel = async () => {
    try {
      const res = await tabletsService.getTablets({
        search: searchQuery,
        status: statusFilter,
        locationId: locationFilter,
        limit: 1000,
      });

      const exportData = res.data.map((t, idx) => ({
        "No": idx + 1,
        "Kode Tablet (QR)": t.qr_code,
        "Serial Number": t.serial_number,
        "Merk / Brand": t.brand || "-",
        "Model Device": t.model || "-",
        "Lokasi Penempatan": t.location?.name || "Belum Ditempatkan",
        "Status Operasional": t.status.toUpperCase(),
        "Tanggal Didaftarkan": new Date(t.created_at).toLocaleDateString("id-ID"),
      }));

      const ws = XLSX.utils.json_to_sheet(exportData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Inventaris Tablet");
      XLSX.writeFile(wb, `Export_Inventaris_Tablet_${Date.now()}.xlsx`);
      showToast("Data tablet berhasil diexport ke Excel.");
    } catch (e) {
      alert("Gagal mengunduh berkas Export Excel.");
    }
  };

  // 3. Print Batch QR Codes
  const handlePrintQrCodes = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-3 bg-emerald-600 text-white rounded-2xl shadow-2xl text-xs font-bold animate-in fade-in">
          <CheckCircle2 className="h-4 w-4" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Page Header with Full Action Button Row */}
      <PageHeader
        title="Kelola Inventaris Tablet"
        description="Master data unit device tablet, kode QR, merk, model, dan lokasi penempatan."
      >
        <div className="flex flex-wrap items-center gap-2">
          {/* Action 1: Add Tablet */}
          <Button onClick={handleOpenCreate} className="gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-xs font-bold">
            <Plus className="h-4 w-4" />
            <span>Add Tablet</span>
          </Button>

          {/* Action 2: Import Excel */}
          <Button
            onClick={() => setIsImportWizardOpen(true)}
            variant="outline"
            className="gap-1.5 border-indigo-200 text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950 text-xs font-bold"
          >
            <Upload className="h-4 w-4" />
            <span>Import Excel</span>
          </Button>

          {/* Action 3: Export Excel */}
          <Button
            onClick={handleExportExcel}
            variant="outline"
            className="gap-1.5 border-slate-200 text-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-semibold"
          >
            <Download className="h-4 w-4" />
            <span>Export Excel</span>
          </Button>

          {/* Action 4: Download Template */}
          <Button
            onClick={handleDownloadTemplate}
            variant="ghost"
            className="gap-1.5 text-slate-600 hover:text-indigo-600 text-xs font-medium"
          >
            <FileSpreadsheet className="h-4 w-4" />
            <span>Download Template</span>
          </Button>

          {/* Action 5: Generate QR Batch */}
          <Button
            onClick={() => setIsBatchQrOpen(true)}
            variant="outline"
            className="gap-1.5 border-purple-200 text-purple-700 hover:bg-purple-50 dark:hover:bg-purple-950 text-xs font-bold"
          >
            <Printer className="h-4 w-4" />
            <span>Generate QR</span>
          </Button>
        </div>
      </PageHeader>

      {/* Search & Filter Bar */}
      <SearchFilterBar
        searchQuery={searchQuery}
        onSearchChange={(val) => {
          setSearchQuery(val);
          setCurrentPage(1);
        }}
        placeholder="Cari kode tablet, serial number, merk, atau model..."
        filterGroups={[
          {
            key: "status",
            placeholder: "Semua Status",
            value: statusFilter,
            onChange: (val) => {
              setStatusFilter(val);
              setCurrentPage(1);
            },
            options: [
              { label: "Active", value: "active" },
              { label: "Maintenance", value: "maintenance" },
              { label: "Inactive", value: "inactive" },
              { label: "Lost", value: "lost" },
            ],
          },
          {
            key: "location",
            placeholder: "Semua Lokasi",
            value: locationFilter,
            onChange: (val) => {
              setLocationFilter(val);
              setCurrentPage(1);
            },
            options: locations.map((loc) => ({ label: loc.name, value: loc.id })),
          },
        ]}
        onResetFilters={() => {
          setSearchQuery("");
          setStatusFilter("all");
          setLocationFilter("all");
          setCurrentPage(1);
        }}
      />

      {/* Data Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Kode Tablet (QR)</TableHead>
                <TableHead>Serial Number</TableHead>
                <TableHead>Merk & Model</TableHead>
                <TableHead>Lokasi Penempatan</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-slate-500">
                    Memuat data tablet...
                  </TableCell>
                </TableRow>
              ) : tablets.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-slate-500">
                    Tidak ada data tablet yang ditemukan.
                  </TableCell>
                </TableRow>
              ) : (
                tablets.map((tab) => (
                  <TableRow key={tab.id}>
                    <TableCell className="font-mono text-xs font-bold text-indigo-600 dark:text-indigo-400 flex items-center gap-1.5 pt-4">
                      <QrCode className="h-4 w-4" />
                      <span>{tab.qr_code}</span>
                    </TableCell>
                    <TableCell className="font-mono text-xs text-slate-700 dark:text-slate-300">
                      {tab.serial_number}
                    </TableCell>
                    <TableCell className="font-semibold">
                      <div>{tab.model}</div>
                      <div className="text-xs text-slate-500 font-normal">{tab.brand || "Samsung"}</div>
                    </TableCell>
                    <TableCell className="text-sm text-slate-700 dark:text-slate-300">
                      {tab.location?.name || "Belum Ditempatkan"}
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={tab.status} />
                    </TableCell>
                    <TableCell className="text-right space-x-1">
                      <Link href={`/admin/tablets/${tab.id}`}>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950"
                          title="Detail & QR Code"
                        >
                          <QrCode className="h-4 w-4 mr-1" />
                          <span className="text-xs">Detail & QR</span>
                        </Button>
                      </Link>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleOpenEdit(tab)}
                        className="text-slate-600 hover:text-indigo-600"
                        title="Edit"
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setDeletingTablet(tab)}
                        className="text-slate-600 hover:text-rose-600"
                        title="Hapus"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>

          <div className="p-4 border-t border-slate-200 dark:border-slate-800">
            <DataTablePagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalRecords={totalRecords}
              pageSize={10}
              onPageChange={(p) => setCurrentPage(p)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Bulk Import Stepper Wizard Modal Component */}
      <TabletImportWizard
        isOpen={isImportWizardOpen}
        onClose={() => setIsImportWizardOpen(false)}
        onSuccess={() => {
          showToast("Bulk import tablet berhasil dijalankan!");
          fetchTablets();
        }}
      />

      {/* Batch QR Code Generator Print Modal */}
      {isBatchQrOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-4xl w-full p-6 space-y-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-purple-600 text-white shadow-md">
                  <Printer className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900 dark:text-slate-100">
                    Cetak Lembar Kode QR Tablet (Batch Print)
                  </h3>
                  <p className="text-xs text-slate-500 font-medium">
                    Pratinjau lembaran cetak label steker Kode QR untuk penempelan fisik pada unit tablet.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button onClick={handlePrintQrCodes} className="bg-purple-600 hover:bg-purple-700 text-white font-bold gap-2 text-xs">
                  <Printer className="h-4 w-4" />
                  <span>Cetak / Print Label</span>
                </Button>
                <button
                  onClick={() => setIsBatchQrOpen(false)}
                  className="p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* QR Code Printable Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 border border-slate-200 dark:border-slate-800 rounded-2xl bg-slate-50 dark:bg-slate-900">
              {tablets.map((tab) => (
                <div
                  key={tab.id}
                  className="p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl flex flex-col items-center text-center space-y-2 shadow-sm"
                >
                  <QRCodeSVG value={tab.qr_code} size={110} level="H" />
                  <span className="font-mono text-xs font-black text-slate-900 dark:text-slate-100">
                    {tab.qr_code}
                  </span>
                  <div className="text-[10px] text-slate-500 font-medium">
                    {tab.brand} {tab.model}
                  </div>
                  <span className="text-[9px] font-mono text-slate-400">
                    SN: {tab.serial_number}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Single Add/Edit Form Modal Dialog */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-lg w-full p-6 space-y-4 relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setIsFormOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-lg"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="p-2.5 rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-300">
                <TabletIcon className="h-5 w-5" />
              </div>
              <h3 className="text-lg font-bold">
                {editingTablet ? "Edit Data Tablet" : "Tambah Tablet Baru"}
              </h3>
            </div>

            <form onSubmit={handleSave} className="space-y-4 pt-2">
              {formError && (
                <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-300 text-sm">
                  {formError}
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Kode Tablet (QR) <span className="text-rose-500">*</span>
                  </label>
                  <Input
                    placeholder="QR-TAB-001"
                    value={formData.qr_code}
                    onChange={(e) => setFormData({ ...formData, qr_code: e.target.value.toUpperCase() })}
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Serial Number <span className="text-rose-500">*</span>
                  </label>
                  <Input
                    placeholder="SN-TAB-9901"
                    value={formData.serial_number}
                    onChange={(e) => setFormData({ ...formData, serial_number: e.target.value.toUpperCase() })}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Merk Brand <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={formData.brand}
                    onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                    className="w-full h-10 px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="Samsung">Samsung</option>
                    <option value="Apple">Apple (iPad)</option>
                    <option value="Lenovo">Lenovo</option>
                    <option value="Xiaomi">Xiaomi / Redmi</option>
                    <option value="Huawei">Huawei</option>
                    <option value="Lainnya">Lainnya</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Model Device <span className="text-rose-500">*</span>
                  </label>
                  <Input
                    placeholder="Contoh: Galaxy Tab Active 3"
                    value={formData.model}
                    onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Lokasi Penempatan
                </label>
                <select
                  value={formData.location_id}
                  onChange={(e) => setFormData({ ...formData, location_id: e.target.value })}
                  className="w-full h-10 px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">-- Belum Ditempatkan --</option>
                  {locations.map((loc) => (
                    <option key={loc.id} value={loc.id}>
                      {loc.code} - {loc.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Status Operasional
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as TabletStatus })}
                  className="w-full h-10 px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="active">Active (Aktif Siap Pakai)</option>
                  <option value="maintenance">Maintenance (Perbaikan / Servis)</option>
                  <option value="inactive">Inactive (Tidak Aktif)</option>
                  <option value="lost">Lost (Hilang)</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                <Button type="button" variant="outline" onClick={() => setIsFormOpen(false)} disabled={formLoading}>
                  Batal
                </Button>
                <Button type="submit" disabled={formLoading} className="bg-indigo-600 hover:bg-indigo-700">
                  {formLoading ? "Memproses..." : editingTablet ? "Simpan Perubahan" : "Tambah Tablet"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmDeleteDialog
        isOpen={!!deletingTablet}
        title={`Hapus Tablet "${deletingTablet?.qr_code}"?`}
        description="Data unit tablet ini akan dihapus secara lunak (soft delete). Riwayat transaksi inspeksi sebelumnya tetap tersimpan secara permanen."
        loading={deleteLoading}
        onConfirm={handleDeleteConfirm}
        onClose={() => setDeletingTablet(null)}
      />
    </div>
  );
}
