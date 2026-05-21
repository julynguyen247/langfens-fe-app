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
    <div className="border border-[var(--border)] rounded-[2rem] p-4 space-y-3 bg-[var(--card)]">
      <div className="text-[var(--foreground)] leading-relaxed font-bold">
        <ReactMarkdown components={markdownComponents}>
          {text}
        </ReactMarkdown>
      </div>

      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Write your answer here"
        className="mt-1 w-full rounded-[2rem] border border-[var(--border)] px-3 py-2 text-sm
                   focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-[var(--primary)] text-[var(--foreground)]"
      />
    </div>
  );
});

export default FillInBlankCard;
