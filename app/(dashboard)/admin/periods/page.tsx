"use client";

import React, { useState, useEffect } from "react";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { periodsService } from "@/services/periods.service";
import { InspectionPeriod, PeriodStatus } from "@/types";
import { Calendar, Plus, CheckCircle2, XCircle, Archive, Play, AlertCircle, X, Clock } from "lucide-react";

const monthOptions = [
  { value: 1, label: "Januari" },
  { value: 2, label: "Februari" },
  { value: 3, label: "Maret" },
  { value: 4, label: "April" },
  { value: 5, label: "Mei" },
  { value: 6, label: "Juni" },
  { value: 7, label: "Juli" },
  { value: 8, label: "Agustus" },
  { value: 9, label: "September" },
  { value: 10, label: "Oktober" },
  { value: 11, label: "November" },
  { value: 12, label: "Desember" },
];

export default function AdminPeriodsPage() {
  const [periods, setPeriods] = useState<InspectionPeriod[]>([]);
  const [activePeriod, setActivePeriod] = useState<InspectionPeriod | null>(null);
  const [loading, setLoading] = useState(true);

  // Form modal
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formData, setFormData] = useState({
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
    start_date: `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, "0")}-01`,
    end_date: `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, "0")}-31`,
  });
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Action states
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  const fetchPeriodsData = async () => {
    setLoading(true);
    try {
      const list = await periodsService.getAllPeriods();
      const active = await periodsService.getActivePeriod();
      setPeriods(list);
      setActivePeriod(active);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPeriodsData();
  }, []);

  const handleMonthYearChange = (m: number, y: number) => {
    const lastDay = new Date(y, m, 0).getDate();
    const mStr = String(m).padStart(2, "0");
    setFormData({
      ...formData,
      month: m,
      year: y,
      start_date: `${y}-${mStr}-01`,
      end_date: `${y}-${mStr}-${String(lastDay).padStart(2, "0")}`,
    });
  };

  const handleCreateSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);
    setFormError(null);

    try {
      await periodsService.createPeriod(formData);
      setIsFormOpen(false);
      fetchPeriodsData();
    } catch (err: any) {
      setFormError(err.message || "Gagal membuat periode baru.");
    } finally {
      setFormLoading(false);
    }
  };

  const handleActivate = async (p: InspectionPeriod) => {
    if (
      confirm(
        `Apakah Anda yakin ingin mengaktifkan "${p.name}"?\n\nPeriode aktif saat ini akan ditutup secara otomatis dan seluruh tablet akan diset status inspeksinya untuk periode ini.`
      )
    ) {
      setActionLoadingId(p.id);
      try {
        await periodsService.activatePeriod(p.id);
        fetchPeriodsData();
      } catch (err) {
        console.error(err);
      } finally {
        setActionLoadingId(null);
      }
    }
  };

  const handleClose = async (p: InspectionPeriod) => {
    if (confirm(`Tutup periode inspeksi "${p.name}"?`)) {
      setActionLoadingId(p.id);
      try {
        await periodsService.closePeriod(p.id);
        fetchPeriodsData();
      } catch (err) {
        console.error(err);
      } finally {
        setActionLoadingId(null);
      }
    }
  };

  const handleArchive = async (p: InspectionPeriod) => {
    if (confirm(`Arsipkan periode "${p.name}"?`)) {
      setActionLoadingId(p.id);
      try {
        await periodsService.archivePeriod(p.id);
        fetchPeriodsData();
      } catch (err) {
        console.error(err);
      } finally {
        setActionLoadingId(null);
      }
    }
  };

  const renderStatusBadge = (p: InspectionPeriod) => {
    if (p.is_active || p.status === "active") {
      return (
        <Badge variant="success" className="gap-1 font-semibold">
          <CheckCircle2 className="h-3.5 w-3.5" />
          <span>Active (Sedang Berjalan)</span>
        </Badge>
      );
    }

    switch (p.status) {
      case "draft":
        return (
          <Badge variant="warning" className="gap-1">
            <Clock className="h-3.5 w-3.5" />
            <span>Draft</span>
          </Badge>
        );
      case "closed":
        return (
          <Badge variant="secondary" className="gap-1">
            <XCircle className="h-3.5 w-3.5 text-slate-500" />
            <span>Tutup (Closed)</span>
          </Badge>
        );
      case "archived":
        return (
          <Badge variant="outline" className="gap-1 text-slate-400">
            <Archive className="h-3.5 w-3.5" />
            <span>Archived</span>
          </Badge>
        );
      default:
        return <Badge variant="outline">{p.status}</Badge>;
    }
  };

  return (
    <div className="space-y-8">
      <PageHeader
        title="Kelola Periode Inspeksi Bulanan"
        description="Atur periode pengujian tablet, aktivasi periode berjalan, penutupan, dan pengarsipan."
      >
        <Button onClick={() => setIsFormOpen(true)} className="gap-2 bg-indigo-600 hover:bg-indigo-700">
          <Plus className="h-4 w-4" />
          <span>Buat Periode Baru</span>
        </Button>
      </PageHeader>

      {/* Hero Active Period Banner */}
      <Card className="bg-gradient-to-r from-indigo-900 via-slate-900 to-indigo-950 text-white border-none shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-indigo-500/10 blur-2xl pointer-events-none" />
        <CardContent className="p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-6 relative z-10">
          <div className="space-y-2 text-center md:text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 text-xs font-bold uppercase tracking-wider">
              <CheckCircle2 className="h-3.5 w-3.5" />
              <span>Status Periode Utama</span>
            </div>
            <h2 className="text-2xl md:text-3xl font-extrabold text-white">
              {activePeriod ? activePeriod.name : "Tidak Ada Periode Aktif"}
            </h2>
            <p className="text-sm text-slate-300">
              {activePeriod
                ? `Rentang Waktu: ${activePeriod.start_date} s/d ${activePeriod.end_date}`
                : "Silakan pilih dan aktifkan salah satu periode di bawah ini."}
            </p>
          </div>

          <div className="flex items-center gap-3">
            {activePeriod && (
              <Button
                variant="destructive"
                onClick={() => handleClose(activePeriod)}
                disabled={actionLoadingId === activePeriod.id}
                className="gap-2 bg-rose-600 hover:bg-rose-700 font-semibold"
              >
                <XCircle className="h-4 w-4" />
                <span>Tutup Periode Ini</span>
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Periods Table */}
      <Card>
        <CardHeader>
          <CardTitle>Daftar Seluruh Periode Inspeksi</CardTitle>
          <CardDescription>Aturan: Hanya boleh ada 1 Periode Aktif pada satu waktu.</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nama Periode</TableHead>
                <TableHead>Bulan / Tahun</TableHead>
                <TableHead>Tanggal Mulai</TableHead>
                <TableHead>Tanggal Selesai</TableHead>
                <TableHead>Status Periode</TableHead>
                <TableHead className="text-right">Aksi Management</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-slate-500">
                    Memuat data periode...
                  </TableCell>
                </TableRow>
              ) : periods.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-slate-500">
                    Belum ada periode yang dibuat.
                  </TableCell>
                </TableRow>
              ) : (
                periods.map((p) => (
                  <TableRow key={p.id} className={p.is_active ? "bg-indigo-50/40 dark:bg-indigo-950/20" : ""}>
                    <TableCell className="font-bold text-slate-900 dark:text-slate-100">
                      {p.name}
                    </TableCell>
                    <TableCell className="text-sm">
                      {monthOptions.find((m) => m.value === p.month)?.label} {p.year}
                    </TableCell>
                    <TableCell className="text-xs font-mono text-slate-600 dark:text-slate-400">
                      {p.start_date}
                    </TableCell>
                    <TableCell className="text-xs font-mono text-slate-600 dark:text-slate-400">
                      {p.end_date}
                    </TableCell>
                    <TableCell>{renderStatusBadge(p)}</TableCell>
                    <TableCell className="text-right space-x-1">
                      {!p.is_active && p.status !== "archived" && (
                        <Button
                          size="sm"
                          onClick={() => handleActivate(p)}
                          disabled={actionLoadingId === p.id}
                          className="bg-indigo-600 hover:bg-indigo-700 text-white gap-1 text-xs"
                          title="Aktifkan Periode Ini"
                        >
                          <Play className="h-3.5 w-3.5 fill-current" />
                          <span>Aktifkan</span>
                        </Button>
                      )}

                      {p.is_active && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleClose(p)}
                          disabled={actionLoadingId === p.id}
                          className="text-rose-600 border-rose-200 hover:bg-rose-50 text-xs"
                          title="Tutup Periode"
                        >
                          <XCircle className="h-3.5 w-3.5 mr-1" />
                          <span>Tutup</span>
                        </Button>
                      )}

                      {p.status === "closed" && !p.is_active && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleArchive(p)}
                          disabled={actionLoadingId === p.id}
                          className="text-slate-500 hover:text-slate-900 text-xs"
                          title="Arsipkan"
                        >
                          <Archive className="h-3.5 w-3.5 mr-1" />
                          <span>Arsipkan</span>
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Form Modal to Create Period */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-md w-full p-6 space-y-4 relative">
            <button
              onClick={() => setIsFormOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-lg"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="p-2.5 rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-300">
                <Calendar className="h-5 w-5" />
              </div>
              <h3 className="text-lg font-bold">Buat Periode Inspeksi Baru</h3>
            </div>

            <form onSubmit={handleCreateSave} className="space-y-4 pt-2">
              {formError && (
                <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-300 text-sm">
                  {formError}
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Bulan <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={formData.month}
                    onChange={(e) => handleMonthYearChange(Number(e.target.value), formData.year)}
                    className="w-full h-10 px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    {monthOptions.map((m) => (
                      <option key={m.value} value={m.value}>
                        {m.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Tahun <span className="text-rose-500">*</span>
                  </label>
                  <Input
                    type="number"
                    value={formData.year}
                    onChange={(e) => handleMonthYearChange(formData.month, Number(e.target.value))}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Tanggal Mulai <span className="text-rose-500">*</span>
                  </label>
                  <Input
                    type="date"
                    value={formData.start_date}
                    onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Tanggal Selesai <span className="text-rose-500">*</span>
                  </label>
                  <Input
                    type="date"
                    value={formData.end_date}
                    onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800 text-xs text-slate-600 dark:text-slate-400">
                Nama Otomatis:{" "}
                <span className="font-bold text-indigo-600 dark:text-indigo-400">
                  Periode {monthOptions.find((m) => m.value === formData.month)?.label} {formData.year}
                </span>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                <Button type="button" variant="outline" onClick={() => setIsFormOpen(false)} disabled={formLoading}>
                  Batal
                </Button>
                <Button type="submit" disabled={formLoading} className="bg-indigo-600 hover:bg-indigo-700">
                  {formLoading ? "Membuat..." : "Simpan Periode Draft"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
