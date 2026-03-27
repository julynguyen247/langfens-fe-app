"use client";

import Link from "next/link";

interface Achievement {
  id: string;
  title: string;
  description?: string;
  progress: number; // 0-100
  unlocked: boolean;
}

interface AchievementsWidgetProps {
  achievements: Achievement[];
}

export function AchievementsWidget({ achievements }: AchievementsWidgetProps) {
  // Separate unlocked and in-progress achievements
  const unlocked = achievements.filter((a) => a.unlocked);
  const inProgress = achievements.filter((a) => !a.unlocked);

  // Sort in-progress by progress descending (closest to unlock first)
  const closestToUnlock = [...inProgress].sort((a, b) => b.progress - a.progress);

  // Get 2 closest to unlock and 1 most recent unlocked
  const displayInProgress = closestToUnlock.slice(0, 2);
  const displayUnlocked = unlocked.slice(0, 1);

  // Combine: in-progress first, then unlocked
  const displayAchievements = [...displayInProgress, ...displayUnlocked];

  if (displayAchievements.length === 0) {
    return null;
  }

  return (
    <div className="rounded-[2rem] border-[3px] border-[var(--border)] shadow-[0_4px_0_rgba(0,0,0,0.08)] bg-white p-5">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-[var(--foreground)]">
          Achievements
        </h3>
        <Link
          href="/achievements"
          className="text-sm font-medium text-[var(--primary)] hover:text-[var(--primary-hover)] transition-colors"
        >
          View All
        </Link>
      </div>

      {/* Achievement List */}
      <div className="space-y-3">
        {displayInProgress.map((achievement) => (
          <InProgressAchievement key={achievement.id} achievement={achievement} />
        ))}
        {displayUnlocked.map((achievement) => (
          <UnlockedAchievement key={achievement.id} achievement={achievement} />
        ))}
      </div>
    </div>
  );
}

function InProgressAchievement({ achievement }: { achievement: Achievement }) {
  return (
    <div className="p-3 rounded-xl bg-[var(--primary-light)]/30 border border-[var(--primary-light)]">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-[var(--foreground)]">
          {achievement.title}
        </span>
        <span className="text-xs text-[var(--text-muted)] font-mono">
          {achievement.progress}%
        </span>
      </div>
      {/* Progress Bar */}
      <div className="h-2 rounded-full bg-[var(--border)] overflow-hidden">
        <div
          className="h-full rounded-full bg-[var(--primary)] transition-all duration-500"
          style={{ width: `${achievement.progress}%` }}
        />
      </div>
    </div>
  );
}

function UnlockedAchievement({ achievement }: { achievement: Achievement }) {
  return (
    <div className="p-3 rounded-xl bg-[var(--accent-gold-bg)] border border-[var(--accent-gold-border)]">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {/* Badge */}
          <div className="w-6 h-6 rounded-full bg-[var(--accent-gold)] flex items-center justify-center">
            <span className="text-[10px] font-bold text-white">★</span>
          </div>
          <span className="text-sm font-medium text-[var(--foreground)]">
            {achievement.title}
          </span>
        </div>
        <span className="text-xs font-medium text-[var(--accent-gold)]">
          Unlocked!
        </span>
      </div>
    </div>
  );
}
