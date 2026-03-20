'use client';

import { motion, useReducedMotion } from 'framer-motion';
import PenguinLottie from '@/components/PenguinLottie';

interface HeroHeaderProps {
  userName: string;
  streak: number;
  level: number;
  currentXP: number;
  dailyTarget: number;
}

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}

export function HeroHeader({ userName, streak, level, currentXP, dailyTarget }: HeroHeaderProps) {
  const prefersReducedMotion = useReducedMotion();
  const xpProgress = dailyTarget > 0 ? Math.min((currentXP / dailyTarget) * 100, 100) : 0;

  return (
    <motion.div
      initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
      className="relative rounded-[2rem] bg-gradient-to-b from-[var(--primary-light)] to-white border-[3px] border-[var(--border)] shadow-[0_6px_0_rgba(0,0,0,0.08)] overflow-hidden"
    >
      {/* Decorative blobs */}
      <div
        className="absolute top-0 right-0 w-48 h-48 rounded-full opacity-30"
        style={{ background: 'var(--primary)', filter: 'blur(60px)', transform: 'translate(30%, -30%)' }}
      />
      <div
        className="absolute bottom-0 left-0 w-32 h-32 rounded-full opacity-15"
        style={{ background: 'var(--skill-speaking)', filter: 'blur(50px)', transform: 'translate(-20%, 20%)' }}
      />

      <div className="relative z-10 p-6 sm:p-8 lg:p-10">
        <div className="flex flex-col sm:flex-row sm:items-center gap-6">
          {/* Left: Greeting + Info */}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-[var(--primary)] mb-1">
              {getGreeting()}
            </p>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-[var(--foreground)] leading-tight">
              {userName}
              <span className="text-[var(--primary)]">!</span>
            </h1>
            <p className="mt-2 text-[var(--text-muted)] text-sm max-w-md">
              Ready to continue your IELTS journey? Let&apos;s make today count.
            </p>

            {/* Badges row */}
            <div className="flex flex-wrap items-center gap-3 mt-4">
              {/* Streak badge */}
              {streak > 0 && (
                <motion.div
                  whileHover={{ y: -2 }}
                  className="inline-flex items-center gap-2 bg-white border-[2px] border-[var(--accent-gold-border)] rounded-full px-4 py-2 shadow-[0_2px_0_rgba(0,0,0,0.06)]"
                >
                  <span
                    className="w-5 h-5 rounded-full flex items-center justify-center text-[10px]"
                    style={{ background: 'var(--accent-gold-bg)', color: 'var(--accent-gold)' }}
                  >
                    S
                  </span>
                  <span
                    className="text-base font-bold"
                    style={{ fontFamily: 'var(--font-mono)', color: 'var(--accent-gold)' }}
                  >
                    {streak}
                  </span>
                  <span className="text-xs font-semibold text-[var(--text-muted)]">day streak</span>
                </motion.div>
              )}

              {/* Level badge */}
              {level > 0 && (
                <motion.div
                  whileHover={{ y: -2 }}
                  className="inline-flex items-center gap-2 bg-[var(--primary)] text-white rounded-full px-4 py-2 border-b-[3px] border-[var(--primary-dark)] shadow-[0_2px_0_rgba(0,0,0,0.1)]"
                >
                  <span className="text-xs font-bold">Lv.</span>
                  <span
                    className="text-base font-bold"
                    style={{ fontFamily: 'var(--font-mono)' }}
                  >
                    {level}
                  </span>
                </motion.div>
              )}

              {/* XP today pill */}
              <div className="inline-flex items-center gap-2 bg-white/80 border-[2px] border-[var(--border)] rounded-full px-4 py-2">
                <span className="text-xs font-semibold text-[var(--text-muted)]">Today</span>
                <span
                  className="text-sm font-bold text-[var(--primary)]"
                  style={{ fontFamily: 'var(--font-mono)' }}
                >
                  {currentXP}/{dailyTarget} XP
                </span>
                {xpProgress >= 100 && (
                  <span className="text-xs font-bold text-[var(--skill-speaking)]">Done!</span>
                )}
              </div>
            </div>
          </div>

          {/* Right: Penguin */}
          <motion.div
            initial={prefersReducedMotion ? {} : { scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.3, ease: 'easeOut' }}
            className="relative w-28 h-28 sm:w-36 sm:h-36 shrink-0 self-center"
          >
            {/* Glow circle behind penguin */}
            <div
              className="absolute inset-0 rounded-full opacity-20"
              style={{
                background: 'radial-gradient(circle, var(--primary) 0%, transparent 70%)',
              }}
            />
            <div className="relative z-10 w-full h-full flex items-center justify-center">
              <PenguinLottie />
            </div>
          </motion.div>
        </div>

        {/* XP Progress bar (thin, at bottom of hero) */}
        <div className="mt-5">
          <div className="h-2.5 rounded-full bg-white/60 overflow-hidden border border-[var(--border)]">
            <motion.div
              className="h-full rounded-full"
              style={{ background: 'var(--primary)' }}
              initial={prefersReducedMotion ? { width: `${xpProgress}%` } : { width: 0 }}
              animate={{ width: `${xpProgress}%` }}
              transition={{ duration: 1.2, ease: 'easeOut', delay: 0.5 }}
            />
          </div>
        </div>
      </div>
    </motion.div>
  );
}
