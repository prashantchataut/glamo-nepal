import { NextRequest } from "next/server";
import {
  verifyAdminSessionToken,
  ADMIN_SESSION_COOKIE,
  LEGACY_ADMIN_SESSION_COOKIE,
} from "@/lib/admin-auth";
import { validateCsrf } from "@/lib/csrf";
import { signProxyTrust, hasProxyTrustSecret, PROXY_TRUST_HEADER } from "@/lib/proxy-trust";

const API_BASE_URL = process.env.API_BASE_URL || "https://glamo-nepal-api.prashantchataut8.workers.dev/api/v1";

export const runtime = "edge";
export const dynamic = "force-dynamic";

const MUTATING_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);

/**
 * Resolve the admin session cookie from the request. request.cookies is
 * host-agnostic (the Domain attribute is a browser concern), so this works on
 * apex, www, and localhost. Accepts both the current domain-scoped name and
 * the legacy __Host- name.
 */
function readAdminCookie(request: NextRequest): string | undefined {
  return (
    request.cookies.get(ADMIN_SESSION_COOKIE)?.value ??
    request.cookies.get(LEGACY_ADMIN_SESSION_COOKIE)?.value
  );
}

/**
 * The proxy is the single trust boundary for admin traffic. It validates the
 * admin session cookie + CSRF using ITS OWN secrets (which are known-good -
 * that's why /api/admin/login and /api/admin/me work), then cryptographically
 * vouches for the verified identity to the backend via x-proxy-trust. The
 * backend trusts that header with ONE shared key (PROXY_TRUST_SECRET) instead
 * of needing three signing secrets to match across deployments.
 *
 * If PROXY_TRUST_SECRET is not set, we fall back to pure forwarding (legacy
 * behavior) so the deploy does not regress - admin auth will only work in
 * that mode once the cookie secrets are also synced.
 */
async function buildAdminTrustHeader(
  request: NextRequest,
): Promise<{ header: string | null; status?: number; body?: unknown }> {
  // No trust secret configured → can't vouch. Defer to legacy forwarding.
  if (!hasProxyTrustSecret()) {
    return { header: null };
  }

  const sessionToken = readAdminCookie(request);

  // Mutating requests must pass CSRF. We validate it here (with the proxy's
  // own secrets, which are known-good) so the backend does not need
  // CSRF_SECRET to match across deployments. This is what fixes BOTH the
  // admin "CSRF token mismatch" errors AND the customer checkout error.
  if (MUTATING_METHODS.has(request.method.toUpperCase())) {
    const csrf = await validateCsrf(request);
    if (!csrf.valid) {
      // Surface the CSRF failure here as a 403 so the client's existing
      // CSRF-retry logic (fetchWithCsrfRetry) can refresh and retry. Do NOT
      // forward a mutating request that failed CSRF.
      return {
        header: null,
        status: 403,
        body: { success: false, message: csrf.reason || "CSRF validation failed.", code: "CSRF_ERROR" },
      };
    }
  }

  // No session cookie → anonymous (customer) request. If it was mutating and
  // got here, CSRF passed above. Vouch with empty identity + csrfValidated so
  // the backend skips its own (possibly mismatched) CSRF check. The backend
  // must NOT grant admin privileges for an empty-email vouch.
  if (!sessionToken) {
    if (MUTATING_METHODS.has(request.method.toUpperCase())) {
      const trustHeader = await signProxyTrust({
        email: "",
        role: "",
        csrfValidated: true,
      });
      return { header: trustHeader };
    }
    return { header: null };
  }

  const payload = await verifyAdminSessionToken(sessionToken);

  // Invalid/expired cookie → forward without a vouch. The backend will 401
  // and the client's global interceptor redirects to login. We must NOT block
  // here because non-admin cookies on shared paths (e.g. a customer hitting
  // /products) must still work.
  if (!payload) {
    return { header: null };
  }

  const trustHeader = await signProxyTrust({
    email: payload.email,
    role: payload.role,
    name: payload.name,
    csrfValidated: MUTATING_METHODS.has(request.method.toUpperCase()),
  });
  return { header: trustHeader };
}

async function proxyRequest(request: NextRequest) {
  const trust = await buildAdminTrustHeader(request);

  // CSRF failed at the proxy - short-circuit without hitting the backend.
  if (trust.status && trust.body) {
    return new Response(JSON.stringify(trust.body), {
      status: trust.status,
      headers: { "content-type": "application/json" },
    });
  }

  const url = new URL(request.url);
  const targetPath = url.pathname.replace(/^\/api\/v1/, "");
  const targetUrl = `${API_BASE_URL}${targetPath}${url.search}`;

  const headers = new Headers(request.headers);
  headers.delete("host");

  // CRITICAL: preserve the REAL client IP for audit logs. The previous code
  // did `headers.set("x-forwarded-for", request.headers.get("x-forwarded-for") || "unknown")`
  // which OVERWROTE the real IP with the literal string "unknown" whenever
  // the inbound request didn't carry x-forwarded-for (e.g. when Cloudflare
  // only sets cf-connecting-ip). That's why every audit log entry had
  // ip_address=NULL — the backend was receiving "unknown" or empty.
  const clientIp =
    request.headers.get("cf-connecting-ip") ||
    request.headers.get("true-client-ip") ||
    request.headers.get("x-real-ip") ||
    (request.headers.get("x-forwarded-for") || "").split(",")[0].trim() ||
    "";
  if (clientIp) {
    headers.set("x-forwarded-for", clientIp);
    headers.set("x-real-ip", clientIp);
    headers.set("cf-connecting-ip", clientIp);
  } else if (!headers.has("x-forwarded-for")) {
    headers.set("x-forwarded-for", "");
  }

  headers.set("x-forwarded-host", url.host);
  headers.set("x-forwarded-proto", url.protocol.replace(":", ""));
  headers.set("x-request-id", crypto.randomUUID());

  const cookieHeader = request.headers.get("cookie");
  if (cookieHeader) {
    headers.set("cookie", cookieHeader);
  }

  // Attach the proxy-trust vouch if the admin cookie validated locally.
  if (trust.header) {
    headers.set(PROXY_TRUST_HEADER, trust.header);
  }

  try {
    const response = await fetch(targetUrl, {
      method: request.method,
      headers,
      body: request.method !== "GET" && request.method !== "HEAD" ? request.body : undefined,
      redirect: "manual",
    });

    const responseHeaders = new Headers(response.headers);
    responseHeaders.delete("x-powered-by");
    responseHeaders.set("x-proxy-pass", "vercel-edge");

    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: responseHeaders,
    });
  } catch (error) {
    return new Response(
      JSON.stringify({ success: false, message: "Backend service unavailable. Please try again later." }),
      { status: 502, headers: { "content-type": "application/json" } }
    );
  }
}

export const GET = proxyRequest;
export const POST = proxyRequest;
export const PUT = proxyRequest;
export const PATCH = proxyRequest;
export const DELETE = proxyRequest;
export const OPTIONS = proxyRequest;
