'use client';

import { motion, useReducedMotion, useInView } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';
import { ProgressRing } from '@/components/ui/ProgressRing';
import PenguinLottie from '@/components/PenguinLottie';

interface HeroDashboardProps {
  userName: string;
  streak: number;
  level: number;
  currentXP: number;
  dailyTarget: number;
}

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}

function getMotivationalText(progress: number): string {
  if (progress >= 100) return "Amazing! You've reached your goal!";
  if (progress >= 75) return "Almost there! Keep it up!";
  if (progress >= 50) return "You're on fire! Great progress!";
  if (progress >= 25) return "Great start! Keep going!";
  return "Let's get started!";
}

function getPenguinMessage(progress: number): string {
  if (progress >= 100) return "Goal reached! You're amazing!";
  if (progress >= 75) return "So close! You can do it!";
  if (progress >= 50) return "Looking good! Keep it up!";
  if (progress >= 25) return "Good progress! Let's go!";
  return "Ready to learn? Let's begin!";
}

// Animated streak flame using CSS
function StreakFlame({ streak, prefersReducedMotion }: { streak: number; prefersReducedMotion: boolean | null }) {
  return (
    <motion.div
      whileHover={{ y: -2 }}
      className="inline-flex items-center gap-2 bg-white border-[2px] border-[var(--accent-gold-border)] rounded-full px-4 py-2 shadow-[0_2px_0_rgba(0,0,0,0.06)]"
    >
      {/* CSS Flame */}
      <div className="relative w-5 h-5">
        <motion.div
          animate={prefersReducedMotion ? {} : {
            scaleY: [1, 1.1, 0.95, 1.05, 1],
            scaleX: [1, 0.95, 1.05, 0.98, 1],
          }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
          className="absolute inset-0"
          style={{
            background: 'linear-gradient(to top, var(--accent-gold) 0%, #FCD34D 50%, #FEF3C7 100%)',
            borderRadius: '50% 50% 50% 50% / 60% 60% 40% 40%',
            transformOrigin: 'bottom center',
          }}
        />
        {/* Inner glow */}
        <motion.div
          animate={prefersReducedMotion ? {} : {
            opacity: [0.8, 1, 0.7, 1],
          }}
          transition={{
            duration: 0.8,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
          className="absolute bottom-0 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full"
          style={{ background: '#FFF7ED' }}
        />
      </div>
      <span
        className="text-base font-bold"
        style={{ fontFamily: 'var(--font-mono)', color: 'var(--accent-gold)' }}
      >
        {streak}
      </span>
      <span className="text-xs font-semibold text-[var(--text-muted)]">day streak</span>
    </motion.div>
  );
}

// Bouncing penguin wrapper
function BouncingPenguin({ message }: { message: string }) {
  const [isBouncing, setIsBouncing] = useState(false);
  const prefersReducedMotion = useReducedMotion();

  useEffect(() => {
    if (prefersReducedMotion) return;

    const interval = setInterval(() => {
      setIsBouncing(true);
      setTimeout(() => setIsBouncing(false), 600);
    }, 3000);

    return () => clearInterval(interval);
  }, [prefersReducedMotion]);

  return (
    <motion.div
      animate={isBouncing ? { y: [0, -12, 0] } : { y: 0 }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
      className="relative"
    >
      <PenguinLottie />
    </motion.div>
  );
}

export function HeroDashboard({ userName, streak, level, currentXP, dailyTarget }: HeroDashboardProps) {
  const prefersReducedMotion = useReducedMotion();
  const xpProgress = dailyTarget > 0 ? Math.min((currentXP / dailyTarget) * 100, 100) : 0;
  const xpRemaining = Math.max(dailyTarget - currentXP, 0);

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
        <div className="flex flex-col lg:flex-row lg:items-center gap-6 lg:gap-8">
          {/* Left: Greeting + Info */}
          <div className="flex-1 min-w-0">
            {/* Greeting */}
            <p className="text-sm font-semibold text-[var(--primary)] mb-1">
              {getGreeting()}
            </p>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-[var(--foreground)] leading-tight">
              {userName}
              <span className="text-[var(--primary)]">!</span>
            </h1>
            <p className="mt-2 text-[var(--text-body)] text-sm max-w-md">
              {getMotivationalText(xpProgress)}
            </p>

            {/* Badges row */}
            <div className="flex flex-wrap items-center gap-3 mt-4">
              {/* Streak flame badge */}
              {streak > 0 && (
                <StreakFlame streak={streak} prefersReducedMotion={prefersReducedMotion} />
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

            {/* Daily progress text */}
            <div className="mt-4">
              <p className="text-sm text-[var(--text-muted)]">
                {xpProgress >= 100 ? (
                  <span className="text-[var(--skill-speaking)] font-semibold">Target reached! Great work!</span>
                ) : (
                  <>
                    <span className="text-[var(--foreground)] font-semibold">Target </span>
                    <span style={{ fontFamily: 'var(--font-mono)' }}>{xpRemaining}</span>
                    <span className="text-[var(--foreground)] font-semibold"> XP to reach your daily goal!</span>
                  </>
                )}
              </p>
            </div>
          </div>

          {/* Right: XP Ring + Penguin */}
          <div className="flex items-center justify-center gap-6 lg:gap-8">
            {/* XP Progress Ring */}
            <motion.div
              initial={prefersReducedMotion ? { scale: 1 } : { scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.2, ease: 'easeOut' }}
              className="relative"
            >
              <ProgressRing
                progress={xpProgress}
                size={180}
                strokeWidth={12}
                color="var(--primary)"
              >
                <div className="flex flex-col items-center">
                  <span
                    className="text-3xl font-bold text-[var(--primary)]"
                    style={{ fontFamily: 'var(--font-mono)' }}
                  >
                    {currentXP}
                  </span>
                  <span className="text-xs text-[var(--text-muted)]">
                    / {dailyTarget} XP
                  </span>
                </div>
              </ProgressRing>
              {/* XP ring label */}
              <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-[var(--accent-gold-bg)] border-[2px] border-[var(--accent-gold-border)] rounded-full px-3 py-0.5">
                <span className="text-[10px] font-bold text-[var(--accent-gold)]">Daily Goal</span>
              </div>
            </motion.div>

            {/* Penguin mascot */}
            <motion.div
              initial={prefersReducedMotion ? {} : { scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.3, ease: 'easeOut' }}
              className="flex flex-col items-center gap-2"
            >
              <BouncingPenguin message={getPenguinMessage(xpProgress)} />
              {/* Penguin message bubble */}
              <div className="bg-white border-[2px] border-[var(--border)] rounded-2xl px-3 py-1.5 shadow-[0_2px_0_rgba(0,0,0,0.04)] max-w-[120px]">
                <p className="text-[10px] text-center text-[var(--text-muted)] leading-tight">
                  {getPenguinMessage(xpProgress)}
                </p>
              </div>
            </motion.div>
          </div>
        </div>

        {/* XP Progress bar (thin, at bottom of hero) */}
        <div className="mt-6">
          <div className="h-2.5 rounded-full bg-white/60 overflow-hidden border border-[var(--border)]">
            <motion.div
              className="h-full rounded-full"
              style={{ background: 'linear-gradient(90deg, var(--primary) 0%, var(--primary-light) 100%)' }}
              initial={prefersReducedMotion ? { width: `${xpProgress}%` } : { width: 0 }}
              animate={{ width: `${xpProgress}%` }}
              transition={{ duration: 1.5, ease: 'easeOut', delay: 0.5 }}
            />
          </div>
        </div>
      </div>
    </motion.div>
  );
}
