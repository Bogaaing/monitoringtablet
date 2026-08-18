"use client";

import React, { useState, useEffect } from "react";
import { Tablet, InspectionPeriod } from "@/types";
import {
  TabletCondition,
  ChargerCondition,
  CaseCondition,
  PhotoType,
} from "@/services/inspections.service";
import { Button } from "@/components/ui/button";
import {
  Camera,
  X,
  BatteryMedium,
  MapPin,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Trash2,
  ClipboardCheck,
  Send,
  ShieldCheck,
} from "lucide-react";

import { WatermarkPreviewModal } from "@/components/pic/watermark-preview-modal";
import { WatermarkResult } from "@/lib/watermark-utils";
import { authService } from "@/services/auth.service";

interface PhotoSlotItem {
  file: File;
  previewUrl: string;
  type: PhotoType;
  capturedAt: string;
  locationName: string;
  gpsCoords?: string | null;
}

interface InspectionFormProps {
  tablet: Tablet;
  activePeriod: InspectionPeriod;
  picId: string;
  onSubmit: (formData: {
    tablet_condition: TabletCondition;
    charger_condition: ChargerCondition;
    case_condition: CaseCondition;
    battery_pct: number;
    notes?: string;
    gps_lat?: number | null;
    gps_lng?: number | null;
    photos: { file: File | Blob; type: PhotoType }[];
  }) => Promise<void>;
  onCancel: () => void;
}

