"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, useReducedMotion } from "framer-motion";
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
  getLeaderboard,
  getAchievements,
} from "@/utils/api";
import { useAttemptStore } from "../store/useAttemptStore";
import { useLoadingStore } from "../store/loading";
import {
  mapSpeakingHistoryToAttempt,
  mapWritingHistoryToAttempt,
  normalizeAttemptItem,
} from "./components/utils";

import { EmptyState } from "@/components/ui/EmptyState";

import { HeroDashboard } from "./components/HeroDashboard";
import { SkillProgressGrid } from "./components/SkillProgressGrid";
import { StatsRow } from "./components/StatsRow";
import { TodayGoal } from "./components/TodayGoal";
import { StreakCalendar } from "./components/StreakCalendar";
import { LeaderboardWidget } from "./components/LeaderboardWidget";
import { AchievementsWidget } from "./components/AchievementsWidget";
import { ContinueLearning } from "./components/ContinueLearning";
import { RecentActivityTimeline } from "./components/RecentActivityTimeline";

// ====================================
// TYPES
// ====================================
export type Attempt = {
  id: string;
  title: string;
  skill: "Reading" | "Listening" | "Writing" | "Speaking";
  dateISO: string;
  score?: number;
  durationMin: number;
};

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
// SKELETON COMPONENTS
// ====================================
function SkeletonCard({ className = "" }: { className?: string }) {
  return (
    <div
      className={`bg-[var(--border)] animate-pulse rounded-[2rem] ${className}`}
    />
  );
}

// ====================================
// ANIMATION VARIANTS
// ====================================
const staggerContainer = {
  hidden: { opacity: 1 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.1 },
  },
};

const fadeInUp = {
  hidden: { opacity: 0, y: 16 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: "easeOut" as const },
  },
};

// ====================================
// MAIN PAGE COMPONENT
// ====================================

