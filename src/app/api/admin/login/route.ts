import { NextRequest, NextResponse } from "next/server";
import { createAdminSessionToken, ADMIN_SESSION_COOKIE } from "@/lib/admin-auth";
import { validateCsrf } from "@/lib/csrf";

export async function POST(request: NextRequest) {
  const csrf = validateCsrf(request);
  if (!csrf.valid) {
    return NextResponse.json({ success: false, message: csrf.reason, code: "CSRF_ERROR" }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json({ success: false, message: "Email and password are required." }, { status: 400 });
    }

    const adminEmail = process.env.ADMIN_EMAIL;
    const adminPassword = process.env.ADMIN_PASSWORD;
    const adminName = process.env.ADMIN_NAME || "GLAMO Admin";

    if (!adminEmail || !adminPassword) {
      return NextResponse.json({ success: false, message: "Admin login is not configured." }, { status: 500 });
    }

    if (email !== adminEmail || password !== adminPassword) {
      return NextResponse.json({ success: false, message: "Invalid admin email or password." }, { status: 401 });
    }

    const token = await createAdminSessionToken(email, adminName);

    const response = NextResponse.json({
      success: true,
      data: {
        user: { email, name: adminName, role: "admin" },
      },
    });

    response.cookies.set(ADMIN_SESSION_COOKIE, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 8,
    });

    return response;
  } catch {
    return NextResponse.json({ success: false, message: "Internal server error." }, { status: 500 });
  }
}

export async function DELETE() {
  const response = NextResponse.json({ success: true });
  response.cookies.set(ADMIN_SESSION_COOKIE, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
  return response;
}