export function InspectionForm({
  tablet,
  activePeriod,
  onSubmit,
  onCancel,
}: InspectionFormProps) {
  // Form Field States
  const [tabletCondition, setTabletCondition] = useState<TabletCondition>("good");
  const [chargerCondition, setChargerCondition] = useState<ChargerCondition>("available");
  const [caseCondition, setCaseCondition] = useState<CaseCondition>("good");
  const [batteryPct, setBatteryPct] = useState<number>(85);
  const [notes, setNotes] = useState<string>("");

  // 2 Photo Slots (Front & Back)
  const [frontPhoto, setFrontPhoto] = useState<PhotoSlotItem | null>(null);
  const [backPhoto, setBackPhoto] = useState<PhotoSlotItem | null>(null);

  // Watermark Modal state
  const [isWatermarkModalOpen, setIsWatermarkModalOpen] = useState(false);
  const [targetPhotoSlot, setTargetPhotoSlot] = useState<"front" | "back">("front");
  const [picName, setPicName] = useState<string>("Ahmad Rizky");

  // GPS Location
  const [gpsLocation, setGpsLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  // Fetch current PIC profile & Auto-acquire Geolocation on mount
  useEffect(() => {
    authService.getCurrentProfile().then((user) => {
      if (user?.name) setPicName(user.name);
    });

    if (typeof window !== "undefined" && "geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setGpsLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        },
        (err) => console.log("GPS unavailable:", err.message),
        { timeout: 5000 }
      );
    }
  }, []);

  const handleOpenPhotoCapture = (slot: "front" | "back") => {
    setTargetPhotoSlot(slot);
    setIsWatermarkModalOpen(true);
  };

  const handleWatermarkConfirmed = (result: WatermarkResult, photoType: PhotoType) => {
    const now = new Date();
    const formattedTime = now.toLocaleTimeString("id-ID", {
      hour: "2-digit",
      minute: "2-digit",
    });
    const formattedDate = now.toLocaleDateString("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });

    const photoItem: PhotoSlotItem = {
      file: result.file,
      previewUrl: result.previewUrl,
      type: photoType,
      capturedAt: `${formattedDate}, ${formattedTime} WIB`,
      locationName: tablet.location?.name || "Gudang Utama A",
      gpsCoords: gpsLocation
        ? `${gpsLocation.lat.toFixed(5)}, ${gpsLocation.lng.toFixed(5)}`
        : null,
    };

    if (targetPhotoSlot === "front") {
      if (frontPhoto?.previewUrl) URL.revokeObjectURL(frontPhoto.previewUrl);
      setFrontPhoto(photoItem);
    } else {
      if (backPhoto?.previewUrl) URL.revokeObjectURL(backPhoto.previewUrl);
      setBackPhoto(photoItem);
    }
  };

  const handleRemovePhoto = (slot: "front" | "back") => {
    if (slot === "front") {
      if (frontPhoto?.previewUrl) URL.revokeObjectURL(frontPhoto.previewUrl);
      setFrontPhoto(null);
    } else {
      if (backPhoto?.previewUrl) URL.revokeObjectURL(backPhoto.previewUrl);
      setBackPhoto(null);
    }
  };

  const handleValidateAndPromptConfirm = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    // Validation 1: Notes required if tablet is not good
    if (tabletCondition !== "good" && (!notes || notes.trim().length < 5)) {
      setErrorMessage("Catatan inspeksi wajib diisi jika kondisi fisik tablet bukan Baik.");
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    // Validation 2: Photo evidence (minimal 1 foto depan atau belakang)
    if (!frontPhoto && !backPhoto) {
      setErrorMessage("Wajib mengambil minimal 1 foto fisik tablet sebagai bukti dokumentasi.");
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    setShowConfirmModal(true);
  };

  const handleConfirmSubmit = async () => {
    setShowConfirmModal(false);
    setSubmitting(true);
    setErrorMessage(null);

    const photosList: { file: File | Blob; type: PhotoType }[] = [];
    if (frontPhoto) photosList.push({ file: frontPhoto.file, type: "front" });
    if (backPhoto) photosList.push({ file: backPhoto.file, type: "back" });

    try {
      await onSubmit({
        tablet_condition: tabletCondition,
        charger_condition: chargerCondition,
        case_condition: caseCondition,
        battery_pct: batteryPct,
        notes: notes.trim() || undefined,
        gps_lat: gpsLocation?.lat || null,
        gps_lng: gpsLocation?.lng || null,
        photos: photosList,
      });
    } catch (err: any) {
      setErrorMessage(err.message || "Gagal mengirimkan data inspeksi.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-xl mx-auto bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-xl overflow-hidden animate-in fade-in">
      {/* ── 1. HEADER (Exact match to reference) ── */}
      <div className="p-5 sm:p-6 pb-4 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-[#473bf0] dark:text-indigo-400 border border-indigo-100/80 dark:border-indigo-900/50">
              <ClipboardCheck className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 tracking-tight leading-snug">
                Formulir Inspeksi Tablet
              </h2>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Periode {activePeriod.name} — Unit:{" "}
                <span className="font-bold text-[#473bf0] dark:text-indigo-400 font-mono">
                  {tablet.qr_code}
                </span>
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onCancel}
            className="p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 transition"
            title="Tutup"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>

      <div className="p-5 sm:p-6 space-y-6">
        <form onSubmit={handleValidateAndPromptConfirm} className="space-y-6">
          {/* Error Alert */}
          {errorMessage && (
            <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-600 dark:bg-rose-950/30 dark:border-rose-900/50 text-xs font-semibold flex items-center justify-between animate-in fade-in">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 shrink-0 text-rose-500" />
                <span>{errorMessage}</span>
              </div>
              <button
                type="button"
                onClick={() => setErrorMessage(null)}
                className="text-xs font-bold text-rose-600 underline ml-2 shrink-0"
              >
                Tutup
              </button>
            </div>
          )}

          {/* ── 2. INFORMASI TABLET CARD (2-Column clean layout) ── */}
          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 grid grid-cols-2 gap-y-3 gap-x-4 text-xs">
            <div>
              <span className="text-slate-400 block mb-0.5 font-medium">Kode Tablet</span>
              <span className="font-mono font-bold text-[#473bf0] dark:text-indigo-400 text-sm">
                {tablet.qr_code}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block mb-0.5 font-medium">Serial Number</span>
              <span className="font-mono font-medium text-slate-800 dark:text-slate-200 text-sm truncate block">
                {tablet.serial_number || "-"}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block mb-0.5 font-medium">Merk / Model</span>
              <span className="font-bold text-slate-800 dark:text-slate-200 text-sm truncate block">
                {tablet.brand} - {tablet.model}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block mb-0.5 font-medium">Lokasi</span>
              <span className="font-bold text-slate-800 dark:text-slate-200 text-sm truncate block">
                {tablet.location?.name || "Melamine"}
              </span>
            </div>
          </div>

          {/* ── 3. FIELD 1: KONDISI FISIK TABLET ── */}
          <div className="space-y-2.5">
            <label className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1">
              <span>Kondisi Fisik Tablet</span>
              <span className="text-rose-500">*</span>
            </label>

            {/* Row 1: 3 buttons */}
            <div className="grid grid-cols-3 gap-2.5">
              {/* Baik (Selected: Emerald outline) */}
              <button
                type="button"
                onClick={() => setTabletCondition("good")}
                className={`py-2.5 px-2 rounded-xl text-xs font-bold transition-all text-center border min-h-[44px] flex items-center justify-center ${
                  tabletCondition === "good"
                    ? "border-emerald-500 text-emerald-600 bg-emerald-50/50 dark:bg-emerald-950/30"
                    : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-300"
                }`}
              >
                Baik
              </button>

              {/* Kerusakan Ringan */}
              <button
                type="button"
                onClick={() => setTabletCondition("minor_damage")}
                className={`py-2.5 px-2 rounded-xl text-xs font-bold transition-all text-center border min-h-[44px] flex items-center justify-center ${
                  tabletCondition === "minor_damage"
                    ? "border-amber-500 text-amber-600 bg-amber-50/60 dark:bg-amber-950/30"
                    : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-300"
                }`}
              >
                Kerusakan Ringan
              </button>

              {/* Kerusakan Berat */}
              <button
                type="button"
                onClick={() => setTabletCondition("major_damage")}
                className={`py-2.5 px-2 rounded-xl text-xs font-bold transition-all text-center border min-h-[44px] flex items-center justify-center ${
                  tabletCondition === "major_damage"
                    ? "border-rose-500 text-rose-600 bg-rose-50/60 dark:bg-rose-950/30"
                    : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-300"
                }`}
              >
                Kerusakan Berat
              </button>
            </div>

            {/* Row 2: 2 buttons */}
            <div className="grid grid-cols-3 gap-2.5">
              {/* Hilang */}
              <button
                type="button"
                onClick={() => setTabletCondition("missing")}
                className={`py-2.5 px-2 rounded-xl text-xs font-bold transition-all text-center border min-h-[44px] flex items-center justify-center ${
                  tabletCondition === "missing"
                    ? "border-rose-500 text-rose-600 bg-rose-50/60 dark:bg-rose-950/30"
                    : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-300"
                }`}
              >
                Hilang
              </button>

              {/* Tidak Ditemukan */}
              <button
                type="button"
                onClick={() => setTabletCondition("not_found")}
                className={`py-2.5 px-2 rounded-xl text-xs font-bold transition-all text-center border min-h-[44px] flex items-center justify-center ${
                  tabletCondition === "not_found"
                    ? "border-rose-500 text-rose-600 bg-rose-50/60 dark:bg-rose-950/30"
                    : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-300"
                }`}
              >
                Tidak Ditemukan
              </button>

              {/* Empty placeholder for clean 3-col alignment */}
              <div className="invisible" />
            </div>
          </div>

          {/* ── 4. FIELD 2: KONDISI CHARGER ── */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1">
              <span>Kondisi Charger</span>
              <span className="text-rose-500">*</span>
            </label>
            <div className="grid grid-cols-3 gap-2.5">
              {[
                { value: "available" as ChargerCondition, label: "Tersedia" },
                { value: "missing" as ChargerCondition, label: "Hilang" },
                { value: "damaged" as ChargerCondition, label: "Rusak" },
              ].map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setChargerCondition(opt.value)}
                  className={`py-2.5 px-2 rounded-xl text-xs font-bold transition-all text-center border min-h-[44px] flex items-center justify-center ${
                    chargerCondition === opt.value
                      ? "border-[#473bf0] bg-indigo-50/70 text-[#473bf0] dark:bg-indigo-950/40 dark:text-indigo-300"
                      : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-300"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* ── 5. FIELD 3: KONDISI CASING / PELINDUNG ── */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1">
              <span>Kondisi Casing / Pelindung</span>
              <span className="text-rose-500">*</span>
            </label>
            <div className="grid grid-cols-3 gap-2.5">
              {[
                { value: "good" as CaseCondition, label: "Baik" },
                { value: "damaged" as CaseCondition, label: "Rusak" },
                { value: "missing" as CaseCondition, label: "Hilang" },
              ].map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setCaseCondition(opt.value)}
                  className={`py-2.5 px-2 rounded-xl text-xs font-bold transition-all text-center border min-h-[44px] flex items-center justify-center ${
                    caseCondition === opt.value
                      ? "border-[#473bf0] bg-indigo-50/70 text-[#473bf0] dark:bg-indigo-950/40 dark:text-indigo-300"
                      : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-300"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* ── 6. FIELD 4: PERSENTASE BATERAI ── */}
          <div className="space-y-2 pt-1">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <BatteryMedium className="h-4 w-4 text-emerald-600 shrink-0" />
                <span>Persentase Baterai ({batteryPct}%)</span>
              </label>
              <span className="text-xs font-mono font-bold text-[#473bf0] dark:text-indigo-400">
                {batteryPct}%
              </span>
            </div>

            <div className="pt-1">
              <input
                type="range"
                min="1"
                max="100"
                value={batteryPct}
                onChange={(e) => setBatteryPct(Number(e.target.value))}
                className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-[#473bf0]"
              />
            </div>
          </div>

          {/* ── 7. FIELD 5: CATATAN INSPEKSI ── */}
          <div className="space-y-1.5 pt-1">
            <label className="text-xs font-bold text-slate-800 dark:text-slate-200">
              Catatan Inspeksi {tabletCondition !== "good" && <span className="text-rose-500">*</span>}
            </label>
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Tuliskan catatan atau temuan inspeksi di sini..."
              className="w-full p-3.5 text-xs rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:ring-2 focus:ring-[#473bf0] focus:outline-none leading-relaxed transition"
            />
          </div>

          {/* ── 8. DOKUMENTASI FOTO TABLET (2 Clean Self-Contained Slots) ── */}
          <div className="space-y-3 pt-3 border-t border-slate-100 dark:border-slate-800">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <Camera className="h-4 w-4 text-[#473bf0]" />
                  <span>Dokumentasi Foto Tablet</span>
                  <span className="text-rose-500">*</span>
                </h4>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Foto digunakan sebagai bukti dokumentasi inspeksi.
                </p>
              </div>
              <span className="text-[10px] font-mono font-bold text-[#473bf0] bg-indigo-50 dark:bg-indigo-950 px-2 py-0.5 rounded-md border border-indigo-100 dark:border-indigo-900 shrink-0">
                {[frontPhoto, backPhoto].filter(Boolean).length}/2 Foto
              </span>
            </div>

            {/* 2 Dedicated Photo Slots Grid with clean responsive spacing */}
            <div className="grid grid-cols-2 gap-2.5 sm:gap-3.5">
              {/* Slot 1: Foto Depan */}
              <div className="flex flex-col space-y-1.5 min-w-0">
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate block">
                  Foto Depan <span className="text-rose-500">*</span>
                </span>

                {frontPhoto ? (
                  <div className="space-y-1.5 flex-1 flex flex-col">
                    <div className="relative rounded-2xl overflow-hidden border-2 border-indigo-600 shadow-sm aspect-[4/3] bg-slate-950 w-full">
                      <img
                        src={frontPhoto.previewUrl}
                        alt="Foto Depan"
                        className="w-full h-full object-contain"
                      />
                      {/* Evidence Overlay Badge */}
                      <div className="absolute inset-x-0 bottom-0 bg-slate-950/85 backdrop-blur-xs p-1.5 text-white text-[9px] space-y-0.5 border-t border-white/10">
                        <div className="flex items-center justify-between font-mono font-bold">
                          <span className="text-emerald-400">✓ DEPAN</span>
                          <span className="text-[8px] truncate">{tablet.qr_code}</span>
                        </div>
                        <div className="text-slate-300 text-[8px] truncate font-mono">
                          {frontPhoto.capturedAt}
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-1.5 pt-0.5">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => handleOpenPhotoCapture("front")}
                        className="flex-1 text-[11px] font-bold rounded-xl h-8 px-2 border-slate-300 gap-1"
                      >
                        <RefreshCw className="h-3 w-3" />
                        <span>Ganti</span>
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => handleRemovePhoto("front")}
                        className="text-[11px] font-bold rounded-xl h-8 text-rose-600 border-rose-200 hover:bg-rose-50 px-2"
                        title="Hapus Foto"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div
                    onClick={() => handleOpenPhotoCapture("front")}
                    className="w-full aspect-[4/3] rounded-2xl border-2 border-dashed border-indigo-300 dark:border-indigo-800 hover:border-indigo-600 bg-indigo-50/40 dark:bg-indigo-950/20 flex flex-col items-center justify-center p-3 text-center cursor-pointer transition-all hover:scale-[1.01] group"
                  >
                    <div className="w-9 h-9 rounded-xl bg-white dark:bg-slate-900 shadow-sm flex items-center justify-center text-[#473bf0] group-hover:scale-110 transition-transform mb-1 border border-indigo-100">
                      <Camera className="h-4.5 w-4.5" />
                    </div>
                    <span className="text-xs font-bold text-[#473bf0] leading-tight block">
                      Ambil Foto Depan
                    </span>
                    <span className="text-[9px] text-slate-400 mt-0.5 block leading-none">
                      Kamera / Galeri
                    </span>
                  </div>
                )}
              </div>

              {/* Slot 2: Foto Belakang */}
              <div className="flex flex-col space-y-1.5 min-w-0">
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate block">
                  Foto Belakang
                </span>

                {backPhoto ? (
                  <div className="space-y-1.5 flex-1 flex flex-col">
                    <div className="relative rounded-2xl overflow-hidden border-2 border-indigo-600 shadow-sm aspect-[4/3] bg-slate-950 w-full">
                      <img
                        src={backPhoto.previewUrl}
                        alt="Foto Belakang"
                        className="w-full h-full object-contain"
                      />
                      {/* Evidence Overlay Badge */}
                      <div className="absolute inset-x-0 bottom-0 bg-slate-950/85 backdrop-blur-xs p-1.5 text-white text-[9px] space-y-0.5 border-t border-white/10">
                        <div className="flex items-center justify-between font-mono font-bold">
                          <span className="text-emerald-400">✓ BELAKANG</span>
                          <span className="text-[8px] truncate">{tablet.qr_code}</span>
                        </div>
                        <div className="text-slate-300 text-[8px] truncate font-mono">
                          {backPhoto.capturedAt}
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-1.5 pt-0.5">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => handleOpenPhotoCapture("back")}
                        className="flex-1 text-[11px] font-bold rounded-xl h-8 px-2 border-slate-300 gap-1"
                      >
                        <RefreshCw className="h-3 w-3" />
                        <span>Ganti</span>
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => handleRemovePhoto("back")}
                        className="text-[11px] font-bold rounded-xl h-8 text-rose-600 border-rose-200 hover:bg-rose-50 px-2"
                        title="Hapus Foto"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div
                    onClick={() => handleOpenPhotoCapture("back")}
                    className="w-full aspect-[4/3] rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-700 hover:border-indigo-500 bg-slate-50 dark:bg-slate-900/40 flex flex-col items-center justify-center p-3 text-center cursor-pointer transition-all hover:scale-[1.01] group"
                  >
                    <div className="w-9 h-9 rounded-xl bg-white dark:bg-slate-800 shadow-sm flex items-center justify-center text-slate-500 group-hover:text-[#473bf0] group-hover:scale-110 transition-all mb-1 border border-slate-200">
                      <Camera className="h-4.5 w-4.5" />
                    </div>
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300 group-hover:text-[#473bf0] leading-tight block">
                      Ambil Foto Belakang
                    </span>
                    <span className="text-[9px] text-slate-400 mt-0.5 block leading-none">
                      Kamera / Galeri
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ── 9. ACTION BUTTONS ── */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={submitting}
              className="min-h-[48px] px-5 rounded-2xl font-bold text-xs border-slate-300"
            >
              Batal
            </Button>
            <Button
              type="submit"
              disabled={submitting}
              className="min-h-[48px] px-6 rounded-2xl bg-[#473bf0] hover:bg-indigo-700 text-white font-black text-xs shadow-lg shadow-indigo-500/25 gap-2 flex-1 sm:flex-initial"
            >
              <Send className="h-4 w-4" />
              <span>{submitting ? "Menyimpan Data..." : "Kirim Formulir Inspeksi"}</span>
            </Button>
          </div>
        </form>

        {/* Watermark Capture & Preview Modal */}
        <WatermarkPreviewModal
          isOpen={isWatermarkModalOpen}
          onClose={() => setIsWatermarkModalOpen(false)}
          onConfirmPhoto={handleWatermarkConfirmed}
          photoType={targetPhotoSlot}
          tabletCode={tablet.qr_code}
          deviceModel={tablet.model ? `${tablet.model} (${tablet.brand})` : undefined}
          assignedLocation={tablet.location?.name || "Melamine"}
          picName={picName}
          gpsCoords={gpsLocation}
        />

        {/* ── MODAL KONFIRMASI PENGIRIMAN ── */}
        {showConfirmModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in zoom-in-95">
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-md w-full p-6 space-y-5">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                <h4 className="text-base font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <ShieldCheck className="h-5 w-5 text-[#473bf0]" />
                  <span>Konfirmasi Pengiriman Inspeksi</span>
                </h4>
                <button
                  type="button"
                  onClick={() => setShowConfirmModal(false)}
                  className="text-slate-400 hover:text-slate-600 min-h-[44px] min-w-[44px] flex items-center justify-center rounded-full"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="space-y-3 text-xs">
                <p className="text-slate-600 dark:text-slate-400">
                  Pastikan data hasil inspeksi unit <strong className="text-indigo-600 font-bold">{tablet.qr_code}</strong> sudah sesuai dengan kondisi fisik saat ini:
                </p>

                {/* Summary Box */}
                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 space-y-2">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Kondisi Fisik:</span>
                    <span className="font-bold text-emerald-600">
                      {tabletCondition === "good"
                        ? "Baik"
                        : tabletCondition === "minor_damage"
                        ? "Kerusakan Ringan"
                        : tabletCondition === "major_damage"
                        ? "Kerusakan Berat"
                        : tabletCondition === "missing"
                        ? "Hilang"
                        : "Tidak Ditemukan"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Charger &amp; Case:</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                      Charger ({chargerCondition}) | Case ({caseCondition})
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Baterai:</span>
                    <span className="font-mono font-bold text-emerald-600">{batteryPct}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Foto Dokumentasi:</span>
                    <span className="font-bold text-indigo-600">
                      {[frontPhoto, backPhoto].filter(Boolean).length} Foto Terlampir
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowConfirmModal(false)}
                  disabled={submitting}
                  className="min-h-[48px] px-5 rounded-xl font-bold text-xs"
                >
                  Periksa Lagi
                </Button>
                <Button
                  type="button"
                  disabled={submitting}
                  onClick={handleConfirmSubmit}
                  className="bg-[#473bf0] hover:bg-indigo-700 active:scale-95 text-white font-black text-xs min-h-[48px] px-6 rounded-xl gap-2 shadow-lg shadow-indigo-500/25"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  <span>{submitting ? "Menyimpan..." : "Ya, Kirim Sekarang"}</span>
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
