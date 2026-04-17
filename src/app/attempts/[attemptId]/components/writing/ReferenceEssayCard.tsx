'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { ReferenceEssay } from '@/types/writing';

interface Props {
  essay: ReferenceEssay;
}

export function ReferenceEssayCard({ essay }: Props) {
  const [expanded, setExpanded] = useState(false);
  const previewLength = 200;
  const needsTruncation = essay.text.length > previewLength;

  return (
    <motion.div
      className="rounded-[2rem] border-[3px] border-[var(--border)] shadow-[0_4px_0_rgba(0,0,0,0.08)] bg-white p-6 hover:-translate-y-[2px] hover:border-[var(--primary)] hover:shadow-[0_6px_0_rgba(0,0,0,0.08)] transition-all duration-150"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
    >
      <div className="flex items-center justify-between mb-3">
        <p
          className="text-xs font-bold text-[var(--text-muted)]"
          style={{ fontFamily: 'var(--font-sans)' }}
        >
          Reference Essay
        </p>
        <div className="flex items-center gap-2">
          <span
            className="px-3 py-1 rounded-full text-xs font-bold bg-[var(--primary-light)] text-[var(--primary)]"
            style={{ fontFamily: 'var(--font-mono)' }}
          >
            Band {essay.band.toFixed(1)}
          </span>
          <span
            className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700"
            style={{ fontFamily: 'var(--font-mono)' }}
          >
            {(essay.similarity_score * 100).toFixed(0)}% match
          </span>
        </div>
      </div>

      <p className="text-sm text-[var(--text-body)] leading-relaxed whitespace-pre-wrap">
        {expanded || !needsTruncation
          ? essay.text
          : essay.text.slice(0, previewLength) + '...'}
      </p>

      {needsTruncation && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="mt-3 text-xs font-bold text-[var(--primary)] hover:underline"
          style={{ fontFamily: 'var(--font-sans)' }}
        >
          {expanded ? 'Show less' : 'Read full essay'}
        </button>
      )}
    </motion.div>
  );
}
