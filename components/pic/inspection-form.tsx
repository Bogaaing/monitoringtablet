"use client";

import React, { useState, useEffect } from "react";
import { Tablet } from "@/types";
import { InspectionPeriod } from "@/types";
import {
  TabletCondition,
  ChargerCondition,
  CaseCondition,
  PhotoType,
} from "@/services/inspections.service";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Camera,
  Upload,
  X,
  BatteryCharging,
  MapPin,
  CheckCircle2,
  AlertTriangle,
  Tablet as TabletIcon,
  ShieldAlert,
} from "lucide-react";

import { WatermarkPreviewModal } from "@/components/pic/watermark-preview-modal";
import { WatermarkResult } from "@/lib/watermark-utils";
import { authService } from "@/services/auth.service";
import { ShieldCheck } from "lucide-react";

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
  picId,
  onSubmit,
  onCancel,
}: InspectionFormProps) {
  const [tabletCondition, setTabletCondition] = useState<TabletCondition>("good");
  const [chargerCondition, setChargerCondition] = useState<ChargerCondition>("available");
  const [caseCondition, setCaseCondition] = useState<CaseCondition>("good");
  const [batteryPct, setBatteryPct] = useState<number>(85);
  const [notes, setNotes] = useState<string>("");

  // Photo uploads (Min 1, Max 5)
  const [selectedPhotos, setSelectedPhotos] = useState<
    { file: File; previewUrl: string; type: PhotoType }[]
  >([]);

  // Watermark Modal state
  const [isWatermarkModalOpen, setIsWatermarkModalOpen] = useState(false);
  const [targetPhotoType, setTargetPhotoType] = useState<PhotoType>("front");
  const [picName, setPicName] = useState<string>("Ahmad Rizky");

  // GPS Location
  const [gpsLocation, setGpsLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

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

  const handleOpenWatermarkModal = (type: PhotoType) => {
    if (selectedPhotos.length >= 5) {
      alert("Maksimal 5 foto dapat diunggah per inspeksi.");
      return;
    }
    setTargetPhotoType(type);
    setIsWatermarkModalOpen(true);
  };

  const handleWatermarkConfirmed = (result: WatermarkResult, photoType: PhotoType) => {
    setSelectedPhotos((prev) => [
      ...prev,
      { file: result.file, previewUrl: result.previewUrl, type: photoType },
    ]);
  };

  const handleRemovePhoto = (index: number) => {
    setSelectedPhotos((prev) => {
      const copy = [...prev];
      URL.revokeObjectURL(copy[index].previewUrl);
      copy.splice(index, 1);
      return copy;
    });
  };

  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    // Validation 1: Notes required if condition is not good
    if (tabletCondition !== "good" && (!notes || notes.trim().length < 5)) {
      setErrorMessage("Catatan wajib diisi (minimal 5 karakter) apabila kondisi tablet tidak Baik.");
      return;
    }

    // Validation 2: Min 1 photo
    if (selectedPhotos.length < 1) {
      setErrorMessage("Wajib mengunggah minimal 1 foto fisik tablet.");
      return;
    }

    setSubmitting(true);
    try {
      await onSubmit({
        tablet_condition: tabletCondition,
        charger_condition: chargerCondition,
        case_condition: caseCondition,
        battery_pct: batteryPct,
        notes,
        gps_lat: gpsLocation?.lat || null,
        gps_lng: gpsLocation?.lng || null,
        photos: selectedPhotos.map((p) => ({ file: p.file, type: p.type })),
      });
    } catch (err: any) {
      setErrorMessage(err.message || "Gagal mengirimkan data inspeksi.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto shadow-xl border-indigo-100 dark:border-indigo-950">
      <CardHeader className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              <TabletIcon className="h-5 w-5 text-indigo-600" />
              <span>Formulir Inspeksi Tablet</span>
            </CardTitle>
            <CardDescription className="text-xs mt-0.5">
              {activePeriod.name} — Unit:{" "}
              <span className="font-mono font-bold text-indigo-600">{tablet.qr_code}</span>
            </CardDescription>
          </div>
          <Button variant="ghost" size="sm" onClick={onCancel}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="p-6">
        <form onSubmit={handleSubmitForm} className="space-y-6">
          {errorMessage && (
            <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-300 text-xs font-semibold flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Device Summary Box */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div>
              <span className="text-slate-400">Kode Tablet</span>
              <p className="font-mono font-bold text-indigo-600">{tablet.qr_code}</p>
            </div>
            <div>
              <span className="text-slate-400">Serial Number</span>
              <p className="font-mono font-semibold">{tablet.serial_number}</p>
            </div>
            <div>
              <span className="text-slate-400">Merk / Model</span>
              <p className="font-semibold">{tablet.brand} - {tablet.model}</p>
            </div>
            <div>
              <span className="text-slate-400">Lokasi</span>
              <p className="font-semibold">{tablet.location?.name || "Belum Ditempatkan"}</p>
            </div>
          </div>

          {/* Field 1: Tablet Condition */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
              Kondisi Fisik Tablet <span className="text-rose-500">*</span>
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              {[
                { value: "good", label: "Good (Baik)", color: "border-emerald-500 text-emerald-600 bg-emerald-50" },
                { value: "minor_damage", label: "Minor Damage", color: "border-amber-500 text-amber-600 bg-amber-50" },
                { value: "major_damage", label: "Major Damage", color: "border-rose-500 text-rose-600 bg-rose-50" },
                { value: "missing", label: "Missing (Hilang)", color: "border-purple-500 text-purple-600 bg-purple-50" },
                { value: "not_found", label: "Not Found", color: "border-slate-500 text-slate-600 bg-slate-50" },
              ].map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setTabletCondition(opt.value as TabletCondition)}
                  className={`p-2.5 rounded-xl border-2 text-xs font-bold transition-all text-center ${
                    tabletCondition === opt.value
                      ? `${opt.color} shadow-sm ring-2 ring-indigo-500/20`
                      : "border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Field 2 & 3: Charger & Case Condition */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Kondisi Charger <span className="text-rose-500">*</span>
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { value: "available", label: "Available" },
                  { value: "missing", label: "Missing" },
                  { value: "damaged", label: "Damaged" },
                ].map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setChargerCondition(opt.value as ChargerCondition)}
                    className={`py-2 px-2 rounded-xl border text-xs font-semibold text-center transition-all ${
                      chargerCondition === opt.value
                        ? "border-indigo-600 bg-indigo-50 text-indigo-700 dark:bg-indigo-950 font-bold"
                        : "border-slate-200 text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Kondisi Casing / Case <span className="text-rose-500">*</span>
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { value: "good", label: "Good" },
                  { value: "damaged", label: "Damaged" },
                  { value: "missing", label: "Missing" },
                ].map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setCaseCondition(opt.value as CaseCondition)}
                    className={`py-2 px-2 rounded-xl border text-xs font-semibold text-center transition-all ${
                      caseCondition === opt.value
                        ? "border-indigo-600 bg-indigo-50 text-indigo-700 dark:bg-indigo-950 font-bold"
                        : "border-slate-200 text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Field 4: Battery Percentage */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <BatteryCharging className="h-4 w-4 text-emerald-600" />
                <span>Persentase Baterai ({batteryPct}%)</span>
              </label>
              <span className="text-xs font-mono font-bold text-indigo-600">{batteryPct}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={batteryPct}
              onChange={(e) => setBatteryPct(Number(e.target.value))}
              className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-600"
            />
          </div>

          {/* Field 5: Notes */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
              Catatan Inspeksi {tabletCondition !== "good" && <span className="text-rose-500">* (Wajib)</span>}
            </label>
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={
                tabletCondition !== "good"
                  ? "Jelaskan detail kerusakan atau kendala yang ditemukan pada tablet..."
                  : "Catatan tambahan (opsional)..."
              }
              className="w-full p-3 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Field 6: Photo Upload (Min 1, Max 5) */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Camera className="h-4 w-4 text-indigo-600" />
                <span>Unggah Foto Fisik (Min 1, Max 5) <span className="text-rose-500">*</span></span>
              </label>
              <span className="text-xs text-slate-500 font-medium">
                {selectedPhotos.length} / 5 Foto
              </span>
            </div>

            {/* Thumbnail Preview Grid */}
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
              {selectedPhotos.map((photo, index) => (
                <div key={index} className="relative aspect-square rounded-xl overflow-hidden border-2 border-indigo-500 group shadow-sm">
                  <img src={photo.previewUrl} alt="Preview" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => handleRemovePhoto(index)}
                    className="absolute top-1 right-1 p-1 bg-rose-600 text-white rounded-full opacity-90 hover:opacity-100 transition-opacity"
                  >
                    <X className="h-3 w-3" />
                  </button>
                  <span className="absolute top-1 left-1 bg-emerald-500/90 text-white text-[8px] font-black px-1.5 py-0.5 rounded flex items-center gap-0.5 shadow-sm">
                    <ShieldCheck className="w-2.5 h-2.5" />
                    <span>WM</span>
                  </span>
                  <span className="absolute bottom-1 left-1 right-1 bg-slate-900/80 text-white text-[9px] font-bold text-center rounded px-1 uppercase truncate">
                    {photo.type}
                  </span>
                </div>
              ))}

              {selectedPhotos.length < 5 && (
                <button
                  type="button"
                  onClick={() =>
                    handleOpenWatermarkModal(
                      selectedPhotos.length === 0
                        ? "front"
                        : selectedPhotos.length === 1
                        ? "back"
                        : selectedPhotos.length === 2
                        ? "screen"
                        : "accessory"
                    )
                  }
                  className="aspect-square rounded-xl border-2 border-dashed border-indigo-300 dark:border-indigo-800 hover:border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/20 flex flex-col items-center justify-center p-2 text-center transition-all group"
                >
                  <Camera className="h-6 w-6 text-indigo-600 mb-1 group-hover:scale-110 transition-transform" />
                  <span className="text-[10px] font-bold text-indigo-600">+ Ambil Foto</span>
                  <span className="text-[8px] text-slate-400 font-semibold mt-0.5">Auto-Watermark</span>
                </button>
              )}
            </div>
          </div>

          {/* Watermark Capture & Preview Modal */}
          <WatermarkPreviewModal
            isOpen={isWatermarkModalOpen}
            onClose={() => setIsWatermarkModalOpen(false)}
            onConfirmPhoto={handleWatermarkConfirmed}
            photoType={targetPhotoType}
            tabletCode={tablet.qr_code}
            deviceModel={tablet.model ? `${tablet.model} (${tablet.brand})` : undefined}
            assignedLocation={tablet.location?.name || "Gudang Utama A"}
            picName={picName}
            gpsCoords={gpsLocation}
          />

          {/* Form Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
            <Button type="button" variant="outline" onClick={onCancel} disabled={submitting}>
              Batal
            </Button>
            <Button
              type="submit"
              disabled={submitting}
              className="bg-gradient-to-r from-indigo-600 to-emerald-600 hover:from-indigo-700 hover:to-emerald-700 font-bold px-6 text-sm"
            >
              {submitting ? "Mengirim Inspeksi..." : "Kirim Inspeksi Tablet"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
