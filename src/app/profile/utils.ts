import type { AnalyticsSummary, UserStats } from "./types";

// ====================================
// UTILITY FUNCTIONS
// ====================================
export function formatXpSource(source: string): string {
  const sourceMap: Record<string, string> = {
    DailyLogin: "Daily Login",
    TestCompleted: "Completed Practice Test",
    CardReviewed: "Card Reviewed",
    LessonCompleted: "Lesson Completed",
    AchievementUnlocked: "Achievement Unlocked",
    StreakBonus: "Streak Bonus",
    DAILY_LOGIN: "Daily Login",
    TEST_COMPLETED: "Completed Practice Test",
    CARD_REVIEWED: "Card Reviewed",
    LESSON_COMPLETED: "Lesson Completed",
    ACHIEVEMENT_UNLOCKED: "Achievement Unlocked",
    STREAK_BONUS: "Streak Bonus",
    DAILY_CHECKIN: "Daily Check-in",
  };
  return sourceMap[source] || source.split("_").map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(" ");
}

export function formatDate(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleString("en-US", {
      month: "short",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}
function finiteNumber(value: unknown, fallback = 0): number {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

export function normaliseUserStats(value: unknown): UserStats {
  const stats = value && typeof value === "object"
    ? (value as Record<string, unknown>)
    : {};

  return {
    userId: typeof stats.userId === "string" ? stats.userId : "",
    totalXp: finiteNumber(stats.totalXp),
    level: finiteNumber(stats.level, 1),
    xpForNextLevel: Math.max(1, finiteNumber(stats.xpForNextLevel, 1000)),
    currentStreak: finiteNumber(stats.currentStreak),
    longestStreak: finiteNumber(stats.longestStreak),
    totalTestsCompleted: finiteNumber(stats.totalTestsCompleted),
    totalCardsReviewed: finiteNumber(stats.totalCardsReviewed),
    totalLessonsCompleted: finiteNumber(stats.totalLessonsCompleted),
    recentAchievements: Array.isArray(stats.recentAchievements)
      ? stats.recentAchievements
      : [],
  };
}

export function normaliseAnalyticsSummary(value: unknown): AnalyticsSummary {
  if (!value || typeof value !== "object") return {};
  const summary = value as Record<string, unknown>;
  const rawSkills = summary.skillScores;
  const skills = rawSkills && typeof rawSkills === "object"
    ? (rawSkills as Record<string, unknown>)
    : {};

  return {
    averageBandScore: finiteNumber(summary.averageBandScore),
    skillScores: {
      reading: finiteNumber(skills.reading),
      listening: finiteNumber(skills.listening),
      writing: finiteNumber(skills.writing),
      speaking: finiteNumber(skills.speaking),
    },
  };
}
