import { NextRequest, NextResponse } from "next/server";
import { contactSchema } from "@/lib/validations/contact";
import { checkRateLimit } from "@/lib/rate-limit";

const CONVEX_URL = process.env.NEXT_PUBLIC_CONVEX_URL || "";

function sanitize(input: string): string {
  return input.replace(/<[^>]*>/g, "").trim();
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

    if (!CONVEX_URL) {
      return NextResponse.json(
        { success: false, status: "error", message: "Contact form is not configured. Please try again later.", code: "SERVICE_UNAVAILABLE" },
        { status: 503 },
      );
    }

    const convexResponse = await fetch(`${CONVEX_URL}/api/contact`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...result.data,
        name: sanitize(result.data.name),
        subject: sanitize(result.data.subject),
        message: sanitize(result.data.message),
        ...(result.data.phone ? { phone: sanitize(result.data.phone) } : {}),
      }),
    });

    if (!convexResponse.ok) {
      return NextResponse.json(
        { success: false, status: "error", message: "Failed to submit contact form. Please try again.", code: "UPSTREAM_ERROR" },
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