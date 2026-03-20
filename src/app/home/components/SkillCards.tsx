'use client';

import { motion, useReducedMotion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { ProgressRing } from '@/components/ui/ProgressRing';

interface SkillCardsProps {
  scores: Record<string, number>;
}

const SKILLS = [
  {
    key: 'Reading',
    color: 'var(--skill-reading)',
    lightBg: 'var(--skill-reading-light)',
    border: 'var(--skill-reading-border)',
    label: 'R',
    href: '/practice?skill=reading',
    description: 'Passages & comprehension',
  },
  {
    key: 'Listening',
    color: 'var(--skill-listening)',
    lightBg: 'var(--skill-listening-light)',
    border: 'var(--skill-listening-border)',
    label: 'L',
    href: '/practice?skill=listening',
    description: 'Audio & understanding',
  },
  {
    key: 'Writing',
    color: 'var(--skill-writing)',
    lightBg: 'var(--skill-writing-light)',
    border: 'var(--skill-writing-border)',
    label: 'W',
    href: '/practice?skill=writing',
    description: 'Essays & reports',
  },
  {
    key: 'Speaking',
    color: 'var(--skill-speaking)',
    lightBg: 'var(--skill-speaking-light)',
    border: 'var(--skill-speaking-border)',
    label: 'S',
    href: '/practice?skill=speaking',
    description: 'Fluency & pronunciation',
  },
];

export function SkillCards({ scores }: SkillCardsProps) {
  const router = useRouter();
  const prefersReducedMotion = useReducedMotion();

  return (
    <div className="grid grid-cols-2 gap-4">
      {SKILLS.map((skill, i) => {
        const score = scores[skill.key] ?? 0;
        const progress = Math.min((score / 9) * 100, 100);

        return (
          <motion.button
            key={skill.key}
            onClick={() => router.push(skill.href)}
            initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: i * 0.1, ease: 'easeOut' }}
            whileHover={{ y: -4, transition: { duration: 0.15 } }}
            whileTap={{ scale: 0.97 }}
            className="relative flex flex-col items-center gap-3 p-5 rounded-[2rem] border-[3px] text-center transition-shadow cursor-pointer"
            style={{
              background: skill.lightBg,
              borderColor: skill.border,
              boxShadow: `0 4px 0 ${skill.border}`,
            }}
          >
            {/* Score ring */}
            <ProgressRing
              progress={progress}
              size={64}
              strokeWidth={5}
              color={skill.color}
            >
              <span
                className="text-lg font-bold"
                style={{ fontFamily: 'var(--font-mono)', color: skill.color }}
              >
                {score > 0 ? score.toFixed(1) : '—'}
              </span>
            </ProgressRing>

            {/* Skill name */}
            <div>
              <p className="text-sm font-bold" style={{ color: skill.color }}>
                {skill.key}
              </p>
              <p className="text-[11px] mt-0.5" style={{ color: skill.color, opacity: 0.7 }}>
                {skill.description}
              </p>
            </div>
          </motion.button>
        );
      })}
    </div>
  );
}
