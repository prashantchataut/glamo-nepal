import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const newsletterSchema = z.object({
  email: z.string().email().max(254),
});

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const result = newsletterSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { status: "error", message: "Please provide a valid email address.", code: "VALIDATION_ERROR" },
        { status: 400 },
      );
    }

    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
      return NextResponse.json(
        { status: "error", message: "Newsletter subscription is not yet available. Please try again later.", code: "SERVICE_UNAVAILABLE" },
        { status: 503 },
      );
    }

    const supabaseResponse = await fetch(`${SUPABASE_URL}/rest/v1/newsletter_subscribers`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: SUPABASE_ANON_KEY,
        Prefer: "return=representation,resolution=merge-duplicates",
      },
      body: JSON.stringify({
        email: result.data.email,
        subscribed_at: new Date().toISOString(),
      }),
    });

    if (!supabaseResponse.ok) {
      const status = supabaseResponse.status;
      if (status === 409) {
        return NextResponse.json({ status: "success", message: "You are already on the list!" });
      }
      await supabaseResponse.text();
      return NextResponse.json(
        { status: "error", message: "Failed to subscribe. Please try again.", code: "UPSTREAM_ERROR" },
        { status: 502 },
      );
    }

    return NextResponse.json({ status: "success", message: "You are on the list! We will reach out when our newsletter launches." });
  } catch {
    return NextResponse.json(
      { status: "error", message: "An unexpected error occurred. Please try again.", code: "INTERNAL_ERROR" },
      { status: 500 },
    );
  }
}