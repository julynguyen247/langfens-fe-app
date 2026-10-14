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

const ROMAN = [
  "i", "ii", "iii", "iv", "v", "vi", "vii", "viii", "ix", "x",
  "xi", "xii", "xiii", "xiv", "xv", "xvi", "xvii", "xviii", "xix", "xx"
];
const VALID_ROMAN_KEYS: Record<string, true> = {
  i: true, ii: true, iii: true, iv: true, v: true, vi: true, vii: true, viii: true, ix: true, x: true,
  xi: true, xii: true, xiii: true, xiv: true, xv: true, xvi: true, xvii: true, xviii: true, xix: true, xx: true,
};
const PARAGRAPH_LETTERS = ["A", "B", "C", "D", "E", "F", "G", "H"];

function parseParagraphsFromPrompt(promptMd?: string | null): Record<string, string> {
  if (!promptMd) return {};
  const out: Record<string, string> = {};
  const lines = promptMd.replace(/\\n/g, "\n").split("\n");
  for (const rawLine of lines) {
    const line = rawLine.trim();
    const numMatch = line.match(/^(\d+)[\.\)]\s+(.+)$/);
    if (numMatch) {
      out[numMatch[1]] = numMatch[2].trim();
      continue;
    }
    const paraLetterMatch = line.match(/^(?:Paragraph\s+)?([A-Z])[\.\:\-]\s+(.+)$/i);
    if (paraLetterMatch) {
      const key = paraLetterMatch[1].toUpperCase();
      const romanCandidate = paraLetterMatch[1].toLowerCase();
      if (!VALID_ROMAN_KEYS[romanCandidate]) {
        out[key] = paraLetterMatch[2].trim();
      }
    }
  }
  return out;
}

function extractParagraphs(
  pairs: Record<string, string[] | null>,
  promptMd?: string | null
): string[] {
  // 1. Numeric keys in pairs: "1", "2", "3"...
  const numericKeys = Object.keys(pairs).filter((k) => /^\d+$/.test(k));
  if (numericKeys.length > 0) {
    return numericKeys.sort((a, b) => Number(a) - Number(b));
  }

  // 2. Letter keys in pairs: "A", "B", "C"...
  const letterKeys = Object.keys(pairs).filter((k) => /^[A-Z]$/.test(k));
  if (letterKeys.length > 0) {
    return letterKeys.sort();
  }

  // 3. Any other non-empty keys in pairs
  const otherKeys = Object.keys(pairs).filter((k) => k.trim().length > 0);
  if (otherKeys.length > 0) {
    return otherKeys.sort();
  }

  // 4. Fallback to range in promptMd (e.g. "five paragraphs, 1–5" or "A–E")
  if (promptMd) {
    const text = promptMd.replace(/\\n/g, "\n");
    const rangeMatch = text.match(
      /(?:five|six|seven|eight|nine|ten|\d+)\s+paragraphs[,\s]+(?:1[–-](\d+)|([A-Z])[–-]([A-Z]))/i
    );
    if (rangeMatch) {
      if (rangeMatch[1]) {
        const total = parseInt(rangeMatch[1], 10);
        const res: string[] = [];
        for (let i = 1; i <= total; i++) res.push(String(i));
        return res;
      }
      if (rangeMatch[2] && rangeMatch[3]) {
        const start = rangeMatch[2].toUpperCase().charCodeAt(0);
        const end = rangeMatch[3].toUpperCase().charCodeAt(0);
        const res: string[] = [];
        for (let c = start; c <= end; c++) res.push(String.fromCharCode(c));
        return res;
      }
    }

    const parsed = parseParagraphsFromPrompt(promptMd);
    const pKeys = Object.keys(parsed);
    if (pKeys.length > 0) {
      if (pKeys.every((k) => /^\d+$/.test(k))) {
        return pKeys.sort((a, b) => Number(a) - Number(b));
      }
      return pKeys.sort();
    }
  }

  return [];
}

function extractHeadings(options: InternalDeliveryOption[]): { key: string; label: string }[] {
  return options
    .map((o) => {
      const raw = (o.contentMd || "").trim();
      const m = raw.match(/^([ivxlcdm]+)\.\s*(.*)$/i);
      if (m) {
        const key = m[1].toLowerCase();
        // Disallow single letters like C (100) or D (500) from MCQ options like "C. Fishnets"
        if (VALID_ROMAN_KEYS[key]) {
          return { key, label: raw };
        }
      }
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
      imageUrl: existing?.imageUrl ?? null,
      altText: existing?.altText ?? null,
    };
  });
}

