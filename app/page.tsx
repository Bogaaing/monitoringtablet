import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { authService } from "@/services/auth.service";
import { usersService } from "@/services/users.service";
import { createClient } from "@/lib/supabase/server";
import { Role } from "@/types";

export default async function RootPage() {
  const cookieStore = await cookies();
  const userNpk = cookieStore.get("user_npk")?.value;
  const rawEmail = cookieStore.get("user_email")?.value;
  const userEmail = rawEmail ? decodeURIComponent(rawEmail).trim().toLowerCase() : null;

  if (userNpk) {
    try {
      const res = await usersService.getUsers({ npk: userNpk, limit: 1 });
      if (res.data && res.data.length > 0) {
        redirect(authService.getRoleDashboard(res.data[0].role));
      }
    } catch (e) {}
  }

  if (userEmail) {
    try {
      const res = await usersService.getUsers({ search: userEmail, limit: 1 });
      const found = res.data.find((u) => u.email.toLowerCase() === userEmail);
      if (found) {
        redirect(authService.getRoleDashboard(found.role));
      }
    } catch (e) {}
  }

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
        redirect(authService.getRoleDashboard(found.role));
      }
      const role = (user.user_metadata?.role as Role) || "admin";
      redirect(authService.getRoleDashboard(role));
    }
  } catch (e) {}

  const demoRole = cookieStore.get("demo_role")?.value as Role | undefined;
  if (demoRole) {
    redirect(authService.getRoleDashboard(demoRole));
  }

  redirect("/login");
}
