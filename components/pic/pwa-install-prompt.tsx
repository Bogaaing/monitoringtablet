"use client";

import { useEffect, useState } from "react";
import { Download, X, Smartphone, Share } from "lucide-react";

/* ═══════════════════════════════════════════════════════════════════
 *  PwaInstallPrompt
 *
 *  Proper PWA install flow:
 *    1. Register service worker on mount
 *    2. Check for globally captured `beforeinstallprompt` event
 *       (captured by inline <script> in layout.tsx <head> to
 *        prevent race condition with React hydration)
 *    3. Also listen for future `beforeinstallprompt` events
 *    4. Show a custom install banner UI to the user
 *    5. Only call `prompt()` when the user taps the Install button
 *    6. Persist dismiss state in localStorage for 7 days
 *    7. On iOS Safari (no beforeinstallprompt), show manual guide
 * ═══════════════════════════════════════════════════════════════════ */

const DISMISS_KEY = "pwa-install-dismissed";
const DISMISS_DAYS = 7;

// Detect iOS Safari (does not support beforeinstallprompt)
function isIOSSafari(): boolean {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent;
  const isIOS = /iPad|iPhone|iPod/.test(ua) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  const isSafari = /Safari/.test(ua) && !/CriOS|FxiOS|OPiOS|EdgiOS/.test(ua);
  return isIOS && isSafari;
}

