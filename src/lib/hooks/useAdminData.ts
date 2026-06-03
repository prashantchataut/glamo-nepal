"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { GlamoApiError } from "@/lib/api/client";
import type { ApiResponse } from "@/lib/api/contracts";

interface UseAdminDataOptions {
  refreshInterval?: number;
  enabled?: boolean;
  deps?: unknown[];
  retryCount?: number;
  retryDelay?: number;
}

interface UseAdminDataResult<T> {
  data: T | null;
  error: string | null;
  isLoading: boolean;
  isError: boolean;
  isRetrying: boolean;
  retryCount: number;
  refetch: () => void;
}

function isRetryableError(err: unknown): boolean {
  return err instanceof GlamoApiError && err.code === "NETWORK_ERROR";
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function useAdminData<T>(
  fetcher: () => Promise<ApiResponse<T>>,
  options: UseAdminDataOptions = {}
): UseAdminDataResult<T> {
  const { refreshInterval, enabled = true, deps = [], retryCount: maxRetries = 3, retryDelay: baseDelay = 1000 } = options;
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRetrying, setIsRetrying] = useState(false);
  const [currentRetryCount, setCurrentRetryCount] = useState(0);
  const mountedRef = useRef(true);
  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;
  const hasDataRef = useRef(false);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const fetchData = useCallback(async () => {
    if (!mountedRef.current) return;
    setIsLoading(true);
    setError(null);
    setIsRetrying(false);
    setCurrentRetryCount(0);

    const attemptFetch = async (attempt: number): Promise<void> => {
      try {
        const result = await fetcherRef.current();
        if (!mountedRef.current) return;
        setData(result.data);
        hasDataRef.current = true;
        setIsLoading(false);
        setIsRetrying(false);
        setCurrentRetryCount(0);
      } catch (err) {
        if (maxRetries > 0 && isRetryableError(err) && attempt < maxRetries) {
          if (mountedRef.current) {
            setError("Retrying...");
            setIsRetrying(true);
            setCurrentRetryCount(attempt + 1);
            if (!hasDataRef.current) {
              setIsLoading(true);
            }
          }
          const delay = baseDelay * Math.pow(2, attempt) * (0.5 + Math.random() * 0.5);
          await sleep(delay);
          return attemptFetch(attempt + 1);
        }

        if (!mountedRef.current) return;
        setIsRetrying(false);
        setCurrentRetryCount(0);
        if (err instanceof GlamoApiError) {
          if (err.code === "API_BASE_URL_MISSING") {
            setError("The API backend is not configured. Start the backend with `wrangler dev` or set NEXT_PUBLIC_API_BASE_URL in .env.local.");
          } else if (err.code === "NETWORK_ERROR") {
            setError("Could not reach the API backend. Make sure the backend is running (wrangler dev) and NEXT_PUBLIC_API_BASE_URL is correct.");
          } else {
            setError(err.message);
          }
        } else if (err instanceof Error) {
          setError(err.message);
        } else {
          setError("An unexpected error occurred");
        }
        setIsLoading(false);
      }
    };

    await attemptFetch(0);
  }, [maxRetries, baseDelay]);

  useEffect(() => {
    if (!enabled) {
      setIsLoading(false);
      return;
    }
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, fetchData, ...deps]);

  useEffect(() => {
    if (!refreshInterval || !enabled) return;
    const interval = setInterval(() => fetchData(), refreshInterval);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshInterval, enabled, fetchData, ...deps]);

  return {
    data,
    error,
    isLoading,
    isError: error !== null && error !== "Retrying...",
    isRetrying,
    retryCount: currentRetryCount,
    refetch: fetchData,
  };
}

interface UseAdminMutationResult<TData, TVariables> {
  mutate: (variables: TVariables) => Promise<TData | null>;
  data: TData | null;
  error: string | null;
  isLoading: boolean;
  isError: boolean;
  isSuccess: boolean;
  reset: () => void;
}

export function useAdminMutation<TData, TVariables>(
  mutationFn: (variables: TVariables) => Promise<ApiResponse<TData>>
): UseAdminMutationResult<TData, TVariables> {
  const [data, setData] = useState<TData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const mutate = useCallback(
    async (variables: TVariables): Promise<TData | null> => {
      setIsLoading(true);
      setError(null);
      try {
        const result = await mutationFn(variables);
        setData(result.data);
        return result.data;
      } catch (err) {
        if (err instanceof GlamoApiError) {
          setError(err.message);
        } else if (err instanceof Error) {
          setError(err.message);
        } else {
          setError("An unexpected error occurred");
        }
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [mutationFn]
  );

  const reset = useCallback(() => {
    setData(null);
    setError(null);
    setIsLoading(false);
  }, []);

  return {
    mutate,
    data,
    error,
    isLoading,
    isError: error !== null,
    isSuccess: data !== null && error === null,
    reset,
  };
}