"use client";

import React from "react";
import { User, InspectionPeriod, Role } from "@/types";
import { Menu, LogOut, Calendar, Bell, User as UserIcon, Shield, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

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
  const router = useRouter();

  const handleRoleSwitch = (newRole: Role) => {
    document.cookie = `demo_role=${newRole}; path=/; max-age=86400`;
    router.refresh();
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
        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-200 dark:border-indigo-800/50 text-indigo-700 dark:text-indigo-300 text-xs font-semibold">
          <Calendar className="h-3.5 w-3.5" />
          <span>
            Periode Aktif:{" "}
            {activePeriod ? activePeriod.name : "Belum Ada Periode Aktif"}
          </span>
        </div>
      </div>

      {/* Right: Role Quick Switcher & User Profile */}
      <div className="flex items-center gap-3">
        {/* Quick Role Switcher for Demo */}
        <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-lg border border-slate-200 dark:border-slate-700">
          <span className="text-[10px] font-bold text-slate-500 uppercase px-1.5 hidden lg:inline">
            Switch Role:
          </span>
          {(["admin", "pic", "manager"] as Role[]).map((role) => (
            <button
              key={role}
              onClick={() => handleRoleSwitch(role)}
              className={`px-2 py-0.5 text-xs font-semibold rounded uppercase transition-all ${
                user?.role === role
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 hover:bg-slate-200 dark:hover:bg-slate-700"
              }`}
            >
              {role}
            </button>
          ))}
        </div>

        <div className="h-6 w-[1px] bg-slate-200 dark:bg-slate-800 hidden sm:block" />

        {/* User Card */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 font-bold text-sm border border-indigo-200 dark:border-indigo-800">
              {user?.name ? user.name.charAt(0).toUpperCase() : <UserIcon className="h-4 w-4" />}
            </div>
            <div className="hidden md:flex flex-col">
              <span className="text-sm font-semibold text-slate-800 dark:text-slate-200 leading-none">
                {user?.name || "Pengguna"}
              </span>
              <span className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {user?.email || "user@monitoring.com"}
              </span>
            </div>
          </div>

          {/* Sign Out Button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={onSignOut}
            className="text-slate-500 hover:text-rose-600 dark:text-slate-400 dark:hover:text-rose-400 gap-1.5"
            title="Keluar"
          >
            <LogOut className="h-4 w-4" />
            <span className="hidden sm:inline">Keluar</span>
          </Button>
        </div>
      </div>
    </header>
  );
}
