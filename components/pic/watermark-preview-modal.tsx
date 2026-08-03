"use client";

import React, { useState, useRef } from "react";
import {
  applyInspectionWatermark,
  formatIndonesianDate,
  formatIndonesianTime,
  WatermarkResult,
} from "@/lib/watermark-utils";
import { Button } from "@/components/ui/button";
import { PhotoType } from "@/services/inspections.service";
import {
  Camera,
  Image as ImageIcon,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  X,
  ShieldCheck,
  MapPin,
  Smartphone,
  User,
} from "lucide-react";

interface WatermarkPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirmPhoto: (result: WatermarkResult, photoType: PhotoType) => void;
  photoType: PhotoType;
  tabletCode: string;
  deviceModel?: string;
  assignedLocation: string;
  picName: string;
  gpsCoords?: { lat: number; lng: number } | null;
}

export function WatermarkPreviewModal({
  isOpen,
  onClose,
  onConfirmPhoto,
  photoType,
  tabletCode,
  deviceModel,
  assignedLocation,
  picName,
  gpsCoords,
}: WatermarkPreviewModalProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [processedResult, setProcessedResult] = useState<WatermarkResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [capturedFrom, setCapturedFrom] = useState<"Camera" | "Gallery">("Camera");

  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileChange = async (
    e: React.ChangeEvent<HTMLInputElement>,
    sourceType: "Camera" | "Gallery"
  ) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    setCapturedFrom(sourceType);
    setIsProcessing(true);
    setErrorMessage(null);

    try {
      // 1. Try to get current GPS location if not already provided
      let currentGpsString: string | null = gpsCoords
        ? `${gpsCoords.lat.toFixed(6)}, ${gpsCoords.lng.toFixed(6)}`
        : null;

      if (!currentGpsString && typeof window !== "undefined" && "geolocation" in navigator) {
        try {
          const position = await new Promise<GeolocationPosition>((res, rej) => {
            navigator.geolocation.getCurrentPosition(res, rej, { timeout: 4000 });
          });
          currentGpsString = `${position.coords.latitude.toFixed(6)}, ${position.coords.longitude.toFixed(6)}`;
        } catch (geoErr) {
          console.log("GPS fetch timeout/unavailable, using location name fallback.");
        }
      }

      // 2. Format Date and Time
      const now = new Date();
      const dateStr = formatIndonesianDate(now);
      const timeStr = formatIndonesianTime(now);

      // 3. Apply Automatic Watermark
      const watermarkResult = await applyInspectionWatermark(file, {
        inspectionDate: dateStr,
        inspectionTime: timeStr,
        assignedLocation,
        tabletCode,
        deviceModel,
        gpsCoords: currentGpsString,
        picName: `${picName} (PIC)`,
        capturedFrom: sourceType,
      });

      setProcessedResult(watermarkResult);
    } catch (err: any) {
      console.error("Watermark generation error:", err);
      setErrorMessage(err.message || "Gagal memproses watermark pada foto.");
    } finally {
      setIsProcessing(false);
      // Reset input value so re-selecting same file works
      e.target.value = "";
    }
  };

  const handleRetake = () => {
    if (processedResult?.previewUrl) {
      URL.revokeObjectURL(processedResult.previewUrl);
    }
    setProcessedResult(null);
    setErrorMessage(null);
  };

  const handleConfirm = () => {
    if (processedResult) {
      onConfirmPhoto(processedResult, photoType);
      onClose();
    }
  };

  const photoTypeLabels: Record<PhotoType, string> = {
    front: "Foto Tampak Depan",
    back: "Foto Tampak Belakang",
    screen: "Foto Layar Menyala",
    accessory: "Foto Aksesoris / Charger",
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in">
      <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="p-4 sm:p-5 bg-slate-50 dark:bg-slate-900/60 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-600/10 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-400 flex items-center justify-center font-bold">
              <Camera className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-900 dark:text-slate-100">
                {photoTypeLabels[photoType] || "Ambil Foto Inspeksi"}
              </h3>
              <p className="text-[11px] text-slate-500">
                Watermark otomatis akan ditambahkan sebelum diunggah
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-400 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 flex-1 overflow-y-auto space-y-4">
          {/* Error Alert */}
          {errorMessage && (
            <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-300 text-xs font-semibold flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* 1. Initial State: Select Photo Source */}
          {!isProcessing && !processedResult && (
            <div className="space-y-4 text-center py-6">
              <div className="w-16 h-16 rounded-3xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 flex items-center justify-center mx-auto border border-indigo-100 dark:border-indigo-900/50 shadow-inner">
                <ShieldCheck className="w-8 h-8 text-indigo-600" />
              </div>

              <div className="space-y-1">
                <h4 className="text-base font-black text-slate-900 dark:text-slate-100">
                  Pilih Sumber Foto
                </h4>
                <p className="text-xs text-slate-500 max-w-xs mx-auto">
                  Foto akan secara otomatis diberi watermark resmi <span className="font-semibold text-indigo-600">TabMonitor & PT. Propan Raya ICC</span>.
                </p>
              </div>

              {/* Hidden Inputs */}
              <input
                ref={cameraInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                onChange={(e) => handleFileChange(e, "Camera")}
                className="hidden"
              />
              <input
                ref={galleryInputRef}
                type="file"
                accept="image/*"
                onChange={(e) => handleFileChange(e, "Gallery")}
                className="hidden"
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3">
                <Button
                  type="button"
                  onClick={() => cameraInputRef.current?.click()}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold h-12 rounded-2xl gap-2 shadow-lg shadow-indigo-500/20"
                >
                  <Camera className="w-5 h-5" />
                  <span>Kamera HP (Native)</span>
                </Button>

                <Button
                  type="button"
                  onClick={() => galleryInputRef.current?.click()}
                  variant="outline"
                  className="border-slate-300 dark:border-slate-700 font-bold h-12 rounded-2xl gap-2 hover:bg-slate-50 dark:hover:bg-slate-800"
                >
                  <ImageIcon className="w-5 h-5 text-indigo-600" />
                  <span>Pilih dari Galeri</span>
                </Button>
              </div>
            </div>
          )}

          {/* 2. Loading State: Generating Watermark */}
          {isProcessing && (
            <div className="py-12 text-center space-y-4">
              <div className="w-16 h-16 rounded-3xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 flex items-center justify-center mx-auto">
                <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
              </div>
              <div className="space-y-1">
                <h4 className="text-sm font-black text-slate-900 dark:text-slate-100">
                  Memproses Watermark Otomatis...
                </h4>
                <p className="text-xs text-slate-400">
                  Mengompresi gambar (JPEG 90%) & menempelkan kartu informasi inspeksi.
                </p>
              </div>
            </div>
          )}

          {/* 3. Preview Screen: Watermarked Result */}
          {processedResult && !isProcessing && (
            <div className="space-y-4">
              {/* Photo Preview Frame */}
              <div className="relative rounded-2xl overflow-hidden border-2 border-indigo-600 shadow-xl bg-slate-950">
                <img
                  src={processedResult.previewUrl}
                  alt="Watermarked Preview"
                  className="w-full h-auto max-h-[380px] object-contain mx-auto"
                />
                <span className="absolute top-3 right-3 bg-emerald-500/90 text-white font-black text-[10px] uppercase tracking-wider px-2.5 py-1 rounded-full backdrop-blur-md shadow-md flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Watermark Aktif</span>
                </span>
              </div>

              {/* Watermark Details Summary */}
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 space-y-2 text-xs">
                <div className="flex items-center justify-between border-b border-slate-200/60 dark:border-slate-700/60 pb-1.5">
                  <span className="text-slate-500 flex items-center gap-1">
                    <Smartphone className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Unit / Kode:</span>
                  </span>
                  <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400">
                    {processedResult.metadata.tabletCode}
                  </span>
                </div>

                <div className="flex items-center justify-between border-b border-slate-200/60 dark:border-slate-700/60 pb-1.5">
                  <span className="text-slate-500 flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Lokasi & GPS:</span>
                  </span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200 text-right truncate max-w-[200px]">
                    {processedResult.metadata.gpsCoords || processedResult.metadata.assignedLocation}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-500 flex items-center gap-1">
                    <User className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Petugas PIC:</span>
                  </span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    {processedResult.metadata.picName}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer Actions */}
        {processedResult && !isProcessing && (
          <div className="p-4 bg-slate-50 dark:bg-slate-900/80 border-t border-slate-100 dark:border-slate-800 flex gap-2.5">
            <Button
              type="button"
              onClick={handleRetake}
              variant="outline"
              className="flex-1 h-11 rounded-xl font-bold text-xs border-slate-300 dark:border-slate-700 gap-1.5"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Ambil Ulang</span>
            </Button>

            <Button
              type="button"
              onClick={handleConfirm}
              className="flex-[1.5] h-11 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs gap-1.5 shadow-lg shadow-emerald-600/20"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Gunakan Foto</span>
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
