'use client';

import { motion } from 'framer-motion';
import { SentenceComparisonTable } from './SentenceComparisonTable';
import { ReferenceEssayCard } from './ReferenceEssayCard';
import { BandProgressIndicator } from './BandProgressIndicator';
import { VocabularySuggestions } from '../grammar/VocabularySuggestions';
import { useWritingCompare } from '@/hooks/useWritingCompare';
import type { ReferenceEssay } from '@/types/writing';

interface Props {
  submissionId: string;
}

function LoadingSkeleton() {
  return (
    <div className="space-y-6">
      <div className="rounded-[2rem] border-[3px] border-[var(--border)] bg-white p-6 animate-pulse">
        <div className="h-6 w-48 bg-gray-200 rounded mb-4" />
        <div className="h-4 rounded-full bg-gray-200" />
      </div>
      {[1, 2].map((i) => (
        <div key={i} className="rounded-[2rem] border-[3px] border-[var(--border)] bg-white p-6 animate-pulse">
          <div className="h-4 w-3/4 bg-gray-200 rounded mb-2" />
          <div className="h-4 w-1/2 bg-gray-200 rounded" />
        </div>
      ))}
    </div>
  );
}

export function WritingComparativeTab({ submissionId }: Props) {
  const { data, isLoading, isError, refetch } = useWritingCompare(submissionId);

  if (isLoading) return <LoadingSkeleton />;

  if (isError) {
    return (
      <div className="rounded-[2rem] border-[3px] border-[var(--border)] shadow-[0_4px_0_rgba(0,0,0,0.08)] bg-white p-8 text-center">
        <p className="text-[var(--destructive)] font-bold mb-4">Failed to load comparison data.</p>
        <button
          onClick={refetch}
          className="px-6 py-2.5 rounded-full bg-[var(--primary)] text-white font-bold text-sm border-b-[4px] border-[var(--primary-dark)] hover:-translate-y-0.5 active:translate-y-[2px] active:border-b-[2px] transition-all duration-150"
          style={{ fontFamily: 'var(--font-sans)' }}
        >
          Retry
        </button>
      </div>
    );
  }

  if (!data || data.no_references_found) {
    return (
      <div className="rounded-[2rem] border-[3px] border-[var(--border)] shadow-[0_4px_0_rgba(0,0,0,0.08)] bg-white p-8 text-center">
        <p className="text-[var(--text-muted)] font-bold">No comparative analysis available yet.</p>
        <p className="text-sm text-[var(--text-muted)] mt-1">Check back after your submission has been reviewed.</p>
      </div>
    );
  }

  return (
    <motion.div
      className="space-y-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      data-testid="writing-comparative-tab"
    >
      <BandProgressIndicator currentBand={data.step_up_band} targetBand={data.target_band} />

      {data.overall_analysis && (
        <motion.div
          className="rounded-[2rem] border-[3px] border-[var(--primary)] shadow-[0_4px_0_rgba(0,0,0,0.08)] bg-[var(--primary-light)] p-6"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1, ease: 'easeOut' }}
        >
          <p
            className="text-xs font-bold text-[var(--primary-dark)] mb-2"
            style={{ fontFamily: 'var(--font-sans)' }}
          >
            Overall Analysis
          </p>
          <p className="text-sm text-[var(--primary-dark)] leading-relaxed">{data.overall_analysis}</p>
        </motion.div>
      )}

      <VocabularySuggestions
        sentenceComparisons={data.sentence_comparisons}
        vocabularyFeedback={data.vocabulary_feedback}
        keyImprovements={data.key_improvements}
      />

      <SentenceComparisonTable comparisons={data.sentence_comparisons} />

      {data.references.length > 0 && (
        <div className="space-y-4">
          <h3
            className="text-lg font-bold text-[var(--foreground)]"
            style={{ fontFamily: 'var(--font-sans)' }}
          >
            Reference essays
          </h3>
          {data.references.map((ref: ReferenceEssay) => (
            <ReferenceEssayCard key={ref.id} essay={ref} />
          ))}
        </div>
      )}
    </motion.div>
  );
}
