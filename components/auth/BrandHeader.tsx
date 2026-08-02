import React from "react";
import { Tablet } from "lucide-react";

export function BrandHeader() {
  return (
    <div className="flex items-center gap-3.5 mb-10">
      <div className="w-12 h-12 bg-gradient-to-tr from-indigo-600 to-blue-500 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-indigo-200">
        <Tablet className="w-6 h-6 stroke-[2.2]" />
      </div>
      <div>
        <h1 className="text-xl font-bold text-slate-900 tracking-tight leading-tight">
          TabMonitor
        </h1>
        <p className="text-xs font-medium text-slate-400">
          Tablet Monitoring System
        </p>
      </div>
    </div>
  );
}
