"use client";

import React from "react";
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

      {/* Sidebar Container (280px) */}
      <aside
        className={cn(
          "fixed top-0 bottom-0 left-0 z-50 flex w-[280px] flex-col bg-slate-900 text-slate-100 transition-transform duration-300 ease-in-out lg:static lg:translate-x-0 border-r border-slate-800",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Brand Header */}
        <div className="flex h-16 items-center justify-between px-6 border-b border-slate-800">
          <Link href="/dashboard" className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#4F46E5] text-white shadow-lg shadow-indigo-600/30">
              <TabletIcon className="h-5 w-5" />
            </div>
            <div>
              <span className="font-bold text-base tracking-tight text-white block">
                TabMonitor
              </span>
              <span className="text-[10px] uppercase font-semibold tracking-wider text-indigo-400">
                Monthly Inspection
              </span>
            </div>
          </Link>
          <button
            onClick={onClose}
            className="lg:hidden text-slate-400 hover:text-white p-1 rounded-lg"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* User Role Tag */}
        <div className="px-6 py-4 border-b border-slate-800/80 bg-slate-950/40">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-medium">Aktif Sebagai</span>
            <span className="text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
              {userRole}
            </span>
          </div>
        </div>

        {/* Menu Navigation */}
        <nav className="flex-1 overflow-y-auto px-4 py-6 space-y-1.5">
          {filteredMenu.map((item) => {
            const isActive =
              pathname === item.href || pathname.startsWith(`${item.href}/`);
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={cn(
                  "relative flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all duration-200 group",
                  isActive
                    ? "bg-[#4F46E5] text-white shadow-md shadow-indigo-600/30 font-semibold"
                    : "text-slate-400 hover:bg-slate-800/70 hover:text-slate-100 hover:translate-x-0.5"
                )}
              >
                {isActive && (
                  <span className="absolute left-0 top-2 bottom-2 w-1 bg-white rounded-r-full shadow-sm" />
                )}
                <Icon
                  className={cn(
                    "h-5 w-5 transition-transform duration-200 group-hover:scale-110",
                    isActive ? "text-white" : "text-slate-400 group-hover:text-slate-200"
                  )}
                />
                <span>{item.title}</span>
              </Link>
            );
          })}
        </nav>

        {/* Footer info */}
        <div className="p-4 border-t border-slate-800 text-center">
          <p className="text-xs text-slate-500">
            Tablet Monitoring System v1.0
          </p>
        </div>
      </aside>
    </>
  );
}
