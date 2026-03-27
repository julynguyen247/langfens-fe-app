'use client';

import { motion, useReducedMotion } from 'framer-motion';
import { SkillProgressCard } from './SkillProgressCard';

interface SkillProgressGridProps {
  scores: Record<string, number>; // { Reading: 6.5, Listening: 5.5, ... }
  targetScore?: number; // default 7.5
}

const SKILLS: Array<'Reading' | 'Listening' | 'Writing' | 'Speaking'> = [
  'Reading',
  'Listening',
  'Writing',
  'Speaking',
];

export function SkillProgressGrid({ scores, targetScore = 7.5 }: SkillProgressGridProps) {
  const prefersReducedMotion = useReducedMotion();

  return (
    <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-4">
      {SKILLS.map((skill, index) => (
        <motion.div
          key={skill}
          initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: index * 0.1, ease: 'easeOut' }}
        >
          <SkillProgressCard
            skill={skill}
            currentScore={scores[skill] ?? 0}
            targetScore={targetScore}
          />
        </motion.div>
      ))}
    </div>
  );
}
