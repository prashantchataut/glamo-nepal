import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { GlamoApiError, apiRequest, normalizeApiPayload } from "@/lib/api/client";
import { isApiErrorResponse } from "@/lib/api/contracts";

function createMockResponse(data: unknown, ok = true, status = 200): Response {
  return {
    ok,
    status,
    json: () => Promise.resolve(data),
    headers: new Headers(),
    clone: () => createMockResponse(data, ok, status) as Response,
  } as Response;
}

describe("GlamoApiError", () => {
  it("sets name, message, code, fieldErrors, and status", () => {
    const err = new GlamoApiError(
      { status: "error", message: "Something went wrong", code: "VALIDATION_ERROR", fieldErrors: { email: ["Invalid email"] } },
      422
    );
    expect(err.name).toBe("GlamoApiError");
    expect(err.message).toBe("Something went wrong");
    expect(err.code).toBe("VALIDATION_ERROR");
    expect(err.fieldErrors).toEqual({ email: ["Invalid email"] });
    expect(err.status).toBe(422);
  });

  it("is instance of Error", () => {
    const err = new GlamoApiError({ status: "error", message: "fail" });
    expect(err).toBeInstanceOf(Error);
    expect(err).toBeInstanceOf(GlamoApiError);
  });

  it("works without optional fields", () => {
    const err = new GlamoApiError({ status: "error", message: "fail" });
    expect(err.code).toBeUndefined();
    expect(err.fieldErrors).toBeUndefined();
    expect(err.status).toBeUndefined();
  });
});

