'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GrammarExplainerCard } from '../grammar/GrammarExplainerCard';
import { useGrammarSingleExplain } from '@/hooks/useGrammarExplain';
import type { SentenceComparison } from '@/types/writing';

interface Props {
  comparisons: SentenceComparison[];
}

function ComparisonRow({ sc, index }: { sc: SentenceComparison; index: number }) {
  const [showExplain, setShowExplain] = useState(false);
  const { data, isLoading, isError, explain } = useGrammarSingleExplain();

  const handleExplain = () => {
    if (showExplain) {
      setShowExplain(false);
      return;
    }
    setShowExplain(true);
    if (!data) {
      explain({
        error_text: sc.original,
        context: sc.original,
        correct_form: sc.improved,
      });
    }
  };

  return (
    <motion.div
      className="rounded-[2rem] border-[3px] border-[var(--border)] shadow-[0_4px_0_rgba(0,0,0,0.08)] bg-white p-6 space-y-3 hover:-translate-y-[2px] hover:border-[var(--primary)] hover:shadow-[0_6px_0_rgba(0,0,0,0.08)] transition-all duration-150"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.1, ease: 'easeOut' }}
      data-testid="sentence-comparison-row"
    >
      <div className="grid grid-cols-2 gap-4">
        <div>
          <p
            className="text-xs font-bold text-[var(--destructive)] mb-1"
            style={{ fontFamily: 'var(--font-sans)' }}
          >
            Original
          </p>
          <p className="text-sm text-[var(--text-body)]">{sc.original}</p>
        </div>
        <div>
          <p
            className="text-xs font-bold text-emerald-600 mb-1"
            style={{ fontFamily: 'var(--font-sans)' }}
          >
            Improved
          </p>
          <p className="text-sm text-[var(--text-body)]">{sc.improved}</p>
        </div>
      </div>

      <p className="text-sm text-[var(--text-muted)]">{sc.explanation}</p>

      <div className="flex items-center gap-2">
        <span className="px-3 py-1 rounded-full text-xs font-bold bg-[var(--primary-light)] text-[var(--primary)]">
          {sc.category}
        </span>
        {sc.severity && (
          <span
            className={`px-3 py-1 rounded-full text-xs font-bold ${
              sc.severity === 'high'
                ? 'bg-red-100 text-red-700'
                : sc.severity === 'medium'
                ? 'bg-amber-100 text-amber-700'
                : 'bg-green-100 text-green-700'
            }`}
          >
            {sc.severity}
          </span>
        )}
        {sc.category === 'grammar' && (
          <button
            onClick={handleExplain}
            className="ml-auto px-4 py-1.5 rounded-full text-xs font-bold bg-[var(--foreground)] text-white border-b-[3px] border-black hover:-translate-y-0.5 active:translate-y-[1px] active:border-b-[1px] transition-all duration-150"
            style={{ fontFamily: 'var(--font-sans)' }}
          >
            {showExplain ? 'Hide explanation' : 'Explain this error'}
          </button>
        )}
      </div>

      <AnimatePresence>
        {showExplain && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden pt-2"
          >
            {isLoading && (
              <div className="rounded-[1.5rem] border-[2px] border-[var(--border)] p-4 animate-pulse">
                <div className="h-4 w-3/4 bg-gray-200 rounded mb-2" />
                <div className="h-4 w-1/2 bg-gray-200 rounded" />
              </div>
            )}
            {isError && (
              <p className="text-sm text-[var(--destructive)]">Failed to load explanation.</p>
            )}
            {data && (
              <GrammarExplainerCard data={data} errorText={sc.original} defaultExpanded />
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export function SentenceComparisonTable({ comparisons }: Props) {
  if (comparisons.length === 0) {
    return (
      <div className="rounded-[2rem] border-[3px] border-[var(--border)] shadow-[0_4px_0_rgba(0,0,0,0.08)] bg-white p-8 text-center">
        <p className="text-[var(--text-muted)] font-bold">No sentence comparisons available.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4" data-testid="sentence-comparison-table">
      <h3
        className="text-lg font-bold text-[var(--foreground)]"
        style={{ fontFamily: 'var(--font-sans)' }}
      >
        Sentence-by-sentence improvements
      </h3>
      {comparisons.map((sc, i) => (
        <ComparisonRow key={i} sc={sc} index={i} />
      ))}
    </div>
  );
}
