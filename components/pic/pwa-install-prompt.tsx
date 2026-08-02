"use client";

import React, { useState, useEffect } from "react";
import { Download, X, Smartphone, Wifi, BatteryFull, Star } from "lucide-react";

interface PwaInstallPromptProps {
  /** Delay in ms before the prompt appears (default: 1500) */
  delay?: number;
}

export function PwaInstallPrompt({ delay = 1500 }: PwaInstallPromptProps) {
  const [show, setShow] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [installing, setInstalling] = useState(false);

  useEffect(() => {
    // Register service worker
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/sw.js", { scope: "/" })
        .then((reg) => console.log("[TabMonitor PWA] SW registered:", reg.scope))
        .catch((err) => console.warn("[TabMonitor PWA] SW registration failed:", err));
    }

    // Check if already installed (standalone mode)
    const isStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (navigator as any).standalone === true;

    if (isStandalone) {
      setIsInstalled(true);
      return; // Already installed, don't show prompt
    }

    // Check if user already dismissed this session
    const dismissed = sessionStorage.getItem("pwa_install_dismissed");
    if (dismissed) return;

    // Capture beforeinstallprompt event
    const handleBeforeInstall = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      // Show our custom prompt after delay
      setTimeout(() => setShow(true), delay);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstall);

    // If the browser doesn't fire beforeinstallprompt (iOS Safari / already met criteria before)
    // show the manual "Add to Home Screen" guide after delay
    const timer = setTimeout(() => {
      setShow(true);
    }, delay + 500);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstall);
      clearTimeout(timer);
    };
  }, [delay]);

  const handleInstall = async () => {
    if (!deferredPrompt) {
      // iOS / browsers without native prompt — show manual instructions
      // The prompt already shows iOS instructions in the UI
      return;
    }
    setInstalling(true);
    try {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === "accepted") {
        setIsInstalled(true);
        setShow(false);
      }
    } catch (e) {
      console.warn("PWA install prompt error:", e);
    } finally {
      setInstalling(false);
      setDeferredPrompt(null);
    }
  };

  const handleDismiss = () => {
    setShow(false);
    sessionStorage.setItem("pwa_install_dismissed", "1");
  };

  const isIos = () => {
    if (typeof window === "undefined") return false;
    return /iphone|ipad|ipod/i.test(navigator.userAgent);
  };

  if (!show || isInstalled) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-[60] bg-slate-900/50 backdrop-blur-sm animate-in fade-in"
        onClick={handleDismiss}
      />

      {/* Bottom Sheet */}
      <div className="fixed bottom-0 left-0 right-0 z-[70] flex justify-center">
        <div className="w-full max-w-[430px] animate-in slide-in-from-bottom-4 duration-300">
          <div className="bg-white dark:bg-slate-900 rounded-t-3xl border-t border-x border-slate-200 dark:border-slate-700 shadow-2xl overflow-hidden">

            {/* Handle pill */}
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 rounded-full bg-slate-200 dark:bg-slate-700" />
            </div>

            {/* Close button */}
            <button
              onClick={handleDismiss}
              className="absolute top-4 right-4 p-1.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="px-5 pb-6 pt-2 space-y-5">
              {/* App Identity */}
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-600 to-indigo-700 text-white flex items-center justify-center shadow-lg shadow-indigo-500/30 shrink-0">
                  <span className="text-2xl font-black">T</span>
                </div>
                <div>
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

              {/* Feature pills */}
              <div className="grid grid-cols-3 gap-2">
                {[
                  { icon: Smartphone, label: "Layar Penuh", desc: "Tanpa browser bar" },
                  { icon: Wifi, label: "Offline Mode", desc: "Kerja tanpa internet" },
                  { icon: BatteryFull, label: "Hemat Baterai", desc: "Lebih ringan" },
                ].map((f) => {
                  const Icon = f.icon;
                  return (
                    <div
                      key={f.label}
                      className="flex flex-col items-center text-center p-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/40"
                    >
                      <Icon className="w-4 h-4 text-indigo-600 dark:text-indigo-400 mb-1" />
                      <span className="text-[10px] font-black text-slate-800 dark:text-slate-200 leading-tight">
                        {f.label}
                      </span>
                      <span className="text-[9px] text-slate-500 dark:text-slate-400 leading-tight mt-0.5">
                        {f.desc}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* iOS Manual Guide */}
              {isIos() && !deferredPrompt && (
                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 space-y-1.5">
                  <p className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                    Cara memasang di iPhone / iPad:
                  </p>
                  <ol className="space-y-1 text-[11px] text-slate-600 dark:text-slate-400">
                    <li className="flex items-start gap-1.5">
                      <span className="font-black text-indigo-600 shrink-0">1.</span>
                      <span>Ketuk ikon <strong>Bagikan (⬆️)</strong> di Safari</span>
                    </li>
                    <li className="flex items-start gap-1.5">
                      <span className="font-black text-indigo-600 shrink-0">2.</span>
                      <span>Gulir ke bawah, pilih <strong>"Tambah ke Layar Utama"</strong></span>
                    </li>
                    <li className="flex items-start gap-1.5">
                      <span className="font-black text-indigo-600 shrink-0">3.</span>
                      <span>Ketuk <strong>"Tambah"</strong> di pojok kanan atas</span>
                    </li>
                  </ol>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3 pt-1">
                <button
                  onClick={handleDismiss}
                  className="flex-1 min-h-[48px] rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-sm font-bold hover:bg-slate-100 dark:hover:bg-slate-700 transition active:scale-[0.97]"
                >
                  Nanti Saja
                </button>

                {!isIos() || deferredPrompt ? (
                  <button
                    onClick={handleInstall}
                    disabled={installing}
                    className="flex-[2] min-h-[48px] rounded-2xl bg-[#473bf0] hover:bg-indigo-700 active:scale-[0.97] text-white text-sm font-black flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/30 transition disabled:opacity-60"
                  >
                    {installing ? (
                      <span className="animate-pulse">Memasang...</span>
                    ) : (
                      <>
                        <Download className="w-4 h-4" />
                        <span>Pasang Sekarang</span>
                      </>
                    )}
                  </button>
                ) : (
                  <button
                    onClick={handleDismiss}
                    className="flex-[2] min-h-[48px] rounded-2xl bg-[#473bf0] hover:bg-indigo-700 text-white text-sm font-black flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/30 transition active:scale-[0.97]"
                  >
                    <span>Mengerti!</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
