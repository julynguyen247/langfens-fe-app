"use client";

import { useEffect, useMemo, useState } from "react";
import { InternalDeliveryOption } from "@/app/admin/_lib/types";

interface MatchingHeadingEditorProps {
  matchPairs?: Record<string, string[] | null> | null;
  options: InternalDeliveryOption[];
  promptMd?: string | null;
  onChange: (
    pairs: Record<string, string[] | null>,
    options: InternalDeliveryOption[]
  ) => void;
}

const ROMAN = ["i", "ii", "iii", "iv", "v", "vi", "vii", "viii", "ix", "x"];
const PARAGRAPH_LETTERS = ["A", "B", "C", "D", "E", "F", "G", "H"];

function extractParagraphs(pairs: Record<string, string[] | null>): string[] {
  const known = PARAGRAPH_LETTERS.filter((l) => pairs[l] !== undefined);
  if (known.length > 0) return known;
  const all = Object.keys(pairs).filter((k) => /^[A-Z]$/.test(k));
  return all.sort();
}

function extractHeadings(options: InternalDeliveryOption[]): { key: string; label: string }[] {
  return options
    .map((o) => {
      const raw = (o.contentMd || "").trim();
      const m = raw.match(/^([ivxlcdm]+)\.\s*(.*)$/i);
      if (m) return { key: m[1].toLowerCase(), label: raw };
      return null;
    })
    .filter((x): x is { key: string; label: string } => x !== null);
}

function headingsToOptions(
  headings: { key: string; label: string }[],
  prev: InternalDeliveryOption[]
): InternalDeliveryOption[] {
  return headings.map((h, i) => {
    const existing = prev[i];
    return {
      id: existing?.id || `temp-hdg-${Date.now()}-${i}`,
      idx: i + 1,
      contentMd: h.label,
      isCorrect: false,
    };
  });
}

