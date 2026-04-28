'use client';

import { useRouter } from 'next/navigation';
import { motion, useReducedMotion } from 'framer-motion';

interface ContinueLearningProps {
  weakestSkill?: string;
  lastAttemptTitle?: string;
  lastAttemptSkill?: string;
  lastAttemptHref?: string;
}

const SKILL_COLORS: Record<string, { bg: string; color: string; border: string }> = {
  Reading: { bg: 'var(--skill-reading-light)', color: 'var(--skill-reading)', border: 'var(--skill-reading-border)' },
  Listening: { bg: 'var(--skill-listening-light)', color: 'var(--skill-listening)', border: 'var(--skill-listening-border)' },
  Writing: { bg: 'var(--skill-writing-light)', color: 'var(--skill-writing)', border: 'var(--skill-writing-border)' },
  Speaking: { bg: 'var(--skill-speaking-light)', color: 'var(--skill-speaking)', border: 'var(--skill-speaking-border)' },
};

export function ContinueLearning({
  weakestSkill,
  lastAttemptTitle,
  lastAttemptSkill,
  lastAttemptHref,
}: ContinueLearningProps) {
  const router = useRouter();
  const prefersReducedMotion = useReducedMotion();

  const activeSkill = lastAttemptSkill || weakestSkill || 'Reading';
  const colors = SKILL_COLORS[activeSkill] ?? SKILL_COLORS.Reading;

  const skillToHref: Record<string, string> = {
    Reading: '/practice?skill=reading',
    Listening: '/practice?skill=listening',
    Writing: '/writing',
    Speaking: '/speaking',
  };

  const title = lastAttemptTitle
    ? `Continue: ${lastAttemptTitle}`
    : weakestSkill
      ? `Improve your ${weakestSkill}`
      : 'Start practicing';

  const subtitle = lastAttemptTitle
    ? `Pick up where you left off in ${lastAttemptSkill}`
    : weakestSkill
      ? `${weakestSkill} is your weakest skill. Let's work on it!`
      : 'Choose a skill to begin your IELTS journey.';

  const href = lastAttemptHref
    ? lastAttemptHref
    : weakestSkill
      ? skillToHref[weakestSkill] ?? '/practice'
      : '/practice';

  return (
    <motion.div
      whileHover={prefersReducedMotion ? {} : { y: -3, transition: { duration: 0.15 } }}
      className="relative rounded-[2rem] border-[3px] overflow-hidden cursor-pointer shadow-[0_4px_0_rgba(0,0,0,0.08)] transition-shadow hover:shadow-[0_6px_0_rgba(0,0,0,0.1)]"
      style={{
        background: colors.bg,
        borderColor: colors.border,
      }}
      onClick={() => router.push(href)}
    >
      {/* Accent bar at top */}
      <div className="h-1.5 w-full" style={{ background: colors.color }} />

      <div className="p-6">
        <div className="flex items-center gap-2 mb-2">
          <span
            className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white"
            style={{ background: colors.color }}
          >
            {activeSkill.charAt(0)}
          </span>
          <span className="text-xs font-bold" style={{ color: colors.color }}>
            {lastAttemptTitle ? 'Continue' : 'Recommended'}
          </span>
        </div>

        <h3 className="text-base font-bold text-[var(--foreground)] mb-1">{title}</h3>
        <p className="text-sm text-[var(--text-muted)] mb-4">{subtitle}</p>

        <button
          onClick={(e) => {
            e.stopPropagation();
            router.push(href);
          }}
          className="text-white px-6 py-2.5 rounded-full font-bold border-b-[4px] transition-all duration-150 hover:-translate-y-0.5 active:translate-y-[2px] active:border-b-[2px] active:duration-[50ms]"
          style={{
            background: colors.color,
            borderBottomColor: colors.color,
            filter: 'brightness(1)',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.filter = 'brightness(1.1)')}
          onMouseLeave={(e) => (e.currentTarget.style.filter = 'brightness(1)')}
        >
          Continue
        </button>
      </div>
    </motion.div>
  );
}
