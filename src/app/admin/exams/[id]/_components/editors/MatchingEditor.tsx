"use client";

import { useState, useMemo } from "react";
import { InternalDeliveryOption, QuestionType } from "@/app/admin/_lib/types";

interface MatchingEditorProps {
  matchPairs?: Record<string, string[] | null> | null;
  options: InternalDeliveryOption[];
  questionType: string;
  promptMd?: string | null;
  onChange: (
    pairs: Record<string, string[] | null>,
    options: InternalDeliveryOption[]
  ) => void;
}

type Variant = "heading" | "information" | "features" | "endings";

function detectVariant(t: string): Variant | null {
  switch (t) {
    case QuestionType.MatchingHeading:
      return "heading";
    case QuestionType.MatchingInformation:
      return "information";
    case QuestionType.MatchingFeatures:
      return "features";
    case QuestionType.MatchingEndings:
      return "endings";
    default:
      return null;
  }
}

function parsePrompt(prompt: string | null | undefined): {
  items: { key: string; text: string }[];
} {
  const text = (prompt || "").replace(/\\n/g, "\n");
  const items: { key: string; text: string }[] = [];

  const numbered = /^(\d+)\.\s+(.+)$/gm;
  let m: RegExpExecArray | null;
  while ((m = numbered.exec(text)) !== null) {
    items.push({ key: m[1], text: m[2].trim() });
  }

  if (items.length === 0) {
    const lettered = /^([A-Z])\.\s+(.+)$/gm;
    while ((m = lettered.exec(text)) !== null) {
      items.push({ key: m[1], text: m[2].trim() });
    }
  }
  return { items };
}

function defaultChoices(variant: Variant, count: number): string[] {
  if (variant === "heading") {
    const romans = ["i", "ii", "iii", "iv", "v", "vi", "vii", "viii", "ix", "x"];
    return romans.slice(0, Math.max(count, 4));
  }
  const letters = ["A", "B", "C", "D", "E", "F", "G", "H"];
  return letters.slice(0, Math.max(count, 4));
}

