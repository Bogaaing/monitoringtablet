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
import { Badge } from "@/components/ui/badge";
import { usersService } from "@/services/users.service";
import { locationsService } from "@/services/locations.service";
import { User, Location, Role } from "@/types";
import { Users as UsersIcon, UserPlus, Edit2, Trash2, X, AlertTriangle, FileSpreadsheet, Lock, CheckCircle } from "lucide-react";

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [locationFilter, setLocationFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);

  // Dialog states
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [formData, setFormData] = useState({
    npk: "",
    name: "",
    role: "pic" as Role,
    department: "",
    status: "active",
    location_id: "",
    phone: "",
    password: "",
  });
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Import Modal State
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [importText, setImportText] = useState("");
  const [importLoading, setImportLoading] = useState(false);
  const [importResult, setImportResult] = useState<string | null>(null);

  // Delete state
  const [deletingUser, setDeletingUser] = useState<User | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const fetchLocations = async () => {
    try {
      const list = await locationsService.getAllLocations();
      setLocations(list);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await usersService.getUsers({
        search: searchQuery,
        role: roleFilter,
        locationId: locationFilter,
        page: currentPage,
        limit: 10,
      });
      setUsers(res.data);
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
    fetchUsers();
  }, [searchQuery, roleFilter, locationFilter, currentPage]);

  const handleOpenCreate = () => {
    setEditingUser(null);
    setFormData({
      npk: "",
      name: "",
      role: "pic",
      department: "Inspection",
      status: "active",
      location_id: "",
      phone: "",
      password: "pic123",
    });
    setFormError(null);
    setIsFormOpen(true);
  };

  const handleOpenEdit = (u: User) => {
    setEditingUser(u);
    setFormData({
      npk: u.npk || "",
      name: u.name,
      role: u.role,
      department: u.department || "Operations",
      status: u.status || "active",
      location_id: u.location_id || "",
      phone: u.phone || "",
      password: "",
    });
    setFormError(null);
    setIsFormOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    const cleanNpk = formData.npk.trim();
    if (!cleanNpk) {
      setFormError("NPK wajib diisi.");
      return;
    }

    if (!/^\d{8}$/.test(cleanNpk)) {
      setFormError("NPK harus berupa 8 digit angka.");
      return;
    }

    if (!formData.name.trim()) {
      setFormError("Nama Lengkap wajib diisi.");
      return;
    }

    setFormLoading(true);
    setFormError(null);

    try {
      if (editingUser) {
        await usersService.updateUser(editingUser.id, {
          npk: cleanNpk,
          name: formData.name,
          role: formData.role,
          department: formData.department,
          status: formData.status,
          location_id: formData.location_id,
          phone: formData.phone,
        });
      } else {
        await usersService.createUser({
          npk: cleanNpk,
          name: formData.name,
          role: formData.role,
          department: formData.department,
          location_id: formData.location_id,
          phone: formData.phone,
          password: formData.password || undefined,
        });
      }
      setIsFormOpen(false);
      fetchUsers();
    } catch (err: any) {
      setFormError(err.message || "Gagal menyimpan data pengguna.");
    } finally {
      setFormLoading(false);
    }
  };

  // Excel / Bulk Import Handler
  const handleBulkImport = async () => {
    if (!importText.trim()) {
      setImportResult("Silakan tempelkan data CSV/Excel.");
      return;
    }

    setImportLoading(true);
    setImportResult(null);

    let successCount = 0;
    let failCount = 0;
    const errors: string[] = [];

    const lines = importText.trim().split("\n");
    for (const line of lines) {
      const parts = line.split(/[,;\t]/).map((p) => p.trim());
      if (parts.length >= 2) {
        const [rawNpk, rawName, rawRole, rawDept, rawPass] = parts;
        const npk = rawNpk.replace(/\D/g, "");
        if (/^\d{8}$/.test(npk)) {
          try {
            await usersService.createUser({
              npk,
              name: rawName || `Karyawan ${npk}`,
              role: (rawRole?.toLowerCase() as Role) || "pic",
              department: rawDept || "Operations",
              password: rawPass || "propan123",
            });
            successCount++;
          } catch (e: any) {
            failCount++;
            errors.push(`NPK ${npk}: ${e.message}`);
          }
        } else {
          failCount++;
          errors.push(`Format NPK ${rawNpk} tidak valid (harus 8 digit).`);
        }
      }
    }

    setImportLoading(false);
    setImportResult(`Berhasil: ${successCount} user. Gagal: ${failCount} user. ${errors.slice(0, 3).join(" | ")}`);
    fetchUsers();
  };

  const handleDeleteConfirm = async () => {
    if (!deletingUser) return;
    setDeleteLoading(true);
    try {
      await usersService.softDeleteUser(deletingUser.id);
      setDeletingUser(null);
      fetchUsers();
    } catch (err) {
      console.error(err);
    } finally {
      setDeleteLoading(false);
    }
  };

  const renderRoleBadge = (role: Role) => {
    switch (role) {
      case "admin":
        return <Badge className="bg-purple-100 text-purple-700 border border-purple-200">Admin</Badge>;
      case "manager":
        return <Badge className="bg-indigo-100 text-indigo-700 border border-indigo-200">Manager</Badge>;
      case "pic":
      default:
        return <Badge variant="secondary">PIC (Kepala Regu)</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Kelola Pengguna Sistem (NPK Based)"
        description="Master data akun pengguna berdasarkan 8 Digit NPK Karyawan, Peran Akses (Admin, Manager, PIC), dan Departemen."
      >
        <div className="flex items-center gap-3">
          {/* Import Excel / CSV Button */}
          <Button
            variant="outline"
            onClick={() => {
              setImportText("");
              setImportResult(null);
              setIsImportOpen(true);
            }}
            className="gap-2 border-slate-200 bg-white hover:bg-slate-50 text-slate-700"
          >
            <FileSpreadsheet className="h-4 w-4 text-emerald-600" />
            <span>Import Excel</span>
          </Button>

          {/* Add User Button */}
          <Button onClick={handleOpenCreate} className="gap-2 bg-[#4F46E5] hover:bg-indigo-700">
            <UserPlus className="h-4 w-4" />
            <span>Tambah User Baru</span>
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
        placeholder="Cari berdasarkan NPK (8 digit), Nama, Peran, atau Departemen..."
        filterGroups={[
          {
            key: "role",
            placeholder: "Semua Peran",
            value: roleFilter,
            onChange: (val) => {
              setRoleFilter(val);
              setCurrentPage(1);
            },
            options: [
              { label: "Admin", value: "admin" },
              { label: "PIC (Kepala Regu)", value: "pic" },
              { label: "Manager", value: "manager" },
            ],
          },
          {
            key: "location",
            placeholder: "Semua Lokasi Penugasan",
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
          setRoleFilter("all");
          setLocationFilter("all");
          setCurrentPage(1);
        }}
      />

      {/* Data Table with NPK Primary Column */}
      <Card className="border border-[#ECEEF5] shadow-sm rounded-2xl overflow-hidden">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50/70">
                <TableHead className="font-semibold text-slate-700">NPK</TableHead>
                <TableHead className="font-semibold text-slate-700">Nama Pengguna</TableHead>
                <TableHead className="font-semibold text-slate-700">Peran (Role)</TableHead>
                <TableHead className="font-semibold text-slate-700">Departemen</TableHead>
                <TableHead className="font-semibold text-slate-700">Status</TableHead>
                <TableHead className="text-right font-semibold text-slate-700">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-slate-500">
                    Memuat data pengguna...
                  </TableCell>
                </TableRow>
              ) : users.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-slate-500">
                    Tidak ada data pengguna yang ditemukan.
                  </TableCell>
                </TableRow>
              ) : (
                users.map((u) => (
                  <TableRow key={u.id} className="hover:bg-slate-50/60 transition-colors">
                    {/* NPK Column with Migration Warning Badge if missing */}
                    <TableCell className="font-mono font-bold text-sm">
                      {u.npk ? (
                        <span className="text-[#4F46E5] bg-indigo-50 px-2.5 py-1 rounded-lg border border-indigo-100">
                          {u.npk}
                        </span>
                      ) : (
                        <Badge className="bg-amber-50 text-amber-800 border-amber-300 font-semibold gap-1">
                          <AlertTriangle className="w-3 h-3 text-amber-600" />
                          <span>NPK Belum Diisi</span>
                        </Badge>
                      )}
                    </TableCell>

                    {/* Name Column */}
                    <TableCell className="font-semibold text-slate-900">{u.name}</TableCell>

                    {/* Role Column */}
                    <TableCell>{renderRoleBadge(u.role)}</TableCell>

                    {/* Department Column */}
                    <TableCell className="text-sm text-slate-600 dark:text-slate-400">
                      {u.department || "Operations"}
                    </TableCell>

                    {/* Status Column */}
                    <TableCell>
                      {u.status === "inactive" ? (
                        <Badge variant="secondary" className="text-slate-500">Nonaktif</Badge>
                      ) : (
                        <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200">Aktif</Badge>
                      )}
                    </TableCell>

                    {/* Action Column */}
                    <TableCell className="text-right space-x-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleOpenEdit(u)}
                        className="text-slate-600 hover:text-indigo-600"
                        title="Edit NPK / Data User"
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setDeletingUser(u)}
                        className="text-slate-600 hover:text-rose-600"
                        title="Hapus Pengguna"
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

      {/* Add / Edit Form Modal Dialog */}
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
              <div className="p-2.5 rounded-xl bg-indigo-50 text-[#4F46E5] dark:bg-indigo-950">
                <UsersIcon className="h-5 w-5" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                {editingUser ? "Edit / Tetapkan NPK Pengguna" : "Tambah User Baru (NPK Based)"}
              </h3>
            </div>

            <form onSubmit={handleSave} className="space-y-4 pt-2">
              {formError && (
                <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
                  {formError}
                </div>
              )}

              {/* NPK Field (8 digits required) */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  NPK Karyawan (8 Digit) <span className="text-rose-500">*</span>
                </label>
                <Input
                  type="text"
                  inputMode="numeric"
                  maxLength={8}
                  placeholder="Contoh: 11130595"
                  value={formData.npk}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, "").slice(0, 8);
                    setFormData({ ...formData, npk: val });
                  }}
                  required
                  className="font-mono font-bold tracking-widest text-[#4F46E5]"
                />
                <p className="text-[11px] text-slate-400">
                  Harus 8 digit angka unik. Pengguna akan login menggunakan NPK ini.
                </p>
              </div>

              {/* Name Field */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Nama Lengkap <span className="text-rose-500">*</span>
                </label>
                <Input
                  placeholder="Contoh: Ahmad Rizky"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>

              {/* Role & Department Row */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Peran (Role) <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value as Role })}
                    className="w-full h-10 px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="pic">PIC (Kepala Regu)</option>
                    <option value="manager">Manager</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Departemen
                  </label>
                  <Input
                    placeholder="Contoh: Operations"
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                  />
                </div>
              </div>

              {/* Password Field (for New User) or Status Field (for Edit User) */}
              {!editingUser ? (
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Kata Sandi (Password Initial)
                  </label>
                  <div className="relative">
                    <Input
                      type="password"
                      placeholder="Minimal 6 karakter"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    />
                    <Lock className="w-4 h-4 text-slate-400 absolute right-3 top-3 pointer-events-none" />
                  </div>
                </div>
              ) : (
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Status Akun
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full h-10 px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="active">Aktif (Dapat Login)</option>
                    <option value="inactive">Nonaktif (Akses Diblokir)</option>
                  </select>
                </div>
              )}

              {/* Read-Only Internal Auth Email Helper */}
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-600 text-xs space-y-1">
                <span className="font-semibold text-slate-700 block">Email Otentikasi Internal (Read-Only):</span>
                <span className="font-mono text-slate-900 block font-semibold">
                  {editingUser?.email || (formData.npk ? `${formData.npk}@tabmonitor.my.id` : "<NPK>@tabmonitor.my.id")}
                </span>
                <span className="text-[11px] text-slate-400 block">
                  * Digunakan hanya untuk Supabase Auth internal dan tidak ditampilkan ke pengguna.
                </span>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                <Button type="button" variant="outline" onClick={() => setIsFormOpen(false)} disabled={formLoading}>
                  Batal
                </Button>
                <Button type="submit" disabled={formLoading} className="bg-[#4F46E5] hover:bg-indigo-700">
                  {formLoading ? "Memproses..." : editingUser ? "Simpan Perubahan" : "Tambah User"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Bulk Import Excel Modal Dialog */}
      {isImportOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-lg w-full p-6 space-y-4 relative">
            <button
              onClick={() => setIsImportOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-lg"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-600">
                <FileSpreadsheet className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold">Import Batch User dari Excel / CSV</h3>
                <p className="text-xs text-slate-500">Format: NPK, Nama, Role, Departemen, Password</p>
              </div>
            </div>

            {importResult && (
              <div className="p-3 rounded-lg bg-indigo-50 border border-indigo-200 text-indigo-800 text-xs font-semibold">
                {importResult}
              </div>
            )}

            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-700">
                Tempelkan Baris CSV / Format Teks:
              </label>
              <textarea
                rows={6}
                placeholder={`11130595, Super Admin, admin, IT, admin123\n22240696, Manager Ops, manager, Operations, manager123\n33350797, PIC Penguji, pic, Inspection, pic123`}
                value={importText}
                onChange={(e) => setImportText(e.target.value)}
                className="w-full p-3 font-mono text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
              <p className="text-[11px] text-slate-400">
                Sistem akan membuat email internal otomatis <strong>&lt;NPK&gt;@tabmonitor.my.id</strong> untuk tiap user.
              </p>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
              <Button variant="outline" onClick={() => setIsImportOpen(false)} disabled={importLoading}>
                Tutup
              </Button>
              <Button onClick={handleBulkImport} disabled={importLoading} className="bg-emerald-600 hover:bg-emerald-700 text-white">
                {importLoading ? "Mengimpor..." : "Proses Import Batch"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmDeleteDialog
        isOpen={!!deletingUser}
        title={`Hapus Pengguna "${deletingUser?.name}"?`}
        description="Data pengguna ini akan dihapus secara lunak (soft delete). Akun tidak dapat login kembali menggunakan NPK ini."
        loading={deleteLoading}
        onConfirm={handleDeleteConfirm}
        onClose={() => setDeletingUser(null)}
      />
    </div>
  );
}
