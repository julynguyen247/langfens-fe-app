"use client";

import { useMemo } from "react";
import { UserAnswerValue } from "../../_lib/types";
import { parseBracketedBlanks } from "../../../../_lib/parseBlankTokens";

interface CompletionCardProps {
  blankAcceptTexts?: Record<string, string[] | null> | null;
  blankAcceptRegex?: Record<string, string[] | null> | null;
  promptMd?: string | null;
  imageUrl?: string | null;
  value?: UserAnswerValue;
  onChange: (val: UserAnswerValue) => void;
}

interface BlankLine {
  /** Stable 1-indexed display number for the candidate. */
  displayNumber: number;
  /** Underlying dict key (e.g. "1", "2", "feature-q1"). Drives onChange. */
  key: string;
  /** Free-text statement shown next to the input. */
  label: string;
  /** Plain-text hint shown when no label text exists (e.g. "Notes for the blank"). */
  placeholder: string;
}

function computeBlankLines(
  promptMd: string | null | undefined,
  blankKeys: string[]
): BlankLine[] {
  const text = (promptMd || "").replace(/\\n/g, "\n");
  // Map: "{key}" -> the label text that appears before the [N] placeholder.
  const labelByKey = new Map<string, string>();

  // Pass 1: numbered lines like "26. Founded: [26] century BCE"
  const numberedLine = /^(\d+)[.\)]\s*(.*)$/gm;
  let m: RegExpExecArray | null;
  while ((m = numberedLine.exec(text)) !== null) {
    const rest = m[2].trim();
    const inlineMatch = rest.match(/^(.*?)\s*\[(\d+)\](.*)$/);
    if (inlineMatch) {
      const before = inlineMatch[1].trim().replace(/[:\-]\s*$/, "");
      const after = inlineMatch[3].trim();
      if (before) labelByKey.set(inlineMatch[2], before);
      else if (after) labelByKey.set(inlineMatch[2], after);
    }
  }

  // Pass 2: scan every line for inline patterns like "Field: [N]" or "• Label [N]"
  // This handles Form/Note completion where content isn't on numbered prefix lines.
  // Pattern: anything before [N] on the same line segment (split by • or newline).
  const segments = text.split(/[\n•]/);
  for (const seg of segments) {
    const segMatch = seg.match(/^(.*?)\s*\[(\d+)\]\s*(.*)$/);
    if (!segMatch) continue;
    const key = segMatch[2];
    if (labelByKey.has(key)) continue; // pass 1 already resolved this key
    const before = segMatch[1].trim().replace(/[:\-]\s*$/, "");
    const after = segMatch[3].trim().replace(/\s*\[\d+\].*/g, ""); // stop at next placeholder
    if (before) labelByKey.set(key, before);
    else if (after) labelByKey.set(key, after);
  }

  // Build the candidate-facing list. We need to handle three layouts:
  //   (1) Blank keys derived from blankAcceptTexts (canonical case).
  //   (2) Blank keys derived from [N] markers in promptMd (live test).
  // We always present the blanks in numeric (1-indexed) order.
  const sortedKeys = [...blankKeys].sort((a, b) => {
    const na = Number(a);
    const nb = Number(b);
    if (!Number.isNaN(na) && !Number.isNaN(nb)) return na - nb;
    return a.localeCompare(b);
  });

  return sortedKeys.map((key, idx) => {
    const numeric = Number(key);
    const displayNumber = Number.isNaN(numeric) ? idx + 1 : numeric;
    const label = labelByKey.get(key) ?? "";
    const placeholder = label
      ? `Type answer for blank [${displayNumber}]`
      : `Notes for the blank`;
    return { displayNumber, key, label, placeholder };
  });
}

