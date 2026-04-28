"use client";

import React, { memo, useMemo } from "react";
import ReactMarkdown from "react-markdown";

interface YesNoNotGivenCardProps {
  id: string;
  stem: string;
  value: string;
  onChange: (value: "YES" | "NO" | "NOT_GIVEN") => void;
  isReviewMode?: boolean;
}

type SelectionValue = "YES" | "NO" | "NOT_GIVEN";

const OPTIONS: { value: SelectionValue; label: string; shortLabel: string }[] = [
  { value: "YES", label: "YES", shortLabel: "Y" },
  { value: "NO", label: "NO", shortLabel: "N" },
  { value: "NOT_GIVEN", label: "NOT GIVEN", shortLabel: "NG" },
];

// Memoized markdown components
const markdownComponents = {
  p: ({ node, ...props }: any) => (
    <span className="whitespace-pre-wrap" {...props} />
  ),
};

/**
 * Specialized question card for Yes/No/Not Given questions.
 * Displays three large, tappable buttons for selection.
 */
const YesNoNotGivenCard = memo(function YesNoNotGivenCard({
  id,
  stem,
  value,
  onChange,
  isReviewMode = false,
}: YesNoNotGivenCardProps) {
  const selectedValue = useMemo(() => {
    if (!value) return null;
    const upper = value.toUpperCase();
    if (upper === "YES" || upper === "Y") return "YES";
    if (upper === "NO" || upper === "N") return "NO";
    if (upper === "NOT_GIVEN" || upper === "NG" || upper === "NOTGIVEN") return "NOT_GIVEN";
    return null;
  }, [value]);

  const getOptionClass = (optionValue: SelectionValue) => {
    const isSelected = selectedValue === optionValue;

    if (isSelected) {
      switch (optionValue) {
        case "YES":
          return "bg-emerald-500 text-white border-emerald-600 ring-2 ring-emerald-500/30";
        case "NO":
          return "bg-red-500 text-white border-red-600 ring-2 ring-red-500/30";
        case "NOT_GIVEN":
          return "bg-[var(--primary)] text-white border-[var(--primary-dark)] ring-2 ring-[var(--primary)]/30";
      }
    }

    return "bg-white text-[var(--text-body)] border-[var(--border)] hover:border-[var(--primary)] hover:bg-[var(--primary-light)]/30";
  };

  return (
    <div className="rounded-[1.5rem] bg-white border-[3px] border-[var(--border)] p-5 shadow-[0_4px_0_rgba(0,0,0,0.08)]">
      {/* Question Stem */}
      <div className="font-medium text-[var(--foreground)] mb-5 leading-relaxed">
        <ReactMarkdown components={markdownComponents}>
          {stem}
        </ReactMarkdown>
      </div>

      {/* Selection Buttons */}
      <div className="flex flex-col sm:flex-row gap-3">
        {OPTIONS.map((option) => (
          <button
            key={option.value}
            onClick={() => onChange(option.value)}
            disabled={isReviewMode}
            className={`
              flex-1 py-4 px-6 rounded-xl border-[3px] font-bold text-base
              transition-all duration-200 flex items-center justify-center gap-3
              ${getOptionClass(option.value)}
              ${isReviewMode ? "cursor-not-allowed opacity-80" : "cursor-pointer active:scale-[0.98]"}
            `}
            aria-pressed={selectedValue === option.value}
            aria-label={`Select ${option.label}`}
          >
            {/* Checkmark for selected */}
            {selectedValue === option.value && (
              <span className="w-5 h-5 rounded-full bg-white/30 flex items-center justify-center">
                <svg
                  className="w-3 h-3 text-white"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={3}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </span>
            )}
            <span>{option.label}</span>
          </button>
        ))}
      </div>

      {/* Helper text */}
      {!selectedValue && !isReviewMode && (
        <p className="mt-3 text-xs text-[var(--text-muted)] text-center">
          Tap to select your answer
        </p>
      )}
    </div>
  );
});

export default YesNoNotGivenCard;
