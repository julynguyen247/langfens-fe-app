import { useCallback, useEffect, useRef, useState } from 'react';
import { apisAi } from '@/utils/api.customize';
import type { GrammarExplainResponse } from '@/types/writing';

interface DetectedError {
  error_text: string;
  context: string;
  correct_form: string;
}

interface DetectResponse {
  errors: DetectedError[];
}

interface BatchExplainResponse {
  results: GrammarExplainResponse[];
  failed_count: number;
  total_count: number;
}

export type GrammarLoadingPhase = 'idle' | 'detecting' | 'explaining';

export interface UseGrammarAnalysisResult {
  results: GrammarExplainResponse[];
  errorTexts: string[];
  isLoading: boolean;
  loadingPhase: GrammarLoadingPhase;
  isError: boolean;
  failedCount: number;
  totalCount: number;
  refetch: () => void;
}

export function useGrammarAnalysis(
  essay: string,
  enabled: boolean,
  taskContext?: string
): UseGrammarAnalysisResult {
  const [results, setResults] = useState<GrammarExplainResponse[]>([]);
  const [errorTexts, setErrorTexts] = useState<string[]>([]);
  const [failedCount, setFailedCount] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [loadingPhase, setLoadingPhase] = useState<GrammarLoadingPhase>('idle');
  const [isError, setIsError] = useState(false);
  const hasLoadedRef = useRef(false);

  const run = useCallback(async () => {
    if (!essay || essay.trim().length === 0) {
      setLoadingPhase('idle');
      return;
    }
    setIsError(false);
    setLoadingPhase('detecting');

    try {
      const detectRes = await apisAi.post<DetectResponse>('/v1/grammar/detect', {
        essay,
        task: taskContext ?? undefined,
        max_errors: 20,
      });
      const detectedErrors = detectRes.data.errors || [];

      if (detectedErrors.length === 0) {
        setResults([]);
        setErrorTexts([]);
        setFailedCount(0);
        setTotalCount(0);
        setLoadingPhase('idle');
        hasLoadedRef.current = true;
        return;
      }

      setLoadingPhase('explaining');
      const explainRes = await apisAi.post<BatchExplainResponse>(
        '/v1/grammar/batch-explain',
        // The active provider (Groq, multi-key round-robin) handles parallel LLM
        // calls well, so explain errors concurrently. Sequential (max_concurrent=1)
        // made a 12-error essay take ~72s; concurrency 8 brings it under the 60s
        // poll window. The server caps this at 10.
        { errors: detectedErrors, max_concurrent: 8 }
      );

      setResults(explainRes.data.results);
      setErrorTexts(detectedErrors.map((e) => e.error_text));
      setFailedCount(explainRes.data.failed_count);
      setTotalCount(explainRes.data.total_count);
      setLoadingPhase('idle');
      hasLoadedRef.current = true;
    } catch {
      setIsError(true);
      setLoadingPhase('idle');
    }
  }, [essay, taskContext]);

  useEffect(() => {
    if (!enabled) return;
    if (hasLoadedRef.current) return;
    void run();
  }, [enabled, run]);

  const refetch = useCallback(() => {
    hasLoadedRef.current = false;
    setResults([]);
    setErrorTexts([]);
    setFailedCount(0);
    setTotalCount(0);
    void run();
  }, [run]);

  return {
    results,
    errorTexts,
    isLoading: loadingPhase !== 'idle',
    loadingPhase,
    isError,
    failedCount,
    totalCount,
    refetch,
  };
}
