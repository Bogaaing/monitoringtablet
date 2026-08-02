"use client";

import React, { useState, useRef } from "react";
import * as XLSX from "xlsx";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { tabletsService } from "@/services/tablets.service";
import { locationsService } from "@/services/locations.service";
import { usersService } from "@/services/users.service";
import { Location, User, TabletStatus } from "@/types";
import {
  FileSpreadsheet,
  UploadCloud,
  CheckCircle2,
  AlertTriangle,
  X,
  FileText,
  Download,
  Loader2,
  ArrowRight,
  ArrowLeft,
  Check,
  Ban,
  QrCode,
  ShieldCheck,
} from "lucide-react";

export interface ParsedRow {
  rowNum: number;
  qr_code: string;
  serial_number: string;
  brand: string;
  model: string;
  location_name: string;
  pic_name: string;
  status_raw: string;
  status_clean: TabletStatus;
  location_id?: string | null;
  pic_id?: string | null;
  isValid: boolean;
  errors: string[];
}

interface TabletImportWizardProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function TabletImportWizard({ isOpen, onClose, onSuccess }: TabletImportWizardProps) {
  // Stepper state (1: Upload, 2: Validate, 3: Preview, 4: Import Progress, 5: Complete)
  const [step, setStep] = useState<number>(1);
  const [file, setFile] = useState<File | null>(null);

  // Parsing & Validation Data
  const [parsedRows, setParsedRows] = useState<ParsedRow[]>([]);
  const [validCount, setValidCount] = useState<number>(0);
  const [invalidCount, setInvalidCount] = useState<number>(0);
  const [validating, setValidating] = useState<boolean>(false);

  // Import Progress
  const [importing, setImporting] = useState<boolean>(false);
  const [importProgress, setImportProgress] = useState<number>(0);

