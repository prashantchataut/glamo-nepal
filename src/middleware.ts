import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { ADMIN_SESSION_COOKIE, LEGACY_AUTH_COOKIE, LEGACY_ROLE_COOKIE, verifyAdminSessionToken } from "@/lib/admin-auth";

const protectedPrefixes = ["/account"];
const authPages = ["/login", "/register", "/forgot-password", "/reset-password"];

function isPathOrChild(pathname: string, prefix: string) {
  return pathname === prefix || pathname.startsWith(`${prefix}/`);
}

function addSecurityHeaders(response: NextResponse) {
  response.headers.set(
    "Content-Security-Policy",
    [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.vercel-insights.com",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com",
      "img-src 'self' data: blob: https://images.unsplash.com https://plus.unsplash.com https://cdn.pixabay.com https://res.cloudinary.com https://img.freepik.com https://images.pexels.com",
      "connect-src 'self' https://api.glamonepal.com https://khalti.com https://esewa.com.np https://pay.khalti.com https://esewa.com.np",
      "frame-src 'none'",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "frame-ancestors 'none'",
      "upgrade-insecure-requests",
    ].join("; ")
  );
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  response.headers.set("Strict-Transport-Security", "max-age=63072000; includeSubDomains; preload");
  response.headers.set("X-DNS-Prefetch-Control", "on");
  return response;
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get(LEGACY_AUTH_COOKIE)?.value;
  const role = request.cookies.get(LEGACY_ROLE_COOKIE)?.value;
  const adminToken = request.cookies.get(ADMIN_SESSION_COOKIE)?.value;
  const isProtected = protectedPrefixes.some((prefix) => isPathOrChild(pathname, prefix));
  const isAuthPage = authPages.some((path) => isPathOrChild(pathname, path));
  const isAdminPath = isPathOrChild(pathname, "/admin");
  const isAdminLogin = isPathOrChild(pathname, "/admin/login");

  if (isAdminPath && !isAdminLogin) {
    const adminSession = await verifyAdminSessionToken(adminToken);
    if (!adminSession) {
      const loginUrl = new URL("/admin/login", request.url);
      loginUrl.searchParams.set("redirect", pathname);
      return addSecurityHeaders(NextResponse.redirect(loginUrl));
    }
    return addSecurityHeaders(NextResponse.next());
  }

  if (isAdminLogin) {
    const adminSession = await verifyAdminSessionToken(adminToken);
    if (adminSession) return addSecurityHeaders(NextResponse.redirect(new URL("/admin", request.url)));
    return addSecurityHeaders(NextResponse.next());
  }

  if (isProtected && !token) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return addSecurityHeaders(NextResponse.redirect(loginUrl));
  }

  if (isAuthPage && token) {
    return addSecurityHeaders(NextResponse.redirect(new URL(role === "admin" ? "/admin" : "/account", request.url)));
  }

  return addSecurityHeaders(NextResponse.next());
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js|map)$).*)"],
};