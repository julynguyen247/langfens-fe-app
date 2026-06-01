'use client';

import { motion, useReducedMotion } from 'framer-motion';

const SKILL_COLORS: Record<string, string> = {
  READING: 'var(--skill-reading)',
  LISTENING: 'var(--skill-listening)',
  WRITING: 'var(--skill-writing)',
  SPEAKING: 'var(--skill-speaking)',
};

interface SkillProgressBarProps {
  skill: string;
  score: number; // 0-9 for IELTS band
  maxScore?: number; // default 9
  animate?: boolean;
  delay?: number; // seconds
  // Optional override for color lookup so the displayed label can differ from
  // the palette key (e.g. writing criteria reusing the four skill colors).
  colorKey?: string;
}

export function SkillProgressBar({
  skill,
  score,
  maxScore = 9,
  animate: shouldAnimate = true,
  delay = 0,
  colorKey,
}: SkillProgressBarProps) {
  const prefersReducedMotion = useReducedMotion();
  const color = SKILL_COLORS[(colorKey ?? skill).toUpperCase()] ?? 'var(--primary)';
  const shouldSkipAnimation = prefersReducedMotion || !shouldAnimate;
  const percentage = Math.min((score / maxScore) * 100, 100);

  return (
    <div className="flex items-center gap-3">
      <span
        className="w-20 text-sm font-semibold shrink-0"
        style={{ color }}
      >
        {skill.charAt(0) + skill.slice(1).toLowerCase()}
      </span>
      <div className="flex-1 h-3 rounded-full bg-[var(--border)] overflow-hidden">
        <motion.div
          className="h-full rounded-full"
          style={{ backgroundColor: color }}
          initial={shouldSkipAnimation ? { width: `${percentage}%` } : { width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={shouldSkipAnimation ? { duration: 0 } : { duration: 0.8, ease: 'easeOut', delay }}
        />
      </div>
      <span
        className="w-10 text-sm font-bold text-right shrink-0"
        style={{ fontFamily: 'var(--font-mono)' }}
      >
        {score.toFixed(1)}
      </span>
    </div>
  );
}
