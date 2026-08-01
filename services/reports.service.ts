import { tabletsService } from "./tablets.service";
import { locationsService } from "./locations.service";
import { periodsService } from "./periods.service";
import { inspectionsService, Inspection } from "./inspections.service";
import { Tablet } from "@/types";

export interface ReportFilterOptions {
  periodId?: string;
  locationId?: string;
  picId?: string;
  status?: string;
}

export interface InspectionSummaryData {
  locationName: string;
  totalTablets: number;
  completed: number;
  pending: number;
  completionRate: number;
}

export interface ApprovalSummaryData {
  totalSubmitted: number;
  approvedCount: number;
  rejectedCount: number;
  pendingCount: number;
  approvalRate: number;
}

export const reportsService = {
  async getInspectionSummary(filters?: ReportFilterOptions): Promise<InspectionSummaryData[]> {
    const [locations, tabletsRes, inspectionsRes] = await Promise.all([
      locationsService.getAllLocations(),
      tabletsService.getTablets({ limit: 100 }),
      inspectionsService.getInspections({ limit: 100, periodId: filters?.periodId, picId: filters?.picId, status: filters?.status }),
    ]);

    let tablets = tabletsRes.data;
    if (filters?.locationId && filters.locationId !== "all") {
      tablets = tablets.filter((t) => t.location_id === filters.locationId);
    }

    const inspections = inspectionsRes.data;

    return locations
      .filter((loc) => (filters?.locationId && filters.locationId !== "all" ? loc.id === filters.locationId : true))
      .map((loc) => {
        const locTablets = tablets.filter((t) => t.location_id === loc.id);
        const locInspections = inspections.filter((i) => i.tablet?.location_id === loc.id);
        const completed = locInspections.length;
        const totalTablets = locTablets.length || 1;
        const pending = Math.max(0, totalTablets - completed);
        const completionRate = Math.round((completed / totalTablets) * 100);

        return {
          locationName: loc.name,
          totalTablets,
          completed,
          pending,
          completionRate: Math.min(100, completionRate),
        };
      });
  },

  async getDamagedTablets(filters?: ReportFilterOptions): Promise<Tablet[]> {
    const res = await tabletsService.getTablets({ limit: 100, locationId: filters?.locationId });
    return res.data.filter((t) => t.status === "maintenance" || t.status === "inactive");
  },

  async getApprovalSummary(filters?: ReportFilterOptions): Promise<ApprovalSummaryData> {
    const res = await inspectionsService.getInspections({
      limit: 100,
      periodId: filters?.periodId,
      picId: filters?.picId,
      status: filters?.status,
    });
    const list = res.data;

    const totalSubmitted = list.length;
    const approvedCount = list.filter((i) => i.status === "approved").length;
    const rejectedCount = list.filter((i) => i.status === "rejected").length;
    const pendingCount = list.filter((i) => i.status === "pending").length;
    const approvalRate = totalSubmitted > 0 ? Math.round((approvedCount / totalSubmitted) * 100) : 0;

    return {
      totalSubmitted,
      approvedCount,
      rejectedCount,
      pendingCount,
      approvalRate,
    };
  },

  async getInspectionHistory(filters?: ReportFilterOptions): Promise<Inspection[]> {
    const res = await inspectionsService.getInspections({
      limit: 100,
      periodId: filters?.periodId,
      picId: filters?.picId,
      status: filters?.status,
    });
    return res.data;
  },
};
