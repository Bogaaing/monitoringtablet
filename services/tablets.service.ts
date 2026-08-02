import { createClient } from "@/lib/supabase/client";
import { createAdminClient } from "@/lib/supabase/admin";
import { Tablet, PaginationParams, PaginatedResult, TabletStatus } from "@/types";
import { generateUniqueQrCode } from "@/lib/qr-utils";

let mockTablets: Tablet[] = [
  {
    id: "21000000-0000-0000-0000-000000000001",
    qr_code: "QR-TAB-001",
    serial_number: "SN-TAB-9901",
    brand: "Samsung",
    model: "Galaxy Tab Active 3",
    location_id: "11000000-0000-0000-0000-000000000001",
    location: {
      id: "11000000-0000-0000-0000-000000000001",
      code: "LOC-GZA",
      name: "Gudang Utama A",
      address: "Kawasan Industri Blok A1 No. 5",
      created_at: "",
      updated_at: "",
    },
    status: "active",
    created_at: "2026-08-01T08:00:00Z",
    updated_at: "2026-08-01T08:00:00Z",
  },
  {
    id: "21000000-0000-0000-0000-000000000002",
    qr_code: "QR-TAB-002",
    serial_number: "SN-TAB-9902",
    brand: "Apple",
    model: "iPad 10th Gen",
    location_id: "11000000-0000-0000-0000-000000000002",
    location: {
      id: "11000000-0000-0000-0000-000000000002",
      code: "LOC-PCK",
      name: "Area Packing 2",
      address: "Gedung Operasional Lantai 1",
      created_at: "",
      updated_at: "",
    },
    status: "active",
    created_at: "2026-08-01T08:30:00Z",
    updated_at: "2026-08-01T08:30:00Z",
  },
  {
    id: "21000000-0000-0000-0000-000000000003",
    qr_code: "QR-TAB-003",
    serial_number: "SN-TAB-9903",
    brand: "Lenovo",
    model: "Tab M10 HD",
    location_id: "11000000-0000-0000-0000-000000000003",
    location: {
      id: "11000000-0000-0000-0000-000000000003",
      code: "LOC-SEC",
      name: "Pos Security Utama",
      address: "Pintu Gerbang Utama Kawasan",
      created_at: "",
      updated_at: "",
    },
    status: "maintenance",
    created_at: "2026-08-01T09:00:00Z",
    updated_at: "2026-08-01T09:00:00Z",
  },
];

