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
          className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-sm lg:hidden transition-opacity"
          onClick={onClose}
        />
      )}

      {/* Sidebar Container: Pure White (#FFFFFF), 1px border (#EEF2F7), Soft Shadow (0 0 24px rgba(15,23,42,0.04)) */}
      <aside
        className={cn(
          "fixed top-0 bottom-0 left-0 z-50 flex flex-col bg-white text-[#111827] transition-all duration-300 ease-in-out lg:static lg:translate-x-0 border-r border-[#EEF2F7] shadow-[0_0_24px_rgba(15,23,42,0.04)]",
          isCollapsed ? "w-[80px]" : "w-[280px]",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Logo Area (32px padding spacing, 56px icon) */}
        <div
          className={cn(
            "flex items-center justify-between border-b border-[#EEF2F7] transition-all duration-300",
            isCollapsed ? "p-4 h-[96px] justify-center" : "px-6 py-8 h-[96px]"
          )}
        >
          <Link href="/dashboard" className="flex items-center gap-3.5 group overflow-hidden">
            {/* 56px Logo Icon */}
            <div className="flex h-[56px] w-[56px] items-center justify-center rounded-[18px] bg-gradient-to-tr from-[#4F46E5] to-[#6D5DFE] text-white shadow-md shadow-indigo-600/20 shrink-0 transition-transform duration-200 group-hover:scale-105">
              <TabletIcon className="h-7 w-7 stroke-[2]" />
            </div>

            {!isCollapsed && (
              <div className="flex flex-col justify-center">
                <span className="font-bold text-[20px] tracking-tight leading-tight block">
                  <span className="text-[#111827]">Tab</span>
                  <span className="text-[#4F46E5]">Monitor</span>
                </span>
                <span className="text-[12px] uppercase font-bold tracking-[1px] text-[#94A3B8] block mt-0.5">
                  MONTHLY INSPECTION
                </span>
              </div>
            )}
          </Link>

          {!isCollapsed && (
            <button
              onClick={onClose}
              className="lg:hidden text-slate-400 hover:text-slate-700 p-1.5 rounded-xl hover:bg-slate-100 transition-colors"
              aria-label="Close Sidebar"
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </div>

        {/* Navigation Menu Area (28px top padding, 10px item gap) */}
        <nav className="flex-1 overflow-y-auto px-4 py-7 space-y-[10px]">
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
                    ? "bg-[#EEF2FF] text-[#4F46E5] font-semibold"
                    : "text-[#475569] hover:bg-[#F8FAFC] hover:text-[#4F46E5]"
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
                      : "text-[#64748B] group-hover:text-[#4F46E5]"
                  )}
                />

                {!isCollapsed && (
                  <span className="truncate">{item.title}</span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Bottom Area (24px padding): Ghost Collapse Sidebar Button */}
        <div className="p-6 border-t border-[#EEF2F7]">
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className={cn(
              "w-full flex items-center gap-3 rounded-[14px] p-3 bg-transparent hover:bg-[#F8FAFC] transition-all duration-200 cursor-pointer group",
              isCollapsed ? "justify-center" : "justify-start"
            )}
            title={isCollapsed ? "Buka Sidebar" : "Sembunyikan Sidebar"}
          >
            <div className="flex items-center justify-center shrink-0">
              {isCollapsed ? (
                <ChevronRight className="w-5 h-5 text-[#64748B] group-hover:text-[#4F46E5] transition-colors" />
              ) : (
                <ChevronLeft className="w-5 h-5 text-[#64748B] group-hover:text-[#4F46E5] transition-colors" />
              )}
            </div>

            {!isCollapsed && (
              <span className="text-[13px] font-medium text-[#64748B] group-hover:text-[#4F46E5] transition-colors">
                Sembunyikan Sidebar
              </span>
            )}
          </button>
        </div>
      </aside>
    </>
  );
}
