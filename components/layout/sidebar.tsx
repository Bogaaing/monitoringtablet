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

interface NavSection {
  label: string;
  items: NavMenuItem[];
}

const navSections: NavSection[] = [
  {
    label: "OVERVIEW",
    items: [
      {
        title: "Dashboard",
        href: "/dashboard",
        icon: LayoutDashboard,
        roles: ["admin", "pic", "manager"],
      },
      {
        title: "Live Monitoring",
        href: "/monitoring",
        icon: Activity,
        roles: ["admin", "pic", "manager"],
      },
    ],
  },
  {
    label: "INSPECTION",
    items: [
      {
        title: "Approval Inspeksi",
        href: "/manager/approvals",
        icon: ShieldCheck,
        roles: ["manager", "admin"],
      },
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
    ],
  },
  {
    label: "MASTER DATA",
    items: [
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
    ],
  },
  {
    label: "REPORTING",
    items: [
      {
        title: "Laporan & Export",
        href: "/reports",
        icon: FileSpreadsheet,
        roles: ["admin", "manager"],
      },
    ],
  },
];

export function Sidebar({ userRole = "admin", isOpen = false, onClose }: SidebarProps) {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-sm lg:hidden transition-opacity"
          onClick={onClose}
        />
      )}

      {/* Sidebar Container: Pure White (#FFFFFF), 1px border (#EEF2F7), Soft Shadow */}
      <aside
        className={cn(
          "fixed top-0 bottom-0 left-0 z-50 flex flex-col bg-white text-[#111827] transition-all duration-300 ease-in-out lg:static lg:translate-x-0 border-r border-[#EEF2F7] shadow-[0_0_24px_rgba(15,23,42,0.03)]",
          isCollapsed ? "w-[76px]" : "w-[270px]",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Header / Logo Area */}
        <div
          className={cn(
            "flex items-center justify-between border-b border-[#EEF2F7] transition-all duration-300",
            isCollapsed ? "px-3 h-[84px] justify-center" : "px-5 h-[84px]"
          )}
        >
          <Link href="/dashboard" className="flex items-center gap-3 group overflow-hidden">
            {/* Logo Icon */}
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-tr from-[#4F46E5] to-[#6366F1] text-white shadow-sm shadow-indigo-500/25 shrink-0 transition-transform duration-200 group-hover:scale-105">
              <TabletIcon className="h-6 w-6 stroke-[2.2]" />
            </div>

            {!isCollapsed && (
              <div className="flex flex-col justify-center min-w-0">
                <span className="font-bold text-[18px] tracking-tight leading-none block">
                  <span className="text-[#111827]">Tab</span>
                  <span className="text-[#4F46E5]">Monitor</span>
                </span>
                <span className="text-[10px] uppercase font-bold tracking-[0.08em] text-[#94A3B8] block mt-1">
                  MONTHLY INSPECTION
                </span>
              </div>
            )}
          </Link>

          {!isCollapsed && (
            <button
              onClick={onClose}
              className="lg:hidden text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
              aria-label="Close Sidebar"
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </div>

        {/* Grouped Navigation Menu Area */}
        <nav className="flex-1 overflow-y-auto px-3.5 py-5 space-y-6">
          {navSections.map((section, sectionIndex) => {
            const visibleItems = section.items.filter((item) =>
              item.roles.includes(userRole)
            );

            if (visibleItems.length === 0) return null;

            return (
              <div key={section.label} className="space-y-1">
                {/* Section Header Label */}
                {!isCollapsed ? (
                  <div className="px-3 pb-1.5 text-[11px] font-bold uppercase tracking-[0.08em] text-[#94A3B8] select-none">
                    {section.label}
                  </div>
                ) : (
                  sectionIndex > 0 && <div className="my-2.5 mx-2 border-t border-[#EEF2F7]" />
                )}

                {/* Section Items */}
                <div className="space-y-1">
                  {visibleItems.map((item) => {
                    const isActive =
                      pathname === item.href ||
                      (item.href !== "/dashboard" && pathname.startsWith(`${item.href}/`));
                    const Icon = item.icon;

                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={onClose}
                        title={isCollapsed ? item.title : undefined}
                        className={cn(
                          "group relative flex items-center h-[46px] rounded-[10px] text-[14px] font-medium transition-all duration-150 ease-in-out cursor-pointer select-none",
                          isCollapsed ? "justify-center px-0" : "px-3.5 gap-3",
                          isActive
                            ? "bg-[#F0EEFF] text-[#4F46E5] font-semibold"
                            : "text-[#475569] hover:bg-[#F5F3FF] hover:text-[#4F46E5]"
                        )}
                      >
                        {/* Subtle Left Active Indicator */}
                        {isActive && (
                          <span className="absolute left-0 top-2 bottom-2 w-[3.5px] bg-[#4F46E5] rounded-r-full" />
                        )}

                        <Icon
                          className={cn(
                            "w-[20px] h-[20px] shrink-0 transition-colors duration-150",
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
                </div>
              </div>
            );
          })}
        </nav>

        {/* Bottom Area: Collapse Sidebar Toggle Button */}
        <div className="p-3.5 border-t border-[#EEF2F7]">
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className={cn(
              "w-full flex items-center h-[42px] rounded-[10px] bg-transparent hover:bg-[#F8FAFC] transition-all duration-150 cursor-pointer group text-[#64748B] hover:text-[#4F46E5]",
              isCollapsed ? "justify-center px-0" : "px-3 gap-3"
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
              <span className="text-[13px] font-medium transition-colors truncate">
                Sembunyikan Sidebar
              </span>
            )}
          </button>
        </div>
      </aside>
    </>
  );
}
