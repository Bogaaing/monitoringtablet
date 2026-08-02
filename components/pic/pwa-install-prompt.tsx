"use client";

import React, { useState, useEffect, useRef } from "react";
import { Download, X, Smartphone, Wifi, BatteryFull, Star, Share, Plus } from "lucide-react";

interface PwaInstallPromptProps {
  delay?: number;
}

export function PwaInstallPrompt({ delay = 1500 }: PwaInstallPromptProps) {
  const [show, setShow] = useState(false);
  const [installing, setInstalling] = useState(false);
  const [showManual, setShowManual] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  // Use ref so handleInstall always reads the latest value (no stale closure)
  const deferredPromptRef = useRef<any>(null);

  useEffect(() => {
    // Register service worker
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/sw.js", { scope: "/" })
        .catch((err) => console.warn("[TabMonitor SW]", err));
    }

    // Already installed in standalone mode → skip
    const isStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (navigator as any).standalone === true;
    if (isStandalone) {
      setIsInstalled(true);
      return;
    }

    // Already dismissed this session
    if (sessionStorage.getItem("pwa_install_dismissed")) return;

    // Capture beforeinstallprompt — store in ref, NOT state
    const onBeforeInstall = (e: Event) => {
      e.preventDefault();
      deferredPromptRef.current = e;
    };
    window.addEventListener("beforeinstallprompt", onBeforeInstall);

    // Show our bottom sheet after delay regardless of whether native prompt fired
    const timer = setTimeout(() => setShow(true), delay);

    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstall);
      clearTimeout(timer);
    };
  }, [delay]);

  const isIos = typeof window !== "undefined" &&
    /iphone|ipad|ipod/i.test(navigator.userAgent) &&
    !(navigator as any).standalone;

  const handleInstall = async () => {
    const prompt = deferredPromptRef.current;

    if (prompt) {
      // Android / Chrome — native install dialog
      setInstalling(true);
      try {
        await prompt.prompt();
        const { outcome } = await prompt.userChoice;
        if (outcome === "accepted") {
          setIsInstalled(true);
          setShow(false);
        }
        deferredPromptRef.current = null;
      } catch (err) {
        console.warn("[TabMonitor PWA] Install error:", err);
      } finally {
        setInstalling(false);
      }
      return;
    }

    // No native prompt available (iOS Safari, Firefox, or criteria not met yet)
    // Show inline manual guide instead of doing nothing
    setShowManual(true);
  };

  const handleDismiss = () => {
    setShow(false);
    sessionStorage.setItem("pwa_install_dismissed", "1");
  };

  if (!show || isInstalled) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-[60] bg-slate-900/60 backdrop-blur-sm"
        onClick={handleDismiss}
      />

      {/* Bottom Sheet */}
      <div className="fixed bottom-0 left-0 right-0 z-[70] flex justify-center pointer-events-none">
        <div
          className="w-full max-w-[430px] pointer-events-auto animate-in slide-in-from-bottom-4 duration-300"
        >
          <div className="relative bg-white dark:bg-slate-900 rounded-t-3xl border-t border-x border-slate-200 dark:border-slate-700 shadow-2xl">

            {/* Handle pill */}
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 rounded-full bg-slate-200 dark:bg-slate-700" />
            </div>

            {/* Close button */}
            <button
              onClick={handleDismiss}
              className="absolute top-3.5 right-4 p-1.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition-colors z-10"
              aria-label="Tutup"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="px-5 pb-7 pt-2 space-y-4">

              {/* App Identity */}
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-600 to-indigo-700 text-white flex items-center justify-center shadow-lg shadow-indigo-500/30 shrink-0 text-2xl font-black">
                  T
                </div>
                <div className="min-w-0">
                  <h2 className="text-base font-black text-slate-900 dark:text-slate-100 leading-tight">
                    Pasang TabMonitor
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Tambah ke layar utama untuk akses lebih cepat
                  </p>
                  <div className="flex items-center gap-0.5 mt-1">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star key={s} className="w-3 h-3 fill-amber-400 text-amber-400" />
                    ))}
                    <span className="text-[10px] text-slate-500 ml-1 font-medium">
                      Sistem Inspeksi Mobile
                    </span>
                  </div>
                </div>
              </div>

              {/* Feature Pills */}
              <div className="grid grid-cols-3 gap-2">
                {[
                  { icon: Smartphone, label: "Layar Penuh", desc: "Tanpa browser bar" },
                  { icon: Wifi, label: "Offline Mode", desc: "Kerja tanpa internet" },
                  { icon: BatteryFull, label: "Hemat Baterai", desc: "Lebih ringan" },
                ].map(({ icon: Icon, label, desc }) => (
                  <div
                    key={label}
                    className="flex flex-col items-center text-center p-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/40"
                  >
                    <Icon className="w-4 h-4 text-indigo-600 dark:text-indigo-400 mb-1" />
                    <span className="text-[10px] font-black text-slate-800 dark:text-slate-200 leading-tight">
                      {label}
                    </span>
                    <span className="text-[9px] text-slate-500 dark:text-slate-400 leading-tight mt-0.5">
                      {desc}
                    </span>
                  </div>
                ))}
              </div>

              {/* Manual Guide — shown when native prompt unavailable */}
              {showManual && (
                <div className="p-4 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/40 space-y-2 animate-in fade-in">
                  <p className="text-xs font-black text-indigo-700 dark:text-indigo-300 flex items-center gap-1.5">
                    {isIos ? (
                      <>📱 Cara memasang di iPhone / iPad:</>
                    ) : (
                      <>🌐 Cara memasang di browser Anda:</>
                    )}
                  </p>
                  {isIos ? (
                    <ol className="space-y-1.5 text-xs text-slate-700 dark:text-slate-300">
                      <li className="flex items-start gap-2">
                        <span className="shrink-0 w-5 h-5 rounded-full bg-indigo-600 text-white text-[10px] font-black flex items-center justify-center">1</span>
                        <span>Ketuk ikon <strong>Bagikan ⬆️</strong> di bagian bawah Safari</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="shrink-0 w-5 h-5 rounded-full bg-indigo-600 text-white text-[10px] font-black flex items-center justify-center">2</span>
                        <span>Gulir ke bawah, ketuk <strong>"Tambah ke Layar Utama"</strong></span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="shrink-0 w-5 h-5 rounded-full bg-indigo-600 text-white text-[10px] font-black flex items-center justify-center">3</span>
                        <span>Ketuk <strong>"Tambah"</strong> di pojok kanan atas</span>
                      </li>
                    </ol>
                  ) : (
                    <ol className="space-y-1.5 text-xs text-slate-700 dark:text-slate-300">
                      <li className="flex items-start gap-2">
                        <span className="shrink-0 w-5 h-5 rounded-full bg-indigo-600 text-white text-[10px] font-black flex items-center justify-center">1</span>
                        <span>Ketuk menu <strong>⋮</strong> (3 titik) di pojok kanan atas browser</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="shrink-0 w-5 h-5 rounded-full bg-indigo-600 text-white text-[10px] font-black flex items-center justify-center">2</span>
                        <span>Pilih <strong>"Tambahkan ke layar beranda"</strong> atau <strong>"Install App"</strong></span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="shrink-0 w-5 h-5 rounded-full bg-indigo-600 text-white text-[10px] font-black flex items-center justify-center">3</span>
                        <span>Konfirmasi dengan ketuk <strong>"Tambah"</strong> atau <strong>"Install"</strong></span>
                      </li>
                    </ol>
                  )}
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3 pt-1">
                <button
                  onClick={handleDismiss}
                  className="flex-1 min-h-[52px] rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-sm font-bold hover:bg-slate-100 dark:hover:bg-slate-700 active:scale-[0.97] transition-all"
                >
                  Nanti Saja
                </button>

                <button
                  onClick={handleInstall}
                  disabled={installing}
                  className="flex-[2] min-h-[52px] rounded-2xl bg-[#473bf0] hover:bg-indigo-700 active:scale-[0.97] text-white text-sm font-black flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/30 transition-all disabled:opacity-60 select-none"
                >
                  {installing ? (
                    <span className="animate-pulse">Memasang...</span>
                  ) : showManual ? (
                    <span>Mengerti ✓</span>
                  ) : (
                    <>
                      <Download className="w-4 h-4 shrink-0" />
                      <span>Pasang Sekarang</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
