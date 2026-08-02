"use client";

import { useEffect } from "react";

export function PwaInstallPrompt() {
  useEffect(() => {
    // Register service worker
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/sw.js", { scope: "/" })
        .catch((err) => console.warn("[TabMonitor SW]", err));
    }

    // Already installed in standalone mode — skip
    const isStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (navigator as any).standalone === true;
    if (isStandalone) return;

    // Capture and immediately fire the native install dialog
    const onBeforeInstall = async (e: Event) => {
      e.preventDefault();
      const prompt = e as any;
      try {
        await prompt.prompt();
      } catch (err) {
        console.warn("[TabMonitor PWA] auto-install error:", err);
      }
    };

    window.addEventListener("beforeinstallprompt", onBeforeInstall);
    return () => window.removeEventListener("beforeinstallprompt", onBeforeInstall);
  }, []);

  // No UI — purely headless
  return null;
}
