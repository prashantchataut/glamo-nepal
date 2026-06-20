import { NextResponse } from "next/server";
import { verifyAdminSessionToken, getAdminCredentials } from "@/lib/admin-auth";

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
  const productionMatch = cookieHeader.match(/(?:^|;\s*)__Host-glamo-admin-session=([^;]+)/);
  if (productionMatch?.[1]) return productionMatch[1];
  const devMatch = cookieHeader.match(/(?:^|;\s*)glamo-admin-session=([^;]+)/);
  return devMatch?.[1];
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

  const creds = getAdminCredentials();
  const role = resolveRole(payload.email);

  return NextResponse.json({
    success: true,
    data: {
      email: payload.email,
      name: payload.name,
      role,
    },
  });
}
