'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { GrammarExplainResponse } from '@/types/writing';

const CATEGORY_COLORS: Record<string, { bg: string; text: string }> = {
  tense: { bg: 'bg-blue-100', text: 'text-blue-700' },
  'subject-verb': { bg: 'bg-purple-100', text: 'text-purple-700' },
  'word-order': { bg: 'bg-amber-100', text: 'text-amber-700' },
  article: { bg: 'bg-teal-100', text: 'text-teal-700' },
  preposition: { bg: 'bg-rose-100', text: 'text-rose-700' },
  pronoun: { bg: 'bg-indigo-100', text: 'text-indigo-700' },
  collocation: { bg: 'bg-emerald-100', text: 'text-emerald-700' },
  other: { bg: 'bg-gray-100', text: 'text-gray-700' },
};

interface Props {
  data: GrammarExplainResponse;
  errorText: string;
  defaultExpanded?: boolean;
}

export function GrammarExplainerCard({ data, errorText, defaultExpanded = false }: Props) {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const colors = CATEGORY_COLORS[data.category] || CATEGORY_COLORS.other;

  return (
    <motion.div
      className="rounded-[2rem] border-[3px] border-[var(--border)] shadow-[0_4px_0_rgba(0,0,0,0.08)] bg-white overflow-hidden hover:-translate-y-[2px] hover:border-[var(--primary)] hover:shadow-[0_6px_0_rgba(0,0,0,0.08)] transition-all duration-150"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      data-testid="grammar-explainer-card"
    >
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full p-6 text-left flex items-start justify-between gap-4"
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <span className={`px-3 py-1 rounded-full text-xs font-bold ${colors.bg} ${colors.text}`}>
              {data.category}
            </span>
          </div>
          <p className="text-sm text-[var(--text-body)]">
            <span className="line-through text-[var(--destructive)] opacity-70">{errorText}</span>
            <span className="mx-2 text-[var(--text-muted)]">→</span>
            <span className="font-semibold text-emerald-600">{data.correct_form}</span>
          </p>
        </div>
        <span
          className="text-[var(--text-muted)] text-lg transition-transform duration-200"
          style={{ transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)' }}
        >
          ▾
        </span>
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <div className="px-6 pb-6 space-y-4">
              <div className="rounded-[1.5rem] border-[2px] border-blue-200 bg-blue-50 p-4">
                <p
                  className="text-xs font-bold text-blue-800 mb-1"
                  style={{ fontFamily: 'var(--font-sans)' }}
                >
                  Grammar Rule
                </p>
                <p className="text-sm text-blue-900 leading-relaxed">{data.rule_description}</p>
              </div>

              <div>
                <p
                  className="text-xs font-bold text-[var(--text-muted)] mb-1"
                  style={{ fontFamily: 'var(--font-sans)' }}
                >
                  Explanation
                </p>
                <p className="text-sm text-[var(--text-body)] leading-relaxed">{data.explanation}</p>
              </div>

              {data.examples.length > 0 && (
                <div>
                  <p
                    className="text-xs font-bold text-[var(--text-muted)] mb-2"
                    style={{ fontFamily: 'var(--font-sans)' }}
                  >
                    Examples
                  </p>
                  <ol className="space-y-1.5">
                    {data.examples.map((ex, i) => (
                      <li key={i} className="text-sm text-[var(--text-body)] flex gap-2">
                        <span
                          className="text-[var(--text-muted)] font-bold min-w-[1.5rem]"
                          style={{ fontFamily: 'var(--font-mono)' }}
                        >
                          {i + 1}.
                        </span>
                        <span>{ex}</span>
                      </li>
                    ))}
                  </ol>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
