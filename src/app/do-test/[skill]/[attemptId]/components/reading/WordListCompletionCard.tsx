"use client";

import React, { memo, useMemo, useCallback } from "react";

type Choice = { value: string; label: string };

const RE_BLANK = /___(?:\[\d+\])?/g;

function extractBodyAfterColon(stem: string) {
  const m = stem.match(/Fill in blank[\s\S]*?:\s*\n+([\s\S]*)/i);
  return (m?.[1] ?? stem).trim();
}

function splitBodyByBlanks(body: string) {
  const regex = /___(?:\[\d+\])?/g;
  regex.lastIndex = 0;
  const parts: Array<{ kind: string; text: string; blankIndex?: number }> = [];
  let last = 0;
  let blankIndex = 0;
  let m;
  while ((m = regex.exec(body)) !== null) {
    const start = m.index;
    const end = start + m[0].length;
    if (start > last) {
      parts.push({ kind: "text", text: body.slice(last, start) });
    }
    parts.push({ kind: "blank", text: body.slice(start, end), blankIndex });
    blankIndex++;
    last = end;
  }
  if (last < body.length) {
    parts.push({ kind: "text", text: body.slice(last) });
  }
  return { parts, blankCount: blankIndex };
}

const MatchingInformation = memo(function MatchingInformation({
  stem,
  wordList,
  values,
  onChange,
}: {
  stem: string;
  /** Structured word list from API payload (e.g. ["A. Apple", "B. Banana"]) */
  wordList: string[];
  values: string[];
  onChange: (blankIndex: number, value: string) => void;
}) {
  const body = useMemo(() => extractBodyAfterColon(stem), [stem]);
  const split = useMemo(() => splitBodyByBlanks(body), [body]);

  const choices: Choice[] = useMemo(() => {
    return (wordList ?? []).map((item) => {
      const m = item.match(/^([A-Z])\s*(?:[.)\-:])\s*(.+)$/);
      return m
        ? { value: m[1], label: m[2].trim() }
        : { value: item, label: item };
    }).sort((a, b) => a.value.localeCompare(b.value));
  }, [wordList]);

  const handleChange = useCallback(
    (blankIndex: number, value: string) => {
      onChange(blankIndex, value);
    },
    [onChange]
  );

  return (
    <div className="rounded-[2rem] border-[3px] border-[var(--border)] bg-[var(--card)] p-4 shadow-[0_4px_0_rgba(0,0,0,0.08)]">
      <div className="text-sm leading-relaxed text-[var(--foreground)]">
        {split?.parts.map((p, i) => {
          if (p.kind === "text") {
            return (
              <span key={`t-${i}`} className="whitespace-pre-wrap">
                {p.text}
              </span>
            );
          }

          return (
            <span key={`b-${i}`} className="inline-flex items-center gap-2">
              <span className="text-[var(--text-muted)] font-semibold">{p.text}</span>
              <select
                value={values[p.blankIndex!] ?? ""}
                onChange={(e) => handleChange(p.blankIndex!, e.target.value)}
                className="h-9 rounded-lg border border-[var(--border)] bg-[var(--card)] px-2 text-sm font-semibold
                           focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
              >
                <option value="">—</option>
                {choices.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.value}
                  </option>
                ))}
              </select>
            </span>
          );
        })}
      </div>

      <div className="mt-3">
        <div className="text-xs font-semibold text-[var(--text-body)] mb-2">
          Word List
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {choices.map((c) => (
            <div
              key={`wl-${c.value}`}
              className="flex items-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--background)] px-2 py-1"
            >
              <span className="w-6 text-center font-bold text-[var(--text-body)]">
                {c.value}.
              </span>
              <span className="text-sm text-[var(--foreground)]">{c.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
});

export default MatchingInformation;
