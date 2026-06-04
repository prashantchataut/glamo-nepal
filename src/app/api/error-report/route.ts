import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const errorReportSchema = z.object({
  message: z.string().max(2000),
  stack: z.string().max(5000).optional(),
  componentStack: z.string().max(5000).optional(),
  boundary: z.string().max(100).optional(),
  url: z.string().max(2000).optional(),
  timestamp: z.string().max(30).optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const result = errorReportSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { success: false, status: "error", message: "Invalid error report.", code: "VALIDATION_ERROR" },
        { status: 400 },
      );
    }

    const { message, stack, componentStack, boundary, url, timestamp } = result.data;

    console.error("[ClientError]", JSON.stringify({
      message: message.slice(0, 500),
      boundary: boundary || "unknown",
      url: url?.slice(0, 200),
      timestamp,
      stack: stack?.slice(0, 500),
      componentStack: componentStack?.slice(0, 300),
    }));

    return NextResponse.json({ success: true, status: "received" });
  } catch {
    return NextResponse.json(
      { success: false, status: "error", message: "Could not process error report.", code: "INTERNAL_ERROR" },
      { status: 500 },
    );
  }
}