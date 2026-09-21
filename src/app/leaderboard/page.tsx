"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { getLeaderboard } from "@/services/gamification";
import { useUserStore } from "@/stores/userStore";

import { type LeaderboardEntry } from "./types";
import { SkeletonLeaderboard } from "./components/SkeletonLeaderboard";
import { PodiumItem } from "./components/PodiumItem";
import { LeaderboardRow } from "./components/LeaderboardRow";

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
              style={{ fontFamily: "var(--font-heading)" }}
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
              style={{ fontFamily: "var(--font-heading)" }}
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
