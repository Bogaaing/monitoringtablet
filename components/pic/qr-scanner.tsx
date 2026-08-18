"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { tabletsService } from "@/services/tablets.service";
import { Tablet, User } from "@/types";
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

/* ═══════════════════════════════════════════════════════════════════
 *  CONSTANTS
 * ═══════════════════════════════════════════════════════════════════ */
const FRAME_SIZE = 300;
const CORNER_LEN = 44;
const CORNER_R = 16;
const STROKE_W = 4;

/* ═══════════════════════════════════════════════════════════════════
 *  ScannerOverlay — single unified overlay component
 *
 *  Layers (bottom → top):
 *    1. Dark transparent mask with a transparent cut-out window
 *    2. SVG scan frame (4 corners in ONE <svg>)
 *    3. Animated scan line (CSS keyframes, clipped inside frame)
 *    4. Camera controls
 * ═══════════════════════════════════════════════════════════════════ */
interface ScannerOverlayProps {
  isSuccess: boolean;
  isTorchOn: boolean;
  zoomLevel: "1x" | "2x";
  onToggleTorch: () => void;
  onToggleZoom: () => void;
  onToggleCamera: () => void;
}

function ScannerOverlay({
  isSuccess,
  isTorchOn,
  zoomLevel,
  onToggleTorch,
  onToggleZoom,
  onToggleCamera,
}: ScannerOverlayProps) {
  const accentColor = isSuccess ? "#34D399" : "#818CF8";
  const glowColor = isSuccess ? "rgba(52,211,153,0.45)" : "rgba(129,140,248,0.35)";

  /*
   * Build ONE SVG path that draws all 4 rounded corners.
   * Each corner is a short L-shape with a rounded elbow.
   *
   * Coordinates are relative to the FRAME_SIZE viewBox.
   * We use HALF_STROKE inset so strokes don't clip.
   */
  const hs = STROKE_W / 2; // half-stroke inset
  const cl = CORNER_LEN;   // corner arm length
  const r = CORNER_R;      // corner radius
  const s = FRAME_SIZE;

  const cornersPath = [
    // ┌ Top-Left
    `M ${hs},${hs + cl} L ${hs},${hs + r} Q ${hs},${hs} ${hs + r},${hs} L ${hs + cl},${hs}`,
    // ┐ Top-Right
    `M ${s - hs - cl},${hs} L ${s - hs - r},${hs} Q ${s - hs},${hs} ${s - hs},${hs + r} L ${s - hs},${hs + cl}`,
    // └ Bottom-Left
    `M ${hs},${s - hs - cl} L ${hs},${s - hs - r} Q ${hs},${s - hs} ${hs + r},${s - hs} L ${hs + cl},${s - hs}`,
    // ┘ Bottom-Right
    `M ${s - hs - cl},${s - hs} L ${s - hs - r},${s - hs} Q ${s - hs},${s - hs} ${s - hs},${s - hs - r} L ${s - hs},${s - hs - cl}`,
  ].join(" ");

  return (
    <div
      className="absolute inset-0 z-10"
      style={{ pointerEvents: "none" }}
    >
      {/* ── LAYER 1: Dark mask with transparent window ─────────────
       *  We use an SVG mask to cut out the center rectangle.
       *  This avoids clip-path browser inconsistencies. */}
      <svg
        className="absolute inset-0 w-full h-full"
        preserveAspectRatio="none"
        style={{ zIndex: 1 }}
      >
        <defs>
          <mask id="scan-window-mask">
            {/* White = visible (show dark overlay) */}
            <rect width="100%" height="100%" fill="white" />
            {/* Black = transparent (cut-out window) */}
            <rect
              x="50%" y="50%"
              width={FRAME_SIZE} height={FRAME_SIZE}
              rx="16" ry="16"
              transform={`translate(-${FRAME_SIZE / 2}, -${FRAME_SIZE / 2})`}
              fill="black"
            />
          </mask>
        </defs>
        <rect
          width="100%" height="100%"
          fill="rgba(0,0,0,0.65)"
          mask="url(#scan-window-mask)"
        />
      </svg>

      {/* ── LAYER 2: Instruction pill (top) ──────────────────────── */}
      <div
        className="absolute top-4 left-0 right-0 flex justify-center"
        style={{ zIndex: 30 }}
      >
        <div className="px-4 py-1.5 rounded-full bg-slate-900/85 backdrop-blur-md text-white text-[11px] font-bold border border-white/10 shadow-lg">
          {isSuccess
            ? "✓ QR Code berhasil ditemukan"
            : "Arahkan QR Code ke dalam bingkai"}
        </div>
      </div>

      {/* ── LAYER 3: SVG Frame + Corners + Scan Line ─────────────
       *  Single <svg> centered via flexbox.
       *  viewBox matches FRAME_SIZE so corners scale responsively. */}
      <div
        className="absolute inset-0 flex items-center justify-center"
        style={{ zIndex: 20 }}
      >
        <svg
          width={FRAME_SIZE}
          height={FRAME_SIZE}
          viewBox={`0 0 ${FRAME_SIZE} ${FRAME_SIZE}`}
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          style={{
            overflow: "hidden",
            filter: `drop-shadow(0 0 8px ${glowColor})`,
            transition: "filter 0.3s ease",
          }}
        >
          <defs>
            {/* Clip rect for the scan line — nothing overflows */}
            <clipPath id="frame-clip">
              <rect
                x={STROKE_W}
                y={STROKE_W}
                width={FRAME_SIZE - STROKE_W * 2}
                height={FRAME_SIZE - STROKE_W * 2}
                rx={CORNER_R - STROKE_W}
              />
            </clipPath>
            {/* Gradient for the scan line */}
            <linearGradient id="scan-line-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="transparent" />
              <stop offset="20%" stopColor={accentColor} stopOpacity="0.5" />
              <stop offset="50%" stopColor={accentColor} stopOpacity="1" />
              <stop offset="80%" stopColor={accentColor} stopOpacity="0.5" />
              <stop offset="100%" stopColor="transparent" />
            </linearGradient>
          </defs>

          {/* Four corners — ONE path element */}
          <path
            d={cornersPath}
            stroke={accentColor}
            strokeWidth={STROKE_W}
            strokeLinecap="round"
            fill="none"
            style={{ transition: "stroke 0.3s ease" }}
          />

          {/* Animated scan line — native SVG animation so clipPath works correctly.
           *  CSS transforms on SVG elements break clipPath in mobile browsers. */}
          {!isSuccess && (
            <g clipPath="url(#frame-clip)">
              <rect
                x={STROKE_W + 16}
                width={FRAME_SIZE - (STROKE_W + 16) * 2}
                height={2.5}
                rx={1.25}
                fill="url(#scan-line-gradient)"
              >
                <animate
                  attributeName="y"
                  values={`${STROKE_W + 8};${FRAME_SIZE - STROKE_W - 10};${STROKE_W + 8}`}
                  dur="2.6s"
                  repeatCount="indefinite"
                  calcMode="spline"
                  keySplines="0.45 0 0.55 1;0.45 0 0.55 1"
                />
              </rect>
            </g>
          )}

          {/* Success checkmark — centered inside frame */}
          {isSuccess && (
            <g className="scanner-success-pop">
              <circle
                cx={FRAME_SIZE / 2}
                cy={FRAME_SIZE / 2}
                r="36"
                fill="rgba(5,46,32,0.85)"
                stroke="#34D399"
                strokeWidth="2"
              />
              <path
                d={`M ${FRAME_SIZE / 2 - 14} ${FRAME_SIZE / 2} l 10 10 l 18 -20`}
                stroke="#34D399"
                strokeWidth="3.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
              />
            </g>
          )}
        </svg>
      </div>

      {/* ── LAYER 4: Camera controls ─────────────────────────────── */}
      <div
        className="absolute bottom-5 left-5 right-5 flex items-center justify-between"
        style={{ zIndex: 30, pointerEvents: "auto" }}
      >
        {/* Torch */}
        <button
          type="button"
          onClick={onToggleTorch}
          className={`w-11 h-11 rounded-full flex items-center justify-center backdrop-blur-md border transition-all ${
            isTorchOn
              ? "bg-amber-400 text-slate-900 border-amber-300 shadow-lg shadow-amber-400/40 scale-105"
              : "bg-slate-900/70 text-white border-white/20 hover:bg-slate-800"
          }`}
          title="Senter / Flash"
        >
          <Zap className="w-5 h-5" />
        </button>

        {/* Zoom */}
        <button
          type="button"
          onClick={onToggleZoom}
          className="px-3.5 py-2 rounded-full bg-slate-900/70 backdrop-blur-md text-white font-mono font-black text-xs border border-white/20 hover:bg-slate-800 transition"
        >
          {zoomLevel}
        </button>

        {/* Switch camera */}
        <button
          type="button"
          onClick={onToggleCamera}
          className="w-11 h-11 rounded-full bg-slate-900/70 backdrop-blur-md text-white border border-white/20 flex items-center justify-center hover:bg-slate-800 transition"
          title="Ganti Kamera"
        >
          <RefreshCw className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
 *  QRScanner — main exported component
 * ═══════════════════════════════════════════════════════════════════ */
interface QRScannerProps {
  onScanSuccess: (qrCode: string, tabletData?: Tablet) => void;
  isScanning?: boolean;
  currentUser?: User | null;
}

export function QRScanner({ onScanSuccess, currentUser }: QRScannerProps) {
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
  const handleCodeDetected = useCallback(async (code: string) => {
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
        if (!tablet) {
          setErrorMessage(`QR Code "${code}" tidak terdaftar dalam sistem inventaris.`);
          setScanStatus("error");
          return;
        }

        // Strict Location Authorization Check for PIC
        if (currentUser?.role === "pic" && currentUser.location_id) {
          if (tablet.location_id && tablet.location_id !== currentUser.location_id) {
            const tabletLocName = tablet.location?.name || "lokasi lain";
            const myLocName = currentUser.location?.name || "lokasi penugasan Anda";
            setErrorMessage(
              `Akses Ditolak: Tablet "${tablet.qr_code}" berada di "${tabletLocName}". Anda hanya ditugaskan untuk menginspeksi di "${myLocName}".`
            );
            setScanStatus("error");
            return;
          }
        }

        setDetectedTablet(tablet);
        setScanStatus("success");
      }, remainingDelay);
    } catch (e: any) {
      setErrorMessage(e?.message || `QR Code "${code}" tidak dapat diproses.`);
      setScanStatus("error");
    }
  }, [scanStatus, currentUser]);

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

  const isSuccess = scanStatus === "success";

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
          {/* Viewfinder — camera underneath, overlay above */}
          <div
            className="relative w-full aspect-square rounded-3xl bg-black shadow-2xl overflow-hidden"
            style={{ isolation: "isolate" }}
          >
            {/* Camera video stream (Html5Qrcode target) — LAYER 0 */}
            <div
              id="qr-reader-video"
              className={`absolute inset-0 rounded-3xl overflow-hidden transition-transform duration-300 ${
                zoomLevel === "2x" ? "scale-125" : "scale-100"
              }`}
              style={{ zIndex: 0 }}
            />

            {/* ScannerOverlay — LAYERS 1-4 above the camera */}
            <ScannerOverlay
              isSuccess={isSuccess}
              isTorchOn={isTorchOn}
              zoomLevel={zoomLevel}
              onToggleTorch={toggleTorch}
              onToggleZoom={toggleZoom}
              onToggleCamera={toggleCamera}
            />
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
              placeholder="Contoh: TB 01"
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
