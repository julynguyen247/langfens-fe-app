"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  getGamificationStats,
  getXpHistory,
  dailyCheckin,
} from "@/utils/api";

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

  const totalXpTarget = stats
    ? (stats.level * stats.xpForNextLevel) + stats.xpForNextLevel
    : 10000;

  if (loading) {
    return (
      <div className="min-h-screen w-full bg-[#F8FAFC]">
        <main className="max-w-4xl mx-auto px-4 py-10">
          <SkeletonProfile />
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-[#F8FAFC]">
      <main className="max-w-4xl mx-auto px-4 py-10">
        
        {/* =============================================
            1. HERO & STATS COMBINED (The Portfolio Header)
        ============================================= */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white border border-slate-200 rounded-[2rem] shadow-sm overflow-hidden mb-8"
        >
          {/* Upper Part: Identity */}
          <div className="relative p-10 flex flex-col md:flex-row items-center gap-8 border-b border-slate-100">
            {/* Absolute Edit Button (Ghost Style) */}
            <button
              onClick={() => router.push("/settings")}
              className="absolute top-6 right-6 text-slate-400 hover:text-slate-700 p-2 rounded-full hover:bg-slate-100 transition-colors"
              title="Edit Profile"
            >
              <Icon name="edit" className="text-xl" />
            </button>

            {/* Avatar with Level Badge */}
            <div className="relative shrink-0">
              <div className="w-28 h-28 rounded-full bg-slate-200 overflow-hidden border-4 border-white shadow-md flex items-center justify-center">
                <Icon name="person" className="text-5xl text-slate-400" />
              </div>
              <div className="absolute bottom-0 right-0 bg-blue-600 text-white text-[10px] font-bold px-2 py-1 rounded-full border-2 border-white">
                LVL {stats?.level ?? 1}
              </div>
            </div>
            
            {/* Info Column */}
            <div className="text-center md:text-left flex-1">
              <h1 className="font-serif text-3xl font-bold text-slate-900 mb-2">IELTS Learner</h1>
              <div className="flex items-center justify-center md:justify-start gap-3 mb-4 flex-wrap">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider bg-slate-50 px-3 py-1 rounded-full border border-slate-100">
                  IELTS Candidate
                </span>
                <span className="text-xs text-slate-400 flex items-center gap-1">
                  <Icon name="calendar_month" className="text-sm" /> Joined Dec 2025
                </span>
              </div>
              
              {/* XP Progress Bar */}
              <div className="w-full max-w-md">
                <div className="flex justify-between text-xs font-bold text-slate-500 mb-1">
                  <span>XP Progress</span>
                  <span>{stats?.totalXp.toLocaleString() ?? 0} / {totalXpTarget.toLocaleString()}</span>
                </div>
                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${xpProgress}%` }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                    className="h-full bg-[#3B82F6]"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Lower Part: Key Metrics (Clean Grid) */}
          <div className="grid grid-cols-3 divide-x divide-slate-200 border-t border-slate-200 py-6 bg-[#F8FAFC]">
            <div className="text-center px-4">
              <div className="text-2xl font-bold text-slate-800">{stats?.currentStreak ?? 0}</div>
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1 flex items-center justify-center gap-1">
                <Icon name="local_fire_department" className="text-sm text-orange-500" /> Day Streak
              </div>
            </div>
            <div className="text-center px-4">
              <div className="text-2xl font-bold text-slate-800">{stats?.totalTestsCompleted ?? 0}</div>
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Tests Taken</div>
            </div>
            <div className="text-center px-4">
              <div className="text-2xl font-bold text-slate-800">{stats?.totalXp.toLocaleString() ?? 0}</div>
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Total XP</div>
            </div>
          </div>
        </motion.div>

        {/* =============================================
            2. SECONDARY GRID
        ============================================= */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          
          {/* Activity Feed */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="md:col-span-2 bg-white border border-slate-200 rounded-2xl p-8"
          >
            <h3 className="font-serif font-bold text-lg text-slate-900 mb-6">Recent Activity</h3>
            
            {xpHistory.length > 0 ? (
              <div className="relative pl-8 border-l-2 border-slate-200 ml-1 space-y-0">
                {xpHistory.slice(0, 8).map((item, idx) => (
                  <div key={item.id} className="relative">
                    {/* Timeline Dot */}
                    <div className="absolute -left-[calc(2rem+5px)] top-4 w-2.5 h-2.5 rounded-full bg-blue-500 ring-4 ring-white" />
                    {/* Content */}
                    <div className={`py-4 ${idx < Math.min(xpHistory.length, 8) - 1 ? 'border-b border-slate-50' : ''}`}>
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="text-sm font-bold text-slate-700">{formatXpSource(item.source)}</p>
                          <p className="text-xs text-slate-400 mt-1 font-mono">{formatDate(item.createdAt)}</p>
                        </div>
                        <span className="text-xs font-bold text-green-600 bg-green-50 px-2 py-1 rounded shrink-0">
                          +{item.amount} XP
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-slate-400">
                <Icon name="history" className="text-4xl mb-2" />
                <p className="text-sm">No activity yet. Start learning!</p>
              </div>
            )}
          </motion.div>

          {/* Achievements / Side Widgets */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="space-y-6"
          >
            {/* Achievements Widget */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-serif font-bold text-lg text-slate-900">Achievements</h3>
                <button
                  onClick={() => router.push("/achievements")}
                  className="text-xs text-[#3B82F6] hover:text-[#2563EB] font-medium"
                >
                  View all
                </button>
              </div>
              <div className="grid grid-cols-4 gap-2">
                {stats?.recentAchievements && stats.recentAchievements.length > 0 ? (
                  stats.recentAchievements.slice(0, 4).map((achievement) => (
                    <div
                      key={achievement.id}
                      className="aspect-square bg-amber-50 rounded-full flex items-center justify-center border border-amber-200"
                      title={achievement.title}
                    >
                      <Icon name="emoji_events" className="text-amber-500" />
                    </div>
                  ))
                ) : (
                  <>
                    {[1, 2, 3, 4].map((i) => (
                      <div key={i} className="aspect-square bg-slate-100 rounded-full flex items-center justify-center text-slate-300">
                        <Icon name="emoji_events" />
                      </div>
                    ))}
                  </>
                )}
              </div>
            </div>
            
            {/* Daily Check-in */}
            <button
              onClick={handleCheckin}
              disabled={checkinLoading}
              className="w-full bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 font-bold py-4 rounded-xl flex items-center justify-center gap-2 transition-all disabled:opacity-50"
            >
              <Icon name="check_circle" className="text-xl" />
              {checkinLoading ? "Checking in..." : "Check In Today"}
            </button>

            {/* Check-in Result */}
            <AnimatePresence>
              {checkinResult && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className={`p-3 rounded-xl flex items-center gap-2 text-sm ${
                    checkinResult.success
                      ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                      : "bg-amber-50 text-amber-700 border border-amber-200"
                  }`}
                >
                  <Icon name={checkinResult.success ? "check_circle" : "info"} />
                  {checkinResult.message}
                  {checkinResult.xpEarned && (
                    <span className="ml-1 font-bold">+{checkinResult.xpEarned} XP</span>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Quick Links */}
            <div className="bg-white border border-slate-200 rounded-2xl divide-y divide-slate-100 overflow-hidden">
              <button
                onClick={() => router.push("/leaderboard")}
                className="w-full flex items-center gap-3 p-4 hover:bg-slate-50 transition-colors text-left"
              >
                <Icon name="leaderboard" className="text-slate-400" />
                <span className="flex-1 text-sm font-medium text-slate-700">Leaderboard</span>
                <Icon name="chevron_right" className="text-slate-300" />
              </button>
              <button
                onClick={() => router.push("/analytics")}
                className="w-full flex items-center gap-3 p-4 hover:bg-slate-50 transition-colors text-left"
              >
                <Icon name="insights" className="text-slate-400" />
                <span className="flex-1 text-sm font-medium text-slate-700">Analytics</span>
                <Icon name="chevron_right" className="text-slate-300" />
              </button>
            </div>
          </motion.div>
        </div>

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
      <div className="bg-white border border-slate-200 rounded-[2rem] overflow-hidden">
        <div className="p-10 flex flex-col md:flex-row items-center gap-8 border-b border-slate-100">
          <div className="w-28 h-28 rounded-full bg-slate-200" />
          <div className="flex-1 space-y-3">
            <div className="h-8 w-48 bg-slate-200 rounded" />
            <div className="h-4 w-64 bg-slate-100 rounded" />
            <div className="h-2 w-full max-w-md bg-slate-100 rounded-full" />
          </div>
          <div className="h-12 w-32 bg-slate-200 rounded-xl" />
        </div>
        <div className="grid grid-cols-3 divide-x divide-slate-100 py-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="text-center px-4 space-y-2">
              <div className="h-8 w-16 bg-slate-200 rounded mx-auto" />
              <div className="h-3 w-20 bg-slate-100 rounded mx-auto" />
            </div>
          ))}
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-2 bg-white border border-slate-200 rounded-2xl p-8">
          <div className="h-6 w-40 bg-slate-200 rounded mb-6" />
          <div className="space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-12 bg-slate-100 rounded" />
            ))}
          </div>
        </div>
        <div className="space-y-6">
          <div className="bg-white border border-slate-200 rounded-2xl p-6">
            <div className="h-5 w-32 bg-slate-200 rounded mb-4" />
            <div className="grid grid-cols-4 gap-2">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="aspect-square bg-slate-100 rounded-full" />
              ))}
            </div>
          </div>
          <div className="h-14 bg-slate-200 rounded-xl" />
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
