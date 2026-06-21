/**
 * Proxy-trust signing utilities — shared contract between the Vercel edge
 * proxy (/api/v1/*) and the Cloudflare Worker backend.
 *
 * PROBLEM THIS SOLVES
 * -------------------
 * The admin session cookie and CSRF token are HMAC-signed. Historically the
 * Vercel frontend and the Worker each had to hold IDENTICAL copies of three
 * secrets (ADMIN_SESSION_SECRET, CSRF_SECRET, AUTH_SECRET) to sign/verify.
 * When any one drifted — which happened silently — the entire admin panel
 * 401'd ("Failed to load X" everywhere) and checkout broke with CSRF errors,
 * with zero indication that the cause was a config mismatch.
 *
 * FIX
 * ---
 * The Vercel proxy becomes the SINGLE trust boundary for admin traffic. It
 * validates the admin cookie + CSRF locally using its own (working) secrets,
 * then cryptographically VOUCHES for the verified identity to the backend via
 * the `x-proxy-trust` header. The header carries:
 *
 *   x-proxy-trust: <base64url(payload)>.<base64url(hmac-sha256(sig)>
 *
 * where payload = { v, email, role, name?, iat, exp }.
 *
 * The backend verifies this header with ONE shared key (PROXY_TRUST_SECRET).
 * This collapses the 3-synced-secrets requirement to 1, and crucially makes
 * admin auth work even when the cookie-signing secrets are out of sync
 * (because the proxy uses its own secrets to validate, not the backend's).
 *
 * SECURITY MODEL
 * --------------
 * - Short TTL (30s) defeats replay: a captured header is useless after 30s.
 * - HMAC-SHA256 with PROXY_TRUST_SECRET defeats forgery: only the proxy
 *   (which holds the key) can mint valid headers. The Worker's public URL is
 *   irrelevant — direct callers cannot forge this without the key.
 * - The backend STILL accepts the legacy cookie path as a fallback, so a
 *   missing PROXY_TRUST_SECRET does not regress working deployments.
 */

export const PROXY_TRUST_HEADER = "x-proxy-trust";
export const PROXY_TRUST_TTL_SECONDS = 30;

export interface ProxyTrustPayload {
  /** Schema version, bump if payload shape changes. */
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
  /** Display name, optional. */
  name?: string;
  /** True when the proxy validated a CSRF cookie+header pair for this request. */
  csrfValidated?: boolean;
  /** Issued-at, unix seconds. */
  iat: number;
  /** Expiry, unix seconds. Backend rejects if exp < now. */
  exp: number;
}

function getProxyTrustSecret(): string {
  // Single source of truth. Deliberately distinct from AUTH_SECRET so a leak
  // of one does not compromise the other, and so its presence is unambiguous.
  const secret = process.env.PROXY_TRUST_SECRET;
  if (!secret) {
    throw new Error(
      "PROXY_TRUST_SECRET is required. Set the same value on the Vercel proxy and the Cloudflare Worker. " +
        "Generate one: node -e \"console.log(require('crypto').randomBytes(48).toString('base64'))\""
    );
  }
  return secret;
}

/** True when a PROXY_TRUST_SECRET is configured. Used by callers to gate the vouch path. */
export function hasProxyTrustSecret(): boolean {
  return Boolean(process.env.PROXY_TRUST_SECRET);
}

function bytesToBase64Url(bytes: Uint8Array): string {
  let binary = "";
  bytes.forEach((b) => (binary += String.fromCharCode(b)));
  // btoa is available in both Node 18+ and the edge runtime.
  return btoa(binary).replaceAll("+", "-").replaceAll("/", "_").replaceAll("=", "");
}

function base64UrlToBytes(value: string): Uint8Array {
  const padded = value.replaceAll("-", "+").replaceAll("_", "/").padEnd(Math.ceil(value.length / 4) * 4, "=");
  const binary = atob(padded);
  // Allocate a fresh ArrayBuffer (not SharedArrayBuffer) so the result is
  // assignable to BufferSource under TS 5.7+'s stricter lib types.
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

function base64UrlToString(value: string): string {
  return new TextDecoder().decode(base64UrlToBytes(value));
}

async function importHmacKey(secret: string, usage: "sign"[] | "verify"[]) {
  return crypto.subtle.importKey("raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, usage);
}

/**
 * Sign a verified identity into a proxy-trust header value.
 * Called by the edge proxy AFTER it has validated the admin cookie.
 */
export async function signProxyTrust(payload: Omit<ProxyTrustPayload, "v" | "iat" | "exp">): Promise<string> {
  const secret = getProxyTrustSecret();
  const now = Math.floor(Date.now() / 1000);
  const full: ProxyTrustPayload = { v: 1, iat: now, exp: now + PROXY_TRUST_TTL_SECONDS, ...payload };

  const encoded = bytesToBase64Url(new TextEncoder().encode(JSON.stringify(full)));
  const key = await importHmacKey(secret, ["sign"]);
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(encoded));
  const sigB64 = bytesToBase64Url(new Uint8Array(sig));
  return `${encoded}.${sigB64}`;
}

export interface VerifiedProxyTrust {
  ok: boolean;
  payload: ProxyTrustPayload | null;
  reason?: string;
}

/**
 * Verify a proxy-trust header value. Called by the backend.
 * Returns { ok: false, reason } on any failure — never throws.
 *
 * @param headerValue raw value of the x-proxy-trust header, or undefined
 * @param secret       PROXY_TRUST_SECRET as known to the backend. If empty,
 *                     returns ok:false with a clear reason (the vouch path is
 *                     disabled and the caller should fall back to legacy auth).
 */
export async function verifyProxyTrust(headerValue: string | undefined | null, secret: string): Promise<VerifiedProxyTrust> {
  if (!headerValue) return { ok: false, payload: null, reason: "missing" };
  if (!secret) return { ok: false, payload: null, reason: "no_secret_configured" };

  const dot = headerValue.lastIndexOf(".");
  if (dot <= 0) return { ok: false, payload: null, reason: "malformed" };

  const encoded = headerValue.slice(0, dot);
  const signature = headerValue.slice(dot + 1);
  if (!encoded || !signature) return { ok: false, payload: null, reason: "malformed" };

  try {
    const key = await importHmacKey(secret, ["verify"]);
    // Pass the underlying ArrayBuffer directly (Uint8Array<ArrayBufferLike>
    // is not assignable to BufferSource under TS 5.7+'s stricter lib types).
    const sigBytes = base64UrlToBytes(signature);
    const valid = await crypto.subtle.verify("HMAC", key, sigBytes.buffer as ArrayBuffer, new TextEncoder().encode(encoded));
    if (!valid) return { ok: false, payload: null, reason: "bad_signature" };

    const payload = JSON.parse(base64UrlToString(encoded)) as ProxyTrustPayload;
    if (payload.v !== 1) return { ok: false, payload: null, reason: "bad_version" };
    if (typeof payload.exp !== "number" || payload.exp < Math.floor(Date.now() / 1000)) {
      return { ok: false, payload: null, reason: "expired" };
    }
    if (typeof payload.email !== "string" || typeof payload.role !== "string") {
      return { ok: false, payload: null, reason: "incomplete_payload" };
    }

    return { ok: true, payload };
  } catch {
    return { ok: false, payload: null, reason: "verify_failed" };
  }
}

/** Backend-side helper mirroring getProxyTrustSecret for the verify path. */
export function readProxyTrustSecret(): string {
  return process.env.PROXY_TRUST_SECRET || "";
}
