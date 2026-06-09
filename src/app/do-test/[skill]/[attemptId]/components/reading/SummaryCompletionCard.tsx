"use client";

import React, { memo, useMemo } from "react";
import ReactMarkdown from "react-markdown";

type Props = {
  id: string;
  stem: string;
  values: string[];
  onChange: (blankIndex: number, value: string) => void;
};

function splitInstructionAndNotes(promptMd: string) {
  const text = (promptMd ?? "").replace(/\\n/g, "\n");
  const re = /answer sheet\.?/i;
  const m = re.exec(text);

  let instruction = "";
  let notes = text;

  if (m && m.index !== undefined) {
    const cut = m.index + m[0].length;
    instruction = text.slice(0, cut).trim();
    notes = text.slice(cut).trim();
  }

  const instructionMd = instruction
    .replace(/_{3,}/g, "____")
    .replace(/\(\.\{3\}\)/g, "(...)");

  return { instructionMd, notesRaw: notes };
}

function tokenizeNotes(notes: string) {
  const s = notes.replace(/\\n/g, "\n");
  const tokens: Array<{ type: "text"; value: string } | { type: "blank" }> = [];
  const re = /_{3,}/g;

  let last = 0;
  let m: RegExpExecArray | null;

  while ((m = re.exec(s)) !== null) {
    if (m.index > last) {
      tokens.push({ type: "text", value: s.slice(last, m.index) });
    }
    tokens.push({ type: "blank" });
    last = m.index + m[0].length;
  }

  if (last < s.length) {
    tokens.push({ type: "text", value: s.slice(last) });
  }

  return tokens;
}

// Memoized markdown components
const instructionComponents = {
  p: ({ ...props }: any) => (
    <p className="mb-2 last:mb-0 whitespace-pre-wrap" {...props} />
  ),
};

const textComponents = {
  p: ({ ...props }: any) => (
    <span className="whitespace-pre-wrap" {...props} />
  ),
};

const SummaryCompletionCard = memo(function SummaryCompletionCard({
  stem,
  values,
  onChange,
}: Props) {
  const { instructionMd, notesRaw } = useMemo(
    () => splitInstructionAndNotes(stem),
    [stem]
  );
  const tokens = useMemo(() => tokenizeNotes(notesRaw), [notesRaw]);

  let blankIndex = -1;

  return (
    <div className="rounded-[2rem] border-[3px] border-[var(--border)] bg-[var(--card)] p-5 shadow-[0_4px_0_rgba(0,0,0,0.08)]">
      {instructionMd && (
        <div className="text-[var(--text-body)] text-sm leading-relaxed mb-3">
          <ReactMarkdown components={instructionComponents}>
            {instructionMd}
          </ReactMarkdown>
        </div>
      )}

      <div className="text-[var(--foreground)] font-semibold leading-7 whitespace-pre-wrap">
        {tokens.map((t, i) => {
          if (t.type === "text") {
            return (
              <ReactMarkdown
                key={i}
                components={textComponents}
              >
                {t.value}
              </ReactMarkdown>
            );
          }

          blankIndex += 1;
          const currentBlankIndex = blankIndex;
          const hasValue = !!values[currentBlankIndex];

          return (
            <input
              key={i}
              value={values[currentBlankIndex] ?? ""}
              onChange={(e) => onChange(currentBlankIndex, e.target.value)}
              className={`inline-block align-baseline mx-1 w-[14ch] rounded-full border-[2px] border-b-[3px] px-3 py-1.5 text-sm font-medium transition-all duration-150 focus:outline-none ${
                hasValue
                  ? "border-[var(--primary-dark)] bg-[var(--primary-light)] text-[var(--primary-dark)] shadow-[0_2px_0_var(--primary-dark)]"
                  : "border-[var(--border)] bg-[var(--background)] text-[var(--foreground)] shadow-[0_2px_0_rgba(0,0,0,0.06)] focus:border-[var(--primary)] focus:bg-[var(--primary-light)] focus:shadow-[0_2px_0_var(--primary)]"
              }`}
              placeholder=""
            />
          );
        })}
      </div>
    </div>
  );
});

export default SummaryCompletionCard;
