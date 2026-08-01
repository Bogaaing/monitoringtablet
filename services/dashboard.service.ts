import { tabletsService } from "./tablets.service";
import { usersService } from "./users.service";
import { locationsService } from "./locations.service";
import { periodsService } from "./periods.service";
import { inspectionsService, Inspection } from "./inspections.service";

export interface AdminDashboardStats {
  totalTablets: number;
  totalUsers: number;
  totalLocations: number;
  damagedTablets: number;
  completedInspections: number;
  progressPercentage: number;
  activePeriodName: string;
}

export interface PicDashboardStats {
  assignedTabletsCount: number;
  completedCount: number;
  remainingCount: number;
  progressPercentage: number;
  recentInspections: Inspection[];
}

export interface LocationProgressData {
  locationName: string;
  completed: number;
  pending: number;
  total: number;
}

export interface ManagerDashboardStats {
  waitingApprovalCount: number;
  approvedCount: number;
  rejectedCount: number;
  totalSubmittedCount: number;
  locationProgress: LocationProgressData[];
  statusDistribution: { name: string; value: number; color: string }[];
  recentInspections: Inspection[];
}

export const dashboardService = {
  async getAdminStats(): Promise<AdminDashboardStats> {
    const [tabletsRes, usersRes, locationsRes, activePeriod, inspectionsRes] =
      await Promise.all([
        tabletsService.getTablets({ limit: 100 }),
        usersService.getUsers({ limit: 100 }),
        locationsService.getAllLocations(),
        periodsService.getActivePeriod(),
        inspectionsService.getInspections({ limit: 100 }),
      ]);

    const tablets = tabletsRes.data;
    const damagedTablets = tablets.filter(
      (t) => t.status === "maintenance" || t.status === "inactive"
    ).length;

    const totalTablets = tablets.length;
    const completedInspections = inspectionsRes.data.length;
    const progressPercentage =
      totalTablets > 0
        ? Math.min(100, Math.round((completedInspections / totalTablets) * 100))
        : 0;

    return {
      totalTablets,
      totalUsers: usersRes.data.length,
      totalLocations: locationsRes.length,
      damagedTablets,
      completedInspections,
      progressPercentage,
      activePeriodName: activePeriod ? activePeriod.name : "Tidak Ada Periode",
    };
  },

  async getPicStats(picId?: string): Promise<PicDashboardStats> {
    const [tabletsRes, inspectionsRes] = await Promise.all([
      tabletsService.getTablets({ limit: 100 }),
      inspectionsService.getInspections({ picId, limit: 10 }),
    ]);

    const totalTablets = tabletsRes.data.length;
    const completedCount = inspectionsRes.total;
    const remainingCount = Math.max(0, totalTablets - completedCount);
    const progressPercentage =
      totalTablets > 0
        ? Math.min(100, Math.round((completedCount / totalTablets) * 100))
        : 0;

    return {
      assignedTabletsCount: totalTablets,
      completedCount,
      remainingCount,
      progressPercentage,
      recentInspections: inspectionsRes.data,
    };
  },

  async getManagerStats(): Promise<ManagerDashboardStats> {
    const [inspectionsRes, locations] = await Promise.all([
      inspectionsService.getInspections({ limit: 100 }),
      locationsService.getAllLocations(),
    ]);

    const inspections = inspectionsRes.data;
    const waitingApprovalCount = inspections.filter(
      (i) => i.status === "pending"
    ).length;
    const approvedCount = inspections.filter(
      (i) => i.status === "approved"
    ).length;
    const rejectedCount = inspections.filter(
      (i) => i.status === "rejected"
    ).length;

    // Location progress aggregation
    const locationMap = new Map<string, { completed: number; pending: number; total: number }>();
    locations.forEach((loc) => {
      locationMap.set(loc.name, { completed: 0, pending: 0, total: 0 });
    });

    inspections.forEach((ins) => {
      const locName = ins.tablet?.location?.name || "Lainnya";
      const current = locationMap.get(locName) || { completed: 0, pending: 0, total: 0 };
      current.total += 1;
      if (ins.status === "approved") {
        current.completed += 1;
      } else {
        current.pending += 1;
      }
      locationMap.set(locName, current);
    });

    const locationProgress: LocationProgressData[] = Array.from(
      locationMap.entries()
    ).map(([locationName, stats]) => ({
      locationName,
      completed: stats.completed,
      pending: stats.pending,
      total: stats.total || 1,
    }));

    const statusDistribution = [
      { name: "Menunggu Approval", value: waitingApprovalCount || 1, color: "#f59e0b" },
      { name: "Disetujui (Approved)", value: approvedCount || 2, color: "#10b981" },
      { name: "Ditolak (Rejected)", value: rejectedCount || 0, color: "#f43f5e" },
    ];

    return {
      waitingApprovalCount,
      approvedCount,
      rejectedCount,
      totalSubmittedCount: inspections.length,
      locationProgress,
      statusDistribution,
      recentInspections: inspections.slice(0, 5),
    };
  },
};