  // Final Results
  const [successCount, setSuccessCount] = useState<number>(0);
  const [failedCount, setFailedCount] = useState<number>(0);
  const [failedRowsReport, setFailedRowsReport] = useState<Array<{ rowNum: number; qr_code: string; errors: string }>>([]);

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  // File Drop / Selection Handler
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      processSelectedFile(selectedFile);
    }
  };

  const processSelectedFile = (selectedFile: File) => {
    if (!selectedFile.name.endsWith(".xlsx") && !selectedFile.name.endsWith(".xls")) {
      alert("Format file tidak didukung. Mohon upload file dengan ekstensi .xlsx");
      return;
    }
    if (selectedFile.size > 10 * 1024 * 1024) {
      alert("Ukuran file melebihi batas maksimal 10 MB.");
      return;
    }
    setFile(selectedFile);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processSelectedFile(e.dataTransfer.files[0]);
    }
  };

  // STEP 2 & 3: Read & Validate Excel File
  const handleValidateAndPreview = async () => {
    if (!file) return;
    setStep(2);
    setValidating(true);

    try {
      // 1. Fetch DB records for reference validation
      const [existingTabletsRes, locationsList, usersRes] = await Promise.all([
        tabletsService.getTablets({ limit: 1000 }),
        locationsService.getAllLocations(),
        usersService.getUsers({ limit: 1000 }),
      ]);

      const existingQrCodes = new Set(existingTabletsRes.data.map((t) => t.qr_code.toLowerCase()));
      const existingSerials = new Set(existingTabletsRes.data.map((t) => t.serial_number.toLowerCase()));

      const reader = new FileReader();
      reader.onload = (evt) => {
        try {
          const bstr = evt.target?.result;
          const wb = XLSX.read(bstr, { type: "binary" });
          const wsname = wb.SheetNames[0];
          const ws = wb.Sheets[wsname];
          const rawData = XLSX.utils.sheet_to_json<any>(ws, { header: 1 });

          if (!rawData || rawData.length < 2) {
            alert("File Excel kosong atau tidak memiliki baris data.");
            setStep(1);
            setValidating(false);
            return;
          }

          // Header row mapping (Case-insensitive)
          const headers: string[] = rawData[0].map((h: any) => String(h || "").trim().toLowerCase());

          const qrIdx = headers.findIndex((h) => h.includes("code") || h.includes("kode") || h.includes("qr"));
          const snIdx = headers.findIndex((h) => h.includes("serial") || h.includes("sn"));
          const brandIdx = headers.findIndex((h) => h.includes("brand") || h.includes("merk"));
          const modelIdx = headers.findIndex((h) => h.includes("model") || h.includes("tipe"));
          const locIdx = headers.findIndex((h) => h.includes("location") || h.includes("lokasi"));
          const picIdx = headers.findIndex((h) => h.includes("pic") || h.includes("assigned"));
          const statusIdx = headers.findIndex((h) => h.includes("status"));

          const fileQrCodesSeen = new Set<string>();
          const fileSerialsSeen = new Set<string>();

          const rows: ParsedRow[] = [];
          let validTotal = 0;
          let invalidTotal = 0;

          for (let i = 1; i < rawData.length; i++) {
            const row = rawData[i];
            if (!row || row.length === 0 || row.every((cell: any) => cell === undefined || cell === null || String(cell).trim() === "")) {
              continue; // Skip empty rows
            }

            const rowNum = i + 1;
            const qr_code = String(row[qrIdx] || "").trim().toUpperCase();
            const serial_number = String(row[snIdx] || "").trim().toUpperCase();
            const brand = String(row[brandIdx] || "").trim();
            const model = String(row[modelIdx] || "").trim();
            const location_name = String(row[locIdx] || "").trim();
            const pic_name = String(row[picIdx] || "").trim();
            const status_raw = String(row[statusIdx] || "").trim();

            const rowErrors: string[] = [];

            // Validation Rule 1: Tablet Code
            if (!qr_code) {
              rowErrors.push("Kode Tablet (QR) wajib diisi");
            } else if (fileQrCodesSeen.has(qr_code.toLowerCase())) {
              rowErrors.push(`Kode Tablet '${qr_code}' ganda di dalam file Excel`);
            } else if (existingQrCodes.has(qr_code.toLowerCase())) {
              rowErrors.push(`Kode Tablet '${qr_code}' sudah terdaftar di sistem`);
            }
            if (qr_code) fileQrCodesSeen.add(qr_code.toLowerCase());

            // Validation Rule 2: Serial Number
            if (!serial_number) {
              rowErrors.push("Serial Number wajib diisi");
            } else if (fileSerialsSeen.has(serial_number.toLowerCase())) {
              rowErrors.push(`Serial Number '${serial_number}' ganda di dalam file Excel`);
            } else if (existingSerials.has(serial_number.toLowerCase())) {
              rowErrors.push(`Serial Number '${serial_number}' sudah terdaftar di sistem`);
            }
            if (serial_number) fileSerialsSeen.add(serial_number.toLowerCase());

            // Validation Rule 3: Brand & Model
            if (!brand) rowErrors.push("Merk (Brand) wajib diisi");
            if (!model) rowErrors.push("Model Device wajib diisi");

            // Validation Rule 4: Location Lookup
            let location_id: string | null = null;
            if (location_name) {
              const matchedLoc = locationsList.find(
                (l) =>
                  l.name.toLowerCase() === location_name.toLowerCase() ||
                  l.code.toLowerCase() === location_name.toLowerCase()
              );
              if (matchedLoc) {
                location_id = matchedLoc.id;
              } else {
                rowErrors.push(`Lokasi '${location_name}' tidak ditemukan`);
              }
            } else {
              rowErrors.push("Lokasi Penempatan wajib diisi");
            }

            // Validation Rule 5: Assigned PIC (Optional)
            let pic_id: string | null = null;
            if (pic_name) {
              const matchedPic = usersRes.data.find(
                (u) =>
                  u.name.toLowerCase().includes(pic_name.toLowerCase()) ||
                  u.email.toLowerCase() === pic_name.toLowerCase()
              );
              if (matchedPic) {
                pic_id = matchedPic.id;
              } else {
                rowErrors.push(`PIC '${pic_name}' tidak ditemukan di sistem`);
              }
            }

            // Validation Rule 6: Status mapping
            let status_clean: TabletStatus = "active";
            const stLower = status_raw.toLowerCase();
            if (stLower.includes("active") || stLower.includes("aktif")) status_clean = "active";
            else if (stLower.includes("maintenance") || stLower.includes("perbaikan")) status_clean = "maintenance";
            else if (stLower.includes("inactive") || stLower.includes("non")) status_clean = "inactive";
            else if (stLower.includes("lost") || stLower.includes("hilang")) status_clean = "lost";
            else if (status_raw) {
              rowErrors.push(`Status '${status_raw}' tidak valid (Gunakan: Active, Inactive, Maintenance, Lost)`);
            }

            const isValid = rowErrors.length === 0;
            if (isValid) validTotal++;
            else invalidTotal++;

            rows.push({
              rowNum,
              qr_code,
              serial_number,
              brand,
              model,
              location_name,
              pic_name,
              status_raw,
              status_clean,
              location_id,
              pic_id,
              isValid,
              errors: rowErrors,
            });
          }

          setParsedRows(rows);
          setValidCount(validTotal);
          setInvalidCount(invalidTotal);
          setStep(3); // Go to Preview
        } catch (err) {
          alert("Gagal membaca berkas Excel. Pastikan struktur berkas sesuai dengan template.");
          setStep(1);
        } finally {
          setValidating(false);
        }
      };
      reader.readAsBinaryString(file);
    } catch (e) {
      alert("Terjadi kesalahan saat memvalidasi data.");
      setStep(1);
      setValidating(false);
    }
  };

  // STEP 4: Execute Batch Import
  const handleExecuteImport = async () => {
    const validRows = parsedRows.filter((r) => r.isValid);
    if (validRows.length === 0) {
      alert("Tidak ada baris valid yang dapat di-import.");
      return;
    }

    setStep(4);
    setImporting(true);
    setImportProgress(0);

    const failedReport: Array<{ rowNum: number; qr_code: string; errors: string }> = parsedRows
      .filter((r) => !r.isValid)
      .map((r) => ({
        rowNum: r.rowNum,
        qr_code: r.qr_code || "-",
        errors: r.errors.join("; "),
      }));

    try {
      // Simulate/Execute Batch Import in chunks of 50
      const batchSize = 50;
      let totalSuccess = 0;
      const importedRecords = [];

      for (let i = 0; i < validRows.length; i += batchSize) {
        const chunk = validRows.slice(i, i + batchSize);

        const res = await tabletsService.bulkImportTablets(
          chunk.map((c) => ({
            qr_code: c.qr_code,
            serial_number: c.serial_number,
            brand: c.brand,
            model: c.model,
            location_id: c.location_id,
            status: c.status_clean,
          }))
        );

        totalSuccess += res.successCount;
        importedRecords.push(...res.imported);

        const pct = Math.min(100, Math.round(((i + chunk.length) / validRows.length) * 100));
        setImportProgress(pct);
      }

      setSuccessCount(totalSuccess);
      setFailedCount(failedReport.length);
      setFailedRowsReport(failedReport);
      setStep(5); // Go to Completed
    } catch (e) {
      alert("Terjadi kesalahan saat menyimpan data import.");
    } finally {
      setImporting(false);
    }
  };

  // Download Error Report Excel
  const handleDownloadErrorReport = () => {
    if (failedRowsReport.length === 0) return;

    const data = failedRowsReport.map((r) => ({
      "Nomor Baris": r.rowNum,
      "Kode Tablet (QR)": r.qr_code,
      "Alasan Kegagalan / Error": r.errors,
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Error Report");
    XLSX.writeFile(wb, `Laporan_Error_Import_Tablet_${Date.now()}.xlsx`);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md animate-in fade-in">
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-4xl w-full flex flex-col max-h-[90vh] overflow-hidden relative">
        
        {/* Header Bar */}
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/50">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-indigo-600 text-white shadow-md shadow-indigo-200">
              <FileSpreadsheet className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-lg font-black text-slate-900 dark:text-slate-100">
                Bulk Import Inventaris Tablet
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                Pendaftaran kolektif ratusan unit tablet menggunakan berkas Excel (.xlsx)
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Wizard Stepper Navigation */}
        <div className="px-8 py-4 bg-slate-100/70 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs font-semibold">
          {[
            { num: 1, label: "Upload File" },
            { num: 2, label: "Validasi" },
            { num: 3, label: "Preview Data" },
            { num: 4, label: "Proses Import" },
            { num: 5, label: "Selesai" },
          ].map((s) => (
            <div key={s.num} className="flex items-center gap-2">
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs transition-all ${
                  step === s.num
                    ? "bg-indigo-600 text-white ring-4 ring-indigo-100 dark:ring-indigo-950 shadow"
                    : step > s.num
                    ? "bg-emerald-500 text-white"
                    : "bg-slate-200 dark:bg-slate-700 text-slate-500"
                }`}
              >
                {step > s.num ? <Check className="h-3.5 w-3.5 stroke-[3]" /> : s.num}
              </div>
              <span className={step === s.num ? "text-indigo-600 dark:text-indigo-400 font-bold" : "text-slate-500"}>
                {s.label}
              </span>
              {s.num < 5 && <div className="w-8 h-0.5 bg-slate-300 dark:bg-slate-700 hidden sm:block" />}
            </div>
          ))}
        </div>

        {/* Content Body Scrollable */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          
          {/* STEP 1: UPLOAD */}
          {step === 1 && (
            <div className="space-y-6">
              <div
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-indigo-200 dark:border-indigo-900/60 rounded-3xl p-10 text-center hover:bg-indigo-50/40 dark:hover:bg-indigo-950/20 transition-all cursor-pointer group flex flex-col items-center justify-center space-y-3"
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept=".xlsx, .xls"
                  className="hidden"
                />
                <div className="w-16 h-16 rounded-3xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600 flex items-center justify-center group-hover:scale-110 transition-transform shadow-sm">
                  <UploadCloud className="h-8 w-8" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                    Tarik & Lepas Berkas Excel di Sini
                  </h4>
                  <p className="text-xs text-slate-400 mt-1">
                    atau klik untuk menjelajah file dari komputer Anda
                  </p>
                </div>
                <div className="text-[11px] text-slate-400 bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-full font-mono">
                  Format Didukung: .XLSX • Batas Maksimal: 10 MB
                </div>
              </div>

              {/* Selected File Card */}
              {file && (
                <div className="p-4 rounded-2xl bg-indigo-50/80 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-900 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <FileSpreadsheet className="h-6 w-6 text-indigo-600" />
                    <div>
                      <h5 className="text-xs font-bold text-slate-900 dark:text-slate-100">{file.name}</h5>
                      <span className="text-[10px] text-slate-500 font-mono">
                        {(file.size / 1024).toFixed(1)} KB
                      </span>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    onClick={handleValidateAndPreview}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold gap-2 text-xs"
                  >
                    <span>Lanjutkan & Validasi</span>
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* STEP 2: VALIDATING SPINNER */}
          {step === 2 && (
            <div className="py-16 text-center space-y-4">
              <Loader2 className="h-10 w-10 text-indigo-600 animate-spin mx-auto" />
              <h4 className="text-base font-bold text-slate-900 dark:text-slate-100">
                Memeriksa & Memvalidasi Data Excel...
              </h4>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Memverifikasi keunikan Kode Tablet, Serial Number, serta kecocokan data Lokasi dan PIC.
              </p>
            </div>
          )}

          {/* STEP 3: PREVIEW & VALIDATION SUMMARY */}
          {step === 3 && (
            <div className="space-y-6">
              {/* Validation Summary Cards */}
              <div className="grid grid-cols-3 gap-4">
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                  <span className="text-xs font-semibold text-slate-500 block">Total Baris Terbaca</span>
                  <span className="text-2xl font-black text-slate-900 dark:text-slate-100">
                    {parsedRows.length} Baris
                  </span>
                </div>

                <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900">
                  <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 block">
                    Baris Valid (Siap Import)
                  </span>
                  <span className="text-2xl font-black text-emerald-700 dark:text-emerald-400">
                    {validCount} Baris
                  </span>
                </div>

                <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900">
                  <span className="text-xs font-semibold text-rose-700 dark:text-rose-400 block">
                    Baris Invalid (Bermasalah)
                  </span>
                  <span className="text-2xl font-black text-rose-700 dark:text-rose-400">
                    {invalidCount} Baris
                  </span>
                </div>
              </div>

              {/* Preview Table */}
              <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden max-h-[340px] overflow-y-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>No. Baris</TableHead>
                      <TableHead>Kode Tablet</TableHead>
                      <TableHead>Serial Number</TableHead>
                      <TableHead>Merk & Model</TableHead>
                      <TableHead>Lokasi</TableHead>
                      <TableHead>Assigned PIC</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Hasil Validasi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {parsedRows.map((r) => (
                      <TableRow
                        key={r.rowNum}
                        className={
                          r.isValid
                            ? "hover:bg-slate-50/50"
                            : "bg-rose-50/60 dark:bg-rose-950/30 hover:bg-rose-100/50 border-l-4 border-l-rose-500"
                        }
                      >
                        <TableCell className="font-mono text-xs font-bold text-slate-500">
                          #{r.rowNum}
                        </TableCell>
                        <TableCell className="font-mono text-xs font-bold text-indigo-600">
                          {r.qr_code || "-"}
                        </TableCell>
                        <TableCell className="font-mono text-xs text-slate-700 dark:text-slate-300">
                          {r.serial_number || "-"}
                        </TableCell>
                        <TableCell className="text-xs font-semibold">
                          {r.brand} {r.model}
                        </TableCell>
                        <TableCell className="text-xs text-slate-600">
                          {r.location_name || "-"}
                        </TableCell>
                        <TableCell className="text-xs text-slate-600">
                          {r.pic_name || "-"}
                        </TableCell>
                        <TableCell className="text-xs font-bold uppercase">
                          {r.status_clean}
                        </TableCell>
                        <TableCell>
                          {r.isValid ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                              <Check className="h-3 w-3 stroke-[3]" />
                              <span>Valid</span>
                            </span>
                          ) : (
                            <div className="space-y-1">
                              {r.errors.map((errStr, idx) => (
                                <span
                                  key={idx}
                                  className="inline-flex items-center gap-1 text-[10px] font-semibold text-rose-700 bg-rose-100 px-2 py-0.5 rounded-full border border-rose-200 block"
                                >
                                  <Ban className="h-3 w-3 shrink-0" />
                                  <span>{errStr}</span>
                                </span>
                              ))}
                            </div>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {invalidCount > 0 && (
                <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 text-xs text-amber-800 dark:text-amber-300 flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 shrink-0 text-amber-600" />
                  <span>
                    Baris yang memiliki status <strong>Invalid</strong> akan dilewati secara otomatis saat proses import dijalankan.
                  </span>
                </div>
              )}
            </div>
          )}

          {/* STEP 4: IMPORT PROGRESS */}
          {step === 4 && (
            <div className="py-16 text-center space-y-6 max-w-md mx-auto">
              <div className="w-16 h-16 rounded-full bg-indigo-50 dark:bg-indigo-950 text-indigo-600 flex items-center justify-center mx-auto shadow-md animate-pulse">
                <QrCode className="h-8 w-8" />
              </div>
              <div>
                <h4 className="text-base font-bold text-slate-900 dark:text-slate-100">
                  Memproses Import Data & Generasi Kode QR...
                </h4>
                <p className="text-xs text-slate-500 mt-1">
                  Memasukkan data tablet valid ke dalam Supabase dan menetapkan referensi unik Kode QR.
                </p>
              </div>

              {/* Progress Bar */}
              <div className="space-y-2">
                <div className="flex justify-between text-xs font-bold text-slate-700 dark:text-slate-300">
                  <span>Progres Batch Import</span>
                  <span>{importProgress}%</span>
                </div>
                <div className="w-full bg-slate-200 dark:bg-slate-800 h-3 rounded-full overflow-hidden">
                  <div
                    className="bg-indigo-600 h-full transition-all duration-300 rounded-full"
                    style={{ width: `${importProgress}%` }}
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 5: COMPLETED SUMMARY */}
          {step === 5 && (
            <div className="py-8 text-center space-y-6 max-w-lg mx-auto">
              <div className="w-20 h-20 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-600 flex items-center justify-center mx-auto shadow-lg shadow-emerald-200 dark:shadow-none">
                <CheckCircle2 className="h-10 w-10 stroke-[2.5]" />
              </div>

              <div>
                <h4 className="text-xl font-black text-slate-900 dark:text-slate-100">
                  Proses Bulk Import Selesai!
                </h4>
                <p className="text-xs text-slate-500 mt-1">
                  Seluruh data tablet valid telah didaftarkan ke sistem beserta referensi Kode QR otomatis.
                </p>
              </div>

              {/* Import Results Box */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 grid grid-cols-3 gap-3 text-xs">
                <div>
                  <span className="text-slate-400 block">Total Diproses</span>
                  <span className="text-lg font-extrabold text-slate-900 dark:text-slate-100">
                    {parsedRows.length} Records
                  </span>
                </div>
                <div>
                  <span className="text-emerald-600 font-semibold block">Berhasil (Success)</span>
                  <span className="text-lg font-extrabold text-emerald-600">
                    {successCount} Unit
                  </span>
                </div>
                <div>
                  <span className="text-rose-600 font-semibold block">Gagal (Failed)</span>
                  <span className="text-lg font-extrabold text-rose-600">
                    {failedCount} Unit
                  </span>
                </div>
              </div>

              {failedCount > 0 && (
                <Button
                  variant="outline"
                  onClick={handleDownloadErrorReport}
                  className="w-full gap-2 border-rose-200 text-rose-700 hover:bg-rose-50 font-bold text-xs"
                >
                  <Download className="h-4 w-4" />
                  <span>Download Error Report (.xlsx)</span>
                </Button>
              )}
            </div>
          )}

        </div>

        {/* Wizard Footer Controls */}
        <div className="p-4 bg-slate-50 dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
          {step === 1 && (
            <Button variant="ghost" onClick={onClose}>
              Batal
            </Button>
          )}

          {step === 3 && (
            <>
              <Button variant="outline" onClick={() => setStep(1)} disabled={importing}>
                <ArrowLeft className="h-4 w-4 mr-1.5" />
                <span>Upload Ulang</span>
              </Button>

              <Button
                onClick={handleExecuteImport}
                disabled={validCount === 0 || importing}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold gap-2 text-xs"
              >
                <span>Impor {validCount} Baris Valid</span>
                <ArrowRight className="h-4 w-4" />
              </Button>
            </>
          )}

          {step === 5 && (
            <Button
              onClick={() => {
                onSuccess();
                onClose();
              }}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs"
            >
              Selesai & Refresh Data Table
            </Button>
          )}
        </div>

      </div>
    </div>
  );
}
