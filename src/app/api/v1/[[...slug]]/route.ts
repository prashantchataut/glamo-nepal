import { NextRequest } from "next/server";
import {
  verifyAdminSessionToken,
  ADMIN_SESSION_COOKIE,
  LEGACY_ADMIN_SESSION_COOKIE,
} from "@/lib/admin-auth";
import { validateCsrf } from "@/lib/csrf";
import { signProxyTrust, hasProxyTrustSecret, PROXY_TRUST_HEADER } from "@/lib/proxy-trust";
import { backendBinding } from "@/lib/cf-context";

const API_BASE_URL_FALLBACK =
  "https://glamo-nepal-api.prashantchataut8.workers.dev/api/v1";
const API_BASE_URL_CUSTOM =
  process.env.API_BASE_URL ||
  "https://api.glamonepal.com/api/v1";

export const dynamic = "force-dynamic";

const MUTATING_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);

/**
 * Cloudflare edge errors that indicate the backend is unreachable at the
 * routing layer (not a real API error). When we detect one of these in a
 * backend response, we MUST NOT forward it as-is — the frontend's error
 * handler interprets any 403 as "permission denied" and shows the user
 * "You do not have permission to perform this action", which is misleading.
 *
 * Instead, surface these as 502 Bad Gateway with a clear message so the
 * frontend's STATUS_FALLBACKS table shows "Something went wrong on our end".
 *
 * These bodies are tiny (Cloudflare returns short text bodies like
 * "error code: 1000"), so reading them is cheap.
 */
const CLOUDFLARE_EDGE_ERROR_PATTERNS = [
  "error code: 1000", // DNS points to prohibited IP
  "error code: 1001", // DNS resolution error
  "error code: 1003", // Direct IP access not allowed
  "error code: 1004", // Host not configured
  "error code: 1010", // Access denied (browser integrity)
  "error code: 1011", // Access denied (hotlink protection)
  "error code: 1012", // Access denied (ToS violation)
  "error code: 1013", // HTTP hostname not allowed
  "error code: 1014", // CNAME cross-user banned
  "error code: 1015", // Rate limited
  "error code: 1016", // Origin DNS error
  "error code: 1018", // Domain misconfigured
  "error code: 1019", // Compute server error
  "error code: 1020", // Access denied (WAF)
  "DNS points to prohibited IP",
  "Cloudflare Ray ID",
];

function looksLikeCloudflareEdgeError(status: number, body: string): boolean {
  // Cloudflare edge errors come back as 4xx or 5xx with very short text bodies.
  // Real API responses are JSON starting with `{`.
  if (status < 400) return false;
  if (body.length > 500) return false; // CF edge errors are tiny
  if (body.trimStart().startsWith("{")) return false; // JSON = real API response
  return CLOUDFLARE_EDGE_ERROR_PATTERNS.some((p) => body.includes(p));
}

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

  const ROLE_MAP: Record<string, string> = { admin: 'ADMIN', owner: 'OWNER', super_admin: 'SUPER_ADMIN', superadmin: 'SUPER_ADMIN' }
  const normalizedRole = ROLE_MAP[payload.role] || ROLE_MAP[payload.role.toLowerCase()] || payload.role.toUpperCase()

  const trustHeader = await signProxyTrust({
    email: payload.email,
    role: normalizedRole,
    name: payload.name,
    csrfValidated: MUTATING_METHODS.has(request.method.toUpperCase()),
  });
  return { header: trustHeader };
}

async function proxyRequest(request: NextRequest) {
  const trust = await buildAdminTrustHeader(request);

  if (trust.status && trust.body) {
    return new Response(JSON.stringify(trust.body), {
      status: trust.status,
      headers: { "content-type": "application/json" },
    });
  }

  const url = new URL(request.url);
  const targetPath = url.pathname.replace(/^\/api\/v1/, "") || "/";
  const targetSearch = url.search;

  const apiWorker = await backendBinding();
  const useServiceBinding = apiWorker !== null;
  const bindingTargetUrl = `https://api-worker.internal/api/v1${targetPath}${targetSearch}`;
  const workersDevUrl = `${API_BASE_URL_FALLBACK}${targetPath}${targetSearch}`;
  const customDomainUrl = `${API_BASE_URL_CUSTOM}${targetPath}${targetSearch}`;

  const headers = new Headers(request.headers);
  headers.delete("host");

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

  if (trust.header) {
    headers.set(PROXY_TRUST_HEADER, trust.header);
  }

  const bodyInit = request.method !== "GET" && request.method !== "HEAD" ? request.body : undefined;

  let response: Response;

  if (useServiceBinding) {
    try {
      response = await apiWorker!.fetch(bindingTargetUrl, {
        method: request.method,
        headers,
        body: bodyInit,
        redirect: "manual",
      });
    } catch {
      console.error("[proxy] service binding failed, falling back to workers.dev");
      try {
        response = await fetch(workersDevUrl, {
          method: request.method,
          headers,
          body: bodyInit,
          redirect: "manual",
        });
      } catch {
        console.error("[proxy] workers.dev failed, trying custom domain");
        try {
          response = await fetch(customDomainUrl, {
            method: request.method,
            headers,
            body: bodyInit,
            redirect: "manual",
          });
        } catch {
          return new Response(
            JSON.stringify({ success: false, message: "Backend service unavailable.", code: "BACKEND_UNREACHABLE" }),
            { status: 502, headers: { "content-type": "application/json" } },
          );
        }
      }
    }
  } else {
    try {
      response = await fetch(workersDevUrl, {
        method: request.method,
        headers,
        body: bodyInit,
        redirect: "manual",
      });
    } catch {
      try {
        response = await fetch(customDomainUrl, {
          method: request.method,
          headers,
          body: bodyInit,
          redirect: "manual",
        });
      } catch {
        return new Response(
          JSON.stringify({ success: false, message: "Backend service unavailable.", code: "BACKEND_UNREACHABLE" }),
          { status: 502, headers: { "content-type": "application/json" } },
        );
      }
    }
  }

  if (response.status >= 400 && response.status < 500) {
    const cloned = response.clone();
    const bodyText = await cloned.text().catch(() => "");
    if (looksLikeCloudflareEdgeError(response.status, bodyText)) {
      return new Response(
        JSON.stringify({ success: false, message: "Backend temporarily unreachable.", code: "BACKEND_EDGE_ERROR" }),
        { status: 502, headers: { "content-type": "application/json" } },
      );
    }
  }

  const responseHeaders = new Headers(response.headers);
  responseHeaders.delete("x-powered-by");

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: responseHeaders,
  });
}

export const GET = proxyRequest;
export const POST = proxyRequest;
export const PUT = proxyRequest;
export const PATCH = proxyRequest;
export const DELETE = proxyRequest;
export const OPTIONS = proxyRequest;
