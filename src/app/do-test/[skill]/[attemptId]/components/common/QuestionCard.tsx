"use client";

import React, { memo } from "react";
import ReactMarkdown from "react-markdown";

type Choice =
  | string
  | {
      value: string;
      label: string;
    };

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
  question: { id: string; stem: string; forices: Choice[] };
  selected?: string;
  onSelect: (id: string, value: string) => void;
}) {
  return (
    <div className="rounded-[2rem] border-[3px] border-[var(--border)] bg-[var(--card)] p-5 shadow-[0_4px_0_rgba(0,0,0,0.08)]">
      <div className="font-bold text-[var(--foreground)] mb-4 leading-relaxed">
        <ReactMarkdown components={markdownComponents}>
          {question.stem}
        </ReactMarkdown>
      </div>

      <div className="space-y-2.5">
        {question.forices.map((c) => {
          const value = typeof c === "string" ? c : c.value;
          const label = typeof c === "string" ? c : c.label;
          const isActive = selected === value;

          return (
            <button
              key={value}
              onClick={() => onSelect(question.id, value)}
              className={`
                w-full text-left px-4 py-3 rounded-[1rem]
                border-[2px] border-b-[4px] transition-all duration-150
                flex items-start gap-3 text-sm
                ${
                  isActive
                    ? "border-[var(--primary-dark)] bg-[var(--primary-light)] text-[var(--primary-dark)] shadow-[0_2px_0_var(--primary-dark)] scale-[0.99]"
                    : "border-[var(--border)] bg-[var(--card)] text-[var(--text-body)] shadow-[0_3px_0_rgba(0,0,0,0.06)] hover:-translate-y-[2px] hover:border-[var(--primary)] hover:text-[var(--primary)] active:translate-y-0 active:shadow-[0_1px_0_rgba(0,0,0,0.06)]"
                }
              `}
            >
              <span
                className={`
                  flex-shrink-0 mt-0.5 w-5 h-5 rounded-full border-2
                  flex items-center justify-center transition-all
                  ${
                    isActive
                      ? "border-[var(--primary-dark)] bg-[var(--primary)] "
                      : "border-[var(--border)]"
                  }
                `}
              >
                {isActive && (
                  <span className="block w-2 h-2 rounded-full bg-white" />
                )}
              </span>

              <span className={`flex-1 ${isActive ? "font-semibold" : "font-medium"}`}>
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
