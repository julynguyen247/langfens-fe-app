"use client";

import React, { memo, useMemo, useCallback } from "react";
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

type Field = {
  /** Field label (e.g. "Name:", "Course title:") — shown in a sticky column. */
  label: string;
  /** Optional placeholder hint inside the input. */
  placeholder?: string;
  /** The blank slot this row owns in the `values` array. */
  blankIndex: number;
};

const LABEL_RE = /^([A-Z][A-Za-z0-9 ()/&.'-]{0,40})\s*[:\-]\s*$/;

/**
 * FORM_COMPLETION — workbook style with a sticky label column.
 *
 * IELTS form-completion questions look like a printed form with one
 * labeled row per blank. This card parses the prompt for any of these
 * shapes (first match wins):
 *
 *   1. "Field: ____" pairs split by newlines — each line carries a
 *      label and an inline blank.
 *   2. A `Form:` marker followed by a comma-separated list of fields
 *      (e.g. `Form: Name, Address, Postcode`).
 *   3. A plain numbered list — same fallback the legacy
 *      CompletionCard used.
 *
 * The output is a labelled grid (label on the left, blank on the
 * right) so the form structure is obvious at a glance.
 */
const FormCompletionCard = memo(function FormCompletionCard({
  id,
  stem,
  values,
  startIdx = 1,
  onChange,
  rangeLabel,
  isFlagged = false,
  onToggleFlag,
}: Props) {
  const { instruction, fields } = useMemo(() => parseForm(stem), [stem]);

  const handleChange = useCallback(
    (idx: number, value: string) => onChange(idx, value),
    [onChange]
  );

  const totalBlanks = fields.length;
  const answeredBlanks = values.filter(
    (v) => (v ?? "").trim().length > 0
  ).length;
  const showStatusBar = !!rangeLabel || totalBlanks > 0 || !!onToggleFlag;

  if (totalBlanks === 0) {
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
      {instruction && (
        <p
          className="px-4 sm:px-5 pt-3 pb-3 text-[14px] font-semibold text-[var(--foreground)] leading-relaxed"
          style={{ fontFamily: "var(--font-heading)" }}
        >
          {instruction}
        </p>
      )}

      <div className="px-4 sm:px-5 pb-4">
        <div className="rounded-[1.25rem] border-[2px] border-[var(--border)] bg-white overflow-hidden">
          {fields.map((field, idx) => {
            const isLast = idx === fields.length - 1;
            return (
              <div
                key={`${field.blankIndex}-${field.label}`}
                className={[
                  "grid grid-cols-[minmax(7rem,max-content)_1fr] sm:grid-cols-[10rem_1fr] items-center gap-3 px-3 sm:px-4 py-2.5",
                  isLast ? "" : "border-b border-dashed border-[var(--border)]",
                ].join(" ")}
              >
                <span
                  className="text-[13px] font-bold text-[var(--text-body)]"
                  style={{ fontFamily: "var(--font-heading)" }}
                >
                  {field.label}
                </span>
                <WorkbookInput
                  numberLabel={startIdx + field.blankIndex}
                  value={values[field.blankIndex] ?? ""}
                  onChange={(v) => handleChange(field.blankIndex, v)}
                  placeholder={field.placeholder ?? "Answer"}
                  ariaLabel={`${field.label} answer`}
                  showTypeHint
                  showAnsweredBadge
                />
              </div>
            );
          })}
        </div>
      </div>
    </WorkbookCard>
  );
});

function parseForm(stem: string): { instruction: string; fields: Field[] } {
  const text = stem.replace(/\\n/g, "\n");
  const lines = text.split("\n");

  // 1) Label: ____ pairs (the canonical IELTS form layout).
  const fields: Field[] = [];
  let instruction = "";
  let blankIndex = 0;
  for (const raw of lines) {
    const line = raw.trim();
    if (!line) continue;
    const labelMatch = line.match(LABEL_RE);
    if (labelMatch && /_{2,}/.test(line)) {
      const label = labelMatch[1].trim();
      fields.push({ label: `${label}:`, blankIndex: blankIndex++ });
      continue;
    }
    if (fields.length === 0) {
      instruction = instruction ? `${instruction} ${line}` : line;
    } else {
      // Stray content after we already started collecting fields —
      // append to the instruction as a footnote.
      instruction = instruction ? `${instruction} ${line}` : line;
    }
  }
  if (fields.length > 0) return { instruction, fields };

  // 2) `Form:` marker.
  const marker = text.match(/(?:^|\n)\s*Form\s*:\s*([^\n]+)/i);
  if (marker) {
    const names = marker[1]
      .split(/[,\u3001]\s*|\s{2,}/)
      .map((s) => s.trim())
      .filter(Boolean);
    if (names.length > 0) {
      const list: Field[] = names.map((label, i) => ({
        label: `${label}:`,
        blankIndex: i,
      }));
      return { instruction: "Complete the form below.", fields: list };
    }
  }

  // 3) Plain numbered list fallback.
  const numbered = lines
    .map((l) => l.trim())
    .filter((l) => /^\d+[\.\)\-:]\s+/.test(l));
  if (numbered.length > 0) {
    const list: Field[] = numbered.map((line, i) => ({
      label: `Question ${i + 1}:`,
      blankIndex: i,
    }));
    return { instruction: "Complete the form.", fields: list };
  }

  return { instruction, fields: [] };
}

export default FormCompletionCard;
