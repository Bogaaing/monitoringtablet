import React from "react";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { cookies } from "next/headers";
import { Role, User } from "@/types";
import { periodsService } from "@/services/periods.service";

const mockProfiles: Record<Role, User> = {
  admin: {
    id: "user-admin-1",
    name: "Super Admin",
    email: "admin@monitoring.com",
    role: "admin",
    phone: "081234567890",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  pic: {
    id: "user-pic-1",
    name: "Ahmad Rizky (Kepala Regu)",
    email: "pic@monitoring.com",
    role: "pic",
    phone: "081298765432",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  manager: {
    id: "user-manager-1",
    name: "Bambang Wijaya (Manager Ops)",
    email: "manager@monitoring.com",
    role: "manager",
    phone: "081122334455",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
};

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const demoRole = (cookieStore.get("demo_role")?.value as Role) || "admin";
  const currentUser = mockProfiles[demoRole] || mockProfiles.admin;

  // Dynamically fetch current active period from periodsService
  const activePeriod = await periodsService.getActivePeriod();

  return (
    <DashboardShell user={currentUser} activePeriod={activePeriod}>
      {children}
    </DashboardShell>
  );
}
