import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { checkRateLimit } from "@/lib/rate-limit";
import { validateCsrf } from "@/lib/csrf";
import { backendFetch } from "@/lib/server/backend";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const newsletterSchema = z.object({
  email: z.string().email().max(254),
});

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const result = newsletterSchema.safeParse(body);
  if (!result.success) {
    return NextResponse.json({ success: false, message: "Invalid email address", errors: result.error.flatten().fieldErrors }, { status: 400 });
  }

  const csrfResult = await validateCsrf(request);
  if (!csrfResult.valid) return NextResponse.json({ success: false, message: csrfResult.reason }, { status: 403 });

  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || request.headers.get("x-real-ip") || "unknown";
  if (!checkRateLimit("/api/newsletter", ip).allowed) {
    return NextResponse.json({ success: false, message: "Too many requests. Please try again later." }, { status: 429 });
  }

  try {
    // Over HTTP (service binding on Cloudflare, API_BASE_URL elsewhere).
    const upstream = await backendFetch("/newsletter/subscribe", {
      method: "POST",
      headers: { "Content-Type": "application/json", cookie: request.headers.get("cookie") || "", "x-csrf-token": request.headers.get("x-csrf-token") || "" },
      body: JSON.stringify(result.data),
    });
    const data = await upstream.json().catch(() => null);
    return NextResponse.json(data, { status: upstream.status });
  } catch {
    return NextResponse.json({ success: false, message: "Failed to subscribe. Please try again later." }, { status: 500 });
  }
}