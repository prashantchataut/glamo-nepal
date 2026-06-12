import type { ApiErrorResponse, ApiResponse } from "@/lib/api/contracts";
import { csrfHeaders, ensureCsrfToken, setCsrfToken } from "@/lib/csrf";

const MUTATING_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);

function captureCsrfFromResponse(response: Response): void {
  try {
    const token = response.headers?.get("x-csrf-token");
    if (token) setCsrfToken(token);
  } catch {
    // Headers may not be available in test mocks
  }
}

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

async function getAuthToken(forceRefresh = false): Promise<string | null> {
  if (typeof window === "undefined") return null;
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

async function sendRequest(apiBaseUrl: string, path: string, init: RequestInit | undefined, token: string | null): Promise<Response> {
  const headers = new Headers(init?.headers);
  const isFormData = init?.body instanceof FormData;
  if (!headers.has("Content-Type") && !isFormData) headers.set("Content-Type", "application/json");
  if (token) headers.set("Authorization", `Bearer ${token}`);

  const method = (init?.method || "GET").toUpperCase();
  if (MUTATING_METHODS.has(method)) {
    for (const [key, value] of Object.entries(csrfHeaders())) {
      if (!headers.has(key)) headers.set(key, value);
    }
  }

  return fetch(`${apiBaseUrl.replace(/\/$/, "")}/${path.replace(/^\//, "")}`, {
    ...init,
    headers,
    credentials: "include",
  });
}

export async function apiRequest<T>(path: string, init?: RequestInit): Promise<ApiResponse<T>> {
  const apiBaseUrl = getApiBaseUrl();

  const method = (init?.method || "GET").toUpperCase();
  if (MUTATING_METHODS.has(method)) {
    try { await ensureCsrfToken(); } catch { /* proceed with whatever token is available */ }
  }

  let token = await getAuthToken();

  let response: Response;
  try {
    response = await sendRequest(apiBaseUrl, path, init, token);
    captureCsrfFromResponse(response);
    if (response.status === 401 && token) {
      const refreshed = await getAuthToken(true);
      if (refreshed && refreshed !== token) {
        token = refreshed;
        response = await sendRequest(apiBaseUrl, path, init, token);
        captureCsrfFromResponse(response);
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