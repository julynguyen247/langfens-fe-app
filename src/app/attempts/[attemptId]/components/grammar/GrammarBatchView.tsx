'use client';

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { GrammarExplainerCard } from './GrammarExplainerCard';
import type { GrammarExplainResponse } from '@/types/writing';

interface Props {
  results: GrammarExplainResponse[];
  errorTexts: string[];
  isLoading: boolean;
  isError: boolean;
  failedCount: number;
  totalCount: number;
  onRetry: () => void;
}

function LoadingSkeleton() {
  return (
    <div className="space-y-4">
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className="rounded-[2rem] border-[3px] border-[var(--border)] bg-white p-6 animate-pulse"
        >
          <div className="flex items-center gap-2 mb-3">
            <div className="h-6 w-20 bg-gray-200 rounded-full" />
          </div>
          <div className="h-4 w-3/4 bg-gray-200 rounded mb-2" />
          <div className="h-4 w-1/2 bg-gray-200 rounded" />
        </div>
      ))}
    </div>
  );
}

export function GrammarBatchView({
  results,
  errorTexts,
  isLoading,
  isError,
  failedCount,
  totalCount,
  onRetry,
}: Props) {
  const categoryBreakdown = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const r of results) {
      counts[r.category] = (counts[r.category] || 0) + 1;
    }
    return counts;
  }, [results]);

  if (isLoading) return <LoadingSkeleton />;

  if (isError) {
    return (
      <div className="rounded-[2rem] border-[3px] border-[var(--border)] shadow-[0_4px_0_rgba(0,0,0,0.08)] bg-white p-8 text-center">
        <p className="text-[var(--destructive)] font-bold mb-4">Failed to load grammar analysis.</p>
        <button
          onClick={onRetry}
          className="px-6 py-2.5 rounded-full bg-[var(--primary)] text-white font-bold text-sm border-b-[4px] border-[var(--primary-dark)] hover:-translate-y-0.5 active:translate-y-[2px] active:border-b-[2px] transition-all duration-150"
          style={{ fontFamily: 'var(--font-sans)' }}
        >
          Retry
        </button>
      </div>
    );
  }

  if (results.length === 0 && totalCount === 0) {
    return (
      <div className="rounded-[2rem] border-[3px] border-[var(--border)] shadow-[0_4px_0_rgba(0,0,0,0.08)] bg-white p-8 text-center">
        <p className="text-[var(--text-muted)] font-bold">No grammar issues to analyze.</p>
        <p className="text-sm text-[var(--text-muted)] mt-1">Submit an essay to get grammar feedback.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <motion.div
        className="flex items-center justify-between flex-wrap gap-3"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
      >
        <h3
          className="text-lg font-bold text-[var(--foreground)]"
          style={{ fontFamily: 'var(--font-sans)' }}
        >
          {results.length} grammar {results.length === 1 ? 'issue' : 'issues'} found
        </h3>
        <div className="flex gap-2 flex-wrap">
          {Object.entries(categoryBreakdown).map(([cat, count]) => (
            <span
              key={cat}
              className="px-3 py-1 rounded-full text-xs font-bold bg-[var(--primary-light)] text-[var(--primary)]"
            >
              {cat}: {count}
            </span>
          ))}
        </div>
      </motion.div>

      {failedCount > 0 && (
        <p className="text-xs text-[var(--text-muted)]">
          {failedCount} of {totalCount} errors could not be analyzed.
        </p>
      )}

      <div className="space-y-4">
        {results.map((result, i) => (
          <GrammarExplainerCard
            key={i}
            data={result}
            errorText={errorTexts[i] || ''}
            defaultExpanded={i < 2}
          />
        ))}
      </div>
    </div>
  );
}
