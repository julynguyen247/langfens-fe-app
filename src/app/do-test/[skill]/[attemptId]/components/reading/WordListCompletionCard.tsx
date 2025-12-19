"use client";

import React, { useMemo } from "react";

type Choice = { value: string; label: string };

export default function MatchingInformation({
  stem,
  values,

  onChange,
}: {
  stem: string;
  values: string[];

  onChange: (blankIndex: number, value: string) => void;
}) {
  const RE_SPLIT_WORDLIST = /^([\s\S]*?)\n\s*\*\*Word List:\*\*\s*\n([\s\S]*)$/;
  const RE_BLANK = /___(?:\[\d+\])?/g;

  const splitByBlanks = (promptMd: string) => {
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
  };

  function extractBodyAfterColon(stem: string) {
    const m = stem.match(/Fill in blank[\s\S]*?:\s*\n+([\s\S]*)/i);
    return (m?.[1] ?? stem).trim();
  }
  function splitBodyByBlanks(body: string) {
    RE_BLANK.lastIndex = 0;
    const parts = [];
    let last = 0;
    let blankIndex = 0;
    let m;
    while ((m = RE_BLANK.exec(body)) !== null) {
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

  const parsed = useMemo(() => splitByBlanks(stem), [stem]);
  const body = extractBodyAfterColon(parsed.stem);
  const split = splitBodyByBlanks(body);

  return (
    <div className="rounded-xl border bg-white p-4">
      <div className="text-sm leading-relaxed text-slate-800">
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
              <span className="text-slate-500 font-semibold">{p.text}</span>
              <select
                value={values[p.blankIndex!] ?? ""}
                onChange={(e) => onChange(p.blankIndex!, e.target.value)}
                className="h-9 rounded-lg border border-slate-300 bg-white px-2 text-sm font-semibold
                           focus:outline-none focus:ring-2 focus:ring-[#317EFF]"
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
        <div className="text-xs font-semibold text-slate-600 mb-2">
          Word List
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {parsed.choices.map((c) => (
            <div
              key={`wl-${c.value}`}
              className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-2 py-1"
            >
              <span className="w-6 text-center font-bold text-slate-700">
                {c.value}.
              </span>
              <span className="text-sm text-slate-800">{c.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
