"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  getGamificationStats,
  getXpHistory,
  getAchievements,
  getMe,
  getAnalyticsSummary,
  dailyCheckin,
} from "@/utils/api";
import { SkillProgressBar } from "@/components/ui/SkillProgressBar";
import { SkillBadge } from "@/components/ui/SkillBadge";
import { ProgressRing } from "@/components/ui/ProgressRing";

// Types
type Achievement = {
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

type UserStats = {
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

type XpHistoryItem = {
  id: string;
  amount: number;
  source: string;
  createdAt: string;
};

type UserProfile = {
  id: string;
  email: string;
  username?: string;
  displayName?: string;
  createdAt?: string;
};

type AnalyticsSummary = {
  averageBandScore?: number;
  skillScores?: {
    reading?: number;
    listening?: number;
    writing?: number;
    speaking?: number;
  };
};

type TabKey = "overview" | "achievements" | "settings";

export default function ProfilePage() {
  const router = useRouter();
  const [stats, setStats] = useState<UserStats | null>(null);
  const [xpHistory, setXpHistory] = useState<XpHistoryItem[]>([]);
  const [allAchievements, setAllAchievements] = useState<Achievement[]>([]);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [analyticsSummary, setAnalyticsSummary] = useState<AnalyticsSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [checkinLoading, setCheckinLoading] = useState(false);
  const [checkinResult, setCheckinResult] = useState<{
    success: boolean;
    message: string;
    xpEarned?: number;
  } | null>(null);
  const [activeTab, setActiveTab] = useState<TabKey>("overview");

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      const [statsRes, historyRes, achievementsRes, meRes, analyticsRes] = await Promise.all([
        getGamificationStats(),
        getXpHistory(10),
        getAchievements().catch(() => null),
        getMe().catch(() => null),
        getAnalyticsSummary().catch(() => null),
      ]);

      const statsData = (statsRes as any)?.data?.data ?? (statsRes as any)?.data;
      const historyData = (historyRes as any)?.data?.data ?? (historyRes as any)?.data ?? [];
      const achievementsData = (achievementsRes as any)?.data?.data ?? (achievementsRes as any)?.data ?? [];
      const meData = (meRes as any)?.data?.data ?? (meRes as any)?.data;
      const analyticsData = (analyticsRes as any)?.data?.data ?? (analyticsRes as any)?.data;

      setStats(statsData);
      setXpHistory(Array.isArray(historyData) ? historyData : []);
      setAllAchievements(Array.isArray(achievementsData) ? achievementsData : []);
      if (meData) setUserProfile(meData);
      if (analyticsData) setAnalyticsSummary(analyticsData);
    } catch (error) {
      console.error("Failed to load gamification data:", error);
    } finally {
      setLoading(false);
    }
  }

  async function handleCheckin() {
    setCheckinLoading(true);
    setCheckinResult(null);
    try {
      const res = await dailyCheckin();
      const data = (res as any)?.data?.data ?? (res as any)?.data;

      if (data?.success) {
        setCheckinResult({
          success: true,
          message: "Check-in successful!",
          xpEarned: data.xpEarned,
        });
        await loadData();
      } else {
        setCheckinResult({
          success: false,
          message: "You've already checked in today!",
        });
      }
    } catch (error) {
      setCheckinResult({
        success: false,
        message: "Could not check in. Please try again!",
      });
    } finally {
      setCheckinLoading(false);
    }
  }

  const xpProgress = stats
    ? Math.min(100, ((stats.totalXp % stats.xpForNextLevel) / stats.xpForNextLevel) * 100)
    : 0;

  const totalXpTarget = stats
    ? (stats.level * stats.xpForNextLevel) + stats.xpForNextLevel
    : 10000;

  // Rank-based ring color
  const level = stats?.level ?? 1;
  const ringColor =
    level >= 20
      ? "var(--accent-gold)"
      : level >= 10
        ? "var(--skill-listening)"
        : "var(--primary)";

  const displayName = userProfile?.displayName || userProfile?.username || "IELTS Learner";
  const initials = displayName
    .split(" ")
    .map((w) => w.charAt(0))
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const avgBand = analyticsSummary?.averageBandScore ?? 0;

  if (loading) {
    return (
      <div className="min-h-screen w-full bg-[var(--background)]">
        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <SkeletonProfile />
        </main>
      </div>
    );
  }

  const TABS: { key: TabKey; label: string }[] = [
    { key: "overview", label: "Overview" },
    { key: "achievements", label: "Achievements" },
    { key: "settings", label: "Settings" },
  ];

  return (
    <div className="min-h-screen w-full bg-[var(--background)]">
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">

        {/* ============================================ */}
        {/* HERO — Player Card                           */}
        {/* ============================================ */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="rounded-[2rem] border-[3px] border-[var(--border)] shadow-[0_4px_0_rgba(0,0,0,0.08)] bg-white overflow-hidden"
        >
          <div className="relative p-8 sm:p-10 flex flex-col items-center text-center">
            {/* Edit button */}
            <button
              onClick={() => router.push("/settings")}
              className="absolute top-5 right-5 text-[var(--text-muted)] hover:text-[var(--foreground)] px-3 py-1.5 rounded-full border-[2px] border-[var(--border)] hover:border-[var(--primary)] transition-colors font-bold text-sm"
            >
              Edit
            </button>

            {/* Avatar circle with colored ring */}
            <motion.div
              className="relative mb-4 group"
              whileHover={{ scale: 1.04 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              {/* Rotating ring */}
              <motion.div
                className="absolute inset-0 rounded-full"
                style={{
                  width: 104,
                  height: 104,
                  border: `4px solid ${ringColor}`,
                  borderTopColor: "transparent",
                  top: -4,
                  left: -4,
                }}
                animate={{ rotate: 0 }}
                whileHover={{ rotate: 360 }}
                transition={{ duration: 2, ease: "linear" }}
              />
              <div
                className="w-24 h-24 rounded-full flex items-center justify-center overflow-hidden"
                style={{
                  background: "var(--primary-light)",
                  border: `4px solid ${ringColor}`,
                }}
              >
                <span
                  className="text-3xl font-bold"
                  style={{ color: "var(--primary)", fontFamily: "var(--font-sans)" }}
                >
                  {initials}
                </span>
              </div>

              {/* Level badge — 3D pill */}
              <div
                className="absolute -bottom-1 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full border-b-[3px] text-white text-xs font-bold whitespace-nowrap"
                style={{
                  fontFamily: "var(--font-mono)",
                  backgroundColor: "var(--primary)",
                  borderBottomColor: "var(--primary-dark)",
                }}
              >
                Lv. {stats?.level ?? 1}
              </div>
            </motion.div>

            {/* Username */}
            <h1
              className="text-2xl sm:text-3xl font-bold text-[var(--foreground)] mt-3 mb-2"
              style={{ fontFamily: "var(--font-sans)" }}
            >
              {displayName}
            </h1>

            {/* Title badge */}
            <div className="flex items-center justify-center gap-2 mb-5 flex-wrap">
              <span className="text-xs font-bold text-[var(--primary)] bg-[var(--primary-light)] px-3 py-1 rounded-full border-[2px] border-[var(--border)] border-b-[3px]">
                {level >= 20 ? "Advanced" : level >= 10 ? "Intermediate" : "Beginner"}
              </span>
              <span className="text-xs text-[var(--text-muted)] font-bold">
                {userProfile?.createdAt
                  ? `Joined ${new Date(userProfile.createdAt).toLocaleDateString("en-US", { month: "short", year: "numeric" })}`
                  : "IELTS Candidate"}
              </span>
            </div>

            {/* XP bar progress */}
            <div className="w-full max-w-sm">
              <div className="flex justify-between text-xs font-bold text-[var(--text-muted)] mb-1.5">
                <span>XP to next level</span>
                <span style={{ fontFamily: "var(--font-mono)" }}>
                  {stats?.totalXp.toLocaleString() ?? 0} / {totalXpTarget.toLocaleString()}
                </span>
              </div>
              <div className="h-3.5 bg-[var(--primary-light)] rounded-full overflow-hidden border-[2px] border-[var(--border)]">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${xpProgress}%` }}
                  transition={{ duration: 0.8, ease: "easeOut", delay: 0.3 }}
                  className="h-full rounded-full"
                  style={{ backgroundColor: "var(--primary)" }}
                />
              </div>
            </div>

            {/* Daily check-in */}
            <div className="mt-5 flex items-center gap-3 flex-wrap justify-center">
              <button
                onClick={handleCheckin}
                disabled={checkinLoading}
                className="rounded-full bg-[var(--primary)] text-white font-bold border-b-[4px] border-[var(--primary-dark)] hover:-translate-y-0.5 hover:border-b-[5px] active:translate-y-[2px] active:border-b-[2px] px-6 py-2.5 text-sm transition-all disabled:opacity-50"
              >
                {checkinLoading ? "Checking in..." : "Daily check-in"}
              </button>
              <AnimatePresence>
                {checkinResult && (
                  <motion.span
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0 }}
                    className={`text-xs font-bold px-3 py-1.5 rounded-full border-[2px] ${
                      checkinResult.success
                        ? "bg-[var(--skill-speaking-light)] text-[var(--skill-speaking)] border-[var(--skill-speaking-border)]"
                        : "bg-[var(--skill-writing-light)] text-[var(--skill-writing)] border-[var(--skill-writing-border)]"
                    }`}
                  >
                    {checkinResult.message}
                    {checkinResult.xpEarned && (
                      <span className="ml-1" style={{ fontFamily: "var(--font-mono)" }}>
                        +{checkinResult.xpEarned} XP
                      </span>
                    )}
                  </motion.span>
                )}
              </AnimatePresence>
            </div>
          </div>
        </motion.div>

        {/* ============================================ */}
        {/* STATS ROW — 4 inline stat cards              */}
        {/* ============================================ */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.5, ease: "easeOut" }}
          className="grid grid-cols-2 sm:grid-cols-4 gap-4"
        >
          {[
            { label: "Total XP", value: stats?.totalXp.toLocaleString() ?? "0" },
            { label: "Streak days", value: String(stats?.currentStreak ?? 0) },
            { label: "Tests taken", value: String(stats?.totalTestsCompleted ?? 0) },
            { label: "Avg band", value: avgBand ? avgBand.toFixed(1) : "--" },
          ].map((stat, idx) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 + idx * 0.06, duration: 0.4, ease: "easeOut" }}
              className="rounded-[2rem] border-[3px] border-[var(--border)] shadow-[0_4px_0_rgba(0,0,0,0.08)] bg-white p-5 text-center"
            >
              <div
                className="text-2xl font-bold text-[var(--foreground)] mb-1"
                style={{ fontFamily: "var(--font-mono)" }}
              >
                {stat.value}
              </div>
              <div className="text-xs font-bold text-[var(--text-muted)]">
                {stat.label}
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* ============================================ */}
        {/* TABS                                         */}
        {/* ============================================ */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5, ease: "easeOut" }}
        >
          {/* Tab bar */}
          <div className="flex gap-2 mb-6">
            {TABS.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`px-5 py-2 rounded-full font-bold text-sm transition-all border-b-[3px] ${
                  activeTab === tab.key
                    ? "bg-[var(--primary)] text-white border-[var(--primary-dark)]"
                    : "bg-white text-[var(--text-muted)] border-[var(--border)] hover:text-[var(--foreground)] hover:border-[var(--primary-light)]"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab content */}
          <AnimatePresence mode="wait">
            {activeTab === "overview" && (
              <motion.div
                key="overview"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.3 }}
                className="space-y-6"
              >
                {/* Skill Progress Bars */}
                <div className="rounded-[2rem] border-[3px] border-[var(--border)] shadow-[0_4px_0_rgba(0,0,0,0.08)] bg-white p-6 sm:p-8">
                  <h3
                    className="font-bold text-lg text-[var(--foreground)] mb-5"
                    style={{ fontFamily: "var(--font-sans)" }}
                  >
                    Skill breakdown
                  </h3>
                  <div className="space-y-4">
                    {(["Reading", "Listening", "Writing", "Speaking"] as const).map(
                      (skill, idx) => (
                        <SkillProgressBar
                          key={skill}
                          skill={skill}
                          score={
                            analyticsSummary?.skillScores?.[
                              skill.toLowerCase() as keyof NonNullable<AnalyticsSummary["skillScores"]>
                            ] ?? 0
                          }
                          delay={0.1 * idx}
                        />
                      )
                    )}
                  </div>
                  <div className="flex gap-2 mt-5 flex-wrap">
                    {(["Reading", "Listening", "Writing", "Speaking"] as const).map((s) => (
                      <SkillBadge key={s} skill={s} size="sm" />
                    ))}
                  </div>
                </div>

                {/* Recent Activity Timeline */}
                <div className="rounded-[2rem] border-[3px] border-[var(--border)] shadow-[0_4px_0_rgba(0,0,0,0.08)] bg-white p-6 sm:p-8">
                  <h3
                    className="font-bold text-lg text-[var(--foreground)] mb-5"
                    style={{ fontFamily: "var(--font-sans)" }}
                  >
                    Recent activity
                  </h3>

                  {xpHistory.length > 0 ? (
                    <div className="relative pl-8 border-l-[3px] border-[var(--border)] ml-1 space-y-0">
                      {xpHistory.slice(0, 8).map((item, idx) => (
                        <div key={item.id} className="relative">
                          {/* Timeline Dot */}
                          <div className="absolute -left-[calc(2rem+6px)] top-4 w-3 h-3 rounded-full bg-[var(--primary)] ring-4 ring-white" />
                          {/* Content */}
                          <div
                            className={`py-4 ${
                              idx < Math.min(xpHistory.length, 8) - 1
                                ? "border-b-[2px] border-[var(--border)]"
                                : ""
                            }`}
                          >
                            <div className="flex items-start justify-between gap-4">
                              <div>
                                <p className="text-sm font-bold text-[var(--text-body)]">
                                  {formatXpSource(item.source)}
                                </p>
                                <p
                                  className="text-xs text-[var(--text-muted)] mt-1"
                                  style={{ fontFamily: "var(--font-mono)" }}
                                >
                                  {formatDate(item.createdAt)}
                                </p>
                              </div>
                              <span
                                className="text-xs font-bold text-[var(--skill-speaking)] bg-[var(--skill-speaking-light)] px-2.5 py-1 rounded-full border-[2px] border-[var(--skill-speaking-border)] shrink-0"
                                style={{ fontFamily: "var(--font-mono)" }}
                              >
                                +{item.amount} XP
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-[var(--text-muted)]">
                      <p className="text-sm font-bold">No activity yet. Start learning!</p>
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {activeTab === "achievements" && (
              <motion.div
                key="achievements"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.3 }}
              >
                <div className="rounded-[2rem] border-[3px] border-[var(--border)] shadow-[0_4px_0_rgba(0,0,0,0.08)] bg-white p-6 sm:p-8">
                  <div className="flex items-center justify-between mb-6">
                    <h3
                      className="font-bold text-lg text-[var(--foreground)]"
                      style={{ fontFamily: "var(--font-sans)" }}
                    >
                      Achievements
                    </h3>
                    <button
                      onClick={() => router.push("/achievements")}
                      className="text-xs text-[var(--primary)] hover:text-[var(--primary-hover)] font-bold"
                    >
                      View all
                    </button>
                  </div>

                  {allAchievements.length > 0 ? (
                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-4">
                      {allAchievements.map((achievement) => (
                        <motion.div
                          key={achievement.id}
                          whileHover={{ y: -3 }}
                          className="flex flex-col items-center gap-2"
                        >
                          <div
                            className={`w-14 h-14 rounded-full flex items-center justify-center border-[2px] border-b-[3px] ${
                              achievement.isUnlocked
                                ? "bg-[var(--accent-gold-bg)] border-[var(--accent-gold-border)]"
                                : "bg-[var(--background)] border-[var(--border)] opacity-50"
                            }`}
                          >
                            <span
                              className={`text-lg font-bold ${
                                achievement.isUnlocked
                                  ? "text-[var(--accent-gold)]"
                                  : "text-[var(--text-muted)]"
                              }`}
                            >
                              {achievement.isUnlocked ? "A" : "?"}
                            </span>
                          </div>
                          <span className="text-[10px] font-bold text-[var(--text-muted)] text-center leading-tight max-w-[72px] truncate">
                            {achievement.title}
                          </span>
                        </motion.div>
                      ))}
                    </div>
                  ) : stats?.recentAchievements && stats.recentAchievements.length > 0 ? (
                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-4">
                      {stats.recentAchievements.map((achievement) => (
                        <motion.div
                          key={achievement.id}
                          whileHover={{ y: -3 }}
                          className="flex flex-col items-center gap-2"
                        >
                          <div className="w-14 h-14 rounded-full flex items-center justify-center border-[2px] border-b-[3px] bg-[var(--accent-gold-bg)] border-[var(--accent-gold-border)]">
                            <span className="text-lg font-bold text-[var(--accent-gold)]">A</span>
                          </div>
                          <span className="text-[10px] font-bold text-[var(--text-muted)] text-center leading-tight max-w-[72px] truncate">
                            {achievement.title}
                          </span>
                        </motion.div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-10 text-[var(--text-muted)]">
                      <p className="text-sm font-bold">No achievements unlocked yet.</p>
                      <p className="text-xs mt-1">Keep practicing to earn badges!</p>
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {activeTab === "settings" && (
              <motion.div
                key="settings"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.3 }}
              >
                <div className="rounded-[2rem] border-[3px] border-[var(--border)] shadow-[0_4px_0_rgba(0,0,0,0.08)] bg-white p-6 sm:p-8">
                  <h3
                    className="font-bold text-lg text-[var(--foreground)] mb-6"
                    style={{ fontFamily: "var(--font-sans)" }}
                  >
                    Settings
                  </h3>
                  <div className="space-y-5 max-w-md">
                    {/* Display name */}
                    <div>
                      <label className="block text-sm font-bold text-[var(--text-body)] mb-1.5">
                        Display name
                      </label>
                      <input
                        type="text"
                        defaultValue={displayName}
                        className="w-full rounded-[1rem] border-[3px] border-[var(--border)] shadow-[0_3px_0_rgba(0,0,0,0.06)] bg-white px-4 py-2.5 text-sm font-semibold text-[var(--foreground)] focus:outline-none focus:border-[var(--primary)] transition-colors"
                        style={{ fontFamily: "var(--font-sans)" }}
                      />
                    </div>
                    {/* Email */}
                    <div>
                      <label className="block text-sm font-bold text-[var(--text-body)] mb-1.5">
                        Email
                      </label>
                      <input
                        type="email"
                        defaultValue={userProfile?.email ?? ""}
                        disabled
                        className="w-full rounded-[1rem] border-[3px] border-[var(--border)] shadow-[0_3px_0_rgba(0,0,0,0.06)] bg-[var(--background)] px-4 py-2.5 text-sm font-semibold text-[var(--text-muted)] focus:outline-none cursor-not-allowed"
                        style={{ fontFamily: "var(--font-sans)" }}
                      />
                    </div>
                    {/* Target band */}
                    <div>
                      <label className="block text-sm font-bold text-[var(--text-body)] mb-1.5">
                        Target band score
                      </label>
                      <select
                        defaultValue="7.0"
                        className="w-full rounded-[1rem] border-[3px] border-[var(--border)] shadow-[0_3px_0_rgba(0,0,0,0.06)] bg-white px-4 py-2.5 text-sm font-semibold text-[var(--foreground)] focus:outline-none focus:border-[var(--primary)] transition-colors appearance-none"
                        style={{ fontFamily: "var(--font-sans)" }}
                      >
                        {["5.0", "5.5", "6.0", "6.5", "7.0", "7.5", "8.0", "8.5", "9.0"].map(
                          (v) => (
                            <option key={v} value={v}>
                              {v}
                            </option>
                          )
                        )}
                      </select>
                    </div>

                    <button
                      className="rounded-full bg-[var(--primary)] text-white font-bold border-b-[4px] border-[var(--primary-dark)] hover:-translate-y-0.5 hover:border-b-[5px] active:translate-y-[2px] active:border-b-[2px] px-6 py-2.5 text-sm transition-all"
                    >
                      Save changes
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Quick links below tabs */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35, duration: 0.4, ease: "easeOut" }}
            className="mt-6 rounded-[2rem] border-[3px] border-[var(--border)] shadow-[0_4px_0_rgba(0,0,0,0.08)] bg-white divide-y-[2px] divide-[var(--border)] overflow-hidden"
          >
            <button
              onClick={() => router.push("/leaderboard")}
              className="w-full flex items-center gap-3 p-4 hover:bg-[var(--primary-light)] transition-colors text-left"
            >
              <span className="flex-1 text-sm font-bold text-[var(--text-body)]">
                Leaderboard
              </span>
              <span className="text-[var(--text-muted)] font-bold text-xs">{">"}</span>
            </button>
            <button
              onClick={() => router.push("/analytics")}
              className="w-full flex items-center gap-3 p-4 hover:bg-[var(--primary-light)] transition-colors text-left"
            >
              <span className="flex-1 text-sm font-bold text-[var(--text-body)]">
                Analytics
              </span>
              <span className="text-[var(--text-muted)] font-bold text-xs">{">"}</span>
            </button>
          </motion.div>
        </motion.div>
      </main>
    </div>
  );
}

// ====================================
// SKELETON LOADER
// ====================================
function SkeletonProfile() {
  return (
    <div className="space-y-8 animate-pulse">
      {/* Hero skeleton */}
      <div className="rounded-[2rem] border-[3px] border-[var(--border)] shadow-[0_4px_0_rgba(0,0,0,0.08)] bg-white p-10 flex flex-col items-center">
        <div className="w-24 h-24 rounded-full bg-[var(--primary-light)] mb-4" />
        <div className="h-7 w-48 bg-[var(--border)] rounded-full mb-3" />
        <div className="h-4 w-32 bg-[var(--background)] rounded-full mb-4" />
        <div className="h-3.5 w-full max-w-sm bg-[var(--background)] rounded-full" />
      </div>

      {/* Stats row skeleton */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="rounded-[2rem] border-[3px] border-[var(--border)] shadow-[0_4px_0_rgba(0,0,0,0.08)] bg-white p-5 text-center space-y-2"
          >
            <div className="h-8 w-16 bg-[var(--border)] rounded-full mx-auto" />
            <div className="h-3 w-20 bg-[var(--background)] rounded-full mx-auto" />
          </div>
        ))}
      </div>

      {/* Tab area skeleton */}
      <div className="space-y-4">
        <div className="flex gap-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-9 w-24 bg-[var(--border)] rounded-full" />
          ))}
        </div>
        <div className="rounded-[2rem] border-[3px] border-[var(--border)] shadow-[0_4px_0_rgba(0,0,0,0.08)] bg-white p-8">
          <div className="h-6 w-40 bg-[var(--border)] rounded-full mb-6" />
          <div className="space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-5 bg-[var(--background)] rounded-full" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ====================================
// UTILITY FUNCTIONS
// ====================================
function formatXpSource(source: string): string {
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

function formatDate(iso: string): string {
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