export function CompletionCard({
  blankAcceptTexts,
  promptMd,
  imageUrl,
  value,
  onChange,
}: CompletionCardProps) {
  const texts = blankAcceptTexts || {};
  let blankKeys = Object.keys(texts).sort((a, b) => {
    const na = Number(a);
    const nb = Number(b);
    if (!Number.isNaN(na) && !Number.isNaN(nb)) return na - nb;
    return String(a).localeCompare(String(b));
  });

  // Phase 2 (S32) cutover — the legacy `___` underscore fallback was retired.
  // The DB now ships every completion-family question in `[N]` format (no underscores).
  // This branch handles (a) [N] placeholders directly in the prompt body,
  // and (b) `[Diagram: a, b, c, d]` / `[Map: ...]` — word-bank list for
  // DIAGRAM_LABEL / MAP_LABEL (live-snapshot path where BlankAccepts are stripped).
  if (blankKeys.length === 0 && promptMd) {
    const bracketKeys = parseBracketedBlanks(promptMd);
    if (bracketKeys.length > 0) {
      blankKeys = bracketKeys;
    } else {
      const labelListMatch = promptMd.match(/\[(Diagram|Map):\s*([^\]]+)\]/i);
      if (labelListMatch) {
        const labels = labelListMatch[2]
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean);
        if (labels.length > 0) {
          blankKeys = labels.map((_, i) => String(i + 1));
        }
      }
    }
  }

  // Render contract enforcement (Sprint 7 Phase 10): if a completion-family
  // question arrives with no BlankAccepts AND no `[N]` AND no Diagram/Map
  // marker, the prompt likely escaped the S32 DB migration. Throw in production
  // so the regression surfaces immediately; warn in dev for friendlier DX.
  if (blankKeys.length === 0) {
    if (process.env.NODE_ENV === "development") {
      console.warn(
        "[CompletionCard] no blank keys derived from promptMd; check that the row uses `[N]` placeholders or a `[Diagram/Map: ...]` word-bank marker.",
        { promptMd: promptMd?.slice(0, 200) },
      );
      blankKeys = [">>> AUTO-FILL DEBUG: " + (promptMd?.slice(0, 100) ?? "")];
    } else {
      // Production path — throw to surface the render contract violation.
      throw new Error(
        "[CompletionCard] render contract violated: PromptMd has no [N] placeholders and no [Diagram/Map: ...] word-bank marker. This question was rejected at save time by Sprint 7 Phase 10 validation; investigate data integrity.",
      );
    }
  }

  const lines = useMemo(
    () => computeBlankLines(promptMd, blankKeys),
    [promptMd, blankKeys.join("|")],
  );

  // Word bank for DIAGRAM_LABEL / MAP_LABEL (live-snapshot path).
  const wordBank: string[] = (() => {
    if (!promptMd) return [];
    const text = promptMd.replace(/\\n/g, "\n");
    const labelListMatch = text.match(/\[(Diagram|Map):\s*([^\]]+)\]/i);
    if (!labelListMatch) return [];
    return labelListMatch[2]
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
  })();

  const userDict: Record<string, string> =
    value && typeof value === "object" && !Array.isArray(value)
      ? (value as Record<string, string>)
      : typeof value === "string"
      ? { "1": value }
      : {};

  const handleInputChange = (key: string, text: string) => {
    const next = { ...userDict, [key]: text };
    onChange(next);
  };

  return (
    <div className="space-y-5">
      {imageUrl && (
        <div className="flex justify-center">
          <img
            src={imageUrl}
            alt="Question diagram"
            className="max-w-full max-h-96 rounded-2xl border-2 border-[var(--border)] shadow-2xs"
            loading="lazy"
          />
        </div>
      )}

      {wordBank.length > 0 && (
        <div className="p-4 rounded-2xl bg-blue-50/40 border-2 border-blue-200">
          <div className="text-[10px] font-bold uppercase tracking-wider text-blue-700 mb-3">
            Word List — Choose from:
          </div>
          <div className="flex flex-wrap gap-2">
            {wordBank.map((label, i) => (
              <span
                key={i}
                className="px-3 py-1.5 text-xs font-semibold bg-white border border-blue-300 text-slate-800 rounded-lg shadow-2xs"
              >
                {label}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Render form-style: number bubble + label or input on a single row */}
      <div className="space-y-2.5">
        {lines.map((line) => {
          const userVal = userDict[line.key] || "";
          const hasLabel = line.label.length > 0;
          return (
            <div
              key={line.key}
              className="group flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 p-3 sm:p-3.5 rounded-2xl border-2 border-slate-200 bg-white shadow-2xs transition-all hover:border-[#2563EB]/30"
            >
              <span className="inline-flex w-12 shrink-0 items-center justify-center px-3 py-1.5 rounded-xl font-mono text-xs font-bold text-[#2563EB] bg-blue-50 border border-blue-200">
                [{line.displayNumber}]
              </span>
              <div className="flex-1 min-w-0">
                {hasLabel && (
                  <div className="text-xs sm:text-sm font-medium text-slate-700 leading-snug mb-1.5 sm:mb-0 sm:mr-3 sm:inline-block sm:align-middle">
                    {line.label}
                  </div>
                )}
                <input
                  type="text"
                  value={userVal}
                  onChange={(e) => handleInputChange(line.key, e.target.value)}
                  placeholder={
                    hasLabel
                      ? `Type the answer for ${line.label.toLowerCase()}`
                      : line.placeholder
                  }
                  className={`w-full rounded-xl border-2 px-4 py-2.5 text-xs sm:text-sm bg-white border-slate-200 text-slate-900 placeholder:text-slate-400 focus:border-[#2563EB] focus:outline-none transition-all shadow-2xs ${hasLabel ? "sm:w-auto sm:min-w-[12rem]" : ""}`}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
