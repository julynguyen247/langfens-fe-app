import { apisGamification } from "../utils/api.customize";

export interface ProgressRingResponse {
  currentXp: number;
  targetXp: number;
  level: number;
  streak: number;
  dailyGoalPercent: number;
  todayXp: string;
}

export async function getProgressRing(): Promise<ProgressRingResponse> {
  const res = await apisGamification.get("/gamification/progress-ring");
  return res.data?.data;
}

export async function getGamificationStats() {
  const res = await apisGamification.get("/gamification/me");
  return res;
}

export async function getAchievements() {
  const res = await apisGamification.get("/gamification/achievements");
  return res;
}

export async function getLeaderboard(limit: number = 50) {
  const res = await apisGamification.get("/gamification/leaderboard", {
    params: { limit },
  });
  return res;
}

export async function getXpHistory(limit: number = 20) {
  const res = await apisGamification.get("/gamification/history", {
    params: { limit },
  });
  return res;
}

export async function dailyCheckin() {
  const res = await apisGamification.post("/gamification/daily-checkin");
  return res;
}