describe("apiRequest", () => {
  let originalFetch: typeof globalThis.fetch;

  beforeEach(() => {
    originalFetch = globalThis.fetch;
    process.env.NEXT_PUBLIC_API_BASE_URL = "http://localhost:8787/api/v1";
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    delete process.env.NEXT_PUBLIC_API_BASE_URL;
  });

  it("uses /api/v1 fallback when env var not set", async () => {
    delete process.env.NEXT_PUBLIC_API_BASE_URL;
    const mockFetch = vi.fn().mockResolvedValueOnce(createMockResponse({ status: "success", data: {} }));
    globalThis.fetch = mockFetch;

    await apiRequest("products");
    const [url] = mockFetch.mock.calls[0];
    expect(url).toBe("/api/v1/products");
  });

  it("makes a GET request with correct URL and credentials", async () => {
    const mockFetch = vi.fn().mockResolvedValueOnce(createMockResponse({ status: "success", data: { id: "1" } }));
    globalThis.fetch = mockFetch;

    await apiRequest<{ id: string }>("products");
    expect(mockFetch).toHaveBeenCalledTimes(1);
    const [url, init] = mockFetch.mock.calls[0];
    expect(url).toBe("http://localhost:8787/api/v1/products");
    expect(init.credentials).toBe("include");
  });

  it("strips leading slash from path", async () => {
    const mockFetch = vi.fn().mockResolvedValueOnce(createMockResponse({ status: "success", data: {} }));
    globalThis.fetch = mockFetch;

    await apiRequest("/products");
    const [url] = mockFetch.mock.calls[0];
    expect(url).toBe("http://localhost:8787/api/v1/products");
  });

  it("strips trailing slash from base URL", async () => {
    process.env.NEXT_PUBLIC_API_BASE_URL = "http://localhost:8787/api/v1/";
    const mockFetch = vi.fn().mockResolvedValueOnce(createMockResponse({ status: "success", data: {} }));
    globalThis.fetch = mockFetch;

    await apiRequest("products");
    const [url] = mockFetch.mock.calls[0];
    expect(url).toBe("http://localhost:8787/api/v1/products");
  });

  it("sets Content-Type to application/json by default", async () => {
    const mockFetch = vi.fn().mockResolvedValueOnce(createMockResponse({ status: "success", data: {} }));
    globalThis.fetch = mockFetch;

    await apiRequest("products", { method: "POST", body: JSON.stringify({ name: "test" }) });
    const [, init] = mockFetch.mock.calls[0];
    const headers = new Headers(init.headers);
    expect(headers.get("Content-Type")).toBe("application/json");
  });

  it("does not set Content-Type when body is FormData", async () => {
    const mockFetch = vi.fn().mockResolvedValueOnce(createMockResponse({ status: "success", data: {} }));
    globalThis.fetch = mockFetch;

    const formData = new FormData();
    formData.append("file", "test");
    await apiRequest("upload", { method: "POST", body: formData });
    const [, init] = mockFetch.mock.calls[0];
    const headers = new Headers(init.headers);
    expect(headers.get("Content-Type")).toBeNull();
  });

  it("preserves custom Content-Type header", async () => {
    const mockFetch = vi.fn().mockResolvedValueOnce(createMockResponse({ status: "success", data: {} }));
    globalThis.fetch = mockFetch;

    await apiRequest("upload", { method: "POST", headers: { "Content-Type": "multipart/form-data" }, body: "data" });
    const [, init] = mockFetch.mock.calls[0];
    const headers = new Headers(init.headers);
    expect(headers.get("Content-Type")).toBe("multipart/form-data");
  });

  it("returns data on success with status field", async () => {
    const mockFetch = vi.fn().mockResolvedValueOnce(createMockResponse({ status: "success", data: { id: "1", name: "Lipstick" } }));
    globalThis.fetch = mockFetch;

    const result = await apiRequest<{ id: string; name: string }>("products/1");
    expect(result.status).toBe("success");
    expect(result.data).toEqual({ id: "1", name: "Lipstick" });
  });

  it("normalizes legacy success:true format", async () => {
    const mockFetch = vi.fn().mockResolvedValueOnce(
      createMockResponse({ success: true, data: { id: "1" }, message: "OK", pagination: { page: 1, total: 10 } })
    );
    globalThis.fetch = mockFetch;

    const result = await apiRequest<{ id: string }>("products");
    expect(result.status).toBe("success");
    expect(result.data).toEqual({ id: "1" });
    expect(result.message).toBe("OK");
    expect(result.meta).toEqual({ page: 1, total: 10 });
  });

  it("throws on error response with status field", async () => {
    const mockFetch = vi.fn().mockResolvedValueOnce(
      createMockResponse({ status: "error", message: "Not found", code: "NOT_FOUND" }, false, 404)
    );
    globalThis.fetch = mockFetch;

    try {
      await apiRequest("products/999");
      expect.fail("Should have thrown");
    } catch (err) {
      expect(err).toBeInstanceOf(GlamoApiError);
      expect((err as GlamoApiError).message).toBe("Not found");
      expect((err as GlamoApiError).code).toBe("NOT_FOUND");
      expect((err as GlamoApiError).status).toBe(404);
    }
  });

  it("normalizes legacy success:false format and throws", async () => {
    const mockFetch = vi.fn().mockResolvedValueOnce(
      createMockResponse({ success: false, message: "Bad request", code: "INVALID" }, false, 400)
    );
    globalThis.fetch = mockFetch;

    try {
      await apiRequest("products");
      expect.fail("Should have thrown");
    } catch (err) {
      expect(err).toBeInstanceOf(GlamoApiError);
      expect((err as GlamoApiError).message).toBe("Bad request");
      expect((err as GlamoApiError).code).toBe("INVALID");
    }
  });

  it("throws GlamoApiError on network error", async () => {
    const mockFetch = vi.fn().mockRejectedValueOnce(new Error("Failed to fetch"));
    globalThis.fetch = mockFetch;

    try {
      await apiRequest("products");
      expect.fail("Should have thrown");
    } catch (err) {
      expect(err).toBeInstanceOf(GlamoApiError);
      expect((err as GlamoApiError).code).toBe("NETWORK_ERROR");
      expect((err as GlamoApiError).message).toBe("Failed to fetch");
    }
  });

  it("handles non-Error network error", async () => {
    const mockFetch = vi.fn().mockRejectedValueOnce("string error");
    globalThis.fetch = mockFetch;

    try {
      await apiRequest("products");
      expect.fail("Should have thrown");
    } catch (err) {
      expect(err).toBeInstanceOf(GlamoApiError);
      expect((err as GlamoApiError).code).toBe("NETWORK_ERROR");
      expect((err as GlamoApiError).message).toBe("Unable to connect. Please check your connection and try again.");
    }
  });

  it("handles null JSON response as unexpected", async () => {
    const mockFetch = vi.fn().mockResolvedValueOnce({ ok: false, status: 500, json: () => Promise.resolve(null) } as Response);
    globalThis.fetch = mockFetch;

    try {
      await apiRequest("products");
      expect.fail("Should have thrown");
    } catch (err) {
      expect(err).toBeInstanceOf(GlamoApiError);
      expect((err as GlamoApiError).code).toBe("SERVER_ERROR");
    }
  });

  it("handles unexpected JSON response format", async () => {
    const mockFetch = vi.fn().mockResolvedValueOnce(
      createMockResponse({ randomField: true }, false, 500)
    );
    globalThis.fetch = mockFetch;

    try {
      await apiRequest("products");
      expect.fail("Should have thrown");
    } catch (err) {
      expect(err).toBeInstanceOf(GlamoApiError);
      expect((err as GlamoApiError).code).toBe("SERVER_ERROR");
    }
  });

  it("includes fieldErrors from API error response", async () => {
    const mockFetch = vi.fn().mockResolvedValueOnce(
      createMockResponse(
        { status: "error", message: "Validation failed", code: "VALIDATION_ERROR", fieldErrors: { email: ["Invalid email"], name: ["Name is required"] } },
        false,
        422
      )
    );
    globalThis.fetch = mockFetch;

    try {
      await apiRequest("products");
      expect.fail("Should have thrown");
    } catch (err) {
      expect(err).toBeInstanceOf(GlamoApiError);
      expect((err as GlamoApiError).fieldErrors).toEqual({ email: ["Invalid email"], name: ["Name is required"] });
    }
  });

  it("passes through init options (method, headers, body)", async () => {
    const mockFetch = vi.fn().mockResolvedValueOnce(createMockResponse({ status: "success", data: {} }));
    globalThis.fetch = mockFetch;

    await apiRequest("products", { method: "POST", body: JSON.stringify({ name: "test" }), headers: { Authorization: "Bearer token" } });
    const [, init] = mockFetch.mock.calls[0];
    expect(init.method).toBe("POST");
    expect(init.body).toBe(JSON.stringify({ name: "test" }));
    const headers = new Headers(init.headers);
    expect(headers.get("Authorization")).toBe("Bearer token");
  });
});

