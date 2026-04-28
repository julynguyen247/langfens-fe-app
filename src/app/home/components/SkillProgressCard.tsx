'use client';

import { motion, useReducedMotion } from 'framer-motion';
import { ProgressRing } from '@/components/ui/ProgressRing';

interface SkillProgressCardProps {
  skill: 'Reading' | 'Listening' | 'Writing' | 'Speaking';
  currentScore: number; // 0-9 IELTS band
  targetScore?: number; // default 7.5
}

const SKILL_CONFIG = {
  Reading: {
    color: 'var(--skill-reading)',
    lightBg: 'var(--skill-reading-light)',
    border: 'var(--skill-reading-border)',
    label: 'Reading',
    href: '/practice?skill=reading',
    description: 'Passages & comprehension',
  },
  Listening: {
    color: 'var(--skill-listening)',
    lightBg: 'var(--skill-listening-light)',
    border: 'var(--skill-listening-border)',
    label: 'Listening',
    href: '/practice?skill=listening',
    description: 'Audio & understanding',
  },
  Writing: {
    color: 'var(--skill-writing)',
    lightBg: 'var(--skill-writing-light)',
    border: 'var(--skill-writing-border)',
    label: 'Writing',
    href: '/practice?skill=writing',
    description: 'Essays & reports',
  },
  Speaking: {
    color: 'var(--skill-speaking)',
    lightBg: 'var(--skill-speaking-light)',
    border: 'var(--skill-speaking-border)',
    label: 'Speaking',
    href: '/practice?skill=speaking',
    description: 'Fluency & pronunciation',
  },
};

export function SkillProgressCard({
  skill,
  currentScore,
  targetScore = 7.5,
}: SkillProgressCardProps) {
  const prefersReducedMotion = useReducedMotion();
  const config = SKILL_CONFIG[skill];
  const progress = Math.min((currentScore / targetScore) * 100, 100);
  const percentageToTarget = targetScore > 0 ? Math.min((currentScore / targetScore) * 100, 100) : 0;

  return (
    <motion.button
      initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      whileHover={{ y: -4, transition: { duration: 0.15 } }}
      whileTap={{ scale: 0.97 }}
      className="relative flex flex-col items-center gap-3 p-6 rounded-[2rem] border-[3px] text-center transition-shadow cursor-pointer"
      style={{
        background: config.lightBg,
        borderColor: config.border,
        boxShadow: `0 4px 0 ${config.border}`,
      }}
    >
      {/* Progress Ring */}
      <ProgressRing
        progress={progress}
        size={100}
        strokeWidth={7}
        color={config.color}
      >
        <div className="flex flex-col items-center">
          <span
            className="text-2xl font-bold"
            style={{ fontFamily: 'var(--font-mono)', color: config.color }}
          >
            {currentScore > 0 ? currentScore.toFixed(1) : '—'}
          </span>
        </div>
      </ProgressRing>

      {/* Skill Badge */}
      <div
        className="px-3 py-1 rounded-full text-xs font-bold"
        style={{
          backgroundColor: config.color,
          color: 'white',
        }}
      >
        {config.label}
      </div>

      {/* Target Score */}
      <div className="text-sm">
        <span className="text-[var(--text-muted)]">Target: </span>
        <span
          className="font-bold"
          style={{ fontFamily: 'var(--font-mono)', color: config.color }}
        >
          {targetScore}
        </span>
      </div>

      {/* Percentage to Goal */}
      <div className="text-xs text-[var(--text-muted)]">
        {percentageToTarget >= 100 ? (
          <span className="font-bold" style={{ color: 'var(--skill-speaking)' }}>
            Goal reached!
          </span>
        ) : (
          <span>
            <span style={{ fontFamily: 'var(--font-mono)' }}>
              {Math.round(percentageToTarget)}
            </span>
            % to goal
          </span>
        )}
      </div>
    </motion.button>
  );
}