export function MatchingHeadingEditor({
  matchPairs,
  options,
  promptMd,
  onChange,
}: MatchingHeadingEditorProps) {
  const pairs = useMemo(() => matchPairs || {}, [matchPairs]);

  const promptParagraphs = useMemo(
    () => parseParagraphsFromPrompt(promptMd),
    [promptMd]
  );
  const detectedParagraphs = useMemo(
    () => extractParagraphs(pairs, promptMd),
    [pairs, promptMd]
  );
  const detectedHeadings = useMemo(
    () => extractHeadings(options),
    [options]
  );

  const [paragraphs, setParagraphs] = useState<string[]>(
    detectedParagraphs.length > 0 ? detectedParagraphs : ["1", "2", "3"]
  );
  const [paragraphLabels, setParagraphLabels] = useState<Record<string, string>>({});
  const [headings, setHeadings] = useState<{ key: string; label: string }[]>(
    detectedHeadings.length > 0
      ? detectedHeadings
      : ROMAN.slice(0, 4).map((k) => ({ key: k, label: `${k}. ` }))
  );

  const [newKey, setNewKey] = useState("");
  const [newLabel, setNewLabel] = useState("");

  useEffect(() => {
    if (detectedParagraphs.length > 0) {
      setParagraphs((cur) => {
        const isSame =
          cur.length === detectedParagraphs.length &&
          cur.every((val, idx) => val === detectedParagraphs[idx]);
        return isSame ? cur : detectedParagraphs;
      });
    }
  }, [detectedParagraphs]);

  useEffect(() => {
    if (detectedHeadings.length > 0) {
      setHeadings((cur) => {
        const isSame =
          cur.length === detectedHeadings.length &&
          cur.every(
            (val, idx) =>
              val.key === detectedHeadings[idx].key &&
              val.label === detectedHeadings[idx].label
          );
        return isSame ? cur : detectedHeadings;
      });
    }
  }, [detectedHeadings]);

  const persist = (
    nextParagraphs: string[],
    nextHeadings: { key: string; label: string }[]
  ) => {
    const nextPairs: Record<string, string[] | null> = {};
    for (const p of nextParagraphs) {
      const existing = pairs[p];
      const answerKey = existing?.[0] || "";
      if (answerKey) {
        const headingObj = nextHeadings.find((h) => h.key === answerKey);
        const headingText = headingObj
          ? headingObj.label.replace(/^[ivxlcdm]+\.\s*/i, "").trim()
          : (existing?.[1] || "");
        nextPairs[p] = [answerKey, headingText];
      } else {
        nextPairs[p] = null;
      }
    }
    onChange(nextPairs, headingsToOptions(nextHeadings, options));
  };

  const handleAddParagraph = () => {
    const isNumeric = paragraphs.length > 0 && paragraphs.every((p) => /^\d+$/.test(p));
    let nextKey = "";
    if (isNumeric) {
      const maxNum = Math.max(...paragraphs.map((p) => parseInt(p, 10)), 0);
      nextKey = String(maxNum + 1);
    } else {
      nextKey = PARAGRAPH_LETTERS.find((l) => !paragraphs.includes(l)) || "";
    }
    if (!nextKey) return;
    const next = [...paragraphs, nextKey];
    setParagraphs(next);
    setParagraphLabels({ ...paragraphLabels, [nextKey]: "" });
    persist(next, headings);
  };

  const handleUpdateParagraphLabel = (pKey: string, val: string) => {
    setParagraphLabels((prev) => ({ ...prev, [pKey]: val }));
  };

  const handleRemoveParagraph = (pKey: string) => {
    const next = paragraphs.filter((p) => p !== pKey);
    const nextLabels = { ...paragraphLabels };
    delete nextLabels[pKey];
    setParagraphs(next);
    setParagraphLabels(nextLabels);

    const nextPairs = { ...pairs };
    delete nextPairs[pKey];
    onChange(nextPairs, headingsToOptions(headings, options));
  };

  const handleAddHeading = () => {
    const k = newKey.trim().toLowerCase();
    const lbl = newLabel.trim() || k;
    if (!k) return;
    if (headings.some((h) => h.key === k)) return;
    const formattedLabel = /^[ivxlcdm]+\.\s*/i.test(lbl) ? lbl : `${k}. ${lbl}`;
    const next = [...headings, { key: k, label: formattedLabel }];
    setHeadings(next);
    setNewKey("");
    setNewLabel("");
    persist(paragraphs, next);
  };

  const handleUpdateHeading = (idx: number, label: string) => {
    const next = headings.map((h, i) => (i === idx ? { ...h, label } : h));
    setHeadings(next);
    persist(paragraphs, next);
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

  const handleAssign = (pKey: string, headingKey: string) => {
    const nextPairs = { ...pairs };
    if (nextPairs[pKey]?.[0] === headingKey) {
      nextPairs[pKey] = null;
    } else {
      const headingObj = headings.find((h) => h.key === headingKey);
      const headingText = headingObj
        ? headingObj.label.replace(/^[ivxlcdm]+\.\s*/i, "").trim()
        : "";
      nextPairs[pKey] = [headingKey, headingText];
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
          {paragraphs.map((pKey) => {
            const preview = paragraphLabels[pKey] ?? promptParagraphs[pKey] ?? "";
            return (
              <div
                key={pKey}
                className="flex items-center gap-2 p-2 rounded-lg bg-slate-950 border border-slate-800"
              >
                <span className="shrink-0 inline-flex items-center justify-center w-7 h-7 rounded-md bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-mono text-xs font-bold">
                  {pKey}
                </span>
                <input
                  type="text"
                  value={preview}
                  onChange={(e) => handleUpdateParagraphLabel(pKey, e.target.value)}
                  placeholder="Paragraph excerpt / first sentence (optional)"
                  className="flex-1 bg-transparent text-xs text-slate-200 placeholder-slate-600 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => handleRemoveParagraph(pKey)}
                  className="p-1 text-slate-500 hover:text-rose-400 transition"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            );
          })}
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
            placeholder={
              ROMAN.find((r) => !headings.some((h) => h.key === r)) || "xi"
            }
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
        {paragraphs.map((pKey) => {
          const selected = pairs[pKey]?.[0];
          const preview = paragraphLabels[pKey] || promptParagraphs[pKey] || "(no preview text)";
          return (
            <div
              key={pKey}
              className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center gap-3"
            >
              <span className="shrink-0 inline-flex items-center justify-center w-7 h-7 rounded-md bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-mono text-xs font-bold">
                {pKey}
              </span>
              <span className="flex-1 text-xs text-slate-400 italic truncate" title={preview}>
                {preview}
              </span>
              <select
                value={selected || ""}
                onChange={(e) => handleAssign(pKey, e.target.value)}
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
