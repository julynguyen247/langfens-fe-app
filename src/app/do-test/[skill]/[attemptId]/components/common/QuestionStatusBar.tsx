"use client";

import React, { memo } from "react";

type Props = {
  /** Range label shown in the first pill (e.g. "Questions 7–11"). */
  rangeLabel?: string;
  /** Number of answered blanks. */
  answeredCount?: number;
  /** Total number of blanks. */
  totalCount?: number;
  /** Whether the group is flagged for review. */
  isFlagged?: boolean;
  /** Toggle the group's flagged state. */
  onToggleFlag?: () => void;
};

/**
 * QuestionStatusBar — the status bar that sits at the top of every
 * "workbook page" card (CompletionCard, HeadingDropdown,
 * MatchingLetterCard, DiagramLabelCard, FlowChartCompletionCard,
 * WordListCompletionCard, plus the new type-specific cards in
 * Phase 3). One source of truth so the range label pill, the
 * "X / Y answered" pill, and the "Review / Flagged" toggle render
 * identically across the entire reading test.
 */
const QuestionStatusBar = memo(function QuestionStatusBar({
  rangeLabel,
  answeredCount,
  totalCount,
  isFlagged = false,
  onToggleFlag,
}: Props) {
  const hasAnsweredCount =
    typeof answeredCount === "number" && typeof totalCount === "number";
  const showStatusBar = !!rangeLabel || hasAnsweredCount || !!onToggleFlag;
  if (!showStatusBar) return null;

  const allAnswered =
    hasAnsweredCount && (answeredCount as number) === (totalCount as number);
  const partial =
    hasAnsweredCount &&
    (answeredCount as number) > 0 &&
    (answeredCount as number) < (totalCount as number);

  return (
    <div className="flex items-center gap-2 px-4 sm:px-5 pt-3 pb-2 border-b border-dashed border-[var(--border)]/70">
      {rangeLabel && (
        <span
          className="inline-flex items-center h-6 px-2.5 rounded-full bg-[var(--primary-light)] text-[var(--primary)] text-[11px] font-bold tracking-wide border border-[var(--primary)]/30"
          style={{ fontFamily: "var(--font-heading)" }}
        >
          {rangeLabel}
        </span>
      )}

      {hasAnsweredCount && (
        <span
          className="inline-flex items-center gap-1.5 h-6 px-2.5 rounded-full bg-white border border-[var(--border)] text-[11px] font-bold text-[var(--text-body)]"
          style={{ fontFamily: "var(--font-heading)" }}
          aria-label={`${answeredCount} of ${totalCount} answered`}
        >
          <span
            className={`block w-1.5 h-1.5 rounded-full ${
              allAnswered
                ? "bg-emerald-500"
                : partial
                  ? "bg-amber-400"
                  : "bg-[var(--border)]"
            }`}
          />
          {answeredCount} / {totalCount} answered
        </span>
      )}

      <div className="flex-1" />

      {onToggleFlag && (
        <button
          type="button"
          onClick={onToggleFlag}
          aria-pressed={isFlagged}
          aria-label={isFlagged ? "Remove review flag" : "Flag for review"}
          className={`inline-flex items-center gap-1.5 h-7 px-2.5 rounded-full border-[1.5px] text-[11px] font-bold transition-all duration-150 ${
            isFlagged
              ? "bg-amber-50 border-amber-400 text-amber-800"
              : "bg-white border-[var(--border)] text-[var(--text-muted)] hover:border-amber-400 hover:text-amber-700"
          }`}
          style={{ fontFamily: "var(--font-heading)" }}
        >
          <span
            className={`block w-1.5 h-1.5 rounded-full ${
              isFlagged ? "bg-amber-500" : "bg-[var(--border)]"
            }`}
          />
          {isFlagged ? "Flagged" : "Review"}
        </button>
      )}
    </div>
  );
});

export default QuestionStatusBar;
