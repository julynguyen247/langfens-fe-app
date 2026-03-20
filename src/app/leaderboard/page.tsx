"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { getLeaderboard } from "@/utils/api";
import { useUserStore } from "@/app/store/userStore";

type LeaderboardEntry = {
  rank: number;
  userId: string;
  displayName?: string;
  totalXp: number;
  level: number;
  currentStreak: number;
};

export default function LeaderboardPage() {
  const router = useRouter();
  const { user } = useUserStore();
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLeaderboard();
  }, []);

  async function loadLeaderboard() {
    setLoading(true);
    try {
      const res = await getLeaderboard(50);
      const data = (res as any)?.data?.data ?? (res as any)?.data ?? [];
      setEntries(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Failed to load leaderboard:", error);
    } finally {
      setLoading(false);
    }
  }

  const top3 = entries.slice(0, 3);
  const rest = entries.slice(3);

  if (loading) {
    return (
      <div className="w-full min-h-screen bg-[var(--background)]">
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <SkeletonLeaderboard />
        </main>
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen bg-[var(--background)]">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-4"
        >
          <button
            onClick={() => router.push("/profile")}
            className="px-4 py-2.5 rounded-full bg-white border-[2px] border-[var(--border)] text-[var(--text-body)] font-bold shadow-[0_3px_0_rgba(0,0,0,0.06)] hover:-translate-y-0.5 hover:border-[var(--primary)] transition-all"
          >
            Back
          </button>
          <div>
            <h1
              className="text-2xl font-bold text-[var(--foreground)]"
              style={{ fontFamily: "var(--font-sans)" }}
            >
              Leaderboard
            </h1>
            <p className="text-sm text-[var(--text-muted)]">
              Top {entries.length} users
            </p>
          </div>
        </motion.div>

        {/* Podium - Top 3 */}
        {top3.length >= 3 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="flex items-end justify-center gap-4 py-6"
          >
            {/* 2nd Place */}
            <PodiumItem entry={top3[1]} position={2} currentUserId={user?.id} />
            {/* 1st Place */}
            <PodiumItem entry={top3[0]} position={1} currentUserId={user?.id} />
            {/* 3rd Place */}
            <PodiumItem entry={top3[2]} position={3} currentUserId={user?.id} />
          </motion.div>
        )}

        {/* Leaderboard Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-[1.5rem] border-[3px] border-[var(--border)] shadow-[0_4px_0_rgba(0,0,0,0.08)] overflow-hidden"
        >
          <div className="p-5 border-b-[2px] border-[var(--border)]">
            <h2
              className="font-bold text-[var(--foreground)]"
              style={{ fontFamily: "var(--font-sans)" }}
            >
              Full rankings
            </h2>
          </div>

          <div className="divide-y divide-[var(--border)]">
            {entries.map((entry, index) => (
              <LeaderboardRow
                key={entry.userId}
                entry={entry}
                index={index}
                isCurrentUser={user?.id === entry.userId}
              />
            ))}
          </div>

          {entries.length === 0 && (
            <div className="p-8 text-center text-[var(--text-muted)]">
              No leaderboard data available yet.
            </div>
          )}
        </motion.div>
      </main>
    </div>
  );
}

function PodiumItem({
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
      bg: "bg-amber-400",
      borderColor: "border-amber-500",
      size: "w-20 h-20",
      label: "1st",
    },
    2: {
      height: "h-24",
      bg: "bg-[var(--text-muted)]",
      borderColor: "border-[var(--text-body)]",
      size: "w-16 h-16",
      label: "2nd",
    },
    3: {
      height: "h-20",
      bg: "bg-orange-400",
      borderColor: "border-orange-500",
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
        <span className="text-lg font-bold" style={{ fontFamily: "var(--font-sans)" }}>
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

function LeaderboardRow({
  entry,
  index,
  isCurrentUser,
}: {
  entry: LeaderboardEntry;
  index: number;
  isCurrentUser: boolean;
}) {
  const rankColors: Record<number, string> = {
    0: "bg-amber-100 text-amber-700 border-amber-200",
    1: "bg-[var(--background)] text-[var(--text-body)] border-[var(--border)]",
    2: "bg-orange-100 text-orange-700 border-orange-200",
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
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-orange-50 border-[2px] border-orange-200">
          <span className="text-sm font-bold text-orange-600" style={{ fontFamily: "var(--font-mono)" }}>
            {entry.currentStreak}
          </span>
          <span className="text-xs font-bold text-orange-500">streak</span>
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

function SkeletonLeaderboard() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="flex items-center gap-4">
        <div className="w-16 h-10 bg-[var(--border)] rounded-full" />
        <div className="space-y-2">
          <div className="h-6 w-40 bg-[var(--border)] rounded-full" />
          <div className="h-4 w-32 bg-[var(--border)] rounded-full" />
        </div>
      </div>
      <div className="flex items-end justify-center gap-4 py-6">
        <div className="w-24 h-40 bg-[var(--border)] rounded-t-xl" />
        <div className="w-24 h-52 bg-[var(--border)] rounded-t-xl" />
        <div className="w-24 h-32 bg-[var(--border)] rounded-t-xl" />
      </div>
      <div className="bg-[var(--border)] rounded-[1.5rem] h-96" />
    </div>
  );
}
