import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { authService } from "@/services/auth.service";
import { Role } from "@/types";

export default function RootPage() {
  const cookieStore = cookies();
  const demoRole = cookieStore.get("demo_role")?.value as Role | undefined;

  if (demoRole) {
    redirect(authService.getRoleDashboard(demoRole));
  }

  redirect("/login");
}
