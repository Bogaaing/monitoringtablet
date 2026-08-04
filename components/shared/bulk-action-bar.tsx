"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { CheckCircle2, XCircle, X, CheckSquare } from "lucide-react";

export interface SelectedItemSummary {
  id: string;
  tabletCode: string;
  picName: string;
}

interface BulkActionBarProps {
  selectedCount: number;
  selectedSummaries?: SelectedItemSummary[];
  onApproveSelected: () => void;
  onRejectSelected: () => void;
  onClearSelection: () => void;
  isLoading?: boolean;
}

export function BulkActionBar({
  selectedCount,
  selectedSummaries = [],
  onApproveSelected,
  onRejectSelected,
  onClearSelection,
  isLoading = false,
}: BulkActionBarProps) {
  if (selectedCount === 0) return null;

  // Compact summary preview text
  const renderSummaryPreview = () => {
    if (selectedCount <= 3 && selectedSummaries.length > 0) {
      return (
        <span className="text-xs text-slate-300 font-mono font-medium truncate max-w-[260px] sm:max-w-[360px] block">
          {selectedSummaries
            .slice(0, 3)
            .map((s) => `${s.tabletCode || "TAB"} • ${s.picName || "PIC"}`)
            .join("  |  ")}
        </span>
      );
    }
    return null;
  };

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 w-[92%] max-w-4xl transition-all duration-250 ease-out animate-in slide-in-from-bottom-8 fade-in duration-250">
      <div
        style={{ backgroundColor: "rgba(18, 20, 36, 0.92)" }}
        className="backdrop-blur-[20px] text-white border border-slate-800/80 shadow-[0_12px_40px_rgba(0,0,0,0.25)] rounded-[24px] px-6 py-2.5 flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-6 min-h-[64px]"
      >
        {/* Selection Info & Summary */}
        <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-start">
          <div className="flex flex-col justify-center min-w-0">
            <div className="flex items-center gap-2 text-base font-medium text-white tracking-normal">
              <CheckSquare className="h-5 w-5 text-indigo-400 shrink-0" />
              <span>
                {selectedCount} {selectedCount === 1 ? "Inspection" : "Inspection"} Dipilih
              </span>
            </div>

            {/* Summary Preview (≤ 3 items) */}
            {renderSummaryPreview()}
          </div>
        </div>

        {/* Action Buttons & Close (X) */}
        <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
          {/* Secondary Action: Reject Selected (Outlined Red Button) */}
          <Button
            type="button"
            disabled={isLoading}
            onClick={onRejectSelected}
            className="bg-transparent border border-rose-500/80 hover:bg-rose-500/15 active:bg-rose-500/25 text-rose-400 font-semibold text-sm min-h-[48px] px-4 rounded-xl flex items-center justify-center gap-2 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] shrink-0"
          >
            <XCircle className="h-5 w-5 text-rose-400" />
            <span>Reject ({selectedCount})</span>
          </Button>

          {/* Primary Action: Approve Selected (Solid Green Button) */}
          <Button
            type="button"
            disabled={isLoading}
            onClick={onApproveSelected}
            className="bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white font-bold text-sm min-h-[48px] px-5 rounded-xl shadow-lg shadow-emerald-950/40 flex items-center justify-center gap-2 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] shrink-0"
          >
            <CheckCircle2 className="h-5 w-5 text-white" />
            <span>Approve ({selectedCount})</span>
          </Button>

          {/* Close (X) Button */}
          <button
            type="button"
            onClick={onClearSelection}
            disabled={isLoading}
            className="min-h-[44px] min-w-[44px] h-11 w-11 flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 active:bg-white/20 rounded-full transition-colors shrink-0 ml-1"
            title="Tutup & Hapus Pilihan"
            aria-label="Tutup dan hapus pilihan"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
