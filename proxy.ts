import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";

export default async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Allow auth API routes to pass through
  if (pathname.startsWith("/api/auth")) {
    return NextResponse.next();
  }

  // Handle sign-in, sign-up, and unauthorized pages
  if (
    pathname === "/admin/sign-in" ||
    pathname === "/admin/sign-up"
  ) {
    try {
      const session = await auth.api.getSession({
        headers: req.headers,
      });

      // If already authenticated, redirect based on role
      if (session?.user) {
        const userRole = session.user.role as string | undefined;
        if (userRole === "admin") {
          return NextResponse.redirect(new URL("/admin", req.url));
        } else {
          return NextResponse.redirect(new URL("/admin/unauthorized", req.url));
        }
      }
    } catch (error) {
      // If session check fails, allow access to sign-in/sign-up
      console.error("[Proxy] Session check error on auth page:", error);
    }

    // Not authenticated - allow access to sign-in/sign-up
    return NextResponse.next();
  }

  // Allow unauthorized page (for authenticated non-admin users)
  if (pathname === "/admin/unauthorized") {
    return NextResponse.next();
  }

  // Protect /admin/* routes - require authentication AND admin role
  if (pathname.startsWith("/admin")) {
    try {
      // Validate session with Better Auth
      const session = await auth.api.getSession({
        headers: req.headers,
      });

      // No session - redirect to sign-in
      if (!session || !session.user) {
        const signInUrl = new URL("/admin/sign-in", req.url);
        signInUrl.searchParams.set("redirect", pathname);
        return NextResponse.redirect(signInUrl);
      }

      // Check if user has admin role
      const userRole = session.user.role as string | undefined;
      if (userRole !== "admin") {
        // Authenticated but not admin - redirect to unauthorized
        return NextResponse.redirect(new URL("/admin/unauthorized", req.url));
      }

      // User is authenticated and has admin role - inject headers for server components
      const response = NextResponse.next();
      response.headers.set("x-user-id", session.user.id);
      response.headers.set("x-user-email", session.user.email);
      response.headers.set("x-user-name", session.user.name);
      response.headers.set("x-user-role", userRole);

      return response;
    } catch (error) {
      console.error("[Proxy] Session validation error:", error);
      // On error, redirect to sign-in
      const signInUrl = new URL("/admin/sign-in", req.url);
      signInUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(signInUrl);
    }
  }

  return NextResponse.next();
}

// Only run proxy on /admin routes
export const config = {
  matcher: ["/admin/:path*"],
};