import { useState, useEffect, useCallback } from 'react';
import type { AiCompareResponse } from '@/types/writing';

export function useWritingCompare(attemptId: string) {
  const [data, setData] = useState<AiCompareResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isError, setIsError] = useState(false);

  const fetchComparison = useCallback(async () => {
    if (!attemptId) return;

    setIsLoading(true);
    setIsError(false);

    try {
      const response = await fetch(`/api/attempts/${attemptId}/compare`, {
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to fetch comparison');
      const result: AiCompareResponse = await response.json();
      setData(result);
    } catch {
      setIsError(true);
    } finally {
      setIsLoading(false);
    }
  }, [attemptId]);

  useEffect(() => {
    const controller = new AbortController();
    fetchComparison();
    return () => controller.abort();
  }, [fetchComparison]);

  return { data, isLoading, isError, refetch: fetchComparison };
}