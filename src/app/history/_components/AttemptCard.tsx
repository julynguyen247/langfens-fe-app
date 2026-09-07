"use client";

// Single attempt row rendered in the main list. Click navigates to the
// attempts result page with the appropriate `?source=` query string.

import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  bandDescriptor,
  cefrForBand,
  effectiveBand,
  examTypeLabel,
  formatAttemptDate,
  formatBand,
  formatDuration,
  normaliseStatus,
  relativeTime,
  SKILL_LABEL,
  type AttemptRecord,
  type SkillKey,
} from "../_lib/utils";

export interface AttemptCardProps {
  attempt: AttemptRecord;
  /** Which tab the user is currently viewing (drives the routing destination). */
  source: SkillKey;
  /** Stagger delay in seconds for the parent's reveal animation. */
  index: number;
}

const SKILL_PILL: Record<SkillKey, string> = {
  reading: "bg-[var(--skill-reading-light)] text-[var(--skill-reading)] border-[var(--skill-reading-border)]",
  listening: "bg-[var(--skill-listening-light)] text-[var(--skill-listening)] border-[var(--skill-listening-border)]",
  writing: "bg-[var(--skill-writing-light)] text-[var(--skill-writing)] border-[var(--skill-writing-border)]",
  speaking: "bg-[var(--skill-speaking-light)] text-[var(--skill-speaking)] border-[var(--skill-speaking-border)]",
};

const STATUS_STYLE: Record<string, string> = {
  graded: "bg-[var(--skill-speaking-light)] text-[var(--skill-speaking)] border-[var(--skill-speaking-border)]",
  submitted: "bg-[var(--primary-light)] text-[var(--primary-dark)] border-[var(--skill-reading-border)]",
  in_progress: "bg-amber-50 text-amber-700 border-amber-200",
  expired: "bg-red-50 text-[var(--destructive)] border-red-200",
  unknown: "bg-slate-50 text-slate-600 border-slate-200",
};

