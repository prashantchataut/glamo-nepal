import { NextRequest, NextResponse } from "next/server";
import { contactSchema } from "@/lib/validations/contact";
import { checkRateLimit } from "@/lib/rate-limit";
import { validateCsrf } from "@/lib/csrf";
import app from "../../../../backend/src/index";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const result = contactSchema.safeParse(body);
  if (!result.success) {
    return NextResponse.json({ success: false, message: "Validation failed", errors: result.error.flatten().fieldErrors }, { status: 400 });
  }

  const csrfResult = validateCsrf(request);
  if (!csrfResult.valid) return NextResponse.json({ success: false, message: csrfResult.reason }, { status: 403 });

  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || request.headers.get("x-real-ip") || "unknown";
  if (!checkRateLimit("/api/contact", ip).allowed) {
    return NextResponse.json({ success: false, message: "Too many requests. Please try again later." }, { status: 429 });
  }

  try {
    const upstream = await app.request("/api/v1/contact", {
      method: "POST",
      headers: { "Content-Type": "application/json", cookie: request.headers.get("cookie") || "", "x-csrf-token": request.headers.get("x-csrf-token") || "" },
      body: JSON.stringify(result.data),
    });
    const data = await upstream.json();
    return NextResponse.json(data, { status: upstream.status });
  } catch {
    return NextResponse.json({ success: false, message: "Failed to send message. Please try again later." }, { status: 500 });
  }
}