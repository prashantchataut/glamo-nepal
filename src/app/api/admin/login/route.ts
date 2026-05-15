import { NextResponse } from "next/server";
import { ADMIN_SESSION_COOKIE, ADMIN_SESSION_MAX_AGE_SECONDS, LEGACY_AUTH_COOKIE, LEGACY_ROLE_COOKIE, createAdminSessionToken, getAdminCredentials } from "@/lib/admin-auth";

const cookieOptions = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
  maxAge: ADMIN_SESSION_MAX_AGE_SECONDS,
};

const hostCookieOptions = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: true,
  path: "/",
  maxAge: ADMIN_SESSION_MAX_AGE_SECONDS,
};

function timingSafeEqual(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) {
    const maxLen = Math.max(a.length, b.length);
    const paddedA = new Uint8Array(maxLen);
    const paddedB = new Uint8Array(maxLen);
    paddedA.set(a, 0);
    paddedB.set(b, 0);
    let mismatch = 0;
    for (let i = 0; i < maxLen; i++) {
      mismatch |= paddedA[i] ^ paddedB[i];
    }
    return mismatch === 0;
  }
  let mismatch = 0;
  for (let i = 0; i < a.length; i++) {
    mismatch |= a[i] ^ b[i];
  }
  return mismatch === 0;
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null) as { email?: string; password?: string } | null;
  const email = body?.email?.trim().toLowerCase();
  const password = body?.password || "";
  const credentials = getAdminCredentials();

  const emailBuffer = new TextEncoder().encode(email || "");
  const expectedEmailBuffer = new TextEncoder().encode(credentials.email.toLowerCase());
  const passwordBuffer = new TextEncoder().encode(password);
  const expectedPasswordBuffer = new TextEncoder().encode(credentials.password);

  const emailMatch = timingSafeEqual(emailBuffer, expectedEmailBuffer);
  const passwordMatch = timingSafeEqual(passwordBuffer, expectedPasswordBuffer);

  if (!emailMatch || !passwordMatch) {
    return NextResponse.json({ ok: false, message: "Invalid admin email or password." }, { status: 401 });
  }

  const token = await createAdminSessionToken(credentials.email, credentials.name);
  const response = NextResponse.json({ ok: true, redirectTo: "/admin" });
  response.cookies.set(ADMIN_SESSION_COOKIE, token, hostCookieOptions);
  response.cookies.set(LEGACY_AUTH_COOKIE, token, cookieOptions);
  response.cookies.set(LEGACY_ROLE_COOKIE, "admin", { ...cookieOptions, httpOnly: true });
  return response;
}