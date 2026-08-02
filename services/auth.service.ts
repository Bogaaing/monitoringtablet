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
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        // 1. Fetch profile from Supabase public.users table by auth_id
        let { data: profileByAuth } = await (supabase as any)
          .from("users")
          .select("*, location:locations(*)")
          .eq("auth_id", user.id)
          .single();

        if (profileByAuth) {
          if (!profileByAuth.location && profileByAuth.location_id) {
            try {
              const { data: loc } = await (supabase as any)
                .from("locations")
                .select("*")
                .eq("id", profileByAuth.location_id)
                .single();
              if (loc) profileByAuth.location = loc;
            } catch (e) {}
          }
          return profileByAuth as User;
        }

        // 2. Fetch profile by email if auth_id is not linked yet
        if (user.email) {
          let { data: profileByEmail } = await (supabase as any)
            .from("users")
            .select("*, location:locations(*)")
            .ilike("email", user.email)
            .single();

          if (profileByEmail) {
            if (!profileByEmail.location && profileByEmail.location_id) {
              try {
                const { data: loc } = await (supabase as any)
                  .from("locations")
                  .select("*")
                  .eq("id", profileByEmail.location_id)
                  .single();
                if (loc) profileByEmail.location = loc;
              } catch (e) {}
            }
            return profileByEmail as User;
          }
        }
      }
    } catch (e) {
      console.error("getCurrentProfile auth error:", e);
    }

    // Check user_email cookie and fetch real profile from Supabase DB!
    if (typeof document !== "undefined") {
      const emailMatch = document.cookie.match(/(?:^|; )user_email=([^;]*)/);
      const userEmail = emailMatch ? decodeURIComponent(emailMatch[1]) : null;

      if (userEmail) {
        try {
          let { data: profileByCookie } = await (supabase as any)
            .from("users")
            .select("*, location:locations(*)")
            .ilike("email", userEmail)
            .single();

          if (profileByCookie) {
            if (!profileByCookie.location && profileByCookie.location_id) {
              try {
                const { data: loc } = await (supabase as any)
                  .from("locations")
                  .select("*")
                  .eq("id", profileByCookie.location_id)
                  .single();
                if (loc) profileByCookie.location = loc;
              } catch (e) {}
            }
            return profileByCookie as User;
          }
        } catch (e) {}
      }

      // Dev/Fallback profile
      const roleMatch = document.cookie.match(/(?:^|; )demo_role=([^;]*)/);
      const role = (roleMatch ? roleMatch[1] : "admin") as Role;
      const fallbackEmail = userEmail || `${role}@monitoring.com`;
      const displayName = fallbackEmail
        .split("@")[0]
        .replace(/[._-]/g, " ")
        .replace(/\b\w/g, (c) => c.toUpperCase());

      return {
        id: `user-${role}-session`,
        name: displayName,
        email: fallbackEmail,
        role: role,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
    }

    return null;
  },

  async signIn(email: string, password: string) {
    const cleanEmail = (email || "").trim().toLowerCase();
    const supabase = createClient();
    let authUser: any = null;
    let authErrMessage: string | null = null;

    // 1. Authenticate with Supabase Auth
    try {
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password,
      });

      if (!authError && authData?.user) {
        authUser = authData.user;
      } else if (authError) {
        authErrMessage =
          typeof authError.message === "string" && authError.message !== "{}"
            ? authError.message
            : null;
      }
    } catch (err: any) {
      authErrMessage = typeof err?.message === "string" ? err.message : null;
    }

    // 2. Determine user role from Supabase DB (public.users) or email heuristic
    let userRole: Role | null = null;

    try {
      if (authUser?.id) {
        const { data: profile } = await (supabase as any)
          .from("users")
          .select("role")
          .eq("auth_id", authUser.id)
          .single();

        if ((profile as any)?.role) userRole = (profile as any).role as Role;
      }

      if (!userRole && cleanEmail) {
        const { data: emailProfile } = await (supabase as any)
          .from("users")
          .select("role")
          .ilike("email", cleanEmail)
          .single();

        if ((emailProfile as any)?.role) userRole = (emailProfile as any).role as Role;
      }
    } catch (e) {}

    // Fallback role resolution
    if (!userRole) {
      if (cleanEmail.includes("admin")) userRole = "admin";
      else if (cleanEmail.includes("manager")) userRole = "manager";
      else userRole = "pic";
    }

    // Set user_email cookie for session persistence across pages
    if (typeof document !== "undefined") {
      document.cookie = `user_email=${encodeURIComponent(cleanEmail)}; path=/; max-age=86400; SameSite=Lax`;
    }

    const redirectUrl = this.getRoleDashboard(userRole);

    return {
      user: authUser || { id: `demo-${userRole}`, email: cleanEmail, role: userRole },
      redirectUrl,
      error: authErrMessage,
    };
  },

  async signOut() {
    try {
      const supabase = createClient();
      await supabase.auth.signOut();
    } catch (e) {}

    if (typeof document !== "undefined") {
      document.cookie = "user_email=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
      document.cookie = "demo_role=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
    }
  },

  async sendPasswordResetEmail(email: string) {
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${typeof window !== "undefined" ? window.location.origin : ""}/reset-password`,
      });

      if (error) {
        return { success: false, message: error.message || "Gagal mengirimkan instruksi reset kata sandi." };
      }
      return { success: true, message: "Instruksi reset kata sandi telah dikirim ke email Anda." };
    } catch (e: any) {
      return { success: false, message: e.message || "Gagal mengirimkan instruksi reset kata sandi." };
    }
  },

  async updatePassword(newPassword: string) {
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) {
        return { success: false, message: error.message || "Gagal memperbarui kata sandi di Supabase." };
      }
      return { success: true, message: "Kata sandi Anda telah berhasil diperbarui." };
    } catch (e: any) {
      return { success: false, message: e.message || "Gagal memperbarui kata sandi di Supabase." };
    }
  },
};
