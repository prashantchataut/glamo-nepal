import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { ADMIN_SESSION_COOKIE, LEGACY_AUTH_COOKIE, LEGACY_ROLE_COOKIE, verifyAdminSessionToken } from "@/lib/admin-auth";

const protectedPrefixes = ["/account"];
const authPages = ["/login", "/register", "/forgot-password", "/reset-password"];

function isPathOrChild(pathname: string, prefix: string) {
  return pathname === prefix || pathname.startsWith(`${prefix}/`);
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
      return NextResponse.redirect(loginUrl);
    }
    return NextResponse.next();
  }

  if (isAdminLogin) {
    const adminSession = await verifyAdminSessionToken(adminToken);
    if (adminSession) return NextResponse.redirect(new URL("/admin", request.url));
    return NextResponse.next();
  }

  if (isProtected && !token) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (isAuthPage && token) {
    return NextResponse.redirect(new URL(role === "admin" ? "/admin" : "/account", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js|map)$).*)"],
};
