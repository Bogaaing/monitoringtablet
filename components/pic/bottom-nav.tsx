"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, QrCode, History, User, ClipboardList } from "lucide-react";

export function PicBottomNav() {
  const pathname = usePathname();

  const navItems = [
    {
      label: "Beranda",
      href: "/pic/dashboard",
      icon: Home,
    },
    {
      label: "Tugas",
      href: "/pic/tasks",
      icon: ClipboardList,
    },
    {
      label: "Scan QR",
      href: "/pic/scan",
      icon: QrCode,
      isPrimary: true,
    },
    {
      label: "Riwayat",
      href: "/pic/inspections",
      icon: History,
    },
    {
      label: "Profil",
      href: "/pic/profile",
      icon: User,
    },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-slate-900/95 border-t border-slate-100 dark:border-slate-800 backdrop-blur-lg pb-safe">
      <div className="max-w-[430px] mx-auto flex items-center justify-around h-18 px-2">
        {navItems.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== "/pic/dashboard" && pathname.startsWith(item.href));
          const Icon = item.icon;

          if (item.isPrimary) {
            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex flex-col items-center justify-center -mt-7 group"
              >
                <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-[#3842E2] to-[#6366F1] text-white flex items-center justify-center shadow-lg shadow-indigo-500/35 group-active:scale-95 transition-transform border-4 border-white dark:border-slate-900">
                  <Icon className="w-6 h-6 stroke-[2.2]" />
                </div>
                <span className="text-[11px] font-bold text-[#4F46E5] dark:text-indigo-400 mt-1">
                  {item.label}
                </span>
              </Link>
            );
          }

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center flex-1 h-full min-h-[48px] min-w-[44px] rounded-xl transition-colors py-1 ${
                isActive
                  ? "text-[#4F46E5] dark:text-indigo-400 font-bold"
                  : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100"
              }`}
            >
              <Icon
                className={`w-5 h-5 ${isActive ? "stroke-[2.4]" : "stroke-[1.8]"} transition-transform`}
              />
              <span className="text-[11px] mt-1 font-medium leading-none">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
