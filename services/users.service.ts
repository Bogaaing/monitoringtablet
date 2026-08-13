import { createClient } from "@/lib/supabase/client";
import { createAdminClient } from "@/lib/supabase/admin";
import { User, PaginationParams, PaginatedResult, Role } from "@/types";

export interface CreateUserPayload {
  npk: string;
  name: string;
  role: Role;
  department?: string | null;
  password?: string;
  location_id?: string | null;
  phone?: string;
}

export interface UpdateUserPayload {
  npk?: string;
  name?: string;
  email?: string;
  role?: Role;
  department?: string | null;
  status?: string;
  location_id?: string | null;
  phone?: string;
}

export const usersService = {
  async getUsers(params?: PaginationParams & { npk?: string; department?: string }): Promise<PaginatedResult<User>> {
    const page = params?.page || 1;
    const limit = params?.limit || 10;
    const search = params?.search?.trim().toLowerCase() || "";
    const role = params?.role;
    const locationId = params?.locationId;
    const npkExact = params?.npk?.trim();

    const from = (page - 1) * limit;
    const to = from + limit - 1;

    try {
      const supabase = createClient() as any;
      let query = supabase
        .from("users")
        .select("*, location:locations(*)", { count: "exact" })
        .is("deleted_at", null);

      if (npkExact) {
        query = query.eq("npk", npkExact);
      } else if (search) {
        query = query.or(`npk.ilike.%${search}%,name.ilike.%${search}%,department.ilike.%${search}%,email.ilike.%${search}%`);
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

          if (npkExact) {
            adminQuery = adminQuery.eq("npk", npkExact);
          } else if (search) {
            adminQuery = adminQuery.or(`npk.ilike.%${search}%,name.ilike.%${search}%,department.ilike.%${search}%,email.ilike.%${search}%`);
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

  async createUser(payload: CreateUserPayload): Promise<User> {
    const cleanNpk = (payload.npk || "").trim();

    // Validate NPK: numeric and exactly 8 digits
    if (!/^\d{8}$/.test(cleanNpk)) {
      throw new Error("NPK harus terdiri dari tepat 8 digit angka.");
    }

    // Automatically generate internal auth email: <NPK>@tabmonitor.my.id
    const generatedEmail = `${cleanNpk}@tabmonitor.my.id`;
    let cleanLocationId =
      payload.location_id && payload.location_id.trim() !== "" ? payload.location_id.trim() : null;
    let authId: string | null = null;

    const supabase = createClient() as any;

    // Check NPK uniqueness in public.users table
    try {
      const { data: existingUser } = await supabase
        .from("users")
        .select("id")
        .eq("npk", cleanNpk)
        .is("deleted_at", null)
        .maybeSingle();

      if (existingUser) {
        throw new Error(`NPK '${cleanNpk}' sudah terdaftar di sistem.`);
      }
    } catch (e: any) {
      if (e.message && e.message.includes("terdaftar")) throw e;
    }

    // Verify cleanLocationId is valid in Supabase DB
    if (cleanLocationId) {
      try {
        const { data: loc } = await supabase.from("locations").select("id").eq("id", cleanLocationId).single();
        if (!loc) cleanLocationId = null;
      } catch (e) {
        cleanLocationId = null;
      }
    }

    // 1. Attempt to create Auth User in Supabase Auth (auth.users) via Admin Client
    if (typeof window === "undefined" && process.env.SUPABASE_SERVICE_ROLE_KEY) {
      try {
        const adminSupabase = createAdminClient();
        const userPassword = payload.password || (payload.role === "admin" ? "admin123" : payload.role === "pic" ? "pic123" : "manager123");

        const { data: authData, error: authError } = await adminSupabase.auth.admin.createUser({
          email: generatedEmail,
          password: userPassword,
          email_confirm: true,
          user_metadata: {
            npk: cleanNpk,
            name: payload.name,
            role: payload.role,
            department: payload.department || null,
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
      npk: cleanNpk,
      name: payload.name.trim(),
      email: generatedEmail,
      role: payload.role,
      department: payload.department ? payload.department.trim() : null,
      status: "active",
      location_id: cleanLocationId,
      phone: payload.phone ? payload.phone.trim() : null,
      ...(authId ? { auth_id: authId } : {}),
    };

    try {
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

        // Fallback if npk, department, or status columns don't exist in DB yet
        if (error.code === "PGRST204" || error.message?.includes("column") || error.message?.includes("schema cache")) {
          const { npk: _npk, department: _dept, status: _st, ...fallbackPayload } = insertPayload;

          const { data: fbData, error: fbError } = await supabase
            .from("users")
            .insert([fallbackPayload])
            .select("*, location:locations(*)")
            .single();

          if (!fbError && fbData) {
            return {
              ...fbData,
              npk: cleanNpk,
              department: insertPayload.department,
              status: "active",
            } as unknown as User;
          }
        }

        if (error.code === "23505" || error.message?.includes("unique") || error.message?.includes("duplicate")) {
          throw new Error(`NPK '${cleanNpk}' sudah terdaftar di sistem. Silakan gunakan NPK lain.`);
        }
        if (error.code === "23503" || error.message?.includes("foreign key")) {
          const fallbackPayload = { ...insertPayload, location_id: null };
          const { data: fbData, error: fbError } = await supabase
            .from("users")
            .insert([fallbackPayload])
            .select("*, location:locations(*)")
            .single();

          if (!fbError && fbData) return fbData as unknown as User;
        }
        throw new Error(error.message || "Gagal menambahkan pengguna ke database Supabase.");
      }
    } catch (e: any) {
      console.error("createUser exception:", e);
      throw new Error(e.message || "Terjadi kesalahan saat menyimpan data pengguna.");
    }

    throw new Error("Gagal menambahkan pengguna ke database Supabase.");
  },

  async updateUser(id: string, payload: UpdateUserPayload): Promise<User> {
    const supabase = createClient() as any;

    const updateData: any = {
      ...payload,
      updated_at: new Date().toISOString(),
    };

    if (payload.npk !== undefined) {
      const cleanNpk = (payload.npk || "").trim();
      if (cleanNpk && !/^\d{8}$/.test(cleanNpk)) {
        throw new Error("NPK harus berupa 8 digit angka.");
      }
      updateData.npk = cleanNpk || null;

      // Check uniqueness against other active users
      if (cleanNpk) {
        try {
          const { data: existingUser, error: checkErr } = await supabase
            .from("users")
            .select("id")
            .eq("npk", cleanNpk)
            .neq("id", id)
            .is("deleted_at", null)
            .maybeSingle();

          if (!checkErr && existingUser) {
            throw new Error(`NPK '${cleanNpk}' sudah digunakan oleh pengguna lain.`);
          }
        } catch (e: any) {
          if (e.message && e.message.includes("digunakan")) throw e;
        }
      }
    }

    if (payload.email) updateData.email = payload.email.trim().toLowerCase();
    if (payload.name) updateData.name = payload.name.trim();
    if (payload.department !== undefined) updateData.department = payload.department ? payload.department.trim() : null;
    if (payload.status) updateData.status = payload.status;
    if (payload.location_id !== undefined) {
      updateData.location_id = payload.location_id && payload.location_id.trim() !== "" ? payload.location_id.trim() : null;
    }

    try {
      const { data, error } = await supabase
        .from("users")
        .update(updateData)
        .eq("id", id)
        .select("*, location:locations(*)")
        .single();

      if (!error && data) return data as unknown as User;

      if (error) {
        // Fallback if npk, department, or status columns don't exist in Supabase DB yet
        if (error.code === "PGRST204" || error.message?.includes("column") || error.message?.includes("schema cache")) {
          const { npk: _npk, department: _dept, status: _st, ...fallbackData } = updateData;

          const { data: fbData, error: fbError } = await supabase
            .from("users")
            .update(fallbackData)
            .eq("id", id)
            .select("*, location:locations(*)")
            .single();

          if (!fbError && fbData) {
            return {
              ...fbData,
              npk: updateData.npk,
              department: updateData.department,
              status: updateData.status,
            } as unknown as User;
          }
        }

        if (error.code === "23505" || error.message?.includes("unique")) {
          throw new Error(`NPK atau Email sudah terdaftar oleh pengguna lain.`);
        }
        throw new Error(error.message || "Gagal memperbarui pengguna di Supabase.");
      }
    } catch (e: any) {
      throw new Error(e.message || "Gagal memperbarui pengguna di Supabase.");
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
