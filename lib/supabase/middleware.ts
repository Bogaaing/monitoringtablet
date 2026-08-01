import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({ name, value, ...options });
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          });
          response.cookies.set({ name, value, ...options });
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({ name, value: "", ...options });
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          });
          response.cookies.set({ name, value: "", ...options });
        },
      },
    }
  );

  const pathname = request.nextUrl.pathname;
  const isAuthPage =
    pathname === "/login" ||
    pathname === "/forgot-password" ||
    pathname === "/reset-password";

  // Check Supabase user session or fallback demo role cookie
  let userRole: string | null = null;
  let isAuthenticated = false;
  const isPlaceholder = process.env.NEXT_PUBLIC_SUPABASE_URL?.includes("placeholder");

  if (!isPlaceholder) {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        isAuthenticated = true;
        // Fetch user role from public.users or metadata
        const { data: dbUser } = await supabase
          .from("users")
          .select("role")
          .eq("auth_id", user.id)
          .single();

        userRole = dbUser?.role || user.user_metadata?.role || "pic";
      }
    } catch (err) {
      // Suppress network fetch errors for offline dev mode
    }
  }

  // Fallback demo mode reading cookie
  if (!isAuthenticated) {
    const demoRoleCookie = request.cookies.get("demo_role")?.value;
    if (demoRoleCookie || isPlaceholder) {
      isAuthenticated = true;
      userRole = demoRoleCookie || "admin";
    }
  }

  // Determine appropriate dashboard based on role
  const getRoleDashboard = (role: string) => {
    switch (role) {
      case "admin":
        return "/admin/dashboard";
      case "pic":
        return "/pic/dashboard";
      case "manager":
        return "/manager/dashboard";
      default:
        return "/dashboard";
    }
  };

  // 1. Redirect unauthenticated users to /login
  if (!isAuthenticated && !isAuthPage && !pathname.startsWith("/_next") && !pathname.startsWith("/api")) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  // 2. Redirect authenticated users away from Auth pages to their role dashboard
  if (isAuthenticated && isAuthPage) {
    const url = request.nextUrl.clone();
    url.pathname = getRoleDashboard(userRole || "admin");
    return NextResponse.redirect(url);
  }

  // 3. Protect Role-Specific Routes
  if (isAuthenticated && userRole) {
    // Admin Route Protection
    if (pathname.startsWith("/admin") && userRole !== "admin") {
      const url = request.nextUrl.clone();
      url.pathname = getRoleDashboard(userRole);
      return NextResponse.redirect(url);
    }

    // PIC Route Protection (allow PIC & Admin)
    if (pathname.startsWith("/pic") && userRole !== "pic" && userRole !== "admin") {
      const url = request.nextUrl.clone();
      url.pathname = getRoleDashboard(userRole);
      return NextResponse.redirect(url);
    }

    // Manager Route Protection (allow Manager & Admin)
    if (pathname.startsWith("/manager") && userRole !== "manager" && userRole !== "admin") {
      const url = request.nextUrl.clone();
      url.pathname = getRoleDashboard(userRole);
      return NextResponse.redirect(url);
    }
  }

  return response;
}
