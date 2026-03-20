"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { getAchievements } from "@/utils/api";

type Achievement = {
  id: string;
  slug: string;
  title: string;
  description: string;
  iconUrl?: string;
  category: string;
  tier: 'COMMON' | 'RARE' | 'EPIC' | 'LEGENDARY';
  requiredValue: number;
  xpReward: number;
  isUnlocked: boolean;
  unlockedAt?: string;
};

// Tier color palettes - solid colors only
const TIER_STYLES = {
  COMMON: {
    bg: 'bg-[var(--skill-reading-light)]',
    text: 'text-[var(--skill-reading)]',
    iconBg: 'bg-[var(--skill-reading)]',
    iconBorder: 'border-[var(--skill-reading)]',
    border: 'border-[var(--skill-reading-border)]',
  },
  RARE: {
    bg: 'bg-orange-50',
    text: 'text-orange-700',
    iconBg: 'bg-orange-500',
    iconBorder: 'border-orange-600',
    border: 'border-orange-200',
  },
  EPIC: {
    bg: 'bg-[var(--skill-listening-light)]',
    text: 'text-[var(--skill-listening)]',
    iconBg: 'bg-[var(--skill-listening)]',
    iconBorder: 'border-[var(--skill-listening)]',
    border: 'border-[var(--skill-listening-border)]',
  },
  LEGENDARY: {
    bg: 'bg-[var(--skill-writing-light)]',
    text: 'text-[var(--skill-writing)]',
    iconBg: 'bg-[var(--skill-writing)]',
    iconBorder: 'border-[var(--skill-writing)]',
    border: 'border-[var(--skill-writing-border)]',
  },
};

const CATEGORY_LABELS: Record<string, string> = {
  STREAK: "Streak",
  TEST: "Tests",
  VOCABULARY: "Vocabulary",
  COURSE: "Courses",
};

