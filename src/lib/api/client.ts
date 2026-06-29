import type { ApiErrorResponse, ApiResponse } from "@/lib/api/contracts";
import { ensureCsrfToken, CSRF_HEADER_NAME } from "@/lib/csrf";

const MUTATING_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);

export class GlamoApiError extends Error {
  code?: string;
  fieldErrors?: Record<string, string[]>;
  status?: number;

  constructor(error: ApiErrorResponse, status?: number) {
    super(error.message);
    this.name = "GlamoApiError";
    this.code = error.code;
    this.fieldErrors = error.fieldErrors;
    this.status = status;
  }
}

function getApiBaseUrl(): string {
  const url = process.env.NEXT_PUBLIC_API_BASE_URL;
  if (url) return url;
  return "/api/v1";
}

// Auth readiness gate (tokenReady).
//
// Problem: on initial page load, components that call apiRequest() on mount
// (cart badge, wishlist count, etc.) fire BEFORE Firebase has reported the
// current user via onAuthStateChanged. getAuthToken() then sees
// auth().currentUser === null and returns null, so the request goes out with
// no Authorization header and the backend returns 401 — producing the 401
// flood observed in production.
//
// Fix: a module-level promise that resolves the first time onAuthStateChanged
// fires. getAuthToken() awaits this gate (with a short timeout) before
// reading currentUser, so the token is available instead of null.
let authReadyGate: Promise<void> | null = null;

function ensureAuthReadyGate(): void {
  if (authReadyGate || typeof window === "undefined") return;
  authReadyGate = import("@/lib/firebase")
    .then(({ auth, onAuthStateChanged, isFirebaseConfigured }) => {
      if (!isFirebaseConfigured) return; // not configured — don't block
      return new Promise<void>((resolve) => {
        // onAuthStateChanged fires once immediately with the persisted user
        // (or null), which is exactly the signal we need.
        const unsubscribe = onAuthStateChanged(auth(), () => {
          unsubscribe();
          resolve();
        });
      });
    })
    .catch(() => {
      /* Firebase not available — requests proceed without a token */
    });
}

async function waitForAuthReady(timeoutMs = 2000): Promise<void> {
  if (!authReadyGate) return;
  await Promise.race([
    authReadyGate,
    new Promise<void>((resolve) => setTimeout(resolve, timeoutMs)),
  ]);
}

async function getAuthToken(forceRefresh = false): Promise<string | null> {
  if (typeof window === "undefined") return null;
  // On the first (non-refresh) call, wait for Firebase to report the auth
  // state so currentUser is populated. Skip on force-refresh — the 401 retry
  // path already has a user; it just needs a fresh token.
  if (!forceRefresh) {
    ensureAuthReadyGate();
    await waitForAuthReady();
  }
  try {
    const { auth } = await import("@/lib/firebase");
    const authInstance = auth();
    const currentUser = authInstance?.currentUser ?? null;
    if (currentUser) {
      return await currentUser.getIdToken(forceRefresh);
    }
  } catch {}
  return null;
}

const STATUS_FALLBACKS: Record<number, { code: string; message: string }> = {
  401: { code: "UNAUTHORIZED", message: "Your session has expired. Please sign in again." },
  403: { code: "FORBIDDEN", message: "You do not have permission to perform this action." },
  429: { code: "RATE_LIMITED", message: "Too many requests, please wait a moment and try again." },
  500: { code: "SERVER_ERROR", message: "Something went wrong on our end. Please try again shortly." },
};

async function sendRequest(apiBaseUrl: string, path: string, init: RequestInit | undefined, token: string | null, csrfToken: string): Promise<Response> {
  const headers = new Headers(init?.headers);
  const isFormData = init?.body instanceof FormData;
  if (!headers.has("Content-Type") && !isFormData) headers.set("Content-Type", "application/json");
  if (token) headers.set("Authorization", `Bearer ${token}`);
  if (csrfToken) headers.set(CSRF_HEADER_NAME, csrfToken);

  return fetch(`${apiBaseUrl.replace(/\/$/, "")}/${path.replace(/^\//, "")}`, {
    ...init,
    headers,
    credentials: "include",
  });
}

export async function apiRequest<T>(path: string, init?: RequestInit): Promise<ApiResponse<T>> {
  const apiBaseUrl = getApiBaseUrl();

  const method = (init?.method || "GET").toUpperCase();
  let csrfToken = "";
  if (MUTATING_METHODS.has(method)) {
    csrfToken = await ensureCsrfToken();
  }

  let token = await getAuthToken();

  let response: Response;
  try {
    response = await sendRequest(apiBaseUrl, path, init, token, csrfToken);
    if (response.status === 401 && token) {
      const refreshed = await getAuthToken(true);
      if (refreshed && refreshed !== token) {
        token = refreshed;
        response = await sendRequest(apiBaseUrl, path, init, token, csrfToken);
      }
    }
  } catch (error) {
    throw new GlamoApiError({
      status: "error",
      code: "NETWORK_ERROR",
      message: error instanceof Error ? error.message : "Unable to connect. Please check your connection and try again.",
    });
  }

  const rawPayload = await response.json().catch(() => null);
  const payload = normalizeApiPayload<T>(rawPayload);

  if (!response.ok || payload.status === "error") {
    const error = payload as ApiErrorResponse;
    const fallback = STATUS_FALLBACKS[response.status];
    if (fallback && (!rawPayload || error.code === "UNEXPECTED_API_RESPONSE")) {
      error.code = fallback.code;
      error.message = fallback.message;
    }
    throw new GlamoApiError(error, response.status);
  }

  return payload as ApiResponse<T>;
}

export function normalizeApiPayload<T>(payload: unknown): ApiResponse<T> | ApiErrorResponse {
  if (payload && typeof payload === "object") {
    const record = payload as Record<string, unknown>;

    if (record.status === "success" || record.status === "error") {
      return payload as ApiResponse<T> | ApiErrorResponse;
    }

    if (record.success === true) {
      let meta: ApiResponse<T>["meta"] | undefined;
      if (record.pagination && typeof record.pagination === "object") {
        const p = record.pagination as Record<string, unknown>;
        meta = {
          page: typeof p.page === "number" ? p.page : undefined,
          perPage: typeof p.limit === "number" ? p.limit : undefined,
          total: typeof p.total === "number" ? p.total : undefined,
          totalPages: typeof p.totalPages === "number" ? p.totalPages : undefined,
        };
      }
      return {
        status: "success",
        data: record.data as T,
        message: typeof record.message === "string" ? record.message : undefined,
        meta,
      };
    }

    if (record.success === false) {
      return {
        status: "error",
        message: typeof record.message === "string" ? record.message : "Request failed",
        code: typeof record.code === "string" ? record.code : undefined,
      };
    }
  }

  return {
    status: "error",
    message: "The GLAMO service returned an unexpected response.",
    code: "UNEXPECTED_API_RESPONSE",
  };
}