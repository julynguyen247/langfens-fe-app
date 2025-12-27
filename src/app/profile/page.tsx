"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  getGamificationStats,
  getXpHistory,
  dailyCheckin,
} from "@/utils/api";
import { FiAward, FiTrendingUp, FiZap, FiCalendar, FiChevronRight } from "react-icons/fi";
import { HiOutlineFire } from "react-icons/hi";

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
          message: "Điểm danh thành công!",
          xpEarned: data.xpEarned,
        });
        // Reload stats
        await loadData();
      } else {
        setCheckinResult({
          success: false,
          message: "Bạn đã điểm danh hôm nay rồi!",
        });
      }
    } catch (error) {
      setCheckinResult({
        success: false,
        message: "Không thể điểm danh. Vui lòng thử lại!",
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
      <div className="w-full min-h-screen bg-gradient-to-b from-blue-50 to-white">
        <main className="mx-auto max-w-4xl px-4 py-8">
          <SkeletonProfile />
        </main>
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen bg-gradient-to-b from-blue-50 to-white">
      <main className="mx-auto max-w-4xl px-4 sm:px-6 py-8 space-y-6">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between"
        >
          <h1 className="text-2xl font-bold text-slate-900">Hồ sơ của tôi</h1>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-4"
        >
          <StatCard
            icon={<FiZap className="w-5 h-5" />}
            label="Tổng XP"
            value={stats?.totalXp.toLocaleString() ?? "0"}
            color="blue"
          />
          <StatCard
            icon={<FiTrendingUp className="w-5 h-5" />}
            label="Cấp độ"
            value={stats?.level ?? 1}
            color="purple"
          />
          <StatCard
            icon={<HiOutlineFire className="w-5 h-5" />}
            label="Streak"
            value={`${stats?.currentStreak ?? 0} ngày`}
            color="orange"
          />
          <StatCard
            icon={<FiAward className="w-5 h-5" />}
            label="Bài đã làm"
            value={stats?.totalTestsCompleted ?? 0}
            color="green"
          />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-2xl p-6 shadow-sm"
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Tiến độ XP</h2>
              <p className="text-sm text-slate-500">
                Level {stats?.level} → Level {(stats?.level ?? 0) + 1}
              </p>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-blue-600">
                {stats?.totalXp.toLocaleString() ?? 0}
              </div>
              <div className="text-xs text-slate-500">
                / {((stats?.level ?? 0) * (stats?.xpForNextLevel ?? 100) + (stats?.xpForNextLevel ?? 100)).toLocaleString()} XP
              </div>
            </div>
          </div>

          <div className="relative h-4 bg-slate-100 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${xpProgress}%` }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="absolute inset-y-0 left-0 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full"
            />
          </div>
          <p className="mt-2 text-sm text-slate-500">
            {stats?.xpForNextLevel ? stats.xpForNextLevel - (stats.totalXp % stats.xpForNextLevel) : 0} XP để lên cấp tiếp theo
          </p>
        </motion.div>

        {/* Daily Check-in */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl p-6 shadow-lg"
        >
          <div className="flex items-center justify-between">
            <div className="text-white">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <FiCalendar className="w-5 h-5" />
                Điểm danh hàng ngày
              </h2>
              <p className="text-blue-100 text-sm mt-1">
                Nhận 10 XP mỗi ngày điểm danh!
              </p>
            </div>
            <button
              onClick={handleCheckin}
              disabled={checkinLoading}
              className="px-6 py-3 bg-white text-blue-600 font-semibold rounded-xl shadow-md hover:bg-blue-50 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {checkinLoading ? "Đang điểm danh..." : "Điểm danh"}
            </button>
          </div>

          <AnimatePresence>
            {checkinResult && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className={`mt-4 p-3 rounded-lg ${
                  checkinResult.success
                    ? "bg-green-100 text-green-800"
                    : "bg-yellow-100 text-yellow-800"
                }`}
              >
                {checkinResult.message}
                {checkinResult.xpEarned && (
                  <span className="ml-2 font-bold">+{checkinResult.xpEarned} XP</span>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <QuickLink
            title="Thành tựu"
            description={`${stats?.recentAchievements?.length ?? 0} thành tựu đã mở khóa`}
            icon={<FiAward className="w-6 h-6" />}
            onClick={() => router.push("/achievements")}
            delay={0.2}
          />
          <QuickLink
            title="Bảng xếp hạng"
            description="Xem thứ hạng của bạn"
            icon={<FiTrendingUp className="w-6 h-6" />}
            onClick={() => router.push("/leaderboard")}
            delay={0.25}
          />
        </div>

        {stats?.recentAchievements && stats.recentAchievements.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white rounded-2xl p-6 shadow-sm"
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-slate-900">Thành tựu gần đây</h2>
              <button
                onClick={() => router.push("/achievements")}
                className="text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                Xem tất cả
              </button>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              {stats.recentAchievements.slice(0, 5).map((achievement) => (
                <div
                  key={achievement.id}
                  className="flex flex-col items-center p-3 bg-gradient-to-b from-yellow-50 to-orange-50 rounded-xl border border-orange-100"
                >
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center text-white text-xl shadow-sm">
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

        {xpHistory.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
            className="bg-white rounded-2xl p-6 shadow-sm"
          >
            <h2 className="text-lg font-semibold text-slate-900 mb-4">Lịch sử XP</h2>
            <div className="space-y-3">
              {xpHistory.slice(0, 5).map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0"
                >
                  <div>
                    <div className="text-sm font-medium text-slate-700">
                      {formatXpSource(item.source)}
                    </div>
                    <div className="text-xs text-slate-400">
                      {formatDate(item.createdAt)}
                    </div>
                  </div>
                  <span className="text-sm font-bold text-green-600">
                    +{item.amount} XP
                  </span>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </main>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  color: "blue" | "purple" | "orange" | "green";
}) {
  const colorClasses = {
    blue: "bg-blue-50 text-blue-600 border-blue-100",
    purple: "bg-purple-50 text-purple-600 border-purple-100",
    orange: "bg-orange-50 text-orange-600 border-orange-100",
    green: "bg-green-50 text-green-600 border-green-100",
  };

  return (
    <div className={`p-4 rounded-2xl border ${colorClasses[color]}`}>
      <div className="flex items-center gap-2 mb-2">
        {icon}
        <span className="text-xs font-medium opacity-80">{label}</span>
      </div>
      <div className="text-2xl font-bold">{value}</div>
    </div>
  );
}

function QuickLink({
  title,
  description,
  icon,
  onClick,
  delay,
}: {
  title: string;
  description: string;
  icon: React.ReactNode;
  onClick: () => void;
  delay: number;
}) {
  return (
    <motion.button
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      onClick={onClick}
      className="flex items-center gap-4 p-4 bg-white rounded-2xl shadow-sm hover:shadow-md transition text-left w-full group"
    >
      <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
        {icon}
      </div>
      <div className="flex-1">
        <div className="font-semibold text-slate-900">{title}</div>
        <div className="text-sm text-slate-500">{description}</div>
      </div>
      <FiChevronRight className="w-5 h-5 text-slate-400 group-hover:text-blue-600 transition" />
    </motion.button>
  );
}

function SkeletonProfile() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-8 w-48 bg-slate-200 rounded" />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-24 bg-slate-200 rounded-2xl" />
        ))}
      </div>
      <div className="h-40 bg-slate-200 rounded-2xl" />
      <div className="h-32 bg-slate-200 rounded-2xl" />
    </div>
  );
}

function formatXpSource(source: string): string {
  const sourceMap: Record<string, string> = {
    // CamelCase
    DailyLogin: "Điểm danh hàng ngày",
    TestCompleted: "Hoàn thành bài test",
    CardReviewed: "Ôn tập thẻ từ vựng",
    LessonCompleted: "Hoàn thành bài học",
    AchievementUnlocked: "Mở khóa thành tựu",
    StreakBonus: "Bonus streak",
    // UPPER_CASE
    DAILY_LOGIN: "Điểm danh hàng ngày",
    TEST_COMPLETED: "Hoàn thành bài test",
    CARD_REVIEWED: "Ôn tập thẻ từ vựng",
    LESSON_COMPLETED: "Hoàn thành bài học",
    ACHIEVEMENT_UNLOCKED: "Mở khóa thành tựu",
    STREAK_BONUS: "Bonus streak",
    DAILY_CHECKIN: "Điểm danh hàng ngày",
  };
  return sourceMap[source] || source.split("_").map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(" ");
}

function formatDate(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleString("vi-VN", {
      hour: "2-digit",
      minute: "2-digit",
      day: "2-digit",
      month: "2-digit",
    });
  } catch {
    return iso;
  }
}
