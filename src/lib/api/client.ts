import type { ApiErrorResponse, ApiResponse } from "@/lib/api/contracts";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "";

export class GlamoApiError extends Error {
  code?: string;
  fieldErrors?: Record<string, string[]>;

  constructor(error: ApiErrorResponse) {
    super(error.message);
    this.name = "GlamoApiError";
    this.code = error.code;
    this.fieldErrors = error.fieldErrors;
  }
}

export async function apiRequest<T>(path: string, init?: RequestInit): Promise<ApiResponse<T>> {
  if (!API_BASE_URL) {
    throw new GlamoApiError({
      status: "error",
      code: "API_BASE_URL_MISSING",
      message: "NEXT_PUBLIC_API_BASE_URL is not configured. Use mock catalog methods until the backend is ready.",
    });
  }

  const headers = new Headers(init?.headers);
  if (!headers.has("Content-Type")) headers.set("Content-Type", "application/json");

  const response = await fetch(`${API_BASE_URL.replace(/\/$/, "")}/${path.replace(/^\//, "")}`, {
    ...init,
    headers,
    credentials: "include",
  });

  const payload = (await response.json()) as ApiResponse<T> | ApiErrorResponse;
  if (!response.ok || payload.status === "error") {
    throw new GlamoApiError(payload as ApiErrorResponse);
  }
  return payload as ApiResponse<T>;
}
