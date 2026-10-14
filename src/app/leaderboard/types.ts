export type LeaderboardEntry = {
  rank: number;
  userId: string;
  displayName?: string;
  totalXp: number;
  level: number;
  currentStreak: number;
};
