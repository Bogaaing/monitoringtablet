import { createClient } from "@/lib/supabase/client";
import { createAdminClient } from "@/lib/supabase/admin";
import { Tablet, PaginationParams, PaginatedResult, TabletStatus } from "@/types";
import { generateUniqueQrCode } from "@/lib/qr-utils";

export const tabletsService = {
  async getTablets(params?: PaginationParams): Promise<PaginatedResult<Tablet>> {
    const page = params?.page || 1;
    const limit = params?.limit || 100;
    const search = params?.search?.toLowerCase() || "";
    const status = params?.status;
    const locationId = params?.locationId;

    const from = (page - 1) * limit;
    const to = from + limit - 1;

    try {
      const supabase = createClient() as any;
      let query = supabase
        .from("tablets")
        .select("*, location:locations(*)", { count: "exact" })
        .is("deleted_at", null);

      if (search) {
        // Query locations matching search term to support searching by location name
        let matchedLocationIds: string[] = [];
        try {
          const { data: locs } = await supabase
            .from("locations")
            .select("id")
            .ilike("name", `%${search}%`);
          if (locs && locs.length > 0) {
            matchedLocationIds = locs.map((l: any) => l.id);
          }
        } catch (e) {}

        if (matchedLocationIds.length > 0) {
          query = query.or(
            `qr_code.ilike.%${search}%,serial_number.ilike.%${search}%,brand.ilike.%${search}%,model.ilike.%${search}%,location_id.in.(${matchedLocationIds.join(",")})`
          );
        } else {
          query = query.or(
            `qr_code.ilike.%${search}%,serial_number.ilike.%${search}%,brand.ilike.%${search}%,model.ilike.%${search}%`
          );
        }
      }
      if (status && status !== "all") {
        query = query.eq("status", status);
      }
      if (locationId && locationId !== "all") {
        query = query.eq("location_id", locationId);
      }

      query = query.range(from, to).order("created_at", { ascending: false });

      let { data, count, error } = await query;

      if (error && typeof window === "undefined" && process.env.SUPABASE_SERVICE_ROLE_KEY) {
        try {
          const adminSupabase = createAdminClient() as any;
          let adminQuery = adminSupabase
            .from("tablets")
            .select("*, location:locations(*)", { count: "exact" })
            .is("deleted_at", null);

          if (search) {
            let adminMatchedLocationIds: string[] = [];
            try {
              const { data: locs } = await adminSupabase
                .from("locations")
                .select("id")
                .ilike("name", `%${search}%`);
              if (locs && locs.length > 0) {
                adminMatchedLocationIds = locs.map((l: any) => l.id);
              }
            } catch (e) {}

            if (adminMatchedLocationIds.length > 0) {
              adminQuery = adminQuery.or(
                `qr_code.ilike.%${search}%,serial_number.ilike.%${search}%,brand.ilike.%${search}%,model.ilike.%${search}%,location_id.in.(${adminMatchedLocationIds.join(",")})`
              );
            } else {
              adminQuery = adminQuery.or(
                `qr_code.ilike.%${search}%,serial_number.ilike.%${search}%,brand.ilike.%${search}%,model.ilike.%${search}%`
              );
            }
          }
          if (status && status !== "all") {
            adminQuery = adminQuery.eq("status", status);
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
          data: data as unknown as Tablet[],
          total: count || data.length,
          page,
          totalPages: Math.ceil((count || data.length) / limit),
        };
      }
    } catch (e) {
      console.error("getTablets error:", e);
    }

    return {
      data: [],
      total: 0,
      page,
      totalPages: 1,
    };
  },

  async getTabletById(id: string): Promise<Tablet | null> {
    try {
      const supabase = createClient() as any;
      const { data, error } = await supabase
        .from("tablets")
        .select("*, location:locations(*)")
        .eq("id", id)
        .single();

      if (!error && data) return data as unknown as Tablet;
    } catch (e) {}

    if (typeof window === "undefined" && process.env.SUPABASE_SERVICE_ROLE_KEY) {
      try {
        const adminSupabase = createAdminClient() as any;
        const { data, error } = await adminSupabase
          .from("tablets")
          .select("*, location:locations(*)")
          .eq("id", id)
          .single();

        if (!error && data) return data as unknown as Tablet;
      } catch (e) {}
    }

    return null;
  },

  async createTablet(payload: {
    qr_code: string;
    serial_number: string;
    brand: string;
    model: string;
    location_id?: string | null;
    status?: TabletStatus;
  }): Promise<Tablet> {
    const cleanLocationId =
      payload.location_id && payload.location_id.trim() !== "" ? payload.location_id.trim() : null;

    const insertData = {
      qr_code: payload.qr_code.trim().toUpperCase(),
      serial_number: payload.serial_number.trim().toUpperCase(),
      brand: payload.brand ? payload.brand.trim() : "Samsung",
      model: payload.model.trim(),
      location_id: cleanLocationId,
      status: payload.status || "active",
    };

    try {
      const supabase = createClient() as any;
      const { data, error } = await supabase
        .from("tablets")
        .insert([insertData])
        .select("*, location:locations(*)")
        .single();

      if (!error && data) return data as unknown as Tablet;
      if (error) {
        console.error("createTablet Supabase error:", error);
        if (error.code === "23505" || error.message?.includes("unique") || error.message?.includes("duplicate")) {
          if (error.message?.includes("qr_code")) {
            throw new Error(`Kode Tablet '${insertData.qr_code}' sudah terdaftar. Gunakan kode lain.`);
          }
          if (error.message?.includes("serial_number")) {
            throw new Error(`Serial Number '${insertData.serial_number}' sudah terdaftar. Gunakan serial number lain.`);
          }
          throw new Error("Kode Tablet atau Serial Number sudah terdaftar di sistem.");
        }
        throw new Error(error.message || "Gagal menambahkan tablet ke database Supabase.");
      }
    } catch (e: any) {
      if (e.message && (e.message.includes("terdaftar") || e.message.includes("Gagal"))) throw e;
      console.error("createTablet Supabase exception:", e);
    }

    throw new Error("Gagal menambahkan tablet ke database Supabase.");
  },

  async updateTablet(
    id: string,
    payload: {
      qr_code?: string;
      serial_number?: string;
      brand?: string;
      model?: string;
      location_id?: string | null;
      status?: TabletStatus;
    }
  ): Promise<Tablet> {
    const updateData: any = {
      ...payload,
      updated_at: new Date().toISOString(),
    };

    if (payload.qr_code) updateData.qr_code = payload.qr_code.trim().toUpperCase();
    if (payload.serial_number) updateData.serial_number = payload.serial_number.trim().toUpperCase();
    if (payload.location_id !== undefined) {
      updateData.location_id =
        payload.location_id && payload.location_id.trim() !== "" ? payload.location_id.trim() : null;
    }

    try {
      const supabase = createClient() as any;
      const { data, error } = await supabase
        .from("tablets")
        .update(updateData)
        .eq("id", id)
        .select("*, location:locations(*)")
        .single();

      if (!error && data) return data as unknown as Tablet;
      if (error) {
        if (error.code === "23505" || error.message?.includes("unique")) {
          throw new Error("Kode Tablet atau Serial Number sudah terdaftar di sistem.");
        }
        throw new Error(error.message || "Gagal memperbarui data tablet di Supabase.");
      }
    } catch (e: any) {
      if (e.message && (e.message.includes("terdaftar") || e.message.includes("Gagal"))) throw e;
    }

    throw new Error("Gagal memperbarui data tablet di Supabase.");
  },

  async regenerateTabletQr(id: string): Promise<Tablet> {
    const newQrCode = generateUniqueQrCode();
    return this.updateTablet(id, { qr_code: newQrCode });
  },

  async softDeleteTablet(id: string): Promise<boolean> {
    try {
      const supabase = createClient() as any;
      const { error } = await supabase
        .from("tablets")
        .update({ deleted_at: new Date().toISOString() })
        .eq("id", id);

      if (!error) return true;
    } catch (e) {}

    return false;
  },

  async getTabletByQr(qrCode: string): Promise<Tablet | null> {
    const res = await this.getTablets({ search: qrCode, limit: 1 });
    return res.data.find((t) => t.qr_code.toLowerCase() === qrCode.toLowerCase()) || null;
  },

  async bulkImportTablets(
    items: Array<{
      qr_code: string;
      serial_number: string;
      brand: string;
      model: string;
      location_id?: string | null;
      status?: TabletStatus;
    }>
  ): Promise<{ successCount: number; failedCount: number; imported: Tablet[]; errors: any[] }> {
    const cleanItems = items.map((item) => ({
      qr_code: item.qr_code ? item.qr_code.trim().toUpperCase() : generateUniqueQrCode(),
      serial_number: item.serial_number ? item.serial_number.trim().toUpperCase() : "",
      brand: item.brand ? item.brand.trim() : "Samsung",
      model: item.model ? item.model.trim() : "",
      location_id:
        item.location_id && item.location_id.trim() !== "" ? item.location_id.trim() : null,
      status: item.status || "active",
    }));

    try {
      const supabase = createClient() as any;
      const { data, error } = await supabase
        .from("tablets")
        .insert(cleanItems)
        .select("*, location:locations(*)");

      if (!error && data) {
        return {
          successCount: data.length,
          failedCount: 0,
          imported: data as unknown as Tablet[],
          errors: [],
        };
      } else if (error) {
        console.error("bulkImportTablets Supabase error:", error);
        throw new Error(error.message || "Gagal mengimpor data tablet ke Supabase.");
      }
    } catch (e: any) {
      console.error("bulkImportTablets Supabase exception:", e);
      throw e;
    }

    throw new Error("Gagal mengimpor tablet ke Supabase.");
  },
};
