"use client";

import { useEffect, useMemo, useState } from "react";
import { InternalDeliveryOption } from "@/app/admin/_lib/types";

interface MatchingFeaturesEditorProps {
  matchPairs?: Record<string, string[] | null> | null;
  options: InternalDeliveryOption[];
  promptMd?: string | null;
  onChange: (
    pairs: Record<string, string[] | null>,
    options: InternalDeliveryOption[]
  ) => void;
}

const FEATURE_LETTERS = ["A", "B", "C", "D", "E", "F", "G", "H"];

function extractItemKeys(pairs: Record<string, string[] | null>): string[] {
  const known = Object.keys(pairs).filter((k) => /^\d+$/.test(k));
  if (known.length > 0) return known.sort((a, b) => Number(a) - Number(b));
  const lettered = Object.keys(pairs).filter((k) => /^[A-Z]$/.test(k));
  return lettered.sort();
}

function featuresToOptions(
  features: { letter: string; label: string }[],
  prev: InternalDeliveryOption[]
): InternalDeliveryOption[] {
  return features.map((f, i) => {
    const existing = prev[i];
    return {
      id: existing?.id || `temp-feat-${Date.now()}-${i}`,
      idx: i + 1,
      contentMd: f.label,
      isCorrect: false,
    };
  });
}

function extractFeatures(options: InternalDeliveryOption[]): { letter: string; label: string }[] {
  return options
    .map((o) => {
      const raw = (o.contentMd || "").trim();
      const m = raw.match(/^([A-Z])\.\s*(.*)$/);
      if (m) return { letter: m[1], label: raw };
      return null;
    })
    .filter((x): x is { letter: string; label: string } => x !== null);
}

