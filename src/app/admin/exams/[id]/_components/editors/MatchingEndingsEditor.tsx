"use client";

import { useEffect, useMemo, useState } from "react";
import { InternalDeliveryOption } from "@/app/admin/_lib/types";

interface MatchingEndingsEditorProps {
  matchPairs?: Record<string, string[] | null> | null;
  options: InternalDeliveryOption[];
  promptMd?: string | null;
  onChange: (
    pairs: Record<string, string[] | null>,
    options: InternalDeliveryOption[]
  ) => void;
}

function extractBeginnings(pairs: Record<string, string[] | null>): string[] {
  const numbered = Object.keys(pairs).filter((k) => /^\d+$/.test(k));
  if (numbered.length > 0) return numbered.sort((a, b) => Number(a) - Number(b));
  return Object.keys(pairs).sort();
}

function endingsToOptions(
  endings: { letter: string; label: string }[],
  prev: InternalDeliveryOption[]
): InternalDeliveryOption[] {
  return endings.map((e, i) => {
    const existing = prev[i];
    return {
      id: existing?.id || `temp-end-${Date.now()}-${i}`,
      idx: i + 1,
      contentMd: e.label,
      isCorrect: false,
    };
  });
}

function extractEndings(options: InternalDeliveryOption[]): { letter: string; label: string }[] {
  return options
    .map((o) => {
      const raw = (o.contentMd || "").trim();
      const m = raw.match(/^([A-Z])\.\s*(.*)$/);
      if (m) return { letter: m[1], label: raw };
      return null;
    })
    .filter((x): x is { letter: string; label: string } => x !== null);
}

const ENDING_LETTERS = ["A", "B", "C", "D", "E", "F", "G", "H"];

