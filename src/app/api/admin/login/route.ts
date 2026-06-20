import { NextRequest, NextResponse } from "next/server";
import { createAdminSessionToken, ADMIN_SESSION_COOKIE } from "@/lib/admin-auth";
import { validateCsrf } from "@/lib/csrf";
import { compare } from "bcryptjs";

const RATE_LIMIT_MAX = 10;
const RATE_LIMIT_WINDOW = 300;

const UPSTASH_URL = process.env.UPSTASH_REDIS_REST_URL;
const UPSTASH_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;

const loginAttempts = new Map<string, { count: number; expires: number }>();
const CLEANUP_INTERVAL = 120_000;
let lastCleanup = Date.now();

async function checkRateLimitRedis(ip: string): Promise<boolean> {
  const key = `admin_login:${ip}`;
  const res = await fetch(`${UPSTASH_URL}/incr/${key}`, {
    headers: { Authorization: `Bearer ${UPSTASH_TOKEN}` },
  });
  const data = await res.json();
  const count = data.result as number;
  if (count === 1) {
    await fetch(`${UPSTASH_URL}/expire/${key}/${RATE_LIMIT_WINDOW}`, {
      headers: { Authorization: `Bearer ${UPSTASH_TOKEN}` },
    });
  }
  return count <= RATE_LIMIT_MAX;
}

function checkRateLimitMemory(ip: string): boolean {
  const now = Date.now();
  if (now - lastCleanup > CLEANUP_INTERVAL) {
    lastCleanup = now;
    for (const [key, entry] of loginAttempts) {
      if (entry.expires <= now) loginAttempts.delete(key);
    }
  }
  const entry = loginAttempts.get(ip);
  if (entry && entry.expires > now) {
    if (entry.count >= RATE_LIMIT_MAX) return false;
    entry.count++;
  } else {
    loginAttempts.set(ip, { count: 1, expires: now + RATE_LIMIT_WINDOW * 1000 });
  }
  return true;
}

async function checkRateLimit(ip: string): Promise<boolean> {
  if (UPSTASH_URL && UPSTASH_TOKEN) {
    try {
      return await checkRateLimitRedis(ip);
    } catch {
      return checkRateLimitMemory(ip);
    }
  }
  return checkRateLimitMemory(ip);
}

export async function POST(request: NextRequest) {
  const csrf = await validateCsrf(request);
  if (!csrf.valid) {
    return NextResponse.json({ success: false, message: csrf.reason, code: "CSRF_ERROR" }, { status: 403 });
  }

  const clientIp = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
    ?? request.headers.get("x-real-ip")
    ?? "unknown";

  if (!(await checkRateLimit(clientIp))) {
    return NextResponse.json(
      { success: false, message: "Too many login attempts. Please try again later.", code: "RATE_LIMITED" },
      { status: 429, headers: { "Retry-After": String(RATE_LIMIT_WINDOW) } },
    );
  }

  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json({ success: false, message: "Email and password are required." }, { status: 400 });
    }

    if (typeof email !== "string" || email.length > 255 || typeof password !== "string" || password.length > 128) {
      return NextResponse.json({ success: false, message: "Invalid input." }, { status: 400 });
    }

    const adminEmail = process.env.ADMIN_EMAIL;
    const adminPasswordHash = process.env.ADMIN_PASSWORD_HASH;
    const adminPassword = process.env.ADMIN_PASSWORD;
    const adminName = process.env.ADMIN_NAME || "GLAMO Admin";
    const superAdminEmails = (process.env.SUPER_ADMIN_EMAILS || adminEmail || "").split(",").map((e: string) => e.trim().toLowerCase()).filter(Boolean);

    if (!adminEmail) {
      console.error("[SECURITY] ADMIN_EMAIL environment variable is required.");
      return NextResponse.json({ success: false, message: "Admin login is not configured. Please set ADMIN_EMAIL in your environment." }, { status: 500 });
    }

    if (!adminPasswordHash && !adminPassword) {
      console.error("[SECURITY] ADMIN_PASSWORD_HASH or ADMIN_PASSWORD environment variable is required. Run: npx tsx scripts/hash-password.ts <password> to generate a hash.");
      return NextResponse.json({ success: false, message: "Admin login is not configured. Please set ADMIN_PASSWORD_HASH or ADMIN_PASSWORD in your environment." }, { status: 500 });
    }

    const isEmailMatch = email.toLowerCase() === adminEmail.toLowerCase();
    if (!isEmailMatch) {
      return NextResponse.json({ success: false, message: "Invalid admin email or password." }, { status: 401 });
    }

    let isPasswordValid = false;
    if (adminPasswordHash) {
      isPasswordValid = await compare(password, adminPasswordHash);
    } else if (adminPassword) {
      isPasswordValid = password === adminPassword;
    }
    if (!isPasswordValid) {
      return NextResponse.json({ success: false, message: "Invalid admin email or password." }, { status: 401 });
    }

    const isOwner = superAdminEmails[0] === email.toLowerCase();
    const role = isOwner ? "OWNER" : (superAdminEmails.includes(email.toLowerCase()) ? "SUPER_ADMIN" : "admin");

    const token = await createAdminSessionToken(email, adminName);

    const response = NextResponse.json({
      success: true,
      data: {
        user: { email, name: adminName, role },
      },
    });

    response.cookies.set(ADMIN_SESSION_COOKIE, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
sameSite: "strict",
      path: "/",
      maxAge: 60 * 60 * 8,
    });

    return response;
  } catch {
    return NextResponse.json({ success: false, message: "Internal server error." }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const csrf = await validateCsrf(request);
  if (!csrf.valid) {
    return NextResponse.json({ success: false, message: csrf.reason, code: "CSRF_ERROR" }, { status: 403 });
  }

  const response = NextResponse.json({ success: true });
  response.cookies.set(ADMIN_SESSION_COOKIE, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: 0,
  });
  return response;
}