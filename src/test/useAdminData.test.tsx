// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useAdminData, useAdminMutation } from "@/lib/hooks/useAdminData";
import { GlamoApiError } from "@/lib/api/client";
import type { ApiResponse } from "@/lib/api/contracts";

function createSuccessResponse<T>(data: T): ApiResponse<T> {
  return { status: "success", data };
}

function makeApiError(code: string, message: string, status?: number): GlamoApiError {
  return new GlamoApiError({ status: "error", message, code }, status);
}

describe("useAdminData", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns data on successful fetch", async () => {
    const fetcher = vi.fn().mockResolvedValue(createSuccessResponse({ id: "1", name: "Test" }));
    const { result } = renderHook(() => useAdminData(fetcher));

    await act(async () => {
      await vi.runAllTimersAsync();
    });

    expect(result.current.data).toEqual({ id: "1", name: "Test" });
    expect(result.current.error).toBeNull();
    expect(result.current.isLoading).toBe(false);
    expect(result.current.isError).toBe(false);
  });

  it("sets isLoading to true during fetch", () => {
    const fetcher = vi.fn().mockReturnValue(new Promise(() => {}));
    const { result } = renderHook(() => useAdminData(fetcher));
    expect(result.current.isLoading).toBe(true);
  });

  it("returns error on GlamoApiError", async () => {
    const fetcher = vi.fn().mockRejectedValue(makeApiError("VALIDATION_ERROR", "Invalid input", 400));
    const { result } = renderHook(() => useAdminData(fetcher));

    await act(async () => {
      await vi.runAllTimersAsync();
    });

    expect(result.current.data).toBeNull();
    expect(result.current.error).toBe("Invalid input");
    expect(result.current.isError).toBe(true);
    expect(result.current.isLoading).toBe(false);
  });

  it("shows friendly error for API_BASE_URL_MISSING", async () => {
    const fetcher = vi.fn().mockRejectedValue(makeApiError("API_BASE_URL_MISSING", "Not configured", 500));
    const { result } = renderHook(() => useAdminData(fetcher));

    await act(async () => {
      await vi.runAllTimersAsync();
    });

    expect(result.current.error).toBe("Not configured");
  });

  it("shows friendly error for NETWORK_ERROR", async () => {
    const fetcher = vi.fn().mockRejectedValue(makeApiError("NETWORK_ERROR", "Network failed", 0));
    const { result } = renderHook(() => useAdminData(fetcher, { retryCount: 0 }));

    await act(async () => {
      await vi.runAllTimersAsync();
    });

    expect(result.current.error).toContain("Could not reach");
  });

  it("shows generic error for plain Error", async () => {
    const fetcher = vi.fn().mockRejectedValue(new Error("Something broke"));
    const { result } = renderHook(() => useAdminData(fetcher));

    await act(async () => {
      await vi.runAllTimersAsync();
    });

    expect(result.current.error).toBe("Something broke");
  });

  it("shows generic error for non-Error thrown value", async () => {
    const fetcher = vi.fn().mockRejectedValue("string error");
    const { result } = renderHook(() => useAdminData(fetcher));

    await act(async () => {
      await vi.runAllTimersAsync();
    });

    expect(result.current.error).toBe("An unexpected error occurred");
  });

  it("does not fetch when enabled is false", () => {
    const fetcher = vi.fn();
    renderHook(() => useAdminData(fetcher, { enabled: false }));
    expect(fetcher).not.toHaveBeenCalled();
  });

  it("sets isLoading to false when enabled is false", () => {
    const fetcher = vi.fn();
    const { result } = renderHook(() => useAdminData(fetcher, { enabled: false }));
    expect(result.current.isLoading).toBe(false);
  });

  it("refetches data when refetch is called", async () => {
    let callCount = 0;
    const fetcher = vi.fn().mockImplementation(() => {
      callCount++;
      return Promise.resolve(createSuccessResponse({ count: callCount }));
    });
    const { result } = renderHook(() => useAdminData(fetcher));

    await act(async () => {
      await vi.runAllTimersAsync();
    });

    expect(fetcher).toHaveBeenCalledTimes(1);
    expect(result.current.data).toEqual({ count: 1 });

    await act(async () => {
      result.current.refetch();
      await vi.runAllTimersAsync();
    });

    expect(fetcher).toHaveBeenCalledTimes(2);
    expect(result.current.data).toEqual({ count: 2 });
  });

  it("retries on NETWORK_ERROR up to max retries", async () => {
    const fetcher = vi.fn().mockRejectedValue(makeApiError("NETWORK_ERROR", "Network failed", 0));
    const { result } = renderHook(() => useAdminData(fetcher, { retryCount: 2, retryDelay: 100 }));

    await act(async () => {
      await vi.runAllTimersAsync();
    });

    expect(fetcher).toHaveBeenCalledTimes(3);
    expect(result.current.isError).toBe(true);
    expect(result.current.error).toContain("Could not reach");
  });

  it("does not retry non-network errors", async () => {
    const fetcher = vi.fn().mockRejectedValue(makeApiError("NOT_FOUND", "Not found", 404));
    const { result } = renderHook(() => useAdminData(fetcher, { retryCount: 3, retryDelay: 100 }));

    await act(async () => {
      await vi.runAllTimersAsync();
    });

    expect(fetcher).toHaveBeenCalledTimes(1);
    expect(result.current.error).toBe("Not found");
  });

  it("succeeds after retry on NETWORK_ERROR", async () => {
    let callCount = 0;
    const fetcher = vi.fn().mockImplementation(() => {
      callCount++;
      if (callCount === 1) {
        return Promise.reject(makeApiError("NETWORK_ERROR", "Network failed", 0));
      }
      return Promise.resolve(createSuccessResponse({ id: "1" }));
    });
    const { result } = renderHook(() => useAdminData(fetcher, { retryCount: 3, retryDelay: 100 }));

    await act(async () => {
      await vi.advanceTimersByTimeAsync(5000);
    });

    expect(fetcher).toHaveBeenCalledTimes(2);
    expect(result.current.data).toEqual({ id: "1" });
  });
});

