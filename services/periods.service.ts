import { createClient } from "@/lib/supabase/client";
import { createAdminClient } from "@/lib/supabase/admin";
import { InspectionPeriod } from "@/types";

const monthNames = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember"
];

export const periodsService = {
  async getActivePeriod(): Promise<InspectionPeriod | null> {
    try {
      const supabase = createClient() as any;
      const { data, error } = await supabase
        .from("inspection_periods")
        .select("*")
        .eq("is_active", true)
        .single();

      if (!error && data) return data as InspectionPeriod;
    } catch (e) {}

    return null;
  },

  async getAllPeriods(): Promise<InspectionPeriod[]> {
    try {
      const supabase = createClient() as any;
      const { data, error } = await supabase
        .from("inspection_periods")
        .select("*")
        .order("year", { ascending: false })
        .order("month", { ascending: false });

      if (!error && data) return data as InspectionPeriod[];
    } catch (e) {}

    return [];
  },

  async createPeriod(payload: {
    month: number;
    year: number;
    start_date: string;
    end_date: string;
    name?: string;
  }): Promise<InspectionPeriod> {
    const periodName = payload.name || `Periode ${monthNames[payload.month - 1]} ${payload.year}`;
    const insertPayload = {
      name: periodName,
      year: payload.year,
      month: payload.month,
      start_date: payload.start_date,
      end_date: payload.end_date,
      is_active: false,
      status: "draft",
    };

    try {
      const supabase = createClient() as any;
      const { data, error } = await supabase
        .from("inspection_periods")
        .insert([insertPayload])
        .select()
        .single();

      if (!error && data) return data as InspectionPeriod;
    } catch (e) {}

    if (typeof window === "undefined" && process.env.SUPABASE_SERVICE_ROLE_KEY) {
      try {
        const adminSupabase = createAdminClient() as any;
        const { data, error } = await adminSupabase
          .from("inspection_periods")
          .insert([insertPayload])
          .select()
          .single();

        if (!error && data) return data as InspectionPeriod;
      } catch (e) {}
    }

    throw new Error("Gagal membuat periode inspeksi baru di Supabase.");
  },

  async activatePeriod(id: string): Promise<InspectionPeriod> {
    try {
      const supabase = createClient() as any;

      // 1. Deactivate all existing active periods in Supabase DB
      await supabase
        .from("inspection_periods")
        .update({ is_active: false, status: "closed", updated_at: new Date().toISOString() })
        .eq("is_active", true);

      // 2. Set target period as Active in Supabase DB
      const { data, error } = await supabase
        .from("inspection_periods")
        .update({ is_active: true, status: "active", updated_at: new Date().toISOString() })
        .eq("id", id)
        .select()
        .single();

      if (!error && data) return data as InspectionPeriod;
    } catch (e) {}

    if (typeof window === "undefined" && process.env.SUPABASE_SERVICE_ROLE_KEY) {
      try {
        const adminSupabase = createAdminClient() as any;
        await adminSupabase
          .from("inspection_periods")
          .update({ is_active: false, status: "closed", updated_at: new Date().toISOString() })
          .eq("is_active", true);

        const { data, error } = await adminSupabase
          .from("inspection_periods")
          .update({ is_active: true, status: "active", updated_at: new Date().toISOString() })
          .eq("id", id)
          .select()
          .single();

        if (!error && data) return data as InspectionPeriod;
      } catch (e) {}
    }

    throw new Error("Gagal mengaktifkan periode inspeksi di Supabase.");
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
    } catch (e) {}

    throw new Error("Gagal menutup periode inspeksi di Supabase.");
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
    } catch (e) {}

    throw new Error("Gagal mengarsip periode inspeksi di Supabase.");
  },
};
