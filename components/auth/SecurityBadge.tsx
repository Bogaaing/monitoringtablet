import React from "react";
import { Lock } from "lucide-react";

export function SecurityBadge() {
  return (
    <div className="flex items-center gap-3 mb-6">
      <div className="bg-indigo-50 border border-indigo-100/80 text-indigo-600 text-xs font-semibold px-3.5 py-1.5 rounded-full flex items-center gap-2">
        <Lock className="w-3 h-3 stroke-[2.5]" />
        <span>Secure Login</span>
      </div>
      <span className="text-xs font-medium text-slate-400">
        Enterprise Authentication
      </span>
    </div>
  );
}
