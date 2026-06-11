import { NextResponse } from "next/server";

export const runtime = "edge";

export async function GET() {
  return NextResponse.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    version: process.env.NEXT_PUBLIC_SITE_URL ? "production" : "development",
  });
}