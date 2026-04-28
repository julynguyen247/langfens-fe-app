"use client";

import React, { memo, useMemo, useCallback } from "react";

type Choice = { value: string; label: string };

const RE_SPLIT_WORDLIST = /^([\s\S]*?)\n\s*\*\*Word List:\*\*\s*\n([\s\S]*)$/;
const RE_BLANK = /___(?:\[\d+\])?/g;

function splitByBlanks(promptMd: string) {
  const normalized = promptMd.includes("\\n")
    ? promptMd.replace(/\\n/g, "\n")
    : promptMd;

  const m = normalized.match(RE_SPLIT_WORDLIST);

  if (!m) {
    return {
      stem: normalized.trim(),
      choices: [] as Array<{ value: string; label: string }>,
    };
  }

  const stem = m[1].trim();
  const list = m[2].trim();

  const lines = list
    .split(/\r?\n/)
    .map((s) => s.trim())
    .filter(Boolean);

  const out = [];

  for (const line of lines) {
    const choice = line.match(/^([A-Z])\s*(?:[.)\-:])\s*(.+)$/);
    if (!choice) continue;

    out.push({ value: choice[1], label: choice[2].trim() });
  }

  out.sort((a, b) => a.value.localeCompare(b.value));

  return { stem, choices: out };
}

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
  values,
  onChange,
}: {
  stem: string;
  values: string[];
  onChange: (blankIndex: number, value: string) => void;
}) {
  const parsed = useMemo(() => splitByBlanks(stem), [stem]);
  const body = useMemo(() => extractBodyAfterColon(parsed.stem), [parsed.stem]);
  const split = useMemo(() => splitBodyByBlanks(body), [body]);

  const handleChange = useCallback(
    (blankIndex: number, value: string) => {
      onChange(blankIndex, value);
    },
    [onChange]
  );

  return (
    <div className="rounded-[1.5rem] border-[3px] border-[var(--border)] bg-white p-4 shadow-[0_4px_0_rgba(0,0,0,0.08)]">
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
                className="h-9 rounded-lg border border-[var(--border)] bg-white px-2 text-sm font-semibold
                           focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
              >
                <option value="">—</option>
                {parsed.choices.map((c) => (
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
          {parsed.choices.map((c) => (
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
