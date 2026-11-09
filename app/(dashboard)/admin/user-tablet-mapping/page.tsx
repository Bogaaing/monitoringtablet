"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import * as XLSX from "xlsx";
import { PageHeader } from "@/components/shared/page-header";
import { SearchFilterBar, FilterGroup } from "@/components/shared/search-filter-bar";
import { DataTablePagination } from "@/components/shared/data-table-pagination";
import { StatCard } from "@/components/shared/stat-card";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { mappingService, MappingResult } from "@/services/mapping.service";
import { locationsService } from "@/services/locations.service";
import { usersService } from "@/services/users.service";
import { authService } from "@/services/auth.service";
import {
  UserTabletMappingItem,
  UserTabletMappingSummary,
  Location,
  User,
} from "@/types";
import {
  Tablet as TabletIcon,
  Users,
  MapPin,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Download,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  HelpCircle,
  ShieldAlert,
  Smartphone,
  Building2,
  UserX,
  FileSpreadsheet,
} from "lucide-react";
import { useRouter } from "next/navigation";

type SortField = "npk" | "qr_code" | "brand" | "model" | "location";
type SortDirection = "asc" | "desc";

export default function UserTabletMappingPage() {
  const router = useRouter();

  // Access Control check state
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);

  // Data states
  const [mappings, setMappings] = useState<UserTabletMappingItem[]>([]);
  const [summary, setSummary] = useState<UserTabletMappingSummary>({
    totalTablets: 0,
    totalMappedUsers: 0,
    totalMappedLocations: 0,
    unassignedUserTablets: 0,
    unassignedLocationTablets: 0,
  });
  const [locations, setLocations] = useState<Location[]>([]);
  const [picUsers, setPicUsers] = useState<User[]>([]);

  // Loading & UI states
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  // Filter & Search states
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedLocation, setSelectedLocation] = useState("all");
  const [selectedUserNpk, setSelectedUserNpk] = useState("all");
  const [assignmentStatus, setAssignmentStatus] = useState<
    "all" | "assigned" | "unassigned_user" | "unassigned_location"
  >("all");

  // Sorting state
  const [sortBy, setSortBy] = useState<SortField>("qr_code");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const pageSize = 15;

  // 1. Strict Role Authorization Check for Super Admin
  useEffect(() => {
    async function verifySuperAdmin() {
      try {
        const profile = await authService.getCurrentProfile();
        if (!profile || profile.role !== "admin") {
          setIsAuthorized(false);
          // Redirect non-superadmin to appropriate role dashboard
          if (profile?.role === "manager") {
            router.replace("/manager/dashboard");
          } else if (profile?.role === "pic") {
            router.replace("/pic/dashboard");
          } else {
            router.replace("/login");
          }
          return;
        }
        setIsAuthorized(true);
      } catch (e) {
        setIsAuthorized(false);
        router.replace("/login");
      }
    }
    verifySuperAdmin();
  }, [router]);

  // 2. Fetch dropdown filters (Locations & PIC Users)
  const fetchFilterOptions = useCallback(async () => {
    try {
      const [locList, usersRes] = await Promise.all([
        locationsService.getAllLocations(),
        usersService.getUsers({ limit: 1000 }),
      ]);
      setLocations(locList);

      // Collect active PIC users or users with NPK
      const filteredPics = (usersRes.data || []).filter(
        (u) => u.npk && u.status !== "inactive" && !u.deleted_at
      );
      setPicUsers(filteredPics);
    } catch (err) {
      console.error("Gagal memuat opsi filter:", err);
    }
  }, []);

  useEffect(() => {
    if (isAuthorized) {
      fetchFilterOptions();
    }
  }, [isAuthorized, fetchFilterOptions]);

  // 3. Fetch Mapping Data
  const fetchMappings = useCallback(async () => {
    if (!isAuthorized) return;
    setLoading(true);
    try {
      const res: MappingResult = await mappingService.getMappings({
        search: searchQuery,
        locationId: selectedLocation,
        userNpk: selectedUserNpk,
        assignmentStatus,
        sortBy,
        sortDirection,
        page: currentPage,
        limit: pageSize,
      });

      setMappings(res.items);
      setSummary(res.summary);
      setTotalRecords(res.total);
      setTotalPages(res.totalPages);
    } catch (err) {
      console.error("Gagal memuat data pemetaan:", err);
    } finally {
      setLoading(false);
    }
  }, [
    isAuthorized,
    searchQuery,
    selectedLocation,
    selectedUserNpk,
    assignmentStatus,
    sortBy,
    sortDirection,
    currentPage,
  ]);

  useEffect(() => {
    if (isAuthorized) {
      fetchMappings();
    }
  }, [fetchMappings, isAuthorized]);

  // Reset to page 1 when search or filters change
  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    setCurrentPage(1);
  };

  const handleLocationChange = (val: string) => {
    setSelectedLocation(val);
    setCurrentPage(1);
  };

  const handleUserChange = (val: string) => {
    setSelectedUserNpk(val);
    setCurrentPage(1);
  };

  const handleAssignmentStatusChange = (val: string) => {
    setAssignmentStatus(
      val as "all" | "assigned" | "unassigned_user" | "unassigned_location"
    );
    setCurrentPage(1);
  };

  const handleResetFilters = () => {
    setSearchQuery("");
    setSelectedLocation("all");
    setSelectedUserNpk("all");
    setAssignmentStatus("all");
    setSortBy("qr_code");
    setSortDirection("asc");
    setCurrentPage(1);
  };

  // Toggle Column Sort
  const handleSort = (field: SortField) => {
    if (sortBy === field) {
      setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortBy(field);
      setSortDirection("asc");
    }
    setCurrentPage(1);
  };

  // Sort Indicator Icon Component
  const renderSortIcon = (field: SortField) => {
    if (sortBy !== field) {
      return <ArrowUpDown className="w-3.5 h-3.5 ml-1 text-slate-400 opacity-60 inline" />;
    }
    return sortDirection === "asc" ? (
      <ArrowUp className="w-3.5 h-3.5 ml-1 text-indigo-600 dark:text-indigo-400 inline" />
    ) : (
      <ArrowDown className="w-3.5 h-3.5 ml-1 text-indigo-600 dark:text-indigo-400 inline" />
    );
  };

  // 4. Export to Excel
  const handleExportExcel = async () => {
    setExporting(true);
    try {
      // Fetch all mapped items for full dataset export
      const fullRes = await mappingService.getMappings({
        search: searchQuery,
        locationId: selectedLocation,
        userNpk: selectedUserNpk,
        assignmentStatus,
        sortBy,
        sortDirection,
        page: 1,
        limit: 5000,
      });

      const excelRows = fullRes.items.map((item, index) => ({
        "No": index + 1,
        "Kode Tablet": item.qr_code,
        "NPK User": item.user_display_text || "Belum Ada PIC",
        "Merek": item.brand || "Samsung",
        "Model": item.model || "-",
        "Lokasi Penempatan": item.location_name || "Belum Ada Lokasi",
        "Nomor Seri (S/N)": item.serial_number || "-",
        "Kode Lokasi": item.location_code || "-",
        "Status Tablet": item.tablet_status,
        "Status Pemetaan": item.has_user && item.has_location
          ? "Lengkap"
          : !item.has_location
          ? "Lokasi Belum Ada"
          : "PIC Belum Ada",
      }));

      const ws = XLSX.utils.json_to_sheet(excelRows);
      // Auto column widths
      ws["!cols"] = [
        { wch: 6 },  // No
        { wch: 16 }, // Kode Tablet
        { wch: 42 }, // NPK User
        { wch: 16 }, // Merek
        { wch: 20 }, // Model
        { wch: 24 }, // Lokasi Penempatan
        { wch: 24 }, // Nomor Seri (S/N)
        { wch: 14 }, // Kode Lokasi
        { wch: 14 }, // Status Tablet
        { wch: 20 }, // Status Pemetaan
      ];

      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Pemetaan User & Tablet");

      const dateStr = new Date().toISOString().split("T")[0];
      XLSX.writeFile(wb, `Pemetaan_User_Tablet_SuperAdmin_${dateStr}.xlsx`);
    } catch (e) {
      console.error("Gagal export Excel:", e);
      alert("Gagal melakukan export Excel. Silakan coba kembali.");
    } finally {
      setExporting(false);
    }
  };

  // Filter groups configuration for SearchFilterBar
  const filterGroups: FilterGroup[] = useMemo(
    () => [
      {
        key: "locationFilter",
        placeholder: "Semua Lokasi",
        value: selectedLocation,
        options: [
          ...locations.map((loc) => ({
            label: loc.name,
            value: loc.id,
          })),
          { label: "⚠️ Tanpa Lokasi", value: "none" },
        ],
        onChange: handleLocationChange,
      },
      {
        key: "userFilter",
        placeholder: "Semua User / PIC",
        value: selectedUserNpk,
        options: [
          ...picUsers.map((u) => ({
            label: `${u.npk} - ${u.name}`,
            value: u.npk!,
          })),
          { label: "⚠️ Tanpa PIC", value: "none" },
        ],
        onChange: handleUserChange,
      },
      {
        key: "statusFilter",
        placeholder: "Semua Status Pemetaan",
        value: assignmentStatus,
        options: [
          { label: "✅ Lengkap Terpetakan", value: "assigned" },
          { label: "⚠️ Belum Ada PIC", value: "unassigned_user" },
          { label: "❌ Belum Ada Lokasi", value: "unassigned_location" },
        ],
        onChange: handleAssignmentStatusChange,
      },
    ],
    [locations, picUsers, selectedLocation, selectedUserNpk, assignmentStatus]
  );

  // If unauthorized state
  if (isAuthorized === false) {
    return (
      <div className="min-h-[500px] flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white dark:bg-slate-900 border border-rose-200 dark:border-rose-900/40 rounded-2xl p-8 text-center shadow-lg">
          <div className="w-16 h-16 rounded-2xl bg-rose-50 dark:bg-rose-950/60 flex items-center justify-center mx-auto mb-4 text-rose-600 dark:text-rose-400">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-2">
            Akses Ditolak (Super Admin Only)
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-400 mb-6">
            Halaman <strong>Pemetaan User & Tablet</strong> adalah hak akses eksklusif Super Admin. Akun Anda tidak memiliki otoritas untuk mengakses data pemetaan ini.
          </p>
          <Button
            onClick={() => router.push("/dashboard")}
            className="w-full bg-slate-900 hover:bg-slate-800 text-white dark:bg-indigo-600 dark:hover:bg-indigo-500 rounded-xl"
          >
            Kembali ke Dashboard Utama
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ── Page Header ── */}
      <PageHeader
        title="Pemetaan User & Tablet"
        description="Monitoring terpusat relasi penugasan user penanggung jawab (PIC) dengan tablet inventaris dan lokasi penempatan operasional."
      >
        <Button
          variant="outline"
          size="sm"
          onClick={fetchMappings}
          disabled={loading}
          className="gap-2 rounded-xl text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800"
          title="Segarkan data pemetaan"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          <span>Segarkan</span>
        </Button>

        <Button
          onClick={handleExportExcel}
          disabled={exporting || loading}
          size="sm"
          className="gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-medium shadow-sm transition-all"
          title="Export data pemetaan ke format Excel (.xlsx)"
        >
          <FileSpreadsheet className="w-4 h-4" />
          <span>{exporting ? "Mengekspor..." : "Export Excel"}</span>
        </Button>
      </PageHeader>

      {/* ── KPI Summary Micro Cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Tablet */}
        <StatCard
          title="TOTAL TABLET"
          value={summary.totalTablets}
          description="Unit tablet inventaris terdaftar"
          icon={TabletIcon}
          iconColor="text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60"
        />

        {/* Total User PIC Penanggung Jawab */}
        <StatCard
          title="TOTAL USER PENANGGUNG JAWAB"
          value={summary.totalMappedUsers}
          description="User PIC bertugas mengelola tablet"
          icon={Users}
          iconColor="text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60"
        />

        {/* Total Area Lokasi Operasional */}
        <StatCard
          title="LOKASI TERPETAKAN"
          value={summary.totalMappedLocations}
          description="Area penempatan aktif memiliki unit"
          icon={MapPin}
          iconColor="text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60"
        />

        {/* Status Perhatian (Unassigned Tablet / PIC) */}
        <StatCard
          title="PERLU PERHATIAN"
          value={summary.unassignedUserTablets + summary.unassignedLocationTablets}
          description={`${summary.unassignedUserTablets} tanpa PIC • ${summary.unassignedLocationTablets} tanpa lokasi`}
          icon={AlertTriangle}
          iconColor={
            summary.unassignedUserTablets + summary.unassignedLocationTablets > 0
              ? "text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60"
              : "text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-900"
          }
        />
      </div>

      {/* ── Search & Filter Controls ── */}
      <SearchFilterBar
        searchQuery={searchQuery}
        onSearchChange={handleSearchChange}
        placeholder="Cari berdasarkan NPK, kode tablet, merek, model, atau lokasi..."
        filterGroups={filterGroups}
        onResetFilters={handleResetFilters}
      />

      {/* ── Main Data Table ── */}
      <Card className="border border-slate-200 dark:border-slate-800 shadow-sm rounded-2xl overflow-hidden bg-white dark:bg-slate-900">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table className="w-full table-fixed min-w-[850px]">
              <TableHeader className="bg-slate-50/80 dark:bg-slate-950/60 border-b border-slate-200 dark:border-slate-800">
                <TableRow className="hover:bg-transparent">
                  {/* Kolom 1: No (5%, Center) */}
                  <TableHead className="w-[5%] min-w-[48px] text-center align-middle font-bold text-xs uppercase tracking-wider text-slate-700 dark:text-slate-300 py-3.5 px-2">
                    No
                  </TableHead>

                  {/* Kolom 2: Kode Tablet (19%, Left) */}
                  <TableHead
                    onClick={() => handleSort("qr_code")}
                    className="w-[19%] min-w-[160px] text-left align-middle cursor-pointer select-none font-bold text-xs uppercase tracking-wider text-slate-700 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors py-3.5 px-3.5"
                  >
                    <div className="flex items-center gap-1">
                      <span>Kode Tablet</span>
                      {renderSortIcon("qr_code")}
                    </div>
                  </TableHead>

                  {/* Kolom 3: NPK User (35%, Left) */}
                  <TableHead
                    onClick={() => handleSort("npk")}
                    className="w-[35%] min-w-[280px] text-left align-middle cursor-pointer select-none font-bold text-xs uppercase tracking-wider text-slate-700 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors py-3.5 px-4"
                  >
                    <div className="flex items-center gap-1">
                      <span>NPK User</span>
                      {renderSortIcon("npk")}
                    </div>
                  </TableHead>

                  {/* Kolom 4: Merek (10%, Center) */}
                  <TableHead
                    onClick={() => handleSort("brand")}
                    className="w-[10%] min-w-[90px] text-center align-middle cursor-pointer select-none font-bold text-xs uppercase tracking-wider text-slate-700 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors py-3.5 px-2"
                  >
                    <div className="flex items-center justify-center gap-1">
                      <span>Merek</span>
                      {renderSortIcon("brand")}
                    </div>
                  </TableHead>

                  {/* Kolom 5: Model (11%, Center) */}
                  <TableHead
                    onClick={() => handleSort("model")}
                    className="w-[11%] min-w-[95px] text-center align-middle cursor-pointer select-none font-bold text-xs uppercase tracking-wider text-slate-700 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors py-3.5 px-2"
                  >
                    <div className="flex items-center justify-center gap-1">
                      <span>Model</span>
                      {renderSortIcon("model")}
                    </div>
                  </TableHead>

                  {/* Kolom 6: Lokasi Penempatan (20%, Left) */}
                  <TableHead
                    onClick={() => handleSort("location")}
                    className="w-[20%] min-w-[170px] text-left align-middle cursor-pointer select-none font-bold text-xs uppercase tracking-wider text-slate-700 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors py-3.5 px-3.5"
                  >
                    <div className="flex items-center gap-1">
                      <span>Lokasi Penempatan</span>
                      {renderSortIcon("location")}
                    </div>
                  </TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-12 text-slate-500">
                      <div className="flex flex-col items-center justify-center gap-3">
                        <RefreshCw className="w-6 h-6 animate-spin text-indigo-500" />
                        <span className="text-sm font-medium">Memuat data pemetaan user & tablet...</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : mappings.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-12 text-slate-500">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 mb-1">
                          <Smartphone className="w-6 h-6" />
                        </div>
                        <p className="font-semibold text-slate-700 dark:text-slate-300 text-sm">
                          Tidak ada data pemetaan yang sesuai kriteria pencarian.
                        </p>
                        <p className="text-xs text-slate-400 max-w-sm">
                          Coba atur ulang kata kunci pencarian atau ubah filter lokasi / user di atas.
                        </p>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleResetFilters}
                          className="mt-3 rounded-lg text-xs"
                        >
                          Reset Semua Filter
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  mappings.map((item, idx) => {
                    const rowNumber = (currentPage - 1) * pageSize + idx + 1;

                    return (
                      <TableRow
                        key={item.id}
                        className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors border-b border-slate-100 dark:border-slate-800/80 h-[64px]"
                      >
                        {/* 1. No (5%, Center) */}
                        <TableCell className="text-center align-middle font-medium text-slate-500 dark:text-slate-400 text-xs py-3 px-2">
                          {rowNumber}
                        </TableCell>

                        {/* 2. Kode Tablet (19%, Left) */}
                        <TableCell className="align-middle py-3 px-3.5">
                          <div className="flex items-center gap-2">
                            <span className="inline-flex items-center justify-center px-2.5 py-1 rounded-lg bg-indigo-50/80 text-indigo-700 dark:bg-indigo-950/70 dark:text-indigo-300 border border-indigo-200/80 dark:border-indigo-800 font-mono font-bold text-xs shadow-xs shrink-0 tracking-wide">
                              {item.qr_code}
                            </span>
                            {item.serial_number && (
                              <span className="text-xs font-mono text-slate-400 dark:text-slate-500 truncate" title={item.serial_number}>
                                ({item.serial_number})
                              </span>
                            )}
                          </div>
                        </TableCell>

                        {/* 3. NPK User (35%, Left) */}
                        <TableCell className="align-middle py-3 px-4">
                          {item.has_user && item.users && item.users.length > 0 ? (
                            <div className="text-xs sm:text-sm text-slate-800 dark:text-slate-200 leading-relaxed">
                              {item.users.map((u, i) => (
                                <span key={u.id || i} className="inline">
                                  {i > 0 && (
                                    <span className="text-slate-400 dark:text-slate-500 font-normal px-1">
                                      {i === item.users.length - 1 ? "dan" : ","}
                                    </span>
                                  )}
                                  <span className="font-mono font-bold text-slate-900 dark:text-slate-100">
                                    {u.npk || "-"}
                                  </span>{" "}
                                  <span className="font-normal text-slate-600 dark:text-slate-400">
                                    ({u.name})
                                  </span>
                                </span>
                              ))}
                            </div>
                          ) : (
                            <div className="flex items-center">
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800">
                                <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                                Belum Ada PIC
                              </span>
                            </div>
                          )}
                        </TableCell>

                        {/* 4. Merek (10%, Center) */}
                        <TableCell className="text-center align-middle text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-300 py-3 px-2">
                          {item.brand || "Samsung"}
                        </TableCell>

                        {/* 5. Model (11%, Center) */}
                        <TableCell className="text-center align-middle text-xs sm:text-sm font-normal text-slate-600 dark:text-slate-400 py-3 px-2">
                          {item.model || "-"}
                        </TableCell>

                        {/* 6. Lokasi Penempatan (20%, Left) */}
                        <TableCell className="align-middle py-3 px-3.5">
                          {item.has_location && item.location_name ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 max-w-full">
                              <MapPin className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                              <span className="font-semibold truncate">{item.location_name}</span>
                              {item.location_code && (
                                <span className="text-[10px] text-slate-400 dark:text-slate-500 font-mono shrink-0 ml-0.5">
                                  [{item.location_code}]
                                </span>
                              )}
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-800">
                              <Building2 className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                              Belum Ada Lokasi
                            </span>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>

          {/* ── Table Footer & Pagination ── */}
          <div className="p-4 border-t border-slate-100 dark:border-slate-800">
            <DataTablePagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalRecords={totalRecords}
              pageSize={pageSize}
              onPageChange={setCurrentPage}
            />
          </div>
        </CardContent>
      </Card>

      {/* ── Guidance / Info Note for Super Admin ── */}
      <div className="p-4 rounded-2xl bg-indigo-50/60 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/40 flex items-start gap-3 text-indigo-900 dark:text-indigo-200 text-xs">
        <HelpCircle className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <span className="font-bold">Mekanisme Relasi Penugasan TabMonitor:</span>
          <p className="text-slate-600 dark:text-slate-300 leading-relaxed text-[11px]">
            Data pemetaan dihitung berdasarkan <strong>Kode Tablet</strong> sebagai baris utama. Satu tablet dapat dipetakan ke satu atau beberapa User (PIC) penanggung jawab pada area/lokasi penempatan operasional (
            <code>tablets.location_id = users.location_id</code>). Apabila terdapat tablet berstatus{" "}
            <em>Belum Ada PIC</em>, Super Admin dapat menugaskan PIC melalui menu <strong>Kelola User</strong> dengan memilih lokasi penugasan terkait.
          </p>
        </div>
      </div>
    </div>
  );
}
