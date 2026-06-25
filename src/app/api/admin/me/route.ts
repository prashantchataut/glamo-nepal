import { NextResponse } from "next/server";
import { verifyAdminSessionToken, ADMIN_SESSION_COOKIE, LEGACY_ADMIN_SESSION_COOKIE } from "@/lib/admin-auth";

export const runtime = "edge";
export const dynamic = "force-dynamic";

function resolveRole(email: string): string {
  const superAdminEmails = (process.env.SUPER_ADMIN_EMAILS || process.env.ADMIN_EMAIL || "")
    .split(",").map((e) => e.trim().toLowerCase()).filter(Boolean);
  if (superAdminEmails[0] === email.toLowerCase()) return "OWNER";
  if (superAdminEmails.includes(email.toLowerCase())) return "SUPER_ADMIN";
  return "admin";
}

async function getSessionCookie(request: Request): Promise<string | undefined> {
  const cookieHeader = request.headers.get("cookie") || "";
  for (const name of [ADMIN_SESSION_COOKIE, LEGACY_ADMIN_SESSION_COOKIE]) {
    const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const match = cookieHeader.match(new RegExp(`(?:^|;\\s*)${escaped}=([^;]+)`));
    if (match?.[1]) return match[1];
  }
  return undefined;
}

export async function GET(request: Request) {
  const token = await getSessionCookie(request);
  if (!token) {
    return NextResponse.json(
      { success: false, message: "No admin session found." },
      { status: 401 },
    );
  }

  const payload = await verifyAdminSessionToken(token);
  if (!payload) {
    return NextResponse.json(
      { success: false, message: "Session expired. Please sign in again." },
      { status: 401 },
    );
  }

  // The signed session payload already carries email + name. Do NOT call
  // getAdminCredentials() here - it throws when ADMIN_EMAIL is unset, which
  // turns a valid session into a 500 and breaks the dashboard.
  const role = resolveRole(payload.email);

  return NextResponse.json({
    success: true,
    data: {
      email: payload.email,
      name: payload.name || "GLAMO Admin",
      role,
    },
  });
}
