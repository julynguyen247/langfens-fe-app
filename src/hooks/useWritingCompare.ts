import { useQuery } from '@tanstack/react-query';
import type { AiCompareResponse } from '@/types/writing';

export function useWritingCompare(submissionId: string) {
  return useQuery<AiCompareResponse>({
    queryKey: ['writing', 'compare', submissionId],
    queryFn: async () => {
      const response = await fetch(`/api/attempts/${submissionId}/compare`);
      if (!response.ok) throw new Error('Failed to fetch comparison');
      return response.json();
    },
    enabled: !!submissionId,
    staleTime: 5 * 60 * 1000,
  });
}