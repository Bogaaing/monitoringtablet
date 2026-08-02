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

let mockInspections: Inspection[] = [
  {
    id: "ins-001",
    period_id: "31000000-0000-0000-0000-000000000002",
    tablet_id: "21000000-0000-0000-0000-000000000001",
    pic_id: "20000000-0000-0000-0000-000000000002",
    status: "pending",
    tablet_condition: "good",
    charger_condition: "available",
    case_condition: "good",
    battery_pct: 95,
    notes: "Kondisi fisik tablet sangat mulus, layar tanpa lecet, fungsi kamera berjalan normal.",
    submitted_at: new Date(Date.now() - 3600000 * 2).toISOString(),
    created_at: new Date(Date.now() - 3600000 * 2).toISOString(),
    updated_at: new Date(Date.now() - 3600000 * 2).toISOString(),
    tablet: {
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
        address: "Kawasan Industri A1",
        created_at: "",
        updated_at: "",
      },
      status: "active",
      created_at: "",
      updated_at: "",
    },
    pic: {
      id: "20000000-0000-0000-0000-000000000002",
      name: "Ahmad Rizky (Kepala Regu)",
      email: "pic@monitoring.com",
      role: "pic",
      phone: "081298765432",
      created_at: "",
      updated_at: "",
    },
    photos: [
      {
        id: "ph-1",
        inspection_id: "ins-001",
        photo_url: "https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=600&q=80",
        photo_type: "front",
        uploaded_at: new Date().toISOString(),
      },
      {
        id: "ph-2",
        inspection_id: "ins-001",
        photo_url: "https://images.unsplash.com/photo-1561154464-82e9adf32764?w=600&q=80",
        photo_type: "back",
        uploaded_at: new Date().toISOString(),
      },
    ],
  },
];

// Helper functions for client-side status persistence across refreshes
function getLocalOverrides(): Record<string, Partial<Inspection>> {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem("demo_inspections_overrides");
    return raw ? JSON.parse(raw) : {};
  } catch (e) {
    return {};
  }
}

function setLocalOverride(id: string, fields: Partial<Inspection>) {
  if (typeof window === "undefined") return;
  try {
    const existing = getLocalOverrides();
    existing[id] = { ...existing[id], ...fields };
    localStorage.setItem("demo_inspections_overrides", JSON.stringify(existing));
  } catch (e) {}
}

