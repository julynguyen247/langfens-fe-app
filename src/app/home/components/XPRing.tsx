"use client";

import { useEffect, useRef } from "react";
import { motion } from "framer-motion";

interface XPRingProps {
  currentXP: number;
  targetXP: number;
  size?: number;
  strokeWidth?: number;
}

export default function XPRing({
  currentXP,
  targetXP,
  size = 180,
  strokeWidth = 12,
}: XPRingProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const progressPercent = Math.min((currentXP / targetXP) * 100, 100);
  const strokeDashoffset = circumference - (progressPercent / 100) * circumference;

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg
        width={size}
        height={size}
        className="-rotate-90"
      >
        {/* Background track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#E5E7EB"
          strokeWidth={strokeWidth}
        />
        
        {/* Progress ring */}
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#2563EB"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset }}
          transition={{ duration: 1.5, ease: "easeOut" }}
          style={{
            strokeDasharray: circumference,
          }}
        />
      </svg>

      {/* Center content */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <motion.span
          className="text-2xl font-bold text-slate-800"
          style={{ fontFamily: "var(--font-mono)" }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.5 }}
        >
          {currentXP}
        </motion.span>
        <motion.span
          className="text-sm text-slate-500"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7, duration: 0.5 }}
        >
          / {targetXP} XP
        </motion.span>
      </div>
    </div>
  );
}
