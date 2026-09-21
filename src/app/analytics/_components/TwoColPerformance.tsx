"use client";

import { motion } from "framer-motion";
import { ActivityCalendar } from "@/components/ui/ActivityCalendar";
import { QuestionTypeBars } from "./QuestionTypeBars";
import { type ActivityDay, type StrengthsWeaknesses } from "../_lib/utils";

import { CARD_CLASS } from "../_lib/presentation";

// ---------------------------------------------------------------------------
// 5. Two-column row: question-type bars + activity heatmap.
// ---------------------------------------------------------------------------

export function TwoColPerformance({
  strengths,
  activity,
}: {
  strengths: StrengthsWeaknesses;
  activity: ActivityDay[];
}) {
  const items = [...strengths.strengths, ...strengths.weaknesses];
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <motion.section
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut", delay: 0.1 }}
        className={CARD_CLASS}
      >
        <div className="mb-4">
          <h2
            className="text-xl font-bold text-[var(--foreground)]"
            style={{ fontFamily: "var(--font-heading)" }}
          >
            Question type performance
          </h2>
          <p
            className="text-xs text-[var(--text-muted)] mt-0.5"
            style={{ fontFamily: "var(--font-heading)" }}
          >
            Accuracy by question type, grouped by skill.
          </p>
        </div>
        <QuestionTypeBars items={items} />
      </motion.section>

      <motion.section
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut", delay: 0.15 }}
        className={CARD_CLASS}
      >
        <div className="mb-4">
          <h2
            className="text-xl font-bold text-[var(--foreground)]"
            style={{ fontFamily: "var(--font-heading)" }}
          >
            Activity heatmap
          </h2>
          <p
            className="text-xs text-[var(--text-muted)] mt-0.5"
            style={{ fontFamily: "var(--font-heading)" }}
          >
            Your daily practice activity.
          </p>
        </div>
        <ActivityCalendar compact={false} days={activity} />
        <div className="flex items-center gap-2 mt-4 text-xs text-[var(--text-muted)]">
          <span style={{ fontFamily: "var(--font-heading)" }}>Less</span>
          {[0, 0.2, 0.4, 0.6, 0.8, 1].map((opacity) => (
            <span
              key={opacity}
              className="w-3 h-3 rounded-full"
              style={{
                backgroundColor:
                  opacity === 0
                    ? "var(--border)"
                    : `color-mix(in srgb, var(--primary) ${opacity * 100}%, transparent)`,
              }}
            />
          ))}
          <span style={{ fontFamily: "var(--font-heading)" }}>More</span>
        </div>
      </motion.section>
    </div>
  );
}