export function MatchingHeadingEditor({
  matchPairs,
  options,
  promptMd,
  onChange,
}: MatchingHeadingEditorProps) {
  const pairs = matchPairs || {};

  const initialParagraphs = useMemo(() => extractParagraphs(pairs), [pairs]);
  const initialHeadings = useMemo(
    () => (options.length > 0 ? extractHeadings(options) : []),
    [options]
  );

  const [paragraphs, setParagraphs] = useState<string[]>(
    initialParagraphs.length > 0 ? initialParagraphs : ["A", "B", "C"]
  );
  const [paragraphLabels, setParagraphLabels] = useState<Record<string, string>>(() => {
    const out: Record<string, string> = {};
    for (const p of initialParagraphs) {
      out[p] = pairs[p]?.[1] || "";
    }
    return out;
  });
  const [headings, setHeadings] = useState<{ key: string; label: string }[]>(
    initialHeadings.length > 0
      ? initialHeadings
      : ROMAN.slice(0, 4).map((k) => ({ key: k, label: `${k}. ` }))
  );

  const [newKey, setNewKey] = useState("");
  const [newLabel, setNewLabel] = useState("");

  const persist = (
    nextParagraphs: string[],
    nextLabels: Record<string, string>,
    nextHeadings: { key: string; label: string }[]
  ) => {
    const nextPairs: Record<string, string[] | null> = {};
    for (const p of nextParagraphs) {
      const existing = pairs[p];
      const answerKey = existing?.[0] || "";
      const displayLabel = nextLabels[p] || existing?.[1] || "";
      nextPairs[p] = answerKey ? [answerKey, displayLabel] : null;
    }
    onChange(nextPairs, headingsToOptions(nextHeadings, options));
  };

  useEffect(() => {
    const ps = extractParagraphs(pairs);
    if (ps.length === 0) return;
    setParagraphs((cur) => (cur.length === 0 ? ps : cur));
    setParagraphLabels((cur) => {
      const next = { ...cur };
      for (const p of ps) {
        if (!next[p]) next[p] = pairs[p]?.[1] || "";
      }
      return next;
    });
  }, [pairs]);

  const handleAddParagraph = () => {
    const nextLetter = PARAGRAPH_LETTERS.find((l) => !paragraphs.includes(l));
    if (!nextLetter) return;
    const next = [...paragraphs, nextLetter];
    setParagraphs(next);
    setParagraphLabels({ ...paragraphLabels, [nextLetter]: "" });
    persist(next, { ...paragraphLabels, [nextLetter]: "" }, headings);
  };

  const handleUpdateParagraphLabel = (letter: string, val: string) => {
    const next = { ...paragraphLabels, [letter]: val };
    setParagraphLabels(next);
    persist(paragraphs, next, headings);
  };

  const handleRemoveParagraph = (letter: string) => {
    const next = paragraphs.filter((p) => p !== letter);
    const nextLabels = { ...paragraphLabels };
    delete nextLabels[letter];
    setParagraphs(next);
    setParagraphLabels(nextLabels);

    const nextPairs = { ...pairs };
    delete nextPairs[letter];
    onChange(nextPairs, headingsToOptions(headings, options));
  };

  const handleAddHeading = () => {
    const k = newKey.trim().toLowerCase();
    const lbl = newLabel.trim() || k;
    if (!k) return;
    if (headings.some((h) => h.key === k)) return;
    const next = [...headings, { key: k, label: lbl }];
    setHeadings(next);
    setNewKey("");
    setNewLabel("");
    persist(paragraphs, paragraphLabels, next);
  };

  const handleUpdateHeading = (idx: number, label: string) => {
    const next = headings.map((h, i) => (i === idx ? { ...h, label } : h));
    setHeadings(next);
    persist(paragraphs, paragraphLabels, next);
  };

  const handleRemoveHeading = (idx: number) => {
    const removed = headings[idx];
    const next = headings.filter((_, i) => i !== idx);
    setHeadings(next);

    const nextPairs = { ...pairs };
    for (const k of Object.keys(nextPairs)) {
      if (nextPairs[k]?.[0] === removed.key) nextPairs[k] = null;
    }
    onChange(nextPairs, headingsToOptions(next, options));
  };

  const handleAssign = (letter: string, headingKey: string) => {
    const nextPairs = { ...pairs };
    if (nextPairs[letter]?.[0] === headingKey) {
      nextPairs[letter] = null;
    } else {
      nextPairs[letter] = [headingKey, paragraphLabels[letter] || ""];
    }
    onChange(nextPairs, headingsToOptions(headings, options));
  };

  return (
    <div className="space-y-4">
      <div className="p-4 rounded-xl bg-slate-900/50 border border-slate-800 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Paragraphs ({paragraphs.length})
          </span>
          <button
            type="button"
            onClick={handleAddParagraph}
            className="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-medium rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition"
          >
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            Add Paragraph
          </button>
        </div>
        <div className="space-y-1.5">
          {paragraphs.map((letter) => (
            <div
              key={letter}
              className="flex items-center gap-2 p-2 rounded-lg bg-slate-950 border border-slate-800"
            >
              <span className="shrink-0 inline-flex items-center justify-center w-7 h-7 rounded-md bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-mono text-xs font-bold">
                {letter}
              </span>
              <input
                type="text"
                value={paragraphLabels[letter] || ""}
                onChange={(e) => handleUpdateParagraphLabel(letter, e.target.value)}
                placeholder="Paragraph excerpt / first sentence (optional)"
                className="flex-1 bg-transparent text-xs text-slate-200 placeholder-slate-600 focus:outline-none"
              />
              <button
                type="button"
                onClick={() => handleRemoveParagraph(letter)}
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

      <div className="p-4 rounded-xl bg-slate-900/50 border border-slate-800 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Headings Pool ({headings.length})
          </span>
        </div>
        <div className="space-y-1.5">
          {headings.map((h, i) => (
            <div
              key={`${h.key}-${i}`}
              className="flex items-center gap-2 p-2 rounded-lg bg-slate-950 border border-slate-800"
            >
              <span className="shrink-0 w-7 text-center font-mono text-xs font-bold text-indigo-300">
                {h.key}
              </span>
              <input
                type="text"
                value={h.label}
                onChange={(e) => handleUpdateHeading(i, e.target.value)}
                placeholder="i. The Early Years"
                className="flex-1 bg-transparent text-xs text-slate-200 focus:outline-none"
              />
              <button
                type="button"
                onClick={() => handleRemoveHeading(i)}
                className="p-1 text-slate-500 hover:text-rose-400 transition"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          ))}
        </div>
        <div className="flex items-center gap-2 pt-2 border-t border-slate-800">
          <input
            type="text"
            value={newKey}
            onChange={(e) => setNewKey(e.target.value)}
            placeholder="xi"
            maxLength={5}
            className="w-12 bg-slate-950 border border-slate-700 rounded px-2 py-1 text-xs text-center font-mono placeholder-slate-600 focus:outline-none focus:border-indigo-500"
          />
          <input
            type="text"
            value={newLabel}
            onChange={(e) => setNewLabel(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleAddHeading())}
            placeholder="Heading label"
            className="flex-1 bg-slate-950 border border-slate-700 rounded px-2 py-1 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-500"
          />
          <button
            type="button"
            onClick={handleAddHeading}
            className="px-2.5 py-1 text-[11px] font-medium rounded bg-indigo-600 hover:bg-indigo-500 text-white transition"
          >
            Add
          </button>
        </div>
      </div>

      <div className="space-y-2">
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
          Match Grid
        </span>
        {paragraphs.map((letter) => {
          const selected = pairs[letter]?.[0];
          return (
            <div
              key={letter}
              className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center gap-3"
            >
              <span className="shrink-0 inline-flex items-center justify-center w-7 h-7 rounded-md bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-mono text-xs font-bold">
                {letter}
              </span>
              <span className="flex-1 text-xs text-slate-400 italic truncate">
                {paragraphLabels[letter] || "(no preview text)"}
              </span>
              <select
                value={selected || ""}
                onChange={(e) => handleAssign(letter, e.target.value)}
                className="bg-slate-950 border border-slate-700 rounded-md px-2.5 py-1 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
              >
                <option value="">— pick heading —</option>
                {headings.map((h) => (
                  <option key={h.key} value={h.key}>
                    [{h.key}] {h.label.replace(/^[ivxlcdm]+\.\s*/i, "")}
                  </option>
                ))}
              </select>
            </div>
          );
        })}
      </div>
    </div>
  );
}
