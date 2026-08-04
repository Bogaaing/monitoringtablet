"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { CheckCircle2, XCircle, X, CheckSquare } from "lucide-react";

interface BulkActionBarProps {
  selectedCount: number;
  onApproveSelected: () => void;
  onRejectSelected: () => void;
  onClearSelection: () => void;
  isLoading?: boolean;
}

export function BulkActionBar({
  selectedCount,
  onApproveSelected,
  onRejectSelected,
  onClearSelection,
  isLoading = false,
}: BulkActionBarProps) {
  if (selectedCount === 0) return null;

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 w-[92%] max-w-2xl animate-in slide-in-from-bottom-6 duration-300">
      <div className="bg-slate-900/95 dark:bg-slate-950/95 backdrop-blur-xl text-white border border-slate-700/80 dark:border-slate-800 shadow-2xl rounded-2xl px-5 py-3.5 flex flex-wrap items-center justify-between gap-4">
        {/* Selected Count Indicator */}
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center h-8 px-3 rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 text-xs font-extrabold tracking-wide font-mono">
            <CheckSquare className="h-4 w-4 mr-1.5 text-indigo-400" />
            Selected: {selectedCount} {selectedCount === 1 ? "Inspection" : "Inspections"}
          </div>

          <button
            onClick={onClearSelection}
            disabled={isLoading}
            className="text-slate-400 hover:text-slate-200 text-xs font-semibold flex items-center gap-1 transition-colors hover:underline"
            title="Unselect All"
          >
            <X className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Unselect All</span>
          </button>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2.5">
          <Button
            type="button"
            disabled={isLoading}
            onClick={onRejectSelected}
            className="bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white font-bold text-xs px-4 py-2 rounded-xl shadow-md shadow-rose-950/50 flex items-center gap-2 transition-all duration-200 hover:scale-105 active:scale-100"
          >
            <XCircle className="h-4 w-4" />
            <span>Reject Selected</span>
          </Button>

          <Button
            type="button"
            disabled={isLoading}
            onClick={onApproveSelected}
            className="bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold text-xs px-4 py-2 rounded-xl shadow-md shadow-emerald-950/50 flex items-center gap-2 transition-all duration-200 hover:scale-105 active:scale-100"
          >
            <CheckCircle2 className="h-4 w-4" />
            <span>Approve Selected</span>
          </Button>
        </div>
      </div>
    </div>
  );
}
