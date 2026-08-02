import { createClient } from "@/lib/supabase/client";
import { createAdminClient } from "@/lib/supabase/admin";
import { Location, PaginationParams, PaginatedResult } from "@/types";

let mockLocations: Location[] = [
  {
    id: "11000000-0000-0000-0000-000000000001",
    code: "LOC-GZA",
    name: "Gudang Utama A",
    address: "Kawasan Industri Blok A1 No. 5",
    created_at: "2026-08-01T08:00:00Z",
    updated_at: "2026-08-01T08:00:00Z",
  },
  {
    id: "11000000-0000-0000-0000-000000000002",
    code: "LOC-PCK",
    name: "Area Packing 2",
    address: "Gedung Operasional Lantai 1",
    created_at: "2026-08-01T08:30:00Z",
    updated_at: "2026-08-01T08:30:00Z",
  },
  {
    id: "11000000-0000-0000-0000-000000000003",
    code: "LOC-SEC",
    name: "Pos Security Utama",
    address: "Pintu Gerbang Utama Kawasan",
    created_at: "2026-08-01T09:00:00Z",
    updated_at: "2026-08-01T09:00:00Z",
  },
];

function getLocalLocations(): Location[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem("demo_local_locations");
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

function saveLocalLocation(location: Location) {
  if (typeof window === "undefined") return;
  try {
    const existing = getLocalLocations();
    const index = existing.findIndex((l) => l.id === location.id || l.code === location.code);
    if (index !== -1) {
      existing[index] = { ...existing[index], ...location };
    } else {
      existing.unshift(location);
    }
    localStorage.setItem("demo_local_locations", JSON.stringify(existing));
  } catch (e) {}
}

export const locationsService = {
  async getLocations(params?: PaginationParams): Promise<PaginatedResult<Location>> {
    const page = params?.page || 1;
    const limit = params?.limit || 10;
    const search = params?.search?.toLowerCase() || "";

    let dbLocations: Location[] = [];

    if (!process.env.NEXT_PUBLIC_SUPABASE_URL?.includes("placeholder")) {
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
          dbLocations = data as Location[];
        }
      } catch (e) {}
    }

    const localLocs = getLocalLocations();
    let combined = [...dbLocations];

    for (const item of localLocs) {
      if (!combined.some((l) => l.id === item.id || l.code === item.code)) {
        combined.unshift(item);
      }
    }

    if (combined.length === 0) {
      combined = [...mockLocations].filter((l) => !l.deleted_at);
    }

    let filtered = combined.filter((loc) => !loc.deleted_at);
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
    const cleanPayload = {
      code: payload.code.trim(),
      name: payload.name.trim(),
      address: payload.address ? payload.address.trim() : null,
    };

    if (!process.env.NEXT_PUBLIC_SUPABASE_URL?.includes("placeholder")) {
      try {
        const supabase = createClient() as any;
        const { data, error } = await supabase
          .from("locations")
          .insert([cleanPayload])
          .select()
          .single();

        if (!error && data) {
          saveLocalLocation(data as Location);
          return data as Location;
        }
      } catch (e) {}

      if (typeof window === "undefined" && process.env.SUPABASE_SERVICE_ROLE_KEY) {
        try {
          const adminSupabase = createAdminClient() as any;
          const { data, error } = await adminSupabase
            .from("locations")
            .insert([cleanPayload])
            .select()
            .single();

          if (!error && data) {
            saveLocalLocation(data as Location);
            return data as Location;
          }
        } catch (e) {}
      }
    }

    const newLoc: Location = {
      id: typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `loc-${Date.now()}`,
      ...cleanPayload,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    saveLocalLocation(newLoc);
    mockLocations.unshift(newLoc);
    return newLoc;
  },

  async updateLocation(id: string, payload: { code?: string; name?: string; address?: string }): Promise<Location> {
    const updateData: any = {
      ...payload,
      updated_at: new Date().toISOString(),
    };

    if (!process.env.NEXT_PUBLIC_SUPABASE_URL?.includes("placeholder")) {
      try {
        const supabase = createClient() as any;
        const { data, error } = await supabase
          .from("locations")
          .update(updateData)
          .eq("id", id)
          .select()
          .single();

        if (!error && data) {
          saveLocalLocation(data as Location);
          return data as Location;
        }
      } catch (e) {}

      if (typeof window === "undefined" && process.env.SUPABASE_SERVICE_ROLE_KEY) {
        try {
          const adminSupabase = createAdminClient() as any;
          const { data, error } = await adminSupabase
            .from("locations")
            .update(updateData)
            .eq("id", id)
            .select()
            .single();

          if (!error && data) {
            saveLocalLocation(data as Location);
            return data as Location;
          }
        } catch (e) {}
      }
    }

    const index = mockLocations.findIndex((l) => l.id === id);
    if (index !== -1) {
      mockLocations[index] = {
        ...mockLocations[index],
        ...updateData,
      };
      saveLocalLocation(mockLocations[index]);
      return mockLocations[index];
    }
    throw new Error("Location not found");
  },

  async softDeleteLocation(id: string): Promise<boolean> {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL?.includes("placeholder")) {
      try {
        const supabase = createClient() as any;
        const { error } = await supabase
          .from("locations")
          .update({ deleted_at: new Date().toISOString() })
          .eq("id", id);

        if (!error) return true;
      } catch (e) {}

      if (typeof window === "undefined" && process.env.SUPABASE_SERVICE_ROLE_KEY) {
        try {
          const adminSupabase = createAdminClient() as any;
          const { error } = await adminSupabase
            .from("locations")
            .update({ deleted_at: new Date().toISOString() })
            .eq("id", id);

          if (!error) return true;
        } catch (e) {}
      }
    }

    const index = mockLocations.findIndex((l) => l.id === id);
    if (index !== -1) {
      mockLocations[index].deleted_at = new Date().toISOString();
      return true;
    }
    return false;
  },
};
