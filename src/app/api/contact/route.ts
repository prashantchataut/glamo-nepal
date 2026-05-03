import { NextRequest, NextResponse } from "next/server";
import { contactSchema } from "@/lib/validations/contact";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

export async function POST(request: NextRequest) {
  try {
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
        { status: "error", message: "Validation failed", code: "VALIDATION_ERROR", fieldErrors },
        { status: 400 },
      );
    }

    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
      return NextResponse.json(
        { status: "error", message: "Contact form is not configured. Please try again later.", code: "SERVICE_UNAVAILABLE" },
        { status: 503 },
      );
    }

    const supabaseResponse = await fetch(`${SUPABASE_URL}/rest/v1/contact_submissions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: SUPABASE_ANON_KEY,
        Prefer: "return=representation",
      },
      body: JSON.stringify({
        name: result.data.name,
        email: result.data.email,
        phone: result.data.phone || null,
        subject: result.data.subject,
        message: result.data.message,
        created_at: new Date().toISOString(),
      }),
    });

    if (!supabaseResponse.ok) {
      const errorText = await supabaseResponse.text();
      return NextResponse.json(
        { status: "error", message: "Failed to submit contact form. Please try again.", code: "UPSTREAM_ERROR" },
        { status: 502 },
      );
    }

    return NextResponse.json({ status: "success", message: "Message sent successfully! We will get back to you soon." });
  } catch (error) {
    return NextResponse.json(
      { status: "error", message: "An unexpected error occurred. Please try again.", code: "INTERNAL_ERROR" },
      { status: 500 },
    );
  }
}