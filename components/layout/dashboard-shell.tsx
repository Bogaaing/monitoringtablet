"use client";

import React, { useState } from "react";
import { User, InspectionPeriod } from "@/types";
import { Sidebar } from "./sidebar";
import { Navbar } from "./navbar";
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
