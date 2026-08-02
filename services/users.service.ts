import { createClient } from "@/lib/supabase/client";
import { createAdminClient } from "@/lib/supabase/admin";
import { User, PaginationParams, PaginatedResult, Role } from "@/types";

export const usersService = {
  async getUsers(params?: PaginationParams): Promise<PaginatedResult<User>> {
    const page = params?.page || 1;
    const limit = params?.limit || 10;
    const search = params?.search?.toLowerCase() || "";
    const role = params?.role;
    const locationId = params?.locationId;

    const from = (page - 1) * limit;
    const to = from + limit - 1;

    try {
      const supabase = createClient() as any;
      let query = supabase
        .from("users")
        .select("*, location:locations(*)", { count: "exact" })
        .is("deleted_at", null);

      if (search) {
        query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%`);
      }
      if (role && role !== "all") {
        query = query.eq("role", role);
      }
      if (locationId && locationId !== "all") {
        query = query.eq("location_id", locationId);
      }

      query = query.range(from, to).order("created_at", { ascending: false });

      let { data, count, error } = await query;

      // Retry with Admin Client if regular client encountered RLS restriction
      if (error && typeof window === "undefined" && process.env.SUPABASE_SERVICE_ROLE_KEY) {
        try {
          const adminSupabase = createAdminClient() as any;
          let adminQuery = adminSupabase
            .from("users")
            .select("*, location:locations(*)", { count: "exact" })
            .is("deleted_at", null);

          if (search) {
            adminQuery = adminQuery.or(`name.ilike.%${search}%,email.ilike.%${search}%`);
          }
          if (role && role !== "all") {
            adminQuery = adminQuery.eq("role", role);
          }
          if (locationId && locationId !== "all") {
            adminQuery = adminQuery.eq("location_id", locationId);
          }

          adminQuery = adminQuery.range(from, to).order("created_at", { ascending: false });
          const res = await adminQuery;
          if (!res.error && res.data) {
            data = res.data;
            count = res.count;
            error = null;
          }
        } catch (adminErr) {}
      }

      if (!error && data) {
        return {
          data: data as unknown as User[],
          total: count || data.length,
          page,
          totalPages: Math.ceil((count || data.length) / limit),
        };
      }
    } catch (e) {
      console.error("getUsers error:", e);
    }

    return {
      data: [],
      total: 0,
      page,
      totalPages: 1,
    };
  },

  async createUser(payload: {
    name: string;
    email: string;
    role: Role;
    location_id?: string | null;
    phone?: string;
  }): Promise<User> {
    const cleanEmail = payload.email.trim().toLowerCase();
    const cleanLocationId = payload.location_id && payload.location_id.trim() !== "" ? payload.location_id.trim() : null;
    let authId: string | null = null;

    // 1. Attempt to create Auth User in Supabase Auth (auth.users) via Admin Client
    if (typeof window === "undefined" && process.env.SUPABASE_SERVICE_ROLE_KEY) {
      try {
        const adminSupabase = createAdminClient();
        const defaultPassword = payload.role === "admin" ? "admin123" : payload.role === "pic" ? "pic123" : "manager123";

        const { data: authData, error: authError } = await adminSupabase.auth.admin.createUser({
          email: cleanEmail,
          password: defaultPassword,
          email_confirm: true,
          user_metadata: {
            name: payload.name,
            role: payload.role,
          },
        });

        if (!authError && authData.user) {
          authId = authData.user.id;
        }
      } catch (authErr) {
        console.warn("Supabase Auth admin creation skipped:", authErr);
      }
    }

    // 2. Insert into Supabase public.users
    const insertPayload = {
      name: payload.name.trim(),
      email: cleanEmail,
      role: payload.role,
      location_id: cleanLocationId,
      phone: payload.phone ? payload.phone.trim() : null,
      ...(authId ? { auth_id: authId } : {}),
    };

    try {
      const supabase = createClient() as any;
      const { data, error } = await supabase
        .from("users")
        .insert([insertPayload])
        .select("*, location:locations(*)")
        .single();

      if (!error && data) {
        return data as unknown as User;
      }

      if (error) {
        console.error("createUser Supabase error:", error);
        if (error.code === "23505" || error.message?.includes("unique") || error.message?.includes("duplicate")) {
          throw new Error(`Email '${cleanEmail}' sudah terdaftar di sistem. Silakan gunakan alamat email lain.`);
        }
        throw new Error(error.message || "Gagal menambahkan pengguna ke database Supabase.");
      }
    } catch (e: any) {
      if (e.message && (e.message.includes("terdaftar") || e.message.includes("Gagal"))) {
        throw e;
      }
      console.error("createUser exception:", e);
      throw new Error(e.message || "Terjadi kesalahan jaringan saat menghubungi server Supabase.");
    }

    throw new Error("Gagal menambahkan pengguna ke database Supabase.");
  },

  async updateUser(
    id: string,
    payload: {
      name?: string;
      email?: string;
      role?: Role;
      location_id?: string | null;
      phone?: string;
    }
  ): Promise<User> {
    const updateData: any = {
      ...payload,
      updated_at: new Date().toISOString(),
    };

    if (payload.email) updateData.email = payload.email.trim().toLowerCase();
    if (payload.name) updateData.name = payload.name.trim();
    if (payload.location_id !== undefined) {
      updateData.location_id = payload.location_id && payload.location_id.trim() !== "" ? payload.location_id.trim() : null;
    }

    try {
      const supabase = createClient() as any;
      const { data, error } = await supabase
        .from("users")
        .update(updateData)
        .eq("id", id)
        .select("*, location:locations(*)")
        .single();

      if (!error && data) return data as unknown as User;

      if (error) {
        if (error.code === "23505" || error.message?.includes("unique")) {
          throw new Error(`Email '${updateData.email}' sudah terdaftar oleh pengguna lain.`);
        }
        throw new Error(error.message || "Gagal memperbarui pengguna di Supabase.");
      }
    } catch (e: any) {
      if (e.message && (e.message.includes("terdaftar") || e.message.includes("Gagal"))) throw e;
    }

    throw new Error("Gagal memperbarui pengguna di Supabase.");
  },

  async softDeleteUser(id: string): Promise<boolean> {
    try {
      const supabase = createClient() as any;
      const { error } = await supabase
        .from("users")
        .update({ deleted_at: new Date().toISOString() })
        .eq("id", id);

      if (!error) return true;
    } catch (e) {}

    return false;
  },
};
