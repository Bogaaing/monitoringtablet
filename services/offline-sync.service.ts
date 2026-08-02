import { inspectionsService } from "./inspections.service";

export interface OfflineInspectionPayload {
  id: string;
  period_id: string;
  tablet_id: string;
  pic_id: string;
  tablet_condition: any;
  charger_condition: any;
  case_condition: any;
  battery_pct: number;
  notes?: string;
  gps_lat?: number | null;
  gps_lng?: number | null;
  photos: { file: File | Blob; type: any }[];
  tablet_code: string;
  year: number;
  month: number;
  saved_at: string;
  sync_status: "pending" | "synced" | "failed";
}

const STORAGE_KEY = "tabmonitor_offline_inspections";

export const offlineSyncService = {
  getPending(): OfflineInspectionPayload[] {
    if (typeof window === "undefined") return [];
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      return [];
    }
  },

  saveOffline(payload: Omit<OfflineInspectionPayload, "id" | "saved_at" | "sync_status">): OfflineInspectionPayload {
    const list = this.getPending();
    const newItem: OfflineInspectionPayload = {
      ...payload,
      id: `off-${Date.now()}-${Math.random()}`,
      saved_at: new Date().toISOString(),
      sync_status: "pending",
    };

    list.push(newItem);
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
      } catch (e) {}
    }
    return newItem;
  },

  async syncAll(): Promise<{ successCount: number; failedCount: number }> {
    if (typeof window === "undefined" || !navigator.onLine) {
      return { successCount: 0, failedCount: 0 };
    }

    const list = this.getPending();
    if (list.length === 0) return { successCount: 0, failedCount: 0 };

    let successCount = 0;
    let failedCount = 0;
    const remaining: OfflineInspectionPayload[] = [];

    for (const item of list) {
      try {
        await inspectionsService.submitInspection({
          period_id: item.period_id,
          tablet_id: item.tablet_id,
          pic_id: item.pic_id,
          tablet_condition: item.tablet_condition,
          charger_condition: item.charger_condition,
          case_condition: item.case_condition,
          battery_pct: item.battery_pct,
          notes: item.notes,
          gps_lat: item.gps_lat,
          gps_lng: item.gps_lng,
          photos: item.photos || [],
          tablet_code: item.tablet_code,
          year: item.year,
          month: item.month,
        });
        successCount++;
      } catch (e) {
        failedCount++;
        remaining.push({ ...item, sync_status: "failed" });
      }
    }

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(remaining));
    } catch (e) {}

    return { successCount, failedCount };
  },

  clearAll(): void {
    if (typeof window !== "undefined") {
      localStorage.removeItem(STORAGE_KEY);
    }
  },
};
