"use client";

import React, { useState, useEffect } from "react";
import { PageHeader } from "@/components/shared/page-header";
import { QRScanner } from "@/components/pic/qr-scanner";
import { InspectionForm } from "@/components/pic/inspection-form";
import { StatusBadge } from "@/components/shared/status-badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { tabletsService } from "@/services/tablets.service";
import { periodsService } from "@/services/periods.service";
import { authService } from "@/services/auth.service";
import { inspectionsService, Inspection } from "@/services/inspections.service";
import { Tablet, InspectionPeriod, User } from "@/types";
import {
  QrCode,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  RefreshCw,
  History,
  LayoutDashboard,
  Tablet as TabletIcon,
  MapPin,
  Calendar,
} from "lucide-react";
import Link from "next/link";

export default function PicScanPage() {
  const [step, setStep] = useState<"scan" | "validating" | "form" | "already_inspected" | "success">("scan");
  const [scannedTablet, setScannedTablet] = useState<Tablet | null>(null);
  const [activePeriod, setActivePeriod] = useState<InspectionPeriod | null>(null);
  const [existingInspection, setExistingInspection] = useState<Inspection | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const [currentUser, setCurrentUser] = useState<User | null>(null);

  useEffect(() => {
    periodsService.getActivePeriod().then((p) => setActivePeriod(p));
    authService.getCurrentProfile().then((u) => setCurrentUser(u));
  }, []);

  const handleScanSuccess = async (qrCode: string) => {
    setStep("validating");
    setErrorMessage(null);
    setLoading(true);

    try {
      // 1. Fetch tablet details
      const tablet = await tabletsService.getTabletByQr(qrCode);
      if (!tablet) {
        setErrorMessage(`QR Code "${qrCode}" tidak terdaftar dalam sistem inventaris.`);
        setStep("scan");
        setLoading(false);
        return;
      }

      setScannedTablet(tablet);

      // 2. Fetch active period
      const period = activePeriod || (await periodsService.getActivePeriod());
      if (!period) {
        setErrorMessage("Tidak ada Periode Inspeksi Aktif saat ini.");
        setStep("scan");
        setLoading(false);
        return;
      }

      // 3. Validate duplicate inspection
      const existing = await inspectionsService.checkTabletInspectedInPeriod(tablet.id, period.id);
      if (existing) {
        setExistingInspection(existing);
        setStep("already_inspected");
      } else {
        setStep("form");
      }
    } catch (e: any) {
      setErrorMessage(e.message || "Gagal memproses QR Code.");
      setStep("scan");
    } finally {
      setLoading(false);
    }
  };

  const handleFormSubmit = async (formData: any) => {
    if (!scannedTablet || !activePeriod) return;

    try {
      await inspectionsService.submitInspection({
        period_id: activePeriod.id,
        tablet_id: scannedTablet.id,
        pic_id: currentUser?.id || "user-pic-demo",
        tablet_condition: formData.tablet_condition,
        charger_condition: formData.charger_condition,
        case_condition: formData.case_condition,
        battery_pct: formData.battery_pct,
        notes: formData.notes,
        gps_lat: formData.gps_lat,
        gps_lng: formData.gps_lng,
        photos: formData.photos,
        tablet_code: scannedTablet.qr_code,
        year: activePeriod.year,
        month: activePeriod.month,
      });

      setStep("success");
    } catch (err: any) {
      setErrorMessage(err.message || "Gagal menyimpan hasil inspeksi ke database Supabase.");
      setStep("scan");
    }
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <PageHeader
        title="Pemindaian QR & Inspeksi Tablet"
        description="Pindai QR Code pada unit tablet untuk melakukan pengujian rutin bulanan."
      />

      {errorMessage && (
        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-300 text-sm font-semibold flex items-center justify-between animate-in fade-in">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 shrink-0" />
            <span>{errorMessage}</span>
          </div>
          <Button variant="ghost" size="sm" onClick={() => setErrorMessage(null)}>
            Tutup
          </Button>
        </div>
      )}

      {/* Step 1: Scan Mode */}
      {step === "scan" && (
        <div className="space-y-6">
          <QRScanner onScanSuccess={handleScanSuccess} />
        </div>
      )}

      {/* Step 2: Validating */}
      {step === "validating" && (
        <Card className="p-12 text-center">
          <CardContent className="space-y-4 pt-6">
            <RefreshCw className="h-8 w-8 text-indigo-600 animate-spin mx-auto" />
            <h3 className="text-base font-bold">Memvalidasi Kode QR & Memeriksa Data Tablet...</h3>
            <p className="text-xs text-slate-500">Mohon tunggu sebentar.</p>
          </CardContent>
        </Card>
      )}

      {/* Step 3: Already Inspected Warning */}
      {step === "already_inspected" && scannedTablet && (
        <Card className="border-amber-200 dark:border-amber-900 shadow-xl overflow-hidden">
          <CardHeader className="bg-amber-50 dark:bg-amber-950/40 border-b border-amber-100 dark:border-amber-900/50">
            <CardTitle className="text-base text-amber-700 dark:text-amber-300 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              <span>Tablet Sudah Diinspeksi Periode Ini</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            <p className="text-sm text-slate-700 dark:text-slate-300">
              Tablet <span className="font-mono font-bold text-indigo-600">{scannedTablet.qr_code}</span> ({scannedTablet.model}) sudah pernah di-inspeksi pada periode <span className="font-bold">{activePeriod?.name}</span>.
            </p>

            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Status Review:</span>
                <StatusBadge status={existingInspection?.status || "pending"} />
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Waktu Pengiriman:</span>
                <span className="font-mono">
                  {existingInspection?.submitted_at
                    ? new Date(existingInspection.submitted_at).toLocaleString("id-ID")
                    : "-"}
                </span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <Button
                onClick={() => setStep("scan")}
                className="flex-1 bg-indigo-600 hover:bg-indigo-700 font-bold gap-2"
              >
                <QrCode className="h-4 w-4" />
                <span>Scan Tablet Lain</span>
              </Button>
              <Link href="/pic/inspections" className="flex-1">
                <Button variant="outline" className="w-full gap-2 font-bold">
                  <History className="h-4 w-4" />
                  <span>Lihat Riwayat Inspeksi</span>
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 4: Inspection Form */}
      {step === "form" && scannedTablet && activePeriod && (
        <InspectionForm
          tablet={scannedTablet}
          activePeriod={activePeriod}
          picId="20000000-0000-0000-0000-000000000002"
          onSubmit={handleFormSubmit}
          onCancel={() => setStep("scan")}
        />
      )}

      {/* Step 5: Success Screen */}
      {step === "success" && (
        <Card className="border-emerald-200 dark:border-emerald-950 shadow-2xl overflow-hidden animate-in zoom-in-95">
          <CardContent className="p-8 text-center space-y-6">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-300 flex items-center justify-center mx-auto shadow-inner">
              <CheckCircle2 className="h-10 w-10" />
            </div>

            <div className="space-y-2">
              <h2 className="text-2xl font-extrabold text-slate-900 dark:text-slate-100">
                Inspeksi Berhasil Dikirimkan!
              </h2>
              <p className="text-sm text-slate-500 max-w-md mx-auto">
                Data inspeksi tablet <span className="font-mono font-bold text-indigo-600">{scannedTablet?.qr_code}</span> telah tersimpan di Supabase dan sedang menunggu persetujuan Manager.
              </p>
            </div>

            {/* Action Buttons Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-4 max-w-lg mx-auto">
              <Button
                onClick={() => setStep("scan")}
                className="bg-indigo-600 hover:bg-indigo-700 font-bold gap-2"
              >
                <QrCode className="h-4 w-4" />
                <span>Scan Tablet Berikutnya</span>
              </Button>

              <Link href="/pic/inspections" className="block">
                <Button variant="outline" className="w-full gap-2 font-semibold">
                  <History className="h-4 w-4" />
                  <span>Riwayat Inspeksi</span>
                </Button>
              </Link>

              <Link href="/pic/dashboard" className="block">
                <Button variant="ghost" className="w-full gap-2 font-semibold text-slate-600">
                  <LayoutDashboard className="h-4 w-4" />
                  <span>Kembali Dashboard</span>
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
