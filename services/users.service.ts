import { createClient } from "@/lib/supabase/client";
import { User, PaginationParams, PaginatedResult, Role } from "@/types";

let mockUsers: User[] = [
  {
    id: "a0000000-0000-0000-0000-000000000001",
    name: "Super Admin System",
    email: "admin@monitoring.com",
    role: "admin",
    phone: "081234567890",
    location_id: "c1000000-0000-0000-0000-000000000001",
    location: {
      id: "c1000000-0000-0000-0000-000000000001",
      code: "LOC-GZA",
      name: "Gudang Utama A",
      created_at: "",
      updated_at: "",
    },
    created_at: "2026-08-01T08:00:00Z",
    updated_at: "2026-08-01T08:00:00Z",
  },
  {
    id: "p0000000-0000-0000-0000-000000000002",
    name: "Ahmad Rizky (Kepala Regu)",
    email: "pic@monitoring.com",
    role: "pic",
    phone: "081298765432",
    location_id: "c1000000-0000-0000-0000-000000000001",
    location: {
      id: "c1000000-0000-0000-0000-000000000001",
      code: "LOC-GZA",
      name: "Gudang Utama A",
      created_at: "",
      updated_at: "",
    },
    created_at: "2026-08-01T08:30:00Z",
    updated_at: "2026-08-01T08:30:00Z",
  },
  {
    id: "m0000000-0000-0000-0000-000000000003",
    name: "Bambang Wijaya (Manager)",
    email: "manager@monitoring.com",
    role: "manager",
    phone: "081122334455",
    location_id: "c2000000-0000-0000-0000-000000000002",
    location: {
      id: "c2000000-0000-0000-0000-000000000002",
      code: "LOC-PCK",
      name: "Area Packing 2",
      created_at: "",
      updated_at: "",
    },
    created_at: "2026-08-01T09:00:00Z",
    updated_at: "2026-08-01T09:00:00Z",
  },
];

export const usersService = {
  async getUsers(params?: PaginationParams): Promise<PaginatedResult<User>> {
    const page = params?.page || 1;
    const limit = params?.limit || 10;
    const search = params?.search?.toLowerCase() || "";
    const role = params?.role;
    const locationId = params?.locationId;

    if (process.env.NEXT_PUBLIC_SUPABASE_URL?.includes("placeholder")) {
      let filtered = mockUsers.filter((u) => !u.deleted_at);
      if (search) {
        filtered = filtered.filter(
          (u) =>
            u.name.toLowerCase().includes(search) ||
            u.email.toLowerCase().includes(search)
        );
      }
      if (role && role !== "all") {
        filtered = filtered.filter((u) => u.role === role);
      }
      if (locationId && locationId !== "all") {
        filtered = filtered.filter((u) => u.location_id === locationId);
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
        .from("users")
        .select("*, location:locations(*)", { count: "exact" })
        .is("deleted_at", null);

      if (search) {
        query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%`);
      }
      if (role) {
        query = query.eq("role", role);
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
          data: data as unknown as User[],
          total: count || data.length,
          page,
          totalPages: Math.ceil((count || data.length) / limit),
        };
      }
    } catch (e) {
      // Fallback
    }

    // Mock fallback
    let filtered = mockUsers.filter((u) => !u.deleted_at);
    if (search) {
      filtered = filtered.filter(
        (u) =>
          u.name.toLowerCase().includes(search) ||
          u.email.toLowerCase().includes(search)
      );
    }
    if (role && role !== "all") {
      filtered = filtered.filter((u) => u.role === role);
    }
    if (locationId && locationId !== "all") {
      filtered = filtered.filter((u) => u.location_id === locationId);
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

  async createUser(payload: {
    name: string;
    email: string;
    role: Role;
    location_id?: string;
    phone?: string;
  }): Promise<User> {
    try {
      const supabase = createClient() as any;
      const { data, error } = await supabase
        .from("users")
        .insert([payload])
        .select("*, location:locations(*)")
        .single();

      if (!error && data) return data as unknown as User;
    } catch (e) {
      // Fallback
    }

    const newUser: User = {
      id: `u${Date.now()}`,
      name: payload.name,
      email: payload.email,
      role: payload.role,
      location_id: payload.location_id,
      phone: payload.phone || "",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    mockUsers.unshift(newUser);
    return newUser;
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
    try {
      const supabase = createClient() as any;
      const { data, error } = await supabase
        .from("users")
        .update({ ...payload, updated_at: new Date().toISOString() })
        .eq("id", id)
        .select("*, location:locations(*)")
        .single();

      if (!error && data) return data as unknown as User;
    } catch (e) {
      // Fallback
    }

    const index = mockUsers.findIndex((u) => u.id === id);
    if (index !== -1) {
      mockUsers[index] = {
        ...mockUsers[index],
        ...payload,
        updated_at: new Date().toISOString(),
      };
      return mockUsers[index];
    }
    throw new Error("User not found");
  },

  async softDeleteUser(id: string): Promise<boolean> {
    try {
      const supabase = createClient() as any;
      const { error } = await supabase
        .from("users")
        .update({ deleted_at: new Date().toISOString() })
        .eq("id", id);

      if (!error) return true;
    } catch (e) {
      // Fallback
    }

    const index = mockUsers.findIndex((u) => u.id === id);
    if (index !== -1) {
      mockUsers[index].deleted_at = new Date().toISOString();
      return true;
    }
    return false;
  },
};
