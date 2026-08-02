import { createClient } from "@/lib/supabase/client";
import { createAdminClient } from "@/lib/supabase/admin";
import { Location, PaginationParams, PaginatedResult } from "@/types";

export const locationsService = {
  async getLocations(params?: PaginationParams): Promise<PaginatedResult<Location>> {
    const page = params?.page || 1;
    const limit = params?.limit || 10;
    const search = params?.search?.toLowerCase() || "";

    const from = (page - 1) * limit;
    const to = from + limit - 1;

    try {
      const supabase = createClient() as any;
      let query = supabase
        .from("locations")
        .select("*", { count: "exact" })
        .is("deleted_at", null);

      if (search) {
        query = query.or(`name.ilike.%${search}%,code.ilike.%${search}%,address.ilike.%${search}%`);
      }

      query = query.range(from, to).order("created_at", { ascending: false });

      let { data, count, error } = await query;

      if (error && typeof window === "undefined" && process.env.SUPABASE_SERVICE_ROLE_KEY) {
        try {
          const adminSupabase = createAdminClient() as any;
          let adminQuery = adminSupabase
            .from("locations")
            .select("*", { count: "exact" })
            .is("deleted_at", null);

          if (search) {
            adminQuery = adminQuery.or(`name.ilike.%${search}%,code.ilike.%${search}%,address.ilike.%${search}%`);
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
          data: data as Location[],
          total: count || data.length,
          page,
          totalPages: Math.ceil((count || data.length) / limit),
        };
      }
    } catch (e) {
      console.error("getLocations error:", e);
    }

    return {
      data: [],
      total: 0,
      page,
      totalPages: 1,
    };
  },

  async getAllLocations(): Promise<Location[]> {
    const res = await this.getLocations({ page: 1, limit: 100 });
    return res.data;
  },

  async createLocation(payload: { code: string; name: string; address?: string }): Promise<Location> {
    const cleanPayload = {
      code: payload.code.trim().toUpperCase(),
      name: payload.name.trim(),
      address: payload.address && payload.address.trim() !== "" ? payload.address.trim() : null,
    };

    try {
      const supabase = createClient() as any;
      const { data, error } = await supabase
        .from("locations")
        .insert([cleanPayload])
        .select()
        .single();

      if (!error && data) {
        return data as Location;
      }

      if (error) {
        console.error("createLocation Supabase error:", error);
        if (error.code === "23505" || error.message?.includes("unique") || error.message?.includes("duplicate")) {
          throw new Error(`Kode lokasi '${cleanPayload.code}' sudah terdaftar di sistem. Silakan gunakan kode lokasi lain.`);
        }
        throw new Error(error.message || "Gagal menyimpan data lokasi ke database Supabase.");
      }
    } catch (e: any) {
      if (e.message && (e.message.includes("terdaftar") || e.message.includes("Gagal"))) {
        throw e;
      }
      console.error("createLocation exception:", e);
      throw new Error(e.message || "Terjadi kesalahan jaringan saat menghubungi server Supabase.");
    }

    throw new Error("Gagal membuat lokasi penempatan di Supabase.");
  },

  async updateLocation(id: string, payload: { code?: string; name?: string; address?: string }): Promise<Location> {
    const updateData: any = {
      ...payload,
      updated_at: new Date().toISOString(),
    };

    if (payload.code) updateData.code = payload.code.trim().toUpperCase();
    if (payload.name) updateData.name = payload.name.trim();
    if (payload.address !== undefined) {
      updateData.address = payload.address && payload.address.trim() !== "" ? payload.address.trim() : null;
    }

    try {
      const supabase = createClient() as any;
      const { data, error } = await supabase
        .from("locations")
        .update(updateData)
        .eq("id", id)
        .select()
        .single();

      if (!error && data) return data as Location;
      if (error) {
        if (error.code === "23505" || error.message?.includes("unique")) {
          throw new Error(`Kode lokasi '${updateData.code}' sudah digunakan oleh lokasi lain.`);
        }
        throw new Error(error.message || "Gagal memperbarui data lokasi di Supabase.");
      }
    } catch (e: any) {
      if (e.message && e.message.includes("sudah digunakan")) throw e;
    }

    throw new Error("Gagal memperbarui lokasi di Supabase.");
  },

  async softDeleteLocation(id: string): Promise<boolean> {
    try {
      const supabase = createClient() as any;
      const { error } = await supabase
        .from("locations")
        .update({ deleted_at: new Date().toISOString() })
        .eq("id", id);

      if (!error) return true;
    } catch (e) {}

    return false;
  },
};