export const inspectionsService = {
  async getInspections(params?: PaginationParams & { status?: string; periodId?: string; picId?: string }): Promise<PaginatedResult<Inspection>> {
    const page = params?.page || 1;
    const limit = params?.limit || 10;
    const status = params?.status;
    const periodId = params?.periodId;
    const picId = params?.picId;

    let list: Inspection[] = [];

    if (!process.env.NEXT_PUBLIC_SUPABASE_URL?.includes("placeholder")) {
      try {
        const supabase = createClient() as any;
        let query = supabase
          .from("inspections")
          .select("*, period:inspection_periods(*), tablet:tablets(*, location:locations(*)), pic:users(*), photos:inspection_photos(*)", { count: "exact" });

        if (periodId) query = query.eq("period_id", periodId);
        if (picId) query = query.eq("pic_id", picId);

        query = query.order("submitted_at", { ascending: false });

        const { data, error } = await query;
        if (!error && data) {
          list = data as unknown as Inspection[];
        }
      } catch (e) {
        // Fallback
      }
    }

    if (list.length === 0) {
      list = [...mockInspections];
    }

    // Apply local storage overrides to ensure persistent status across refreshes
    const overrides = getLocalOverrides();
    list = list.map((item) => {
      if (overrides[item.id]) {
        return { ...item, ...overrides[item.id] };
      }
      return item;
    });

    if (status && status !== "all") {
      list = list.filter((i) => i.status === status);
    }
    if (periodId) {
      list = list.filter((i) => i.period_id === periodId);
    }
    if (picId) {
      list = list.filter((i) => i.pic_id === picId);
    }

    const total = list.length;
    const totalPages = Math.ceil(total / limit) || 1;
    const start = (page - 1) * limit;
    const paginatedData = list.slice(start, start + limit);

    return {
      data: paginatedData,
      total,
      page,
      totalPages,
    };
  },

  async getInspectionById(id: string): Promise<Inspection | null> {
    let item: Inspection | null = null;
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL?.includes("placeholder")) {
      try {
        const supabase = createClient() as any;
        const { data, error } = await supabase
          .from("inspections")
          .select("*, period:inspection_periods(*), tablet:tablets(*, location:locations(*)), pic:users(*), reviewer:users(*), photos:inspection_photos(*)")
          .eq("id", id)
          .single();

        if (!error && data) item = data as unknown as Inspection;
      } catch (e) {
        // Fallback
      }
    }

    if (!item) {
      item = mockInspections.find((i) => i.id === id) || null;
    }

    if (item) {
      const overrides = getLocalOverrides();
      if (overrides[item.id]) {
        item = { ...item, ...overrides[item.id] };
      }
    }

    return item;
  },

  async checkTabletInspectedInPeriod(tabletId: string, periodId: string): Promise<Inspection | null> {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL?.includes("placeholder")) {
      try {
        const supabase = createClient() as any;
        const { data, error } = await supabase
          .from("inspections")
          .select("*, period:inspection_periods(*), tablet:tablets(*, location:locations(*)), photos:inspection_photos(*)")
          .eq("tablet_id", tabletId)
          .eq("period_id", periodId)
          .single();

        if (!error && data) return data as unknown as Inspection;
      } catch (e) {
        // Fallback
      }
    }

    const item = mockInspections.find(
      (i) => i.tablet_id === tabletId && i.period_id === periodId
    );

    if (item) {
      const overrides = getLocalOverrides();
      if (overrides[item.id]) {
        return { ...item, ...overrides[item.id] };
      }
    }

    return item || null;
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
    const inspectionId = `ins-${Date.now()}`;
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
        id: `ph-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        inspection_id: inspectionId,
        photo_url: uploadRes.publicUrl,
        photo_type: photo.type,
        uploaded_at: new Date().toISOString(),
      });
    }

    const newInspection: Inspection = {
      id: inspectionId,
      period_id: payload.period_id,
      tablet_id: payload.tablet_id,
      pic_id: payload.pic_id,
      status: "pending",
      tablet_condition: payload.tablet_condition,
      charger_condition: payload.charger_condition,
      case_condition: payload.case_condition,
      battery_pct: payload.battery_pct,
      notes: payload.notes,
      gps_lat: payload.gps_lat,
      gps_lng: payload.gps_lng,
      submitted_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      photos: uploadedPhotos,
    };

    if (!process.env.NEXT_PUBLIC_SUPABASE_URL?.includes("placeholder")) {
      try {
        const supabase = createClient() as any;
        const { data, error } = await supabase
          .from("inspections")
          .insert({
            id: newInspection.id,
            period_id: newInspection.period_id,
            tablet_id: newInspection.tablet_id,
            pic_id: newInspection.pic_id,
            status: newInspection.status,
            tablet_condition: newInspection.tablet_condition,
            charger_condition: newInspection.charger_condition,
            case_condition: newInspection.case_condition,
            battery_pct: newInspection.battery_pct,
            notes: newInspection.notes,
            gps_lat: newInspection.gps_lat,
            gps_lng: newInspection.gps_lng,
            submitted_at: newInspection.submitted_at,
          })
          .select("*, photos:inspection_photos(*)")
          .single();

        if (!error && data) {
          // Insert photos metadata into database
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
      } catch (e) {
        // Fallback
      }
    }

    mockInspections.unshift(newInspection);
    return newInspection;
  },

  async reviewInspection(
    id: string,
    reviewerId: string,
    status: "approved" | "rejected",
    rejectionReason?: string
  ): Promise<Inspection> {
    const updatedFields: Partial<Inspection> = {
      status,
      reviewer_id: reviewerId,
      reviewed_at: new Date().toISOString(),
      rejection_reason: status === "rejected" ? rejectionReason || "" : null,
      updated_at: new Date().toISOString(),
    };

    // 1. Always persist status change in local storage so status is retained across page refreshes
    setLocalOverride(id, updatedFields);

    // 2. Try Supabase Client
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL?.includes("placeholder")) {
      try {
        const supabase = createClient() as any;
        const { data, error } = await supabase
          .from("inspections")
          .update(updatedFields)
          .eq("id", id)
          .select("*, photos:inspection_photos(*)")
          .single();

        if (!error && data) {
          return { ...data, ...updatedFields } as unknown as Inspection;
        }
      } catch (e) {
        // Fallback below
      }

      // Try Admin Supabase Client if regular client failed RLS
      if (typeof window === "undefined" && process.env.SUPABASE_SERVICE_ROLE_KEY) {
        try {
          const adminSupabase = createAdminClient() as any;
          const { data, error } = await adminSupabase
            .from("inspections")
            .update(updatedFields)
            .eq("id", id)
            .select("*, photos:inspection_photos(*)")
            .single();

          if (!error && data) {
            return { ...data, ...updatedFields } as unknown as Inspection;
          }
        } catch (e) {}
      }
    }

    // 3. Update in-memory mockInspections
    const index = mockInspections.findIndex((i) => i.id === id);
    if (index !== -1) {
      mockInspections[index] = {
        ...mockInspections[index],
        ...updatedFields,
      };
      return mockInspections[index];
    }

    return {
      id,
      period_id: "",
      tablet_id: "",
      pic_id: "",
      submitted_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
      ...updatedFields,
    } as Inspection;
  },
};
