"use client";

import React, { memo } from "react";
import ReactMarkdown from "react-markdown";

type Choice =
  | string
  | {
      value: string;
      label: string;
    };

// Material Icon Component
function Icon({ name, className = "" }: { name: string; className?: string }) {
  return <span className={`material-symbols-rounded ${className}`}>{name}</span>;
}

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
    <div className="rounded-xl bg-white border border-slate-200 p-5 shadow-sm hover:shadow-md transition-shadow group">
      {/* Question Stem */}
      <div className="font-medium text-slate-800 mb-4 leading-relaxed">
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
                  ? "border-[#3B82F6] bg-[#EFF6FF] ring-2 ring-blue-500/20"
                  : "border-slate-200 hover:border-slate-300 hover:bg-slate-50"
              }`}
            >
              {/* Radio Indicator */}
              <span
                className={`flex-shrink-0 mt-0.5 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                  isActive
                    ? "border-[#3B82F6] bg-[#3B82F6]"
                    : "border-slate-300 group-hover:border-slate-400"
                }`}
              >
                {isActive && (
                  <Icon name="check" className="text-[14px] text-white" />
                )}
              </span>
              
              {/* Choice Label */}
              <span className={`flex-1 text-sm ${isActive ? "text-[#1D4ED8] font-medium" : "text-slate-700"}`}>
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
