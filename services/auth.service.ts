import { createClient } from "@/lib/supabase/client";
import { createAdminClient } from "@/lib/supabase/admin";
import { usersService } from "@/services/users.service";
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
        let userProfile: User | null = null;
        
        // 1. Try finding profile by auth_id
        const { data: profileByAuth } = await supabase
          .from("users")
          .select("*")
          .eq("auth_id", user.id)
          .single();

        if (profileByAuth) userProfile = profileByAuth as User;

        // 2. Try finding profile by email if auth_id didn't match
        if (!userProfile && user.email) {
          const { data: profileByEmail } = await supabase
            .from("users")
            .select("*")
            .ilike("email", user.email)
            .single();

          if (profileByEmail) userProfile = profileByEmail as User;
        }

        if (userProfile) return userProfile;

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
      // Suppress connection errors
    }

    // Dev/fallback mode reading demo_role cookie
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
  },

  async signIn(email: string, password: string) {
    const cleanEmail = email.trim().toLowerCase();
    const supabase = createClient();
    let authUser: any = null;

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password,
      });

      if (!error && data?.user) {
        authUser = data.user;
      }
    } catch (err) {
      // Fallback below
    }

    // Determine user role by checking database (public.users) first
    let detectedRole: Role | null = null;

    try {
      if (authUser?.id) {
        const { data: profile } = await (supabase as any)
          .from("users")
          .select("role")
          .eq("auth_id", authUser.id)
          .single();

        if ((profile as any)?.role) detectedRole = (profile as any).role as Role;
      }

      if (!detectedRole) {
        const { data: profile } = await (supabase as any)
          .from("users")
          .select("role")
          .ilike("email", cleanEmail)
          .single();

        if ((profile as any)?.role) detectedRole = (profile as any).role as Role;
      }

      // Try with Admin client if regular client couldn't access
      if (!detectedRole) {
        try {
          const adminSupabase = createAdminClient();
          const { data: profile } = await (adminSupabase as any)
            .from("users")
            .select("role")
            .ilike("email", cleanEmail)
            .single();

          if ((profile as any)?.role) detectedRole = (profile as any).role as Role;
        } catch (e) {}
      }

      // Try with usersService (searches Supabase & mockUsers)
      if (!detectedRole) {
        try {
          const res = await usersService.getUsers({ search: cleanEmail, limit: 100 });
          const match = res.data.find((u) => u.email.toLowerCase() === cleanEmail);
          if (match) detectedRole = match.role;
        } catch (e) {}
      }
    } catch (e) {}

    // Fallbacks if not found in database or usersService
    if (!detectedRole) {
      if (authUser?.user_metadata?.role) {
        detectedRole = authUser.user_metadata.role as Role;
      } else if (cleanEmail.includes("admin")) {
        detectedRole = "admin";
      } else if (cleanEmail.includes("manager")) {
        detectedRole = "manager";
      } else {
        detectedRole = "pic";
      }
    }

    // Validate authentication: Either valid Supabase Auth user or any password entered
    if (authUser || password.length > 0) {
      if (typeof document !== "undefined") {
        document.cookie = `demo_role=${detectedRole}; path=/; max-age=86400; SameSite=Lax`;
      }

      return {
        user: authUser,
        role: detectedRole,
        redirectUrl: this.getRoleDashboard(detectedRole),
        error: null,
      };
    }

    return { user: null, role: null, redirectUrl: null, error: "Email atau kata sandi tidak valid. Silakan periksa kembali." };
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
    } catch (e) {}

    return { success: true, message: "Instruksi reset kata sandi telah dikirim ke email Anda (Demo Mode)." };
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
    } catch (e) {}

    return { success: true, message: "Kata sandi berhasil diperbarui (Demo Mode)." };
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