describe("normalizeApiPayload", () => {
  it("passes through objects with status: success", () => {
    const result = normalizeApiPayload({ status: "success", data: { id: "1" } });
    expect(result).toEqual({ status: "success", data: { id: "1" } });
  });

  it("passes through objects with status: error", () => {
    const result = normalizeApiPayload({ status: "error", message: "fail", code: "ERR" });
    expect(result).toEqual({ status: "error", message: "fail", code: "ERR" });
  });

  it("normalizes legacy success:true format", () => {
    const result = normalizeApiPayload({ success: true, data: { id: "1" }, message: "OK", pagination: { page: 1, total: 10 } });
    expect(result.status).toBe("success");
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const success = result as any;
    expect(success.data).toEqual({ id: "1" });
    expect(success.message).toBe("OK");
    expect(success.meta).toEqual({ page: 1, total: 10 });
  });

  it("normalizes legacy success:true without optional fields", () => {
    const result = normalizeApiPayload({ success: true, data: { id: "1" } });
    expect(result.status).toBe("success");
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const success = result as any;
    expect(success.data).toEqual({ id: "1" });
    expect(success.message).toBeUndefined();
    expect(success.meta).toBeUndefined();
  });

  it("normalizes legacy success:false format", () => {
    const result = normalizeApiPayload({ success: false, message: "Bad request", code: "INVALID" });
    expect(result.status).toBe("error");
    if (!isApiErrorResponse(result)) throw new Error("expected error response");
    expect(result.message).toBe("Bad request");
    expect(result.code).toBe("INVALID");
  });

  it("normalizes legacy success:false without code", () => {
    const result = normalizeApiPayload({ success: false, message: "Failed" });
    expect(result.status).toBe("error");
    if (!isApiErrorResponse(result)) throw new Error("expected error response");
    expect(result.message).toBe("Failed");
    expect(result.code).toBeUndefined();
  });

  it("normalizes legacy success:false without message", () => {
    const result = normalizeApiPayload({ success: false });
    expect(result.status).toBe("error");
    if (!isApiErrorResponse(result)) throw new Error("expected error response");
    expect(result.message).toBe("Request failed");
  });

  it("returns unexpected response for null", () => {
    const result = normalizeApiPayload(null);
    expect(result.status).toBe("error");
    if (!isApiErrorResponse(result)) throw new Error("expected error response");
    expect(result.code).toBe("UNEXPECTED_API_RESPONSE");
  });

  it("returns unexpected response for undefined", () => {
    const result = normalizeApiPayload(undefined);
    expect(result.status).toBe("error");
    if (!isApiErrorResponse(result)) throw new Error("expected error response");
    expect(result.code).toBe("UNEXPECTED_API_RESPONSE");
  });

  it("returns unexpected response for unrecognized object shape", () => {
    const result = normalizeApiPayload({ foo: "bar" });
    expect(result.status).toBe("error");
    if (!isApiErrorResponse(result)) throw new Error("expected error response");
    expect(result.code).toBe("UNEXPECTED_API_RESPONSE");
  });

  it("returns unexpected response for primitive values", () => {
    expect(normalizeApiPayload("string").status).toBe("error");
    expect(normalizeApiPayload(42).status).toBe("error");
    expect(normalizeApiPayload(true).status).toBe("error");
  });
});