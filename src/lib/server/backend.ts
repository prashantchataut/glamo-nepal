import "server-only";

/**
 * Server-side bridge to the GLAMO backend API.
 *
 * Resolution order (ALL over HTTP — never imports the Hono app in-process):
 *   1. Cloudflare service binding `API` (in-network when running on a Worker) — see cf-context.ts
 *   2. process.env.API_BASE_URL            (absolute backend URL, e.g. https://api.glamonepal.com/api/v1)
 *   3. process.env.NEXT_PUBLIC_API_BASE_URL (absolute URL only)
 *   4. fallback constant below            (*.workers.dev — last resort, only for local/legacy)
 *
 * The previous version imported the backend in-process when no absolute URL was
 * set. That pulled @libsql/client + the whole backend into the frontend bundle,
 * which breaks the OpenNext (Cloudflare Workers) build. We now ALWAYS go over
 * HTTP. On Cloudflare the call is a service binding (no public hop); elsewhere
 * it's a normal fetch to API_BASE_URL.
 */
import { backendBinding } from "@/lib/cf-context";

const ABSOLUTE_URL = /^https?:\/\//i;
const FALLBACK_BASE_URL =
  "https://glamo-nepal-api.prashantchataut8.workers.dev/api/v1";

function getAbsoluteBaseUrl(): string | null {
  const base =
    process.env.API_BASE_URL ||
    process.env.NEXT_PUBLIC_API_BASE_URL ||
    FALLBACK_BASE_URL;
  return ABSOLUTE_URL.test(base) ? base.replace(/\/$/, "") : null;
}

export interface BackendFetchInit {
  method?: string;
  headers?: Record<string, string>;
  body?: string;
  forwardFrom?: Request;
  timeoutMs?: number;
}

/**
 * Execute a request against the backend. Prefers the Cloudflare service
 * binding (env.API) when available — that call is in-network and needs no
 * absolute URL. Falls back to an HTTP fetch against API_BASE_URL otherwise.
 *
 * `path` is backend-relative (e.g. "/products/abc"). The "/api/v1" prefix is
 * added once, here, for both transport paths so callers stay prefix-agnostic.
 */
async function callBackend(path: string, init: BackendFetchInit): Promise<Response> {
  const method = init.method || "GET";
  const normalizedPath = `/api/v1/${path.replace(/^\/+/, "")}`;
  const headers = new Headers(init.headers);
  if (init.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  if (init.forwardFrom) {
    const cookie = init.forwardFrom.headers.get("cookie");
    const csrf = init.forwardFrom.headers.get("x-csrf-token");
    const authorization = init.forwardFrom.headers.get("authorization");
    if (cookie && !headers.has("cookie")) headers.set("cookie", cookie);
    if (csrf && !headers.has("x-csrf-token")) headers.set("x-csrf-token", csrf);
    if (authorization && !headers.has("authorization")) headers.set("authorization", authorization);

    // CRITICAL: forward client-identifying headers so audit logs record the
    // real client IP and user-agent. Without these, every backend audit
    // entry has ip_address=NULL and the admin cannot investigate abuse.
    const IP_HEADERS = [
      "cf-connecting-ip",
      "true-client-ip",
      "x-real-ip",
      "x-forwarded-for",
    ];
    for (const h of IP_HEADERS) {
      const v = init.forwardFrom.headers.get(h);
      if (v && !headers.has(h)) headers.set(h, v);
    }
    const ua = init.forwardFrom.headers.get("user-agent");
    if (ua && !headers.has("user-agent")) headers.set("user-agent", ua);
  }

  // 1. Cloudflare service binding (in-network) — preferred on Workers.
  const binding = await backendBinding();
  if (binding) {
    return binding.fetch(normalizedPath, { method, headers, body: init.body });
  }

  // 2. HTTP fallback (Vercel / local / binding unavailable).
  const absoluteBase = getAbsoluteBaseUrl();
  if (absoluteBase) {
    // absoluteBase already ends in /api/v1 — strip it to avoid doubling.
    const root = absoluteBase.replace(/\/api\/v1\/?$/, "");
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), init.timeoutMs ?? 10000);
    try {
      return await fetch(`${root}${normalizedPath}`, {
        method,
        headers,
        body: init.body,
        signal: controller.signal,
        cache: "no-store",
      });
    } finally {
      clearTimeout(timer);
    }
  }

  // Should be unreachable (FALLBACK_BASE_URL guarantees a base), but fail loudly.
  throw new Error("No backend transport available (no service binding and no API_BASE_URL).");
}

export async function backendFetch(path: string, init: BackendFetchInit = {}): Promise<Response> {
  return callBackend(path, init);
}

export async function backendJson<T>(path: string, init: BackendFetchInit = {}): Promise<T | null> {
  try {
    const response = await callBackend(path, init);
    if (!response.ok) return null;
    return (await response.json()) as T;
  } catch {
    return null;
  }
}
