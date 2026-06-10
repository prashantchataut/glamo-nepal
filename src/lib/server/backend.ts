import "server-only";

/**
 * Server-side bridge to the GLAMO backend API.
 * When API_BASE_URL is absolute, requests go over the network.
 * Otherwise, the Hono app is invoked in-process — avoiding broken
 * relative fetch() calls in Node and saving a network hop.
 */

const ABSOLUTE_URL = /^https?:\/\//i;

function getAbsoluteBaseUrl(): string | null {
  const base = process.env.API_BASE_URL || process.env.NEXT_PUBLIC_API_BASE_URL || "";
  return ABSOLUTE_URL.test(base) ? base.replace(/\/$/, "") : null;
}

export interface BackendFetchInit {
  method?: string;
  headers?: Record<string, string>;
  body?: string;
  forwardFrom?: Request;
  timeoutMs?: number;
}

export async function backendFetch(path: string, init: BackendFetchInit = {}): Promise<Response> {
  const headers = new Headers(init.headers);
  if (init.body && !headers.has("Content-Type")) headers.set("Content-Type", "application/json");

  if (init.forwardFrom) {
    const cookie = init.forwardFrom.headers.get("cookie");
    const csrf = init.forwardFrom.headers.get("x-csrf-token");
    const authorization = init.forwardFrom.headers.get("authorization");
    if (cookie && !headers.has("cookie")) headers.set("cookie", cookie);
    if (csrf && !headers.has("x-csrf-token")) headers.set("x-csrf-token", csrf);
    if (authorization && !headers.has("authorization")) headers.set("authorization", authorization);
  }

  const normalizedPath = `/${path.replace(/^\//, "")}`;
  const absoluteBase = getAbsoluteBaseUrl();

  if (absoluteBase) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), init.timeoutMs ?? 10000);
    try {
      return await fetch(`${absoluteBase}${normalizedPath}`, { method: init.method || "GET", headers, body: init.body, signal: controller.signal, cache: "no-store" });
    } finally {
      clearTimeout(timer);
    }
  }

  const { default: app } = await import("../../../backend/src/index");
  return app.request(`/api/v1${normalizedPath}`, { method: init.method || "GET", headers, body: init.body });
}

export async function backendJson<T>(path: string, init: BackendFetchInit = {}): Promise<T | null> {
  try {
    const response = await backendFetch(path, init);
    if (!response.ok) return null;
    return (await response.json()) as T;
  } catch {
    return null;
  }
}