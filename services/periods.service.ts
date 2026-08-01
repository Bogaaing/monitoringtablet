import { createClient } from "@/lib/supabase/client";
import { InspectionPeriod, PeriodStatus } from "@/types";

let mockPeriods: InspectionPeriod[] = [
  {
    id: "p1000000-0000-0000-0000-000000000001",
    name: "Periode Juli 2026",
    year: 2026,
    month: 7,
    start_date: "2026-07-01",
    end_date: "2026-07-31",
    is_active: false,
    status: "closed",
    created_at: "2026-07-01T00:00:00Z",
    updated_at: "2026-07-31T23:59:59Z",
  },
  {
    id: "p2000000-0000-0000-0000-000000000002",
    name: "Periode Agustus 2026",
    year: 2026,
    month: 8,
    start_date: "2026-08-01",
    end_date: "2026-08-31",
    is_active: true,
    status: "active",
    created_at: "2026-08-01T00:00:00Z",
    updated_at: "2026-08-01T00:00:00Z",
  },
  {
    id: "p3000000-0000-0000-0000-000000000003",
    name: "Periode September 2026",
    year: 2026,
    month: 9,
    start_date: "2026-09-01",
    end_date: "2026-09-30",
    is_active: false,
    status: "draft",
    created_at: "2026-08-01T10:00:00Z",
    updated_at: "2026-08-01T10:00:00Z",
  },
];

const monthNames = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember"
];

export const periodsService = {
  async getActivePeriod(): Promise<InspectionPeriod | null> {
    if (process.env.NEXT_PUBLIC_SUPABASE_URL?.includes("placeholder")) {
      return mockPeriods.find((p) => p.is_active) || mockPeriods[1] || null;
    }
    try {
      const supabase = createClient() as any;
      const { data, error } = await supabase
        .from("inspection_periods")
        .select("*")
        .eq("is_active", true)
        .single();

      if (!error && data) return data as InspectionPeriod;
    } catch (e) {
      // Fallback
    }

    return mockPeriods.find((p) => p.is_active) || mockPeriods[1] || null;
  },

  async getAllPeriods(): Promise<InspectionPeriod[]> {
    if (process.env.NEXT_PUBLIC_SUPABASE_URL?.includes("placeholder")) {
      return [...mockPeriods].sort((a, b) => {
        if (b.year !== a.year) return b.year - a.year;
        return b.month - a.month;
      });
    }
    try {
      const supabase = createClient() as any;
      const { data, error } = await supabase
        .from("inspection_periods")
        .select("*")
        .order("year", { ascending: false })
        .order("month", { ascending: false });

      if (!error && data) return data as InspectionPeriod[];
    } catch (e) {
      // Fallback
    }

    return [...mockPeriods].sort((a, b) => {
      if (b.year !== a.year) return b.year - a.year;
      return b.month - a.month;
    });
  },

  async createPeriod(payload: {
    month: number;
    year: number;
    start_date: string;
    end_date: string;
    name?: string;
  }): Promise<InspectionPeriod> {
    const periodName = payload.name || `Periode ${monthNames[payload.month - 1]} ${payload.year}`;

    try {
      const supabase = createClient() as any;
      const { data, error } = await supabase
        .from("inspection_periods")
        .insert([
          {
            name: periodName,
            year: payload.year,
            month: payload.month,
            start_date: payload.start_date,
            end_date: payload.end_date,
            is_active: false,
            status: "draft",
          },
        ])
        .select()
        .single();

      if (!error && data) return data as InspectionPeriod;
    } catch (e) {
      // Fallback
    }

    const newPeriod: InspectionPeriod = {
      id: `p${Date.now()}`,
      name: periodName,
      year: payload.year,
      month: payload.month,
      start_date: payload.start_date,
      end_date: payload.end_date,
      is_active: false,
      status: "draft",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    mockPeriods.unshift(newPeriod);
    return newPeriod;
  },

  async activatePeriod(id: string): Promise<InspectionPeriod> {
    try {
      const supabase = createClient() as any;

      // 1. Deactivate all existing active periods
      await supabase
        .from("inspection_periods")
        .update({ is_active: false, status: "closed", updated_at: new Date().toISOString() })
        .eq("is_active", true);

      // 2. Set target period as Active
      const { data, error } = await supabase
        .from("inspection_periods")
        .update({ is_active: true, status: "active", updated_at: new Date().toISOString() })
        .eq("id", id)
        .select()
        .single();

      if (!error && data) return data as InspectionPeriod;
    } catch (e) {
      // Fallback
    }

    // Mock fallback single active period enforcement
    mockPeriods.forEach((p) => {
      if (p.is_active) {
        p.is_active = false;
        p.status = "closed";
        p.updated_at = new Date().toISOString();
      }
    });

    const target = mockPeriods.find((p) => p.id === id);
    if (target) {
      target.is_active = true;
      target.status = "active";
      target.updated_at = new Date().toISOString();
      return target;
    }
    throw new Error("Period not found");
  },

  async closePeriod(id: string): Promise<InspectionPeriod> {
    try {
      const supabase = createClient() as any;
      const { data, error } = await supabase
        .from("inspection_periods")
        .update({ is_active: false, status: "closed", updated_at: new Date().toISOString() })
        .eq("id", id)
        .select()
        .single();

      if (!error && data) return data as InspectionPeriod;
    } catch (e) {
      // Fallback
    }

    const target = mockPeriods.find((p) => p.id === id);
    if (target) {
      target.is_active = false;
      target.status = "closed";
      target.updated_at = new Date().toISOString();
      return target;
    }
    throw new Error("Period not found");
  },

  async archivePeriod(id: string): Promise<InspectionPeriod> {
    try {
      const supabase = createClient() as any;
      const { data, error } = await supabase
        .from("inspection_periods")
        .update({ is_active: false, status: "archived", updated_at: new Date().toISOString() })
        .eq("id", id)
        .select()
        .single();

      if (!error && data) return data as InspectionPeriod;
    } catch (e) {
      // Fallback
    }

    const target = mockPeriods.find((p) => p.id === id);
    if (target) {
      target.is_active = false;
      target.status = "archived";
      target.updated_at = new Date().toISOString();
      return target;
    }
    throw new Error("Period not found");
  },
};
