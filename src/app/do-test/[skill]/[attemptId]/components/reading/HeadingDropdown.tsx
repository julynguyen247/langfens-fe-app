"use client";

import React, { memo, useMemo } from "react";
import ReactMarkdown from "react-markdown";

type HeadingOption = {
  id?: string;
  idx?: number;
  contentMd: string;
};

type Props = {
  id: string;
  stem: string;
  options: HeadingOption[];
  value: string;
  onChange: (value: string) => void;
};

const markdownComponents = {
  p: ({ node, ...props }: any) => (
    <p className="mb-2 last:mb-0 whitespace-pre-wrap" {...props} />
  ),
};

const HeadingDropdown = memo(function HeadingDropdown({
  stem,
  options,
  value,
  onChange,
}: Props) {
  const text = useMemo(() => stem.replace(/\\n/g, "\n"), [stem]);

  const parsedOptions = useMemo(
    () =>
      options.map((opt, idx) => {
        const romanNumeral = opt.contentMd.split(".")[0].trim();
        const headingText = opt.contentMd.replace(/^[ivx]+\.\s*/i, "");
        return {
          key: opt.id || idx,
          value: romanNumeral,
          label: romanNumeral,
          headingText,
        };
      }),
    [options]
  );

  return (
    <div className="rounded-[2rem] border-[3px] border-[var(--border)] bg-[var(--card)] p-5 shadow-[0_4px_0_rgba(0,0,0,0.08)]">
      <div className="text-[var(--foreground)] leading-relaxed font-bold mb-4">
        <ReactMarkdown components={markdownComponents}>
          {text}
        </ReactMarkdown>
      </div>

      <div className="flex flex-col gap-2">
        {parsedOptions.map((opt) => {
          const isSelected = value === opt.value;
          return (
            <button
              key={opt.key}
              type="button"
              onClick={() => onChange(isSelected ? "" : opt.value)}
              className={`
                w-full text-left rounded-[1rem] border-[2px] border-b-[4px] px-4 py-3
                transition-all duration-150 font-medium text-sm
                ${
                  isSelected
                    ? "border-[var(--primary-dark)] bg-[var(--primary-light)] text-[var(--primary-dark)] shadow-[0_2px_0_var(--primary-dark)] scale-[0.99]"
                    : "border-[var(--border)] bg-[var(--card)] text-[var(--foreground)] shadow-[0_3px_0_rgba(0,0,0,0.06)] hover:-translate-y-[2px] hover:border-[var(--primary)] hover:text-[var(--primary)] active:translate-y-0 active:shadow-[0_1px_0_rgba(0,0,0,0.06)]"
                }
              `}
            >
              <span className="font-bold mr-2">{opt.label}.</span>
              {opt.headingText}
            </button>
          );
        })}
      </div>
    </div>
  );
});

export default HeadingDropdown;
