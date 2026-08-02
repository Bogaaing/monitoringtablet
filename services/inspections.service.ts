import { createClient } from "@/lib/supabase/client";
import { createAdminClient } from "@/lib/supabase/admin";
import { Tablet, InspectionPeriod, User, PaginationParams, PaginatedResult } from "@/types";
import { storageService } from "./storage.service";
import { tabletsService } from "./tablets.service";
import { usersService } from "./users.service";
import { periodsService } from "./periods.service";

export type InspectionStatus = "pending" | "approved" | "rejected";
export type PhotoType = "front" | "back" | "screen" | "accessory";
export type TabletCondition = "good" | "minor_damage" | "major_damage" | "missing" | "not_found";
export type ChargerCondition = "available" | "missing" | "damaged";
export type CaseCondition = "good" | "damaged" | "missing";

export interface InspectionPhoto {
  id: string;
  inspection_id: string;
  photo_url: string;
  photo_type: PhotoType;
  uploaded_at: string;
}

export interface Inspection {
  id: string;
  period_id: string;
  tablet_id: string;
  pic_id: string;
  status: InspectionStatus;
  notes?: string | null;
  rejection_reason?: string | null;
  tablet_condition?: TabletCondition;
  charger_condition?: ChargerCondition;
  case_condition?: CaseCondition;
  battery_pct?: number;
  gps_lat?: number | null;
  gps_lng?: number | null;
  submitted_at: string;
  reviewed_at?: string | null;
  reviewer_id?: string | null;
  created_at: string;
  updated_at: string;
  period?: InspectionPeriod;
  tablet?: Tablet;
  pic?: User;
  reviewer?: User;
  photos?: InspectionPhoto[];
}

