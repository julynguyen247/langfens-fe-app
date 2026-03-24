"use client";

import { motion } from "framer-motion";

interface StreakBadgeProps {
  streak: number;
  size?: "sm" | "md" | "lg";
}

const sizeClasses = {
  sm: "text-sm px-2 py-1",
  md: "text-base px-3 py-1.5",
  lg: "text-lg px-4 py-2",
};

const flameSizes = {
  sm: "text-lg",
  md: "text-xl",
  lg: "text-2xl",
};

export default function StreakBadge({ streak, size = "md" }: StreakBadgeProps) {
  if (streak <= 0) {
    return (
      <div
        className={`inline-flex items-center gap-1.5 bg-slate-100 rounded-full ${sizeClasses[size]}`}
      >
        <span className={`text-slate-400 ${flameSizes[size]}`}>-</span>
        <span
          className="font-semibold text-slate-600"
          style={{ fontFamily: "var(--font-mono)" }}
        >
          No streak
        </span>
      </div>
    );
  }

  return (
    <motion.div
      className={`inline-flex items-center gap-1.5 bg-amber-50 border-2 border-amber-200 rounded-full ${sizeClasses[size]}`}
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      {/* Flame icon using CSS */}
      <motion.span
        className={`text-amber-500 ${flameSizes[size]}`}
        animate={{
          scale: [1, 1.1, 1],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      >
        <svg
          viewBox="0 0 24 24"
          fill="currentColor"
          className={`w-5 h-5 ${flameSizes[size].replace("text-", "w-").replace("text-xl", "w-6").replace("text-2xl", "w-7").replace("text-lg", "w-5")} h-auto`}
          style={{ width: "1em", height: "1em" }}
        >
          <path d="M12 23c-4.97 0-9-3.58-9-8 0-2.52 1.17-4.83 3-6.36V8c0-4.42 3.58-8 8-8 .28 0 .5.22.5.5 0 .17-.08.33-.22.44-.33.25-.53.65-.53 1.06v.5c-1.25-.5-2.75-.5-4 0 .5 1.5 1.5 2.5 3 3 0-2 1-4 3-6 0 2 1 4 3 5v1c0 2-1 3.5-2.5 4.5C15 15.5 13.5 17 12 17c.67 2 2.33 3.5 4.5 4 .58.14 1.5.5 1.5 1.5 0 1.38-2.12 1.5-4 .5-1.92 2.5-4.08 3-5.5 3-1.55 0-2.75-.58-3.5-1.5 1.08 1 2.5 1.5 4 1.5 4.42 0 8-3.58 8-8 0-.78-.18-1.52-.5-2.18.82.64 1.5 1.52 1.93 2.55C21.35 15.17 22 16.5 22 18c0 4.42-4.03 5-9 5h-.5z" />
        </svg>
      </motion.span>
      
      <span
        className="font-bold text-amber-600"
        style={{ fontFamily: "var(--font-mono)" }}
      >
        {streak}
      </span>
      
      <span className="text-amber-600 text-sm font-medium">
        day{streak !== 1 ? "s" : ""}
      </span>
    </motion.div>
  );
}
