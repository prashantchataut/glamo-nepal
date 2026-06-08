import type { ApiErrorResponse, ApiResponse } from "@/lib/api/contracts";

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

async function getAuthToken(): Promise<string | null> {
  if (typeof window === "undefined") return null;
  try {
    const { auth } = await import("@/lib/firebase");
    const authInstance = auth();
    const currentUser = authInstance?.currentUser ?? null;
    if (currentUser) {
      return await currentUser.getIdToken();
    }
  } catch {}
  return null;
}

export async function apiRequest<T>(path: string, init?: RequestInit): Promise<ApiResponse<T>> {
  const apiBaseUrl = getApiBaseUrl();

  const headers = new Headers(init?.headers);
  const isFormData = init?.body instanceof FormData;
  if (!headers.has("Content-Type") && !isFormData) headers.set("Content-Type", "application/json");

  const token = await getAuthToken();
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  let response: Response;
  try {
    response = await fetch(`${apiBaseUrl.replace(/\/$/, "")}/${path.replace(/^\//, "")}`, {
      ...init,
      headers,
      credentials: "include",
    });
  } catch (error) {
    throw new GlamoApiError({
      status: "error",
      code: "NETWORK_ERROR",
      message: error instanceof Error ? error.message : "A network error occurred",
    });
  }

  const rawPayload = await response.json().catch(() => null);
  const payload = normalizeApiPayload<T>(rawPayload);

  if (!response.ok || payload.status === "error") {
    throw new GlamoApiError(payload as ApiErrorResponse, response.status);
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