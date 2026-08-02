import React from "react";

export function Footer() {
  return (
    <div className="pt-6 border-t border-slate-100 mt-6">
      <div className="flex items-center justify-start gap-4 text-xs font-medium text-slate-400">
        <span>Version 1.0.0</span>
        <span className="text-slate-300">•</span>
        <span>© 2026 TabMonitor</span>
      </div>
    </div>
  );
}
