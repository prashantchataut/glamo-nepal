import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { checkRateLimit } from "@/lib/rate-limit";

const newsletterSchema = z.object({
  email: z.string().email().max(254),
});

const CONVEX_URL = process.env.NEXT_PUBLIC_CONVEX_URL || "";

export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || request.headers.get("x-real-ip") || "unknown";
    const limit = checkRateLimit("/api/newsletter", ip);
    if (!limit.allowed) {
      return NextResponse.json(
        { success: false, status: "error", message: "Too many subscription attempts. Please try again later.", code: "RATE_LIMITED" },
        { status: 429, headers: { "Retry-After": String(Math.ceil(limit.retryAfterMs / 1000)) } },
      );
    }
    const body = await request.json();
    const result = newsletterSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { success: false, status: "error", message: "Please provide a valid email address.", code: "VALIDATION_ERROR" },
        { status: 400 },
      );
    }

    if (!CONVEX_URL) {
      return NextResponse.json(
        { success: false, status: "error", message: "Newsletter subscription is not yet available. Please try again later.", code: "SERVICE_UNAVAILABLE" },
        { status: 503 },
      );
    }

    const convexResponse = await fetch(`${CONVEX_URL}/api/newsletter`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: result.data.email }),
    });

    if (!convexResponse.ok) {
      return NextResponse.json(
        { success: false, status: "error", message: "Failed to subscribe. Please try again.", code: "UPSTREAM_ERROR" },
        { status: convexResponse.status },
      );
    }

    const data = await convexResponse.json();
    return NextResponse.json({ success: true, status: "success", message: data.message });
  } catch {
    return NextResponse.json(
      { success: false, status: "error", message: "An unexpected error occurred. Please try again.", code: "INTERNAL_ERROR" },
      { status: 500 },
    );
  }
}