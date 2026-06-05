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

type Table = {
  /** Optional intro line shown above the table. */
  intro: string;
  /** Optional marker captured verbatim: `Table: …` / `Complete the table …`. */
  marker: string;
  /** Two-dimensional grid: rows of cells. Use `null` cells for blanks. */
  rows: Array<Array<{ kind: "text"; value: string } | { kind: "blank"; blankIndex: number } | null>>;
  /** Total blank count. */
  blankCount: number;
};

/**
 * TABLE_COMPLETION — workbook style with a real <table>.
 *
 * Parses the prompt for any of these shapes (first match wins):
 *
 *   1. Markdown table:
 *
 *        | Habitat | Species seen |
 *        | --- | --- |
 *        | river  | otter |
 *        | coast  | ______ |
 *
 *   2. `Table:` marker followed by a list of part names, e.g.
 *
 *        Table: a, b, c, d
 *
 *   3. Plain numbered list fallback (no table structure)
 *
 * Each cell in the parsed grid can be plain text, a blank, or null
 * (empty cell that doesn't get an input). Blank cells are numbered
 * sequentially with the canonical startIdx and each renders a
 * `WorkbookInput` so every blank looks identical to the other
 * completion cards.
 */
const TableCompletionCard = memo(function TableCompletionCard({
  id,
  stem,
  values,
  startIdx = 1,
  onChange,
  rangeLabel,
  isFlagged = false,
  onToggleFlag,
}: Props) {
  const table = useMemo<Table>(() => parseTable(stem), [stem]);

  const handleChange = useCallback(
    (idx: number, value: string) => onChange(idx, value),
    [onChange]
  );

  const totalBlanks = table.blankCount;
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
      {table.marker && (
        <p
          className="px-4 sm:px-5 pt-3 pb-2 text-[14px] font-semibold text-[var(--foreground)] leading-relaxed"
          style={{ fontFamily: "var(--font-heading)" }}
        >
          {table.marker}
        </p>
      )}

      {table.intro && (
        <p
          className="px-4 sm:px-5 pt-1 pb-3 text-[14px] text-[var(--text-body)] leading-relaxed"
          style={{ fontFamily: "var(--font-body)" }}
        >
          {table.intro}
        </p>
      )}

      <div className="px-4 sm:px-5 pb-4 overflow-x-auto">
        <table className="w-full border-collapse text-sm">
          <tbody>
            {table.rows.map((row, ri) => (
              <tr key={ri}>
                {row.map((cell, ci) => (
                  <td
                    key={ci}
                    className="align-top p-1.5 border-b border-[var(--border)]/60"
                  >
                    {cell === null ? null : cell.kind === "text" ? (
                      <div
                        className="text-[14px] text-[var(--foreground)] leading-[1.6] px-1"
                        style={{ fontFamily: "var(--font-body)" }}
                      >
                        {cell.value}
                      </div>
                    ) : (
                      <div className="min-w-[10ch]">
                        <WorkbookInput
                          value={values[cell.blankIndex] ?? ""}
                          onChange={(v) => handleChange(cell.blankIndex, v)}
                          placeholder="Answer"
                          ariaLabel={`Answer ${cell.blankIndex + 1}`}
                          showTypeHint
                          showAnsweredBadge
                        />
                      </div>
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </WorkbookCard>
  );
});

function parseTable(stem: string): Table {
  const text = stem.replace(/\\n/g, "\n");
  const lines = text.split("\n");

  // 1) Markdown table.
  const mdRows = collectMarkdownTable(lines);
  if (mdRows && mdRows.length >= 2) {
    return buildTableFromRows(mdRows, text);
  }

  // 2) `Table: a, b, c` marker — falls back to a 2-column grid
  //    (one label row, one input row per part).
  const markerMatch = text.match(/(?:^|\n)\s*Table\s*:\s*([^\n]+)/i);
  if (markerMatch) {
    const names = markerMatch[1]
      .split(/[,\u3001]\s*|\s{2,}/)
      .map((s) => s.trim())
      .filter(Boolean);
    if (names.length > 0) {
      const labelRow = names.map((n) => ({
        kind: "text" as const,
        value: n,
      }));
      const blankRow = names.map((_, i) => ({
        kind: "blank" as const,
        blankIndex: i,
      }));
      return {
        intro: "",
        marker: `Table — fill in the missing information for each part.`,
        rows: [labelRow, blankRow],
        blankCount: names.length,
      };
    }
  }

  // 3) Plain numbered list fallback.
  const numbered = text
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => /^\d+[\.\)\-:]\s+/.test(l));
  if (numbered.length > 0) {
    const rows = numbered.map((line, i) => {
      const text = line.replace(/^\d+[\.\)\-:]\s+/, "");
      return [
        { kind: "text" as const, value: text },
        { kind: "blank" as const, blankIndex: i },
      ];
    });
    return {
      intro: "",
      marker: "Complete the table.",
      rows,
      blankCount: numbered.length,
    };
  }

  return { intro: "", marker: "", rows: [], blankCount: 0 };
}

function collectMarkdownTable(lines: string[]): string[][] | null {
  // Find a contiguous run of lines starting with `|` (ignoring the
  // separator row with `| --- |`).
  const out: string[][] = [];
  let inTable = false;
  for (const raw of lines) {
    const line = raw.trim();
    if (line.startsWith("|") && line.endsWith("|")) {
      inTable = true;
      const cells = line
        .slice(1, -1)
        .split("|")
        .map((c) => c.trim());
      out.push(cells);
    } else if (inTable) {
      break;
    }
  }
  if (out.length < 2) return null;
  // Drop the markdown separator row (| --- | --- |).
  const cleaned = out.filter(
    (r) => !(r.length > 0 && r.every((c) => /^:?-{2,}:?$/.test(c)))
  );
  if (cleaned.length < 2) return null;
  return cleaned;
}

function buildTableFromRows(
  rows: string[][],
  fullText: string,
): Table {
  // The first row is the header; we render it as text. Subsequent
  // rows have plain text and `___` (or empty) cells, which become
  // inputs in display order.
  let blankIndex = 0;
  const builtRows: Table["rows"] = [];
  let intro = fullText;
  for (let ri = 0; ri < rows.length; ri++) {
    const cells = rows[ri];
    const row: Table["rows"][number] = cells.map((value) => {
      if (/_{3,}/.test(value)) {
        const idx = blankIndex++;
        return { kind: "blank", blankIndex: idx };
      }
      if (value === "") return null;
      return { kind: "text", value };
    });
    builtRows.push(row);
  }
  // Best-effort intro = text before the first table line.
  const firstTableLine = fullText.split("\n").find((l) => l.trim().startsWith("|"));
  if (firstTableLine) {
    const idx = fullText.indexOf(firstTableLine);
    intro = fullText.slice(0, idx).trim();
  }
  return {
    intro,
    marker: "Complete the table below.",
    rows: builtRows,
    blankCount: blankIndex,
  };
}

export default TableCompletionCard;
