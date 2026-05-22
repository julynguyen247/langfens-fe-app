"use client";

import { motion } from "framer-motion";

export interface NavigatorEntry {
  questionId: string;
  idx: number;
  isAnswered: boolean;
  isFlagged: boolean;
}

interface QuestionNavigatorProps {
  questions: NavigatorEntry[];
  currentIndex: number;
  onSelect: (idx: number) => void;
}

export default function QuestionNavigator({
  questions,
  currentIndex,
  onSelect,
}: QuestionNavigatorProps) {
  const getDotColor = (entry: NavigatorEntry, idx: number) => {
    if (idx === currentIndex) return "bg-yellow-400 ring-2 ring-yellow-400 ring-offset-2";
    if (entry.isFlagged) return "bg-red-500";
    if (entry.isAnswered) return "bg-green-500";
    return "bg-gray-300";
  };

  return (
    <div className="flex flex-wrap gap-2 justify-center p-3 bg-[var(--card)] rounded-2xl border border-[var(--border)]">
      {questions.map((entry, idx) => (
        <motion.button
          key={entry.questionId}
          whileHover={{ scale: 1.15 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => onSelect(idx)}
          className={`
            w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold
            transition-colors duration-150 cursor-pointer
            ${getDotColor(entry, idx)}
            ${idx === currentIndex ? "text-white" : "text-white/80"}
          `}
          title={`Q${entry.idx + 1}${entry.isAnswered ? " ✓" : ""}${entry.isFlagged ? " ⚑" : ""}`}
        >
          {entry.idx + 1}
        </motion.button>
      ))}
    </div>
  );
}