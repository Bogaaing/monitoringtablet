"use client";

import React from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, RotateCcw } from "lucide-react";

export interface FilterOption {
  label: string;
  value: string;
}

export interface FilterGroup {
  key: string;
  placeholder: string;
  value: string;
  options: FilterOption[];
  onChange: (value: string) => void;
}

interface SearchFilterBarProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  placeholder?: string;
  filterGroups?: FilterGroup[];
  onResetFilters?: () => void;
}

export function SearchFilterBar({
  searchQuery,
  onSearchChange,
  placeholder = "Cari data...",
  filterGroups = [],
  onResetFilters,
}: SearchFilterBarProps) {
  const hasActiveFilters =
    searchQuery.trim() !== "" ||
    filterGroups.some((g) => g.value !== "" && g.value !== "all");

  return (
    <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm mb-6">
      {/* Search Input */}
      <div className="relative flex-1 min-w-[240px]">
        <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
        <Input
          type="text"
          placeholder={placeholder}
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-9 bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 focus-visible:ring-indigo-500"
        />
      </div>

      {/* Filter Select Dropdowns */}
      <div className="flex flex-wrap items-center gap-2.5">
        {filterGroups.map((group) => (
          <select
            key={group.key}
            value={group.value}
            onChange={(e) => group.onChange(e.target.value)}
            className="h-10 px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="all">{group.placeholder}</option>
            {group.options.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        ))}

        {hasActiveFilters && onResetFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onResetFilters}
            className="text-slate-500 hover:text-slate-900 dark:hover:text-white gap-1.5"
            title="Reset filter"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span className="text-xs font-medium">Reset</span>
          </Button>
        )}
      </div>
    </div>
  );
}
