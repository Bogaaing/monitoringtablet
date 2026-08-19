import { tabletsService } from "./tablets.service";
import { usersService } from "./users.service";
import { locationsService } from "./locations.service";
import { periodsService } from "./periods.service";
import { inspectionsService, Inspection } from "./inspections.service";

export interface AdminDashboardStats {
  totalTablets: number;
  activeTablets: number;
  damagedTablets: number;
  totalUsers: number;
  totalLocations: number;
  activePeriodName: string;
  completedInspections: number;
  pendingInspections: number;
  rejectedInspections: number;
  totalInspections: number;
  progressPercentage: number;
  locationProgress: LocationProgressData[];
  recentInspections: Inspection[];
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
  rejected: number;
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
        tabletsService.getTablets({ limit: 500 }),
        usersService.getUsers({ limit: 500 }),
        locationsService.getAllLocations(),
        periodsService.getActivePeriod(),
        inspectionsService.getInspections({ limit: 500 }),
      ]);

    const tablets = tabletsRes.data;
    const inspections = inspectionsRes.data;
    const locations = locationsRes;

    const damagedTablets = tablets.filter(
      (t) => t.status === "maintenance" || t.status === "inactive" || t.status === "lost"
    ).length;
    const activeTablets = tablets.filter((t) => t.status === "active").length;

    const completedInspections = inspections.filter((i) => i.status === "approved").length;
    const pendingInspections = inspections.filter((i) => i.status === "pending").length;
    const rejectedInspections = inspections.filter((i) => i.status === "rejected").length;
    const totalTablets = tablets.length;

    const progressPercentage =
      totalTablets > 0
        ? Math.min(100, Math.round((completedInspections / totalTablets) * 100))
        : 0;

    // Location progress aggregation for Admin chart
    const locationMap = new Map<string, { completed: number; pending: number; rejected: number; total: number }>();
    locations.forEach((loc) => {
      locationMap.set(loc.name, { completed: 0, pending: 0, rejected: 0, total: 0 });
    });

    inspections.forEach((ins) => {
      const locName = ins.tablet?.location?.name || "Lainnya";
      const current = locationMap.get(locName) || { completed: 0, pending: 0, rejected: 0, total: 0 };
      current.total += 1;
      if (ins.status === "approved") {
        current.completed += 1;
      } else if (ins.status === "pending") {
        current.pending += 1;
      } else if (ins.status === "rejected") {
        current.rejected += 1;
      }
      locationMap.set(locName, current);
    });

    const locationProgress: LocationProgressData[] = Array.from(
      locationMap.entries()
    ).map(([locationName, stats]) => ({
      locationName,
      completed: stats.completed,
      pending: stats.pending,
      rejected: stats.rejected,
      total: stats.total || 0,
    }));

    return {
      totalTablets,
      activeTablets,
      damagedTablets,
      totalUsers: usersRes.data.length,
      totalLocations: locations.length,
      activePeriodName: activePeriod ? activePeriod.name : "Periode Aktif",
      completedInspections,
      pendingInspections,
      rejectedInspections,
      totalInspections: inspections.length,
      progressPercentage,
      locationProgress,
      recentInspections: inspections.slice(0, 6),
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
    const locationMap = new Map<string, { completed: number; pending: number; rejected: number; total: number }>();
    locations.forEach((loc) => {
      locationMap.set(loc.name, { completed: 0, pending: 0, rejected: 0, total: 0 });
    });

    inspections.forEach((ins) => {
      const locName = ins.tablet?.location?.name || "Lainnya";
      const current = locationMap.get(locName) || { completed: 0, pending: 0, rejected: 0, total: 0 };
      current.total += 1;
      if (ins.status === "approved") {
        current.completed += 1;
      } else if (ins.status === "pending") {
        current.pending += 1;
      } else if (ins.status === "rejected") {
        current.rejected += 1;
      }
      locationMap.set(locName, current);
    });

    const locationProgress: LocationProgressData[] = Array.from(
      locationMap.entries()
    ).map(([locationName, stats]) => ({
      locationName,
      completed: stats.completed,
      pending: stats.pending,
      rejected: stats.rejected,
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
