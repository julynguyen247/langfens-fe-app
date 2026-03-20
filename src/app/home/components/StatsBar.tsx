'use client';

import { motion, useReducedMotion } from 'framer-motion';

interface StatsBarProps {
  totalAttempts: number;
  avgScore: number;
  totalStudyTimeMin: number;
  streak: number;
}

function formatTime(minutes: number): string {
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
}

const STATS_CONFIG = [
  { key: 'tests', label: 'Tests', accent: 'var(--primary)' },
  { key: 'avg', label: 'Avg Score', accent: 'var(--skill-speaking)' },
  { key: 'time', label: 'Study Time', accent: 'var(--skill-listening)' },
  { key: 'streak', label: 'Streak', accent: 'var(--accent-gold)' },
];

export function StatsBar({ totalAttempts, avgScore, totalStudyTimeMin, streak }: StatsBarProps) {
  const prefersReducedMotion = useReducedMotion();
  const values = [
    String(totalAttempts),
    `${avgScore.toFixed(0)}%`,
    formatTime(totalStudyTimeMin),
    `${streak}d`,
  ];

  return (
    <div className="grid grid-cols-4 gap-3">
      {STATS_CONFIG.map((stat, i) => (
        <motion.div
          key={stat.key}
          initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3, delay: i * 0.08 }}
          className="flex flex-col items-center p-4 rounded-[1.5rem] bg-white border-[3px] border-[var(--border)] shadow-[0_3px_0_rgba(0,0,0,0.06)]"
        >
          <span
            className="text-xl sm:text-2xl font-bold"
            style={{ fontFamily: 'var(--font-mono)', color: stat.accent }}
          >
            {values[i]}
          </span>
          <span className="text-[11px] font-semibold text-[var(--text-muted)] mt-1">
            {stat.label}
          </span>
        </motion.div>
      ))}
    </div>
  );
}
