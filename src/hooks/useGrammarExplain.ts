import { useCallback, useState } from 'react';
import { apisAi } from '@/utils/api.customize';
import type { GrammarExplainResponse } from '@/types/writing';

interface GrammarError {
  error_text: string;
  context: string;
  correct_form: string;
  language?: 'en-GB' | 'en-US';
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
      const response = await apisAi.post<GrammarExplainResponse>(
        '/v1/grammar/explain',
        error
      );
      setData(response.data);
    } catch {
      setIsError(true);
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { data, isLoading, isError, explain };
}