// Tier label for display inside badge circle
const TIER_LABELS: Record<string, string> = {
  COMMON: "C",
  RARE: "R",
  EPIC: "E",
  LEGENDARY: "L",
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
      <div className="w-full min-h-screen bg-[var(--background)]">
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <SkeletonAchievements />
        </main>
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen bg-[var(--background)]">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-4"
        >
          <button
            onClick={() => router.push("/profile")}
            className="px-4 py-2.5 rounded-full bg-white border-[2px] border-[var(--border)] text-[var(--text-body)] font-bold shadow-[0_3px_0_rgba(0,0,0,0.06)] hover:-translate-y-0.5 hover:border-[var(--primary)] transition-all"
          >
            Back
          </button>
          <div>
            <h1
              className="text-2xl font-bold text-[var(--foreground)]"
              style={{ fontFamily: "var(--font-sans)" }}
            >
              Achievement Collection
            </h1>
            <p className="text-sm text-[var(--text-muted)]">
              Unlocked <span style={{ fontFamily: "var(--font-mono)" }}>{unlockedCount}/{totalCount}</span> badges
            </p>
          </div>
        </motion.div>

        {/* Progress Bar */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-[1.5rem] border-[3px] border-[var(--border)] p-5 shadow-[0_4px_0_rgba(0,0,0,0.08)]"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-bold text-[var(--text-body)]">Collection Progress</span>
            <span
              className="text-sm font-bold text-[var(--primary)]"
              style={{ fontFamily: "var(--font-mono)" }}
            >
              {Math.round((unlockedCount / Math.max(totalCount, 1)) * 100)}%
            </span>
          </div>
          <div className="h-4 bg-[var(--background)] rounded-full overflow-hidden border-[2px] border-[var(--border)]">
            <motion.div
              initial={{ width: 0 }}
              animate={{
                width: `${(unlockedCount / Math.max(totalCount, 1)) * 100}%`,
              }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="h-full bg-[var(--primary)] rounded-full"
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
              className={`px-5 py-2.5 rounded-full text-sm font-bold whitespace-nowrap transition-all ${
                filter === cat
                  ? "bg-[var(--primary)] text-white border-b-[4px] border-[var(--primary-dark)] hover:-translate-y-0.5 active:translate-y-[2px] active:border-b-[2px]"
                  : "bg-white text-[var(--text-body)] border-[2px] border-[var(--border)] shadow-[0_3px_0_rgba(0,0,0,0.06)] hover:-translate-y-0.5 hover:border-[var(--primary)]"
              }`}
            >
              {cat === "all" ? "All" : CATEGORY_LABELS[cat] || cat}
            </button>
          ))}
        </motion.div>

        {/* Achievements Grid */}
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
          <div className="text-center py-12 text-[var(--text-muted)] font-bold">
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

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04 }}
      className={`relative group rounded-[1.5rem] p-6 border-[3px] transition-all duration-300 flex flex-col items-center text-center
        ${isUnlocked
          ? 'bg-white border-[var(--border)] shadow-[0_4px_0_rgba(0,0,0,0.08)] hover:-translate-y-[3px] hover:border-[var(--primary)] hover:shadow-[0_6px_0_rgba(0,0,0,0.08)] cursor-pointer'
          : 'bg-[var(--background)] border-[var(--border)] shadow-[0_4px_0_rgba(0,0,0,0.04)]'}
      `}
    >
      {/* THE BADGE (Icon Container) */}
      <div className="relative mb-4">
        {/* Main Circle */}
        <div className={`w-20 h-20 rounded-full flex items-center justify-center shadow-[0_4px_0_rgba(0,0,0,0.12)] border-b-[4px] transition-all duration-300
          ${isUnlocked ? `${style.iconBg} ${style.iconBorder}` : 'bg-[var(--border)] border-[var(--border)]'}
          ${isUnlocked ? 'group-hover:scale-110' : ''}
        `}>
          <span
            className={`text-2xl font-bold ${isUnlocked ? 'text-white' : 'text-[var(--text-muted)]'}`}
            style={{ fontFamily: "var(--font-sans)" }}
          >
            {TIER_LABELS[tier]}
          </span>
        </div>

        {/* Locked Overlay Badge */}
        {!isUnlocked && (
          <div className="absolute -bottom-1 -right-1 w-8 h-8 bg-[var(--background)] rounded-full border-[2px] border-white flex items-center justify-center shadow-[0_2px_0_rgba(0,0,0,0.08)]">
            <span className="text-xs font-bold text-[var(--text-muted)]">
              Locked
            </span>
          </div>
        )}

        {/* Unlocked Checkmark Badge */}
        {isUnlocked && (
          <div className="absolute -bottom-1 -right-1 w-8 h-8 bg-[var(--skill-speaking)] rounded-full border-[2px] border-white flex items-center justify-center shadow-[0_2px_0_rgba(0,0,0,0.12)]">
            <span className="text-white text-xs font-bold">OK</span>
          </div>
        )}
      </div>

      {/* TEXT CONTENT */}
      <h3
        className={`font-bold text-base mb-1 leading-tight ${isUnlocked ? 'text-[var(--foreground)]' : 'text-[var(--text-muted)]'}`}
        style={{ fontFamily: "var(--font-sans)" }}
      >
        {achievement.title}
      </h3>
      <p className="text-xs text-[var(--text-muted)] leading-relaxed line-clamp-2 mb-4">
        {achievement.description}
      </p>

      {/* REWARD PILL */}
      <div className={`px-3 py-1.5 rounded-full text-xs font-bold border-[2px]
        ${isUnlocked ? `${style.bg} ${style.text} ${style.border}` : 'bg-[var(--background)] text-[var(--text-muted)] border-[var(--border)]'}
      `}>
        <span style={{ fontFamily: "var(--font-mono)" }}>+{achievement.xpReward}</span> XP
      </div>

      {/* Unlock date */}
      {isUnlocked && achievement.unlockedAt && (
        <div className="mt-3 text-[10px] text-[var(--text-muted)] font-bold" style={{ fontFamily: "var(--font-mono)" }}>
          {formatDate(achievement.unlockedAt)}
        </div>
      )}
    </motion.div>
  );
}

function SkeletonAchievements() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="flex items-center gap-4">
        <div className="w-16 h-10 bg-[var(--border)] rounded-full" />
        <div className="space-y-2">
          <div className="h-6 w-40 bg-[var(--border)] rounded-full" />
          <div className="h-4 w-48 bg-[var(--border)] rounded-full" />
        </div>
      </div>
      <div className="h-16 bg-[var(--border)] rounded-[1.5rem]" />
      <div className="flex gap-2">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-10 w-24 bg-[var(--border)] rounded-full" />
        ))}
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
        {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
          <div key={i} className="h-56 bg-[var(--border)] rounded-[1.5rem]" />
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
