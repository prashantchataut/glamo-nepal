/**
 * Proxy-trust verification — backend mirror of the contract signed by the
 * Vercel edge proxy (see src/lib/proxy-trust.ts in the frontend).
 *
 * The proxy validates the admin cookie + CSRF locally, then mints a short-lived
 * (30s) HMAC-signed assertion that the backend verifies with PROXY_TRUST_SECRET.
 * This collapses the 3-synced-secrets requirement (ADMIN_SESSION_SECRET +
 * CSRF_SECRET + AUTH_SECRET) to a single PROXY_TRUST_SECRET, and keeps admin
 * auth working even when the cookie-signing secrets drift across deployments.
 *
 * SECURITY: 30s TTL defeats replay. HMAC with PROXY_TRUST_SECRET defeats
 * forgery — the Worker's public URL is harmless because direct callers cannot
 * mint valid headers without the key. Legacy cookie auth remains a fallback.
 */

export const PROXY_TRUST_HEADER = "x-proxy-trust";
export const PROXY_TRUST_TTL_SECONDS = 30;

export interface ProxyTrustPayload {
  v: 1;
  /**
   * Verified admin email from the session cookie. Empty for anonymous
   * (customer) requests where the proxy only validated CSRF, not identity.
   * The backend treats an empty email as "CSRF-validated anonymous" and must
   * NOT grant admin privileges.
   */
  email: string;
  /** Verified role (OWNER / SUPER_ADMIN / admin). Empty for anonymous. */
  role: string;
  name?: string;
  /** True when the proxy validated a CSRF cookie+header pair for this request. */
  csrfValidated?: boolean;
  iat: number;
  exp: number;
}

export interface VerifiedProxyTrust {
  ok: boolean;
  payload: ProxyTrustPayload | null;
  reason?: string;
}

function bytesToBase64Url(bytes: Uint8Array): string {
  let binary = "";
  bytes.forEach((b) => (binary += String.fromCharCode(b)));
  return btoa(binary).replaceAll("+", "-").replaceAll("/", "_").replaceAll("=", "");
}

function base64UrlToBytes(value: string): Uint8Array {
  const padded = value.replaceAll("-", "+").replaceAll("_", "/").padEnd(Math.ceil(value.length / 4) * 4, "=");
  return Uint8Array.from(atob(padded), (c) => c.charCodeAt(0));
}

function base64UrlToString(value: string): string {
  return new TextDecoder().decode(base64UrlToBytes(value));
}

async function importHmacKey(secret: string, usage: "sign"[] | "verify"[]) {
  return crypto.subtle.importKey("raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, usage);
}

export function readProxyTrustSecret(c?: { env?: Record<string, string | undefined> }): string {
  // Prefer Worker binding (c.env), fall back to Node process for local/dev.
  const fromBinding = c?.env?.PROXY_TRUST_SECRET
  if (fromBinding) return fromBinding
  if (typeof process !== 'undefined' && process.env.PROXY_TRUST_SECRET) {
    return process.env.PROXY_TRUST_SECRET
  }
  return ''
}

export async function verifyProxyTrust(
  headerValue: string | undefined | null,
  secret: string,
): Promise<VerifiedProxyTrust> {
  if (!headerValue) return { ok: false, reason: "missing" };
  if (!secret) return { ok: false, reason: "no_secret_configured" };

  const dot = headerValue.lastIndexOf(".");
  if (dot <= 0) return { ok: false, reason: "malformed" };

  const encoded = headerValue.slice(0, dot);
  const signature = headerValue.slice(dot + 1);
  if (!encoded || !signature) return { ok: false, reason: "malformed" };

  try {
    const key = await importHmacKey(secret, ["verify"]);
    const sigBytes = base64UrlToBytes(signature);
    const valid = await crypto.subtle.verify("HMAC", key, sigBytes, new TextEncoder().encode(encoded));
    if (!valid) return { ok: false, reason: "bad_signature" };

    const payload = JSON.parse(base64UrlToString(encoded)) as ProxyTrustPayload;
    if (payload.v !== 1) return { ok: false, reason: "bad_version" };
    if (typeof payload.exp !== "number" || payload.exp < Math.floor(Date.now() / 1000)) {
      return { ok: false, reason: "expired" };
    }
    // email/role may be empty for CSRF-validated anonymous requests (customer
    // checkout). The caller decides what privileges to grant; we only assert
    // structural validity here.
    if (typeof payload.email !== "string" || typeof payload.role !== "string") {
      return { ok: false, reason: "incomplete_payload" };
    }

    return { ok: true, payload };
  } catch {
    return { ok: false, reason: "verify_failed" };
  }
}
