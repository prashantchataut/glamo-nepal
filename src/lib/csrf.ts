const CSRF_COOKIE_NAME = "glamo-csrf-token";
const CSRF_HEADER_NAME = "x-csrf-token";
const CSRF_STORAGE_KEY = "glamo-csrf-raw-token";

const CSRF_SECRET = process.env.CSRF_SECRET || process.env.AUTH_SECRET || "";

function getSecret(): string {
  if (!CSRF_SECRET) {
    throw new Error("CSRF_SECRET or AUTH_SECRET environment variable is required.");
  }
  return CSRF_SECRET;
}

async function signToken(token: string): Promise<string> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey("raw", encoder.encode(getSecret()), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(token));
  const sigB64 = btoa(String.fromCharCode(...new Uint8Array(signature))).replaceAll("+", "-").replaceAll("/", "_").replaceAll("=", "");
  return `${token}.${sigB64}`;
}

async function verifySignedToken(signedToken: string): Promise<string | null> {
  const dotIndex = signedToken.lastIndexOf(".");
  if (dotIndex === -1) return null;
  const token = signedToken.slice(0, dotIndex);
  const providedSig = signedToken.slice(dotIndex + 1);

  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey("raw", encoder.encode(getSecret()), { name: "HMAC", hash: "SHA-256" }, false, ["verify"]);
  const sigBytes = Uint8Array.from(atob(providedSig.replaceAll("-", "+").replaceAll("_", "/")), (c) => c.charCodeAt(0));
  const valid = await crypto.subtle.verify("HMAC", key, sigBytes, encoder.encode(token));
  if (!valid) return null;
  return token;
}

export { CSRF_COOKIE_NAME, CSRF_HEADER_NAME };

export function getCsrfToken(): string {
  if (typeof window === "undefined") return "";
  const stored = sessionStorage.getItem(CSRF_STORAGE_KEY);
  if (stored) return stored;
  return "";
}

export function setCsrfToken(token: string): void {
  if (typeof window === "undefined") return;
  if (token) sessionStorage.setItem(CSRF_STORAGE_KEY, token);
}

export function csrfHeaders(): Record<string, string> {
  const token = getCsrfToken();
  return token ? { [CSRF_HEADER_NAME]: token } : {};
}

export async function validateCsrf(request: Request): Promise<{ valid: boolean; reason?: string }> {
  if (request.method !== "POST" && request.method !== "PUT" && request.method !== "PATCH" && request.method !== "DELETE") {
    return { valid: true };
  }

  const cookieHeader = request.headers.get("cookie") || "";
  let signedCookieToken = "";
  for (const pair of cookieHeader.split(";")) {
    const trimmed = pair.trim();
    if (trimmed.startsWith(`${CSRF_COOKIE_NAME}=`)) {
      signedCookieToken = decodeURIComponent(trimmed.slice(CSRF_COOKIE_NAME.length + 1));
      break;
    }
  }

  const headerToken = request.headers.get(CSRF_HEADER_NAME);

  if (!signedCookieToken && !headerToken) {
    return { valid: false, reason: "CSRF token missing. Please refresh the page and try again." };
  }

  if (!signedCookieToken) {
    return { valid: false, reason: "Missing CSRF cookie. Please refresh the page and try again." };
  }

  if (!headerToken) {
    return { valid: false, reason: "Missing CSRF token header. Please refresh the page and try again." };
  }

  const cookieToken = await verifySignedToken(signedCookieToken);
  if (!cookieToken) {
    return { valid: false, reason: "Invalid CSRF token. Please refresh the page and try again." };
  }

  if (cookieToken !== headerToken) {
    return { valid: false, reason: "CSRF token mismatch. Please refresh the page and try again." };
  }

  if (cookieToken.length < 32) {
    return { valid: false, reason: "Invalid CSRF token." };
  }

  return { valid: true };
}

export async function createSignedCsrfToken(rawToken: string): Promise<string> {
  return signToken(rawToken);
}