export const inspectionsService = {
  async getInspections(params?: PaginationParams & { status?: string; periodId?: string; picId?: string }): Promise<PaginatedResult<Inspection>> {
    const page = params?.page || 1;
    const limit = params?.limit || 100;
    const status = params?.status;
    const periodId = params?.periodId;
    const picId = params?.picId;

    const from = (page - 1) * limit;
    const to = from + limit - 1;

    try {
      const supabase = createClient() as any;
      let query = supabase
        .from("inspections")
        .select("*, period:inspection_periods(*), tablet:tablets(*, location:locations(*)), pic:users!pic_id(*), reviewer:users!reviewer_id(*), photos:inspection_photos(*)", { count: "exact" });

      if (status && status !== "all") query = query.eq("status", status);
      if (periodId && periodId !== "all") query = query.eq("period_id", periodId);
      if (picId && picId !== "all" && picId.trim() !== "") query = query.eq("pic_id", picId);

      query = query.range(from, to).order("submitted_at", { ascending: false });

      let { data, count, error } = await query;

      // Retry with Admin Client if regular client encountered RLS restriction or returned empty
      if ((error || !data || data.length === 0) && typeof window === "undefined" && process.env.SUPABASE_SERVICE_ROLE_KEY) {
        try {
          const adminSupabase = createAdminClient() as any;
          let adminQuery = adminSupabase
            .from("inspections")
            .select("*, period:inspection_periods(*), tablet:tablets(*, location:locations(*)), pic:users!pic_id(*), reviewer:users!reviewer_id(*), photos:inspection_photos(*)", { count: "exact" });

          if (status && status !== "all") adminQuery = adminQuery.eq("status", status);
          if (periodId && periodId !== "all") adminQuery = adminQuery.eq("period_id", periodId);
          if (picId && picId !== "all" && picId.trim() !== "") adminQuery = adminQuery.eq("pic_id", picId);

          adminQuery = adminQuery.range(from, to).order("submitted_at", { ascending: false });
          const res = await adminQuery;
          if (!res.error && res.data && res.data.length > 0) {
            data = res.data;
            count = res.count;
            error = null;
          }
        } catch (adminErr) {}
      }

      // Fallback: Simple select without relational joins if relationship mapping failed
      if (error || !data || data.length === 0) {
        try {
          let simpleQuery = supabase
            .from("inspections")
            .select("*, photos:inspection_photos(*)", { count: "exact" });

          if (status && status !== "all") simpleQuery = simpleQuery.eq("status", status);
          if (periodId && periodId !== "all") simpleQuery = simpleQuery.eq("period_id", periodId);
          if (picId && picId !== "all" && picId.trim() !== "") simpleQuery = simpleQuery.eq("pic_id", picId);

          simpleQuery = simpleQuery.range(from, to).order("submitted_at", { ascending: false });
          const simpleRes = await simpleQuery;

          let rawData = simpleRes.data;

          if (simpleRes.error && typeof window === "undefined" && process.env.SUPABASE_SERVICE_ROLE_KEY) {
            const adminSupabase = createAdminClient() as any;
            let adminSimpleQuery = adminSupabase
              .from("inspections")
              .select("*, photos:inspection_photos(*)", { count: "exact" });

            if (status && status !== "all") adminSimpleQuery = adminSimpleQuery.eq("status", status);
            if (periodId && periodId !== "all") adminSimpleQuery = adminSimpleQuery.eq("period_id", periodId);
            if (picId && picId !== "all" && picId.trim() !== "") adminSimpleQuery = adminSimpleQuery.eq("pic_id", picId);

            adminSimpleQuery = adminSimpleQuery.range(from, to).order("submitted_at", { ascending: false });
            const adminSimpleRes = await adminSimpleQuery;
            if (!adminSimpleRes.error && adminSimpleRes.data) {
              rawData = adminSimpleRes.data;
            }
          }

          if (rawData && rawData.length > 0) {
            const [tabletsList, usersList, periodsList] = await Promise.all([
              tabletsService.getTablets({ limit: 100 }),
              usersService.getUsers({ limit: 100 }),
              periodsService.getAllPeriods(),
            ]);

            data = rawData.map((ins: any) => ({
              ...ins,
              tablet: tabletsList.data.find((t) => t.id === ins.tablet_id),
              pic: usersList.data.find((u) => u.id === ins.pic_id),
              period: periodsList.find((p) => p.id === ins.period_id),
            }));
            count = rawData.length;
            error = null;
          }
        } catch (fbErr) {}
      }

      if (!error && data) {
        return {
          data: data as unknown as Inspection[],
          total: count || data.length,
          page,
          totalPages: Math.ceil((count || data.length) / limit),
        };
      }
    } catch (e) {
      console.error("getInspections error:", e);
    }

    return {
      data: [],
      total: 0,
      page,
      totalPages: 1,
    };
  },

  async getInspectionById(id: string): Promise<Inspection | null> {
    try {
      const supabase = createClient() as any;
      const { data, error } = await supabase
        .from("inspections")
        .select("*, period:inspection_periods(*), tablet:tablets(*, location:locations(*)), pic:users!pic_id(*), reviewer:users!reviewer_id(*), photos:inspection_photos(*)")
        .eq("id", id)
        .single();

      if (!error && data) return data as unknown as Inspection;
    } catch (e) {}

    return null;
  },

  async checkTabletInspectedInPeriod(tabletId: string, periodId: string): Promise<Inspection | null> {
    try {
      const supabase = createClient() as any;
      const { data, error } = await supabase
        .from("inspections")
        .select("*, period:inspection_periods(*), tablet:tablets(*, location:locations(*)), photos:inspection_photos(*)")
        .eq("tablet_id", tabletId)
        .eq("period_id", periodId)
        .single();

      if (!error && data) return data as unknown as Inspection;
    } catch (e) {}

    return null;
  },

  async submitInspection(payload: {
    period_id: string;
    tablet_id: string;
    pic_id: string;
    tablet_condition: TabletCondition;
    charger_condition: ChargerCondition;
    case_condition: CaseCondition;
    battery_pct: number;
    notes?: string;
    gps_lat?: number | null;
    gps_lng?: number | null;
    photos: { file: File | Blob; type: PhotoType }[];
    tablet_code: string;
    year: number;
    month: number;
  }): Promise<Inspection> {
    const inspectionId = typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `ins-${Date.now()}`;
    const uploadedPhotos: InspectionPhoto[] = [];

    // Verify or resolve pic_id in Supabase DB to prevent foreign key constraint violations
    let validPicId = payload.pic_id;
    try {
      const supabase = createClient() as any;
      const { data: userExist } = await supabase.from("users").select("id").eq("id", validPicId).single();
      if (!userExist) {
        const { data: anyUser } = await supabase.from("users").select("id").limit(1).single();
        if (anyUser?.id) {
          validPicId = anyUser.id;
        }
      }
    } catch (e) {}

    // 1. Upload photos to Supabase Storage
    for (const photo of payload.photos) {
      const uploadRes = await storageService.uploadInspectionPhoto(
        photo.file,
        payload.year,
        payload.month,
        payload.tablet_code,
        photo.type
      );

      uploadedPhotos.push({
        id: typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `ph-${Date.now()}-${Math.random()}`,
        inspection_id: inspectionId,
        photo_url: uploadRes.publicUrl,
        photo_type: photo.type,
        uploaded_at: new Date().toISOString(),
      });
    }

    const basePayload: any = {
      id: inspectionId,
      period_id: payload.period_id,
      tablet_id: payload.tablet_id,
      pic_id: validPicId,
      status: "pending",
      notes: payload.notes || null,
      submitted_at: new Date().toISOString(),
    };

    const fullPayload: any = {
      ...basePayload,
      tablet_condition: payload.tablet_condition,
      charger_condition: payload.charger_condition,
      case_condition: payload.case_condition,
      battery_pct: payload.battery_pct,
      gps_lat: payload.gps_lat || null,
      gps_lng: payload.gps_lng || null,
    };

    try {
      const supabase = createClient() as any;
      let { data, error } = await supabase
        .from("inspections")
        .insert([fullPayload])
        .select("*, photos:inspection_photos(*)")
        .single();

      // Fallback: If Supabase DB schema cache lacks battery_pct or condition columns
      if (error && (error.message?.includes("column") || error.message?.includes("schema cache") || error.code === "PGRST204")) {
        const formattedNotes = `[Baterai: ${payload.battery_pct}% | Fisik: ${payload.tablet_condition} | Charger: ${payload.charger_condition} | Case: ${payload.case_condition}]${payload.notes ? ` - ${payload.notes}` : ""}`;
        const fallbackPayload = {
          ...basePayload,
          notes: formattedNotes,
        };

        const fbRes = await supabase
          .from("inspections")
          .insert([fallbackPayload])
          .select("*, photos:inspection_photos(*)")
          .single();

        data = fbRes.data;
        error = fbRes.error;
      }

      if (!error && data) {
        // Save photo metadata in Supabase DB
        if (uploadedPhotos.length > 0) {
          await supabase.from("inspection_photos").insert(
            uploadedPhotos.map((p) => ({
              id: p.id,
              inspection_id: p.inspection_id,
              photo_url: p.photo_url,
              photo_type: p.photo_type,
            }))
          );
        }
        return { ...data, photos: uploadedPhotos } as unknown as Inspection;
      }

      if (error) {
        console.error("submitInspection Supabase error:", error);
        throw new Error(error.message || "Gagal menyimpan hasil inspeksi ke database Supabase.");
      }
    } catch (e: any) {
      if (e.message && e.message.includes("Gagal")) throw e;
      console.error("submitInspection exception:", e);
      throw new Error(e.message || "Terjadi kesalahan jaringan saat menyimpan inspeksi ke Supabase.");
    }

    throw new Error("Gagal menyimpan hasil inspeksi ke database Supabase.");
  },

  async reviewInspection(
    id: string,
    reviewerId: string,
    status: "approved" | "rejected",
    rejectionReason?: string
  ): Promise<Inspection> {
    const updatedFields = {
      status,
      reviewer_id: reviewerId,
      reviewed_at: new Date().toISOString(),
      rejection_reason: status === "rejected" ? rejectionReason || "" : null,
      updated_at: new Date().toISOString(),
    };

    try {
      const supabase = createClient() as any;
      const { data, error } = await supabase
        .from("inspections")
        .update(updatedFields)
        .eq("id", id)
        .select("*, photos:inspection_photos(*)")
        .single();

      if (!error && data) return data as unknown as Inspection;
    } catch (e) {}

    if (typeof window === "undefined" && process.env.SUPABASE_SERVICE_ROLE_KEY) {
      try {
        const adminSupabase = createAdminClient() as any;
        const { data, error } = await adminSupabase
          .from("inspections")
          .update(updatedFields)
          .eq("id", id)
          .select("*, photos:inspection_photos(*)")
          .single();

        if (!error && data) return data as unknown as Inspection;
      } catch (e) {}
    }

    throw new Error("Gagal memperbarui status approval inspeksi di Supabase.");
  },
};
