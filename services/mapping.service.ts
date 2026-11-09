import { tabletsService } from "./tablets.service";
import { usersService } from "./users.service";
import { locationsService } from "./locations.service";
import {
  UserTabletMappingItem,
  UserTabletMappingSummary,
  MappedUserInfo,
  Tablet,
  User,
  Location,
} from "@/types";

export interface MappingFilterParams {
  search?: string;
  locationId?: string;
  userNpk?: string;
  assignmentStatus?: "all" | "assigned" | "unassigned_user" | "unassigned_location";
  sortBy?: "npk" | "qr_code" | "brand" | "model" | "location";
  sortDirection?: "asc" | "desc";
  page?: number;
  limit?: number;
}

export interface MappingResult {
  items: UserTabletMappingItem[];
  total: number;
  page: number;
  totalPages: number;
  summary: UserTabletMappingSummary;
}

export const mappingService = {
  /**
   * Mengambil pemetaan penugasan antara User (PIC) dan Tablet berdasarkan relasi database
   */
  async getMappings(params?: MappingFilterParams): Promise<MappingResult> {
    const page = params?.page || 1;
    const limit = params?.limit || 15;
    const search = params?.search?.trim().toLowerCase() || "";
    const locationId = params?.locationId;
    const userNpk = params?.userNpk;
    const assignmentStatus = params?.assignmentStatus || "all";
    const sortBy = params?.sortBy || "qr_code";
    const sortDirection = params?.sortDirection || "asc";

    try {
      // 1. Ambil data master tablet, user, dan lokasi secara paralel
      const [tabletsRes, usersRes, locationsList] = await Promise.all([
        tabletsService.getTablets({ limit: 1000 }),
        usersService.getUsers({ limit: 1000 }),
        locationsService.getAllLocations(),
      ]);

      const allTablets: Tablet[] = tabletsRes.data || [];
      const allUsers: User[] = usersRes.data || [];

      // Buat dictionary lokasi untuk lookup cepat
      const locationMap = new Map<string, Location>();
      locationsList.forEach((loc) => {
        locationMap.set(loc.id, loc);
      });

      // Filter PIC users aktif yang memiliki NPK
      // Sesuai sistem operasional TabMonitor, PIC/Kepala Regu yang bertanggung jawab memiliki role 'pic'
      // Namun kita juga menyertakan user yang memiliki NPK dan ditugaskan di lokasi penugasan
      const picUsers = allUsers.filter(
        (u) => u.status !== "inactive" && !u.deleted_at && u.npk
      );

      // Kelompokkan user berdasarkan location_id
      const usersByLocation = new Map<string, User[]>();
      picUsers.forEach((u) => {
        if (u.location_id) {
          const list = usersByLocation.get(u.location_id) || [];
          list.push(u);
          usersByLocation.set(u.location_id, list);
        }
      });

      // 2. Hubungkan data penugasan User dan Tablet berdasarkan relasi database:
      // - Tablet memiliki penempatan di `tablets.location_id`
      // - User memiliki penugasan di `users.location_id`
      // - Sesuai logika baru: data dihitung dan dikelompokkan berdasarkan Kode Tablet (1 tablet = 1 baris)
      const mappingItems: UserTabletMappingItem[] = [];

      for (const tablet of allTablets) {
        const tabletLocId = tablet.location_id;
        const loc = tabletLocId ? locationMap.get(tabletLocId) || tablet.location : null;
        const locName = loc?.name || null;
        const locCode = loc?.code || null;

        const assignedUsers = tabletLocId ? usersByLocation.get(tabletLocId) || [] : [];
        const hasUser = assignedUsers.length > 0;
        const hasLocation = !!tabletLocId;

        const mappedUsers: MappedUserInfo[] = assignedUsers.map((u) => ({
          id: u.id,
          npk: u.npk || null,
          name: u.name,
          email: u.email,
          role: u.role,
          department: u.department,
        }));

        // Format user_display_text:
        // Contoh: "11110160 (Handoyo) dan 11010029 ( Untung )"
        let userDisplayText = "";
        if (mappedUsers.length === 1) {
          const u = mappedUsers[0];
          userDisplayText = u.npk ? `${u.npk} (${u.name.trim()})` : u.name.trim();
        } else if (mappedUsers.length === 2) {
          const u1 = mappedUsers[0];
          const u2 = mappedUsers[1];
          const t1 = u1.npk ? `${u1.npk} (${u1.name.trim()})` : u1.name.trim();
          const t2 = u2.npk ? `${u2.npk} (${u2.name.trim()})` : u2.name.trim();
          userDisplayText = `${t1} dan ${t2}`;
        } else if (mappedUsers.length > 2) {
          const parts = mappedUsers.map((u) =>
            u.npk ? `${u.npk} (${u.name.trim()})` : u.name.trim()
          );
          userDisplayText = `${parts.slice(0, -1).join(", ")} dan ${parts[parts.length - 1]}`;
        }

        mappingItems.push({
          id: `map-${tablet.id}`,
          tablet_id: tablet.id,
          qr_code: tablet.qr_code,
          serial_number: tablet.serial_number,
          brand: tablet.brand || "Samsung",
          model: tablet.model,
          tablet_status: tablet.status,
          location_id: tabletLocId || null,
          location_name: locName,
          location_code: locCode,
          users: mappedUsers,
          user_display_text: userDisplayText,
          user_id: mappedUsers.length > 0 ? mappedUsers[0].id : null,
          user_npk: userDisplayText || null,
          user_name: mappedUsers.map((u) => u.name).join(", ") || null,
          user_email: mappedUsers.length > 0 ? mappedUsers[0].email || null : null,
          user_role: mappedUsers.length > 0 ? mappedUsers[0].role || null : null,
          user_department: mappedUsers.length > 0 ? mappedUsers[0].department || null : null,
          has_user: hasUser,
          has_location: hasLocation,
        });
      }

      // 3. Hitung ringkasan (KPI Summary) secara keseluruhan
      const uniqueTabletIds = new Set(allTablets.map((t) => t.id));
      const mappedUserNpks = new Set<string>();
      const mappedLocationIds = new Set<string>();
      let unassignedUserTabletsCount = 0;
      let unassignedLocationTabletsCount = 0;

      for (const tablet of allTablets) {
        if (!tablet.location_id) {
          unassignedLocationTabletsCount++;
          unassignedUserTabletsCount++;
        } else {
          mappedLocationIds.add(tablet.location_id);
          const usersInLoc = usersByLocation.get(tablet.location_id) || [];
          if (usersInLoc.length === 0) {
            unassignedUserTabletsCount++;
          } else {
            usersInLoc.forEach((u) => {
              if (u.npk) mappedUserNpks.add(u.npk);
            });
          }
        }
      }

      const summary: UserTabletMappingSummary = {
        totalTablets: uniqueTabletIds.size,
        totalMappedUsers: mappedUserNpks.size,
        totalMappedLocations: mappedLocationIds.size,
        unassignedUserTablets: unassignedUserTabletsCount,
        unassignedLocationTablets: unassignedLocationTabletsCount,
      };

      // 4. Filter hasil berdasarkan parameter pencarian dan filter
      let filtered = mappingItems;

      // Filter pencarian
      if (search) {
        filtered = filtered.filter((item) => {
          const qr = (item.qr_code || "").toLowerCase();
          const brand = (item.brand || "").toLowerCase();
          const model = (item.model || "").toLowerCase();
          const location = (item.location_name || "").toLowerCase();
          const userDisplayText = (item.user_display_text || "").toLowerCase();
          const userNames = (item.user_name || "").toLowerCase();
          const matchUsers = item.users.some(
            (u) =>
              (u.npk && u.npk.toLowerCase().includes(search)) ||
              (u.name && u.name.toLowerCase().includes(search))
          );

          return (
            qr.includes(search) ||
            brand.includes(search) ||
            model.includes(search) ||
            location.includes(search) ||
            userDisplayText.includes(search) ||
            userNames.includes(search) ||
            matchUsers
          );
        });
      }

      // Filter lokasi
      if (locationId && locationId !== "all") {
        if (locationId === "none") {
          filtered = filtered.filter((item) => !item.location_id);
        } else {
          filtered = filtered.filter((item) => item.location_id === locationId);
        }
      }

      // Filter user NPK (mencari apakah user terdaftar pada tablet ini)
      if (userNpk && userNpk !== "all") {
        if (userNpk === "none") {
          filtered = filtered.filter((item) => !item.has_user || item.users.length === 0);
        } else {
          filtered = filtered.filter((item) =>
            item.users.some((u) => u.npk === userNpk)
          );
        }
      }

      // Filter status penugasan
      if (assignmentStatus && assignmentStatus !== "all") {
        if (assignmentStatus === "assigned") {
          filtered = filtered.filter((item) => item.has_user && item.has_location);
        } else if (assignmentStatus === "unassigned_user") {
          filtered = filtered.filter((item) => !item.has_user);
        } else if (assignmentStatus === "unassigned_location") {
          filtered = filtered.filter((item) => !item.has_location);
        }
      }

      // 5. Pengurutan Data (Sorting)
      filtered.sort((a, b) => {
        let valA = "";
        let valB = "";

        switch (sortBy) {
          case "qr_code":
            valA = a.qr_code || "";
            valB = b.qr_code || "";
            break;
          case "npk":
            valA = a.user_display_text || "ZZZZZZZZ";
            valB = b.user_display_text || "ZZZZZZZZ";
            break;
          case "brand":
            valA = a.brand || "";
            valB = b.brand || "";
            break;
          case "model":
            valA = a.model || "";
            valB = b.model || "";
            break;
          case "location":
            valA = a.location_name || "ZZZZZZZZ";
            valB = b.location_name || "ZZZZZZZZ";
            break;
          default:
            valA = a.qr_code || "";
            valB = b.qr_code || "";
        }

        const cmp = valA.localeCompare(valB, undefined, { numeric: true, sensitivity: "base" });
        return sortDirection === "desc" ? -cmp : cmp;
      });

      // 6. Pagination
      const total = filtered.length;
      const totalPages = Math.ceil(total / limit) || 1;
      const startIndex = (page - 1) * limit;
      const paginatedItems = filtered.slice(startIndex, startIndex + limit);

      return {
        items: paginatedItems,
        total,
        page,
        totalPages,
        summary,
      };
    } catch (err) {
      console.error("mappingService.getMappings error:", err);
      return {
        items: [],
        total: 0,
        page: 1,
        totalPages: 1,
        summary: {
          totalTablets: 0,
          totalMappedUsers: 0,
          totalMappedLocations: 0,
          unassignedUserTablets: 0,
          unassignedLocationTablets: 0,
        },
      };
    }
  },
};
