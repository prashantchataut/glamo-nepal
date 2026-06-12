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
  if (!CSRF_SECRET) {
    return signedToken.length >= 32 ? signedToken : null;
  }

  const dotIndex = signedToken.lastIndexOf(".");
  if (dotIndex === -1) return null;
  const token = signedToken.slice(0, dotIndex);
  const providedSig = signedToken.slice(dotIndex + 1);

  try {
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey("raw", encoder.encode(getSecret()), { name: "HMAC", hash: "SHA-256" }, false, ["verify"]);
    const sigBytes = Uint8Array.from(atob(providedSig.replaceAll("-", "+").replaceAll("_", "/")), (c) => c.charCodeAt(0));
    const valid = await crypto.subtle.verify("HMAC", key, sigBytes, encoder.encode(token));
    if (!valid) return null;
    return token;
  } catch {
    return null;
  }
}

export { CSRF_COOKIE_NAME, CSRF_HEADER_NAME };

let csrfPromise: Promise<string> | null = null;

function getCsrfToken(): string {
  if (typeof window === "undefined") return "";
  const stored = typeof sessionStorage !== "undefined" ? sessionStorage.getItem(CSRF_STORAGE_KEY) : null;
  return stored || "";
}

export function setCsrfToken(token: string): void {
  if (typeof window === "undefined") return;
  if (token) {
    sessionStorage.setItem(CSRF_STORAGE_KEY, token);
  }
}

function clearCsrfToken(): void {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(CSRF_STORAGE_KEY);
  csrfPromise = null;
}

export function csrfHeaders(): Record<string, string> {
  const token = getCsrfToken();
  return token ? { [CSRF_HEADER_NAME]: token } : {};
}

export async function ensureCsrfToken(forceRefresh?: boolean): Promise<string> {
  if (!forceRefresh) {
    const existing = getCsrfToken();
    if (existing) return existing;

    if (csrfPromise) return csrfPromise;
  } else {
    csrfPromise = null;
  }

  csrfPromise = fetch("/api/csrf", { credentials: "include" })
    .then(async (res) => {
      if (!res.ok) throw new Error(`CSRF fetch failed: ${res.status}`);
      const token = res.headers.get(CSRF_HEADER_NAME);
      if (token) { setCsrfToken(token); return token; }
      const data = await res.json();
      if (data?.csrfToken) { setCsrfToken(data.csrfToken); return data.csrfToken; }
      throw new Error("No CSRF token in response");
    })
    .catch((err) => {
      csrfPromise = null;
      console.error("[CSRF] Failed to fetch token:", err);
      return "";
    });

  return csrfPromise;
}

export { clearCsrfToken };

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