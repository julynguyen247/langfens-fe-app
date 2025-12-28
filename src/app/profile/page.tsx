"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  getGamificationStats,
  getXpHistory,
  dailyCheckin,
} from "@/utils/api";
import PenguinLottie from "@/components/PenguinLottie";

// Material Icon Component
function Icon({ name, className = "" }: { name: string; className?: string }) {
  return <span className={`material-symbols-rounded ${className}`}>{name}</span>;
}

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

export default function ProfilePage() {
  const router = useRouter();
  const [stats, setStats] = useState<UserStats | null>(null);
  const [xpHistory, setXpHistory] = useState<XpHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [checkinLoading, setCheckinLoading] = useState(false);
  const [checkinResult, setCheckinResult] = useState<{
    success: boolean;
    message: string;
    xpEarned?: number;
  } | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      const [statsRes, historyRes] = await Promise.all([
        getGamificationStats(),
        getXpHistory(10),
      ]);

      const statsData = (statsRes as any)?.data?.data ?? (statsRes as any)?.data;
      const historyData = (historyRes as any)?.data?.data ?? (historyRes as any)?.data ?? [];

      setStats(statsData);
      setXpHistory(Array.isArray(historyData) ? historyData : []);
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

  if (loading) {
    return (
      <div className="min-h-screen w-full bg-[#F8FAFC]">
        <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <SkeletonProfile />
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-[#F8FAFC]">
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* =============================================
            PAGE HEADER
        ============================================= */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between"
        >
          <div>
            <h1 className="font-serif text-3xl font-bold text-slate-900">My Profile</h1>
            <p className="text-slate-500 mt-1">Track your progress and achievements</p>
          </div>
          <button
            onClick={() => router.push("/settings")}
            className="p-2.5 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors shadow-sm"
          >
            <Icon name="settings" className="text-xl text-slate-600" />
          </button>
        </motion.div>

        {/* =============================================
            STAT CARDS
        ============================================= */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-4"
        >
          <StatCard
            icon="bolt"
            label="Total XP"
            value={stats?.totalXp.toLocaleString() ?? "0"}
            color="blue"
          />
          <StatCard
            icon="trending_up"
            label="Level"
            value={stats?.level ?? 1}
            color="purple"
          />
          <StatCard
            icon="local_fire_department"
            label="Streak"
            value={`${stats?.currentStreak ?? 0} days`}
            color="orange"
          />
          <StatCard
            icon="assignment_turned_in"
            label="Tests Done"
            value={stats?.totalTestsCompleted ?? 0}
            color="green"
          />
        </motion.div>

        {/* =============================================
            XP PROGRESS BAR
        ============================================= */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-[#EFF6FF] flex items-center justify-center">
                <Icon name="star" className="text-xl text-[#3B82F6]" />
              </div>
              <div>
                <h2 className="font-serif text-lg font-semibold text-slate-900">XP Progress</h2>
                <p className="text-sm text-slate-500">
                  Level {stats?.level} → Level {(stats?.level ?? 0) + 1}
                </p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-[#3B82F6]">
                {stats?.totalXp.toLocaleString() ?? 0}
              </div>
              <div className="text-xs text-slate-500">
                / {((stats?.level ?? 0) * (stats?.xpForNextLevel ?? 100) + (stats?.xpForNextLevel ?? 100)).toLocaleString()} XP
              </div>
            </div>
          </div>

          <div className="relative h-3 bg-slate-100 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${xpProgress}%` }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="absolute inset-y-0 left-0 bg-gradient-to-r from-[#3B82F6] to-[#60A5FA] rounded-full"
            />
          </div>
          <p className="mt-2 text-sm text-slate-500">
            {stats?.xpForNextLevel ? stats.xpForNextLevel - (stats.totalXp % stats.xpForNextLevel) : 0} XP to next level
          </p>
        </motion.div>

        {/* =============================================
            DAILY CHECK-IN
        ============================================= */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="bg-white rounded-xl border border-blue-100 p-6 shadow-sm"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-[#EFF6FF] flex items-center justify-center">
                <Icon name="calendar_today" className="text-2xl text-[#3B82F6]" />
              </div>
              <div>
                <h2 className="font-serif text-lg font-semibold text-slate-900">Daily Check-in</h2>
                <p className="text-sm text-slate-500">
                  Earn 10 XP every day you check in!
                </p>
              </div>
            </div>
            <button
              onClick={handleCheckin}
              disabled={checkinLoading}
              className="px-6 py-2.5 bg-[#3B82F6] hover:bg-[#2563EB] text-white font-medium rounded-lg shadow-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <Icon name="check_circle" className="text-xl" />
              {checkinLoading ? "Checking in..." : "Check In"}
            </button>
          </div>

          <AnimatePresence>
            {checkinResult && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className={`mt-4 p-3 rounded-lg flex items-center gap-2 ${
                  checkinResult.success
                    ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                    : "bg-amber-50 text-amber-700 border border-amber-200"
                }`}
              >
                <Icon name={checkinResult.success ? "check_circle" : "info"} className="text-lg" />
                {checkinResult.message}
                {checkinResult.xpEarned && (
                  <span className="ml-2 font-bold">+{checkinResult.xpEarned} XP</span>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* =============================================
            QUICK LINKS
        ============================================= */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <QuickLink
            title="Achievements"
            description={`${stats?.recentAchievements?.length ?? 0} achievements unlocked`}
            icon="emoji_events"
            onClick={() => router.push("/achievements")}
            delay={0.2}
          />
          <QuickLink
            title="Leaderboard"
            description="See your ranking"
            icon="leaderboard"
            onClick={() => router.push("/leaderboard")}
            delay={0.25}
          />
        </div>

        {/* =============================================
            RECENT ACHIEVEMENTS
        ============================================= */}
        {stats?.recentAchievements && stats.recentAchievements.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center">
                  <Icon name="emoji_events" className="text-xl text-amber-600" />
                </div>
                <h2 className="font-serif text-lg font-semibold text-slate-900">Recent Achievements</h2>
              </div>
              <button
                onClick={() => router.push("/achievements")}
                className="text-sm text-[#3B82F6] hover:text-[#2563EB] font-medium flex items-center gap-1"
              >
                View all <Icon name="arrow_forward" className="text-lg" />
              </button>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              {stats.recentAchievements.slice(0, 5).map((achievement) => (
                <div
                  key={achievement.id}
                  className="flex flex-col items-center p-4 bg-gradient-to-b from-amber-50 to-orange-50 rounded-xl border border-amber-100 hover:shadow-md transition-shadow"
                >
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white text-xl shadow-sm">
                    🏆
                  </div>
                  <span className="mt-2 text-xs font-medium text-slate-700 text-center line-clamp-2">
                    {achievement.title}
                  </span>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* =============================================
            XP HISTORY
        ============================================= */}
        {xpHistory.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
            className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center">
                <Icon name="history" className="text-xl text-emerald-600" />
              </div>
              <h2 className="font-serif text-lg font-semibold text-slate-900">XP History</h2>
            </div>
            <div className="space-y-3">
              {xpHistory.slice(0, 5).map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between py-3 px-4 bg-[#F8FAFC] rounded-lg border border-slate-100"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center">
                      <Icon name={getXpSourceIcon(item.source)} className="text-lg text-emerald-600" />
                    </div>
                    <div>
                      <div className="text-sm font-medium text-slate-700">
                        {formatXpSource(item.source)}
                      </div>
                      <div className="text-xs text-slate-400">
                        {formatDate(item.createdAt)}
                      </div>
                    </div>
                  </div>
                  <span className="text-sm font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg">
                    +{item.amount} XP
                  </span>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* =============================================
            EMPTY STATE
        ============================================= */}
        {!stats && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-white rounded-xl border border-slate-200 p-12 shadow-sm"
          >
            <div className="flex flex-col items-center text-center">
              <div className="w-32 h-32 mb-6">
                <PenguinLottie />
              </div>
              <h3 className="font-serif text-xl font-semibold text-slate-900 mb-2">
                Start Your Journey
              </h3>
              <p className="text-slate-500 mb-6">
                Complete practices to earn XP and unlock achievements
              </p>
              <button
                onClick={() => router.push("/practice")}
                className="px-6 py-3 bg-[#3B82F6] hover:bg-[#2563EB] text-white font-medium rounded-lg shadow-sm transition-colors flex items-center gap-2"
              >
                <Icon name="play_arrow" className="text-xl" />
                Start Practicing
              </button>
            </div>
          </motion.div>
        )}
      </main>
    </div>
  );
}

// ====================================
// STAT CARD COMPONENT
// ====================================
function StatCard({
  icon,
  label,
  value,
  color,
}: {
  icon: string;
  label: string;
  value: string | number;
  color: "blue" | "purple" | "orange" | "green";
}) {
  const colorClasses = {
    blue: "bg-[#EFF6FF] text-[#2563EB] border-blue-100",
    purple: "bg-purple-50 text-purple-600 border-purple-100",
    orange: "bg-orange-50 text-orange-600 border-orange-100",
    green: "bg-emerald-50 text-emerald-600 border-emerald-100",
  };

  return (
    <div className={`p-5 rounded-xl border ${colorClasses[color]} transition-all hover:shadow-md`}>
      <div className="flex items-center gap-2 mb-2">
        <Icon name={icon} className="text-xl" />
        <span className="text-xs font-medium opacity-80">{label}</span>
      </div>
      <div className="text-2xl font-bold">{value}</div>
    </div>
  );
}

// ====================================
// QUICK LINK COMPONENT
// ====================================
function QuickLink({
  title,
  description,
  icon,
  onClick,
  delay,
}: {
  title: string;
  description: string;
  icon: string;
  onClick: () => void;
  delay: number;
}) {
  return (
    <motion.button
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      onClick={onClick}
      className="flex items-center gap-4 p-5 bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md hover:border-[#3B82F6] transition-all text-left w-full group"
    >
      <div className="w-12 h-12 rounded-xl bg-[#EFF6FF] flex items-center justify-center">
        <Icon name={icon} className="text-2xl text-[#3B82F6]" />
      </div>
      <div className="flex-1">
        <div className="font-semibold text-slate-900">{title}</div>
        <div className="text-sm text-slate-500">{description}</div>
      </div>
      <Icon name="chevron_right" className="text-2xl text-slate-400 group-hover:text-[#3B82F6] transition-colors" />
    </motion.button>
  );
}

// ====================================
// SKELETON LOADER
// ====================================
function SkeletonProfile() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="flex justify-between items-center">
        <div className="space-y-2">
          <div className="h-8 w-48 bg-slate-200 rounded" />
          <div className="h-4 w-64 bg-slate-100 rounded" />
        </div>
        <div className="h-10 w-10 bg-slate-200 rounded-lg" />
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-24 bg-slate-200 rounded-xl" />
        ))}
      </div>
      <div className="h-32 bg-slate-200 rounded-xl" />
      <div className="h-24 bg-slate-200 rounded-xl" />
      <div className="grid grid-cols-2 gap-4">
        <div className="h-20 bg-slate-200 rounded-xl" />
        <div className="h-20 bg-slate-200 rounded-xl" />
      </div>
    </div>
  );
}

// ====================================
// UTILITY FUNCTIONS
// ====================================
function getXpSourceIcon(source: string): string {
  const icons: Record<string, string> = {
    DailyLogin: "login",
    DAILY_LOGIN: "login",
    DAILY_CHECKIN: "calendar_today",
    TestCompleted: "assignment_turned_in",
    TEST_COMPLETED: "assignment_turned_in",
    CardReviewed: "style",
    CARD_REVIEWED: "style",
    LessonCompleted: "school",
    LESSON_COMPLETED: "school",
    AchievementUnlocked: "emoji_events",
    ACHIEVEMENT_UNLOCKED: "emoji_events",
    StreakBonus: "local_fire_department",
    STREAK_BONUS: "local_fire_department",
  };
  return icons[source] || "bolt";
}

function formatXpSource(source: string): string {
  const sourceMap: Record<string, string> = {
    DailyLogin: "Daily Login",
    TestCompleted: "Test Completed",
    CardReviewed: "Card Reviewed",
    LessonCompleted: "Lesson Completed",
    AchievementUnlocked: "Achievement Unlocked",
    StreakBonus: "Streak Bonus",
    DAILY_LOGIN: "Daily Login",
    TEST_COMPLETED: "Test Completed",
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
      hour: "2-digit",
      minute: "2-digit",
      day: "2-digit",
      month: "short",
    });
  } catch {
    return iso;
  }
}
