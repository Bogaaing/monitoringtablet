import { createClient } from "@/lib/supabase/client";
import { createAdminClient } from "@/lib/supabase/admin";
import { Tablet, InspectionPeriod, User, PaginationParams, PaginatedResult } from "@/types";
import { storageService } from "./storage.service";

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
    const limit = params?.limit || 10;
    const status = params?.status;
    const periodId = params?.periodId;
    const picId = params?.picId;

    const from = (page - 1) * limit;
    const to = from + limit - 1;

    try {
      const supabase = createClient() as any;
      let query = supabase
        .from("inspections")
        .select("*, period:inspection_periods(*), tablet:tablets(*, location:locations(*)), pic:users(*), reviewer:users(*), photos:inspection_photos(*)", { count: "exact" });

      if (status && status !== "all") query = query.eq("status", status);
      if (periodId) query = query.eq("period_id", periodId);
      if (picId) query = query.eq("pic_id", picId);

      query = query.range(from, to).order("submitted_at", { ascending: false });

      const { data, count, error } = await query;
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
        .select("*, period:inspection_periods(*), tablet:tablets(*, location:locations(*)), pic:users(*), reviewer:users(*), photos:inspection_photos(*)")
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

    const insertPayload = {
      id: inspectionId,
      period_id: payload.period_id,
      tablet_id: payload.tablet_id,
      pic_id: payload.pic_id,
      status: "pending",
      tablet_condition: payload.tablet_condition,
      charger_condition: payload.charger_condition,
      case_condition: payload.case_condition,
      battery_pct: payload.battery_pct,
      notes: payload.notes || null,
      gps_lat: payload.gps_lat || null,
      gps_lng: payload.gps_lng || null,
      submitted_at: new Date().toISOString(),
    };

    try {
      const supabase = createClient() as any;
      const { data, error } = await supabase
        .from("inspections")
        .insert([insertPayload])
        .select("*, photos:inspection_photos(*)")
        .single();

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
    } catch (e) {}

    if (typeof window === "undefined" && process.env.SUPABASE_SERVICE_ROLE_KEY) {
      try {
        const adminSupabase = createAdminClient() as any;
        const { data, error } = await adminSupabase
          .from("inspections")
          .insert([insertPayload])
          .select("*, photos:inspection_photos(*)")
          .single();

        if (!error && data) {
          if (uploadedPhotos.length > 0) {
            await adminSupabase.from("inspection_photos").insert(
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
      } catch (e) {}
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
