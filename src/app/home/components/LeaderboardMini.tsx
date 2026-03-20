'use client';

import Link from 'next/link';

interface LeaderboardUser {
  userId: string;
  name: string;
  xp: number;
  rank: number;
}

interface LeaderboardMiniProps {
  topUsers: LeaderboardUser[];
  currentUserId?: string;
  currentUserRank?: number;
}

const RANK_LABELS = ['1st', '2nd', '3rd'];

export function LeaderboardMini({ topUsers, currentUserId, currentUserRank }: LeaderboardMiniProps) {
  return (
    <div className="rounded-[2rem] border-[3px] border-[var(--border)] bg-white p-6 shadow-[0_4px_0_rgba(0,0,0,0.08)]">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-bold text-[var(--foreground)]">Leaderboard</h3>
        <Link
          href="/leaderboard"
          className="text-xs font-bold text-[var(--primary)] hover:text-[var(--primary-hover)] transition-colors"
        >
          See All
        </Link>
      </div>

      <div className="space-y-2">
        {topUsers.slice(0, 3).map((user, i) => {
          const isCurrentUser = currentUserId && user.userId === currentUserId;
          return (
            <div
              key={user.userId}
              className={`flex items-center gap-3 p-2.5 rounded-xl transition-colors ${
                isCurrentUser ? 'bg-[var(--primary-light)]' : ''
              }`}
            >
              <span
                className="w-8 text-center text-sm font-bold text-[var(--text-muted)]"
                style={{ fontFamily: 'var(--font-mono)' }}
              >
                {RANK_LABELS[i] || `${i + 1}th`}
              </span>
              <span className="flex-1 text-sm font-semibold text-[var(--foreground)] truncate">
                {user.name}
              </span>
              <span
                className="text-sm font-bold text-[var(--primary)]"
                style={{ fontFamily: 'var(--font-mono)' }}
              >
                {user.xp.toLocaleString()} XP
              </span>
            </div>
          );
        })}
      </div>

      {currentUserRank && currentUserRank > 3 && (
        <div className="mt-3 pt-3 border-t border-[var(--border-light)] flex items-center gap-3 px-2.5">
          <span className="text-xs text-[var(--text-muted)]">Your rank:</span>
          <span
            className="text-sm font-bold text-[var(--primary)]"
            style={{ fontFamily: 'var(--font-mono)' }}
          >
            #{currentUserRank}
          </span>
        </div>
      )}
    </div>
  );
}