export function MatchingEditor({
  matchPairs,
  options,
  questionType,
  promptMd,
  onChange,
}: MatchingEditorProps) {
  const variant = detectVariant(questionType);
  const pairs = matchPairs || {};

  const parsed = useMemo(() => parsePrompt(promptMd), [promptMd]);
  const itemKeys = useMemo(
    () => (parsed.items.length > 0 ? parsed.items.map((i) => i.key) : Object.keys(pairs).sort()),
    [parsed.items, pairs]
  );

  const initialChoiceKeys = useMemo(() => {
    if (options.length > 0) {
      return options.map((o) => {
        const m = (o.contentMd || "").trim().match(/^([ivxlcdm]+|[A-Z]|[a-z0-9]+)\.?\s*/i);
        return m ? m[1].toUpperCase().replace(/^I$/, "i") : String(o.idx);
      });
    }
    const fromPairs = new Set<string>();
    for (const v of Object.values(pairs)) {
      if (v && v[0]) fromPairs.add(v[0]);
    }
    if (fromPairs.size > 0) return Array.from(fromPairs);
    return defaultChoices(variant || "features", 4);
  }, [options, pairs, variant]);

  const [choiceLetters, setChoiceLetters] = useState<string[]>(initialChoiceKeys);
  const [newChoiceLetter, setNewChoiceLetter] = useState("");

  const getItemText = (key: string): string => {
    const found = parsed.items.find((i) => i.key === key);
    if (found) return found.text;
    return "";
  };

  const setAnswer = (itemKey: string, choiceLetter: string) => {
    const next = { ...pairs };
    if (next[itemKey] && next[itemKey]?.[0] === choiceLetter) {
      next[itemKey] = null;
    } else {
      next[itemKey] = [choiceLetter];
    }
    onChange(next, options);
  };

  const getAnswer = (itemKey: string): string => {
    const v = pairs[itemKey];
    return v && v.length > 0 ? v[0] : "";
  };

  const syncOptions = (letters: string[]) => {
    const next: InternalDeliveryOption[] = letters.map((letter, i) => {
      const existing = options[i];
      const prefix = variant === "heading" ? letter : `${letter}. `;
      const placeholder =
        variant === "heading"
          ? `${letter}. The Early Years`
          : variant === "information"
            ? `${letter}. Paragraph ${letter}`
            : variant === "features"
              ? `${letter}. Feature description`
              : `${letter}. Sentence ending`;
      return {
        id: existing?.id || `temp-match-${Date.now()}-${i}`,
        idx: i + 1,
        contentMd: existing?.contentMd?.match(/^[ivxlcdm]+|[A-Z]\.?/i)
          ? existing.contentMd
          : `${prefix}${placeholder.replace(prefix, "")}`,
        isCorrect: false,
      };
    });
    return next;
  };

  const handleAddChoice = () => {
    const raw = newChoiceLetter.trim();
    if (!raw) return;
    const norm = raw.toUpperCase();
    if (choiceLetters.includes(norm) || choiceLetters.includes(raw.toLowerCase())) {
      alert(`Choice "${raw}" already exists`);
      return;
    }
    const next = variant === "heading" ? [...choiceLetters, raw.toLowerCase()] : [...choiceLetters, norm];
    setChoiceLetters(next);
    setNewChoiceLetter("");
    onChange(pairs, syncOptions(next));
  };

  const handleRemoveChoice = (idx: number) => {
    const next = choiceLetters.filter((_, i) => i !== idx);
    setChoiceLetters(next);
    onChange(pairs, syncOptions(next));
  };

  const handleUpdateChoice = (idx: number, val: string) => {
    const next = choiceLetters.map((c, i) => (i === idx ? val : c));
    setChoiceLetters(next);
    onChange(pairs, syncOptions(next));
  };

  const promptLabel =
    variant === "heading"
      ? "Paragraphs (auto-parsed from prompt or enter keys)"
      : variant === "information"
        ? "Questions (auto-parsed from prompt or enter keys)"
        : variant === "features"
          ? "Items to be matched (auto-parsed from prompt or enter keys)"
          : "Sentence beginnings (auto-parsed from prompt or enter keys)";

  return (
    <div className="space-y-5">
      {/* Choice pool editor */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Choice Pool ({choiceLetters.length})
          </span>
          <span className="text-[11px] text-slate-500">
            {variant === "heading"
              ? "Roman numerals (i, ii, iii…) — IELTS heading style"
              : "Uppercase letters (A, B, C…)"}
          </span>
        </div>

        <div className="flex flex-wrap gap-1.5 p-3 rounded-lg bg-slate-900/70 border border-slate-800">
          {choiceLetters.map((c, i) => (
            <div
              key={`${c}-${i}`}
              className="inline-flex items-center gap-1 pl-2 pr-1 py-1 rounded-md bg-slate-950 border border-slate-700"
            >
              <input
                type="text"
                value={c}
                onChange={(e) => handleUpdateChoice(i, e.target.value)}
                maxLength={5}
                className="w-10 bg-transparent text-xs text-center font-mono font-bold text-indigo-300 focus:outline-none"
              />
              <button
                type="button"
                onClick={() => handleRemoveChoice(i)}
                className="p-0.5 text-slate-500 hover:text-rose-400 transition"
                title="Remove choice"
              >
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          ))}
          <div className="inline-flex items-center gap-1">
            <input
              type="text"
              value={newChoiceLetter}
              onChange={(e) => setNewChoiceLetter(e.target.value)}
              placeholder={variant === "heading" ? "xi" : "I"}
              maxLength={5}
              onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleAddChoice())}
              className="w-12 bg-slate-950 border border-slate-700 rounded-md px-1.5 py-1 text-xs text-center font-mono placeholder-slate-600 focus:outline-none focus:border-indigo-500"
            />
            <button
              type="button"
              onClick={handleAddChoice}
              className="inline-flex items-center px-1.5 py-1 text-xs font-medium rounded-md bg-indigo-600 hover:bg-indigo-500 text-white transition"
              title="Add choice"
            >
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Items with answer key */}
      <div className="space-y-2">
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
          {promptLabel}
        </span>

        {itemKeys.length === 0 ? (
          <div className="p-4 text-center rounded-lg border border-dashed border-slate-800 text-xs text-slate-500">
            No items found. Add items to the prompt (e.g. <span className="font-mono">14. ...</span>)
            or pair keys will be derived from existing answers.
          </div>
        ) : (
          <div className="space-y-2">
            {itemKeys.map((key) => {
              const selected = getAnswer(key);
              const itemText = getItemText(key);
              return (
                <div
                  key={key}
                  className="p-3 rounded-lg bg-slate-900/70 border border-slate-800"
                >
                  <div className="flex items-start gap-3 mb-2">
                    <span className="shrink-0 inline-flex items-center justify-center w-7 h-7 rounded-md bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-mono text-xs font-bold">
                      {key}
                    </span>
                    <div className="flex-1 text-xs text-slate-200 leading-relaxed">
                      {itemText || (
                        <span className="italic text-slate-500">
                          (text not in prompt — add it or rely on pair key only)
                        </span>
                      )}
                    </div>
                  </div>

                  {choiceLetters.length === 0 ? (
                    <p className="text-[11px] text-amber-400/80 italic pl-9">
                      Add at least one choice above.
                    </p>
                  ) : (
                    <div className="flex items-center gap-2 pl-9 flex-wrap">
                      <span className="text-[11px] uppercase font-semibold text-slate-500">
                        Answer:
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {choiceLetters.map((c) => {
                          const isSel = selected.toLowerCase() === c.toLowerCase();
                          return (
                            <button
                              key={c}
                              type="button"
                              onClick={() => setAnswer(key, c)}
                              className={`inline-flex items-center justify-center min-w-[2rem] px-2 py-1 rounded-md text-xs font-bold transition border ${
                                isSel
                                  ? "bg-emerald-500/20 text-emerald-200 border-emerald-500/50"
                                  : "bg-slate-950 text-slate-400 border-slate-700 hover:border-slate-500"
                              }`}
                            >
                              {c}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Raw payload */}
      <details className="text-[11px] text-slate-500">
        <summary className="cursor-pointer hover:text-slate-300">
          Show stored MatchPairs payload
        </summary>
        <pre className="mt-2 p-2 rounded bg-slate-950 border border-slate-800 text-slate-300 overflow-x-auto">
          {JSON.stringify(pairs, null, 2)}
        </pre>
      </details>
    </div>
  );
}
