import { apisAnalytics } from "../utils/api.customize";

export async function getAnalyticsSummary() {
  const res = await apisAnalytics.get("/analytics/summary");
  return res;
}

export async function getScoreTrend(days: number = 30) {
  const res = await apisAnalytics.get("/analytics/score-trend", {
    params: { days },
  });
  return res;
}

export async function getStrengthsWeaknesses() {
  const res = await apisAnalytics.get("/analytics/strengths");
  return res;
}

export async function getRecentAnalyticsActivity(limit: number = 10) {
  const res = await apisAnalytics.get("/analytics/recent-activity", {
    params: { limit },
  });
  return res;
}

export async function getWrongAnswers(opts?: {
  skill?: string;
  questionType?: string;
  fromDate?: string;
  page?: number;
  pageSize?: number;
}) {
  const res = await apisAnalytics.get("/analytics/errors", {
    params: opts,
  });
  return res;
}

// Predicted Band
export async function getPredictedBand() {
  const res = await apisAnalytics.get("/analytics/predicted-band");
  return res;
}

// AI Insights
export async function getAiInsights() {
  const res = await apisAnalytics.get("/analytics/ai-insights");
  return res;
}

// Exam Recommendations
export async function getRecommendations(limit: number = 5) {
  const res = await apisAnalytics.get("/analytics/recommendations", {
    params: { limit },
  });
  return res;
}
