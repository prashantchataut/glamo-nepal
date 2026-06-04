import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const protectedPrefixes = ["/account", "/checkout"];
const authPages = ["/login", "/register"];

function isPathOrChild(pathname: string, prefix: string) {
  return pathname === prefix || pathname.startsWith(`${prefix}/`);
}

function hasValidAuthToken(request: NextRequest): boolean {
  const hostToken = request.cookies.get("__host-auth-token")?.value;
  const legacyToken = request.cookies.get("glamo-auth-token")?.value;
  const token = hostToken || legacyToken;
  if (!token) return false;
  return token.length >= 16;
}

const CSRF_TOKEN_COOKIE = "glamo-csrf-token";

const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000;
const RATE_LIMIT_MAX_AUTH = 10;
const RATE_LIMIT_MAX_API = 100;
const IS_PRODUCTION = process.env.NODE_ENV === "production";

function checkRateLimit(ip: string, key: string, maxRequests: number): NextResponse | null {
  const limitKey = `${ip}:${key}`;
  const now = Date.now();
  const entry = rateLimitMap.get(limitKey);

  if (!entry || now > entry.resetTime) {
    rateLimitMap.set(limitKey, { count: 1, resetTime: now + RATE_LIMIT_WINDOW_MS });
    return null;
  }

  entry.count++;
  if (entry.count > maxRequests) {
    return NextResponse.json(
      { status: "error", message: "Too many requests. Please try again later.", code: "RATE_LIMITED" },
      { status: 429 }
    );
  }

  return null;
}

function generateCsrfToken(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, (b) => b.toString(16).padStart(2, "0")).join("");
}

function addSecurityHeaders(response: NextResponse) {
  const cspDirectives = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.vercel-insights.com https://va.vercel-scripts.com",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com",
    "img-src 'self' data: blob: https://images.unsplash.com https://plus.unsplash.com https://cdn.pixabay.com https://res.cloudinary.com https://img.freepik.com https://images.pexels.com",
    "connect-src 'self' https://api.glamonepal.com https://khalti.com https://esewa.com.np https://pay.khalti.com",
    "frame-src 'none'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
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
  const method = request.method.toUpperCase();
  const ip = request.ip ?? request.headers.get("x-forwarded-for") ?? "unknown";

  if (pathname.startsWith("/api/")) {
    const isAuthEndpoint = pathname === "/api/contact" || pathname === "/api/newsletter" || pathname === "/api/checkout" || pathname === "/api/orders/create";
    const rateLimitResult = checkRateLimit(ip, isAuthEndpoint ? "auth" : "api", isAuthEndpoint ? RATE_LIMIT_MAX_AUTH : RATE_LIMIT_MAX_API);
    if (rateLimitResult) return addSecurityHeaders(rateLimitResult);

    if (method !== "GET" && method !== "HEAD" && method !== "OPTIONS") {
      if (isAuthEndpoint) {
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

  const isAdminPath = isPathOrChild(pathname, "/admin");
  const isAdminLogin = isPathOrChild(pathname, "/admin/login");
  const isProtected = protectedPrefixes.some((prefix) => isPathOrChild(pathname, prefix));
  const isAuthPage = authPages.some((path) => isPathOrChild(pathname, path));

  const csrfToken = generateCsrfToken();

  if (isAdminPath && !isAdminLogin) {
    if (!hasValidAuthToken(request)) {
      const loginUrl = new URL("/admin/login", request.url);
      loginUrl.searchParams.set("redirect", pathname);
      const response = addSecurityHeaders(NextResponse.redirect(loginUrl));
      if (!request.cookies.get(CSRF_TOKEN_COOKIE)?.value) {
        response.cookies.set(CSRF_TOKEN_COOKIE, csrfToken, {
          httpOnly: false,
          sameSite: "lax",
          secure: IS_PRODUCTION,
          path: "/",
          maxAge: 60 * 60 * 24,
        });
      }
      return response;
    }
    const response = addSecurityHeaders(NextResponse.next());
    if (!request.cookies.get(CSRF_TOKEN_COOKIE)?.value) {
      response.cookies.set(CSRF_TOKEN_COOKIE, csrfToken, {
        httpOnly: false,
        sameSite: "lax",
        secure: IS_PRODUCTION,
        path: "/",
        maxAge: 60 * 60 * 24,
      });
    }
    return response;
  }

  if (isAdminLogin) {
    if (hasValidAuthToken(request)) {
      return addSecurityHeaders(NextResponse.redirect(new URL("/admin", request.url)));
    }
    const response = addSecurityHeaders(NextResponse.next());
    if (!request.cookies.get(CSRF_TOKEN_COOKIE)?.value) {
      response.cookies.set(CSRF_TOKEN_COOKIE, csrfToken, {
        httpOnly: false,
        sameSite: "lax",
        secure: IS_PRODUCTION,
        path: "/",
        maxAge: 60 * 60 * 24,
      });
    }
    return response;
  }

  if (isProtected) {
    if (!hasValidAuthToken(request)) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("redirect", pathname);
      return addSecurityHeaders(NextResponse.redirect(loginUrl));
    }
  }

  if (isAuthPage) {
    if (hasValidAuthToken(request)) {
      return addSecurityHeaders(NextResponse.redirect(new URL("/account", request.url)));
    }
  }

  const response = addSecurityHeaders(NextResponse.next());
  if (!request.cookies.get(CSRF_TOKEN_COOKIE)?.value) {
    response.cookies.set(CSRF_TOKEN_COOKIE, csrfToken, {
      httpOnly: false,
      sameSite: "lax",
      secure: IS_PRODUCTION,
      path: "/",
      maxAge: 60 * 60 * 24,
    });
  }
  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js|map)$).*)"],
};