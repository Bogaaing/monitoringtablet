"use client";

import React from "react";
import { User, InspectionPeriod, Role } from "@/types";
import { Menu, LogOut, Calendar, User as UserIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

interface NavbarProps {
  user?: User | null;
  activePeriod?: InspectionPeriod | null;
  onMenuToggle?: () => void;
  onSignOut?: () => void;
}

export function Navbar({
  user,
  activePeriod,
  onMenuToggle,
  onSignOut,
}: NavbarProps) {
  const renderRoleBadge = (role?: Role) => {
    switch (role) {
      case "admin":
        return (
          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-extrabold bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-200 dark:border-rose-800 tracking-wider">
            ADMIN
          </span>
        );
      case "manager":
        return (
          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-extrabold bg-indigo-100 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 tracking-wider">
            MANAGER
          </span>
        );
      case "pic":
      default:
        return (
          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-extrabold bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-200 dark:border-slate-700 tracking-wider">
            PIC
          </span>
        );
    }
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 px-4 md:px-8 backdrop-blur-md">
      {/* Left: Mobile Toggle & Active Period */}
      <div className="flex items-center gap-4">
        <button
          onClick={onMenuToggle}
          className="p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg lg:hidden"
          aria-label="Toggle Navigation"
        >
          <Menu className="h-6 w-6" />
        </button>

        {/* Active Inspection Period Banner */}
        <div className="hidden sm:flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-200 dark:border-indigo-800/50 text-indigo-700 dark:text-indigo-300 text-xs font-semibold">
          <Calendar className="h-3.5 w-3.5" />
          <span>
            Periode Aktif:{" "}
            {activePeriod ? activePeriod.name : "Belum Ada Periode Aktif"}
          </span>
        </div>
      </div>

      {/* Right: Authenticated User Profile & Logout */}
      <div className="flex items-center gap-4">
        {/* User Profile Info Card */}
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 font-bold text-sm border border-indigo-200 dark:border-indigo-800 shrink-0 shadow-sm">
            {user?.name ? user.name.charAt(0).toUpperCase() : <UserIcon className="h-4 w-4" />}
          </div>

          <div className="hidden md:flex flex-col">
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-slate-800 dark:text-slate-200 leading-none">
                {user?.name || "Pengguna"}
              </span>
              {renderRoleBadge(user?.role)}
            </div>
            <span className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-mono">
              {user?.email || "user@monitoring.com"}
            </span>
          </div>
        </div>

        <div className="h-5 w-[1px] bg-slate-200 dark:bg-slate-800 hidden sm:block" />

        {/* Sign Out / Logout Button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={onSignOut}
          className="text-slate-600 hover:text-rose-600 dark:text-slate-400 dark:hover:text-rose-400 gap-1.5 font-semibold text-xs transition-colors"
          title="Keluar dari Sistem"
        >
          <LogOut className="h-4 w-4 text-rose-500" />
          <span className="hidden sm:inline">Keluar</span>
        </Button>
      </div>
    </header>
  );
}