// Helper functions for local storage fallback persistence across browser refreshes
function getLocalTablets(): Tablet[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem("demo_local_tablets");
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

function saveLocalTablet(tablet: Tablet) {
  if (typeof window === "undefined") return;
  try {
    const existing = getLocalTablets();
    const index = existing.findIndex((t) => t.id === tablet.id || t.qr_code === tablet.qr_code);
    if (index !== -1) {
      existing[index] = { ...existing[index], ...tablet };
    } else {
      existing.unshift(tablet);
    }
    localStorage.setItem("demo_local_tablets", JSON.stringify(existing));
  } catch (e) {}
}

function removeLocalTablet(id: string) {
  if (typeof window === "undefined") return;
  try {
    const existing = getLocalTablets().filter((t) => t.id !== id);
    localStorage.setItem("demo_local_tablets", JSON.stringify(existing));
  } catch (e) {}
}

export const tabletsService = {
  async getTablets(params?: PaginationParams): Promise<PaginatedResult<Tablet>> {
    const page = params?.page || 1;
    const limit = params?.limit || 10;
    const search = params?.search?.toLowerCase() || "";
    const status = params?.status;
    const locationId = params?.locationId;

    let dbTablets: Tablet[] = [];

    if (!process.env.NEXT_PUBLIC_SUPABASE_URL?.includes("placeholder")) {
      try {
        const supabase = createClient() as any;
        let query = supabase
          .from("tablets")
          .select("*, location:locations(*)", { count: "exact" })
          .is("deleted_at", null);

        if (search) {
          query = query.or(
            `qr_code.ilike.%${search}%,serial_number.ilike.%${search}%,brand.ilike.%${search}%,model.ilike.%${search}%`
          );
        }
        if (status && status !== "all") {
          query = query.eq("status", status);
        }
        if (locationId && locationId !== "all") {
          query = query.eq("location_id", locationId);
        }

        const from = (page - 1) * limit;
        const to = from + limit - 1;
        query = query.range(from, to).order("created_at", { ascending: false });

        const { data, count, error } = await query;

        if (!error && data) {
          dbTablets = data as unknown as Tablet[];
        }
      } catch (e) {
        // Suppress Supabase query errors
      }
    }

    // Merge with local storage fallback tablets
    const localTablets = getLocalTablets();
    let combined = [...dbTablets];

    for (const locItem of localTablets) {
      if (!combined.some((t) => t.id === locItem.id || t.qr_code === locItem.qr_code)) {
        combined.unshift(locItem);
      }
    }

    if (combined.length === 0) {
      combined = [...mockTablets].filter((t) => !t.deleted_at);
    }

    // Apply filtering
    let filtered = combined.filter((t) => !t.deleted_at);
    if (search) {
      filtered = filtered.filter(
        (t) =>
          t.qr_code.toLowerCase().includes(search) ||
          t.serial_number.toLowerCase().includes(search) ||
          (t.brand && t.brand.toLowerCase().includes(search)) ||
          (t.model && t.model.toLowerCase().includes(search))
      );
    }
    if (status && status !== "all") {
      filtered = filtered.filter((t) => t.status === status);
    }
    if (locationId && locationId !== "all") {
      filtered = filtered.filter((t) => t.location_id === locationId);
    }

    const total = filtered.length;
    const totalPages = Math.ceil(total / limit) || 1;
    const start = (page - 1) * limit;
    const paginatedData = filtered.slice(start, start + limit);

    return {
      data: paginatedData,
      total,
      page,
      totalPages,
    };
  },

  async getTabletById(id: string): Promise<Tablet | null> {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL?.includes("placeholder")) {
      try {
        const supabase = createClient() as any;
        const { data, error } = await supabase
          .from("tablets")
          .select("*, location:locations(*)")
          .eq("id", id)
          .single();

        if (!error && data) return data as unknown as Tablet;
      } catch (e) {
        // Fallback
      }
    }

    const localMatch = getLocalTablets().find((t) => t.id === id && !t.deleted_at);
    if (localMatch) return localMatch;

    return mockTablets.find((t) => t.id === id && !t.deleted_at) || null;
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
      qr_code: payload.qr_code.trim(),
      serial_number: payload.serial_number.trim(),
      brand: payload.brand ? payload.brand.trim() : "Samsung",
      model: payload.model.trim(),
      location_id: cleanLocationId,
      status: payload.status || "active",
    };

    if (!process.env.NEXT_PUBLIC_SUPABASE_URL?.includes("placeholder")) {
      // 1. Try standard client
      try {
        const supabase = createClient() as any;
        const { data, error } = await supabase
          .from("tablets")
          .insert([insertData])
          .select("*, location:locations(*)")
          .single();

        if (!error && data) {
          saveLocalTablet(data as unknown as Tablet);
          return data as unknown as Tablet;
        } else if (error) {
          console.error("createTablet Supabase error:", error);
        }
      } catch (e) {
        console.error("createTablet Supabase exception:", e);
      }

      // 2. Try admin client if standard client failed RLS
      if (typeof window === "undefined" && process.env.SUPABASE_SERVICE_ROLE_KEY) {
        try {
          const adminSupabase = createAdminClient() as any;
          const { data, error } = await adminSupabase
            .from("tablets")
            .insert([insertData])
            .select("*, location:locations(*)")
            .single();

          if (!error && data) {
            saveLocalTablet(data as unknown as Tablet);
            return data as unknown as Tablet;
          }
        } catch (e) {}
      }
    }

    // Local / Mock fallback
    const newTablet: Tablet = {
      id: typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `t-${Date.now()}`,
      ...insertData,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    saveLocalTablet(newTablet);
    mockTablets.unshift(newTablet);
    return newTablet;
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

    if (payload.location_id !== undefined) {
      updateData.location_id =
        payload.location_id && payload.location_id.trim() !== "" ? payload.location_id.trim() : null;
    }

    if (!process.env.NEXT_PUBLIC_SUPABASE_URL?.includes("placeholder")) {
      try {
        const supabase = createClient() as any;
        const { data, error } = await supabase
          .from("tablets")
          .update(updateData)
          .eq("id", id)
          .select("*, location:locations(*)")
          .single();

        if (!error && data) {
          saveLocalTablet(data as unknown as Tablet);
          return data as unknown as Tablet;
        }
      } catch (e) {}

      if (typeof window === "undefined" && process.env.SUPABASE_SERVICE_ROLE_KEY) {
        try {
          const adminSupabase = createAdminClient() as any;
          const { data, error } = await adminSupabase
            .from("tablets")
            .update(updateData)
            .eq("id", id)
            .select("*, location:locations(*)")
            .single();

          if (!error && data) {
            saveLocalTablet(data as unknown as Tablet);
            return data as unknown as Tablet;
          }
        } catch (e) {}
      }
    }

    const index = mockTablets.findIndex((t) => t.id === id);
    if (index !== -1) {
      mockTablets[index] = {
        ...mockTablets[index],
        ...updateData,
      };
      saveLocalTablet(mockTablets[index]);
      return mockTablets[index];
    }
    throw new Error("Tablet not found");
  },

  async regenerateTabletQr(id: string): Promise<Tablet> {
    const newQrCode = generateUniqueQrCode();
    return this.updateTablet(id, { qr_code: newQrCode });
  },

  async softDeleteTablet(id: string): Promise<boolean> {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL?.includes("placeholder")) {
      try {
        const supabase = createClient() as any;
        const { error } = await supabase
          .from("tablets")
          .update({ deleted_at: new Date().toISOString() })
          .eq("id", id);

        if (!error) {
          removeLocalTablet(id);
          return true;
        }
      } catch (e) {}

      if (typeof window === "undefined" && process.env.SUPABASE_SERVICE_ROLE_KEY) {
        try {
          const adminSupabase = createAdminClient() as any;
          const { error } = await adminSupabase
            .from("tablets")
            .update({ deleted_at: new Date().toISOString() })
            .eq("id", id);

          if (!error) {
            removeLocalTablet(id);
            return true;
          }
        } catch (e) {}
      }
    }

    removeLocalTablet(id);
    const index = mockTablets.findIndex((t) => t.id === id);
    if (index !== -1) {
      mockTablets[index].deleted_at = new Date().toISOString();
      return true;
    }
    return false;
  },

  async getTabletByQr(qrCode: string): Promise<Tablet | null> {
    const res = await this.getTablets({ search: qrCode, limit: 1 });
    return res.data.find((t) => t.qr_code === qrCode) || null;
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
      qr_code: item.qr_code ? item.qr_code.trim() : generateUniqueQrCode(),
      serial_number: item.serial_number ? item.serial_number.trim() : "",
      brand: item.brand ? item.brand.trim() : "Samsung",
      model: item.model ? item.model.trim() : "",
      location_id:
        item.location_id && item.location_id.trim() !== "" ? item.location_id.trim() : null,
      status: item.status || "active",
    }));

    if (!process.env.NEXT_PUBLIC_SUPABASE_URL?.includes("placeholder")) {
      try {
        const supabase = createClient() as any;
        const { data, error } = await supabase
          .from("tablets")
          .insert(cleanItems)
          .select("*, location:locations(*)");

        if (!error && data) {
          (data as unknown as Tablet[]).forEach((t) => saveLocalTablet(t));
          return {
            successCount: data.length,
            failedCount: 0,
            imported: data as unknown as Tablet[],
            errors: [],
          };
        } else if (error) {
          console.error("bulkImportTablets Supabase error:", error);
        }
      } catch (e) {
        console.error("bulkImportTablets Supabase exception:", e);
      }

      if (typeof window === "undefined" && process.env.SUPABASE_SERVICE_ROLE_KEY) {
        try {
          const adminSupabase = createAdminClient() as any;
          const { data, error } = await adminSupabase
            .from("tablets")
            .insert(cleanItems)
            .select("*, location:locations(*)");

          if (!error && data) {
            (data as unknown as Tablet[]).forEach((t) => saveLocalTablet(t));
            return {
              successCount: data.length,
              failedCount: 0,
              imported: data as unknown as Tablet[],
              errors: [],
            };
          }
        } catch (e) {}
      }
    }

    // Local / Mock fallback
    const imported: Tablet[] = [];
    for (const item of cleanItems) {
      const tab: Tablet = {
        id: typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `t-${Date.now()}-${Math.random()}`,
        ...item,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      saveLocalTablet(tab);
      mockTablets.unshift(tab);
      imported.push(tab);
    }

    return {
      successCount: imported.length,
      failedCount: 0,
      imported,
      errors: [],
    };
  },
};
