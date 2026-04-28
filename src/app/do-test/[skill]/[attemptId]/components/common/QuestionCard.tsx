"use client";

import React, { memo } from "react";
import ReactMarkdown from "react-markdown";

type Choice =
  | string
  | {
      value: string;
      label: string;
    };

// Memoized markdown components for clean rendering
const markdownComponents = {
  p: ({ node, ...props }: any) => (
    <span className="whitespace-pre-wrap" {...props} />
  ),
};

const QuestionCard = memo(function QuestionCard({
  question,
  selected,
  onSelect,
}: {
  question: { id: string; stem: string; choices: Choice[] };
  selected?: string;
  onSelect: (id: string, value: string) => void;
}) {
  return (
    <div className="rounded-[1.5rem] bg-white border-[3px] border-[var(--border)] p-5 shadow-[0_4px_0_rgba(0,0,0,0.08)] hover:shadow-md transition-shadow group">
      {/* Question Stem */}
      <div className="font-medium text-[var(--foreground)] mb-4 leading-relaxed">
        <ReactMarkdown components={markdownComponents}>
          {question.stem}
        </ReactMarkdown>
      </div>

      {/* Choice Options - Clean Radio Style */}
      <div className="space-y-2.5">
        {question.choices.map((c) => {
          const value = typeof c === "string" ? c : c.value;
          const label = typeof c === "string" ? c : c.label;
          const isActive = selected === value;

          return (
            <button
              key={value}
              onClick={() => onSelect(question.id, value)}
              className={`w-full text-left px-4 py-3 rounded-lg border transition-all duration-200 flex items-start gap-3 ${
                isActive
                  ? "border-[var(--primary)] bg-[var(--primary-light)] ring-2 ring-[var(--primary)]/20"
                  : "border-[var(--border)] hover:border-[var(--border)] hover:bg-[var(--background)]"
              }`}
            >
              {/* Radio Indicator */}
              <span
                className={`flex-shrink-0 mt-0.5 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                  isActive
                    ? "border-[var(--primary)] bg-[var(--primary)]"
                    : "border-[var(--border)] group-hover:border-[var(--text-muted)]"
                }`}
              >
                {isActive && (
                  <span className="block w-2 h-2 rounded-full bg-white" />
                )}
              </span>

              {/* Choice Label */}
              <span className={`flex-1 text-sm ${isActive ? "text-[var(--primary-hover)] font-medium" : "text-[var(--text-body)]"}`}>
                <ReactMarkdown components={markdownComponents}>
                  {label}
                </ReactMarkdown>
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
});

export default QuestionCard;
