'use client';

import { motion } from 'framer-motion';

interface Props {
  currentBand: number;
  targetBand: number;
}

export function BandProgressIndicator({ currentBand, targetBand }: Props) {
  const progress = Math.min((currentBand / targetBand) * 100, 100);

  return (
    <motion.div
      className="rounded-[2rem] border-[3px] border-[var(--border)] shadow-[0_4px_0_rgba(0,0,0,0.08)] bg-white p-6"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
    >
      <div className="flex items-center justify-between mb-3">
        <p
          className="text-xs font-bold text-[var(--text-muted)]"
          style={{ fontFamily: 'var(--font-sans)' }}
        >
          Band Progress
        </p>
        <div className="flex items-center gap-3">
          <span
            className="text-2xl font-bold text-[var(--primary)]"
            style={{ fontFamily: 'var(--font-mono)' }}
          >
            {currentBand.toFixed(1)}
          </span>
          <span className="text-sm text-[var(--text-muted)]">\u2192</span>
          <span
            className="text-2xl font-bold text-emerald-600"
            style={{ fontFamily: 'var(--font-mono)' }}
          >
            {targetBand.toFixed(1)}
          </span>
        </div>
      </div>
      <div className="h-4 rounded-full bg-gray-100 border-[2px] border-[var(--border)] overflow-hidden">
        <motion.div
          className="h-full rounded-full bg-[var(--primary)]"
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 1.0, delay: 0.3, ease: 'easeOut' }}
        />
      </div>
    </motion.div>
  );
}
