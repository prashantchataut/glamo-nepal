import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const CSRF_COOKIE_NAME = "glamo-csrf-token";
const CSRF_SECRET = process.env.CSRF_SECRET || process.env.AUTH_SECRET || "";

function generateCsrfToken(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  let hex = "";
  for (let i = 0; i < array.length; i++) {
    hex += array[i].toString(16).padStart(2, "0");
  }
  return hex;
}

async function signCsrfToken(rawToken: string): Promise<string> {
  if (!CSRF_SECRET) return rawToken;
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey("raw", encoder.encode(CSRF_SECRET), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(rawToken));
  const sigB64 = btoa(String.fromCharCode(...new Uint8Array(signature))).replaceAll("+", "-").replaceAll("/", "_").replaceAll("=", "");
  return `${rawToken}.${sigB64}`;
}

export async function GET(request: NextRequest) {
  const IS_PRODUCTION = process.env.NODE_ENV === "production";
  let rawToken: string;
  let signedCookie = request.cookies.get(CSRF_COOKIE_NAME)?.value;

  if (signedCookie) {
    const dotIndex = signedCookie.lastIndexOf(".");
    rawToken = dotIndex === -1 ? signedCookie : signedCookie.slice(0, dotIndex);
  } else {
    rawToken = generateCsrfToken();
    signedCookie = await signCsrfToken(rawToken);
  }

  const response = NextResponse.json(
    { success: true, csrfToken: rawToken },
    { headers: { "x-csrf-token": rawToken } },
  );

  if (!request.cookies.get(CSRF_COOKIE_NAME)?.value && signedCookie) {
    response.cookies.set(CSRF_COOKIE_NAME, signedCookie, {
      httpOnly: true,
      sameSite: "strict",
      secure: IS_PRODUCTION,
      path: "/",
      maxAge: 60 * 60 * 24,
    });
  }

  return response;
}
