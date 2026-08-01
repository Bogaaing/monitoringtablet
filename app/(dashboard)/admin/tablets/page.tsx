"use client";

import React, { useState, useEffect } from "react";
import { PageHeader } from "@/components/shared/page-header";
import { SearchFilterBar } from "@/components/shared/search-filter-bar";
import { DataTablePagination } from "@/components/shared/data-table-pagination";
import { ConfirmDeleteDialog } from "@/components/shared/confirm-delete-dialog";
import { StatusBadge } from "@/components/shared/status-badge";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { tabletsService } from "@/services/tablets.service";
import { locationsService } from "@/services/locations.service";
import { Tablet, Location, TabletStatus } from "@/types";
import { Tablet as TabletIcon, Plus, Edit2, Trash2, X, QrCode } from "lucide-react";
import Link from "next/link";

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

  // Dialog states
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
        limit: 5,
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
      } else {
        await tabletsService.createTablet(formData);
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
      setDeletingTablet(null);
      fetchTablets();
    } catch (err) {
      console.error(err);
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Kelola Inventaris Tablet"
        description="Master data unit device tablet, kode QR, merk, model, dan lokasi penempatan."
      >
        <Button onClick={handleOpenCreate} className="gap-2 bg-indigo-600 hover:bg-indigo-700">
          <Plus className="h-4 w-4" />
          <span>Tambah Tablet Baru</span>
        </Button>
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
              pageSize={5}
              onPageChange={(p) => setCurrentPage(p)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Form Modal Dialog */}
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
