/**
 * Canonical admin roles used across the whole stack (frontend cookie, proxy
 * trust header, backend requireRole gate, DB users.role). Everything normalizes
 * to these exact UPPERCASE strings — see normalizeAdminRole() below. The legacy
 * lowercase "admin" value is still accepted on read for backwards compatibility
 * with cookies minted before this normalization, but is never written anymore.
 */
export type AdminRole = "OWNER" | "SUPER_ADMIN" | "ADMIN";

export interface AdminSessionPayload {
  email: string;
  role: AdminRole;
  name: string;
  exp: number;
  jti: string;
}

// Domain-scoped cookie (NOT __Host- prefixed): the apex glamonepal.com redirects
// to www.glamonepal.com, and __Host- cookies are host-locked — they die across
// that redirect. A .glamonepal.com-domain cookie survives the redirect so the
// admin session works on both apex and www. Kept httpOnly + Secure + SameSite.
// Old sessions may still carry the __Host- name, so readers accept either.
export const ADMIN_SESSION_COOKIE = "glamo-admin-session";
export const LEGACY_ADMIN_SESSION_COOKIE = "__Host-glamo-admin-session";
export const ADMIN_SESSION_MAX_AGE_SECONDS = 60 * 60 * 8;

/**
 * Normalize any role spelling we have ever written (legacy lowercase "admin",
 * DB variants, env-derived values) into the canonical AdminRole set. Unknown
 * values default to "ADMIN" (least-privilege) rather than granting power.
 *
 * This is the single place that reconciles the role vocabulary mismatch that
 * previously caused SUPER_ADMIN-gated endpoints (coupons, banners, popups,
 * gallery, team) to 403 a logged-in admin: the cookie used to hardcode the
 * literal string "admin", which requireRole's ROLE_HIERARCHY did not recognize.
 */
export function normalizeAdminRole(role: string | undefined | null): AdminRole {
  const r = String(role ?? "").trim().toUpperCase();
  if (r === "OWNER") return "OWNER";
  if (r === "SUPER_ADMIN" || r === "SUPERADMIN") return "SUPER_ADMIN";
  // "ADMIN" and the legacy lowercase "admin" both map to ADMIN.
  if (r === "ADMIN") return "ADMIN";
  return "ADMIN";
}

function getSecret() {
  const secret = process.env.ADMIN_SESSION_SECRET || process.env.AUTH_SECRET;
  if (!secret) {
    throw new Error("ADMIN_SESSION_SECRET or AUTH_SECRET environment variable is required. Set it in .env.local before running the admin panel.");
  }
  return secret;
}

function bytesToBase64Url(bytes: Uint8Array) {
  let binary = "";
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });
  return btoa(binary).replaceAll("+", "-").replaceAll("/", "_").replaceAll("=", "");
}

function base64UrlToText(value: string) {
  const padded = value.replaceAll("-", "+").replaceAll("_", "/").padEnd(Math.ceil(value.length / 4) * 4, "=");
  return atob(padded);
}

async function hmacSha256(value: string) {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey("raw", encoder.encode(getSecret()), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(value));
  return bytesToBase64Url(new Uint8Array(signature));
}

export function getAdminCredentials() {
  const email = process.env.ADMIN_EMAIL;
  if (!email) {
    throw new Error("ADMIN_EMAIL environment variable is required. Set it in .env.local before running the admin panel.");
  }
  return {
    email,
    name: process.env.ADMIN_NAME || "GLAMO Admin",
  };
}

export async function createAdminSessionToken(email: string, name = "GLAMO Admin", role: AdminRole = "ADMIN") {
  const jti = crypto.randomUUID();
  const payload: AdminSessionPayload = {
    email,
    name,
    role: normalizeAdminRole(role),
    exp: Math.floor(Date.now() / 1000) + ADMIN_SESSION_MAX_AGE_SECONDS,
    jti,
  };
  const encodedPayload = bytesToBase64Url(new TextEncoder().encode(JSON.stringify(payload)));
  const signature = await hmacSha256(encodedPayload);
  return `${encodedPayload}.${signature}`;
}

export async function verifyAdminSessionToken(token?: string | null): Promise<AdminSessionPayload | null> {
  if (!token || !token.includes(".")) return null;
  const [encodedPayload, signature] = token.split(".");
  if (!encodedPayload || !signature) return null;

  try {
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey("raw", encoder.encode(getSecret()), { name: "HMAC", hash: "SHA-256" }, false, ["verify"]);
    const signatureBytes = Uint8Array.from(atob(signature.replaceAll("-", "+").replaceAll("_", "/").padEnd(Math.ceil(signature.length / 4) * 4, "=")), (c) => c.charCodeAt(0));
    const valid = await crypto.subtle.verify("HMAC", key, signatureBytes, encoder.encode(encodedPayload));
    if (!valid) return null;

    const raw = JSON.parse(base64UrlToText(encodedPayload)) as Partial<AdminSessionPayload> & { role?: string };
    // Reject tokens that don't look like admin sessions at all. Accept both the
    // canonical UPPERCASE roles and the legacy lowercase "admin" value, then
    // normalize so downstream code only ever sees the canonical set.
    if (!raw.role) return null;
    const role = normalizeAdminRole(raw.role);
    if (!raw.exp || raw.exp < Math.floor(Date.now() / 1000)) return null;
    return {
      email: raw.email!,
      name: raw.name ?? "GLAMO Admin",
      role,
      exp: raw.exp,
      jti: raw.jti!,
    };
  } catch {
    return null;
  }
}
