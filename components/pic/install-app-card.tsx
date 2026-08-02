"use client";

import React, { useState, useEffect } from "react";
import { Download, CheckCircle2 } from "lucide-react";

export function InstallAppCard() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isDismissed, setIsDismissed] = useState<boolean>(false);
  const [isInstalled, setIsInstalled] = useState<boolean>(false);
  const [showToast, setShowToast] = useState<boolean>(false);
  const [installing, setInstalling] = useState<boolean>(false);

  useEffect(() => {
    // 1. Register Service Worker for PWA installability
    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/sw.js", { scope: "/" })
        .then((reg) => console.log("[InstallAppCard] SW registered:", reg.scope))
        .catch((err) => console.warn("[InstallAppCard] SW reg error:", err));
    }

    // 2. Check standalone / installed state
    const checkInstalledState = () => {
      if (typeof window === "undefined") return false;
      const isStandaloneMode =
        window.matchMedia("(display-mode: standalone)").matches ||
        (navigator as any).standalone === true;

      const permanentlyInstalled = localStorage.getItem("pwa-installed") === "true";
      return isStandaloneMode || permanentlyInstalled;
    };

    if (checkInstalledState()) {
      setIsInstalled(true);
      return;
    }

    // 3. Check session dismissal
    const sessionDismissed =
      typeof window !== "undefined" &&
      sessionStorage.getItem("pwa-install-dismissed-session") === "true";

    if (sessionDismissed) {
      setIsDismissed(true);
    }

    // 4. Capture beforeinstallprompt event (from global layout script or state)
    const updatePrompt = () => {
      if (typeof window !== "undefined" && (window as any).__pwaPrompt) {
        setDeferredPrompt((window as any).__pwaPrompt);
      }
    };

    updatePrompt();

    // Check periodically in first 5 seconds in case browser fires beforeinstallprompt after hydration
    const intervalId = setInterval(updatePrompt, 500);
    const timeoutId = setTimeout(() => clearInterval(intervalId), 5000);

    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      (window as any).__pwaPrompt = e;
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
      if (typeof window !== "undefined") {
        (window as any).__pwaPrompt = null;
      }
      localStorage.setItem("pwa-installed", "true");
      setShowToast(true);
      setTimeout(() => setShowToast(false), 4000);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstall);
    window.addEventListener("appinstalled", handleAppInstalled);

    return () => {
      clearInterval(intervalId);
      clearTimeout(timeoutId);
      window.removeEventListener("beforeinstallprompt", handleBeforeInstall);
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    const promptEvent =
      deferredPrompt || (typeof window !== "undefined" && (window as any).__pwaPrompt);

    if (!promptEvent) return;

    setInstalling(true);
    try {
      // Direct execution of native browser installation prompt
      await promptEvent.prompt();
      const choiceResult = await promptEvent.userChoice;

      if (choiceResult && choiceResult.outcome === "accepted") {
        setIsInstalled(true);
        localStorage.setItem("pwa-installed", "true");
        setShowToast(true);
        setTimeout(() => setShowToast(false), 4000);
      }
    } catch (err) {
      console.warn("[InstallAppCard] Install error:", err);
    } finally {
      setDeferredPrompt(null);
      if (typeof window !== "undefined") {
        (window as any).__pwaPrompt = null;
      }
      setInstalling(false);
    }
  };

  const handleDismiss = () => {
    setIsDismissed(true);
    sessionStorage.setItem("pwa-install-dismissed-session", "true");
  };

  const renderToast = () => {
    if (!showToast) return null;
    return (
      <div className="fixed top-5 left-1/2 -translate-x-1/2 z-[100] animate-in fade-in slide-in-from-top-4 duration-300">
        <div className="px-4 py-2.5 rounded-xl bg-emerald-600 text-white font-bold text-xs shadow-lg flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-white" />
          <span>✓ TabMonitor berhasil diinstall.</span>
        </div>
      </div>
    );
  };

  // Active prompt event reference
  const activePrompt =
    deferredPrompt || (typeof window !== "undefined" && (window as any).__pwaPrompt);

  // Display conditions according to requirements:
  // - User role PIC (placed on PIC dashboard)
  // - Application is NOT already installed (standalone mode / localStorage)
  // - Browser supports / has captured BeforeInstallPrompt event
  // - User has not dismissed in current session
  if (isInstalled || isDismissed || !activePrompt) {
    return renderToast();
  }

  return (
    <>
      {renderToast()}

      <div className="p-4 rounded-2xl bg-gradient-to-r from-purple-50/90 via-indigo-50/70 to-purple-50/90 dark:from-purple-950/40 dark:via-indigo-950/40 dark:to-purple-950/40 border border-purple-200/80 dark:border-purple-800/50 shadow-md shadow-purple-500/10 space-y-3 transition-all duration-300">
        <div className="flex items-start gap-3">
          <div className="p-2.5 rounded-xl bg-purple-600 text-white shadow-md shadow-purple-500/20 shrink-0 mt-0.5">
            <span className="text-base leading-none">📱</span>
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="text-xs font-black text-slate-900 dark:text-slate-100 flex items-center gap-1.5 leading-tight">
              <span>Install TabMonitor</span>
            </h4>
            <p className="text-[11px] text-slate-600 dark:text-slate-300 mt-1 leading-snug font-medium">
              Install aplikasi agar akses lebih cepat, kamera lebih stabil, dan dapat digunakan seperti aplikasi native.
            </p>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-1 border-t border-purple-100 dark:border-purple-900/30">
          <button
            type="button"
            onClick={handleDismiss}
            className="px-3 py-1.5 text-xs font-bold text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
          >
            Nanti
          </button>
          <button
            type="button"
            onClick={handleInstallClick}
            disabled={installing}
            className="px-4 py-2 rounded-xl bg-[#473bf0] hover:bg-indigo-700 active:scale-95 text-white text-xs font-extrabold shadow-md shadow-indigo-500/20 transition-all flex items-center gap-1.5 disabled:opacity-60"
          >
            <Download className="w-3.5 h-3.5" />
            <span>{installing ? "Menginstall..." : "Install Sekarang"}</span>
          </button>
        </div>
      </div>
    </>
  );
}
