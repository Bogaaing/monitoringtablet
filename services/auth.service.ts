import { createClient } from "@/lib/supabase/client";
import { createAdminClient } from "@/lib/supabase/admin";
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
    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        // 1. Fetch profile from Supabase public.users table by auth_id
        const { data: profileByAuth } = await (supabase as any)
          .from("users")
          .select("*, location:locations(*)")
          .eq("auth_id", user.id)
          .single();

        if (profileByAuth) return profileByAuth as User;

        // 2. Fetch profile by email if auth_id is not linked yet
        if (user.email) {
          const { data: profileByEmail } = await (supabase as any)
            .from("users")
            .select("*, location:locations(*)")
            .ilike("email", user.email)
            .single();

          if (profileByEmail) return profileByEmail as User;
        }

        // 3. Metadata fallback from Supabase Auth
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
    } catch (e) {
      console.error("getCurrentProfile error:", e);
    }

    return null;
  },

  async signIn(email: string, password: string) {
    const cleanEmail = (email || "").trim().toLowerCase();
    const supabase = createClient();

    try {
      // 1. Authenticate with Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password,
      });

      if (authError || !authData?.user) {
        return {
          user: null,
          role: null,
          redirectUrl: null,
          error: authError?.message || "Email atau kata sandi tidak sesuai.",
        };
      }

      const authUser = authData.user;

      // 2. Retrieve user role from Supabase DB (public.users)
      let userRole: Role = (authUser.user_metadata?.role as Role) || "pic";

      try {
        const { data: profile } = await (supabase as any)
          .from("users")
          .select("role")
          .eq("auth_id", authUser.id)
          .single();

        if ((profile as any)?.role) {
          userRole = (profile as any).role as Role;
        } else if (cleanEmail) {
          const { data: emailProfile } = await (supabase as any)
            .from("users")
            .select("role")
            .ilike("email", cleanEmail)
            .single();

          if ((emailProfile as any)?.role) {
            userRole = (emailProfile as any).role as Role;
          }
        }
      } catch (e) {
        // Suppress profile lookup error
      }

      // Set cookie for middleware route protection
      if (typeof document !== "undefined") {
        document.cookie = `demo_role=${userRole}; path=/; max-age=86400; SameSite=Lax`;
      }

      return {
        user: authUser,
        role: userRole,
        redirectUrl: this.getRoleDashboard(userRole),
        error: null,
      };
    } catch (globalErr: any) {
      console.error("signIn error:", globalErr);
      return {
        user: null,
        role: null,
        redirectUrl: null,
        error: "Gagal terhubung ke layanan otentikasi Supabase.",
      };
    }
  },

  async sendPasswordResetEmail(email: string) {
    const supabase = createClient();
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${origin}/reset-password`,
      });

      if (!error) {
        return { success: true, message: "Instruksi reset kata sandi telah dikirim ke email Anda." };
      }
      return { success: false, message: error.message };
    } catch (e: any) {
      return { success: false, message: e.message || "Gagal mengosongkan kata sandi." };
    }
  },

  async updatePassword(newPassword: string) {
    const supabase = createClient();
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (!error) {
        return { success: true, message: "Kata sandi berhasil diperbarui." };
      }
      return { success: false, message: error.message };
    } catch (e: any) {
      return { success: false, message: e.message || "Gagal memperbarui kata sandi." };
    }
  },

  async signOut() {
    const supabase = createClient();
    if (typeof document !== "undefined") {
      document.cookie = "demo_role=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
    }
    try {
      await supabase.auth.signOut();
    } catch (e) {}
  },
};
