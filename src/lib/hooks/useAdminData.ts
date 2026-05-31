"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { GlamoApiError } from "@/lib/api/client";

interface UseAdminDataOptions {
  refreshInterval?: number;
  enabled?: boolean;
}

interface UseAdminDataResult<T> {
  data: T | null;
  error: string | null;
  isLoading: boolean;
  isError: boolean;
  refetch: () => void;
}

export function useAdminData<T>(
  fetcher: () => Promise<T>,
  options: UseAdminDataOptions = {}
): UseAdminDataResult<T> {
  const { refreshInterval, enabled = true } = options;
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await fetcherRef.current();
      setData(result);
    } catch (err) {
      if (err instanceof GlamoApiError) {
        setError(err.message);
      } else if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("An unexpected error occurred");
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!enabled) {
      setIsLoading(false);
      return;
    }
    fetchData();
  }, [enabled, fetchData]);

  useEffect(() => {
    if (!refreshInterval || !enabled) return;
    const interval = setInterval(fetchData, refreshInterval);
    return () => clearInterval(interval);
  }, [refreshInterval, enabled, fetchData]);

  return {
    data,
    error,
    isLoading,
    isError: error !== null,
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
  mutationFn: (variables: TVariables) => Promise<TData>
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
        setData(result);
        return result;
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