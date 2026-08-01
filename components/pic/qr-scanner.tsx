"use client";

import React, { useEffect, useRef, useState } from "react";
import { Html5QrcodeScanner, Html5Qrcode } from "html5-qrcode";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { QrCode, Camera, Keyboard, AlertCircle, RefreshCw } from "lucide-react";

interface QRScannerProps {
  onScanSuccess: (qrCode: string) => void;
  isScanning?: boolean;
}

export function QRScanner({ onScanSuccess, isScanning = true }: QRScannerProps) {
  const [manualInput, setManualInput] = useState("");
  const [useCamera, setUseCamera] = useState(true);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);

  useEffect(() => {
    if (!useCamera) return;

    const qrRegionId = "html5qrcode-scanner-region";

    try {
      const scanner = new Html5QrcodeScanner(
        qrRegionId,
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1.0,
          showTorchButtonIfSupported: true,
        },
        false
      );

      scanner.render(
        (decodedText) => {
          let cleanQr = decodedText;
          try {
            // If QR payload is JSON string
            const parsed = JSON.parse(decodedText);
            if (parsed.qr_code) cleanQr = parsed.qr_code;
          } catch (e) {
            // Normal string QR
          }
          scanner.clear();
          onScanSuccess(cleanQr);
        },
        (error) => {
          // Continuous scanning silent error
        }
      );

      scannerRef.current = scanner;
    } catch (err: any) {
      console.warn("Camera scanner initialization error:", err);
      setCameraError("Kamera tidak dapat diakses atau tidak diizinkan di browser ini.");
      setUseCamera(false);
    }

    return () => {
      if (scannerRef.current) {
        scannerRef.current.clear().catch(() => {});
      }
    };
  }, [useCamera]);

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (manualInput.trim()) {
      onScanSuccess(manualInput.trim());
    }
  };

  return (
    <div className="flex flex-col items-center space-y-6 w-full max-w-md mx-auto">
      {/* Scanner Mode Toggle */}
      <div className="flex items-center gap-2 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl w-full">
        <button
          type="button"
          onClick={() => setUseCamera(true)}
          className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 ${
            useCamera
              ? "bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm"
              : "text-slate-500 hover:text-slate-900"
          }`}
        >
          <Camera className="h-4 w-4" />
          <span>Kamera Scanner</span>
        </button>

        <button
          type="button"
          onClick={() => setUseCamera(false)}
          className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 ${
            !useCamera
              ? "bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm"
              : "text-slate-500 hover:text-slate-900"
          }`}
        >
          <Keyboard className="h-4 w-4" />
          <span>Input Manual Kode</span>
        </button>
      </div>

      {useCamera ? (
        <div className="w-full flex flex-col items-center">
          <div className="w-full bg-white dark:bg-slate-900 rounded-3xl border-2 border-indigo-500 p-4 shadow-xl overflow-hidden relative">
            <div id="html5qrcode-scanner-region" className="w-full rounded-2xl overflow-hidden" />
          </div>
          <p className="text-xs text-slate-500 mt-3 text-center">
            Arahkan kamera ke QR Code yang tertera pada bodi fisik tablet.
          </p>
        </div>
      ) : (
        <form onSubmit={handleManualSubmit} className="w-full space-y-4 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-lg">
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <QrCode className="h-4 w-4 text-indigo-600" />
              <span>Masukkan Kode QR Tablet</span>
            </label>
            <Input
              type="text"
              placeholder="Contoh: QR-TAB-001"
              value={manualInput}
              onChange={(e) => setManualInput(e.target.value)}
              className="font-mono text-base tracking-wider text-indigo-600 font-bold"
              required
            />
          </div>

          <Button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 font-bold text-sm h-11">
            Proses & Periksa Tablet
          </Button>

          {/* Quick Demo Shortcuts */}
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2">
            <span className="text-[11px] font-semibold text-slate-400">Sample Demo Codes:</span>
            <div className="flex flex-wrap gap-2">
              {["QR-TAB-001", "QR-TAB-002", "QR-TAB-003"].map((code) => (
                <button
                  key={code}
                  type="button"
                  onClick={() => onScanSuccess(code)}
                  className="px-2.5 py-1 text-xs font-mono bg-slate-100 dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 rounded-lg hover:bg-indigo-50 font-bold transition-all"
                >
                  {code}
                </button>
              ))}
            </div>
          </div>
        </form>
      )}
    </div>
  );
}
