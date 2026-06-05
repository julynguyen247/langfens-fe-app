"use client";

import React, { memo, useMemo, useCallback } from "react";
import { motion } from "framer-motion";
import QuestionStatusBar from "../common/QuestionStatusBar";
import WorkbookCard from "../common/WorkbookCard";
import WorkbookInput from "../common/WorkbookInput";

type Props = {
  id: string;
  stem: string;
  values: string[];
  onChange: (blankIndex: number, value: string) => void;
  /** 1-based starting number for the first sub-question. */
  startIdx?: number;
  /** Optional label shown in the card's status bar. */
  rangeLabel?: string;
  /** Whether the group is flagged for review. */
  isFlagged?: boolean;
  /** Toggle the group's flagged state. */
  onToggleFlag?: () => void;
};

type Line = {
  kind: "text" | "blank";
  value: string;
  blankIndex?: number;
};

/**
 * NOTE_COMPLETION — sticky-note style.
 *
 * IELTS note-completion questions look like handwritten notes. We
 * parse the prompt the same way as the workbook view (numbered
 * sub-questions, inline `___` blanks) and render the result on a
 * yellow paper card with a slight rotation to evoke a real note.
 *
 * The card:
 *   - has a soft yellow background and a small "Note" tag in the
 *     top-right corner
 *   - uses the same `WorkbookInput` for every blank so the input
 *     style matches the rest of the test
 *   - still uses the shared `QuestionStatusBar` for "X / Y answered"
 *     and the Review toggle, so the global look is identical
 */
const NoteCompletionCard = memo(function NoteCompletionCard({
  id,
  stem,
  values,
  startIdx = 1,
  onChange,
  rangeLabel,
  isFlagged = false,
  onToggleFlag,
}: Props) {
  const lines = useMemo(() => parseNote(stem), [stem]);

  const handleChange = useCallback(
    (idx: number, value: string) => onChange(idx, value),
    [onChange]
  );

  const totalBlanks = lines.filter((l) => l.kind === "blank").length;
  const answeredBlanks = values.filter(
    (v) => (v ?? "").trim().length > 0
  ).length;
  const showStatusBar = !!rangeLabel || totalBlanks > 0 || !!onToggleFlag;

  if (lines.length === 0) {
    return (
      <div className="rounded-[1.5rem] border-[2px] border-[var(--border)] bg-white p-4 text-base text-[var(--foreground)] whitespace-pre-wrap">
        {stem.replace(/\\n/g, "\n")}
      </div>
    );
  }

  return (
    <WorkbookCard
      id={id}
      statusBar={
        showStatusBar ? (
          <QuestionStatusBar
            rangeLabel={rangeLabel}
            answeredCount={answeredBlanks}
            totalCount={totalBlanks}
            isFlagged={isFlagged}
            onToggleFlag={onToggleFlag}
          />
        ) : null
      }
    >
      <div
        className="relative px-4 sm:px-5 py-4"
        style={{
          background:
            "linear-gradient(180deg, rgba(254,243,199,0.55) 0%, rgba(254,243,199,0.20) 100%)",
        }}
      >
        {/* Sticky-note badge */}
        <span
          className="absolute top-3 right-3 inline-flex items-center gap-1 px-2 h-5 rounded-full bg-amber-200/80 text-amber-900 text-[10px] font-bold tracking-wider"
          style={{ fontFamily: "var(--font-heading)" }}
        >
          NOTE
        </span>

        <div className="space-y-2.5 pr-12">
          {lines.map((line, i) => {
            if (line.kind === "text") {
              return (
                <p
                  key={i}
                  className="text-[14px] text-[var(--foreground)] leading-[1.85] whitespace-pre-wrap"
                  style={{ fontFamily: "var(--font-body)" }}
                >
                  {line.value}
                </p>
              );
            }
            const idx = line.blankIndex!;
            const v = values[idx] ?? "";
            const isFirst = i === 0;
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2, delay: i * 0.03 }}
              >
                <WorkbookInput
                  numberLabel={startIdx + idx}
                  value={v}
                  onChange={(val) => handleChange(idx, val)}
                  placeholder={isFirst ? "Type your answer" : "Answer"}
                  ariaLabel={`Note answer ${idx + 1}`}
                  showTypeHint
                  showAnsweredBadge
                />
              </motion.div>
            );
          })}
        </div>
      </div>
    </WorkbookCard>
  );
});

function parseNote(stem: string): Line[] {
  const text = stem.replace(/\\n/g, "\n");
  const lines = text.split("\n");
  const out: Line[] = [];
  let blankIndex = 0;
  let nextSlot = 0;

  for (const raw of lines) {
    const line = raw.trim();
    if (!line) continue;

    // Drop a leading numbered marker — the surrounding card or list
    // already provides the question number via `startIdx`.
    const stripped = line.replace(/^\d+[\.\)\-:\s]+\s*/, "");

    const blankRe = /_{3,}/g;
    let last = 0;
    let m: RegExpExecArray | null;
    const segments: Line[] = [];
    while ((m = blankRe.exec(stripped)) !== null) {
      if (m.index > last) {
        segments.push({ kind: "text", value: stripped.slice(last, m.index) });
      }
      segments.push({ kind: "blank", value: "____", blankIndex: blankIndex++ });
      last = m.index + m[0].length;
    }
    if (last < stripped.length) {
      segments.push({ kind: "text", value: stripped.slice(last) });
    }
    if (segments.length === 0) continue;
    // If the line has no blanks, push as a single text line. If it has
    // blanks, push the segment list inline.
    if (segments.every((s) => s.kind === "text")) {
      out.push({ kind: "text", value: stripped });
      nextSlot = blankIndex;
    } else {
      out.push(...segments);
    }
  }

  return out;
}

export default NoteCompletionCard;
