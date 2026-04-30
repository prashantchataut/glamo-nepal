import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const protectedPrefixes = ["/account", "/admin"];
const authPages = ["/login", "/register", "/forgot-password", "/reset-password"];

function isPathOrChild(pathname: string, prefix: string) {
  return pathname === prefix || pathname.startsWith(`${prefix}/`);
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get("glamo-auth-token")?.value;
  const role = request.cookies.get("glamo-user-role")?.value;
  const isProtected = protectedPrefixes.some((prefix) => isPathOrChild(pathname, prefix));
  const isAuthPage = authPages.some((path) => isPathOrChild(pathname, path));

  if (isProtected && !token) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    if (isPathOrChild(pathname, "/admin")) loginUrl.searchParams.set("role", "admin");
    return NextResponse.redirect(loginUrl);
  }

  if (isPathOrChild(pathname, "/admin") && role !== "admin") {
    const accountUrl = new URL("/account", request.url);
    accountUrl.searchParams.set("admin", "required");
    return NextResponse.redirect(accountUrl);
  }

  if (isAuthPage && token) {
    return NextResponse.redirect(new URL(role === "admin" ? "/admin" : "/account", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js|map)$).*)"],
};
