import React from "react";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { cookies } from "next/headers";
import { Role, User } from "@/types";
import { periodsService } from "@/services/periods.service";
import { usersService } from "@/services/users.service";
import { createClient } from "@/lib/supabase/server";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const demoRole = (cookieStore.get("demo_role")?.value as Role) || "admin";
  const userNpk = cookieStore.get("user_npk")?.value;
  const rawEmail = cookieStore.get("user_email")?.value;
  const userEmail = rawEmail ? decodeURIComponent(rawEmail).trim().toLowerCase() : null;

  let currentUser: User | null = null;

  // 1. Fetch profile by NPK if user_npk cookie exists
  if (userNpk) {
    try {
      const res = await usersService.getUsers({ npk: userNpk, limit: 1 });
      if (res.data && res.data.length > 0) {
        currentUser = res.data[0];
      }
    } catch (e) {}
  }

  // 2. Fetch profile from Supabase DB by logged in user email
  if (!currentUser && userEmail) {
    try {
      const res = await usersService.getUsers({ search: userEmail, limit: 1 });
      const found = res.data.find((u) => u.email.toLowerCase() === userEmail);
      if (found) {
        currentUser = found;
      }
    } catch (e) {}
  }

  // 3. Fetch profile from Supabase Auth Server Client
  if (!currentUser) {
    try {
      const supabase = await createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user?.email) {
        const emailLower = user.email.toLowerCase();
        const res = await usersService.getUsers({ search: emailLower, limit: 1 });
        const found = res.data.find((u) => u.email.toLowerCase() === emailLower);
        if (found) {
          currentUser = found;
        } else {
          currentUser = {
            id: user.id,
            npk: user.user_metadata?.npk || (demoRole === "admin" ? "11130595" : demoRole === "manager" ? "22240696" : "33350797"),
            name: user.user_metadata?.name || user.email.split("@")[0],
            email: user.email,
            role: (user.user_metadata?.role as Role) || demoRole,
            department: "Operations",
            status: "active",
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          };
        }
      }
    } catch (e) {}
  }

  // 4. Fallback dynamic user object matching NPK & Role
  if (!currentUser) {
    const fallbackNpk = userNpk || (demoRole === "admin" ? "11130595" : demoRole === "manager" ? "22240696" : "33350797");
    const formattedName = demoRole === "admin"
      ? "Super Admin"
      : demoRole === "manager"
      ? "Manager Operations"
      : "PIC (Kepala Regu)";

    currentUser = {
      id: `user-${demoRole}-session`,
      npk: fallbackNpk,
      name: formattedName,
      email: `${fallbackNpk}@tabmonitor.my.id`,
      role: demoRole,
      department: "Operations",
      status: "active",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
  }

  // Dynamically fetch current active period from periodsService
  const activePeriod = await periodsService.getActivePeriod();

  return (
    <DashboardShell user={currentUser} activePeriod={activePeriod}>
      {children}
    </DashboardShell>
  );
}
