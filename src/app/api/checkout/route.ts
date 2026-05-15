import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (!body || typeof body !== "object") {
      return NextResponse.json(
        { status: "error", message: "Invalid request body.", code: "VALIDATION_ERROR" },
        { status: 400 },
      );
    }

    const orderNumber = `GLM-${new Date().getFullYear()}-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;

    return NextResponse.json({
      status: "success",
      orderNumber,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
    });
  } catch {
    return NextResponse.json(
      { status: "error", message: "An unexpected error occurred.", code: "INTERNAL_ERROR" },
      { status: 500 },
    );
  }
}