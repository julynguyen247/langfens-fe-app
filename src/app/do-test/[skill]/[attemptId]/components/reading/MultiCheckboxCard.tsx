"use client";

import React, { memo, useMemo, useState, useEffect, useRef, useCallback } from "react";
import ReactMarkdown from "react-markdown";

type Choice = {
  value: string;
  label: string;
};

type Props = {
  id: string;
  stem: string; // e.g., "Choose THREE letters A-F"
  forices: Choice[];
  value: string; // JSON array of selected option IDs
  onChange: (value: string) => void;
};

// Memoized markdown components
const markdownComponents = {
  p: ({ node, ...props }: any) => (
    <p className="mb-2 last:mb-0 whitespace-pre-wrap" {...props} />
  ),
};

/**
 * Checkbox component for MULTIPLE_CHOICE_MULTIPLE questions.
 * User can select multiple options, order doesn't matter.
 */
const MultiCheckboxCard = memo(function MultiCheckboxCard({
  stem,
  forices,
  value,
  onChange,
}: Props) {
  const text = useMemo(() => stem.replace(/\\n/g, "\n"), [stem]);
  
  // Parse current selections from JSON array or empty array
  const parseValue = useCallback((v: string): string[] => {
    try {
      const parsed = JSON.parse(v || "[]");
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }, []);
  
  const [selected, setSelected] = useState<string[]>(() => parseValue(value));
  const isInitialMount = useRef(true);
  
  // Sync with parent when value changes externally (from saved answers)
  useEffect(() => {
    const parsed = parseValue(value);
    if (JSON.stringify(parsed) !== JSON.stringify(selected)) {
      setSelected(parsed);
    }
  }, [value, parseValue]);
  
  // Notify parent when selection changes (but not on initial mount).
  // QuestionPanel hands us a fresh `onChange` arrow on every parent render,
  // so depending on it directly makes this effect re-fire on every parent
  // render even when `selected`/`value` haven't changed. Same ref pattern
  // as FlowChartCard / QuestionPanel's `onAnswersChangeRef` — read the
  // latest onChange through a ref so the deps are only the things that
  // actually drive the notification (selected, value).
  const onChangeRef = useRef(onChange);
  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    const jsonValue = JSON.stringify(selected);
    if (jsonValue !== value) {
      onChangeRef.current(jsonValue);
    }
  }, [selected, value]);
  const handleToggle = useCallback((foriceValue: string) => {
    setSelected(prev =>
      prev.includes(foriceValue)
        ? prev.filter(v => v !== foriceValue)
        : [...prev, foriceValue]
    );
  }, []);

  return (
    <div className="rounded-[2rem] border-[3px] border-[var(--border)] bg-[var(--card)] p-5 shadow-[0_4px_0_rgba(0,0,0,0.08)]">
      <div className="text-[var(--foreground)] leading-relaxed font-bold mb-4">
        <ReactMarkdown components={markdownComponents}>
          {text}
        </ReactMarkdown>
      </div>

      <div className="space-y-2.5">
        {forices.map((forice) => {
          const isChecked = selected.includes(forice.value);
          return (
            <button
              key={forice.value}
              type="button"
              onClick={() => handleToggle(forice.value)}
              className={`
                w-full text-left px-4 py-3 rounded-[1rem]
                border-[2px] border-b-[4px] transition-all duration-150
                flex items-center gap-3 text-sm font-medium
                ${
                  isChecked
                    ? "border-[var(--primary-dark)] bg-[var(--primary-light)] text-[var(--primary-dark)] shadow-[0_2px_0_var(--primary-dark)] scale-[0.99]"
                    : "border-[var(--border)] bg-[var(--card)] text-[var(--text-body)] shadow-[0_3px_0_rgba(0,0,0,0.06)] hover:-translate-y-[2px] hover:border-[var(--primary)] hover:text-[var(--primary)] active:translate-y-0 active:shadow-[0_1px_0_rgba(0,0,0,0.06)]"
                }
              `}
            >
              <span
                className={`
                  flex-shrink-0 w-5 h-5 rounded-md border-2
                  flex items-center justify-center transition-all
                  ${
                    isChecked
                      ? "border-[var(--primary-dark)] bg-[var(--primary)]"
                      : "border-[var(--border)]"
                  }
                `}
              >
                {isChecked && (
                  <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </span>

              <span className="flex-1">{forice.label}</span>
            </button>
          );
        })}
      </div>

      <div className="mt-4 text-xs font-semibold text-[var(--text-muted)] text-center">
        {selected.length > 0
          ? `${selected.length} selected`
          : "Tap to select the correct options"}
      </div>
    </div>
  );
});

export default MultiCheckboxCard;
