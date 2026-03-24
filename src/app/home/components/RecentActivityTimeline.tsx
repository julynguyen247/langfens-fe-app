"use client";

import { motion } from "framer-motion";
import type { RecentActivityTimelineProps, Skill } from "../types";

const skillConfig: Record<Skill, { bg: string; text: string }> = {
  Reading: {
    bg: "bg-blue-100 text-blue-700",
    text: "text-blue-700",
  },
  Listening: {
    bg: "bg-purple-100 text-purple-700",
    text: "text-purple-700",
  },
  Writing: {
    bg: "bg-amber-100 text-amber-700",
    text: "text-amber-700",
  },
  Speaking: {
    bg: "bg-emerald-100 text-emerald-700",
    text: "text-emerald-700",
  },
};

function formatTimeAgo(dateISO: string): string {
  const date = new Date(dateISO);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 60) {
    return `${diffMins}m ago`;
  }
  if (diffHours < 24) {
    return `${diffHours}h ago`;
  }
  if (diffDays === 1) {
    return "Yesterday";
  }
  if (diffDays < 7) {
    return `${diffDays} days ago`;
  }
  
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

function formatDate(dateISO: string): { day: string; date: string; month: string } {
  const date = new Date(dateISO);
  return {
    day: date.toLocaleDateString("en-US", { weekday: "short" }),
    date: date.getDate().toString(),
    month: date.toLocaleDateString("en-US", { month: "short" }),
  };
}

function TimelineItem({
  attempt,
  onView,
  index,
}: {
  attempt: {
    id: string;
    title: string;
    skill: Skill;
    score?: number;
    dateISO: string;
    attemptId: string;
  };
  onView: () => void;
  index: number;
}) {
  const config = skillConfig[attempt.skill];
  const { day, date, month } = formatDate(attempt.dateISO);
  const timeAgo = formatTimeAgo(attempt.dateISO);

  return (
    <motion.div
      className="relative flex gap-4"
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.8 + index * 0.1, duration: 0.4 }}
    >
      {/* Date Badge */}
      <div className="flex flex-col items-center">
        <div className="w-10 h-10 rounded-full bg-slate-100 flex flex-col items-center justify-center">
          <span className="text-[10px] text-slate-500 font-medium leading-none">{day}</span>
          <span
            className="text-sm font-bold text-slate-700 leading-none"
            style={{ fontFamily: "var(--font-mono)" }}
          >
            {date}
          </span>
        </div>
      </div>

      {/* Timeline connector */}
      <div className="absolute left-[4.5rem] top-10 bottom-0 w-0.5 bg-slate-200" />

      {/* Content Card */}
      <div className="flex-1 pb-6">
        <div
          className={`relative bg-white border-[2px] border-slate-100 rounded-xl p-4 hover:border-slate-300 transition-colors cursor-pointer`}
          onClick={onView}
        >
          <div className="flex items-start justify-between gap-2 mb-2">
            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-semibold text-slate-800 truncate">
                {attempt.title}
              </h4>
              <p className="text-xs text-slate-500 mt-0.5">{timeAgo}</p>
            </div>
            
            {/* Skill badge */}
            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
              {attempt.skill}
            </span>
          </div>

          {/* Score */}
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500">Score</span>
            {attempt.score !== undefined ? (
              <span
                className="text-sm font-bold text-slate-700"
                style={{ fontFamily: "var(--font-mono)" }}
              >
                {attempt.score}%
              </span>
            ) : (
              <span className="text-sm text-slate-400">—</span>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export default function RecentActivityTimeline({
  attempts,
  onViewAttempt,
  onViewAll,
}: RecentActivityTimelineProps) {
  const displayAttempts = attempts.slice(0, 5);

  return (
    <motion.section
      className="space-y-5"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.8, duration: 0.4 }}
    >
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-slate-800">Recent Activity</h2>
        {attempts.length > 5 && (
          <button
            onClick={onViewAll}
            className="text-sm text-blue-600 hover:text-blue-700 font-medium"
          >
            View all
          </button>
        )}
      </div>

      {displayAttempts.length > 0 ? (
        <div className="relative pl-2">
          {displayAttempts.map((attempt, index) => (
            <TimelineItem
              key={attempt.id}
              attempt={attempt}
              index={index}
              onView={() => onViewAttempt(attempt.attemptId, attempt.skill)}
            />
          ))}
        </div>
      ) : (
        <div className="bg-white border-[3px] border-slate-100 rounded-[1.5rem] shadow-[0_4px_0_rgba(0,0,0,0.08)] p-8 text-center">
          <p className="text-slate-600 font-medium">No activity yet</p>
          <p className="text-sm text-slate-500 mt-1">
            Start your first practice to see your progress here!
          </p>
          <button
            onClick={onViewAll}
            className="mt-4 px-6 py-2 bg-blue-500 text-white font-semibold rounded-full"
          >
            Start Practice
          </button>
        </div>
      )}
    </motion.section>
  );
}
