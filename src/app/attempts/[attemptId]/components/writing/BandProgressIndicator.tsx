'use client';

import { motion } from 'framer-motion';

interface Props {
  studentBand: number;
  stepUpBand: number;
  targetBand: number;
}

export function BandProgressIndicator({ studentBand, stepUpBand, targetBand }: Props) {
  // Progress bar maps the user's full 6.5 → 7.0 → 8.0 journey onto a single
  // filled track. The fill width represents how far the student has climbed
  // across the three milestones, so a 6.5 student sees meaningful movement
  // toward 8.0 instead of a half-filled bar.
  const start = studentBand;
  const end = targetBand;
  const span = Math.max(end - start, 0.5);
  const nextMilestonePct = Math.min(((stepUpBand - start) / span) * 100, 100);
  const targetPct = Math.min(((targetBand - start) / span) * 100, 100);

  return (
    <motion.div
      className="rounded-[2rem] border-[3px] border-[var(--border)] shadow-[0_4px_0_rgba(0,0,0,0.08)] bg-white p-6"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      data-testid="band-progress-indicator"
    >
      <p
        className="text-xs font-bold text-[var(--text-muted)] mb-4"
        style={{ fontFamily: 'var(--font-heading)' }}
      >
        Band Progress
      </p>

      <div className="flex items-end justify-between gap-2">
        <Milestone
          label="You"
          band={studentBand}
          colorClass="text-[var(--primary)]"
          emphasis
        />
        <Arrow />
        <Milestone
          label="Next step"
          band={stepUpBand}
          colorClass="text-[var(--skill-writing)]"
        />
        <Arrow />
        <Milestone
          label="Target"
          band={targetBand}
          colorClass="text-emerald-600"
        />
      </div>

      <div className="relative mt-5">
        <div className="h-4 rounded-full bg-gray-100 border-[2px] border-[var(--border)] overflow-hidden">
          <motion.div
            className="h-full rounded-full bg-[var(--primary)]"
            initial={{ width: 0 }}
            animate={{ width: `${nextMilestonePct}%` }}
            transition={{ duration: 1.0, delay: 0.3, ease: 'easeOut' }}
          />
        </div>
        {/* Tick marks at each milestone so the journey is unambiguous. */}
        <div className="absolute inset-0 pointer-events-none">
          <div
            className="absolute top-0 h-4 w-[2px] bg-[var(--border)]"
            style={{ left: `${nextMilestonePct}%`, transform: 'translateX(-1px)' }}
            aria-hidden
          />
          <div
            className="absolute top-0 h-4 w-[2px] bg-emerald-600/60"
            style={{ left: `${targetPct}%`, transform: 'translateX(-1px)' }}
            aria-hidden
          />
        </div>
      </div>
    </motion.div>
  );
}

function Milestone({
  label,
  band,
  colorClass,
  emphasis = false,
}: {
  label: string;
  band: number;
  colorClass: string;
  emphasis?: boolean;
}) {
  return (
    <div className="flex flex-col items-center flex-1">
      <p
        className="text-[10px] font-bold uppercase tracking-wide text-[var(--text-muted)] mb-1"
        style={{ fontFamily: 'var(--font-heading)' }}
      >
        {label}
      </p>
      <span
        className={`${colorClass} ${emphasis ? 'text-3xl' : 'text-2xl'} font-bold`}
        style={{ fontFamily: 'var(--font-mono)' }}
      >
        {band.toFixed(1)}
      </span>
    </div>
  );
}

function Arrow() {
  return (
    <span
      className="text-sm text-[var(--text-muted)] pb-2"
      aria-hidden
    >
      →
    </span>
  );
}
