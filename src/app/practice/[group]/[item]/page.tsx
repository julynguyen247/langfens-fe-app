"use client";

import { notFound } from "next/navigation";
import { GroupId, isValidGroup } from "@/lib/practice.meta";
import { SkillBadge } from "@/components/ui/SkillBadge";
import { motion } from "framer-motion";

function makeItemDetail(group: GroupId, itemId: string) {
  return {
    id: itemId,
    title: `Detail for ${itemId}`,
    questions: 40,
    difficulty: 3,
    completed: 12,
  };
}

export default function ItemPage({
  params,
}: {
  params: { group: string; item: string };
}) {
  const group = params.group as GroupId;
  const itemId = params.item;
  if (!isValidGroup(group)) notFound();

  const data = makeItemDetail(group, itemId);
  const progressPercent = Math.round((data.completed / data.questions) * 100);

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Quest Detail Card */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="bg-white border-[3px] border-[var(--border)] rounded-[2rem] shadow-[0_4px_0_rgba(0,0,0,0.08)] p-6 sm:p-8 mb-6"
      >
        <div className="flex flex-col sm:flex-row sm:items-center gap-6">
          <div className="flex-1">
            {/* Skill badge */}
            <div className="mb-4">
              <SkillBadge skill={group} size="sm" />
            </div>

            {/* Title */}
            <h1
              className="text-2xl sm:text-3xl font-bold text-[var(--foreground)] mb-2"
              style={{ fontFamily: "var(--font-sans)" }}
            >
              {data.title}
            </h1>
            <p className="text-[var(--text-muted)] mb-4">
              Quest details and progress
            </p>

            {/* Difficulty circles */}
            <div className="flex items-center gap-2 mb-4">
              <span
                className="text-xs font-semibold text-[var(--text-muted)] mr-1"
                style={{ fontFamily: "var(--font-sans)" }}
              >
                Difficulty
              </span>
              {Array.from({ length: 5 }).map((_, i) => (
                <span
                  key={i}
                  className="w-3 h-3 rounded-full"
                  style={{
                    backgroundColor:
                      i < data.difficulty
                        ? "var(--primary)"
                        : "var(--border)",
                  }}
                />
              ))}
            </div>

            {/* Progress bar */}
            <div className="mb-2">
              <div className="flex items-center justify-between mb-1">
                <span
                  className="text-xs font-semibold text-[var(--text-muted)]"
                  style={{ fontFamily: "var(--font-sans)" }}
                >
                  Progress
                </span>
                <span
                  className="text-xs font-bold text-[var(--primary)]"
                  style={{ fontFamily: "var(--font-mono)" }}
                >
                  {progressPercent}%
                </span>
              </div>
              <div className="h-3 rounded-full bg-[var(--background)] border-[2px] border-[var(--border)] overflow-hidden">
                <div
                  className="h-full rounded-full bg-[var(--primary)] transition-all duration-500"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>
          </div>

          {/* Stats Card */}
          <div className="bg-white border-[3px] border-[var(--border)] rounded-[2rem] shadow-[0_4px_0_rgba(0,0,0,0.08)] p-5 text-center min-w-[120px]">
            <p
              className="text-3xl font-bold text-[var(--primary)]"
              style={{ fontFamily: "var(--font-mono)" }}
            >
              {data.questions}
            </p>
            <p className="text-sm text-[var(--text-muted)] font-medium mt-1">
              Questions
            </p>
          </div>
        </div>
      </motion.div>

      {/* Action */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.15, ease: "easeOut" }}
        className="flex justify-center"
      >
        <button
          className="rounded-full bg-[var(--primary)] text-white font-bold px-8 py-3 border-b-[4px] border-[var(--primary-dark)] hover:-translate-y-0.5 hover:border-b-[5px] active:translate-y-[2px] active:border-b-[2px] transition-all duration-150"
          style={{ fontFamily: "var(--font-sans)" }}
        >
          Start practice
        </button>
      </motion.div>
    </main>
  );
}
