'use client';

import { motion, useReducedMotion } from 'framer-motion';
import { ActivityCalendar } from '@/components/ui/ActivityCalendar';

interface StreakCalendarProps {
  days: { date: string; count: number }[];
  streak: number;
}

export function StreakCalendar({ days, streak }: StreakCalendarProps) {
  const prefersReducedMotion = useReducedMotion();
  const monthLabel = new Date().toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  });

  return (
    <motion.div
      initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, x: 16 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.4, delay: 0.2 }}
      className="rounded-[2rem] border-[3px] border-[var(--accent-gold-border)] bg-white p-6 shadow-[0_4px_0_rgba(0,0,0,0.06)]"
    >
      <div className="flex items-center justify-between mb-1">
        <h3 className="text-sm font-bold text-[var(--foreground)]">Streak</h3>
        <div
          className="flex items-center gap-1.5 bg-[var(--accent-gold-bg)] rounded-full px-3 py-1 border border-[var(--accent-gold-border)]"
        >
          <span
            className="w-3 h-3 rounded-full"
            style={{ background: 'var(--accent-gold)' }}
          />
          <span
            className="text-sm font-bold"
            style={{ fontFamily: 'var(--font-mono)', color: 'var(--accent-gold)' }}
          >
            {streak}
          </span>
        </div>
      </div>
      <p className="text-xs text-[var(--text-muted)] mb-4">{monthLabel}</p>
      <ActivityCalendar days={days} compact />
    </motion.div>
  );
}
