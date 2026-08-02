"use client";

import React, { useEffect, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { tabletsService } from "@/services/tablets.service";
import { Tablet } from "@/types";
import {
  QrCode,
  Camera,
  Keyboard,
  Zap,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  MapPin,
  ArrowRight,
  Loader2,
} from "lucide-react";

interface QRScannerProps {
  onScanSuccess: (qrCode: string, tabletData?: Tablet) => void;
  isScanning?: boolean;
}

export function QRScanner({ onScanSuccess }: QRScannerProps) {
  const [mode, setMode] = useState<"camera" | "manual">("camera");
  const [manualInput, setManualInput] = useState("");
  const [isTorchOn, setIsTorchOn] = useState(false);
  const [facingMode, setFacingMode] = useState<"environment" | "user">("environment");
  const [zoomLevel, setZoomLevel] = useState<"1x" | "2x">("1x");

  const [scanStatus, setScanStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [detectedTablet, setDetectedTablet] = useState<Tablet | null>(null);
  const [detectedCode, setDetectedCode] = useState<string>("");
  const [errorMessage, setErrorMessage] = useState<string>("");

  const html5QrCodeRef = useRef<Html5Qrcode | null>(null);
  const isStartedRef = useRef<boolean>(false);

  // ── Camera lifecycle ──────────────────────────────────────────────
  useEffect(() => {
    if (mode !== "camera") {
      stopCamera();
      return;
    }

    let isMounted = true;

    const startCamera = async () => {
      try {
        const element = document.getElementById("qr-reader-video");
        if (!element) return;

        if (html5QrCodeRef.current && isStartedRef.current) {
          await html5QrCodeRef.current.stop().catch(() => {});
          isStartedRef.current = false;
        }

        const qrScanner = new Html5Qrcode("qr-reader-video");
        html5QrCodeRef.current = qrScanner;

        await qrScanner.start(
          { facingMode },
          { fps: 15, qrbox: { width: 260, height: 260 }, aspectRatio: 1.0 },
          async (decodedText) => {
            if (!isMounted) return;
            let cleanQr = decodedText;
            try {
              const parsed = JSON.parse(decodedText);
              if (parsed.qr_code) cleanQr = parsed.qr_code;
            } catch (e) {}
            handleCodeDetected(cleanQr);
          },
          () => {}
        );

        isStartedRef.current = true;
      } catch (err: any) {
        console.warn("[QR Scanner] Camera start error:", err);
      }
    };

    const timer = setTimeout(startCamera, 200);

    return () => {
      isMounted = false;
      clearTimeout(timer);
      stopCamera();
    };
  }, [mode, facingMode]);

  const stopCamera = async () => {
    if (html5QrCodeRef.current && isStartedRef.current) {
      try {
        await html5QrCodeRef.current.stop();
      } catch (e) {}
      isStartedRef.current = false;
    }
  };

  // ── QR code detection handler ─────────────────────────────────────
  const handleCodeDetected = async (code: string) => {
    if (scanStatus === "loading") return;
    stopCamera();
    setDetectedCode(code);
    setScanStatus("loading");

    const startTime = Date.now();
    try {
      const tablet = await tabletsService.getTabletByQr(code);
      const elapsed = Date.now() - startTime;
      const remainingDelay = Math.max(0, 800 - elapsed);

      setTimeout(() => {
        if (tablet) {
          setDetectedTablet(tablet);
          setScanStatus("success");
        } else {
          setErrorMessage(`QR Code "${code}" tidak terdaftar dalam sistem inventaris.`);
          setScanStatus("error");
        }
      }, remainingDelay);
    } catch (e: any) {
      setErrorMessage(e?.message || `QR Code "${code}" tidak dapat diproses.`);
      setScanStatus("error");
    }
  };

  // ── Camera controls ───────────────────────────────────────────────
  const toggleTorch = async () => {
    if (!html5QrCodeRef.current || !isStartedRef.current) return;
    try {
      const nextTorch = !isTorchOn;
      await html5QrCodeRef.current.applyVideoConstraints({
        advanced: [{ torch: nextTorch } as any],
      });
      setIsTorchOn(nextTorch);
    } catch (e) {
      console.warn("Torch not supported on this device/browser");
    }
  };

  const toggleCamera = () =>
    setFacingMode((prev) => (prev === "environment" ? "user" : "environment"));

  const toggleZoom = () =>
    setZoomLevel((prev) => (prev === "1x" ? "2x" : "1x"));

  // ── Manual input ──────────────────────────────────────────────────
  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (manualInput.trim()) handleCodeDetected(manualInput.trim());
  };

  // ── Reset / confirm ───────────────────────────────────────────────
  const resetScan = () => {
    setScanStatus("idle");
    setDetectedTablet(null);
    setDetectedCode("");
    setErrorMessage("");
    setMode("camera");
  };

  const confirmStartInspection = () => {
    if (detectedCode) onScanSuccess(detectedCode, detectedTablet || undefined);
  };

  // ── Corner color (purple idle → green on success) ─────────────────
  const isSuccess = scanStatus === "success";
  const cornerColor = isSuccess ? "#10B981" : "#6C5CE7";
  const cornerGlow = isSuccess
    ? "0 0 20px #10B981, 0 0 8px #10B981"
    : "0 0 12px #6C5CE7, 0 0 6px #6C5CE7";

  // ── Corner style factory ──────────────────────────────────────────
  const cornerBase: React.CSSProperties = {
    position: "absolute",
    width: 32,
    height: 32,
    borderColor: cornerColor,
    boxShadow: cornerGlow,
    transition: "border-color 0.3s, box-shadow 0.3s",
  };

  // ── Render ────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col items-center w-full max-w-[430px] mx-auto space-y-4">

      {/* ══ 1. MODE SELECTOR TABS ══════════════════════════════════ */}
      <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl w-full border border-slate-200 dark:border-slate-700">
        <button
          type="button"
          onClick={() => { resetScan(); setMode("camera"); }}
          className={`flex-1 py-2 px-3 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 ${
            mode === "camera"
              ? "bg-indigo-600 text-white shadow-md shadow-indigo-500/20"
              : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
          }`}
        >
          <Camera className="h-4 w-4" />
          <span>Kamera Scanner</span>
        </button>

        <button
          type="button"
          onClick={() => setMode("manual")}
          className={`flex-1 py-2 px-3 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 ${
            mode === "manual"
              ? "bg-indigo-600 text-white shadow-md shadow-indigo-500/20"
              : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
          }`}
        >
          <Keyboard className="h-4 w-4" />
          <span>Input Manual</span>
        </button>
      </div>

      {/* ══ 2. CAMERA SCANNER MODE ═════════════════════════════════ */}
      {mode === "camera" && (
        <div className="w-full space-y-3">
          {/*
           * VIEWFINDER WRAPPER
           * ─────────────────
           * • Square 1:1 ratio, fills available width
           * • position:relative → all overlay layers use absolute positioning
           * • NO overflow:hidden → the scan frame must NOT be clipped
           * • bg-black fills behind the video stream
           */}
          <div
            className="relative w-full aspect-square rounded-3xl bg-black shadow-2xl"
            style={{ isolation: "isolate" }}
          >
            {/* ── Layer 1 · Camera video stream (Html5Qrcode target) ── */}
            <div
              id="qr-reader-video"
              className={`absolute inset-0 rounded-3xl overflow-hidden transition-transform duration-300 ${
                zoomLevel === "2x" ? "scale-125" : "scale-100"
              }`}
            />

            {/* ── Layer 2 · Dark vignette ── */}
            <div className="absolute inset-0 rounded-3xl bg-slate-950/40 pointer-events-none z-10" />

            {/* ── Layer 3 · Top instruction pill ── */}
            <div className="absolute top-4 left-0 right-0 flex justify-center z-30 pointer-events-none">
              <div className="px-4 py-1.5 rounded-full bg-slate-900/85 backdrop-blur-md text-white text-[11px] font-bold border border-white/10 shadow-lg">
                {isSuccess
                  ? "✓ QR Code berhasil ditemukan"
                  : "Arahkan QR Code ke dalam kotak."}
              </div>
            </div>

            {/*
             * ══ Layer 4 · SCAN FRAME (single unified container) ══
             *
             * ONE parent div centered with:
             *   position: absolute
             *   top: 50%
             *   left: 50%
             *   transform: translate(-50%, -50%)
             *
             * ┌───────────────────────────────┐
             * │  ScanFrame 260 × 260 px       │
             * │                               │
             * │  ┌──┐               ┌──┐     │
             * │  │TL│               │TR│     │
             * │                               │
             * │        [scan line]            │
             * │                               │
             * │  └──┘               └──┘     │
             * │  │BL│               │BR│     │
             * └───────────────────────────────┘
             *
             * All four corners: position relative to THIS container.
             * Scan line:        child of THIS container.
             * NOTHING floats independently outside this box.
             */}
            <motion.div
              animate={
                isSuccess
                  ? { scale: [1, 1.12, 1] }
                  : { scale: [1, 1.05, 1] }
              }
              transition={
                isSuccess
                  ? { duration: 0.35 }
                  : { duration: 1.5, repeat: Infinity, repeatType: "reverse", ease: "easeInOut" }
              }
              style={{
                position: "absolute",
                top: "50%",
                left: "50%",
                transform: "translate(-50%, -50%)",
                width: 260,
                height: 260,
                zIndex: 20,
                pointerEvents: "none",
              }}
            >
              {/* ┌── TOP LEFT ── */}
              <div
                style={{
                  ...cornerBase,
                  top: 0,
                  left: 0,
                  borderTopWidth: 4,
                  borderLeftWidth: 4,
                  borderBottomWidth: 0,
                  borderRightWidth: 0,
                  borderTopLeftRadius: 16,
                }}
              />

              {/* TOP RIGHT ──┐ */}
              <div
                style={{
                  ...cornerBase,
                  top: 0,
                  right: 0,
                  borderTopWidth: 4,
                  borderRightWidth: 4,
                  borderBottomWidth: 0,
                  borderLeftWidth: 0,
                  borderTopRightRadius: 16,
                }}
              />

              {/* └── BOTTOM LEFT ── */}
              <div
                style={{
                  ...cornerBase,
                  bottom: 0,
                  left: 0,
                  borderBottomWidth: 4,
                  borderLeftWidth: 4,
                  borderTopWidth: 0,
                  borderRightWidth: 0,
                  borderBottomLeftRadius: 16,
                }}
              />

              {/* BOTTOM RIGHT ──┘ */}
              <div
                style={{
                  ...cornerBase,
                  bottom: 0,
                  right: 0,
                  borderBottomWidth: 4,
                  borderRightWidth: 4,
                  borderTopWidth: 0,
                  borderLeftWidth: 0,
                  borderBottomRightRadius: 16,
                }}
              />

              {/*
               * ANIMATED SCAN LINE
               * ─────────────────
               * position: absolute, inside the ScanFrame
               * left: 10%, width: 80%  → 26px inset from each side
               * top: 50% → vertical starting midpoint
               * animate y: -110px (top edge) → +110px (bottom edge) → repeat
               * Never exits the 260×260 parent.
               */}
              {!isSuccess && (
                <motion.div
                  style={{
                    position: "absolute",
                    top: "50%",
                    left: "10%",
                    width: "80%",
                    height: 2,
                    borderRadius: 9999,
                    opacity: 0.9,
                    background:
                      "linear-gradient(90deg, transparent 0%, #6C5CE7 35%, #60A5FA 50%, #6C5CE7 65%, transparent 100%)",
                    boxShadow: "0 0 15px #6C5CE7, 0 0 8px #60A5FA",
                  }}
                  animate={{ y: [-110, 110] }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    repeatType: "reverse",
                    ease: "easeInOut",
                  }}
                />
              )}

              {/* SUCCESS BADGE — centered inside the frame */}
              {isSuccess && (
                <motion.div
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 0.3 }}
                  style={{
                    position: "absolute",
                    top: "50%",
                    left: "50%",
                    transform: "translate(-50%, -50%)",
                  }}
                  className="flex flex-col items-center gap-1.5 px-4 py-2.5 rounded-2xl bg-emerald-950/90 backdrop-blur-md border border-emerald-400/60 text-emerald-300 text-xs font-black shadow-xl"
                >
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 animate-bounce" />
                  <span>✓ QR Code Terdeteksi</span>
                </motion.div>
              )}
            </motion.div>
            {/* ══ End ScanFrame ══ */}

            {/* ── Layer 5 · Camera control bar (Flash | Zoom | Switch) ── */}
            <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between z-30 pointer-events-auto">
              {/* Bottom Left: Flash / Torch */}
              <button
                type="button"
                onClick={toggleTorch}
                className={`w-11 h-11 rounded-full flex items-center justify-center backdrop-blur-md border transition-all ${
                  isTorchOn
                    ? "bg-amber-400 text-slate-900 border-amber-300 shadow-lg shadow-amber-400/40 scale-105"
                    : "bg-slate-900/70 text-white border-white/20 hover:bg-slate-800"
                }`}
                title="Senter / Flash"
              >
                <Zap className="w-5 h-5" />
              </button>

              {/* Bottom Center: Zoom Pill */}
              <button
                type="button"
                onClick={toggleZoom}
                className="px-3.5 py-2 rounded-full bg-slate-900/70 backdrop-blur-md text-white font-mono font-black text-xs border border-white/20 hover:bg-slate-800 transition"
              >
                {zoomLevel}
              </button>

              {/* Bottom Right: Switch Camera */}
              <button
                type="button"
                onClick={toggleCamera}
                className="w-11 h-11 rounded-full bg-slate-900/70 backdrop-blur-md text-white border border-white/20 flex items-center justify-center hover:bg-slate-800 transition"
                title="Ganti Kamera"
              >
                <RefreshCw className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Manual input shortcut */}
          <button
            type="button"
            onClick={() => setMode("manual")}
            className="w-full py-2.5 rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950 text-slate-700 dark:text-slate-300 hover:text-indigo-600 text-xs font-extrabold border border-slate-200 dark:border-slate-700 transition"
          >
            Masukkan Kode Secara Manual →
          </button>
        </div>
      )}

      {/* ══ 3. MANUAL INPUT MODE ═══════════════════════════════════ */}
      {mode === "manual" && (
        <form
          onSubmit={handleManualSubmit}
          className="w-full space-y-4 bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-lg animate-in fade-in"
        >
          <div className="space-y-2">
            <label className="text-xs font-black text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
              <QrCode className="h-4 w-4 text-indigo-600" />
              <span>Masukkan Kode QR Tablet</span>
            </label>
            <Input
              type="text"
              placeholder="Contoh: QR-TAB-001"
              value={manualInput}
              onChange={(e) => setManualInput(e.target.value)}
              className="font-mono text-base tracking-wider text-indigo-600 font-bold h-12 rounded-xl border-slate-200 dark:border-slate-700"
              required
            />
          </div>

          <Button
            type="submit"
            className="w-full bg-[#473bf0] hover:bg-indigo-700 font-black text-xs h-12 rounded-xl shadow-md shadow-indigo-500/20"
          >
            Proses &amp; Periksa Tablet
          </Button>

          {/* Sample shortcut pills */}
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2">
            <span className="text-[10px] font-bold text-slate-400 block uppercase tracking-wider">
              Contoh Kode Tablet Demo:
            </span>
            <div className="flex flex-wrap gap-1.5">
              {["QR-TAB-001", "QR-TAB-002", "QR-TAB-003"].map((code) => (
                <button
                  key={code}
                  type="button"
                  onClick={() => handleCodeDetected(code)}
                  className="px-2.5 py-1 text-xs font-mono bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 rounded-lg border border-indigo-100 dark:border-indigo-900/50 hover:bg-indigo-100 font-bold transition-all"
                >
                  {code}
                </button>
              ))}
            </div>
          </div>
        </form>
      )}

      {/* ══ 4. LOADING BOTTOM SHEET ════════════════════════════════ */}
      {scanStatus === "loading" && (
        <div className="fixed inset-0 z-[80] bg-slate-900/60 backdrop-blur-sm flex items-end justify-center animate-in fade-in">
          <div className="w-full max-w-[430px] bg-white dark:bg-slate-900 rounded-t-3xl p-6 text-center space-y-4 border-t border-slate-200 dark:border-slate-700 shadow-2xl">
            <div className="w-14 h-14 rounded-2xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 flex items-center justify-center mx-auto border border-indigo-100 dark:border-indigo-900/40">
              <Loader2 className="w-7 h-7 animate-spin text-indigo-600" />
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-900 dark:text-slate-100">
                Mengambil data tablet...
              </h3>
              <p className="text-xs text-slate-400 mt-0.5 font-mono">{detectedCode}</p>
            </div>
          </div>
        </div>
      )}

      {/* ══ 5. SUCCESS BOTTOM SHEET ════════════════════════════════ */}
      {scanStatus === "success" && detectedTablet && (
        <div className="fixed inset-0 z-[80] bg-slate-900/60 backdrop-blur-sm flex items-end justify-center animate-in fade-in">
          <div className="w-full max-w-[430px] bg-white dark:bg-slate-900 rounded-t-3xl p-5 space-y-4 border-t border-slate-200 dark:border-slate-700 shadow-2xl animate-in slide-in-from-bottom-4 duration-300">
            <div className="flex justify-center -mt-1">
              <div className="w-10 h-1 rounded-full bg-slate-200 dark:bg-slate-700" />
            </div>

            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-300 flex items-center justify-center shrink-0 shadow-sm">
                <CheckCircle2 className="w-7 h-7" />
              </div>
              <div className="min-w-0">
                <h3 className="text-base font-black text-slate-900 dark:text-slate-100 leading-tight">
                  ✓ QR Code Berhasil Ditemukan
                </h3>
                <span className="text-xs text-emerald-600 dark:text-emerald-400 font-bold block mt-0.5">
                  Unit tablet siap di-inspeksi
                </span>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2 text-xs">
              <div className="flex items-center justify-between border-b border-slate-200/60 dark:border-slate-700/60 pb-2">
                <span className="text-slate-500">Kode QR Tablet:</span>
                <span className="font-mono font-black text-indigo-600 dark:text-indigo-400 text-sm">
                  {detectedTablet.qr_code}
                </span>
              </div>
              <div className="flex items-center justify-between border-b border-slate-200/60 dark:border-slate-700/60 pb-2">
                <span className="text-slate-500">Model &amp; Merk:</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">
                  {detectedTablet.brand} {detectedTablet.model}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Lokasi Penugasan:</span>
                <span className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-indigo-500" />
                  {detectedTablet.location?.name || "Gudang Utama A"}
                </span>
              </div>
            </div>

            <div className="flex gap-2.5 pt-1">
              <Button
                type="button"
                onClick={resetScan}
                variant="outline"
                className="flex-1 min-h-[48px] rounded-xl font-bold text-xs border-slate-300 dark:border-slate-700"
              >
                Scan Lagi
              </Button>
              <Button
                type="button"
                onClick={confirmStartInspection}
                className="flex-[2] min-h-[48px] rounded-xl bg-[#473bf0] hover:bg-indigo-700 text-white font-black text-xs gap-1.5 shadow-md shadow-indigo-500/20"
              >
                <span>Mulai Inspeksi</span>
                <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ══ 6. ERROR BOTTOM SHEET ══════════════════════════════════ */}
      {scanStatus === "error" && (
        <div className="fixed inset-0 z-[80] bg-slate-900/60 backdrop-blur-sm flex items-end justify-center animate-in fade-in">
          <div className="w-full max-w-[430px] bg-white dark:bg-slate-900 rounded-t-3xl p-5 space-y-4 border-t border-slate-200 dark:border-slate-700 shadow-2xl animate-in slide-in-from-bottom-4 duration-300">
            <div className="flex justify-center -mt-1">
              <div className="w-10 h-1 rounded-full bg-slate-200 dark:bg-slate-700" />
            </div>

            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 dark:bg-rose-950 dark:text-rose-300 flex items-center justify-center shrink-0 shadow-sm">
                <AlertTriangle className="w-7 h-7" />
              </div>
              <div className="min-w-0">
                <h3 className="text-base font-black text-rose-600 dark:text-rose-400 leading-tight">
                  QR Code Tidak Terdaftar
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  {errorMessage || "Kode QR tablet tidak ditemukan di sistem."}
                </p>
              </div>
            </div>

            <div className="flex gap-2.5 pt-1">
              <Button
                type="button"
                onClick={resetScan}
                variant="outline"
                className="flex-1 min-h-[48px] rounded-xl font-bold text-xs border-slate-300 dark:border-slate-700"
              >
                Scan Lagi
              </Button>
              <Button
                type="button"
                onClick={() => { setScanStatus("idle"); setMode("manual"); }}
                className="flex-1 min-h-[48px] rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs"
              >
                Input Manual
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
