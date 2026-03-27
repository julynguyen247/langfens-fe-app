'use client';

import { motion, useReducedMotion, useSpring, useInView } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';

interface StatsRowProps {
  totalAttempts: number;
  avgScore: number;
  totalStudyTimeMin: number;
  streak: number;
}

function formatTime(minutes: number): string {
  if (minutes < 60) return `${minutes}`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
}

const STATS_CONFIG = [
  { key: 'tests', label: 'Tests Taken', suffix: '', accent: 'var(--primary)' },
  { key: 'avg', label: 'Avg Score', suffix: '%', accent: 'var(--skill-speaking)' },
  { key: 'time', label: 'Study Time', suffix: '', accent: 'var(--skill-listening)', isTime: true },
  { key: 'streak', label: 'Day Streak', suffix: 'd', accent: 'var(--accent-gold)' },
];

// Animated counter hook
function useAnimatedValue(value: number, isTime: boolean = false, prefersReducedMotion: boolean | null) {
  const [displayValue, setDisplayValue] = useState(0);
  const spring = useSpring(0, { stiffness: 100, damping: 20 });
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-50px' });

  useEffect(() => {
    if (prefersReducedMotion) {
      setDisplayValue(value);
      return;
    }

    if (isInView) {
      spring.set(value);
      const unsubscribe = spring.on('change', (v) => {
        setDisplayValue(isTime ? Math.round(v) : Math.round(v));
      });
      return () => unsubscribe();
    }
  }, [spring, value, isInView, prefersReducedMotion, isTime]);

  return { displayValue, ref };
}

function StatCard({
  label,
  value,
  suffix,
  accent,
  isTime,
  prefersReducedMotion,
  index,
}: {
  label: string;
  value: number;
  suffix: string;
  accent: string;
  isTime: boolean;
  prefersReducedMotion: boolean | null;
  index: number;
}) {
  const { displayValue, ref } = useAnimatedValue(value, isTime, prefersReducedMotion);

  return (
    <motion.div
      ref={ref}
      initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.08, ease: 'easeOut' }}
      whileHover={{ y: -2, transition: { duration: 0.15 } }}
      className="flex flex-col items-center p-5 rounded-[2rem] bg-white/80 backdrop-blur-sm border-[3px] border-[var(--border)] shadow-[0_4px_0_rgba(0,0,0,0.08)] hover:shadow-[0_6px_0_rgba(0,0,0,0.1)] cursor-default"
    >
      <span
        className="text-2xl sm:text-3xl font-bold"
        style={{ fontFamily: 'var(--font-mono)', color: accent }}
      >
        {isTime ? formatTime(displayValue) : displayValue}
        {suffix && <span className="text-base">{suffix}</span>}
      </span>
      <span className="text-xs font-semibold text-[var(--text-muted)] mt-2 text-center">
        {label}
      </span>
    </motion.div>
  );
}

export function StatsRow({ totalAttempts, avgScore, totalStudyTimeMin, streak }: StatsRowProps) {
  const prefersReducedMotion = useReducedMotion();
  const values = [
    totalAttempts,
    Math.round(avgScore),
    totalStudyTimeMin,
    streak,
  ];

  return (
    <div className="grid grid-cols-4 gap-3">
      {STATS_CONFIG.map((stat, i) => (
        <StatCard
          key={stat.key}
          label={stat.label}
          value={values[i]}
          suffix={stat.suffix}
          accent={stat.accent}
          isTime={stat.isTime ?? false}
          prefersReducedMotion={prefersReducedMotion}
          index={i}
        />
      ))}
    </div>
  );
}
