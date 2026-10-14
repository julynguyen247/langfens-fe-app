// Types
export type Achievement = {
  id: string;
  slug: string;
  title: string;
  description: string;
  iconUrl?: string;
  category: string;
  requiredValue: number;
  xpReward: number;
  isUnlocked: boolean;
  unlockedAt?: string;
};

export type UserStats = {
  userId: string;
  totalXp: number;
  level: number;
  xpForNextLevel: number;
  currentStreak: number;
  longestStreak: number;
  totalTestsCompleted: number;
  totalCardsReviewed: number;
  totalLessonsCompleted: number;
  recentAchievements: Achievement[];
};

export type XpHistoryItem = {
  id: string;
  amount: number;
  source: string;
  createdAt: string;
};

export type UserProfile = {
  id: string;
  email: string;
  username?: string;
  displayName?: string;
  createdAt?: string;
};

export type AnalyticsSummary = {
  averageBandScore?: number;
  skillScores?: {
    reading?: number;
    listening?: number;
    writing?: number;
    speaking?: number;
  };
};

export type TabKey = "overview" | "achievements" | "settings";
