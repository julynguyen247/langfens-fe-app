"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  getAttempt,
  getMe,
  getPublicExams,
  startAttempt,
  getPlacementStatus,
  getWritingHistory,
  getSpeakingHistory,
  getAnalyticsSummary,
  getGamificationStats,
  getAchievements,
  getLeaderboard,
} from "@/utils/api";
import { useAttemptStore } from "../store/useAttemptStore";
import { useLoadingStore } from "../store/loading";
import {
  mapSpeakingHistoryToAttempt,
  mapWritingHistoryToAttempt,
  normalizeAttemptItem,
} from "./components/utils";

// New components
import HeroDashboard from "./components/HeroDashboard";
import StatsRow from "./components/StatsRow";
import TodayGoal from "./components/TodayGoal";
import ContinueLearningCard from "./components/ContinueLearningCard";
import SkillProgressGrid from "./components/SkillProgressGrid";
import AchievementsWidget from "./components/AchievementsWidget";
import LeaderboardWidget from "./components/LeaderboardWidget";
import RecentActivityTimeline from "./components/RecentActivityTimeline";

// Types
import type {
  Attempt,
  PlacementStatus,
  Skill,
  GamificationStats,
  Achievement,
  LeaderboardEntry,
  ActivityItem,
  SkillProgress,
} from "./types";

// ====================================
// HELPER FUNCTIONS
// ====================================

function buildAttemptUrl(a: Attempt): string {
  if (a.skill === "Writing") return `/attempts/${a.id}?source=writing`;
  if (a.skill === "Speaking") return `/attempts/${a.id}?source=speaking`;
  return `/attempts/${a.id}?source=attempt`;
}

function findWeakestSkill(attempts: Attempt[]): Skill | undefined {
  if (attempts.length === 0) return undefined;

  const skillScores: Record<Skill, { total: number; count: number }> = {
    Reading: { total: 0, count: 0 },
    Listening: { total: 0, count: 0 },
    Writing: { total: 0, count: 0 },
    Speaking: { total: 0, count: 0 },
  };

  attempts.forEach((a) => {
    if (a.score !== undefined) {
      skillScores[a.skill].total += a.score;
      skillScores[a.skill].count += 1;
    }
  });

  let weakest: Skill | undefined;
  let lowestAvg = Infinity;

  (Object.keys(skillScores) as Skill[]).forEach((skill) => {
    const { total, count } = skillScores[skill];
    if (count > 0) {
      const avg = total / count;
      if (avg < lowestAvg) {
        lowestAvg = avg;
        weakest = skill;
      }
    }
  });

  return weakest;
}

// ====================================
// MAIN PAGE COMPONENT
// ====================================

