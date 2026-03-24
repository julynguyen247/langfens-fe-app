"use client";

import { motion } from "framer-motion";
import type { TodayGoalProps } from "../types";

function getMotivationalMessage(progress: number): string {
  if (progress >= 100) return "Goal reached! Amazing work!";
  if (progress >= 75) return "So close! Just a bit more.";
  if (progress >= 50) return "Halfway there! Keep going.";
  if (progress >= 25) return "Good progress! Keep it up.";
  return "Let's get started! You got this.";
}

export default function TodayGoal({ todayXP, dailyTargetXP }: TodayGoalProps) {
  const progress = Math.min((todayXP / dailyTargetXP) * 100, 100);
  const remainingXP = Math.max(dailyTargetXP - todayXP, 0);
  const message = getMotivationalMessage(progress);

  return (
    <motion.section
      className="relative bg-white border-[4px] border-blue-500 rounded-[1.5rem] shadow-[0_4px_0_rgba(0,0,0,0.08)] p-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4, duration: 0.4 }}
    >
      {/* Title */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-slate-800">Today's Goal</h2>
        <span
          className="text-sm text-blue-600 font-semibold"
          style={{ fontFamily: "var(--font-mono)" }}
        >
          {Math.round(progress)}%
        </span>
      </div>

      {/* XP Display */}
      <div className="flex items-baseline gap-2 mb-4">
        <span
          className="text-3xl font-bold text-slate-800"
          style={{ fontFamily: "var(--font-mono)" }}
        >
          {todayXP}
        </span>
        <span className="text-slate-500">/ {dailyTargetXP} XP</span>
      </div>

      {/* Progress Bar */}
      <div className="relative h-3 bg-slate-100 rounded-full overflow-hidden mb-3">
        <motion.div
          className="absolute inset-y-0 left-0 bg-blue-500 rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 1, delay: 0.5, ease: "easeOut" }}
        />
        
        {/* Milestone markers */}
        {[25, 50, 75].map((milestone) => (
          <div
            key={milestone}
            className="absolute top-0 bottom-0 w-0.5 bg-slate-300"
            style={{ left: `${milestone}%` }}
          />
        ))}
      </div>

      {/* Motivational message */}
      <p className="text-sm text-slate-600 mb-2">{message}</p>

      {/* Remaining XP */}
      {progress < 100 && (
        <p className="text-xs text-slate-500">
          <span style={{ fontFamily: "var(--font-mono)" }}>{remainingXP}</span>
          {" XP to go"}
        </p>
      )}

      {/* Goal reached celebration */}
      {progress >= 100 && (
        <div className="mt-3 flex items-center gap-2 text-amber-600">
          <span className="text-lg">!</span>
          <span className="text-sm font-semibold">Daily goal complete!</span>
        </div>
      )}
    </motion.section>
  );
}
