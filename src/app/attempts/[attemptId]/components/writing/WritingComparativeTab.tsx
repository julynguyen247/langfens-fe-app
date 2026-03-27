import { SentenceComparisonTable } from './SentenceComparisonTable';
import { ReferenceEssayCard } from './ReferenceEssayCard';
import { BandProgressIndicator } from './BandProgressIndicator';
import { useWritingCompare } from '@/hooks/useWritingCompare';
import type { ReferenceEssay } from '@/types/writing';

interface Props {
  submissionId: string;
}

function LoadingSkeleton() {
  return (
    <div className="space-y-6 p-4">
      <div className="h-8 w-64 bg-gray-200 rounded animate-pulse" />
      <div className="h-24 bg-gray-200 rounded animate-pulse" />
      <div className="space-y-4">
        <div className="h-6 w-48 bg-gray-200 rounded animate-pulse" />
        {[1, 2].map(i => (
          <div key={i} className="h-32 bg-gray-200 rounded animate-pulse" />
        ))}
      </div>
    </div>
  );
}

function ErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="space-y-4 p-4 text-center">
      <p className="text-red-600">Failed to load comparison data.</p>
      <button
        onClick={onRetry}
        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
      >
        Retry
      </button>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="space-y-4 p-4 text-center">
      <p className="text-gray-500">No sentence comparisons available yet.</p>
      <p className="text-sm text-gray-400">Check back after your submission has been reviewed.</p>
    </div>
  );
}

export function WritingComparativeTab({ submissionId }: Props) {
  const { data, isLoading, isError, refetch } = useWritingCompare(submissionId);

  if (isLoading) {
    return <LoadingSkeleton />;
  }

  if (isError) {
    return <ErrorState onRetry={refetch} />;
  }

  if (!data || data.sentence_comparisons.length === 0) {
    return (
      <div className="space-y-6 p-4">
        <h2 className="text-2xl font-bold">Writing Comparative Analysis</h2>
        <EmptyState />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4">
      <h2 className="text-2xl font-bold">Writing Comparative Analysis</h2>
      <BandProgressIndicator currentBand={6.0} targetBand={7.0} />
      <SentenceComparisonTable comparisons={data.sentence_comparisons} />
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Reference Essays</h3>
        {data.references.length > 0 ? (
          data.references.map((ref: ReferenceEssay) => (
            <ReferenceEssayCard key={ref.id} essay={ref} />
          ))
        ) : (
          <p className="text-gray-500 text-sm">No reference essays available.</p>
        )}
      </div>
    </div>
  );
}