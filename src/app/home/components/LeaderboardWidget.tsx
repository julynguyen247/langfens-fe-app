"use client";

import { motion } from "framer-motion";
import type { LeaderboardWidgetProps, LeaderboardEntry } from "../types";

function MedalBadge({ rank }: { rank: number }) {
  const medalColors: Record<number, string> = {
    1: "bg-amber-400 text-white",
    2: "bg-slate-300 text-slate-700",
    3: "bg-amber-600 text-white",
  };

  return (
    <div
      className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${medalColors[rank] || "bg-slate-200 text-slate-600"}`}
      style={{ fontFamily: "var(--font-mono)" }}
    >
      {rank}
    </div>
  );
}

function LeaderboardRow({
  entry,
  isCurrentUser,
}: {
  entry: LeaderboardEntry;
  isCurrentUser: boolean;
}) {
  return (
    <div
      className={`flex items-center gap-3 py-2 px-3 rounded-lg ${
        isCurrentUser
          ? "bg-blue-50 border-2 border-blue-200"
          : "hover:bg-slate-50"
      }`}
    >
      <MedalBadge rank={entry.rank} />
      
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-medium truncate ${isCurrentUser ? "text-blue-700" : "text-slate-800"}`}>
          {entry.name}
          {isCurrentUser && (
            <span className="ml-2 text-xs text-blue-500">(You)</span>
          )}
        </p>
      </div>
      
      <span
        className="text-sm font-semibold text-slate-600"
        style={{ fontFamily: "var(--font-mono)" }}
      >
        {entry.xp} XP
      </span>
    </div>
  );
}

export default function LeaderboardWidget({
  topUsers,
  currentUserRank,
  currentUserId,
  onViewAll,
}: LeaderboardWidgetProps) {
  const currentUserInTop = topUsers.some((u) => u.userId === currentUserId);

  return (
    <motion.section
      className="relative bg-white border-[3px] border-slate-100 rounded-[1.5rem] shadow-[0_4px_0_rgba(0,0,0,0.08)] p-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.7, duration: 0.4 }}
    >
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-slate-800">Leaderboard</h2>
        <button
          onClick={onViewAll}
          className="text-sm text-blue-600 hover:text-blue-700 font-medium"
        >
          View all
        </button>
      </div>

      {topUsers.length > 0 ? (
        <div className="space-y-1">
          {topUsers.slice(0, 3).map((user) => (
            <LeaderboardRow
              key={user.userId}
              entry={user}
              isCurrentUser={user.userId === currentUserId}
            />
          ))}
          
          {/* Show current user rank if not in top 3 */}
          {currentUserRank && currentUserRank > 3 && !currentUserInTop && (
            <>
              <div className="border-t border-slate-200 my-2" />
              <div className="flex items-center gap-3 py-2 px-3 bg-slate-50 rounded-lg">
                <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold bg-slate-200 text-slate-600">
                  {currentUserRank}
                </div>
                <span className="flex-1 text-sm text-slate-500">Your rank</span>
                <span
                  className="text-sm font-semibold text-slate-600"
                  style={{ fontFamily: "var(--font-mono)" }}
                >
                  #{currentUserRank}
                </span>
              </div>
            </>
          )}
        </div>
      ) : (
        <div className="text-center py-8 text-slate-500">
          <p className="text-sm">No leaderboard data</p>
          <p className="text-xs mt-1">Start practicing to appear on the leaderboard!</p>
        </div>
      )}
    </motion.section>
  );
}
