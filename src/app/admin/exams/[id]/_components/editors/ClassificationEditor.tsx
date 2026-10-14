"use client";

import { useEffect, useMemo, useState } from "react";
import { InternalDeliveryOption } from "@/app/admin/_lib/types";

interface ClassificationEditorProps {
  matchPairs?: Record<string, string[] | null> | null;
  options: InternalDeliveryOption[];
  promptMd?: string | null;
  onChange: (
    pairs: Record<string, string[] | null>,
    options: InternalDeliveryOption[]
  ) => void;
  onPromptChange?: (prompt: string) => void;
}

interface Choice {
  key: string;
  label: string;
}

function parsePrompt(prompt: string | null | undefined): {
  intro: string;
  categories: { letter: string; label: string }[];
  statements: { idx: number; text: string }[];
} {
  const text = (prompt || "").replace(/\\n/g, "\n").trim();
  const categories: { letter: string; label: string }[] = [];
  const statements: { idx: number; text: string }[] = [];

  const catRegex = /^([A-Z])\.\s+(.+)$/gm;
  let m: RegExpExecArray | null;
  while ((m = catRegex.exec(text)) !== null) {
    categories.push({ letter: m[1], label: m[2].trim() });
  }

  const stmtRegex = /^(\d+)\.\s+(.+)$/gm;
  while ((m = stmtRegex.exec(text)) !== null) {
    statements.push({ idx: parseInt(m[1], 10) - 1, text: m[2].trim() });
  }

  let intro = "";
  if (categories.length > 0) {
    const firstCat = text.match(/^[A-Z]\.\s+/m);
    if (firstCat && firstCat.index !== undefined) {
      intro = text.slice(0, firstCat.index).trim();
    }
  }

  return { intro, categories, statements };
}

function optionsToChoices(options: InternalDeliveryOption[]): Choice[] {
  return options
    .map((o) => {
      const raw = (o.contentMd || "").trim();
      const m = raw.match(/^([A-Z])\.\s+(.*)$/);
      if (m) return { key: m[1].toLowerCase(), label: raw };
      return { key: String(o.idx), label: raw };
    })
    .filter((c) => c.label);
}

function choicesToOptions(
  choices: Choice[],
  prev: InternalDeliveryOption[]
): InternalDeliveryOption[] {
  return choices.map((c, i) => {
    const existing = prev[i];
    return {
      id: existing?.id || `temp-cls-${Date.now()}-${i}`,
      idx: i + 1,
      contentMd: c.label,
      isCorrect: false,
    };
  });
}

function buildPrompt(intro: string, cats: { letter: string; label: string }[], stats: { idx: number; text: string }[]): string {
  const catsBlock = cats.map((c) => `${c.letter}. ${c.label}`).join("\n");
  const statsBlock = stats.map((s, i) => `${i + 1}. ${s.text}`).join("\n");
  return [intro, catsBlock, statsBlock].filter(Boolean).join("\n\n");
}

