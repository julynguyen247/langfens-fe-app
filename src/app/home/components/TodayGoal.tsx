'use client';

import { motion, useReducedMotion } from 'framer-motion';

interface TodayGoalProps {
  currentXP: number;
  dailyTarget: number;
}

const STREAK_BONUS_XP = 10;

export function TodayGoal({ currentXP, dailyTarget }: TodayGoalProps) {
  const prefersReducedMotion = useReducedMotion();
  const progress = dailyTarget > 0 ? Math.min((currentXP / dailyTarget) * 100, 100) : 0;
  const remainingXP = Math.max(dailyTarget - currentXP, 0);
  const isGoalReached = currentXP >= dailyTarget;

  // Motivational message based on progress
  const getMotivationalMessage = () => {
    if (progress === 0) return "Let's get started!";
    if (progress < 25) return "Let's get started!";
    if (progress < 50) return "Great start! Keep going!";
    if (progress < 75) return "You're on fire!";
    if (progress < 100) return "Almost there!";
    return "Goal reached! Amazing!";
  };

  // Milestone markers at 25%, 50%, 75%, 100%
  const milestones = [
    { position: 25, label: '25%' },
    { position: 50, label: '50%' },
    { position: 75, label: '75%' },
    { position: 100, label: '✓' },
  ];

  return (
    <motion.div
      initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className="rounded-[2rem] border-[3px] border-[var(--border)] bg-white shadow-[0_4px_0_rgba(0,0,0,0.08)] p-6"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-[var(--foreground)]">Daily Goal</h2>
        <span
          className="text-sm font-bold px-3 py-1 rounded-full"
          style={{
            backgroundColor: 'var(--primary-light)',
            color: 'var(--primary)',
            fontFamily: 'var(--font-mono)',
          }}
        >
          {Math.round(progress)}%
        </span>
      </div>

      {/* Progress Bar with Milestones */}
      <div className="relative mb-4">
        {/* Track */}
        <div className="h-4 rounded-full bg-[var(--border)] overflow-hidden relative">
          {/* Fill */}
          <motion.div
            className="h-full rounded-full"
            style={{
              background: isGoalReached
                ? 'linear-gradient(90deg, var(--primary) 0%, var(--skill-speaking) 100%)'
                : 'var(--primary)',
            }}
            initial={prefersReducedMotion ? { width: `${progress}%` } : { width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 1, ease: 'easeOut' }}
          />

          {/* Milestone markers */}
          {milestones.map((milestone) => (
            <div
              key={milestone.position}
              className="absolute top-0 bottom-0 flex items-center justify-center"
              style={{ left: `${milestone.position}%` }}
            >
              <div
                className="w-[3px] h-full"
                style={{
                  backgroundColor:
                    progress >= milestone.position
                      ? 'var(--foreground)'
                      : 'rgba(0,0,0,0.15)',
                }}
              />
            </div>
          ))}
        </div>

        {/* Milestone labels */}
        <div className="relative mt-1">
          {milestones.map((milestone) => (
            <span
              key={milestone.position}
              className="absolute text-[10px] text-[var(--text-muted)] transform -translate-x-1/2"
              style={{ left: `${milestone.position}%` }}
            >
              {milestone.label}
            </span>
          ))}
        </div>
      </div>

      {/* Motivational Message */}
      <p
        className="text-center font-bold mb-2"
        style={{
          color: isGoalReached ? 'var(--skill-speaking)' : 'var(--primary)',
        }}
      >
        {getMotivationalMessage()}
      </p>

      {/* XP Stats */}
      <div className="flex items-center justify-between text-sm">
        <div className="text-[var(--text-muted)]">
          {isGoalReached ? (
            <span>Great job today!</span>
          ) : (
            <span>
              <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--foreground)' }}>
                {remainingXP}
              </span>{' '}
              XP to go
            </span>
          )}
        </div>
        <div className="text-[var(--text-muted)]">
          <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--foreground)' }}>
            {currentXP}
          </span>
          <span className="mx-1">/</span>
          <span style={{ fontFamily: 'var(--font-mono)' }}>{dailyTarget} XP</span>
        </div>
      </div>

      {/* Streak Bonus Preview */}
      {isGoalReached && (
        <motion.div
          initial={prefersReducedMotion ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
          className="mt-4 pt-4 border-t-[2px] border-dashed border-[var(--border)]"
        >
          <div className="flex items-center justify-between">
            <span className="text-sm font-bold text-[var(--foreground)]">Streak Bonus</span>
            <span
              className="text-lg font-bold"
              style={{
                color: 'var(--skill-speaking)',
                fontFamily: 'var(--font-mono)',
              }}
            >
              +{STREAK_BONUS_XP} XP
            </span>
          </div>
          <p className="text-xs text-[var(--text-muted)] mt-1">
            Keep your streak going tomorrow!
          </p>
        </motion.div>
      )}
    </motion.div>
  );
}
