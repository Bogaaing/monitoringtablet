"use client";

import React, { useState, useEffect } from "react";
import { PageHeader } from "@/components/shared/page-header";
import { SearchFilterBar } from "@/components/shared/search-filter-bar";
import { DataTablePagination } from "@/components/shared/data-table-pagination";
import { ConfirmDeleteDialog } from "@/components/shared/confirm-delete-dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { locationsService } from "@/services/locations.service";
import { Location } from "@/types";
import { MapPin, Plus, Edit2, Trash2, X, Building } from "lucide-react";

export default function AdminLocationsPage() {
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);

  // Dialog states
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingLocation, setEditingLocation] = useState<Location | null>(null);
  const [formData, setFormData] = useState({ code: "", name: "", address: "" });
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Delete dialog state
  const [deletingLocation, setDeletingLocation] = useState<Location | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const fetchLocations = async () => {
    setLoading(true);
    try {
      const res = await locationsService.getLocations({
        search: searchQuery,
        page: currentPage,
        limit: 5,
      });
      setLocations(res.data);
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
  }, [searchQuery, currentPage]);

  const handleOpenCreate = () => {
    setEditingLocation(null);
    setFormData({ code: "", name: "", address: "" });
    setFormError(null);
    setIsFormOpen(true);
  };

  const handleOpenEdit = (loc: Location) => {
    setEditingLocation(loc);
    setFormData({ code: loc.code, name: loc.name, address: loc.address || "" });
    setFormError(null);
    setIsFormOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.code.trim() || !formData.name.trim()) {
      setFormError("Kode lokasi dan Nama lokasi wajib diisi.");
      return;
    }

    setFormLoading(true);
    setFormError(null);

    try {
      if (editingLocation) {
        await locationsService.updateLocation(editingLocation.id, formData);
      } else {
        await locationsService.createLocation(formData);
      }
      setIsFormOpen(false);
      fetchLocations();
    } catch (err: any) {
      setFormError(err.message || "Gagal menyimpan data lokasi.");
    } finally {
      setFormLoading(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deletingLocation) return;
    setDeleteLoading(true);
    try {
      await locationsService.softDeleteLocation(deletingLocation.id);
      setDeletingLocation(null);
      fetchLocations();
    } catch (err) {
      console.error(err);
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Kelola Lokasi Penempatan"
        description="Master data area, gudang, pos security, dan gedung lokasi tablet."
      >
        <Button onClick={handleOpenCreate} className="gap-2 bg-indigo-600 hover:bg-indigo-700">
          <Plus className="h-4 w-4" />
          <span>Tambah Lokasi Baru</span>
        </Button>
      </PageHeader>

      {/* Search Bar */}
      <SearchFilterBar
        searchQuery={searchQuery}
        onSearchChange={(val) => {
          setSearchQuery(val);
          setCurrentPage(1);
        }}
        placeholder="Cari kode, nama lokasi, atau alamat..."
        onResetFilters={() => setSearchQuery("")}
      />

      {/* Data Table Card */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Kode Lokasi</TableHead>
                <TableHead>Nama Lokasi</TableHead>
                <TableHead>Alamat / Deskripsi</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-8 text-slate-500">
                    Memuat data lokasi...
                  </TableCell>
                </TableRow>
              ) : locations.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-8 text-slate-500">
                    Tidak ada data lokasi yang ditemukan.
                  </TableCell>
                </TableRow>
              ) : (
                locations.map((loc) => (
                  <TableRow key={loc.id}>
                    <TableCell className="font-mono text-xs font-bold text-indigo-600 dark:text-indigo-400">
                      {loc.code}
                    </TableCell>
                    <TableCell className="font-semibold">{loc.name}</TableCell>
                    <TableCell className="text-slate-500 text-sm">
                      {loc.address || loc.description || "-"}
                    </TableCell>
                    <TableCell className="text-right space-x-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleOpenEdit(loc)}
                        className="text-slate-600 hover:text-indigo-600"
                        title="Edit"
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setDeletingLocation(loc)}
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

          {/* Pagination */}
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
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-lg w-full p-6 space-y-4 relative">
            <button
              onClick={() => setIsFormOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-lg"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="p-2.5 rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-300">
                <Building className="h-5 w-5" />
              </div>
              <h3 className="text-lg font-bold">
                {editingLocation ? "Edit Data Lokasi" : "Tambah Lokasi Baru"}
              </h3>
            </div>

            <form onSubmit={handleSave} className="space-y-4 pt-2">
              {formError && (
                <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-300 text-sm">
                  {formError}
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Kode Lokasi <span className="text-rose-500">*</span>
                </label>
                <Input
                  placeholder="Contoh: LOC-GZA"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Nama Lokasi <span className="text-rose-500">*</span>
                </label>
                <Input
                  placeholder="Contoh: Gudang Utama A"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Alamat / Deskripsi
                </label>
                <Input
                  placeholder="Contoh: Kawasan Industri Blok A1 No. 5"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                <Button type="button" variant="outline" onClick={() => setIsFormOpen(false)} disabled={formLoading}>
                  Batal
                </Button>
                <Button type="submit" disabled={formLoading} className="bg-indigo-600 hover:bg-indigo-700">
                  {formLoading ? "Memproses..." : editingLocation ? "Simpan Perubahan" : "Tambah Lokasi"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmDeleteDialog
        isOpen={!!deletingLocation}
        title={`Hapus Lokasi "${deletingLocation?.name}"?`}
        description="Data lokasi ini akan dihapus secara lunak (soft delete). Data tidak akan muncul dalam pilihan aktif, namun riwayat inspeksi lama tetap tersimpan."
        loading={deleteLoading}
        onConfirm={handleDeleteConfirm}
        onClose={() => setDeletingLocation(null)}
      />
    </div>
  );
}
