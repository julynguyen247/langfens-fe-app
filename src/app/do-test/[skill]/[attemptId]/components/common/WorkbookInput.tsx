"use client";

import { memo } from "react";

interface WorkbookInputProps {
  numberLabel?: number;
  partLabel?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  ariaLabel?: string;
  showTypeHint?: boolean;
  showAnsweredBadge?: boolean;
}

const WorkbookInput = memo(function WorkbookInput({
  numberLabel,
  partLabel,
  value,
  onChange,
  placeholder = "Answer",
  ariaLabel,
  showTypeHint = false,
  showAnsweredBadge = false,
}: WorkbookInputProps) {
  const isAnswered = value.trim().length > 0;

  return (
    <div className="flex items-center gap-2">
      {numberLabel !== undefined && (
        <span
          className="shrink-0 inline-flex items-center justify-center min-w-[2rem] h-9 px-1.5 rounded-full bg-[var(--background)] text-[var(--text-body)] text-xs font-bold border-[2px] border-[var(--border)]"
          style={{ fontFamily: "var(--font-heading)" }}
          aria-hidden="true"
        >
          {numberLabel}
        </span>
      )}

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
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
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

      {showAnsweredBadge && isAnswered && (
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
