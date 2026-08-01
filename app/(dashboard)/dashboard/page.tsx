import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { Role } from "@/types";
import { authService } from "@/services/auth.service";

export default function DashboardPage() {
  const cookieStore = cookies();
  const demoRole = (cookieStore.get("demo_role")?.value as Role) || "admin";

  // Redirect to assigned role dashboard
  const destination = authService.getRoleDashboard(demoRole);
  redirect(destination);
}
