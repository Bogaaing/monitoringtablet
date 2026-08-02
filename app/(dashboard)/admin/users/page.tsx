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
import { Users as UsersIcon, UserPlus, Edit2, Trash2, X, Shield, Mail } from "lucide-react";

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
    name: "",
    email: "",
    role: "pic" as Role,
    location_id: "",
    phone: "",
  });
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

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
        limit: 5,
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
      name: "",
      email: "",
      role: "pic",
      location_id: "",
      phone: "",
    });
    setFormError(null);
    setIsFormOpen(true);
  };

  const handleOpenEdit = (u: User) => {
    setEditingUser(u);
    setFormData({
      name: u.name,
      email: u.email,
      role: u.role,
      location_id: u.location_id || "",
      phone: u.phone || "",
    });
    setFormError(null);
    setIsFormOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.email.trim()) {
      setFormError("Nama dan Email wajib diisi.");
      return;
    }

    setFormLoading(true);
    setFormError(null);

    try {
      if (editingUser) {
        await usersService.updateUser(editingUser.id, formData);
      } else {
        await usersService.createUser(formData);
      }
      setIsFormOpen(false);
      fetchUsers();
    } catch (err: any) {
      setFormError(err.message || "Gagal menyimpan data pengguna.");
    } finally {
      setFormLoading(false);
    }
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
        return <Badge variant="destructive">Admin</Badge>;
      case "manager":
        return <Badge variant="default">Manager</Badge>;
      case "pic":
      default:
        return <Badge variant="secondary">PIC (Kepala Regu)</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Kelola Pengguna Sistem"
        description="Master data akun pengguna, peran akses (Admin, PIC, Manager), dan lokasi penugasan."
      >
        <Button onClick={handleOpenCreate} className="gap-2 bg-indigo-600 hover:bg-indigo-700">
          <UserPlus className="h-4 w-4" />
          <span>Tambah User Baru</span>
        </Button>
      </PageHeader>

      {/* Search & Filter Bar */}
      <SearchFilterBar
        searchQuery={searchQuery}
        onSearchChange={(val) => {
          setSearchQuery(val);
          setCurrentPage(1);
        }}
        placeholder="Cari nama atau email pengguna..."
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

      {/* Data Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nama Pengguna</TableHead>
                <TableHead>Alamat Email</TableHead>
                <TableHead>Peran (Role)</TableHead>
                <TableHead>Lokasi Penugasan</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-slate-500">
                    Memuat data pengguna...
                  </TableCell>
                </TableRow>
              ) : users.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-slate-500">
                    Tidak ada data pengguna yang ditemukan.
                  </TableCell>
                </TableRow>
              ) : (
                users.map((u) => (
                  <TableRow key={u.id}>
                    <TableCell className="font-semibold">{u.name}</TableCell>
                    <TableCell className="text-slate-600 dark:text-slate-400 text-sm">
                      <div className="flex items-center gap-1.5">
                        <Mail className="h-3.5 w-3.5 text-slate-400" />
                        <span>{u.email}</span>
                      </div>
                    </TableCell>
                    <TableCell>{renderRoleBadge(u.role)}</TableCell>
                    <TableCell className="text-sm text-slate-700 dark:text-slate-300">
                      {u.location?.name || "Seluruh Area"}
                    </TableCell>
                    <TableCell className="text-right space-x-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleOpenEdit(u)}
                        className="text-slate-600 hover:text-indigo-600"
                        title="Edit"
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setDeletingUser(u)}
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
                <UsersIcon className="h-5 w-5" />
              </div>
              <h3 className="text-lg font-bold">
                {editingUser ? "Edit Data Pengguna" : "Tambah Pengguna Baru"}
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
                  Nama Lengkap <span className="text-rose-500">*</span>
                </label>
                <Input
                  placeholder="Contoh: Ahmad Rizky"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Alamat Email <span className="text-rose-500">*</span>
                </label>
                <Input
                  type="email"
                  placeholder="contoh@company.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                />
              </div>

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
                    No. Telepon / WA
                  </label>
                  <Input
                    placeholder="0812xxxx"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Lokasi Penugasan Utama
                </label>
                <select
                  value={formData.location_id}
                  onChange={(e) => setFormData({ ...formData, location_id: e.target.value })}
                  className="w-full h-10 px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">-- Seluruh Area (Global Access) --</option>
                  {locations.map((loc) => (
                    <option key={loc.id} value={loc.id}>
                      {loc.code} - {loc.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                <Button type="button" variant="outline" onClick={() => setIsFormOpen(false)} disabled={formLoading}>
                  Batal
                </Button>
                <Button type="submit" disabled={formLoading} className="bg-indigo-600 hover:bg-indigo-700">
                  {formLoading ? "Memproses..." : editingUser ? "Simpan Perubahan" : "Tambah User"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmDeleteDialog
        isOpen={!!deletingUser}
        title={`Hapus Pengguna "${deletingUser?.name}"?`}
        description="Data pengguna ini akan dihapus secara lunak (soft delete). Akun tidak dapat login kembali, namun riwayat aktivitas & transaksi inspeksi lama tetap tersimpan secara permanen."
        loading={deleteLoading}
        onConfirm={handleDeleteConfirm}
        onClose={() => setDeletingUser(null)}
      />
    </div>
  );
}
