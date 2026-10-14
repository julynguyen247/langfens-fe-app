"use client";

import { motion } from "framer-motion";

import { type LeaderboardEntry } from "../types";

export function LeaderboardRow({
  entry,
  index,
  isCurrentUser,
}: {
  entry: LeaderboardEntry;
  index: number;
  isCurrentUser: boolean;
}) {
  const rankColors: Record<number, string> = {
    0: "bg-[var(--accent-gold-bg)] text-[var(--accent-gold)] border-[var(--accent-gold-border)]",
    1: "bg-[var(--background)] text-[var(--text-body)] border-[var(--border)]",
    2: "bg-[var(--accent-bronze-light)] text-[var(--accent-bronze)] border-[var(--accent-bronze-border)]",
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.02 }}
      className={`flex items-center gap-4 px-5 py-3.5 ${
        isCurrentUser ? "bg-[var(--primary-light)]" : "hover:bg-[var(--background)]"
      } transition`}
    >
      {/* Rank */}
      <div
        className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold border-[2px] ${
          rankColors[index] || "bg-[var(--background)] text-[var(--text-muted)] border-[var(--border)]"
        }`}
        style={{ fontFamily: "var(--font-mono)" }}
      >
        {entry.rank}
      </div>

      {/* Avatar/Initials */}
      <div className="w-10 h-10 rounded-full bg-[var(--primary)] flex items-center justify-center text-white font-bold text-sm border-b-[3px] border-[var(--primary-dark)]">
        {(entry.displayName || entry.userId).slice(0, 2).toUpperCase()}
      </div>

      {/* Name & Level */}
      <div className="flex-1 min-w-0">
        <div className={`font-bold truncate ${isCurrentUser ? "text-[var(--primary)]" : "text-[var(--foreground)]"}`}>
          {entry.displayName || `User ${entry.userId.slice(0, 8)}`}
          {isCurrentUser && (
            <span className="ml-2 text-xs bg-[var(--primary-light)] text-[var(--primary)] px-2.5 py-0.5 rounded-full font-bold border-[1px] border-blue-200">
              You
            </span>
          )}
        </div>
        <div className="text-xs text-[var(--text-muted)]">Level {entry.level}</div>
      </div>

      {/* Streak */}
      {entry.currentStreak > 0 && (
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[var(--accent-bronze-light)] border-[2px] border-[var(--accent-bronze-border)]">
          <span className="text-sm font-bold text-[var(--accent-bronze)]" style={{ fontFamily: "var(--font-mono)" }}>
            {entry.currentStreak}
          </span>
          <span className="text-xs font-bold text-[var(--accent-bronze)]">streak</span>
        </div>
      )}

      {/* XP */}
      <div className="text-right">
        <div
          className="font-bold text-[var(--foreground)]"
          style={{ fontFamily: "var(--font-mono)" }}
        >
          {entry.totalXp.toLocaleString()}
        </div>
        <div className="text-xs text-[var(--text-muted)]">XP</div>
      </div>
    </motion.div>
  );
}
