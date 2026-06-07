"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { GlamoApiError } from "@/lib/api/client";
import type { ApiResponse } from "@/lib/api/contracts";

const RETRYING_MESSAGE = "Retrying...";

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

function getErrorMessage(err: unknown): string {
  if (err instanceof GlamoApiError) {
    switch (err.code) {
      case "NETWORK_ERROR":
        return "Could not reach the API backend. Please try again in a moment.";
      default:
        return err.message;
    }
  }
  if (err instanceof Error) return err.message;
  return "An unexpected error occurred";
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
  const abortRef = useRef(false);
  fetcherRef.current = fetcher;
  const hasDataRef = useRef(false);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      abortRef.current = true;
    };
  }, []);

  const fetchData = useCallback(async () => {
    if (!mountedRef.current) return;
    abortRef.current = false;
    setIsLoading(true);
    setError(null);
    setIsRetrying(false);
    setCurrentRetryCount(0);

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      if (!mountedRef.current || abortRef.current) return;

      try {
        const result = await fetcherRef.current();
        if (!mountedRef.current) return;
        setData(result.data);
        hasDataRef.current = true;
        setIsLoading(false);
        setIsRetrying(false);
        setCurrentRetryCount(0);
        return;
      } catch (err) {
        if (!mountedRef.current || abortRef.current) return;

        if (maxRetries > 0 && isRetryableError(err) && attempt < maxRetries) {
          setError(RETRYING_MESSAGE);
          setIsRetrying(true);
          setCurrentRetryCount(attempt + 1);
          if (!hasDataRef.current) setIsLoading(true);

          const delay = baseDelay * Math.pow(2, attempt) * (0.5 + Math.random() * 0.5);
          await new Promise<void>((resolve) => {
            const timer = setTimeout(resolve, delay);
            const check = () => {
              if (!mountedRef.current || abortRef.current) {
                clearTimeout(timer);
                resolve();
              }
            };
            setTimeout(check, 50);
          });

          if (!mountedRef.current || abortRef.current) return;
          continue;
        }

        setIsRetrying(false);
        setCurrentRetryCount(0);
        setError(getErrorMessage(err));
        setIsLoading(false);
        return;
      }
    }
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
    isError: error !== null && error !== RETRYING_MESSAGE,
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
  const mutationFnRef = useRef(mutationFn);
  mutationFnRef.current = mutationFn;

  const mutate = useCallback(
    async (variables: TVariables): Promise<TData | null> => {
      setIsLoading(true);
      setError(null);
      try {
        const result = await mutationFnRef.current(variables);
        setData(result.data);
        return result.data;
      } catch (err) {
        setError(getErrorMessage(err));
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    []
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