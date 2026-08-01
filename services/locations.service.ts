import { createClient } from "@/lib/supabase/client";
import { Location, PaginationParams, PaginatedResult } from "@/types";

let mockLocations: Location[] = [
  {
    id: "c1000000-0000-0000-0000-000000000001",
    code: "LOC-GZA",
    name: "Gudang Utama A",
    address: "Kawasan Industri Blok A1 No. 5",
    created_at: "2026-08-01T08:00:00Z",
    updated_at: "2026-08-01T08:00:00Z",
  },
  {
    id: "c2000000-0000-0000-0000-000000000002",
    code: "LOC-PCK",
    name: "Area Packing 2",
    address: "Gedung Operasional Lantai 1",
    created_at: "2026-08-01T08:30:00Z",
    updated_at: "2026-08-01T08:30:00Z",
  },
  {
    id: "c3000000-0000-0000-0000-000000000003",
    code: "LOC-SEC",
    name: "Pos Security Utama",
    address: "Pintu Gerbang Utama Kawasan",
    created_at: "2026-08-01T09:00:00Z",
    updated_at: "2026-08-01T09:00:00Z",
  },
];

export const locationsService = {
  async getLocations(params?: PaginationParams): Promise<PaginatedResult<Location>> {
    const page = params?.page || 1;
    const limit = params?.limit || 10;
    const search = params?.search?.toLowerCase() || "";

    if (process.env.NEXT_PUBLIC_SUPABASE_URL?.includes("placeholder")) {
      let filtered = mockLocations.filter((loc) => !loc.deleted_at);
      if (search) {
        filtered = filtered.filter(
          (loc) =>
            loc.name.toLowerCase().includes(search) ||
            loc.code.toLowerCase().includes(search) ||
            (loc.address && loc.address.toLowerCase().includes(search))
        );
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
        .from("locations")
        .select("*", { count: "exact" })
        .is("deleted_at", null);

      if (search) {
        query = query.or(`name.ilike.%${search}%,code.ilike.%${search}%,address.ilike.%${search}%`);
      }

      const from = (page - 1) * limit;
      const to = from + limit - 1;
      query = query.range(from, to).order("created_at", { ascending: false });

      const { data, count, error } = await query;

      if (!error && data) {
        return {
          data: data as Location[],
          total: count || data.length,
          page,
          totalPages: Math.ceil((count || data.length) / limit),
        };
      }
    } catch (e) {
      // Fallback to mock data for dev placeholder
    }

    // Mock fallback logic
    let filtered = mockLocations.filter((loc) => !loc.deleted_at);
    if (search) {
      filtered = filtered.filter(
        (loc) =>
          loc.name.toLowerCase().includes(search) ||
          loc.code.toLowerCase().includes(search) ||
          (loc.address && loc.address.toLowerCase().includes(search))
      );
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

  async getAllLocations(): Promise<Location[]> {
    const res = await this.getLocations({ page: 1, limit: 100 });
    return res.data;
  },

  async createLocation(payload: { code: string; name: string; address?: string }): Promise<Location> {
    try {
      const supabase = createClient() as any;
      const { data, error } = await supabase
        .from("locations")
        .insert([payload])
        .select()
        .single();

      if (!error && data) return data as Location;
    } catch (e) {
      // Mock fallback
    }

    const newLoc: Location = {
      id: `c${Date.now()}`,
      code: payload.code,
      name: payload.name,
      address: payload.address || "",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    mockLocations.unshift(newLoc);
    return newLoc;
  },

  async updateLocation(id: string, payload: { code?: string; name?: string; address?: string }): Promise<Location> {
    try {
      const supabase = createClient() as any;
      const { data, error } = await supabase
        .from("locations")
        .update({ ...payload, updated_at: new Date().toISOString() })
        .eq("id", id)
        .select()
        .single();

      if (!error && data) return data as Location;
    } catch (e) {
      // Mock fallback
    }

    const index = mockLocations.findIndex((l) => l.id === id);
    if (index !== -1) {
      mockLocations[index] = {
        ...mockLocations[index],
        ...payload,
        updated_at: new Date().toISOString(),
      };
      return mockLocations[index];
    }
    throw new Error("Location not found");
  },

  async softDeleteLocation(id: string): Promise<boolean> {
    try {
      const supabase = createClient() as any;
      const { error } = await supabase
        .from("locations")
        .update({ deleted_at: new Date().toISOString() })
        .eq("id", id);

      if (!error) return true;
    } catch (e) {
      // Mock fallback
    }

    const index = mockLocations.findIndex((l) => l.id === id);
    if (index !== -1) {
      mockLocations[index].deleted_at = new Date().toISOString();
      return true;
    }
    return false;
  },
};
