'use client';

import Link from 'next/link';

interface Achievement {
  id: string;
  title: string;
  description?: string;
  progress: number; // 0-100
  unlocked: boolean;
}

interface AchievementTeaserProps {
  achievements: Achievement[];
}

export function AchievementTeaser({ achievements }: AchievementTeaserProps) {
  // Show the 2 closest-to-unlock achievements
  const closestToUnlock = achievements
    .filter((a) => !a.unlocked)
    .sort((a, b) => b.progress - a.progress)
    .slice(0, 2);

  if (closestToUnlock.length === 0) return null;

  return (
    <div className="rounded-[2rem] border-[3px] border-[var(--border)] bg-white p-6 shadow-[0_4px_0_rgba(0,0,0,0.08)]">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-bold text-[var(--foreground)]">Achievements</h3>
        <Link
          href="/achievements"
          className="text-xs font-bold text-[var(--primary)] hover:text-[var(--primary-hover)] transition-colors"
        >
          View All
        </Link>
      </div>

      <div className="space-y-4">
        {closestToUnlock.map((achievement) => (
          <div key={achievement.id}>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-sm font-semibold text-[var(--foreground)]">
                {achievement.title}
              </span>
              <span
                className="text-xs font-bold text-[var(--text-muted)]"
                style={{ fontFamily: 'var(--font-mono)' }}
              >
                {achievement.progress}%
              </span>
            </div>
            <div className="h-2 rounded-full bg-[var(--border)] overflow-hidden">
              <div
                className="h-full rounded-full bg-[var(--primary)] transition-all duration-500"
                style={{ width: `${Math.min(achievement.progress, 100)}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
