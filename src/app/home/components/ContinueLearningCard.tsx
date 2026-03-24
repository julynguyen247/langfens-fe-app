"use client";

import { motion } from "framer-motion";
import type { ContinueLearningCardProps, Skill } from "../types";

const skillConfig: Record<Skill, { color: string; text: string }> = {
  Reading: {
    color: "border-l-blue-500",
    text: "text-blue-600",
  },
  Listening: {
    color: "border-l-purple-500",
    text: "text-purple-600",
  },
  Writing: {
    color: "border-l-amber-500",
    text: "text-amber-600",
  },
  Speaking: {
    color: "border-l-emerald-500",
    text: "text-emerald-600",
  },
};

export default function ContinueLearningCard({
  lastAttempt,
  weakestSkill,
  onStartPractice,
}: ContinueLearningCardProps) {
  const title = lastAttempt
    ? `Continue ${lastAttempt.title}`
    : weakestSkill
    ? `Improve ${weakestSkill}`
    : "Start Your Journey";

  const subtitle = lastAttempt
    ? `${lastAttempt.skill} practice`
    : weakestSkill
    ? `Focus on ${weakestSkill}`
    : "Begin your IELTS preparation";

  const skill = lastAttempt?.skill || weakestSkill || "Reading";
  const config = skillConfig[skill];

  return (
    <motion.section
      className={`relative bg-white border-[3px] border-slate-100 border-l-[4px] ${config.color} rounded-[1.5rem] shadow-[0_4px_0_rgba(0,0,0,0.08)] p-6`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4, duration: 0.4 }}
    >
      <h2 className="text-lg font-bold text-slate-800 mb-1">{title}</h2>
      <p className="text-sm text-slate-500 mb-4">{subtitle}</p>

      {/* CTA Button */}
      <motion.button
        onClick={onStartPractice}
        className={`w-full ${config.text.replace("text-", "bg-").replace("-600", "-500")} text-white font-semibold py-3 px-6 rounded-full border-b-[4px] active:translate-y-[2px] active:border-b-[2px] transition-all`}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        Start Practice
      </motion.button>
    </motion.section>
  );
}