export function ClassificationEditor({
  matchPairs,
  options,
  promptMd,
  onChange,
  onPromptChange,
}: ClassificationEditorProps) {
  const pairs = matchPairs || {};

  const initial = useMemo(() => parsePrompt(promptMd), [promptMd]);

  const initialCats = useMemo(() => {
    if (initial.categories.length > 0) {
      return initial.categories.map((c) => ({ key: c.letter.toLowerCase(), label: `${c.letter}. ${c.label}` }));
    }
    return optionsToChoices(options);
  }, [initial.categories, options]);

  const [intro, setIntro] = useState(initial.intro);
  const [cats, setCats] = useState(initial.categories);
  const [stats, setStats] = useState(initial.statements);
  const [choices, setChoices] = useState<Choice[]>(initialCats);

  const [newCatLetter, setNewCatLetter] = useState("");
  const [newCatLabel, setNewCatLabel] = useState("");

  useEffect(() => {
    const parsed = parsePrompt(promptMd);
    setIntro(parsed.intro);
    if (parsed.categories.length > 0) {
      setCats(parsed.categories);
    }
    setStats(parsed.statements);
    if (parsed.categories.length > 0) {
      setChoices(
        parsed.categories.map((c) => ({ key: c.letter.toLowerCase(), label: `${c.letter}. ${c.label}` }))
      );
    } else if (options.length > 0) {
      setChoices(optionsToChoices(options));
    }
  }, [promptMd, options]);

  const persist = (nextIntro: string, nextCats: typeof cats, nextStats: typeof stats) => {
    if (onPromptChange) onPromptChange(buildPrompt(nextIntro, nextCats, nextStats));
  };

  const handleIntroChange = (val: string) => {
    setIntro(val);
    persist(val, cats, stats);
  };

  const handleAddCategory = () => {
    const letter = newCatLetter.trim().toUpperCase();
    const label = newCatLabel.trim();
    if (!letter || !label) return;
    if (cats.some((c) => c.letter === letter)) return;
    const next = [...cats, { letter, label }];
    setCats(next);
    setChoices([...choices, { key: letter.toLowerCase(), label: `${letter}. ${label}` }]);
    setNewCatLetter("");
    setNewCatLabel("");
    persist(intro, next, stats);
  };

  const handleRemoveCategory = (idx: number) => {
    const removed = cats[idx];
    const next = cats.filter((_, i) => i !== idx);
    setCats(next);
    setChoices(choices.filter((c) => c.key !== removed?.letter.toLowerCase()));

    const nextPairs: Record<string, string[] | null> = {};
    for (const [k, v] of Object.entries(pairs)) {
      if (v && v[0] && v[0].toUpperCase() === removed?.letter) {
        nextPairs[k] = null;
      } else {
        nextPairs[k] = v;
      }
    }
    onChange(nextPairs, choicesToOptions(choices.filter((c) => c.key !== removed?.letter.toLowerCase()), options));
    persist(intro, next, stats);
  };

  const handleUpdateChoice = (idx: number, val: string) => {
    const next = choices.map((c, i) => (i === idx ? { ...c, label: val } : c));
    setChoices(next);
    onChange(pairs, choicesToOptions(next, options));

    const m = val.match(/^([A-Z])\.\s+(.*)$/);
    if (m) {
      const newCats = cats.map((c, i) => (i === idx ? { letter: m[1], label: m[2] } : c));
      setCats(newCats);
      persist(intro, newCats, stats);
    }
  };

  const handleAddStatement = () => {
    const next = [...stats, { idx: stats.length, text: "" }];
    setStats(next);
    persist(intro, cats, next);
  };

  const handleUpdateStatement = (idx: number, val: string) => {
    const next = stats.map((s, i) => (i === idx ? { ...s, text: val } : s));
    setStats(next);
    persist(intro, cats, next);
  };

  const handleRemoveStatement = (idx: number) => {
    const next = stats.filter((_, i) => i !== idx).map((s, i) => ({ ...s, idx: i }));
    setStats(next);

    const nextPairs: Record<string, string[] | null> = {};
    for (const [k, v] of Object.entries(pairs)) {
      const kIdx = Number(k);
      if (kIdx < next.length) {
        nextPairs[String(kIdx)] = v;
      }
    }
    onChange(nextPairs, options);
    persist(intro, cats, next);
  };

  const handleMoveStatement = (idx: number, dir: "up" | "down") => {
    const target = dir === "up" ? idx - 1 : idx + 1;
    if (target < 0 || target >= stats.length) return;
    const copy = [...stats];
    const tmp = copy[idx];
    copy[idx] = copy[target];
    copy[target] = tmp;
    const renum = copy.map((s, i) => ({ ...s, idx: i }));
    setStats(renum);
    persist(intro, cats, renum);
  };

  const handleSelectAnswer = (statementIdx: number, choiceKey: string) => {
    const key = String(statementIdx);
    const nextPairs = { ...pairs };
    if (nextPairs[key] && nextPairs[key]?.[0]?.toLowerCase() === choiceKey) {
      nextPairs[key] = null;
    } else {
      nextPairs[key] = [choiceKey.toUpperCase()];
    }
    onChange(nextPairs, choicesToOptions(choices, options));
  };

  const getAnswer = (idx: number): string => {
    const v = pairs[String(idx)];
    return v && v.length > 0 ? v[0].toLowerCase() : "";
  };

  const getDisplayText = (key: string): string => {
    const found = choices.find((c) => c.key.toLowerCase() === key.toLowerCase());
    return found?.label || key.toUpperCase();
  };

  return (
    <div className="space-y-4">
      {/* Prompt / Instructions (matches do-test stem style) */}
      <div>
        <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
          Prompt (visible to learner)
        </label>
        <textarea
          rows={4}
          value={promptMd || ""}
          onChange={(e) => handleIntroChange(e.target.value)}
          placeholder="Classify the following as referring to:&#10;A. dopamine research&#10;B. cultural factors&#10;C. musical training&#10;&#10;1. Statement one...&#10;2. Statement two..."
          className="w-full bg-white border-2 border-slate-200 rounded-xl p-3 text-sm text-slate-900 leading-relaxed font-medium placeholder-slate-400 focus:outline-none focus:border-[#2563EB]"
        />
        <p className="text-[10px] text-slate-500 mt-1">
          Use the <span className="font-mono">A.&nbsp;label</span> pattern for categories and{" "}
          <span className="font-mono">1.&nbsp;text</span> for statements. Both are parsed automatically.
        </p>
      </div>

      {/* Available Choices box — mirrors do-test "LIST OF AVAILABLE HEADINGS / OPTIONS" */}
      <div className="p-5 rounded-2xl bg-slate-50 border-2 border-slate-200 text-xs space-y-2 shadow-2xs">
        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
          List of Available Choices:
        </span>

        {choices.length === 0 ? (
          <p className="text-[11px] text-slate-500 italic">No choices yet — add categories below or in prompt.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {choices.map((c, i) => (
              <div key={`${c.key}-${i}`} className="flex items-start gap-2 text-slate-700">
                <span className="font-mono text-[#2563EB] font-bold shrink-0">[{c.key}]</span>
                <input
                  type="text"
                  value={c.label}
                  onChange={(e) => handleUpdateChoice(i, e.target.value)}
                  className="flex-1 bg-transparent border-b border-transparent hover:border-slate-300 focus:border-[#2563EB] focus:outline-none font-medium text-slate-700"
                />
                <button
                  type="button"
                  onClick={() => handleRemoveCategory(i)}
                  className="text-slate-400 hover:text-rose-500 transition shrink-0"
                  title="Remove"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="flex items-center gap-2 pt-2 border-t border-slate-200">
          <input
            type="text"
            value={newCatLetter}
            onChange={(e) => setNewCatLetter(e.target.value.toUpperCase())}
            placeholder="A"
            maxLength={3}
            className="w-10 bg-white border border-slate-300 rounded px-2 py-1 text-xs text-center font-mono font-bold placeholder-slate-400 focus:outline-none focus:border-[#2563EB]"
          />
          <input
            type="text"
            value={newCatLabel}
            onChange={(e) => setNewCatLabel(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleAddCategory())}
            placeholder="Category label (e.g. dopamine research)"
            className="flex-1 bg-white border border-slate-300 rounded px-2 py-1 text-xs text-slate-700 placeholder-slate-400 focus:outline-none focus:border-[#2563EB]"
          />
          <button
            type="button"
            onClick={handleAddCategory}
            className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold rounded bg-[#2563EB] hover:bg-[#1D4ED8] text-white transition"
          >
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            Add
          </button>
        </div>
      </div>

      {/* Statements × Choices matrix — mirrors do-test "Target [N]" rows */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
            Statements ({stats.length})
          </span>
          <span className="text-[10px] text-slate-600">— set correct match for each</span>
          <button
            type="button"
            onClick={handleAddStatement}
            className="ml-auto inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold rounded bg-slate-800 hover:bg-slate-700 text-slate-200 transition"
          >
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            Add Statement
          </button>
        </div>

        {stats.length === 0 ? (
          <div className="p-6 text-center rounded-xl border-2 border-dashed border-slate-200 text-xs text-slate-500">
            No statements yet. Add 1. &hellip; 2. &hellip; 3. &hellip; to the prompt above, or click &ldquo;Add Statement&rdquo;.
          </div>
        ) : (
          stats.map((s, idx) => {
            const selected = getAnswer(idx);
            return (
              <div
                key={idx}
                className="p-4 rounded-2xl border-2 border-slate-200 bg-white space-y-2 shadow-2xs"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5 flex-1 min-w-0">
                    <span className="font-mono text-xs font-bold text-[#2563EB] bg-blue-50 border border-blue-200 px-3 py-1 rounded-xl shrink-0">
                      Target [{idx}]
                    </span>
                    <input
                      type="text"
                      value={s.text}
                      onChange={(e) => handleUpdateStatement(idx, e.target.value)}
                      placeholder="Statement text…"
                      className="flex-1 bg-transparent border-b border-transparent hover:border-slate-200 focus:border-[#2563EB] focus:outline-none text-xs font-medium text-slate-700 placeholder-slate-400"
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    <select
                      value={selected}
                      onChange={(e) => handleSelectAnswer(idx, e.target.value)}
                      className="bg-white border-2 border-slate-300 rounded-xl px-3.5 py-2 text-xs font-medium text-slate-800 focus:outline-none focus:border-[#2563EB] min-w-48"
                    >
                      <option value="">-- Select choice --</option>
                      {choices.map((c) => (
                        <option key={c.key} value={c.key}>
                          [{c.key}] {getDisplayText(c.key)}
                        </option>
                      ))}
                    </select>
                    <div className="flex flex-col gap-0.5">
                      <button
                        type="button"
                        disabled={idx === 0}
                        onClick={() => handleMoveStatement(idx, "up")}
                        className="p-0.5 text-slate-400 hover:text-slate-700 disabled:opacity-30"
                        title="Move up"
                      >
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
                        </svg>
                      </button>
                      <button
                        type="button"
                        disabled={idx === stats.length - 1}
                        onClick={() => handleMoveStatement(idx, "down")}
                        className="p-0.5 text-slate-400 hover:text-slate-700 disabled:opacity-30"
                        title="Move down"
                      >
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRemoveStatement(idx)}
                        className="p-0.5 text-slate-400 hover:text-rose-500"
                        title="Remove"
                      >
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* JSON payload debug */}
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
