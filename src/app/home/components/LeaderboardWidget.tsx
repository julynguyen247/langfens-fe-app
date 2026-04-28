"use client";

import Link from "next/link";

interface LeaderboardUser {
  userId: string;
  name: string;
  xp: number;
  rank: number;
}

interface LeaderboardWidgetProps {
  topUsers: LeaderboardUser[];
  currentUserId?: string;
  currentUserRank?: number;
}

export function LeaderboardWidget({
  topUsers,
  currentUserId,
  currentUserRank,
}: LeaderboardWidgetProps) {
  // Get top 3 users
  const topThree = topUsers.slice(0, 3);

  // Check if current user is in top 3
  const isCurrentUserInTopThree = topUsers.some(
    (user) => user.userId === currentUserId
  );

  if (topUsers.length === 0) {
    return null;
  }

  return (
    <div className="rounded-[2rem] border-[3px] border-[var(--border)] shadow-[0_4px_0_rgba(0,0,0,0.08)] bg-white p-5">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-[var(--foreground)]">
          Leaderboard
        </h3>
        <Link
          href="/leaderboard"
          className="text-sm font-medium text-[var(--primary)] hover:text-[var(--primary-hover)] transition-colors"
        >
          See All
        </Link>
      </div>

      {/* Top 3 List */}
      <div className="space-y-2">
        {topThree.map((user) => (
          <LeaderboardRow
            key={user.userId}
            user={user}
            isCurrentUser={user.userId === currentUserId}
            isHighlighted={user.userId === currentUserId}
          />
        ))}
      </div>

      {/* Current User Rank (if not in top 3) */}
      {currentUserRank && !isCurrentUserInTopThree && (
        <>
          <div className="my-3 border-t border-[var(--border)]" />
          <div className="flex items-center justify-between text-sm">
            <span className="text-[var(--text-muted)]">Your rank:</span>
            <span className="font-semibold text-[var(--foreground)]">
              #{currentUserRank}
            </span>
          </div>
        </>
      )}
    </div>
  );
}

function LeaderboardRow({
  user,
  isCurrentUser,
  isHighlighted,
}: {
  user: LeaderboardUser;
  isCurrentUser: boolean;
  isHighlighted: boolean;
}) {
  return (
    <div
      className={`flex items-center gap-3 p-2 rounded-lg transition-colors ${
        isHighlighted
          ? "bg-[var(--primary-light)] border border-[var(--primary)]"
          : "hover:bg-gray-50"
      }`}
    >
      {/* Medal */}
      <Medal rank={user.rank} />

      {/* Rank Number */}
      <span className="w-5 text-sm font-medium text-[var(--text-muted)] text-center">
        {user.rank}.
      </span>

      {/* Name */}
      <span className="flex-1 text-sm font-medium text-[var(--foreground)] truncate">
        {user.name}
        {isCurrentUser && (
          <span className="ml-1 text-[var(--text-muted)]">(you)</span>
        )}
      </span>

      {/* XP */}
      <span
        className="text-sm font-medium text-[var(--text-muted)]"
        style={{ fontFamily: "var(--font-mono)" }}
      >
        {user.xp.toLocaleString()} XP
      </span>
    </div>
  );
}

function Medal({ rank }: { rank: number }) {
  if (rank === 1) {
    return (
      <div className="w-5 h-5 rounded-full bg-amber-400 flex items-center justify-center text-[10px] font-bold text-white shadow-sm">
        1
      </div>
    );
  }
  if (rank === 2) {
    return (
      <div className="w-5 h-5 rounded-full bg-gray-400 flex items-center justify-center text-[10px] font-bold text-white shadow-sm">
        2
      </div>
    );
  }
  if (rank === 3) {
    return (
      <div className="w-5 h-5 rounded-full bg-orange-600 flex items-center justify-center text-[10px] font-bold text-white shadow-sm">
        3
      </div>
    );
  }
  // Fallback for ranks beyond 3
  return (
    <div className="w-5 h-5 rounded-full bg-[var(--border)] flex items-center justify-center text-[10px] font-bold text-[var(--text-muted)]">
      {rank}
    </div>
  );
}
