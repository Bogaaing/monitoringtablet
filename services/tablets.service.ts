import { createClient } from "@/lib/supabase/client";
import { Tablet, PaginationParams, PaginatedResult, TabletStatus } from "@/types";
import { generateUniqueQrCode } from "@/lib/qr-utils";

let mockTablets: Tablet[] = [
  {
    id: "t1000000-0000-0000-0000-000000000001",
    qr_code: "QR-TAB-001",
    serial_number: "SN-TAB-9901",
    brand: "Samsung",
    model: "Galaxy Tab Active 3",
    location_id: "c1000000-0000-0000-0000-000000000001",
    location: {
      id: "c1000000-0000-0000-0000-000000000001",
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
    id: "t2000000-0000-0000-0000-000000000002",
    qr_code: "QR-TAB-002",
    serial_number: "SN-TAB-9902",
    brand: "Apple",
    model: "iPad 10th Gen",
    location_id: "c2000000-0000-0000-0000-000000000002",
    location: {
      id: "c2000000-0000-0000-0000-000000000002",
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
    id: "t3000000-0000-0000-0000-000000000003",
    qr_code: "QR-TAB-003",
    serial_number: "SN-TAB-9903",
    brand: "Lenovo",
    model: "Tab M10 HD",
    location_id: "c3000000-0000-0000-0000-000000000003",
    location: {
      id: "c3000000-0000-0000-0000-000000000003",
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

export const tabletsService = {
  async getTablets(params?: PaginationParams): Promise<PaginatedResult<Tablet>> {
    const page = params?.page || 1;
    const limit = params?.limit || 10;
    const search = params?.search?.toLowerCase() || "";
    const status = params?.status;
    const locationId = params?.locationId;

    if (process.env.NEXT_PUBLIC_SUPABASE_URL?.includes("placeholder")) {
      let filtered = mockTablets.filter((t) => !t.deleted_at);
      if (search) {
        filtered = filtered.filter(
          (t) =>
            t.qr_code.toLowerCase().includes(search) ||
            t.serial_number.toLowerCase().includes(search) ||
            t.brand.toLowerCase().includes(search) ||
            t.model.toLowerCase().includes(search)
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
    }

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
      if (status) {
        query = query.eq("status", status);
      }
      if (locationId) {
        query = query.eq("location_id", locationId);
      }

      const from = (page - 1) * limit;
      const to = from + limit - 1;
      query = query.range(from, to).order("created_at", { ascending: false });

      const { data, count, error } = await query;

      if (!error && data) {
        return {
          data: data as unknown as Tablet[],
          total: count || data.length,
          page,
          totalPages: Math.ceil((count || data.length) / limit),
        };
      }
    } catch (e) {
      // Fallback
    }

    // Mock fallback
    let filtered = mockTablets.filter((t) => !t.deleted_at);
    if (search) {
      filtered = filtered.filter(
        (t) =>
          t.qr_code.toLowerCase().includes(search) ||
          t.serial_number.toLowerCase().includes(search) ||
          t.brand.toLowerCase().includes(search) ||
          t.model.toLowerCase().includes(search)
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

    return mockTablets.find((t) => t.id === id && !t.deleted_at) || null;
  },

  async createTablet(payload: {
    qr_code: string;
    serial_number: string;
    brand: string;
    model: string;
    location_id?: string;
    status?: TabletStatus;
  }): Promise<Tablet> {
    try {
      const supabase = createClient() as any;
      const { data, error } = await supabase
        .from("tablets")
        .insert([{ ...payload, status: payload.status || "active" }])
        .select("*, location:locations(*)")
        .single();

      if (!error && data) return data as unknown as Tablet;
    } catch (e) {
      // Fallback
    }

    const newTablet: Tablet = {
      id: `t${Date.now()}`,
      qr_code: payload.qr_code,
      serial_number: payload.serial_number,
      brand: payload.brand,
      model: payload.model,
      location_id: payload.location_id,
      status: payload.status || "active",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
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
    try {
      const supabase = createClient() as any;
      const { data, error } = await supabase
        .from("tablets")
        .update({ ...payload, updated_at: new Date().toISOString() })
        .eq("id", id)
        .select("*, location:locations(*)")
        .single();

      if (!error && data) return data as unknown as Tablet;
    } catch (e) {
      // Fallback
    }

    const index = mockTablets.findIndex((t) => t.id === id);
    if (index !== -1) {
      mockTablets[index] = {
        ...mockTablets[index],
        ...payload,
        updated_at: new Date().toISOString(),
      };
      return mockTablets[index];
    }
    throw new Error("Tablet not found");
  },

  async regenerateTabletQr(id: string): Promise<Tablet> {
    const newQrCode = generateUniqueQrCode();
    try {
      const supabase = createClient() as any;
      const { data, error } = await supabase
        .from("tablets")
        .update({ qr_code: newQrCode, updated_at: new Date().toISOString() })
        .eq("id", id)
        .select("*, location:locations(*)")
        .single();

      if (!error && data) return data as unknown as Tablet;
    } catch (e) {
      // Fallback
    }

    const index = mockTablets.findIndex((t) => t.id === id);
    if (index !== -1) {
      mockTablets[index].qr_code = newQrCode;
      mockTablets[index].updated_at = new Date().toISOString();
      return mockTablets[index];
    }
    throw new Error("Tablet not found");
  },

  async softDeleteTablet(id: string): Promise<boolean> {
    try {
      const supabase = createClient() as any;
      const { error } = await supabase
        .from("tablets")
        .update({ deleted_at: new Date().toISOString() })
        .eq("id", id);

      if (!error) return true;
    } catch (e) {
      // Fallback
    }

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
    const imported: Tablet[] = [];

    const preparedItems = items.map((item, idx) => ({
      id: `t-bulk-${Date.now()}-${idx}-${Math.random().toString(36).substring(2, 6)}`,
      qr_code: item.qr_code || generateUniqueQrCode(),
      serial_number: item.serial_number,
      brand: item.brand,
      model: item.model,
      location_id: item.location_id || null,
      status: item.status || "active",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }));

    if (!process.env.NEXT_PUBLIC_SUPABASE_URL?.includes("placeholder")) {
      try {
        const supabase = createClient() as any;
        const { data, error } = await supabase
          .from("tablets")
          .insert(
            preparedItems.map((p) => ({
              id: p.id,
              qr_code: p.qr_code,
              serial_number: p.serial_number,
              brand: p.brand,
              model: p.model,
              location_id: p.location_id,
              status: p.status,
            }))
          )
          .select("*, location:locations(*)");

        if (!error && data) {
          return {
            successCount: data.length,
            failedCount: 0,
            imported: data as unknown as Tablet[],
            errors: [],
          };
        }
      } catch (e: any) {
        // Fallback
      }
    }

    // Mock fallback insert
    for (const item of preparedItems) {
      mockTablets.unshift(item as Tablet);
      imported.push(item as Tablet);
    }

    return {
      successCount: imported.length,
      failedCount: 0,
      imported,
      errors: [],
    };
  },
};
