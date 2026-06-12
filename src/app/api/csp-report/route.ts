import { NextRequest, NextResponse } from "next/server";

const MAX_REPORT_SIZE = 4096;
const RATE_LIMIT_WINDOW = 60_000;
const RATE_LIMIT_MAX = 30;
const rateLimitMap = new Map<string, { count: number; expires: number }>();

function getClientIp(request: NextRequest): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    const ips = forwarded.split(",").map((ip) => ip.trim());
    return ips[0] || "unknown";
  }
  return request.headers.get("x-real-ip") || "unknown";
}

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);
  if (!entry || now > entry.expires) {
    rateLimitMap.set(ip, { count: 1, expires: now + RATE_LIMIT_WINDOW });
    return false;
  }
  entry.count++;
  return entry.count > RATE_LIMIT_MAX;
}

setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of rateLimitMap.entries()) {
    if (now > entry.expires) rateLimitMap.delete(key);
  }
}, 60_000);

export async function POST(request: NextRequest) {
  const ip = getClientIp(request);
  if (isRateLimited(ip)) {
    return NextResponse.json({ success: false }, { status: 429 });
  }

  try {
    const contentType = request.headers.get("content-type") || "";
    let report: Record<string, unknown>;

    if (contentType.includes("application/csp-report")) {
      const text = await request.text();
      if (text.length > MAX_REPORT_SIZE) {
        return NextResponse.json({ success: false }, { status: 413 });
      }
      try {
        report = JSON.parse(text);
      } catch {
        return NextResponse.json({ success: false }, { status: 400 });
      }
    } else if (contentType.includes("application/json")) {
      const body = await request.json().catch(() => null);
      if (!body || typeof body !== "object") {
        return NextResponse.json({ success: false }, { status: 400 });
      }
      report = body as Record<string, unknown>;
    } else {
      return NextResponse.json({ success: false }, { status: 400 });
    }

    const cspReport = report["csp-report"] as Record<string, unknown> | undefined;
    const violation = cspReport || report;

    const documentUri = String(violation["document-uri"] || "").slice(0, 500);
    const violatedDirective = String(violation["violated-directive"] || "").slice(0, 200);
    const blockedUri = String(violation["blocked-uri"] || "").slice(0, 500);
    const sourceFile = String(violation["source-file"] || "").slice(0, 500);
    const lineNumber = violation["line-number"];
    const statusCode = violation["status-code"];

    console.warn("[CSP-Violation]", JSON.stringify({
      documentUri,
      violatedDirective,
      blockedUri,
      sourceFile,
      lineNumber,
      statusCode,
      timestamp: new Date().toISOString(),
    }));

    return NextResponse.json({ success: true, status: "received" });
  } catch {
    return NextResponse.json({ success: false }, { status: 500 });
  }
}