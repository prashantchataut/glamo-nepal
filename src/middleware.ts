import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { ADMIN_SESSION_COOKIE, LEGACY_AUTH_COOKIE, verifyAdminSessionToken } from "@/lib/admin-auth";
import { checkRateLimit } from "@/lib/rate-limit";

const protectedPrefixes = ["/account"];
const authPages = ["/login", "/register", "/forgot-password", "/reset-password"];
const CSRF_TOKEN_COOKIE = "glamo-csrf-token";

function isPathOrChild(pathname: string, prefix: string) {
  return pathname === prefix || pathname.startsWith(`${prefix}/`);
}

function getClientIp(request: NextRequest): string {
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
    || request.headers.get("x-real-ip")
    || "unknown";
}

function generateCsrfToken(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, (b) => b.toString(16).padStart(2, "0")).join("");
}

function addSecurityHeaders(response: NextResponse, nonce?: string) {
  const cspDirectives = [
    "default-src 'self'",
    nonce
      ? `script-src 'self' 'nonce-${nonce}' https://cdn.vercel-insights.com`
      : "script-src 'self' https://cdn.vercel-insights.com",
    nonce
      ? `style-src 'self' 'nonce-${nonce}' https://fonts.googleapis.com`
      : "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com",
    "img-src 'self' data: blob: https://images.unsplash.com https://plus.unsplash.com https://cdn.pixabay.com https://res.cloudinary.com https://img.freepik.com https://images.pexels.com",
    "connect-src 'self' https://api.glamonepal.com https://khalti.com https://esewa.com.np https://pay.khalti.com",
    "frame-src 'none'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    "upgrade-insecure-requests",
  ];
  response.headers.set("Content-Security-Policy", cspDirectives.join("; "));
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
  const ip = getClientIp(request);
  const method = request.method.toUpperCase();

  if (pathname.startsWith("/api/")) {
    const rateResult = checkRateLimit(pathname, ip);
    if (!rateResult.allowed) {
      const response = NextResponse.json(
        { status: "error", message: "Too many requests. Please try again later.", code: "RATE_LIMITED" },
        { status: 429 }
      );
      response.headers.set("Retry-After", String(Math.ceil(rateResult.retryAfterMs / 1000)));
      response.headers.set("X-RateLimit-Limit", String(rateResult.limit));
      response.headers.set("X-RateLimit-Remaining", "0");
      response.headers.set("X-RateLimit-Reset", String(Math.ceil(rateResult.resetAt / 1000)));
      return addSecurityHeaders(response);
    }

    if (method !== "GET" && method !== "HEAD" && method !== "OPTIONS") {
      if (pathname === "/api/contact" || pathname === "/api/admin/login" || pathname === "/api/admin/logout" || pathname === "/api/newsletter" || pathname === "/api/checkout") {
        const csrfCookie = request.cookies.get(CSRF_TOKEN_COOKIE)?.value;
        const csrfHeader = request.headers.get("x-csrf-token");
        if (!csrfCookie || !csrfHeader || csrfCookie !== csrfHeader) {
          return addSecurityHeaders(
            NextResponse.json(
              { status: "error", message: "CSRF token validation failed.", code: "CSRF_INVALID" },
              { status: 403 }
            )
          );
        }
      }
    }
  }

  const adminToken = request.cookies.get(ADMIN_SESSION_COOKIE)?.value;
  const isProtected = protectedPrefixes.some((prefix) => isPathOrChild(pathname, prefix));
  const isAuthPage = authPages.some((path) => isPathOrChild(pathname, path));
  const isAdminPath = isPathOrChild(pathname, "/admin");
  const isAdminLogin = isPathOrChild(pathname, "/admin/login");

  const csrfToken = generateCsrfToken();
  const nonce = generateCsrfToken();

  if (isAdminPath && !isAdminLogin) {
    const adminSession = await verifyAdminSessionToken(adminToken);
    if (!adminSession) {
      const loginUrl = new URL("/admin/login", request.url);
      loginUrl.searchParams.set("redirect", pathname);
      const response = addSecurityHeaders(NextResponse.redirect(loginUrl), nonce);
      response.cookies.set(CSRF_TOKEN_COOKIE, csrfToken, {
        httpOnly: false,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        path: "/",
        maxAge: 60 * 60 * 24,
      });
      return response;
    }
    const response = addSecurityHeaders(NextResponse.next(), nonce);
    response.cookies.set(CSRF_TOKEN_COOKIE, csrfToken, {
      httpOnly: false,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24,
    });
    return response;
  }

  if (isAdminLogin) {
    const adminSession = await verifyAdminSessionToken(adminToken);
    if (adminSession) return addSecurityHeaders(NextResponse.redirect(new URL("/admin", request.url)), nonce);
    const response = addSecurityHeaders(NextResponse.next(), nonce);
    response.cookies.set(CSRF_TOKEN_COOKIE, csrfToken, {
      httpOnly: false,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24,
    });
    return response;
  }

  const supabaseAuthCookie = request.cookies.getAll().find((c) => c.name.startsWith("sb-") && c.name.endsWith("-auth-token"));
  const legacyAuthCookie = request.cookies.get(LEGACY_AUTH_COOKIE)?.value;
  const hasAuthSession = Boolean(supabaseAuthCookie) || Boolean(legacyAuthCookie);

  if (isProtected && !hasAuthSession) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return addSecurityHeaders(NextResponse.redirect(loginUrl), nonce);
  }

  if (isAuthPage && hasAuthSession) {
    return addSecurityHeaders(NextResponse.redirect(new URL("/account", request.url)), nonce);
  }

  const response = addSecurityHeaders(NextResponse.next(), nonce);
  if (!request.cookies.get(CSRF_TOKEN_COOKIE)?.value) {
    response.cookies.set(CSRF_TOKEN_COOKIE, csrfToken, {
      httpOnly: false,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24,
    });
  }
  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js|map)$).*)"],
};