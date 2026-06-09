"use client";

import React, { memo, useMemo } from "react";
import ReactMarkdown from "react-markdown";

type Props = {
  id: string;
  stem: string;
  value: string;
  onChange: (value: string) => void;
};

// Memoized markdown components
const markdownComponents = {
  p: ({ node, ...props }: any) => (
    <p className="mb-2 last:mb-0 whitespace-pre-wrap" {...props} />
  ),
};

const FillInBlankCard = memo(function FillInBlankCard({ stem, value, onChange }: Props) {
  const text = useMemo(
    () => stem.replace(/\\n/g, "\n").replace(/\[blank[-_]\w+\]/gi, "____"),
    [stem]
  );

  return (
    <div className="rounded-[2rem] border-[3px] border-[var(--border)] bg-[var(--card)] p-5 shadow-[0_4px_0_rgba(0,0,0,0.08)]">
      <div className="text-[var(--foreground)] leading-relaxed font-bold mb-4">
        <ReactMarkdown components={markdownComponents}>
          {text}
        </ReactMarkdown>
      </div>

      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Write your answer here"
        className="w-full rounded-[1rem] border-[2px] border-b-[3px] border-[var(--border)] bg-[var(--background)] px-4 py-3 text-sm font-medium text-[var(--foreground)] placeholder:text-[var(--text-muted)] shadow-[0_3px_0_rgba(0,0,0,0.06)] transition-all duration-150 focus:outline-none focus:border-[var(--primary)] focus:bg-[var(--primary-light)] focus:shadow-[0_3px_0_var(--primary)]"
      />
    </div>
  );
});

export default FillInBlankCard;
