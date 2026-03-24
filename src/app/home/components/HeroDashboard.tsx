"use client";

import { motion } from "framer-motion";
import XPRing from "./XPRing";
import StreakBadge from "./StreakBadge";
import PenguinLottie from "@/components/PenguinLottie";
import type { HeroDashboardProps } from "../types";

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

function getMotivationalMessage(progress: number): string {
  if (progress >= 100) return "Goal reached! Amazing work!";
  if (progress >= 75) return "So close! Just a bit more.";
  if (progress >= 50) return "Halfway there! Keep going.";
  if (progress >= 25) return "Good progress! Keep it up.";
  return "Let's get started! You got this.";
}

export default function HeroDashboard({
  userName,
  streak,
  level,
  currentXP,
  dailyTargetXP,
  todayXP,
}: HeroDashboardProps) {
  const progress = Math.min((todayXP / dailyTargetXP) * 100, 100);
  const greeting = getGreeting();
  const motivational = getMotivationalMessage(progress);

  return (
    <motion.section
      className="relative bg-white border-[3px] border-slate-100 rounded-[1.5rem] shadow-[0_4px_0_rgba(0,0,0,0.08)] p-8 md:p-12 overflow-hidden"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      {/* Background decoration */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-blue-50 rounded-full blur-3xl opacity-50 -translate-y-1/2 translate-x-1/2" />
      
      <div className="relative flex flex-col lg:flex-row items-center justify-between gap-8">
        {/* LEFT: Text Content */}
        <div className="flex-1 space-y-6 z-10">
          {/* Greeting */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.4 }}
          >
            <h1 className="text-3xl md:text-4xl font-bold text-slate-800">
              {greeting}, <span className="text-blue-600">{userName}</span>!
            </h1>
          </motion.div>

          {/* Motivational message */}
          <motion.p
            className="text-lg text-slate-500"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.4 }}
          >
            {motivational}
          </motion.p>

          {/* Streak and Level */}
          <motion.div
            className="flex items-center gap-4"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.4 }}
          >
            <StreakBadge streak={streak} size="md" />
            
            <div className="flex items-center gap-2 bg-blue-50 border-2 border-blue-200 rounded-full px-3 py-1.5">
              <span className="text-sm text-blue-600 font-medium">Level</span>
              <span
                className="font-bold text-blue-600"
                style={{ fontFamily: "var(--font-mono)" }}
              >
                {level}
              </span>
            </div>
          </motion.div>

          {/* Daily progress text */}
          <motion.p
            className="text-sm text-slate-500"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.4 }}
          >
            <span style={{ fontFamily: "var(--font-mono)" }}>{todayXP}</span>
            {" / "}
            <span style={{ fontFamily: "var(--font-mono)" }}>{dailyTargetXP}</span>
            {" XP to reach your daily goal"}
          </motion.p>
        </div>

        {/* RIGHT: XP Ring + Penguin */}
        <motion.div
          className="flex flex-col items-center gap-4"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2, duration: 0.5 }}
        >
          <XPRing currentXP={todayXP} targetXP={dailyTargetXP} size={180} />
          
          {/* Penguin mascot */}
          <motion.div
            className="w-16 h-16"
            animate={{
              y: [0, -5, 0],
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          >
            <PenguinLottie />
          </motion.div>
        </motion.div>
      </div>
    </motion.section>
  );
}
