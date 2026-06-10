import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify, createRemoteJWKSet } from "jose";
import { verifyAdminSessionToken, ADMIN_SESSION_COOKIE } from "@/lib/admin-auth";

const protectedPrefixes = ["/account", "/checkout"];
const authPages = ["/login", "/register"];

const FIREBASE_PROJECT_ID = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "";
const FIREBASE_JWKS_URL = `https://www.googleapis.com/robot/v1/metadata/x509/securetoken%40gsignoutserviceaccount.com`;

let jwksCache: ReturnType<typeof createRemoteJWKSet> | null = null;
function getJWKS() {
  if (!jwksCache) jwksCache = createRemoteJWKSet(new URL(FIREBASE_JWKS_URL));
  return jwksCache;
}

function isPathOrChild(pathname: string, prefix: string) {
  return pathname === prefix || pathname.startsWith(`${prefix}/`);
}

async function hasValidAdminToken(request: NextRequest): Promise<boolean> {
  const token = request.cookies.get(ADMIN_SESSION_COOKIE)?.value;
  if (!token) return false;

  const payload = await verifyAdminSessionToken(token);
  return payload !== null;
}

let firebaseTokenCache: { token: string; result: boolean; expires: number } | null = null;

async function hasFirebaseAuthToken(request: NextRequest): Promise<boolean> {
  const token = request.cookies.get("glamo-access-token")?.value;
  if (!token) return false;

  if (firebaseTokenCache && firebaseTokenCache.token === token && Date.now() < firebaseTokenCache.expires) {
    return firebaseTokenCache.result;
  }

  if (!FIREBASE_PROJECT_ID) {
    return false;
  }

  try {
    const jwks = getJWKS();
    const { payload } = await jwtVerify(token, jwks, {
      issuer: `https://securetoken.google.com/${FIREBASE_PROJECT_ID}`,
      audience: FIREBASE_PROJECT_ID,
    });
    const result = !!payload.sub && !!payload.exp;
    firebaseTokenCache = { token, result, expires: Date.now() + 5 * 60 * 1000 };
    return result;
  } catch {
    firebaseTokenCache = { token, result: false, expires: Date.now() + 60 * 1000 };
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

function generateNonce(): string {
  const array = new Uint8Array(16);
  crypto.getRandomValues(array);
  return btoa(String.fromCharCode(...array));
}

function addSecurityHeaders(response: NextResponse, nonce?: string) {
  const scriptSrc = [
    "'self'",
    nonce ? `'nonce-${nonce}'` : "'unsafe-inline'",
    "https://cdn.vercel-insights.com",
    "https://va.vercel-scripts.com",
    "https://www.gstatic.com",
    "https://apis.google.com",
  ].join(" ");

  const cspDirectives = [
    "default-src 'self'",
    `script-src ${scriptSrc}`,
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
  const nonce = generateNonce();

  if (isAdminPath && !isAdminLogin) {
    const isValid = await hasValidAdminToken(request);
    if (!isValid) {
      const loginUrl = new URL("/admin/login", request.url);
      loginUrl.searchParams.set("redirect", pathname);
      const response = addSecurityHeaders(NextResponse.redirect(loginUrl), nonce);
      response.headers.set("x-nonce", nonce);
      setCsrfCookie(response, csrfToken, request);
      return response;
    }
    const response = addSecurityHeaders(NextResponse.next(), nonce);
    response.headers.set("x-nonce", nonce);
    setCsrfCookie(response, csrfToken, request);
    return response;
  }

  if (isAdminLogin) {
    const isValid = await hasValidAdminToken(request);
    if (isValid) {
      return addSecurityHeaders(NextResponse.redirect(new URL("/admin", request.url)), nonce);
    }
    const response = addSecurityHeaders(NextResponse.next(), nonce);
    response.headers.set("x-nonce", nonce);
    setCsrfCookie(response, csrfToken, request);
    return response;
  }

  if (isProtected) {
    const hasAuth = await hasFirebaseAuthToken(request);
    if (!hasAuth) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("redirect", pathname);
      const response = addSecurityHeaders(NextResponse.redirect(loginUrl), nonce);
      response.headers.set("x-nonce", nonce);
      return response;
    }
  }

  if (isAuthPage) {
    const hasAuth = await hasFirebaseAuthToken(request);
    if (hasAuth) {
      return addSecurityHeaders(NextResponse.redirect(new URL("/account", request.url)), nonce);
    }
  }

  const response = addSecurityHeaders(NextResponse.next(), nonce);
  response.headers.set("x-nonce", nonce);
  setCsrfCookie(response, csrfToken, request);
  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js|map)$).*)"],
};