export function PwaInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showBanner, setShowBanner] = useState(false);
  const [showIOSGuide, setShowIOSGuide] = useState(false);
  const [installing, setInstalling] = useState(false);

  useEffect(() => {
    // ── 1. Register Service Worker ──────────────────────────────────
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/sw.js", { scope: "/" })
        .then((reg) => {
          console.log("[TabMonitor SW] Registered, scope:", reg.scope);
        })
        .catch((err) => console.warn("[TabMonitor SW] Registration failed:", err));
    }

    // ── 2. Already installed in standalone mode? Skip ───────────────
    const isStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (navigator as any).standalone === true;
    if (isStandalone) return;

    // ── 3. Check if user dismissed recently ─────────────────────────
    const dismissedAt = localStorage.getItem(DISMISS_KEY);
    if (dismissedAt) {
      const daysSince = (Date.now() - parseInt(dismissedAt, 10)) / (1000 * 60 * 60 * 24);
      if (daysSince < DISMISS_DAYS) return;
      localStorage.removeItem(DISMISS_KEY);
    }

    // ── 4. Check for globally captured event (from layout.tsx <head> script)
    //       This fixes the race condition where browser fires
    //       beforeinstallprompt before React hydrates. ────────────────
    const globalPrompt = (window as any).__pwaPrompt;
    if (globalPrompt) {
      setDeferredPrompt(globalPrompt);
      (window as any).__pwaPrompt = null; // consumed
      setTimeout(() => setShowBanner(true), 300);
    }

    // ── 5. Also listen for future beforeinstallprompt events ────────
    const onBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      (window as any).__pwaPrompt = null;
      setTimeout(() => setShowBanner(true), 300);
    };

    window.addEventListener("beforeinstallprompt", onBeforeInstall);

    // ── 6. Listen for successful install ────────────────────────────
    const onAppInstalled = () => {
      setShowBanner(false);
      setShowIOSGuide(false);
      setDeferredPrompt(null);
      console.log("[TabMonitor PWA] App installed successfully!");
    };

    window.addEventListener("appinstalled", onAppInstalled);

    // ── 7. iOS Safari fallback: show manual guide after delay ───────
    if (isIOSSafari()) {
      setTimeout(() => setShowIOSGuide(true), 5000);
    }

    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstall);
      window.removeEventListener("appinstalled", onAppInstalled);
    };
  }, []);

  // ── Handle Install button click ──────────────────────────────────
  const handleInstall = async () => {
    if (!deferredPrompt) return;
    setInstalling(true);

    try {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;

      if (outcome === "accepted") {
        console.log("[TabMonitor PWA] User accepted install");
      } else {
        console.log("[TabMonitor PWA] User dismissed install");
      }
    } catch (err) {
      console.warn("[TabMonitor PWA] Install error:", err);
    } finally {
      setDeferredPrompt(null);
      setShowBanner(false);
      setInstalling(false);
    }
  };

  // ── Handle Dismiss ───────────────────────────────────────────────
  const handleDismiss = () => {
    setShowBanner(false);
    setShowIOSGuide(false);
    localStorage.setItem(DISMISS_KEY, String(Date.now()));
  };

  // ── iOS Safari Manual Guide ──────────────────────────────────────
  if (showIOSGuide) {
    return (
      <div className="fixed bottom-20 left-0 right-0 z-[90] flex justify-center px-4 animate-in slide-in-from-bottom-4 duration-300">
        <div className="w-full max-w-[410px] bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden relative">
          {/* Close button */}
          <button
            type="button"
            onClick={handleDismiss}
            className="absolute top-3 right-3 w-7 h-7 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 hover:text-slate-600 transition z-10"
            aria-label="Tutup"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-3.5 p-4">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 shadow-lg overflow-hidden">
              <img src="/icons/icon-192x192.png" alt="TabMonitor" width={56} height={56} className="w-full h-full object-cover" />
            </div>
            <div className="flex-1 min-w-0 pr-6">
              <h4 className="text-sm font-black text-slate-900 dark:text-slate-100 leading-tight">
                Install TabMonitor
              </h4>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-snug">
                Ketuk <Share className="w-3.5 h-3.5 inline-block text-indigo-500 -mt-0.5" /> lalu pilih <strong>&ldquo;Add to Home Screen&rdquo;</strong>
              </p>
            </div>
          </div>

          <div className="px-4 pb-4">
            <button
              type="button"
              onClick={handleDismiss}
              className="w-full py-2.5 rounded-xl text-xs font-bold text-slate-500 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 transition"
            >
              Mengerti
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── No banner to show ────────────────────────────────────────────
  if (!showBanner) return null;

  // ── Render custom install banner (Chrome/Edge/Android) ───────────
  return (
    <div className="fixed bottom-20 left-0 right-0 z-[90] flex justify-center px-4 animate-in slide-in-from-bottom-4 duration-300">
      <div className="w-full max-w-[410px] bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden relative">
        {/* Close button */}
        <button
          type="button"
          onClick={handleDismiss}
          className="absolute top-3 right-3 w-7 h-7 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 hover:text-slate-600 transition z-10"
          aria-label="Tutup"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-3.5 p-4">
          {/* App Icon */}
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 shadow-lg overflow-hidden">
            <img
              src="/icons/icon-192x192.png"
              alt="TabMonitor"
              width={56}
              height={56}
              className="w-full h-full object-cover"
            />
          </div>

          {/* Text */}
          <div className="flex-1 min-w-0 pr-6">
            <h4 className="text-sm font-black text-slate-900 dark:text-slate-100 leading-tight">
              Install TabMonitor
            </h4>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-snug">
              Akses lebih cepat langsung dari home screen. Dapat digunakan offline.
            </p>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex gap-2 px-4 pb-4">
          <button
            type="button"
            onClick={handleDismiss}
            className="flex-1 py-2.5 rounded-xl text-xs font-bold text-slate-500 hover:text-slate-700 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition"
          >
            Nanti Saja
          </button>
          <button
            type="button"
            onClick={handleInstall}
            disabled={installing}
            className="flex-[2] py-2.5 rounded-xl text-xs font-black text-white bg-[#473bf0] hover:bg-indigo-700 shadow-md shadow-indigo-500/20 transition flex items-center justify-center gap-2 disabled:opacity-60"
          >
            {installing ? (
              <>
                <Smartphone className="w-4 h-4 animate-pulse" />
                <span>Menginstall...</span>
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                <span>Install Aplikasi</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
