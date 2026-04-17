'use client';

import { motion } from 'framer-motion';
import type { SentenceComparison } from '@/types/writing';

interface Props {
  sentenceComparisons: SentenceComparison[];
  vocabularyFeedback: string;
  keyImprovements: string[];
}

const MAX_SUGGESTIONS = 5;

export function VocabularySuggestions({
  sentenceComparisons,
  vocabularyFeedback,
  keyImprovements,
}: Props) {
  const vocabItems = sentenceComparisons
    .filter((sc) => sc.category === 'vocabulary')
    .slice(0, MAX_SUGGESTIONS);

  if (vocabItems.length === 0 && !vocabularyFeedback && keyImprovements.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      <h3
        className="text-lg font-bold text-[var(--foreground)]"
        style={{ fontFamily: 'var(--font-sans)' }}
      >
        Vocabulary suggestions
      </h3>

      {vocabularyFeedback && (
        <motion.div
          className="rounded-[2rem] border-[3px] border-blue-200 bg-blue-50 p-5"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
        >
          <p className="text-sm text-blue-900 leading-relaxed">{vocabularyFeedback}</p>
        </motion.div>
      )}

      {vocabItems.length > 0 && (
        <div className="space-y-3">
          {vocabItems.map((item, i) => (
            <motion.div
              key={i}
              className="rounded-[2rem] border-[3px] border-[var(--border)] shadow-[0_4px_0_rgba(0,0,0,0.08)] bg-white p-5 hover:-translate-y-[2px] hover:border-[var(--primary)] hover:shadow-[0_6px_0_rgba(0,0,0,0.08)] transition-all duration-150"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: i * 0.1, ease: 'easeOut' }}
            >
              <div className="grid grid-cols-2 gap-3 mb-2">
                <div>
                  <p className="text-xs font-bold text-[var(--text-muted)] mb-1">Current</p>
                  <p className="text-sm line-through text-[var(--destructive)] opacity-70">{item.original}</p>
                </div>
                <div>
                  <p className="text-xs font-bold text-[var(--text-muted)] mb-1">Suggested</p>
                  <p className="text-sm font-semibold text-emerald-600">{item.improved}</p>
                </div>
              </div>
              {item.explanation && (
                <p className="text-sm text-[var(--text-muted)]">{item.explanation}</p>
              )}
            </motion.div>
          ))}
        </div>
      )}

      {keyImprovements.length > 0 && (
        <motion.div
          className="rounded-[2rem] border-[3px] border-[var(--border)] shadow-[0_4px_0_rgba(0,0,0,0.08)] bg-white p-5"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2, ease: 'easeOut' }}
        >
          <p
            className="text-xs font-bold text-[var(--text-muted)] mb-3"
            style={{ fontFamily: 'var(--font-sans)' }}
          >
            Key improvements
          </p>
          <ul className="space-y-2">
            {keyImprovements.map((item, i) => (
              <li key={i} className="text-sm text-[var(--text-body)] flex gap-2">
                <span
                  className="text-[var(--primary)] font-bold min-w-[1.5rem]"
                  style={{ fontFamily: 'var(--font-mono)' }}
                >
                  {i + 1}.
                </span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </motion.div>
      )}
    </div>
  );
}
