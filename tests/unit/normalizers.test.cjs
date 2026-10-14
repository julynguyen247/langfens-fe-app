const assert = require("node:assert/strict");
const { test } = require("node:test");
const { createLoader } = require("./load-source.cjs");

const load = createLoader();
const { normaliseWrongAnswers } = load("src/app/error-review/utils.ts");
const {
  normaliseAnalyticsSummary,
  normaliseUserStats,
} = load("src/app/profile/utils.ts");

test("wrong-answer payloads fall back to an empty collection", () => {
  assert.deepEqual(normaliseWrongAnswers(undefined), {
    items: [], total: 0, page: 1, pageSize: 20, statsByType: {},
  });
  assert.deepEqual(normaliseWrongAnswers({ items: "invalid", total: "2" }), {
    items: [], total: 0, page: 1, pageSize: 20, statsByType: {},
  });
});

test("profile stats replace absent and invalid numbers with safe defaults", () => {
  assert.deepEqual(normaliseUserStats({ totalXp: undefined, xpForNextLevel: 0 }), {
    userId: "",
    totalXp: 0,
    level: 1,
    xpForNextLevel: 1,
    currentStreak: 0,
    longestStreak: 0,
    totalTestsCompleted: 0,
    totalCardsReviewed: 0,
    totalLessonsCompleted: 0,
    recentAchievements: [],
  });
});

test("analytics summary only exposes finite numeric scores", () => {
  assert.deepEqual(normaliseAnalyticsSummary({
    averageBandScore: "7.5",
    skillScores: { reading: 7, listening: Number.NaN },
  }), {
    averageBandScore: 0,
    skillScores: { reading: 7, listening: 0, writing: 0, speaking: 0 },
  });
});
