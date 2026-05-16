import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  ADMIN_SESSION_COOKIE,
  ADMIN_SESSION_MAX_AGE_SECONDS,
  LEGACY_AUTH_COOKIE,
  LEGACY_ROLE_COOKIE,
  createAdminSessionToken,
  getAdminCredentials,
} from "@/lib/admin-auth";
import { checkRateLimit } from "@/lib/rate-limit";

const loginSchema = z.object({
  email: z.string().email().max(254),
  password: z.string().min(1).max(256),
});

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
  secure: process.env.NODE_ENV === "production",
  path: "/",
  maxAge: ADMIN_SESSION_MAX_AGE_SECONDS,
};

function timingSafeEqual(a: Uint8Array, b: Uint8Array): boolean {
  const maxLen = Math.max(a.length, b.length);
  const paddedA = new Uint8Array(maxLen);
  const paddedB = new Uint8Array(maxLen);
  paddedA.set(a, 0);
  paddedB.set(b, 0);
  let mismatch = a.length ^ b.length;
  for (let i = 0; i < maxLen; i += 1) mismatch |= paddedA[i] ^ paddedB[i];
  return mismatch === 0;
}

export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || request.headers.get("x-real-ip") || "unknown";
    const limit = checkRateLimit("/api/admin/login", ip);
    if (!limit.allowed) {
      return NextResponse.json({ ok: false, message: "Too many login attempts. Please try again later." }, { status: 429, headers: { "Retry-After": String(Math.ceil(limit.retryAfterMs / 1000)) } });
    }

    const parsed = loginSchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) {
      return NextResponse.json({ ok: false, message: "Enter a valid admin email and password." }, { status: 400 });
    }

    let credentials: ReturnType<typeof getAdminCredentials>;
    try {
      credentials = getAdminCredentials();
    } catch {
      return NextResponse.json({ ok: false, message: "Admin login is not configured." }, { status: 503 });
    }

    const emailBuffer = new TextEncoder().encode(parsed.data.email.trim().toLowerCase());
    const expectedEmailBuffer = new TextEncoder().encode(credentials.email.toLowerCase());
    const passwordBuffer = new TextEncoder().encode(parsed.data.password);
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
  } catch {
    return NextResponse.json({ ok: false, message: "Unable to complete admin login." }, { status: 500 });
  }
}