export function AttemptCard({ attempt, source, index }: AttemptCardProps) {
  const router = useRouter();
  const status = normaliseStatus(attempt.status);
  const band = effectiveBand(attempt);
  const pillStyle = SKILL_PILL[source] ?? SKILL_PILL.reading;
  const statusStyle = STATUS_STYLE[status.key] ?? STATUS_STYLE.unknown;
  const cefr = cefrForBand(band);
  const descriptor = bandDescriptor(band);
  const examType = examTypeLabel(attempt.examType);

  const href =
    source === "reading"
      ? `/attempts/${attempt.id}`
      : source === "listening"
      ? `/attempts/${attempt.id}?source=attempt`
      : `/attempts/${attempt.id}?source=${source}`;

  const handleClick = () => {
    if (status.key === "in_progress") {
      // Send users back to the test runner for unfinished work.
      router.push(`/do-test/${attempt.skill ?? "reading"}/${attempt.id}`);
      return;
    }
    router.push(href);
  };

  // Read/listening row shows the "X/Y correct" accuracy figure; writing/speaking
  // show the overall band — they don't have per-question counts.
  const showAccuracy =
    (source === "reading" || source === "listening") &&
    typeof attempt.correctCount === "number" &&
    typeof attempt.totalQuestions === "number" &&
    attempt.totalQuestions > 0;

  const stagger = Math.min(index * 0.04, 0.4);

  return (
    <motion.button
      type="button"
      onClick={handleClick}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: stagger, ease: "easeOut" }}
      className="w-full text-left bg-white rounded-[2rem] border-[3px] border-[var(--border)] shadow-[0_4px_0_rgba(0,0,0,0.08)] p-5 sm:p-6 hover:-translate-y-0.5 hover:shadow-[0_6px_0_rgba(0,0,0,0.08)] hover:border-[var(--primary)] transition-all duration-150 cursor-pointer"
    >
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        {/* Left cluster: skill pill + title + meta */}
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <span
              className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold border-[2px] ${pillStyle}`}
              style={{ fontFamily: "var(--font-heading)" }}
            >
              {SKILL_LABEL[source]}
            </span>
            <span
              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold border-[1px] ${statusStyle}`}
              style={{ fontFamily: "var(--font-heading)" }}
            >
              {status.label}
            </span>
            {band != null && (
              <span
                className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold border-[1px] bg-slate-50 text-slate-600 border-slate-200"
                style={{ fontFamily: "var(--font-heading)" }}
              >
                CEFR {cefr}
              </span>
            )}
            {examType && (
              <span
                className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold border-[1px] bg-white text-[var(--text-muted)] border-[var(--border)]"
                style={{ fontFamily: "var(--font-heading)" }}
              >
                {examType}
              </span>
            )}
          </div>

          <h3
            className="text-base sm:text-lg font-bold text-[var(--foreground)] truncate"
            style={{ fontFamily: "var(--font-heading)" }}
          >
            {attempt.examTitle || "Untitled attempt"}
          </h3>

          <div className="mt-1.5 flex items-center gap-2 text-xs text-[var(--text-muted)]">
            <span style={{ fontFamily: "var(--font-heading)" }}>
              {formatAttemptDate(attempt.finishedAt)}
            </span>
            {relativeTime(attempt.finishedAt) && (
              <>
                <span aria-hidden="true">·</span>
                <span style={{ fontFamily: "var(--font-heading)" }}>
                  {relativeTime(attempt.finishedAt)}
                </span>
              </>
            )}
          </div>
        </div>

        {/* Middle: accuracy (R/L) or band chip (W/S) */}
        <div className="flex items-center gap-4 sm:gap-6">
          {showAccuracy && (
            <div className="text-center sm:text-right">
              <p
                className="text-base font-bold text-[var(--foreground)]"
                style={{ fontFamily: "var(--font-code)" }}
              >
                {attempt.correctCount}/{attempt.totalQuestions}
              </p>
              <p
                className="text-[10px] text-[var(--text-muted)] mt-0.5"
                style={{ fontFamily: "var(--font-heading)" }}
              >
                Correct
              </p>
            </div>
          )}

          {typeof attempt.timeSpentSeconds === "number" &&
            attempt.timeSpentSeconds > 0 && (
              <div className="text-center sm:text-right">
                <p
                  className="text-base font-bold text-[var(--foreground)]"
                  style={{ fontFamily: "var(--font-code)" }}
                >
                  {formatDuration(attempt.timeSpentSeconds)}
                </p>
                <p
                  className="text-[10px] text-[var(--text-muted)] mt-0.5"
                  style={{ fontFamily: "var(--font-heading)" }}
                >
                  Time
                </p>
              </div>
            )}
        </div>

        {/* Far right: band chip */}
        <div className="sm:w-[140px] flex-shrink-0">
          {band != null ? (
            <div className="flex sm:flex-col items-center sm:items-end gap-3 sm:gap-1">
              <div className="text-center sm:text-right">
                <p
                  className="text-3xl sm:text-4xl font-bold text-[var(--primary)] leading-none"
                  style={{ fontFamily: "var(--font-code)" }}
                >
                  {formatBand(band)}
                </p>
              </div>
              <p
                className="text-[10px] text-[var(--text-muted)] sm:text-right"
                style={{ fontFamily: "var(--font-heading)" }}
              >
                {descriptor}
              </p>
            </div>
          ) : (
            <div className="text-center sm:text-right">
              <p
                className="text-xl font-bold text-[var(--text-muted)]"
                style={{ fontFamily: "var(--font-code)" }}
              >
                —
              </p>
              <p
                className="text-[10px] text-[var(--text-muted)] sm:mt-0.5"
                style={{ fontFamily: "var(--font-heading)" }}
              >
                Not graded
              </p>
            </div>
          )}
        </div>
      </div>
    </motion.button>
  );
}

export default AttemptCard;
