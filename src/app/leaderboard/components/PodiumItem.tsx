"use client";

import { type LeaderboardEntry } from "../types";

export function PodiumItem({
  entry,
  position,
  currentUserId,
}: {
  entry: LeaderboardEntry;
  position: 1 | 2 | 3;
  currentUserId?: string;
}) {
  const isCurrentUser = currentUserId === entry.userId;

  const podiumConfig = {
    1: {
      height: "h-32",
      bg: "bg-[var(--podium-gold)]",
      borderColor: "border-[var(--podium-gold-border)]",
      size: "w-20 h-20",
      label: "1st",
    },
    2: {
      height: "h-24",
      bg: "bg-[var(--podium-silver)]",
      borderColor: "border-[var(--podium-silver-border)]",
      size: "w-16 h-16",
      label: "2nd",
    },
    3: {
      height: "h-20",
      bg: "bg-[var(--podium-bronze)]",
      borderColor: "border-[var(--podium-bronze-border)]",
      size: "w-16 h-16",
      label: "3rd",
    },
  };

  const config = podiumConfig[position];

  return (
    <div className="flex flex-col items-center">
      {/* Avatar Circle */}
      <div
        className={`${config.size} rounded-full ${config.bg} flex items-center justify-center text-white font-bold shadow-[0_4px_0_rgba(0,0,0,0.15)] border-b-[4px] ${config.borderColor} mb-2 ${
          isCurrentUser ? "ring-4 ring-[var(--primary)]" : ""
        }`}
      >
        <span className="text-lg font-bold" style={{ fontFamily: "var(--font-heading)" }}>
          {config.label}
        </span>
      </div>

      {/* Name */}
      <div className={`text-sm font-bold ${isCurrentUser ? "text-[var(--primary)]" : "text-[var(--text-body)]"}`}>
        {entry.displayName || `User ${entry.userId.slice(0, 8)}`}
      </div>

      {/* XP */}
      <div className="text-xs text-[var(--text-muted)]" style={{ fontFamily: "var(--font-mono)" }}>
        {entry.totalXp.toLocaleString()} XP
      </div>

      {/* Podium Block */}
      <div
        className={`mt-2 w-24 ${config.height} rounded-t-xl ${config.bg} border-b-[4px] ${config.borderColor} flex items-center justify-center`}
      >
        <span
          className="text-3xl font-bold text-white/80"
          style={{ fontFamily: "var(--font-mono)" }}
        >
          {position}
        </span>
      </div>
    </div>
  );
}
