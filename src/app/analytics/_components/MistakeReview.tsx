"use client";

// Compact mistake-review list. Caps at 5 rows by default with a "View all"
// link to `/error-review`. Each row shows skill + question-type pills, the
// wrong → correct pair, and a deep link to the attempt.

import Link from "next/link";
import {
  formatQuestionType,
  formatShortDate,
  type WrongAnswer,
} from "../_lib/utils";

export interface MistakeReviewProps {
  errors: WrongAnswer[];
  total: number;
  /** Maximum rows to show. Defaults to 5 per spec. */
  max?: number;
}

const SKILL_PILL: Record<string, string> = {
  READING: "bg-[var(--skill-reading-light)] text-[var(--skill-reading)] border-[var(--skill-reading-border)]",
  LISTENING: "bg-[var(--skill-listening-light)] text-[var(--skill-listening)] border-[var(--skill-listening-border)]",
  WRITING: "bg-[var(--skill-writing-light)] text-[var(--skill-writing)] border-[var(--skill-writing-border)]",
  SPEAKING: "bg-[var(--skill-speaking-light)] text-[var(--skill-speaking)] border-[var(--skill-speaking-border)]",
};

function pillForSkill(raw: string): string {
  const upper = raw.toUpperCase();
  return SKILL_PILL[upper] ?? SKILL_PILL.READING;
}

export function MistakeReview({
  errors,
  total,
  max = 5,
}: MistakeReviewProps) {
  const visible = errors.slice(0, max);

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <p
            className="text-lg font-bold text-[var(--foreground)]"
            style={{ fontFamily: "var(--font-heading)" }}
          >
            Mistake review
          </p>
          <p
            className="text-xs text-[var(--text-muted)] mt-0.5"
            style={{ fontFamily: "var(--font-code)" }}
          >
            {total} {total === 1 ? "error" : "errors"} logged
          </p>
        </div>
        <Link
          href="/error-review"
          className="text-sm font-bold text-[var(--primary)] hover:text-[var(--primary-hover)] transition-colors"
          style={{ fontFamily: "var(--font-heading)" }}
        >
          View all
        </Link>
      </div>

      {visible.length === 0 ? (
        <div className="rounded-2xl border-[2px] border-[var(--skill-speaking-border)] bg-[var(--skill-speaking-light)] p-5">
          <p
            className="text-sm font-bold text-[var(--skill-speaking)]"
            style={{ fontFamily: "var(--font-heading)" }}
          >
            All clear — no recent mistakes.
          </p>
          <p
            className="text-xs text-[var(--text-muted)] mt-1"
            style={{ fontFamily: "var(--font-heading)" }}
          >
            Great work. Keep practising to maintain your streak.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-2.5 max-h-72 overflow-y-auto pr-1">
          {visible.map((err) => (
            <div
              key={err.answerId}
              className="p-3 rounded-2xl border-[2px] border-[var(--border)] bg-[var(--background)] hover:border-[var(--destructive)] transition-colors"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 mb-1.5 flex-wrap">
                    <span
                      className={`text-[11px] px-2 py-0.5 rounded-full font-bold border-[1px] ${pillForSkill(err.skill)}`}
                      style={{ fontFamily: "var(--font-heading)" }}
                    >
                      {err.skill || "Reading"}
                    </span>
                    <span
                      className="text-[11px] px-2 py-0.5 rounded-full font-bold bg-[var(--skill-writing-light)] text-[var(--skill-writing)] border-[1px] border-[var(--skill-writing-border)]"
                      style={{ fontFamily: "var(--font-heading)" }}
                    >
                      {formatQuestionType(err.questionType)}
                    </span>
                    {err.attemptDate && (
                      <span
                        className="text-[11px] text-[var(--text-muted)]"
                        style={{ fontFamily: "var(--font-code)" }}
                      >
                        {formatShortDate(err.attemptDate)}
                      </span>
                    )}
                  </div>
                  <p
                    className="text-sm text-[var(--text-body)] line-clamp-1"
                    style={{ fontFamily: "var(--font-heading)" }}
                    title={err.questionContent}
                  >
                    {err.questionContent || "(no question text)"}
                  </p>
                  <div className="flex items-center gap-2 mt-1 text-xs">
                    <span
                      className="text-[var(--destructive)] line-through font-bold"
                      style={{ fontFamily: "var(--font-code)" }}
                    >
                      {err.userAnswer || "(empty)"}
                    </span>
                    <span className="text-[var(--text-muted)]">→</span>
                    <span
                      className="text-[var(--skill-speaking)] font-bold"
                      style={{ fontFamily: "var(--font-code)" }}
                    >
                      {err.correctAnswer || "—"}
                    </span>
                  </div>
                </div>
                <Link
                  href={`/attempts/${err.attemptId}`}
                  className="flex-shrink-0 px-3 py-1.5 text-[var(--primary)] hover:bg-[var(--primary-light)] rounded-full font-bold text-xs transition-colors"
                  style={{ fontFamily: "var(--font-heading)" }}
                >
                  View
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default MistakeReview;
