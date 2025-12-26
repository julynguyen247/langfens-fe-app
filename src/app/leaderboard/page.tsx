"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { getLeaderboard } from "@/utils/api";
import { FiArrowLeft } from "react-icons/fi";
import { HiOutlineFire } from "react-icons/hi";
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
      <div className="w-full min-h-screen bg-gradient-to-b from-blue-50 to-white">
        <main className="mx-auto max-w-4xl px-4 py-8">
          <SkeletonLeaderboard />
        </main>
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen bg-gradient-to-b from-blue-50 to-white">
      <main className="mx-auto max-w-4xl px-4 sm:px-6 py-8 space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-4"
        >
          <button
            onClick={() => router.push("/profile")}
            className="p-2 rounded-lg hover:bg-slate-100 transition"
          >
            <FiArrowLeft className="w-5 h-5 text-slate-600" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Bảng xếp hạng</h1>
            <p className="text-sm text-slate-500">
              Top {entries.length} người dùng
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
          className="bg-white rounded-2xl shadow-sm overflow-hidden"
        >
          <div className="p-4 border-b border-slate-100">
            <h2 className="font-semibold text-slate-900">Xếp hạng đầy đủ</h2>
          </div>

          <div className="divide-y divide-slate-100">
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
            <div className="p-8 text-center text-slate-500">
              Chưa có dữ liệu xếp hạng.
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
      bgGradient: "from-yellow-400 to-yellow-500",
      emoji: "🥇",
      size: "w-20 h-20",
      shadow: "shadow-yellow-200",
    },
    2: {
      height: "h-24",
      bgGradient: "from-slate-300 to-slate-400",
      emoji: "🥈",
      size: "w-16 h-16",
      shadow: "shadow-slate-200",
    },
    3: {
      height: "h-20",
      bgGradient: "from-orange-400 to-orange-500",
      emoji: "🥉",
      size: "w-16 h-16",
      shadow: "shadow-orange-200",
    },
  };

  const config = podiumConfig[position];

  return (
    <div className="flex flex-col items-center">
      {/* Avatar */}
      <div
        className={`${config.size} rounded-full bg-gradient-to-br ${config.bgGradient} flex items-center justify-center text-white shadow-lg ${config.shadow} mb-2 ${
          isCurrentUser ? "ring-4 ring-blue-500" : ""
        }`}
      >
        <span className="text-2xl">{config.emoji}</span>
      </div>

      {/* Name */}
      <div className={`text-sm font-semibold ${isCurrentUser ? "text-blue-600" : "text-slate-700"}`}>
        {entry.displayName || `User ${entry.userId.slice(0, 8)}`}
      </div>

      {/* XP */}
      <div className="text-xs text-slate-500">{entry.totalXp.toLocaleString()} XP</div>

      {/* Podium Block */}
      <div
        className={`mt-2 w-24 ${config.height} rounded-t-xl bg-gradient-to-b ${config.bgGradient} flex items-center justify-center`}
      >
        <span className="text-3xl font-bold text-white/80">{position}</span>
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
    0: "bg-yellow-100 text-yellow-700",
    1: "bg-slate-100 text-slate-600",
    2: "bg-orange-100 text-orange-700",
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.02 }}
      className={`flex items-center gap-4 px-4 py-3 ${
        isCurrentUser ? "bg-blue-50" : "hover:bg-slate-50"
      } transition`}
    >
      {/* Rank */}
      <div
        className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
          rankColors[index] || "bg-slate-50 text-slate-500"
        }`}
      >
        {entry.rank}
      </div>

      {/* Avatar/Initials */}
      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-bold text-sm">
        {(entry.displayName || entry.userId).slice(0, 2).toUpperCase()}
      </div>

      {/* Name & Level */}
      <div className="flex-1 min-w-0">
        <div className={`font-medium truncate ${isCurrentUser ? "text-blue-600" : "text-slate-900"}`}>
          {entry.displayName || `User ${entry.userId.slice(0, 8)}`}
          {isCurrentUser && (
            <span className="ml-2 text-xs bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full">
              Bạn
            </span>
          )}
        </div>
        <div className="text-xs text-slate-500">Level {entry.level}</div>
      </div>

      {/* Streak */}
      {entry.currentStreak > 0 && (
        <div className="flex items-center gap-1 text-orange-500">
          <HiOutlineFire className="w-4 h-4" />
          <span className="text-sm font-medium">{entry.currentStreak}</span>
        </div>
      )}

      {/* XP */}
      <div className="text-right">
        <div className="font-bold text-slate-900">
          {entry.totalXp.toLocaleString()}
        </div>
        <div className="text-xs text-slate-400">XP</div>
      </div>
    </motion.div>
  );
}

function SkeletonLeaderboard() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="flex items-center gap-4">
        <div className="w-10 h-10 bg-slate-200 rounded-lg" />
        <div className="space-y-2">
          <div className="h-6 w-40 bg-slate-200 rounded" />
          <div className="h-4 w-32 bg-slate-200 rounded" />
        </div>
      </div>
      <div className="flex items-end justify-center gap-4 py-6">
        <div className="w-24 h-40 bg-slate-200 rounded-t-xl" />
        <div className="w-24 h-52 bg-slate-200 rounded-t-xl" />
        <div className="w-24 h-32 bg-slate-200 rounded-t-xl" />
      </div>
      <div className="bg-slate-200 rounded-2xl h-96" />
    </div>
  );
}
