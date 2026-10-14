"use client";

import { useMemo } from "react";
import ReactMarkdown, { type Components } from "react-markdown";

export interface StatementOption<Value extends string> {
  value: Value;
  label: string;
  aliases: readonly string[];
  selectedClassName: string;
}

export interface StatementChoiceCardProps<Value extends string> {
  id: string;
  stem: string;
  value: string;
  onChange: (value: Value) => void;
  isReviewMode?: boolean;
}

const markdownComponents: Components = {
  p: ({ node, ...props }) => (
    <span className="whitespace-pre-wrap" {...props} />
  ),
};

export function StatementChoiceCard<Value extends string>({
  stem,
  value,
  onChange,
  isReviewMode = false,
  options,
}: StatementChoiceCardProps<Value> & { options: readonly StatementOption<Value>[] }) {
  const selectedValue = useMemo(() => {
    if (!value) return null;
    const upper = value.toUpperCase();
    return options.find((option) => option.aliases.includes(upper))?.value ?? null;
  }, [value, options]);

  const getOptionClass = (optionValue: Value) => {
    if (selectedValue === optionValue) {
      return options.find((option) => option.value === optionValue)!.selectedClassName;
    }
    return "bg-[var(--card)] text-[var(--text-body)] border-[var(--border)] hover:border-[var(--primary)] hover:bg-[var(--primary-light)]/30";
  };

  return (
    <div className="rounded-[2rem] bg-[var(--card)] border-[3px] border-[var(--border)] p-5 shadow-[0_4px_0_rgba(0,0,0,0.08)]">
      {/* Question Stem */}
      <div className="font-medium text-[var(--foreground)] mb-5 leading-relaxed">
        <ReactMarkdown components={markdownComponents}>
          {stem}
        </ReactMarkdown>
      </div>

      {/* Selection Buttons */}
      <div className="flex flex-col sm:flex-row gap-3">
        {options.map((option) => (
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
}
