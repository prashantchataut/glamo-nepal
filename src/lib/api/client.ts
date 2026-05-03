import type { ApiErrorResponse, ApiResponse } from "@/lib/api/contracts";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "";

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

export async function apiRequest<T>(path: string, init?: RequestInit): Promise<ApiResponse<T>> {
  if (!API_BASE_URL) {
    throw new GlamoApiError({
      status: "error",
      code: "API_BASE_URL_MISSING",
      message: "NEXT_PUBLIC_API_BASE_URL is not configured. Use local catalog methods until the API is ready.",
    });
  }

  const headers = new Headers(init?.headers);
  if (!headers.has("Content-Type")) headers.set("Content-Type", "application/json");

  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL.replace(/\/$/, "")}/${path.replace(/^\//, "")}`, {
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

function normalizeApiPayload<T>(payload: unknown): ApiResponse<T> | ApiErrorResponse {
  if (payload && typeof payload === "object") {
    const record = payload as Record<string, unknown>;

    if (record.status === "success" || record.status === "error") {
      return payload as ApiResponse<T> | ApiErrorResponse;
    }

    if (record.success === true) {
      return {
        status: "success",
        data: record.data as T,
        message: typeof record.message === "string" ? record.message : undefined,
        meta: record.pagination && typeof record.pagination === "object" ? (record.pagination as ApiResponse<T>["meta"]) : undefined,
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
