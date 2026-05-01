import { NextResponse } from "next/server";
import { ADMIN_SESSION_COOKIE, ADMIN_SESSION_MAX_AGE_SECONDS, LEGACY_AUTH_COOKIE, LEGACY_ROLE_COOKIE, createAdminSessionToken, getAdminCredentials } from "@/lib/admin-auth";

const cookieOptions = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
  maxAge: ADMIN_SESSION_MAX_AGE_SECONDS,
};

export async function POST(request: Request) {
  const body = await request.json().catch(() => null) as { email?: string; password?: string } | null;
  const email = body?.email?.trim().toLowerCase();
  const password = body?.password || "";
  const credentials = getAdminCredentials();

  if (email !== credentials.email.toLowerCase() || password !== credentials.password) {
    return NextResponse.json({ ok: false, message: "Invalid admin email or password." }, { status: 401 });
  }

  const token = await createAdminSessionToken(credentials.email, credentials.name);
  const response = NextResponse.json({ ok: true, redirectTo: "/admin" });
  response.cookies.set(ADMIN_SESSION_COOKIE, token, cookieOptions);
  response.cookies.set(LEGACY_AUTH_COOKIE, token, cookieOptions);
  response.cookies.set(LEGACY_ROLE_COOKIE, "admin", { ...cookieOptions, httpOnly: true });
  return response;
}
