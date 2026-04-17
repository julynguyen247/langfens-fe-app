import { useState, useEffect, useCallback } from 'react';
import type { GrammarExplainResponse } from '@/types/writing';

interface GrammarError {
  error_text: string;
  context: string;
  correct_form: string;
}

interface BatchResult {
  results: GrammarExplainResponse[];
  failed_count: number;
  total_count: number;
}

export function useGrammarBatchExplain(errors: GrammarError[]) {
  const [data, setData] = useState<BatchResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isError, setIsError] = useState(false);

  const fetchExplanations = useCallback(async () => {
    if (errors.length === 0) return;

    setIsLoading(true);
    setIsError(false);

    try {
      const response = await fetch('/api/grammar/batch-explain', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ errors }),
      });
      if (!response.ok) throw new Error('Failed to fetch grammar explanations');
      const result: BatchResult = await response.json();
      setData(result);
    } catch {
      setIsError(true);
    } finally {
      setIsLoading(false);
    }
  }, [errors]);

  useEffect(() => {
    fetchExplanations();
  }, [fetchExplanations]);

  return { data, isLoading, isError, refetch: fetchExplanations };
}

export function useGrammarSingleExplain() {
  const [data, setData] = useState<GrammarExplainResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isError, setIsError] = useState(false);

  const explain = useCallback(async (error: GrammarError) => {
    setIsLoading(true);
    setIsError(false);
    setData(null);

    try {
      const response = await fetch('/api/grammar/explain', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(error),
      });
      if (!response.ok) throw new Error('Failed to fetch grammar explanation');
      const result: GrammarExplainResponse = await response.json();
      setData(result);
    } catch {
      setIsError(true);
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { data, isLoading, isError, explain };
}
