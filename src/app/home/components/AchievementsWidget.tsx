"use client";

import { motion } from "framer-motion";
import type { AchievementsWidgetProps, Achievement } from "../types";

// Material Icon Component
function Icon({ name, className = "" }: { name: string; className?: string }) {
  return <span className={`material-symbols-rounded ${className}`}>{name}</span>;
}

function AchievementIcon({ type, isUnlocked }: { type: Achievement["iconType"]; isUnlocked: boolean }) {
  const color = isUnlocked ? "text-amber-500" : "text-slate-400";

  // Material Icon names for each achievement type
  const iconMap: Record<Achievement["iconType"], string> = {
    streak: "local_fire_department",
    score: "grade",
    time: "schedule",
    tests: "quiz",
    skill: "psychology",
  };

  return (
    <div
      className={`w-10 h-10 rounded-full flex items-center justify-center bg-slate-100`}
    >
      <Icon name={iconMap[type] || "help"} className={`text-xl ${color}`} />
    </div>
  );
}

function AchievementCard({ achievement }: { achievement: Achievement }) {
  const isUnlocked = achievement.isUnlocked;
  const isClose = achievement.progress >= 75 && !isUnlocked;

  return (
    <motion.div
      className={`relative p-4 rounded-xl border-2 ${
        isUnlocked
          ? "border-amber-300 bg-amber-50"
          : isClose
          ? "border-amber-200 bg-amber-50/50"
          : "border-slate-200 bg-slate-50"
      }`}
      whileHover={{ scale: 1.02 }}
    >
      {/* Glow effect for achievements ready to unlock */}
      {isClose && (
        <div className="absolute inset-0 rounded-xl bg-amber-400/20 animate-pulse" />
      )}

      <div className="relative flex items-start gap-3">
        <AchievementIcon type={achievement.iconType} isUnlocked={isUnlocked} />
        
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-semibold text-slate-800 truncate">
            {achievement.name}
          </h4>
          
          {!isUnlocked && (
            <div className="mt-2">
              {/* Progress bar */}
              <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-amber-500 rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${achievement.progress}%` }}
                  transition={{ duration: 0.8, delay: 0.5 }}
                />
              </div>
              <p className="text-xs text-slate-500 mt-1">
                {achievement.progress}% complete
              </p>
            </div>
          )}

          {isUnlocked && (
            <p className="text-xs text-amber-600 font-medium mt-1">
              +{achievement.xpReward} XP
            </p>
          )}
        </div>
      </div>
    </motion.div>
  );
}

export default function AchievementsWidget({
  achievements,
  onViewAll,
}: AchievementsWidgetProps) {
  // Show up to 3 achievements: prioritize near-unlock, then recent unlocks
  const sortedAchievements = [...achievements]
    .sort((a, b) => {
      // Unlocked achievements first (by recency - would need unlockDate)
      if (a.isUnlocked !== b.isUnlocked) {
        return a.isUnlocked ? -1 : 1;
      }
      // Then by progress (closer to unlocking first)
      if (!a.isUnlocked && !b.isUnlocked) {
        return b.progress - a.progress;
      }
      return 0;
    })
    .slice(0, 3);

  return (
    <motion.section
      className="relative bg-white border-[3px] border-amber-200 rounded-[1.5rem] shadow-[0_4px_0_rgba(0,0,0,0.08)] p-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.6, duration: 0.4 }}
    >
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-slate-800">Achievements</h2>
        <button
          onClick={onViewAll}
          className="text-sm text-blue-600 hover:text-blue-700 font-medium"
        >
          View all
        </button>
      </div>

      {sortedAchievements.length > 0 ? (
        <div className="space-y-3">
          {sortedAchievements.map((achievement) => (
            <AchievementCard key={achievement.id} achievement={achievement} />
          ))}
        </div>
      ) : (
        <div className="text-center py-8 text-slate-500">
          <p className="text-sm">No achievements yet</p>
          <p className="text-xs mt-1">Start practicing to unlock achievements!</p>
        </div>
      )}
    </motion.section>
  );
}
