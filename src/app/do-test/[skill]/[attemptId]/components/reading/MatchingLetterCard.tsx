"use client";

import React, { memo, useMemo, useCallback } from "react";
import ReactMarkdown from "react-markdown";

type Props = {
  id: string;
  stem: string;
  value: string;
  onChange: (value: string) => void;
};

const LETTERS = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J"];

const markdownComponents = {
  p: ({ node, ...props }: any) => (
    <p className="mb-2 last:mb-0 whitespace-pre-wrap" {...props} />
  ),
};

const MatchingLetterCard = memo(function MatchingLetterCard({ stem, value, onChange }: Props) {
  const handleSelect = useCallback(
    (letter: string) => {
      onChange(value === letter ? "" : letter);
    },
    [onChange, value]
  );

  const text = useMemo(() => stem.replace(/\\n/g, "\n"), [stem]);

  return (
    <div className="rounded-[2rem] border-[3px] border-[var(--border)] bg-[var(--card)] p-5 shadow-[0_4px_0_rgba(0,0,0,0.08)]">
      <div className="text-[var(--foreground)] leading-relaxed font-bold mb-4">
        <ReactMarkdown components={markdownComponents}>
          {text}
        </ReactMarkdown>
      </div>

      <div className="flex flex-wrap gap-2">
        {LETTERS.map((letter) => {
          const isSelected = value === letter;
          return (
            <button
              key={letter}
              type="button"
              onClick={() => handleSelect(letter)}
              className={`
                w-11 h-11 rounded-full font-bold text-sm
                border-b-[4px] transition-all duration-150
                ${
                  isSelected
                    ? "border-[var(--primary-dark)] bg-[var(--primary)] text-white shadow-[0_4px_0_var(--primary-dark)] scale-[0.97]"
                    : "border-[var(--border)] bg-[var(--background)] text-[var(--foreground)] shadow-[0_3px_0_rgba(0,0,0,0.08)] hover:-translate-y-[2px] hover:border-[var(--primary)] hover:text-[var(--primary)] active:translate-y-0 active:shadow-[0_1px_0_rgba(0,0,0,0.08)]"
                }
              `}
            >
              {letter}
            </button>
          );
        })}
      </div>
    </div>
  );
});

export default MatchingLetterCard;
