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
  const text = promptMd.replace(/\\n/g, "\n");
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
    <div className="border border-slate-200 rounded-lg p-4 space-y-3 bg-white">
      {instructionMd && (
        <div className="text-slate-700 text-sm leading-relaxed">
          <ReactMarkdown components={instructionComponents}>
            {instructionMd}
          </ReactMarkdown>
        </div>
      )}

      <div className="text-slate-900 font-semibold leading-7 whitespace-pre-wrap">
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

          return (
            <input
              key={i}
              value={values[currentBlankIndex] ?? ""}
              onChange={(e) => onChange(currentBlankIndex, e.target.value)}
              className="inline-block align-baseline mx-1 w-[14ch] rounded-md border border-slate-300 px-2 py-1 text-sm
                         focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black"
              placeholder=""
            />
          );
        })}
      </div>
    </div>
  );
});

export default SummaryCompletionCard;
