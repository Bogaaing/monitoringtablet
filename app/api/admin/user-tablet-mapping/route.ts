import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { mappingService, MappingFilterParams } from "@/services/mapping.service";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const demoRole = cookieStore.get("demo_role")?.value;
    const userNpk = cookieStore.get("user_npk")?.value;

    let userRole: string | null = null;

    // 1. Check direct NPK role mapping
    if (userNpk === "11130000") {
      userRole = "admin";
    } else if (userNpk === "11130595") {
      userRole = "pic";
    } else if (userNpk === "22240696") {
      userRole = "manager";
    } else if (userNpk === "33350797") {
      userRole = "pic";
    }

    // 2. Check Supabase Auth
    if (!userRole) {
      try {
        const supabase = await createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (user) {
          const roleFromMeta = user.user_metadata?.role;
          if (roleFromMeta) {
            userRole = roleFromMeta;
          } else {
            const { data: dbUser } = await (supabase as any)
              .from("users")
              .select("role")
              .eq("auth_id", user.id)
              .single();
            if (dbUser?.role) userRole = dbUser.role;
          }
        }
      } catch (authErr) {
        // Suppress auth lookup error
      }
    }

    // 3. Fallback demo_role cookie
    if (!userRole && demoRole) {
      userRole = demoRole;
    }

    // HAK AKSES KETAT: Hanya Super Admin (role === 'admin') yang diizinkan
    if (userRole !== "admin") {
      return NextResponse.json(
        {
          error: "Akses ditolak: Menu dan data ini hanya dapat diakses oleh Super Admin.",
          code: "FORBIDDEN",
        },
        { status: 403 }
      );
    }

    // Parse query params
    const searchParams = request.nextUrl.searchParams;
    const params: MappingFilterParams = {
      search: searchParams.get("search") || undefined,
      locationId: searchParams.get("locationId") || undefined,
      userNpk: searchParams.get("userNpk") || undefined,
      assignmentStatus:
        (searchParams.get("assignmentStatus") as any) || undefined,
      sortBy: (searchParams.get("sortBy") as any) || undefined,
      sortDirection: (searchParams.get("sortDirection") as any) || undefined,
      page: searchParams.get("page") ? parseInt(searchParams.get("page")!, 10) : 1,
      limit: searchParams.get("limit") ? parseInt(searchParams.get("limit")!, 10) : 15,
    };

    const result = await mappingService.getMappings(params);
    return NextResponse.json(result, { status: 200 });
  } catch (error: any) {
    console.error("API /api/admin/user-tablet-mapping error:", error);
    return NextResponse.json(
      {
        error: "Gagal memproses data pemetaan user & tablet.",
        message: error?.message,
      },
      { status: 500 }
    );
  }
}
