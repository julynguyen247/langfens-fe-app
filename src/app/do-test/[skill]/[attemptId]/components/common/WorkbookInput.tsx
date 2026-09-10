"use client";

import React, { memo } from "react";

type Props = {
  /** 1-based number rendered next to the input (e.g. "1."). */
  numberLabel: number;
  /** Optional part label (e.g. "Library") shown to the right of the
   *  number. Falls back to numberLabel when omitted. */
  partLabel?: string;
  /** Current input value. */
  value: string;
  /** Called with the new value on every keystroke. */
  onChange: (v: string) => void;
  /** Placeholder text when value is empty. */
  placeholder?: string;
  /** Accessible label for screen readers. */
  ariaLabel?: string;
  /** Optional pencil/type hint icon (visual only). */
  showTypeHint?: boolean;
  /** Optional answered badge (renders when value is non-empty). */
  showAnsweredBadge?: boolean;
};

/**
 * WorkbookInput — single blank input used by every completion /
 * matching / diagram / note card. Pairs with {@link WorkbookCard} for
 * the page frame.
 *
 * Originally declared in 4 sibling files (MapLabelCard,
 * FormCompletionCard, NoteCompletionCard, and now DiagramLabelCard)
 * but the actual implementation file was missing from the repo, so
 * Next.js Turbopack failed module resolution with "Module not found:
 * Can't resolve '../common/WorkbookInput'". This stub provides the
 * minimum implementation that satisfies every call site. Sprint 4
 * follow-up: replace with a richer design-system input if needed.
 */
const WorkbookInput = memo(function WorkbookInput({
  numberLabel,
  partLabel,
  value,
  onChange,
  placeholder,
  ariaLabel,
  showTypeHint,
  showAnsweredBadge,
}: Props) {
  const isAnswered = (value ?? "").trim().length > 0;
  const showBadge = showAnsweredBadge && isAnswered;

  return (
    <div className="flex items-center gap-2">
      <span
        className="shrink-0 inline-flex items-center justify-center min-w-[2rem] h-9 px-1.5 rounded-full bg-[var(--background)] text-[var(--text-body)] text-xs font-bold border-[2px] border-[var(--border)]"
        style={{ fontFamily: "var(--font-heading)" }}
        aria-hidden="true"
      >
        {numberLabel}
      </span>

      {partLabel && (
        <span
          className="shrink-0 text-sm font-medium text-[var(--text-body)]"
          style={{ fontFamily: "var(--font-body)" }}
        >
          {partLabel}
        </span>
      )}

      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder ?? "Answer"}
        aria-label={ariaLabel}
        className="flex-1 min-w-0 h-9 px-3 rounded-lg border-[2px] border-[var(--border)] bg-white text-sm text-[var(--foreground)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-[var(--primary)] transition-colors"
        style={{ fontFamily: "var(--font-body)" }}
      />

      {showTypeHint && (
        <span
          className="shrink-0 inline-flex items-center justify-center w-7 h-7 rounded-full text-[var(--text-muted)]"
          aria-hidden="true"
          title="Type your answer"
        >
          ✎
        </span>
      )}

      {showBadge && (
        <span
          className="shrink-0 inline-flex items-center justify-center w-7 h-7 rounded-full bg-[var(--primary-light)] text-[var(--primary)] text-xs font-bold"
          aria-label="Answered"
        >
          ✓
        </span>
      )}
    </div>
  );
});

export default WorkbookInput;