"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { getAchievements } from "@/utils/api";
import { FiArrowLeft } from "react-icons/fi";

type Achievement = {
  id: string;
  slug: string;
  title: string;
  description: string;
  iconUrl?: string; // Material Symbol name
  category: string;
  tier: 'COMMON' | 'RARE' | 'EPIC' | 'LEGENDARY'; // From API
  requiredValue: number;
  xpReward: number;
  isUnlocked: boolean;
  unlockedAt?: string;
};

// Material Symbol icons for each category
const CATEGORY_ICONS: Record<string, string> = {
  STREAK: "local_fire_department",
  TEST: "quiz",
  VOCABULARY: "menu_book",
  COURSE: "school",
};

// Tier color palettes
const TIER_STYLES = {
  COMMON: { 
    bg: 'bg-blue-50', 
    text: 'text-blue-600', 
    iconBg: 'bg-gradient-to-br from-blue-400 to-blue-600',
    border: 'border-blue-200'
  },
  RARE: { 
    bg: 'bg-orange-50', 
    text: 'text-orange-700', 
    iconBg: 'bg-gradient-to-br from-orange-400 to-red-500',
    border: 'border-orange-200'
  },
  EPIC: { 
    bg: 'bg-purple-50', 
    text: 'text-purple-700', 
    iconBg: 'bg-gradient-to-br from-purple-500 to-indigo-600',
    border: 'border-purple-200'
  },
  LEGENDARY: { 
    bg: 'bg-yellow-50', 
    text: 'text-yellow-800', 
    iconBg: 'bg-gradient-to-br from-yellow-400 to-amber-600',
    border: 'border-yellow-200'
  },
};

const CATEGORY_LABELS: Record<string, string> = {
  STREAK: "🔥 Streak",
  TEST: "📝 Tests",
  VOCABULARY: "📚 Vocabulary",
  COURSE: "📖 Courses",
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
    } catch {
      // Failed to load achievements
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
      <div className="w-full min-h-screen bg-[#F8FAFC]">
        <main className="mx-auto max-w-5xl px-4 py-8">
          <SkeletonAchievements />
        </main>
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen bg-[#F8FAFC]">
      {/* Google Material Symbols */}
      <link
        href="https://fonts.googleapis.com/css2?family=Material+Symbols+Rounded:opsz,wght,FILL,GRAD@24,400,1,0"
        rel="stylesheet"
      />
      
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
            <h1 className="text-2xl font-serif font-bold text-slate-900">Achievement Collection</h1>
            <p className="text-sm text-slate-500">
              Unlocked {unlockedCount}/{totalCount} badges
            </p>
          </div>
        </motion.div>

        {/* Progress Bar */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-slate-600">Collection Progress</span>
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
                  : "bg-white text-slate-600 hover:bg-slate-50 border border-slate-200"
              }`}
            >
              {cat === "all" ? "All" : CATEGORY_LABELS[cat] || cat}
            </button>
          ))}
        </motion.div>

        {/* Achievements Grid - Medal Case */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.15 }}
          className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5"
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
            No achievements in this category.
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
  const tier = achievement.tier || 'COMMON';
  const style = TIER_STYLES[tier];
  // Use iconUrl from API if available, otherwise fallback to category icon
  const iconName = achievement.iconUrl || CATEGORY_ICONS[achievement.category] || "emoji_events";

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04 }}
      className={`relative group rounded-[2rem] p-6 border transition-all duration-300 flex flex-col items-center text-center
        ${isUnlocked 
          ? 'bg-white border-slate-200 shadow-sm hover:-translate-y-1 hover:shadow-lg cursor-pointer' 
          : 'bg-slate-50/80 border-slate-200'}
      `}
    >
      {/* THE BADGE (Icon Container) */}
      <div className="relative mb-4">
        {/* Main Circle */}
        <div className={`w-20 h-20 rounded-full flex items-center justify-center shadow-lg transition-all duration-300
          ${isUnlocked ? style.iconBg : 'bg-slate-200'}
          ${isUnlocked ? 'group-hover:scale-110' : ''}
        `}>
          <span className={`material-symbols-rounded text-4xl ${isUnlocked ? 'text-white' : 'text-slate-400'}`}>
            {iconName}
          </span>
        </div>

        {/* Locked Overlay Badge */}
        {!isUnlocked && (
          <div className="absolute -bottom-1 -right-1 w-8 h-8 bg-slate-100 rounded-full border-2 border-white flex items-center justify-center shadow-sm">
            <span className="material-symbols-rounded text-slate-400 text-sm">lock</span>
          </div>
        )}
        
        {/* Unlocked Checkmark Badge */}
        {isUnlocked && (
          <div className="absolute -bottom-1 -right-1 w-8 h-8 bg-green-500 rounded-full border-2 border-white flex items-center justify-center shadow-md">
            <span className="material-symbols-rounded text-white text-sm font-bold">check</span>
          </div>
        )}
      </div>

      {/* TEXT CONTENT */}
      <h3 className={`font-serif font-bold text-base mb-1 leading-tight ${isUnlocked ? 'text-slate-900' : 'text-slate-500'}`}>
        {achievement.title}
      </h3>
      <p className="text-xs text-slate-400 leading-relaxed line-clamp-2 mb-4">
        {achievement.description}
      </p>

      {/* REWARD PILL */}
      <div className={`px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider
        ${isUnlocked ? style.bg + ' ' + style.text : 'bg-slate-100 text-slate-400'}
      `}>
        +{achievement.xpReward} XP
      </div>

      {/* Unlock date */}
      {isUnlocked && achievement.unlockedAt && (
        <div className="mt-3 text-[10px] text-slate-400">
          ✨ {formatDate(achievement.unlockedAt)}
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
          <div className="h-6 w-40 bg-slate-200 rounded" />
          <div className="h-4 w-48 bg-slate-200 rounded" />
        </div>
      </div>
      <div className="h-16 bg-slate-200 rounded-2xl" />
      <div className="flex gap-2">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-10 w-24 bg-slate-200 rounded-full" />
        ))}
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
        {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
          <div key={i} className="h-56 bg-slate-200 rounded-[2rem]" />
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
