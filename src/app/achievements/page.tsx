"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { getAchievements } from "@/utils/api";
import { FiArrowLeft, FiLock, FiCheck } from "react-icons/fi";

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

const CATEGORY_LABELS: Record<string, string> = {
  Streak: "🔥 Streak",
  Test: "📝 Bài test",
  Vocabulary: "📚 Từ vựng",
  Course: "📖 Khóa học",
};

const CATEGORY_COLORS: Record<string, string> = {
  Streak: "from-orange-400 to-red-500",
  Test: "from-blue-400 to-blue-600",
  Vocabulary: "from-green-400 to-emerald-600",
  Course: "from-purple-400 to-purple-600",
};

export default function AchievementsPage() {
  const router = useRouter();
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("all");

  useEffect(() => {
    loadAchievements();
  }, []);

  async function loadAchievements() {
    setLoading(true);
    try {
      const res = await getAchievements();
      const data = (res as any)?.data?.data ?? (res as any)?.data ?? [];
      setAchievements(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Failed to load achievements:", error);
    } finally {
      setLoading(false);
    }
  }

  const categories = ["all", ...new Set(achievements.map((a) => a.category))];
  const filteredAchievements =
    filter === "all"
      ? achievements
      : achievements.filter((a) => a.category === filter);

  const unlockedCount = achievements.filter((a) => a.isUnlocked).length;
  const totalCount = achievements.length;

  if (loading) {
    return (
      <div className="w-full min-h-screen bg-gradient-to-b from-blue-50 to-white">
        <main className="mx-auto max-w-5xl px-4 py-8">
          <SkeletonAchievements />
        </main>
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen bg-gradient-to-b from-blue-50 to-white">
      <main className="mx-auto max-w-5xl px-4 sm:px-6 py-8 space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-4"
        >
          <button
            onClick={() => router.push("/profile")}
            className="p-2 rounded-lg hover:bg-slate-100 transition"
          >
            <FiArrowLeft className="w-5 h-5 text-slate-600" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Thành tựu</h1>
            <p className="text-sm text-slate-500">
              Đã mở khóa {unlockedCount}/{totalCount} thành tựu
            </p>
          </div>
        </motion.div>

        {/* Progress Bar */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl p-4 shadow-sm"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-slate-600">Tiến độ</span>
            <span className="text-sm font-bold text-blue-600">
              {Math.round((unlockedCount / Math.max(totalCount, 1)) * 100)}%
            </span>
          </div>
          <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{
                width: `${(unlockedCount / Math.max(totalCount, 1)) * 100}%`,
              }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full"
            />
          </div>
        </motion.div>

        {/* Category Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex gap-2 overflow-x-auto pb-2"
        >
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setFilter(cat)}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition ${
                filter === cat
                  ? "bg-blue-600 text-white shadow-sm"
                  : "bg-white text-slate-600 hover:bg-slate-50"
              }`}
            >
              {cat === "all" ? "Tất cả" : CATEGORY_LABELS[cat] || cat}
            </button>
          ))}
        </motion.div>

        {/* Achievements Grid */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.15 }}
          className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4"
        >
          {filteredAchievements.map((achievement, index) => (
            <AchievementCard
              key={achievement.id}
              achievement={achievement}
              index={index}
            />
          ))}
        </motion.div>

        {filteredAchievements.length === 0 && (
          <div className="text-center py-12 text-slate-500">
            Không có thành tựu nào trong danh mục này.
          </div>
        )}
      </main>
    </div>
  );
}

function AchievementCard({
  achievement,
  index,
}: {
  achievement: Achievement;
  index: number;
}) {
  const isUnlocked = achievement.isUnlocked;
  const categoryColor = CATEGORY_COLORS[achievement.category] || "from-slate-400 to-slate-600";

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className={`relative rounded-2xl p-4 border transition ${
        isUnlocked
          ? "bg-white border-transparent shadow-md hover:shadow-lg"
          : "bg-slate-50 border-slate-200 opacity-60"
      }`}
    >
      {/* Badge Icon */}
      <div className="flex justify-center mb-3">
        <div
          className={`w-16 h-16 rounded-full flex items-center justify-center shadow-lg ${
            isUnlocked
              ? `bg-gradient-to-br ${categoryColor} text-white`
              : "bg-slate-200 text-slate-400"
          }`}
        >
          {isUnlocked ? (
            <span className="text-2xl">🏆</span>
          ) : (
            <FiLock className="w-6 h-6" />
          )}
        </div>
      </div>

      {/* Content */}
      <div className="text-center">
        <h3
          className={`font-semibold text-sm ${
            isUnlocked ? "text-slate-900" : "text-slate-500"
          }`}
        >
          {achievement.title}
        </h3>
        <p className="text-xs text-slate-400 mt-1 line-clamp-2">
          {achievement.description}
        </p>
      </div>

      {/* XP Reward */}
      <div className="mt-3 flex justify-center">
        <span
          className={`text-xs font-medium px-2 py-1 rounded-full ${
            isUnlocked
              ? "bg-green-100 text-green-700"
              : "bg-slate-100 text-slate-500"
          }`}
        >
          +{achievement.xpReward} XP
        </span>
      </div>

      {/* Unlocked indicator */}
      {isUnlocked && (
        <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-green-500 text-white flex items-center justify-center">
          <FiCheck className="w-4 h-4" />
        </div>
      )}

      {/* Unlock date */}
      {isUnlocked && achievement.unlockedAt && (
        <div className="mt-2 text-center text-[10px] text-slate-400">
          Mở khóa: {formatDate(achievement.unlockedAt)}
        </div>
      )}
    </motion.div>
  );
}

function SkeletonAchievements() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="flex items-center gap-4">
        <div className="w-10 h-10 bg-slate-200 rounded-lg" />
        <div className="space-y-2">
          <div className="h-6 w-32 bg-slate-200 rounded" />
          <div className="h-4 w-48 bg-slate-200 rounded" />
        </div>
      </div>
      <div className="h-12 bg-slate-200 rounded-2xl" />
      <div className="flex gap-2">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-10 w-24 bg-slate-200 rounded-full" />
        ))}
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
          <div key={i} className="h-48 bg-slate-200 rounded-2xl" />
        ))}
      </div>
    </div>
  );
}

function formatDate(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  } catch {
    return iso;
  }
}
