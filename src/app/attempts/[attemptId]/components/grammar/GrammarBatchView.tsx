'use client';

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { GrammarExplainerCard } from './GrammarExplainerCard';
import type { GrammarExplainResponse } from '@/types/writing';
import type { GrammarError } from '../../types';

interface Props {
  results: GrammarExplainResponse[];
  errorTexts: string[];
  isLoading: boolean;
  isError: boolean;
  failedCount: number;
  totalCount: number;
  onRetry: () => void;
  graderComment?: string;
  graderBand?: number;
  essayErrors?: GrammarError[];
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

function EssayErrorsPanel({ errors }: { errors: GrammarError[] }) {
  if (errors.length === 0) return null;
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.2, ease: 'easeOut' }}
      className="rounded-[2rem] border-[3px] border-[var(--skill-writing-border)] shadow-[0_4px_0_rgba(0,0,0,0.08)] bg-white p-6"
    >
      <div className="flex items-center gap-2 mb-4">
        <span
          className="w-8 h-8 rounded-lg bg-[var(--skill-writing)] text-white border-[2px] border-[#B45309] flex items-center justify-center font-bold text-sm"
          style={{ fontFamily: 'var(--font-heading)' }}
        >
          !
        </span>
        <div>
          <p
            className="text-sm font-bold text-[var(--skill-writing)] leading-tight"
            style={{ fontFamily: 'var(--font-heading)' }}
          >
            Grammar issues in your essay
          </p>
          <p
            className="text-[11px] text-[var(--text-muted)] font-bold leading-tight"
            style={{ fontFamily: 'var(--font-heading)' }}
          >
            {errors.length} {errors.length === 1 ? 'issue' : 'issues'} the grader spotted in your submission
          </p>
        </div>
      </div>
      <div className="space-y-3">
        {errors.map((e, i) => (
          <div
            key={i}
            className="rounded-2xl bg-[var(--background)] border-[2px] border-[var(--border)] p-4 space-y-2"
          >
            <div className="flex items-center gap-2 flex-wrap">
              <span
                className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-[var(--skill-writing)] text-white text-[10px] font-bold uppercase tracking-wider"
                style={{ fontFamily: 'var(--font-heading)' }}
              >
                {e.category || 'grammar'}
              </span>
            </div>
            <div className="space-y-1">
              <p
                className="text-sm text-[var(--text-body)]"
                style={{ fontFamily: 'var(--font-heading)' }}
              >
                <span className="font-bold text-[var(--destructive)]">You wrote: </span>
                <span className="italic">&ldquo;{e.quote}&rdquo;</span>
              </p>
              <p
                className="text-sm text-[var(--text-body)]"
                style={{ fontFamily: 'var(--font-heading)' }}
              >
                <span className="font-bold text-[var(--skill-writing)]">Suggested: </span>
                <span className="italic">&ldquo;{e.fix}&rdquo;</span>
              </p>
            </div>
            {e.reason && (
              <p
                className="text-xs text-[var(--text-muted)] pt-2 border-t border-[var(--border)]"
                style={{ fontFamily: 'var(--font-heading)' }}
              >
                <span className="font-bold">Why: </span>
                {e.reason}
              </p>
            )}
          </div>
        ))}
      </div>
    </motion.div>
  );
}

function GraderAnalysisPanel({ comment, band }: { comment: string; band?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.1, ease: 'easeOut' }}
      className="rounded-[2rem] border-[3px] border-[var(--skill-writing-border)] shadow-[0_4px_0_rgba(0,0,0,0.08)] bg-white p-6"
    >
      <div className="flex items-center justify-between mb-3">
        <p
          className="text-xs font-bold text-[var(--skill-writing)] uppercase tracking-wider"
          style={{ fontFamily: 'var(--font-heading)' }}
        >
          Grader's analysis
        </p>
        {typeof band === 'number' && (
          <span
            className="px-3 py-1 rounded-full bg-[var(--skill-writing-light)] text-[var(--skill-writing)] text-xs font-bold"
            style={{ fontFamily: 'var(--font-heading)' }}
          >
            Band {band}
          </span>
        )}
      </div>
      <p
        className="text-base text-[var(--text-body)] leading-relaxed"
        style={{ fontFamily: 'var(--font-heading)' }}
      >
        {comment}
      </p>
    </motion.div>
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
  graderComment,
  graderBand,
  essayErrors = [],
}: Props) {
  const categoryBreakdown = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const r of results) {
      counts[r.category] = (counts[r.category] || 0) + 1;
    }
    return counts;
  }, [results]);

  // The grader also reports a "why this band" analysis and user-essay-
  // specific issues. Surface those even when /grammar/detect returns 0,
  // so the tab is never empty as long as the grading step produced a
  // result.
  const hasExtra = !!graderComment || essayErrors.length > 0;
  const isEmpty = results.length === 0 && totalCount === 0 && !hasExtra;

  return (
    <div className="space-y-6">
      <motion.div
        className="flex items-center gap-2"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
      >
        <span
          className="w-9 h-9 rounded-lg bg-[var(--skill-writing)] text-white border-[2px] border-[#B45309] flex items-center justify-center font-bold text-base"
          style={{ fontFamily: 'var(--font-heading)' }}
        >
          G
        </span>
        <div>
          <p
            className="text-lg font-bold text-[var(--foreground)] leading-tight"
            style={{ fontFamily: 'var(--font-heading)' }}
          >
            Grammar
          </p>
          <p
            className="text-[11px] text-[var(--text-muted)] font-bold leading-tight"
            style={{ fontFamily: 'var(--font-heading)' }}
          >
            {isLoading
              ? 'Detecting grammar patterns in your essay...'
              : 'Rubric used by the grader, plus the issues found in your essay.'}
          </p>
        </div>
      </motion.div>

      {isLoading && <LoadingSkeleton />}

      {isError && !isLoading && (
        <div className="rounded-[2rem] border-[3px] border-[var(--border)] shadow-[0_4px_0_rgba(0,0,0,0.08)] bg-white p-8 text-center">
          <p className="text-[var(--destructive)] font-bold mb-4">Failed to load grammar error detection.</p>
          <button
            onClick={onRetry}
            className="px-6 py-2.5 rounded-full bg-[var(--primary)] text-white font-bold text-sm border-b-[4px] border-[var(--primary-dark)] hover:-translate-y-0.5 active:translate-y-[2px] active:border-b-[2px] transition-all duration-150"
            style={{ fontFamily: 'var(--font-heading)' }}
          >
            Retry
          </button>
        </div>
      )}

      {graderComment && <GraderAnalysisPanel comment={graderComment} band={graderBand} />}
      {essayErrors.length > 0 && <EssayErrorsPanel errors={essayErrors} />}

      {!isLoading && !isError && results.length > 0 && (
        <>
          <motion.div
            className="flex items-center justify-between flex-wrap gap-3"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
          >
            <h3
              className="text-lg font-bold text-[var(--foreground)]"
              style={{ fontFamily: 'var(--font-heading)' }}
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
        </>
      )}

      {isEmpty && !isLoading && !isError && (
        <div className="rounded-[2rem] border-[3px] border-[var(--border)] shadow-[0_4px_0_rgba(0,0,0,0.08)] bg-white p-8 text-center">
          <p className="text-[var(--text-muted)] font-bold">No grammar data available.</p>
        </div>
      )}
    </div>
  );
}
