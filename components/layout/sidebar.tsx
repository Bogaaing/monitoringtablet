"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Role } from "@/types";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  QrCode,
  ClipboardCheck,
  ShieldCheck,
  Tablet,
  MapPin,
  Calendar,
  Users,
  Activity,
  FileSpreadsheet,
  X,
  TabletIcon,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

interface SidebarProps {
  userRole?: Role;
  isOpen?: boolean;
  onClose?: () => void;
}

interface NavMenuItem {
  title: string;
  href: string;
  icon: React.ElementType;
  roles: Role[];
}

const menuItems: NavMenuItem[] = [
  {
    title: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
    roles: ["admin", "pic", "manager"],
  },
  // PIC Items
  {
    title: "Scan QR Tablet",
    href: "/pic/scan",
    icon: QrCode,
    roles: ["pic", "admin"],
  },
  {
    title: "Riwayat Inspeksi",
    href: "/pic/inspections",
    icon: ClipboardCheck,
    roles: ["pic"],
  },
  // Manager Items
  {
    title: "Approval Inspeksi",
    href: "/manager/approvals",
    icon: ShieldCheck,
    roles: ["manager", "admin"],
  },
  // Admin Management Items
  {
    title: "Kelola Tablet",
    href: "/admin/tablets",
    icon: Tablet,
    roles: ["admin"],
  },
  {
    title: "Kelola Lokasi",
    href: "/admin/locations",
    icon: MapPin,
    roles: ["admin"],
  },
  {
    title: "Kelola Periode",
    href: "/admin/periods",
    icon: Calendar,
    roles: ["admin"],
  },
  {
    title: "Kelola User",
    href: "/admin/users",
    icon: Users,
    roles: ["admin"],
  },
  // Shared System Reports & Live Monitoring
  {
    title: "Live Monitoring",
    href: "/monitoring",
    icon: Activity,
    roles: ["admin", "pic", "manager"],
  },
  {
    title: "Laporan & Export",
    href: "/reports",
    icon: FileSpreadsheet,
    roles: ["admin", "manager"],
  },
];

export function Sidebar({ userRole = "admin", isOpen = false, onClose }: SidebarProps) {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);

  const filteredMenu = menuItems.filter((item) => item.roles.includes(userRole));

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/60 backdrop-blur-sm lg:hidden transition-opacity"
          onClick={onClose}
        />
      )}

      {/* Sidebar Container: Soft Dark Navy (#1F2544), Width 280px (or 80px collapsed), 1px right border (rgba(255,255,255,0.08)), soft shadow */}
      <aside
        className={cn(
          "fixed top-0 bottom-0 left-0 z-50 flex flex-col bg-[#1F2544] text-white transition-all duration-300 ease-in-out lg:static lg:translate-x-0 border-r border-white/[0.08] shadow-[0_0_30px_rgba(15,23,42,0.08)]",
          isCollapsed ? "w-[80px]" : "w-[280px]",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Brand Header Logo Area */}
        <div className={cn("flex items-center justify-between border-b border-white/[0.08] transition-all duration-300", isCollapsed ? "p-4 h-[88px] justify-center" : "px-6 py-6 h-[88px]")}>
          <Link href="/dashboard" className="flex items-center gap-3.5 group overflow-hidden">
            {/* 56px Logo Icon Container */}
            <div className="flex h-[56px] w-[56px] items-center justify-center rounded-[18px] bg-gradient-to-tr from-[#4F46E5] to-[#6D5DFE] text-white shadow-lg shadow-indigo-600/25 shrink-0 transition-transform duration-200 group-hover:scale-105">
              <TabletIcon className="h-7 w-7 stroke-[2]" />
            </div>

            {!isCollapsed && (
              <div className="flex flex-col justify-center">
                <span className="font-bold text-[20px] tracking-tight text-white leading-tight block">
                  TabMonitor
                </span>
                <span className="text-[12px] uppercase font-bold tracking-[1.5px] text-white/65 block mt-0.5">
                  MONTHLY INSPECTION
                </span>
              </div>
            )}
          </Link>

          {!isCollapsed && (
            <button
              onClick={onClose}
              className="lg:hidden text-white/60 hover:text-white p-1.5 rounded-xl hover:bg-white/[0.06] transition-colors"
              aria-label="Close Sidebar"
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </div>

        {/* Minimal Role Section Card */}
        {!isCollapsed && (
          <div className="px-5 py-4 border-b border-white/[0.08]">
            <div className="flex items-center justify-between bg-white/[0.04] border border-white/[0.08] rounded-[14px] p-4 transition-all hover:bg-white/[0.06]">
              <span className="text-xs font-medium text-white/60">Role Pengguna</span>
              <span className="inline-flex items-center px-3 py-1 rounded-full text-[11px] font-extrabold uppercase tracking-wider bg-[#4F46E5]/20 text-[#A5B4FC] border border-[#4F46E5]/40 shadow-sm">
                {userRole}
              </span>
            </div>
          </div>
        )}

        {/* Menu Navigation */}
        <nav className="flex-1 overflow-y-auto px-4 py-6 space-y-2.5">
          {filteredMenu.map((item) => {
            const isActive =
              pathname === item.href || pathname.startsWith(`${item.href}/`);
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                title={isCollapsed ? item.title : undefined}
                className={cn(
                  "relative flex items-center gap-3.5 rounded-[14px] px-4 py-3 h-[52px] text-[15px] font-medium transition-all duration-200 group cursor-pointer select-none",
                  isActive
                    ? "bg-[#EEF2FF] text-[#4F46E5] font-semibold shadow-sm"
                    : "text-[#E5E7EB] hover:bg-white/[0.06] hover:text-white"
                )}
              >
                {/* 4px Primary Purple Active Left Indicator */}
                {isActive && (
                  <span className="absolute left-0 top-2.5 bottom-2.5 w-[4px] bg-[#4F46E5] rounded-full shadow-sm" />
                )}

                <Icon
                  className={cn(
                    "w-[22px] h-[22px] shrink-0 transition-colors duration-200",
                    isActive
                      ? "text-[#4F46E5]"
                      : "text-[#A5B4FC] group-hover:text-white"
                  )}
                />

                {!isCollapsed && (
                  <span className="truncate">{item.title}</span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Bottom Section: Sembunyikan Sidebar / Collapse Toggle */}
        <div className="p-4 border-t border-white/[0.08]">
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className={cn(
              "w-full flex items-center gap-3 rounded-[14px] p-2.5 transition-all duration-200 hover:bg-white/[0.06] cursor-pointer group",
              isCollapsed ? "justify-center" : "justify-start"
            )}
            title={isCollapsed ? "Buka Sidebar" : "Sembunyikan Sidebar"}
          >
            {/* Circular button container with rgba(255,255,255,0.06) background */}
            <div className="w-9 h-9 rounded-full bg-white/[0.06] group-hover:bg-white/[0.12] flex items-center justify-center text-white/80 group-hover:text-white shrink-0 transition-colors shadow-sm">
              {isCollapsed ? (
                <ChevronRight className="w-5 h-5" />
              ) : (
                <ChevronLeft className="w-5 h-5" />
              )}
            </div>

            {!isCollapsed && (
              <span className="text-xs text-white/60 font-medium group-hover:text-white/90 transition-colors">
                Sembunyikan Sidebar
              </span>
            )}
          </button>
        </div>
      </aside>
    </>
  );
}
