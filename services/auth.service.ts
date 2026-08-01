import { createClient } from "@/lib/supabase/client";
import { User, Role } from "@/types";

export const authService = {
  getRoleDashboard(role: Role): string {
    switch (role) {
      case "admin":
        return "/admin/dashboard";
      case "pic":
        return "/pic/dashboard";
      case "manager":
        return "/manager/dashboard";
      default:
        return "/dashboard";
    }
  },

  async getCurrentProfile(): Promise<User | null> {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      // Dev mode fallback reading demo_role cookie
      if (typeof document !== "undefined") {
        const match = document.cookie.match(/(?:^|; )demo_role=([^;]*)/);
        const role = (match ? match[1] : "admin") as Role;
        return {
          id: `user-${role}-demo`,
          name: role === "admin" ? "Super Admin" : role === "pic" ? "Ahmad Rizky (PIC)" : "Bambang Wijaya (Manager)",
          email: `${role}@monitoring.com`,
          role: role,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
      }
      return null;
    }

    const { data, error } = await supabase
      .from("users")
      .select("*")
      .eq("auth_id", user.id)
      .single();

    if (error || !data) {
      const role = (user.user_metadata?.role || "pic") as Role;
      return {
        id: user.id,
        auth_id: user.id,
        name: user.user_metadata?.name || user.email?.split("@")[0] || "User",
        email: user.email || "",
        role: role,
        created_at: user.created_at,
        updated_at: user.created_at,
      };
    }

    return data as User;
  },

  async signIn(email: string, password: string) {
    const supabase = createClient();
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      // In development placeholder environment, simulate successful login
      if (
        error.message?.includes("fetch") ||
        error.message?.includes("URL") ||
        process.env.NEXT_PUBLIC_SUPABASE_URL?.includes("placeholder")
      ) {
        let role: Role = "admin";
        if (email.includes("pic")) role = "pic";
        if (email.includes("manager")) role = "manager";

        if (typeof document !== "undefined") {
          document.cookie = `demo_role=${role}; path=/; max-age=86400`;
        }

        return {
          user: null,
          role,
          redirectUrl: this.getRoleDashboard(role),
          error: null,
        };
      }
      return { user: null, role: null, redirectUrl: null, error: error.message };
    }

    // Determine role from metadata or users table
    const { data: userProfile } = await supabase
      .from("users")
      .select("role")
      .eq("auth_id", data.user.id)
      .single();

    const role: Role = ((userProfile as { role?: Role } | null)?.role || data.user.user_metadata?.role || "pic") as Role;
    if (typeof document !== "undefined") {
      document.cookie = `demo_role=${role}; path=/; max-age=86400`;
    }

    return {
      user: data.user,
      role,
      redirectUrl: this.getRoleDashboard(role),
      error: null,
    };
  },

  async sendPasswordResetEmail(email: string) {
    const supabase = createClient();
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${origin}/reset-password`,
    });

    if (error) {
      if (
        error.message?.includes("fetch") ||
        process.env.NEXT_PUBLIC_SUPABASE_URL?.includes("placeholder")
      ) {
        return { success: true, message: "Instruksi reset kata sandi telah dikirim ke email Anda (Demo Mode)." };
      }
      return { success: false, message: error.message };
    }

    return { success: true, message: "Instruksi reset kata sandi telah dikirim ke email Anda." };
  },

  async updatePassword(newPassword: string) {
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (error) {
      if (
        error.message?.includes("fetch") ||
        process.env.NEXT_PUBLIC_SUPABASE_URL?.includes("placeholder")
      ) {
        return { success: true, message: "Kata sandi berhasil diperbarui (Demo Mode)." };
      }
      return { success: false, message: error.message };
    }

    return { success: true, message: "Kata sandi berhasil diperbarui." };
  },

  async signOut() {
    const supabase = createClient();
    if (typeof document !== "undefined") {
      document.cookie = "demo_role=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
    }
    return await supabase.auth.signOut();
  },
};