export default function Home() {
  const router = useRouter();
  const { setAttempt } = useAttemptStore();
  const { setLoading } = useLoadingStore();

  // State
  const [userName, setUserName] = useState("there");
  const [userId, setUserId] = useState("");
  const [attempts, setAttempts] = useState<Attempt[]>([]);
  const [loadingAttempts, setLoadingAttempts] = useState(true);
  const [placementTestId, setPlacementTestId] = useState("");
  const [placementStatus, setPlacementStatus] = useState<PlacementStatus | null>(null);
  const [loadingPlacement, setLoadingPlacement] = useState(true);
  
  // Gamification state
  const [gamification, setGamification] = useState<GamificationStats>({
    level: 1,
    currentXP: 0,
    totalXP: 0,
    dailyTargetXP: 500,
    todayXP: 0,
    currentStreak: 0,
    longestStreak: 0,
  });
  
  // Stats state
  const [stats, setStats] = useState({
    totalAttempts: 0,
    avgScore: 0,
    totalStudyTimeMin: 0,
    streak: 0,
  });
  
  // Achievements state
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  
  // Leaderboard state
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [userRank, setUserRank] = useState<number>();

  // Fetch user
  useEffect(() => {
    getMe()
      .then((res: any) => {
        const data = res?.data?.data ?? res?.data;
        const name = data?.name || "there";
        setUserName(name.split(" ")[0]);
        setUserId(data?.id || "");
      })
      .catch((err) => {
        console.error("Error fetching user:", err);
      });
  }, []);

  // Fetch attempts and analytics
  useEffect(() => {
    (async () => {
      setLoadingAttempts(true);
      try {
        const [res, wres, sres, analyticsRes, gamificationRes, achievementsRes, leaderboardRes] = await Promise.all([
          getAttempt(1, 10).catch(() => null),
          getWritingHistory().catch(() => null),
          getSpeakingHistory().catch(() => null),
          getAnalyticsSummary().catch(() => null),
          getGamificationStats().catch(() => null),
          getAchievements().catch(() => null),
          getLeaderboard(10).catch(() => null),
        ]);

        // Process attempts
        const raw = (res as any)?.data?.items ?? (res as any)?.data?.data ?? [];
        const list: Attempt[] = Array.isArray(raw) ? raw.map(normalizeAttemptItem) : [];
        const wraw = (wres as any)?.data?.data ?? [];
        const writingList: Attempt[] = Array.isArray(wraw) ? wraw.map(mapWritingHistoryToAttempt) : [];
        const sraw = (sres as any)?.data?.data ?? [];
        const speakingList: Attempt[] = Array.isArray(sraw) ? sraw.map(mapSpeakingHistoryToAttempt) : [];
        const merged = [...list, ...writingList, ...speakingList];
        merged.sort((a, b) => new Date(b.dateISO).getTime() - new Date(a.dateISO).getTime());
        setAttempts(merged);

        // Process analytics
        const summaryData = (analyticsRes as any)?.data?.data ?? (analyticsRes as any)?.data;
        if (summaryData) {
          setStats({
            totalAttempts: summaryData.totalAttempts ?? 0,
            avgScore: summaryData.avgScore ?? 0,
            totalStudyTimeMin: summaryData.totalStudyTimeMin ?? 0,
            streak: summaryData.currentStreak ?? 0,
          });
        }

        // Process gamification
        const gamificationData = (gamificationRes as any)?.data?.data ?? (gamificationRes as any)?.data;
        if (gamificationData) {
          setGamification({
            level: gamificationData.level ?? 1,
            currentXP: gamificationData.currentXP ?? 0,
            totalXP: gamificationData.totalXP ?? 0,
            dailyTargetXP: gamificationData.dailyTargetXP ?? 500,
            todayXP: gamificationData.todayXP ?? 0,
            currentStreak: gamificationData.currentStreak ?? 0,
            longestStreak: gamificationData.longestStreak ?? 0,
          });
        }

        // Process achievements
        const achievementsData = (achievementsRes as any)?.data?.data ?? (achievementsRes as any)?.data ?? [];
        if (Array.isArray(achievementsData)) {
          setAchievements(achievementsData.slice(0, 5).map((a: any) => ({
            id: a.id,
            name: a.name ?? "Achievement",
            description: a.description ?? "",
            progress: a.progress ?? 0,
            isUnlocked: a.isUnlocked ?? false,
            xpReward: a.xpReward ?? 100,
            iconType: (a.iconType as Achievement["iconType"]) ?? "tests",
          })));
        }

        // Process leaderboard
        const leaderboardData = (leaderboardRes as any)?.data?.data ?? (leaderboardRes as any)?.data ?? [];
        if (Array.isArray(leaderboardData)) {
          const entries: LeaderboardEntry[] = leaderboardData.map((u: any, idx: number) => ({
            rank: idx + 1,
            userId: u.userId ?? u.id ?? "",
            name: u.name ?? "User",
            xp: u.xp ?? 0,
            avatarUrl: u.avatarUrl,
          }));
          setLeaderboard(entries);
        }
      } catch (e) {
        console.error("Error loading data:", e);
      } finally {
        setLoadingAttempts(false);
      }
    })();
  }, []);

  // Detect current user's rank in leaderboard
  // Runs when both userId (from getMe) and leaderboard are available,
  // avoiding the race condition where userId wasn't set yet
  useEffect(() => {
    if (userId && leaderboard.length > 0) {
      const rank = leaderboard.findIndex((u) => u.userId === userId);
      if (rank >= 0) {
        setUserRank(rank + 1);
      }
      // If user not found in top 10, leave userRank as undefined
      // (don't set to 0, since LeaderboardWidget checks: currentUserRank && currentUserRank > 3)
    }
  }, [userId, leaderboard]);

  // Fetch placement status
  useEffect(() => {
    (async () => {
      setLoadingPlacement(true);
      try {
        const [testsRes, statusRes] = await Promise.allSettled([
          getPublicExams(1, 100),
          getPlacementStatus(),
        ]);

        if (testsRes.status === "fulfilled") {
          const data = (testsRes.value as any)?.data?.data ?? (testsRes.value as any)?.data ?? [];
          const placement = Array.isArray(data)
            ? data.find((item: any) => String(item.title || "").includes("English Placement"))
            : null;
          if (placement?.id) setPlacementTestId(String(placement.id));
        }

        if (statusRes.status === "fulfilled") {
          const raw = (statusRes.value as any)?.data?.data ?? (statusRes.value as any)?.data ?? null;
          if (raw) {
            setPlacementStatus({
              completed: !!raw.completed,
              attemptId: String(raw.attemptId ?? ""),
              level: String(raw.level ?? ""),
              band: Number(raw.band ?? 0),
            });
          }
        }
      } finally {
        setLoadingPlacement(false);
      }
    })();
  }, []);

  // Handlers
  async function handleStartPlacement() {
    if (!placementTestId) return;
    try {
      setLoading(true);
      const res = await startAttempt(placementTestId);
      const payload = (res as any)?.data?.data ?? (res as any)?.data ?? res;
      const attemptId = payload?.attemptId ?? payload?.id;
      if (!attemptId) throw new Error("Missing attemptId");
      setAttempt(payload);
      router.push(`/placement/${attemptId}`);
    } catch (err) {
      console.error(err);
      alert("Unable to start test. Please try again!");
    } finally {
      setLoading(false);
    }
  }

  function handleSkillClick(skill: Skill) {
    router.push(`/practice?skill=${skill.toLowerCase()}`);
  }

  function handleViewAchievements() {
    router.push("/achievements");
  }

  function handleViewLeaderboard() {
    router.push("/leaderboard");
  }

  function handleViewAttempt(attemptId: string, skill: Skill) {
    if (skill === "Writing") {
      router.push(`/attempts/${attemptId}?source=writing`);
    } else if (skill === "Speaking") {
      router.push(`/attempts/${attemptId}?source=speaking`);
    } else {
      router.push(`/attempts/${attemptId}?source=attempt`);
    }
  }

  function handleViewAllAttempts() {
    router.push("/history");
  }

  function handleStartPractice() {
    router.push("/practice");
  }

  // Computed values
  const weakestSkill = findWeakestSkill(attempts);
  const lastAttempt = attempts[0];

  // Convert attempts to ActivityItem for timeline
  const activityItems: ActivityItem[] = attempts.slice(0, 5).map((a) => ({
    id: a.id,
    title: a.title,
    skill: a.skill,
    score: a.score,
    dateISO: a.dateISO,
    attemptId: a.id,
  }));

  // Build skill progress data from attempts
  const skillCounts: Record<Skill, { total: number; count: number }> = {
    Reading: { total: 0, count: 0 },
    Listening: { total: 0, count: 0 },
    Writing: { total: 0, count: 0 },
    Speaking: { total: 0, count: 0 },
  };
  attempts.forEach((a) => {
    if (a.score !== undefined) {
      skillCounts[a.skill].total += a.score;
      skillCounts[a.skill].count += 1;
    }
  });

  const skillProgress: SkillProgress[] = (
    ["Reading", "Listening", "Writing", "Speaking"] as Skill[]
  ).map((skill) => ({
    skill,
    currentScore: skillCounts[skill].count > 0
      ? Math.round(skillCounts[skill].total / skillCounts[skill].count)
      : 0,
    // Target score of 80 represents IELTS passing threshold (Band 6.5-7.0)
    // This aligns with the app's goal of achieving professional English proficiency
    targetScore: 80,
    examCount: skillCounts[skill].count,
  }));

  return (
    <div className="min-h-screen w-full bg-[#F8FAFC]">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* =============================================
            SECTION 1: PLACEMENT TEST ALERT
        ============================================= */}
        {!loadingPlacement && !placementStatus?.completed && placementTestId && (
          <section className="flex items-center justify-between p-5 bg-blue-50 border-2 border-blue-200 rounded-xl">
            <div>
              <p className="font-semibold text-slate-800">Take Your Placement Test</p>
              <p className="text-sm text-slate-600">
                Let us assess your level to personalize your learning path.
              </p>
            </div>
            <button
              onClick={handleStartPlacement}
              className="px-5 py-2.5 bg-blue-500 hover:bg-blue-600 text-white font-semibold rounded-full border-b-[4px] active:translate-y-[2px] active:border-b-[2px] transition-all"
            >
              Start Now
            </button>
          </section>
        )}

        {/* Placement Complete Badge */}
        {!loadingPlacement && placementStatus?.completed && (
          <section className="flex items-center justify-between p-5 bg-emerald-50 border-2 border-emerald-200 rounded-xl">
            <div>
              <p className="font-semibold text-slate-800">Placement Complete</p>
              <p className="text-sm text-slate-600">
                Level: <strong>{placementStatus.level || "N/A"}</strong>
                {placementStatus.band > 0 && (
                  <span className="ml-2">
                    • Band <strong>{placementStatus.band.toFixed(1)}</strong>
                  </span>
                )}
              </p>
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={handleStartPlacement}
                className="text-sm text-slate-500 hover:text-slate-700 font-semibold"
              >
                Retake
              </button>
              <button
                onClick={() => router.push(`/attempts/${placementStatus.attemptId}?source=attempt`)}
                className="text-sm text-emerald-600 hover:text-emerald-700 font-semibold"
              >
                View Report
              </button>
            </div>
          </section>
        )}

        {/* =============================================
            SECTION 2: HERO DASHBOARD
        ============================================= */}
        <HeroDashboard
          userName={userName}
          streak={gamification.currentStreak}
          level={gamification.level}
          currentXP={gamification.currentXP}
          dailyTargetXP={gamification.dailyTargetXP}
          todayXP={gamification.todayXP}
        />

        {/* =============================================
            SECTION 3: STATS ROW
        ============================================= */}
        <StatsRow
          totalAttempts={stats.totalAttempts}
          avgScore={stats.avgScore}
          totalStudyTimeMin={stats.totalStudyTimeMin}
          streak={stats.streak}
        />

        {/* =============================================
            SECTION 4: TODAY'S GOAL + CONTINUE LEARNING
        ============================================= */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <TodayGoal
            todayXP={gamification.todayXP}
            dailyTargetXP={gamification.dailyTargetXP}
          />
          <ContinueLearningCard
            lastAttempt={lastAttempt}
            weakestSkill={weakestSkill}
            onStartPractice={handleStartPractice}
          />
        </div>

        {/* =============================================
            SECTION 5: SKILL PROGRESS GRID
        ============================================= */}
        <SkillProgressGrid
          skills={skillProgress}
          onSkillClick={handleSkillClick}
        />

        {/* =============================================
            SECTION 6: ACHIEVEMENTS + LEADERBOARD
        ============================================= */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <AchievementsWidget
            achievements={achievements}
            onViewAll={handleViewAchievements}
          />
          <LeaderboardWidget
            topUsers={leaderboard}
            currentUserRank={userRank}
            currentUserId={userId}
            onViewAll={handleViewLeaderboard}
          />
        </div>

        {/* =============================================
            SECTION 7: RECENT ACTIVITY TIMELINE
        ============================================= */}
        <RecentActivityTimeline
          attempts={activityItems}
          onViewAttempt={handleViewAttempt}
          onViewAll={handleViewAllAttempts}
        />
      </main>
    </div>
  );
}