describe("useAdminMutation", () => {
  it("returns data on successful mutation", async () => {
    const mutationFn = vi.fn().mockResolvedValue(createSuccessResponse({ id: "1" }));
    const { result } = renderHook(() => useAdminMutation(mutationFn));

    await act(async () => {
      const data = await result.current.mutate({ name: "test" });
      expect(data).toEqual({ id: "1" });
    });

    expect(result.current.data).toEqual({ id: "1" });
    expect(result.current.error).toBeNull();
    expect(result.current.isSuccess).toBe(true);
    expect(result.current.isError).toBe(false);
    expect(result.current.isLoading).toBe(false);
  });

  it("returns null and sets error on GlamoApiError", async () => {
    const mutationFn = vi.fn().mockRejectedValue(makeApiError("VALIDATION_ERROR", "Invalid input", 400));
    const { result } = renderHook(() => useAdminMutation(mutationFn));

    await act(async () => {
      const data = await result.current.mutate({ name: "bad" });
      expect(data).toBeNull();
    });

    expect(result.current.data).toBeNull();
    expect(result.current.error).toBe("Invalid input");
    expect(result.current.isSuccess).toBe(false);
    expect(result.current.isError).toBe(true);
    expect(result.current.isLoading).toBe(false);
  });

  it("sets error for plain Error", async () => {
    const mutationFn = vi.fn().mockRejectedValue(new Error("Something broke"));
    const { result } = renderHook(() => useAdminMutation(mutationFn));

    await act(async () => {
      await result.current.mutate({});
    });

    expect(result.current.error).toBe("Something broke");
  });

  it("sets generic error for non-Error thrown value", async () => {
    const mutationFn = vi.fn().mockRejectedValue("string error");
    const { result } = renderHook(() => useAdminMutation(mutationFn));

    await act(async () => {
      await result.current.mutate({});
    });

    expect(result.current.error).toBe("An unexpected error occurred");
  });

  it("sets isLoading during mutation", async () => {
    let resolveMutation: (value: unknown) => void;
    const mutationFn = vi.fn().mockReturnValue(new Promise((resolve) => { resolveMutation = resolve; }));
    const { result } = renderHook(() => useAdminMutation(mutationFn));

    act(() => {
      result.current.mutate({});
    });

    expect(result.current.isLoading).toBe(true);

    await act(async () => {
      resolveMutation!(createSuccessResponse({ id: "1" }));
    });

    expect(result.current.isLoading).toBe(false);
  });

  it("reset clears data, error, and isLoading", async () => {
    const mutationFn = vi.fn().mockResolvedValue(createSuccessResponse({ id: "1" }));
    const { result } = renderHook(() => useAdminMutation(mutationFn));

    await act(async () => {
      await result.current.mutate({});
    });

    expect(result.current.data).toEqual({ id: "1" });

    act(() => {
      result.current.reset();
    });

    expect(result.current.data).toBeNull();
    expect(result.current.error).toBeNull();
    expect(result.current.isLoading).toBe(false);
    expect(result.current.isSuccess).toBe(false);
    expect(result.current.isError).toBe(false);
  });

  it("isSuccess is true only when data is set and error is null", async () => {
    const mutationFn = vi.fn().mockResolvedValue(createSuccessResponse({ id: "1" }));
    const { result } = renderHook(() => useAdminMutation(mutationFn));

    expect(result.current.isSuccess).toBe(false);

    await act(async () => {
      await result.current.mutate({});
    });

    expect(result.current.isSuccess).toBe(true);
  });

  it("isError is true only when error is set", async () => {
    const mutationFn = vi.fn().mockRejectedValue(makeApiError("ERROR", "fail", 500));
    const { result } = renderHook(() => useAdminMutation(mutationFn));

    expect(result.current.isError).toBe(false);

    await act(async () => {
      await result.current.mutate({});
    });

    expect(result.current.isError).toBe(true);
  });
});