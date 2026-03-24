"use client";

import { motion } from "framer-motion";
import type { Skill, SkillCardProps } from "../types";

const skillConfig: Record<Skill, { color: string; bg: string; text: string }> = {
  Reading: {
    color: "border-blue-500",
    bg: "bg-blue-50",
    text: "text-blue-700",
  },
  Listening: {
    color: "border-purple-500",
    bg: "bg-purple-50",
    text: "text-purple-700",
  },
  Writing: {
    color: "border-amber-500",
    bg: "bg-amber-50",
    text: "text-amber-700",
  },
  Speaking: {
    color: "border-emerald-500",
    bg: "bg-emerald-50",
    text: "text-emerald-700",
  },
};

export default function SkillCard({
  skill,
  currentScore,
  targetScore,
  examCount,
  onClick,
}: SkillCardProps) {
  const config = skillConfig[skill];
  const progress = Math.min((currentScore / targetScore) * 100, 100);
  const circumference = 2 * Math.PI * 35;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <motion.button
      onClick={onClick}
      className={`relative bg-white border-[3px] border-slate-100 rounded-[1.5rem] shadow-[0_4px_0_rgba(0,0,0,0.08)] p-6 text-left transition-all duration-200 hover:-translate-y-[2px] hover:shadow-[0_6px_0_rgba(0,0,0,0.1)] hover:border-blue-300`}
      whileHover={{ y: -2 }}
      whileTap={{ scale: 0.98 }}
    >
      {/* Radial Progress Chart */}
      <div className="flex justify-center mb-4">
        <div className="relative w-20 h-20">
          <svg className="-rotate-90 w-20 h-20" viewBox="0 0 80 80">
            {/* Background circle */}
            <circle
              cx="40"
              cy="40"
              r="35"
              fill="none"
              stroke="#E5E7EB"
              strokeWidth="6"
            />
            {/* Progress circle */}
            <motion.circle
              cx="40"
              cy="40"
              r="35"
              fill="none"
              stroke={skillConfig[skill].color.replace("border-", "#").replace("-500", "")}
              strokeWidth="6"
              strokeLinecap="round"
              strokeDasharray={circumference}
              initial={{ strokeDashoffset: circumference }}
              animate={{ strokeDashoffset }}
              transition={{ duration: 1, delay: 0.3, ease: "easeOut" }}
            />
          </svg>
          
          {/* Center percentage */}
          <div className="absolute inset-0 flex items-center justify-center">
            <span
              className="text-sm font-bold text-slate-700"
              style={{ fontFamily: "var(--font-mono)" }}
            >
              {Math.round(progress)}%
            </span>
          </div>
        </div>
      </div>

      {/* Skill name */}
      <h3 className={`text-lg font-bold text-center ${config.text} mb-1`}>
        {skill}
      </h3>

      {/* Score display */}
      <div className="text-center mb-2">
        <span
          className="text-2xl font-bold text-slate-800"
          style={{ fontFamily: "var(--font-mono)" }}
        >
          {currentScore}
        </span>
        <span className="text-slate-400"> / {targetScore}</span>
      </div>

      {/* Exam count */}
      <p className="text-xs text-slate-500 text-center">
        {examCount} test{examCount !== 1 ? "s" : ""} taken
      </p>

      {/* Arrow indicator */}
      <div className="absolute top-4 right-4">
        <span className="text-slate-300">→</span>
      </div>
    </motion.button>
  );
}
