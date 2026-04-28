import { useCallback, useEffect, useRef, useState } from 'react';
import type { AiCompareResponse } from '@/types/writing';

const POLL_INTERVAL_MS = 2000;
const MAX_RETRIES = 30; // 30 × 2s = 60s wall-clock

interface UseWritingCompareResult {
  data: AiCompareResponse | null;
  isLoading: boolean;
  isPolling: boolean;
  isError: boolean;
  isTimeout: boolean;
  refetch: () => void;
}

function readAuthToken(): string | null {
  if (typeof window === 'undefined') return null;
  return window.localStorage.getItem('accessToken');
}

export function useWritingCompare(attemptId: string): UseWritingCompareResult {
  const [data, setData] = useState<AiCompareResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isPolling, setIsPolling] = useState(false);
  const [isError, setIsError] = useState(false);
  const [isTimeout, setIsTimeout] = useState(false);
  const retriesRef = useRef(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stopPolling = useCallback(() => {
    if (intervalRef.current !== null) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setIsPolling(false);
  }, []);

  const fetchOnce = useCallback(async (): Promise<'ready' | 'pending' | 'error'> => {
    if (!attemptId) return 'error';
    const token = readAuthToken();
    const headers: Record<string, string> = {};
    if (token) headers.Authorization = `Bearer ${token}`;
    try {
      const response = await fetch(`/api/attempts/${attemptId}/compare`, {
        credentials: 'include',
        headers,
      });
      if (response.status === 204) return 'pending';
      if (!response.ok) return 'error';
      const result: AiCompareResponse = await response.json();
      setData(result);
      return 'ready';
    } catch {
      return 'error';
    }
  }, [attemptId]);

  const start = useCallback(async () => {
    if (!attemptId) return;
    setIsLoading(true);
    setIsError(false);
    setIsTimeout(false);
    retriesRef.current = 0;

    const initial = await fetchOnce();
    setIsLoading(false);
    if (initial === 'ready') return;
    if (initial === 'error') {
      setIsError(true);
      return;
    }

    // initial === 'pending' → begin polling
    setIsPolling(true);
    intervalRef.current = setInterval(async () => {
      retriesRef.current += 1;
      if (retriesRef.current > MAX_RETRIES) {
        stopPolling();
        setIsTimeout(true);
        return;
      }
      const status = await fetchOnce();
      if (status === 'ready') stopPolling();
      else if (status === 'error') {
        stopPolling();
        setIsError(true);
      }
    }, POLL_INTERVAL_MS);
  }, [attemptId, fetchOnce, stopPolling]);

  useEffect(() => {
    if (data) return; // already loaded — skip refetch on remount
    start();
    return stopPolling;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [attemptId]);

  const refetch = useCallback(() => {
    stopPolling();
    setData(null);
    start();
  }, [start, stopPolling]);

  return { data, isLoading, isPolling, isError, isTimeout, refetch };
}
