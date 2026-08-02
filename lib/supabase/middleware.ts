import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const pathname = request.nextUrl.pathname;
  const isAuthPage =
    pathname === "/login" ||
    pathname === "/forgot-password" ||
    pathname === "/reset-password";

  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder-project.supabase.co";
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.placeholder";

    const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
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
    });

    let userRole: string | null = null;
    let isAuthenticated = false;
    const isPlaceholder = supabaseUrl.includes("placeholder");

    if (!isPlaceholder) {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (user) {
          isAuthenticated = true;
          let foundRole = user.user_metadata?.role;

          if (!foundRole) {
            const { data: dbUserByAuth } = await supabase
              .from("users")
              .select("role")
              .eq("auth_id", user.id)
              .single();

            if (dbUserByAuth?.role) {
              foundRole = dbUserByAuth.role;
            } else if (user.email) {
              const { data: dbUserByEmail } = await supabase
                .from("users")
                .select("role")
                .ilike("email", user.email)
                .single();

              if (dbUserByEmail?.role) foundRole = dbUserByEmail.role;
            }
          }

          userRole = foundRole || "pic";
        }
      } catch (err) {
        // Suppress network errors
      }
    }

    // Fallback demo mode reading cookie
    if (!isAuthenticated) {
      const demoRoleCookie = request.cookies.get("demo_role")?.value;
      if (demoRoleCookie || isPlaceholder) {
        isAuthenticated = true;
        userRole = demoRoleCookie || "pic";
      }
    }

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
      if (pathname.startsWith("/admin") && userRole !== "admin") {
        const url = request.nextUrl.clone();
        url.pathname = getRoleDashboard(userRole);
        return NextResponse.redirect(url);
      }

      if (pathname.startsWith("/pic") && userRole !== "pic" && userRole !== "admin") {
        const url = request.nextUrl.clone();
        url.pathname = getRoleDashboard(userRole);
        return NextResponse.redirect(url);
      }

      if (pathname.startsWith("/manager") && userRole !== "manager" && userRole !== "admin") {
        const url = request.nextUrl.clone();
        url.pathname = getRoleDashboard(userRole);
        return NextResponse.redirect(url);
      }
    }
  } catch (globalErr) {
    // Fail-safe fallback so Vercel Edge Middleware never crashes
    console.error("Middleware fail-safe triggered:", globalErr);
  }

  return response;
}
