import { NextRequest, NextResponse } from "next/server";
import { contactSchema } from "@/lib/validations/contact";
import { checkRateLimit } from "@/lib/rate-limit";
import { validateCsrf } from "@/lib/csrf";
import { backendFetch } from "@/lib/server/backend";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const result = contactSchema.safeParse(body);
  if (!result.success) {
    return NextResponse.json({ success: false, message: "Validation failed", errors: result.error.flatten().fieldErrors }, { status: 400 });
  }

  const csrfResult = await validateCsrf(request);
  if (!csrfResult.valid) return NextResponse.json({ success: false, message: csrfResult.reason }, { status: 403 });

  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || request.headers.get("x-real-ip") || "unknown";
  if (!checkRateLimit("/api/contact", ip).allowed) {
    return NextResponse.json({ success: false, message: "Too many requests. Please try again later." }, { status: 429 });
  }

  try {
    // Over HTTP (service binding on Cloudflare, API_BASE_URL elsewhere).
    // Previously invoked the Hono app in-process, which coupled the backend
    // into the frontend bundle and broke the OpenNext build.
    const upstream = await backendFetch("/contact", {
      method: "POST",
      headers: { "Content-Type": "application/json", cookie: request.headers.get("cookie") || "", "x-csrf-token": request.headers.get("x-csrf-token") || "" },
      body: JSON.stringify(result.data),
    });
    const data = await upstream.json().catch(() => null);
    return NextResponse.json(data, { status: upstream.status });
  } catch {
    return NextResponse.json({ success: false, message: "Failed to send message. Please try again later." }, { status: 500 });
  }
}