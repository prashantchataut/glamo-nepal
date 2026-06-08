import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { verifyAdminSessionToken, ADMIN_SESSION_COOKIE } from "@/lib/admin-auth";

const protectedPrefixes = ["/account", "/checkout"];
const authPages = ["/login", "/register"];

function isPathOrChild(pathname: string, prefix: string) {
  return pathname === prefix || pathname.startsWith(`${prefix}/`);
}

async function hasValidAdminToken(request: NextRequest): Promise<boolean> {
  const token = request.cookies.get(ADMIN_SESSION_COOKIE)?.value;
  if (!token) return false;

  const payload = await verifyAdminSessionToken(token);
  return payload !== null;
}

function hasFirebaseAuthToken(request: NextRequest): boolean {
  const token = request.cookies.get("glamo-access-token")?.value;
  if (!token) return false;
  const parts = token.split('.');
  if (parts.length !== 3) return false;
  try {
    const payload = JSON.parse(atob(parts[1]));
    if (!payload.exp) return false;
    if (payload.exp < Math.floor(Date.now() / 1000)) return false;
    if (!payload.iss || !payload.iss.startsWith("https://securetoken.google.com/")) return false;
    if (!payload.aud) return false;
    return true;
  } catch {
    return false;
  }
}

const CSRF_TOKEN_COOKIE = "glamo-csrf-token";
const IS_PRODUCTION = process.env.NODE_ENV === "production";

function generateCsrfToken(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  let hex = "";
  for (let i = 0; i < array.length; i++) {
    hex += array[i].toString(16).padStart(2, "0");
  }
  return hex;
}

function addSecurityHeaders(response: NextResponse) {
  const cspDirectives = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.vercel-insights.com https://va.vercel-scripts.com https://www.gstatic.com https://apis.google.com",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com",
    "img-src 'self' data: blob: https://images.unsplash.com https://plus.unsplash.com https://cdn.pixabay.com https://res.cloudinary.com https://img.freepik.com https://images.pexels.com https://lh3.googleusercontent.com",
    "connect-src 'self' https://api.glamonepal.com https://khalti.com https://esewa.com.np https://pay.khalti.com https://www.googleapis.com https://securetoken.googleapis.com https://identitytoolkit.googleapis.com https://ankura-studio.firebaseapp.com",
    "frame-src https://accounts.google.com https://accounts.google.gg https://ankura-studio.firebaseapp.com https://glamonepal.firebaseapp.com",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
  ];
  response.headers.set("Content-Security-Policy", cspDirectives.join("; "));
  response.headers.set("Cross-Origin-Opener-Policy", "same-origin-allow-popups");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  response.headers.set("Strict-Transport-Security", "max-age=63072000; includeSubDomains; preload");
  response.headers.set("X-DNS-Prefetch-Control", "on");
  return response;
}

function setCsrfCookie(response: NextResponse, csrfToken: string, request: NextRequest) {
  if (!request.cookies.get(CSRF_TOKEN_COOKIE)?.value) {
    response.cookies.set(CSRF_TOKEN_COOKIE, csrfToken, {
      httpOnly: false,
      sameSite: "lax",
      secure: IS_PRODUCTION,
      path: "/",
      maxAge: 60 * 60 * 24,
    });
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isAdminPath = isPathOrChild(pathname, "/admin");
  const isAdminLogin = isPathOrChild(pathname, "/admin/login");
  const isProtected = protectedPrefixes.some((prefix) => isPathOrChild(pathname, prefix));
  const isAuthPage = authPages.some((path) => isPathOrChild(pathname, path));

  const csrfToken = generateCsrfToken();

  if (isAdminPath && !isAdminLogin) {
    const isValid = await hasValidAdminToken(request);
    if (!isValid) {
      const loginUrl = new URL("/admin/login", request.url);
      loginUrl.searchParams.set("redirect", pathname);
      const response = addSecurityHeaders(NextResponse.redirect(loginUrl));
      setCsrfCookie(response, csrfToken, request);
      return response;
    }
    const response = addSecurityHeaders(NextResponse.next());
    setCsrfCookie(response, csrfToken, request);
    return response;
  }

  if (isAdminLogin) {
    const isValid = await hasValidAdminToken(request);
    if (isValid) {
      return addSecurityHeaders(NextResponse.redirect(new URL("/admin", request.url)));
    }
    const response = addSecurityHeaders(NextResponse.next());
    setCsrfCookie(response, csrfToken, request);
    return response;
  }

  if (isProtected) {
    if (!hasFirebaseAuthToken(request)) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("redirect", pathname);
      return addSecurityHeaders(NextResponse.redirect(loginUrl));
    }
  }

  if (isAuthPage) {
    if (hasFirebaseAuthToken(request)) {
      return addSecurityHeaders(NextResponse.redirect(new URL("/account", request.url)));
    }
  }

  const response = addSecurityHeaders(NextResponse.next());
  setCsrfCookie(response, csrfToken, request);
  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js|map)$).*)"],
};