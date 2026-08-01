"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface DataTablePaginationProps {
  currentPage: number;
  totalPages: number;
  totalRecords: number;
  pageSize: number;
  onPageChange: (page: number) => void;
}

export function DataTablePagination({
  currentPage,
  totalPages,
  totalRecords,
  pageSize,
  onPageChange,
}: DataTablePaginationProps) {
  if (totalRecords === 0) return null;

  const startRecord = (currentPage - 1) * pageSize + 1;
  const endRecord = Math.min(currentPage * pageSize, totalRecords);

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 px-2">
      <p className="text-xs text-slate-500 dark:text-slate-400">
        Menampilkan <span className="font-semibold text-slate-900 dark:text-slate-100">{startRecord}</span> -{" "}
        <span className="font-semibold text-slate-900 dark:text-slate-100">{endRecord}</span> dari{" "}
        <span className="font-semibold text-slate-900 dark:text-slate-100">{totalRecords}</span> data
      </p>

      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage <= 1}
          className="gap-1 text-xs"
        >
          <ChevronLeft className="h-4 w-4" />
          <span>Sebelumnya</span>
        </Button>

        <div className="flex items-center gap-1 px-2">
          <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
            Halaman {currentPage} dari {totalPages || 1}
          </span>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage >= totalPages}
          className="gap-1 text-xs"
        >
          <span>Selanjutnya</span>
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