export default function Home() {
  const router = useRouter();
  const prefersReducedMotion = useReducedMotion();
  const { setAttempt } = useAttemptStore();
  const { setLoading } = useLoadingStore();

  // Existing state
  const [userName, setUserName] = useState("there");
  const [userId, setUserId] = useState("");
  const [attempts, setAttempts] = useState<Attempt[]>([]);
  const [loadingAttempts, setLoadingAttempts] = useState(true);
  const [placementTestId, setPlacementTestId] = useState("");
  const [placementStatus, setPlacementStatus] =
    useState<PlacementStatus | null>(null);
  const [loadingPlacement, setLoadingPlacement] = useState(true);
  const [analytics, setAnalytics] = useState<{
    totalAttempts: number;
    totalStudyTimeMin: number;
    avgScore: number;
    skillScores?: Record<string, number>;
  } | null>(null);
  const [streak, setStreak] = useState(0);

  // New gamification state
  const [gamification, setGamification] = useState<{
    currentXP: number;
    dailyTarget: number;
    level: number;
    activityDays: { date: string; count: number }[];
  } | null>(null);
  const [leaderboardUsers, setLeaderboardUsers] = useState<
    { userId: string; name: string; xp: number; rank: number }[]
  >([]);
  const [currentUserRank, setCurrentUserRank] = useState<number | undefined>();
  const [achievementsList, setAchievementsList] = useState<
    {
      id: string;
      title: string;
      description?: string;
      progress: number;
      unlocked: boolean;
    }[]
  >([]);
  const [loadingGamification, setLoadingGamification] = useState(true);

  // Fetch user
  useEffect(() => {
    getMe()
      .then((res: any) => {
        const data = res?.data?.data ?? res?.data;
        const name = data?.name || "there";
        setUserName(name.split(" ")[0]);
        if (data?.id) setUserId(String(data.id));
      })
      .catch((err) => {
        console.error("Error fetching user:", err);
      });
  }, []);

  // Fetch attempts and analytics (existing logic preserved)
  useEffect(() => {
    (async () => {
      setLoadingAttempts(true);
      try {
        const [res, wres, sres, analyticsRes, gamificationRes] =
          await Promise.all([
            getAttempt(1, 10),
            getWritingHistory(),
            getSpeakingHistory(),
            getAnalyticsSummary().catch(() => null),
            getGamificationStats().catch(() => null),
          ]);

        const raw =
          (res as any)?.data?.items ?? (res as any)?.data?.data ?? [];
        const list: Attempt[] = Array.isArray(raw)
          ? raw.map(normalizeAttemptItem)
          : [];
        const wraw = (wres as any)?.data?.data ?? [];
        const writingList: Attempt[] = Array.isArray(wraw)
          ? wraw.map(mapWritingHistoryToAttempt)
          : [];
        const sraw = (sres as any)?.data?.data ?? [];
        const speakingList: Attempt[] = Array.isArray(sraw)
          ? sraw.map(mapSpeakingHistoryToAttempt)
          : [];
        const merged = [...list, ...writingList, ...speakingList];
        merged.sort(
          (a, b) =>
            new Date(b.dateISO).getTime() - new Date(a.dateISO).getTime()
        );
        setAttempts(merged);

        const summaryData =
          (analyticsRes as any)?.data?.data ?? (analyticsRes as any)?.data;
        if (summaryData) setAnalytics(summaryData);

        const gamificationData =
          (gamificationRes as any)?.data?.data ??
          (gamificationRes as any)?.data;
        if (gamificationData?.currentStreak !== undefined) {
          setStreak(gamificationData.currentStreak);
        }
        if (gamificationData) {
          setGamification({
            currentXP: gamificationData.todayXP ?? gamificationData.xp ?? 0,
            dailyTarget: gamificationData.dailyTarget ?? 50,
            level: gamificationData.level ?? 1,
            activityDays: gamificationData.activityDays ?? [],
          });
        }
      } catch (e) {
        console.error("Error loading data:", e);
      } finally {
        setLoadingAttempts(false);
      }
    })();
  }, []);

  // Fetch gamification extras (leaderboard, achievements)
  useEffect(() => {
    (async () => {
      setLoadingGamification(true);
      try {
        const [lbRes, achRes] = await Promise.allSettled([
          getLeaderboard(3),
          getAchievements(),
        ]);

        if (lbRes.status === "fulfilled") {
          const lbData =
            (lbRes.value as any)?.data?.data ?? (lbRes.value as any)?.data;
          if (Array.isArray(lbData)) {
            setLeaderboardUsers(
              lbData.slice(0, 3).map((u: any, i: number) => ({
                userId: String(u.userId ?? u.id ?? i),
                name: String(u.name ?? u.username ?? "User"),
                xp: Number(u.xp ?? u.totalXP ?? 0),
                rank: i + 1,
              }))
            );
          }
          // Try to find current user rank
          if (Array.isArray(lbData)) {
            const userEntry = lbData.find(
              (u: any) => String(u.userId ?? u.id) === userId
            );
            if (userEntry) {
              setCurrentUserRank(userEntry.rank);
            }
          }
        }

        if (achRes.status === "fulfilled") {
          const achData =
            (achRes.value as any)?.data?.data ?? (achRes.value as any)?.data;
          if (Array.isArray(achData)) {
            setAchievementsList(
              achData.map((a: any) => ({
                id: String(a.id ?? a.achievementId ?? ""),
                title: String(a.title ?? a.name ?? "Achievement"),
                description: a.description,
                progress: Number(a.progress ?? 0),
                unlocked: !!a.unlocked,
              }))
            );
          }
        }
      } catch {
        // Silently fail for gamification extras
      } finally {
        setLoadingGamification(false);
      }
    })();
  }, [userId]);

  // Fetch placement status (existing logic preserved)
  useEffect(() => {
    (async () => {
      setLoadingPlacement(true);
      try {
        const [testsRes, statusRes] = await Promise.allSettled([
          getPublicExams(1, 100),
          getPlacementStatus(),
        ]);

        if (testsRes.status === "fulfilled") {
          const data =
            (testsRes.value as any)?.data?.data ??
            (testsRes.value as any)?.data ??
            [];
          const placement = Array.isArray(data)
            ? data.find((item: any) =>
                String(item.title || "").includes("English Placement")
              )
            : null;
          if (placement?.id) setPlacementTestId(String(placement.id));
        }

        if (statusRes.status === "fulfilled") {
          const raw =
            (statusRes.value as any)?.data?.data ??
            (statusRes.value as any)?.data ??
            null;
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
      const payload =
        (res as any)?.data?.data ?? (res as any)?.data ?? res;
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

  // Compute weakest skill from analytics
  const weakestSkill = useMemo(() => {
    if (!analytics?.skillScores) return undefined;
    const entries = Object.entries(analytics.skillScores);
    if (entries.length === 0) return undefined;
    entries.sort((a, b) => a[1] - b[1]);
    return entries[0][0];
  }, [analytics]);

  // Skill scores for progress bars
  const skillScores = useMemo(() => {
    const defaults = { Reading: 0, Listening: 0, Writing: 0, Speaking: 0 };
    if (!analytics?.skillScores) return defaults;
    return { ...defaults, ...analytics.skillScores };
  }, [analytics]);

  // Convert attempts for RecentActivityTimeline
  const recentActivityAttempts = useMemo(
    () =>
      attempts.slice(0, 5).map((a) => ({
        id: a.id,
        title: a.title,
        skill: a.skill,
        dateISO: a.dateISO,
        score: a.score,
        href: buildAttemptUrl(a),
      })),
    [attempts]
  );

  const isNewUser = !loadingAttempts && attempts.length === 0;
  const isLoading = loadingAttempts;

  const motionProps = prefersReducedMotion
    ? {}
    : { variants: fadeInUp };

  return (
    <div className="min-h-screen w-full bg-[var(--background)]">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* =============================================
            COMMAND CENTER GRID
        ============================================= */}
        <motion.div
          variants={prefersReducedMotion ? undefined : staggerContainer}
          initial="hidden"
          animate="show"
          className="grid lg:grid-cols-3 gap-8"
        >
          {/* =============================================
              MAIN COLUMN (2 cols)
          ============================================= */}
          <div className="lg:col-span-2 space-y-6">
            {/* Welcome Banner */}
            <motion.div {...motionProps}>
              <HeroDashboard
                userName={userName}
                streak={streak}
                level={gamification?.level ?? 0}
                currentXP={gamification?.currentXP ?? 0}
                dailyTarget={gamification?.dailyTarget ?? 50}
              />
            </motion.div>

            {/* Placement Test Alert */}
            {!loadingPlacement &&
              !placementStatus?.completed &&
              placementTestId && (
                <motion.section
                  {...motionProps}
                  className="flex items-center justify-between p-5 bg-[var(--primary-light)] border-[3px] border-[var(--border)] rounded-[2rem] shadow-[0_4px_0_rgba(0,0,0,0.08)]"
                >
                  <div>
                    <p className="font-bold text-[var(--foreground)]">
                      Take Your Placement Test
                    </p>
                    <p className="text-sm text-[var(--text-muted)]">
                      Let us assess your level to personalize your learning
                      path.
                    </p>
                  </div>
                  <button
                    onClick={handleStartPlacement}
                    className="px-6 py-2.5 bg-[var(--primary)] text-white font-bold rounded-full border-b-[4px] border-[var(--primary-dark)] transition-all duration-150 hover:bg-[var(--primary-hover)] hover:-translate-y-0.5 active:translate-y-[2px] active:border-b-[2px] active:duration-[50ms]"
                  >
                    Start Now
                  </button>
                </motion.section>
              )}

            {/* Placement Complete Badge */}
            {!loadingPlacement && placementStatus?.completed && (
              <motion.section
                {...motionProps}
                className="flex items-center justify-between p-5 bg-[var(--skill-speaking-light)] border-[3px] border-[var(--skill-speaking-border)] rounded-[2rem] shadow-[0_4px_0_rgba(0,0,0,0.08)]"
              >
                <div>
                  <p className="font-bold text-[var(--foreground)]">
                    Placement Complete
                  </p>
                  <p className="text-sm text-[var(--text-muted)]">
                    Level:{" "}
                    <strong>{placementStatus.level || "N/A"}</strong>
                    {placementStatus.band > 0 && (
                      <span className="ml-2">
                        Band{" "}
                        <strong>{placementStatus.band.toFixed(1)}</strong>
                      </span>
                    )}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={handleStartPlacement}
                    className="text-sm text-[var(--text-muted)] hover:text-[var(--foreground)] font-bold transition-colors"
                  >
                    Retake
                  </button>
                  <button
                    onClick={() =>
                      router.push(
                        `/attempts/${placementStatus.attemptId}?source=attempt`
                      )
                    }
                    className="text-sm text-[var(--skill-speaking)] hover:text-[var(--foreground)] font-bold transition-colors"
                  >
                    View Report
                  </button>
                </div>
              </motion.section>
            )}

            {/* Empty state for new users */}
            {isNewUser && (
              <motion.div {...motionProps}>
                <div className="rounded-[2rem] border-[3px] border-[var(--border)] bg-white shadow-[0_4px_0_rgba(0,0,0,0.08)]">
                  <EmptyState
                    title="Welcome to Langfens!"
                    subtitle="Start your IELTS journey by taking your first practice test. We'll track your progress and help you improve."
                    ctaText="Take your first test"
                    ctaHref="/practice"
                  />
                </div>
              </motion.div>
            )}

            {/* Skill Cards Grid */}
            {!isNewUser && (
              <motion.div {...motionProps}>
                {isLoading ? (
                  <div className="grid grid-cols-2 gap-4">
                    <SkeletonCard className="h-40" />
                    <SkeletonCard className="h-40" />
                    <SkeletonCard className="h-40" />
                    <SkeletonCard className="h-40" />
                  </div>
                ) : (
                  <SkillProgressGrid scores={skillScores} />
                )}
              </motion.div>
            )}

            {/* Continue Learning CTA */}
            {!isNewUser && !isLoading && (
              <motion.div {...motionProps}>
                <ContinueLearning
                  weakestSkill={weakestSkill}
                  lastAttemptTitle={
                    attempts[0]?.score === undefined
                      ? attempts[0]?.title
                      : undefined
                  }
                  lastAttemptSkill={
                    attempts[0]?.score === undefined
                      ? attempts[0]?.skill
                      : undefined
                  }
                  lastAttemptHref={
                    attempts[0]?.score === undefined
                      ? buildAttemptUrl(attempts[0])
                      : undefined
                  }
                />
              </motion.div>
            )}

            {/* Stats Summary Row */}
            {analytics && analytics.totalAttempts > 0 && (
              <motion.div {...motionProps}>
                <StatsRow
                  totalAttempts={analytics.totalAttempts}
                  avgScore={analytics.avgScore}
                  totalStudyTimeMin={analytics.totalStudyTimeMin}
                  streak={streak}
                />
              </motion.div>
            )}

            {/* Today Goal */}
            {!isNewUser && gamification && (
              <motion.div {...motionProps}>
                <TodayGoal
                  currentXP={gamification.currentXP}
                  dailyTarget={gamification.dailyTarget}
                />
              </motion.div>
            )}

            {/* Recent Activity */}
            {!isNewUser && !isLoading && (
              <motion.div {...motionProps}>
                <RecentActivityTimeline attempts={recentActivityAttempts} />
              </motion.div>
            )}
          </div>

          {/* =============================================
              SIDEBAR (1 col)
          ============================================= */}
          <div className="space-y-6">
            {/* Streak Calendar */}
            <motion.div {...motionProps}>
              {loadingGamification ? (
                <SkeletonCard className="h-48" />
              ) : (
                <StreakCalendar
                  days={gamification?.activityDays ?? []}
                  streak={streak}
                />
              )}
            </motion.div>

            {/* Leaderboard Mini */}
            <motion.div {...motionProps}>
              {loadingGamification ? (
                <SkeletonCard className="h-44" />
              ) : leaderboardUsers.length > 0 ? (
                <LeaderboardWidget
                  topUsers={leaderboardUsers}
                  currentUserId={userId}
                  currentUserRank={currentUserRank}
                />
              ) : null}
            </motion.div>

            {/* Achievement Teaser */}
            <motion.div {...motionProps}>
              {loadingGamification ? (
                <SkeletonCard className="h-36" />
              ) : achievementsList.length > 0 ? (
                <AchievementsWidget achievements={achievementsList} />
              ) : null}
            </motion.div>
          </div>
        </motion.div>
      </main>
    </div>
  );
}

// ====================================
// HELPER FUNCTIONS
// ====================================
function normalizeAttemptItem(item: any): Attempt {
  return {
    id: item.attemptId ?? item.id ?? "",
    title: item.examTitle ?? item.title ?? "Practice Test",
    skill: item.skill ?? "Reading",
    dateISO: item.finishedAt ?? item.startedAt ?? new Date().toISOString(),
    score: item.score ?? item.correctPercent,
    durationMin: item.durationMin ?? Math.round((item.timeUsedSec ?? 0) / 60),
  };
}

function buildAttemptUrl(a: Attempt) {
  if (a.skill === "Writing") return `/attempts/${a.id}?source=writing`;
  if (a.skill === "Speaking") return `/attempts/${a.id}?source=speaking`;
  return `/attempts/${a.id}?source=attempt`;
}

