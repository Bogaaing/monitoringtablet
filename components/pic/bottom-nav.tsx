"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, QrCode, History, User } from "lucide-react";

export function PicBottomNav() {
  const pathname = usePathname();

  const navItems = [
    {
      label: "Home",
      href: "/pic/dashboard",
      icon: Home,
    },
    {
      label: "Scan QR",
      href: "/pic/scan",
      icon: QrCode,
      isPrimary: true,
    },
    {
      label: "History",
      href: "/pic/inspections",
      icon: History,
    },
    {
      label: "Profile",
      href: "/pic/profile",
      icon: User,
    },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-slate-900/95 border-t border-slate-200 dark:border-slate-800 backdrop-blur-lg pb-safe">
      <div className="max-w-[430px] mx-auto flex items-center justify-around h-16 px-2">
        {navItems.map((item) => {
          const isActive = pathname === item.href || (item.href !== "/pic/dashboard" && pathname.startsWith(item.href));
          const Icon = item.icon;

          if (item.isPrimary) {
            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex flex-col items-center justify-center -mt-6 group"
              >
                <div className="w-14 h-14 rounded-full bg-[#473bf0] text-white flex items-center justify-center shadow-lg shadow-indigo-500/40 group-active:scale-95 transition-transform border-4 border-slate-50 dark:border-slate-950">
                  <Icon className="w-6 h-6" />
                </div>
                <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 mt-1">
                  {item.label}
                </span>
              </Link>
            );
          }

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center flex-1 h-full min-h-[48px] min-w-[48px] rounded-xl transition-colors ${
                isActive
                  ? "text-indigo-600 dark:text-indigo-400 font-bold"
                  : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100"
              }`}
            >
              <Icon className={`w-5 h-5 ${isActive ? "scale-110" : ""} transition-transform`} />
              <span className="text-[10px] mt-1 leading-none">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
