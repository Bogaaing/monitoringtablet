"use client";

import React, { useState } from "react";
import { User, InspectionPeriod } from "@/types";
import { Sidebar } from "./sidebar";
import { Navbar } from "./navbar";
import { PicMobileHeader } from "@/components/pic/mobile-header";
import { PicBottomNav } from "@/components/pic/bottom-nav";
import { PwaInstallPrompt } from "@/components/pic/pwa-install-prompt";
import { authService } from "@/services/auth.service";
import { useRouter } from "next/navigation";

interface DashboardShellProps {
  user?: User | null;
  activePeriod?: InspectionPeriod | null;
  children: React.ReactNode;
}

export function DashboardShell({
  user,
  activePeriod,
  children,
}: DashboardShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const router = useRouter();

  const handleSignOut = async () => {
    await authService.signOut();
    router.push("/login");
  };

  // PIC Role: Render Mobile First Progressive Web App (PWA) Layout
  if (user?.role === "pic") {
    return (
      <div className="min-h-screen bg-slate-100 dark:bg-slate-950 font-sans text-slate-900 dark:text-slate-100 flex flex-col items-center">
        {/* Mobile PWA Container (Max Width 430px centered on larger screens) */}
        <div className="w-full max-w-[430px] min-h-screen bg-white dark:bg-slate-900 shadow-2xl border-x border-slate-200 dark:border-slate-800 flex flex-col relative pb-24">
          <PicMobileHeader user={user} activePeriod={activePeriod} />

          <main className="flex-1 p-4 w-full">
            {children}
          </main>

          <PicBottomNav />
        </div>

        {/* PWA Install — fires native dialog automatically when browser is ready */}
        <PwaInstallPrompt />
      </div>
    );
  }

  // Admin & Manager Roles: Render Desktop First Layout with Sidebar & Top Navbar
  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-950 font-sans text-slate-900 dark:text-slate-100">
      {/* Sidebar */}
      <Sidebar
        userRole={user?.role || "admin"}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col min-w-0">
        <Navbar
          user={user}
          activePeriod={activePeriod}
          onMenuToggle={() => setSidebarOpen(true)}
          onSignOut={handleSignOut}
        />

        <main className="flex-1 p-4 md:p-8 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
