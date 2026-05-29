import { NextRequest, NextResponse } from "next/server";
import { contactSchema } from "@/lib/validations/contact";
import { checkRateLimit } from "@/lib/rate-limit";

function sanitize(input: string): string {
  return input.replace(/<[^>]*>/g, "").trim();
}

function getApiBaseUrl(): string | null {
  return process.env.NEXT_PUBLIC_API_BASE_URL || process.env.API_BASE_URL || null;
}

export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || request.headers.get("x-real-ip") || "unknown";
    const limit = checkRateLimit("/api/contact", ip);
    if (!limit.allowed) {
      return NextResponse.json(
        { success: false, status: "error", message: "Too many contact requests. Please try again later.", code: "RATE_LIMITED" },
        { status: 429, headers: { "Retry-After": String(Math.ceil(limit.retryAfterMs / 1000)) } },
      );
    }

    const body = await request.json();
    const result = contactSchema.safeParse(body);

    if (!result.success) {
      const fieldErrors: Record<string, string[]> = {};
      for (const issue of result.error.issues) {
        const field = issue.path.join(".");
        if (!fieldErrors[field]) fieldErrors[field] = [];
        fieldErrors[field].push(issue.message);
      }
      return NextResponse.json(
        { success: false, status: "error", message: "Validation failed", code: "VALIDATION_ERROR", fieldErrors },
        { status: 400 },
      );
    }

    const apiBaseUrl = getApiBaseUrl();
    if (!apiBaseUrl) {
      return NextResponse.json(
        { success: false, status: "error", message: "Contact form is not configured. Please try again later.", code: "SERVICE_UNAVAILABLE" },
        { status: 503 },
      );
    }

    const upstream = await fetch(`${apiBaseUrl.replace(/\/$/, "")}/api/v1/contact`, {
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