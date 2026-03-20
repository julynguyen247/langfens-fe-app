'use client';

import { ProgressRing } from '@/components/ui/ProgressRing';

interface XPProgressRingProps {
  currentXP: number;
  dailyTarget: number;
  level: number;
}

export function XPProgressRing({ currentXP, dailyTarget, level }: XPProgressRingProps) {
  const progress = dailyTarget > 0 ? Math.min((currentXP / dailyTarget) * 100, 100) : 0;

  return (
    <div className="flex items-center gap-6">
      <ProgressRing progress={progress} size={100} strokeWidth={8} color="var(--primary)">
        <div className="flex flex-col items-center">
          <span
            className="text-lg font-bold text-[var(--primary)]"
            style={{ fontFamily: 'var(--font-mono)' }}
          >
            {currentXP}
          </span>
          <span className="text-[10px] text-[var(--text-muted)]">
            / {dailyTarget} XP
          </span>
        </div>
      </ProgressRing>
      <div>
        <p className="text-sm text-[var(--text-muted)]">Daily XP Goal</p>
        <p className="text-lg font-bold text-[var(--foreground)]">
          Level{' '}
          <span style={{ fontFamily: 'var(--font-mono)' }}>{level}</span>
        </p>
        <p className="text-xs text-[var(--text-muted)] mt-1">
          {progress >= 100 ? 'Goal reached!' : `${Math.round(progress)}% complete`}
        </p>
      </div>
    </div>
  );
}