export function MatchingEndingsEditor({
  matchPairs,
  options,
  promptMd,
  onChange,
}: MatchingEndingsEditorProps) {
  const pairs = matchPairs || {};
  const beginnings = useMemo(() => extractBeginnings(pairs), [pairs]);
  const initialEndings = useMemo(() => extractEndings(options), [options]);

  const [beginningTexts, setBeginningTexts] = useState<Record<string, string>>(() => {
    const fromPrompt = parseBeginningsFromPrompt(promptMd);
    const out: Record<string, string> = {};
    for (const b of beginnings) out[b] = fromPrompt[b] || "";
    return out;
  });
  const [endings, setEndings] = useState<{ letter: string; label: string }[]>(
    initialEndings.length > 0 ? initialEndings : []
  );

  function parseBeginningsFromPrompt(prompt: string | null | undefined): Record<string, string> {
    if (!prompt) return {};
    const out: Record<string, string> = {};
    const re = /^(\d+)\.\s+(.+)$/gm;
    let m: RegExpExecArray | null;
    while ((m = re.exec(prompt)) !== null) {
      out[m[1]] = m[2].trim();
    }
    return out;
  }

  useEffect(() => {
    const fromPrompt = parseBeginningsFromPrompt(promptMd);
    setBeginningTexts((cur) => {
      const next = { ...cur };
      for (const b of beginnings) {
        if (!next[b] && fromPrompt[b]) next[b] = fromPrompt[b];
      }
      return next;
    });
  }, [promptMd, beginnings]);

  const persistAll = (
    nextBeginnings: string[],
    nextTexts: Record<string, string>,
    nextEndings: { letter: string; label: string }[]
  ) => {
    const nextPairs: Record<string, string[] | null> = {};
    for (const b of nextBeginnings) {
      const ans = pairs[b]?.[0] || "";
      const display = nextTexts[b] || "";
      nextPairs[b] = ans ? [ans, display] : null;
    }
    onChange(nextPairs, endingsToOptions(nextEndings, options));
  };

  const handleAddBeginning = () => {
    const existing = beginnings.map(Number).filter((n) => !isNaN(n));
    const next = existing.length > 0 ? Math.max(...existing) + 1 : 21;
    const key = String(next);
    const newBeg = [...beginnings, key];
    setBeginningTexts({ ...beginningTexts, [key]: "" });
    persistAll(newBeg, { ...beginningTexts, [key]: "" }, endings);
  };

  const handleUpdateBeginning = (k: string, val: string) => {
    const next = { ...beginningTexts, [k]: val };
    setBeginningTexts(next);
    persistAll(beginnings, next, endings);
  };

  const handleRemoveBeginning = (k: string) => {
    const nextBeg = beginnings.filter((x) => x !== k);
    const nextTexts = { ...beginningTexts };
    delete nextTexts[k];
    setBeginningTexts(nextTexts);
    const nextPairs = { ...pairs };
    delete nextPairs[k];
    onChange(nextPairs, endingsToOptions(endings, options));
  };

  const handleAddEnding = () => {
    const used = endings.map((e) => e.letter);
    const next = ENDING_LETTERS.find((l) => !used.includes(l));
    if (!next) return;
    setEndings([...endings, { letter: next, label: `${next}. ` }]);
  };

  const handleUpdateEnding = (idx: number, label: string) => {
    const next = endings.map((e, i) => (i === idx ? { ...e, label } : e));
    setEndings(next);
    persistAll(beginnings, beginningTexts, next);
  };

  const handleRemoveEnding = (idx: number) => {
    const removed = endings[idx];
    const next = endings.filter((_, i) => i !== idx);
    setEndings(next);
    const nextPairs = { ...pairs };
    for (const k of Object.keys(nextPairs)) {
      if (nextPairs[k]?.[0] === removed.letter) nextPairs[k] = null;
    }
    onChange(nextPairs, endingsToOptions(next, options));
  };

  const handleAssign = (bKey: string, letter: string) => {
    const nextPairs = { ...pairs };
    if (nextPairs[bKey]?.[0] === letter) {
      nextPairs[bKey] = null;
    } else {
      nextPairs[bKey] = [letter, beginningTexts[bKey] || ""];
    }
    onChange(nextPairs, endingsToOptions(endings, options));
  };

  return (
    <div className="space-y-4">
      <div className="p-3 rounded-xl bg-indigo-950/30 border border-indigo-900/40 text-[11px] text-indigo-200">
        Each sentence beginning (21, 22, 23, …) maps to a single ending (A, B, C, …).
        Endings can only be used once.
      </div>

      <div className="p-4 rounded-xl bg-slate-900/50 border border-slate-800 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Endings Pool ({endings.length})
          </span>
          <button
            type="button"
            onClick={handleAddEnding}
            className="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-medium rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition"
          >
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            Add Ending
          </button>
        </div>
        <div className="space-y-1.5">
          {endings.map((e, i) => (
            <div
              key={`${e.letter}-${i}`}
              className="flex items-center gap-2 p-2 rounded-lg bg-slate-950 border border-slate-800"
            >
              <span className="shrink-0 w-7 text-center font-mono text-xs font-bold text-indigo-300">
                {e.letter}
              </span>
              <input
                type="text"
                value={e.label}
                onChange={(ev) => handleUpdateEnding(i, ev.target.value)}
                placeholder="A. Sentence ending"
                className="flex-1 bg-transparent text-xs text-slate-200 focus:outline-none"
              />
              <button
                type="button"
                onClick={() => handleRemoveEnding(i)}
                className="p-1 text-slate-500 hover:text-rose-400 transition"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Sentence Beginnings ({beginnings.length})
          </span>
          <button
            type="button"
            onClick={handleAddBeginning}
            className="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-medium rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition"
          >
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            Add Beginning
          </button>
        </div>
        {beginnings.length === 0 ? (
          <div className="p-4 text-center rounded-lg border border-dashed border-slate-800 text-xs text-slate-500">
            No sentence beginnings yet. Add 21. 22. 23. to the prompt or click &ldquo;Add Beginning&rdquo;.
          </div>
        ) : (
          beginnings.map((k) => {
            const ans = pairs[k]?.[0] || "";
            return (
              <div
                key={k}
                className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 flex flex-col sm:flex-row sm:items-center gap-3"
              >
                <span className="shrink-0 inline-flex items-center justify-center w-7 h-7 rounded-md bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-mono text-xs font-bold">
                  {k}
                </span>
                <input
                  type="text"
                  value={beginningTexts[k] || ""}
                  onChange={(e) => handleUpdateBeginning(k, e.target.value)}
                  placeholder="Sentence beginning (without the ending)…"
                  className="flex-1 bg-transparent text-xs text-slate-200 placeholder-slate-600 focus:outline-none border-b border-transparent hover:border-slate-700 focus:border-indigo-500"
                />
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold text-slate-500">ENDING</span>
                  <select
                    value={ans}
                    onChange={(e) => handleAssign(k, e.target.value)}
                    className="bg-slate-950 border border-slate-700 rounded-md px-2 py-1 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                  >
                    <option value="">—</option>
                    {endings.map((e) => (
                      <option key={e.letter} value={e.letter}>
                        {e.letter}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => handleRemoveBeginning(k)}
                    className="p-1 text-slate-500 hover:text-rose-400 transition"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