export function MatchingFeaturesEditor({
  matchPairs,
  options,
  promptMd,
  onChange,
}: MatchingFeaturesEditorProps) {
  const pairs = matchPairs || {};
  const items = useMemo(() => extractItemKeys(pairs), [pairs]);
  const initialFeatures = useMemo(() => extractFeatures(options), [options]);

  const [itemTexts, setItemTexts] = useState<Record<string, string>>(() => {
    const fromPrompt = parseItemsFromPrompt(promptMd);
    const out: Record<string, string> = {};
    for (const it of items) out[it] = fromPrompt[it] || "";
    return out;
  });
  const [features, setFeatures] = useState<{ letter: string; label: string }[]>(
    initialFeatures.length > 0 ? initialFeatures : []
  );

  function parseItemsFromPrompt(prompt: string | null | undefined): Record<string, string> {
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
    const fromPrompt = parseItemsFromPrompt(promptMd);
    setItemTexts((cur) => {
      const next = { ...cur };
      for (const it of items) {
        if (!next[it] && fromPrompt[it]) next[it] = fromPrompt[it];
      }
      return next;
    });
  }, [promptMd, items]);

  const persistAll = (
    nextItems: string[],
    nextTexts: Record<string, string>,
    nextFeatures: { letter: string; label: string }[]
  ) => {
    const nextPairs: Record<string, string[] | null> = {};
    for (const it of nextItems) {
      const ans = pairs[it]?.[0] || "";
      const display = nextTexts[it] || "";
      nextPairs[it] = ans ? [ans, display] : null;
    }
    onChange(nextPairs, featuresToOptions(nextFeatures, options));
  };

  const handleAddItem = () => {
    const existing = items.map(Number).filter((n) => !isNaN(n));
    const next = existing.length > 0 ? Math.max(...existing) + 1 : 1;
    const key = String(next);
    const newItems = [...items, key];
    setItemTexts({ ...itemTexts, [key]: "" });
    persistAll(newItems, { ...itemTexts, [key]: "" }, features);
  };

  const handleUpdateItem = (k: string, val: string) => {
    const next = { ...itemTexts, [k]: val };
    setItemTexts(next);
    persistAll(items, next, features);
  };

  const handleRemoveItem = (k: string) => {
    const nextItems = items.filter((x) => x !== k);
    const nextTexts = { ...itemTexts };
    delete nextTexts[k];
    setItemTexts(nextTexts);
    const nextPairs = { ...pairs };
    delete nextPairs[k];
    onChange(nextPairs, featuresToOptions(features, options));
  };

  const handleAddFeature = () => {
    const used = features.map((f) => f.letter);
    const next = FEATURE_LETTERS.find((l) => !used.includes(l));
    if (!next) return;
    setFeatures([...features, { letter: next, label: `${next}. ` }]);
  };

  const handleUpdateFeature = (idx: number, label: string) => {
    const next = features.map((f, i) => (i === idx ? { ...f, label } : f));
    setFeatures(next);
    persistAll(items, itemTexts, next);
  };

  const handleRemoveFeature = (idx: number) => {
    const removed = features[idx];
    const next = features.filter((_, i) => i !== idx);
    setFeatures(next);

    const nextPairs = { ...pairs };
    for (const k of Object.keys(nextPairs)) {
      if (nextPairs[k]?.[0] === removed.letter) nextPairs[k] = null;
    }
    onChange(nextPairs, featuresToOptions(next, options));
  };

  const handleAssign = (itemKey: string, featureLetter: string) => {
    const nextPairs = { ...pairs };
    if (nextPairs[itemKey]?.[0] === featureLetter) {
      nextPairs[itemKey] = null;
    } else {
      nextPairs[itemKey] = [featureLetter, itemTexts[itemKey] || ""];
    }
    onChange(nextPairs, featuresToOptions(features, options));
  };

  return (
    <div className="space-y-4">
      <div className="p-3 rounded-xl bg-indigo-950/30 border border-indigo-900/40 text-[11px] text-indigo-200">
        Each numbered item (1, 2, 3, …) maps to a feature (A, B, C, …). Features
        can be reused across multiple items.
      </div>

      <div className="p-4 rounded-xl bg-slate-900/50 border border-slate-800 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Features ({features.length})
          </span>
          <button
            type="button"
            onClick={handleAddFeature}
            className="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-medium rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition"
          >
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            Add Feature
          </button>
        </div>
        <div className="space-y-1.5">
          {features.map((f, i) => (
            <div
              key={`${f.letter}-${i}`}
              className="flex items-center gap-2 p-2 rounded-lg bg-slate-950 border border-slate-800"
            >
              <span className="shrink-0 w-7 text-center font-mono text-xs font-bold text-indigo-300">
                {f.letter}
              </span>
              <input
                type="text"
                value={f.label}
                onChange={(e) => handleUpdateFeature(i, e.target.value)}
                placeholder="A. Feature description"
                className="flex-1 bg-transparent text-xs text-slate-200 focus:outline-none"
              />
              <button
                type="button"
                onClick={() => handleRemoveFeature(i)}
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
            Items ({items.length})
          </span>
          <button
            type="button"
            onClick={handleAddItem}
            className="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-medium rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition"
          >
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            Add Item
          </button>
        </div>
        {items.length === 0 ? (
          <div className="p-4 text-center rounded-lg border border-dashed border-slate-800 text-xs text-slate-500">
            No items yet. Add 1. 2. 3. to the prompt or click &ldquo;Add Item&rdquo;.
          </div>
        ) : (
          items.map((k) => {
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
                  value={itemTexts[k] || ""}
                  onChange={(e) => handleUpdateItem(k, e.target.value)}
                  placeholder="Item text or speaker name…"
                  className="flex-1 bg-transparent text-xs text-slate-200 placeholder-slate-600 focus:outline-none border-b border-transparent hover:border-slate-700 focus:border-indigo-500"
                />
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold text-slate-500">FEATURE</span>
                  <select
                    value={ans}
                    onChange={(e) => handleAssign(k, e.target.value)}
                    className="bg-slate-950 border border-slate-700 rounded-md px-2 py-1 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                  >
                    <option value="">—</option>
                    {features.map((f) => (
                      <option key={f.letter} value={f.letter}>
                        {f.letter}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => handleRemoveItem(k)}
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
