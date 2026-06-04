import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { checkRateLimit } from "@/lib/rate-limit";
import { validateCsrf } from "@/lib/csrf";

const newsletterSchema = z.object({
  email: z.string().email().max(254),
});

function getApiBaseUrl(): string | null {
  return process.env.NEXT_PUBLIC_API_BASE_URL || process.env.API_BASE_URL || null;
}

export async function POST(request: NextRequest) {
  const csrf = validateCsrf(request);
  if (!csrf.valid) {
    return NextResponse.json({ success: false, status: "error", message: csrf.reason, code: "CSRF_ERROR" }, { status: 403 });
  }

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

    const apiBaseUrl = getApiBaseUrl();
    if (!apiBaseUrl) {
      return NextResponse.json(
        { success: false, status: "error", message: "Newsletter subscription is not yet available. Please try again later.", code: "SERVICE_UNAVAILABLE" },
        { status: 503 },
      );
    }

    const upstream = await fetch(`${apiBaseUrl.replace(/\/$/, "")}/api/v1/newsletter`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(result.data),
    });

    const data = await upstream.json();
    return NextResponse.json(data, { status: upstream.status });
  } catch {
    return NextResponse.json(
      { success: false, status: "error", message: "An unexpected error occurred. Please try again.", code: "INTERNAL_ERROR" },
      { status: 500 },
    );
  }
}