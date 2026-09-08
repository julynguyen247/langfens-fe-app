"use client";

import { useEffect, useMemo, useState } from "react";
import { InternalDeliveryOption } from "@/app/admin/_lib/types";

interface MatchPairsEditorProps {
  matchPairs?: Record<string, string[] | null> | null;
  options: InternalDeliveryOption[];
  questionType: string;
  promptMd?: string | null;
  onChange: (
    pairs: Record<string, string[] | null>,
    options: InternalDeliveryOption[]
  ) => void;
}

interface InlineChoice {
  key: string;
  label: string;
}

function parseChoicesFromPrompt(prompt: string | null | undefined): InlineChoice[] {
  if (!prompt) return [];
  const text = prompt.replace(/\\n/g, "\n");
  const out: InlineChoice[] = [];
  const catRegex = /^([A-Z])\.\s+(.+)$/gm;
  let m: RegExpExecArray | null;
  while ((m = catRegex.exec(text)) !== null) {
    out.push({ key: m[1].toLowerCase(), label: `${m[1]}. ${m[2].trim()}` });
  }
  return out;
}

function parseTargetsFromPrompt(prompt: string | null | undefined): { idx: number; text: string }[] {
  if (!prompt) return [];
  const text = prompt.replace(/\\n/g, "\n");
  const out: { idx: number; text: string }[] = [];
  const re = /^(\d+)\.\s+(.+)$/gm;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) {
    out.push({ idx: parseInt(m[1], 10) - 1, text: m[2].trim() });
  }
  return out;
}

function isClassification(t: string): boolean {
  return t === "CLASSIFICATION";
}

export function MatchPairsEditor({
  matchPairs,
  options,
  questionType,
  promptMd,
  onChange,
}: MatchPairsEditorProps) {
  const pairs = matchPairs || {};
  const promptKeys = Object.keys(pairs).sort();

  const [newPromptKey, setNewPromptKey] = useState("");
  const [newGradingKey, setNewGradingKey] = useState("");
  const [newDisplayText, setNewDisplayText] = useState("");

  // ── Sync options pool with prompt categories for Classification ─────────
  // When user types "A. dopamine research" in the prompt, auto-populate the
  // options pool so do-test renders the full label, not just "A".
  useEffect(() => {
    if (!isClassification(questionType) || !promptMd) return;

    const promptCats = parseChoicesFromPrompt(promptMd);
    if (promptCats.length === 0) return;

    const existingLetters = new Set(
      options
        .map((o) => {
          const m = (o.contentMd || "").trim().match(/^([A-Z])\b/);
          return m ? m[1] : null;
        })
        .filter((x): x is string => Boolean(x))
    );

    let mutated = false;
    const next: InternalDeliveryOption[] = options.map((o) => ({ ...o }));
    let nextIdx = options.length + 1;

    for (const c of promptCats) {
      if (!existingLetters.has(c.key.toUpperCase())) {
        next.push({
          id: `auto-cls-${c.key}-${Date.now()}-${nextIdx}`,
          idx: nextIdx++,
          contentMd: c.label,
          isCorrect: false,
        });
        mutated = true;
      }
    }

    if (mutated) {
      onChange(pairs, next);
    }
  }, [promptMd, questionType, options, pairs, onChange]);

  // ── Inline quick-set state ────────────────────────────────────────────────
  // Resolved choices: prompt-parsed first, then options pool, then pair-derived
  const choices: InlineChoice[] = useMemo(() => {
    return options
      .map((o) => {
        const raw = (o.contentMd || "").trim();
        const m = raw.match(/^([A-Z]|[ivxlcdm]+|[a-z0-9]+)\.?\s*(.*)$/i);
        if (m) {
          return { key: m[1].toLowerCase(), label: raw };
        }
        return { key: String(o.idx), label: raw };
      })
      .filter((c) => c.label);
  }, [options]);

  const targets: { idx: number; text: string }[] = useMemo(() => {
    return promptKeys
      .map((k) => ({ idx: Number(k), text: pairs[k]?.[1] || pairs[k]?.[0] || "" }))
      .sort((a, b) => a.idx - b.idx);
  }, [promptKeys, pairs]);

  const handleUpdatePair = (
    promptKey: string,
    gradingKey: string,
    displayText: string
  ) => {
    const nextPairs = {
      ...pairs,
      [promptKey]: [gradingKey.trim(), displayText.trim()],
    };
    onChange(nextPairs, options);
  };

  const handleRemovePair = (promptKey: string) => {
    const nextPairs = { ...pairs };
    delete nextPairs[promptKey];
    onChange(nextPairs, options);
  };

  const handleAddPair = () => {
    const pKey = newPromptKey.trim();
    const gKey = newGradingKey.trim();
    if (!pKey || !gKey) {
      alert("Prompt Key and Answer Key are required");
      return;
    }

    if (pairs[pKey]) {
      alert(`Prompt Key "${pKey}" already exists`);
      return;
    }

    const nextPairs = {
      ...pairs,
      [pKey]: [gKey, newDisplayText.trim() || gKey],
    };
    setNewPromptKey("");
    setNewGradingKey("");
    setNewDisplayText("");
    onChange(nextPairs, options);
  };

  // ── Inline quick-set: click a choice to set as answer for next target ────
  const handleQuickAssign = (targetIdx: number, choiceKey: string) => {
    const key = String(targetIdx);
    const nextPairs = { ...pairs };
    const current = nextPairs[key]?.[0];
    if (current && current.toLowerCase() === choiceKey.toLowerCase()) {
      nextPairs[key] = null;
    } else {
      nextPairs[key] = [choiceKey.toUpperCase()];
    }
    onChange(nextPairs, options);
  };

  const handleAddTarget = () => {
    const nextIdx =
      targets.length > 0 ? Math.max(...targets.map((t) => t.idx)) + 1 : 0;
    const key = String(nextIdx);
    onChange({ ...pairs, [key]: [""] }, options);
  };

  // ── Option pool management ────────────────────────────────────────────────
  const handleAddPoolOption = () => {
    const nextIdx = options.length + 1;
    const newOpt: InternalDeliveryOption = {
      id: `temp-opt-${Date.now()}-${nextIdx}`,
      idx: nextIdx,
      contentMd: `Option ${nextIdx}`,
      isCorrect: false,
    };
    onChange(pairs, [...options, newOpt]);
  };

  const handleUpdatePoolOption = (idx: number, content: string) => {
    const updated = options.map((o) => (o.idx === idx ? { ...o, contentMd: content } : o));
    onChange(pairs, updated);
  };

  const handleRemovePoolOption = (idx: number) => {
    const filtered = options.filter((o) => o.idx !== idx);
    const renumbered = filtered.map((o, i) => ({ ...o, idx: i + 1 }));
    onChange(pairs, renumbered);
  };

  const getAnswer = (idx: number): string => {
    const v = pairs[String(idx)];
    return v && v[0] ? v[0].toLowerCase() : "";
  };

  return (
    <div className="space-y-6">
      {/* ── Inline Quick-Set Panel ──────────────────────────────────────── */}
      <div className="rounded-xl bg-slate-900/40 border border-slate-800 p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-emerald-400">
              Quick Inline Set
            </span>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Click a choice chip to assign it as the answer for a target row.
            </p>
          </div>
          <button
            type="button"
            onClick={handleAddTarget}
            className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-medium rounded-md bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition"
          >
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            Add Target
          </button>
        </div>

        {/* Choices row */}
        <div>
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
            Available Choices ({choices.length})
          </div>
          {choices.length === 0 ? (
            <p className="text-[11px] text-amber-400/80 italic">
              No choices yet — add to the Choice Pool below or define in the prompt.
            </p>
          ) : (
            <div className="flex flex-wrap gap-1.5">
              {choices.map((c) => (
                <span
                  key={c.key}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-950 border border-slate-700 text-xs text-slate-200"
                >
                  <span className="font-mono font-bold text-indigo-300">[{c.key}]</span>
                  <span className="truncate max-w-[12rem]">{c.label}</span>
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Targets × choices grid */}
        <div>
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
            Targets ({targets.length})
          </div>
          {targets.length === 0 ? (
            <p className="text-[11px] text-slate-500 italic">
              No targets yet. Add via form below or click &ldquo;Add Target&rdquo;.
            </p>
          ) : (
            <div className="space-y-1.5">
              {targets.map((t) => {
                const selected = getAnswer(t.idx);
                return (
                  <div
                    key={t.idx}
                    className="flex items-center gap-2 p-2 rounded-lg bg-slate-950 border border-slate-800"
                  >
                    <span className="shrink-0 font-mono text-[10px] font-bold text-indigo-300 w-10">
                      [{t.idx}]
                    </span>
                    <span className="flex-1 text-xs text-slate-300 truncate" title={t.text}>
                      {t.text || (
                        <span className="italic text-slate-500">no display text</span>
                      )}
                    </span>
                    <div className="flex flex-wrap gap-1 justify-end">
                      {choices.length === 0 ? (
                        <span className="text-[10px] text-amber-400/70 italic">add choices</span>
                      ) : (
                        choices.map((c) => {
                          const isSel = selected === c.key;
                          return (
                            <button
                              key={c.key}
                              type="button"
                              onClick={() => handleQuickAssign(t.idx, c.key)}
                              title={`Set answer to [${c.key}]`}
                              className={`inline-flex items-center justify-center min-w-[1.75rem] px-1.5 py-0.5 rounded text-[10px] font-bold transition border ${
                                isSel
                                  ? "bg-emerald-500/25 text-emerald-200 border-emerald-500/60"
                                  : "bg-slate-900 text-slate-400 border-slate-700 hover:border-slate-500"
                              }`}
                            >
                              {c.key}
                            </button>
                          );
                        })
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ── Pairs Section (form-based, the original admin UI) ───────────── */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Matching Pairs & Answer Key
            </span>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Maps questions/paragraphs to their correct matching item (e.g. A → i).
            </p>
          </div>
        </div>

        <div className="p-3 rounded-lg bg-slate-900/50 border border-slate-800 grid grid-cols-1 sm:grid-cols-4 gap-2.5 items-end">
          <div>
            <label className="block text-[11px] font-semibold text-slate-400 mb-1">
              Prompt Key *
            </label>
            <input
              type="text"
              placeholder="e.g. A or Q1"
              value={newPromptKey}
              onChange={(e) => setNewPromptKey(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-md px-2.5 py-1.5 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-500 font-mono"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-400 mb-1">
              Answer Key *
            </label>
            <input
              type="text"
              placeholder="e.g. i or B"
              value={newGradingKey}
              onChange={(e) => setNewGradingKey(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-md px-2.5 py-1.5 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-500 font-mono"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-400 mb-1">
              Display Label
            </label>
            <input
              type="text"
              placeholder="e.g. i. The Early Years"
              value={newDisplayText}
              onChange={(e) => setNewDisplayText(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-md px-2.5 py-1.5 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <button
            type="button"
            onClick={handleAddPair}
            className="w-full py-1.5 text-xs font-semibold rounded-md bg-indigo-600 hover:bg-indigo-500 text-white transition active:scale-95"
          >
            Add Pair
          </button>
        </div>

        <div className="space-y-2">
          {promptKeys.length === 0 ? (
            <div className="p-4 text-center rounded-lg border border-dashed border-slate-800 text-xs text-slate-500">
              No matching pairs defined yet. Use the form above to add pairs.
            </div>
          ) : (
            promptKeys.map((pKey) => {
              const val = pairs[pKey] || [];
              const gKey = val[0] || "";
              const dText = val[1] || "";

              return (
                <div
                  key={pKey}
                  className="flex items-center gap-3 p-3 rounded-lg bg-slate-900/80 border border-slate-800"
                >
                  <div className="shrink-0 font-mono text-xs font-bold text-indigo-300 w-16 truncate">
                    [{pKey}]
                  </div>

                  <div className="w-24 shrink-0">
                    <input
                      type="text"
                      placeholder="Grading key"
                      value={gKey}
                      onChange={(e) => handleUpdatePair(pKey, e.target.value, dText)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-md px-2 py-1 text-xs text-slate-100 font-mono focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div className="flex-1">
                    <input
                      type="text"
                      placeholder="Display label"
                      value={dText}
                      onChange={(e) => handleUpdatePair(pKey, gKey, e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-md px-2 py-1 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={() => handleRemovePair(pKey)}
                    className="p-1 text-slate-500 hover:text-rose-400 transition"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Available Choices / Headings Pool */}
      <div className="space-y-3 pt-4 border-t border-slate-800">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Choice Pool / Options List
            </span>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Available choices shown to the candidate (e.g. list of headings i..x or categories A..E).
            </p>
          </div>
          <button
            type="button"
            onClick={handleAddPoolOption}
            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-md bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 transition"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            Add Choice
          </button>
        </div>

        <div className="space-y-2">
          {options.map((opt) => (
            <div
              key={opt.idx}
              className="flex items-center gap-2 p-2 rounded-lg bg-slate-950 border border-slate-800/80"
            >
              <span className="font-mono text-xs text-slate-500 w-8 shrink-0">
                #{opt.idx}
              </span>
              <input
                type="text"
                value={opt.contentMd}
                onChange={(e) => handleUpdatePoolOption(opt.idx, e.target.value)}
                placeholder="Option text (e.g. i. The Early Years)"
                className="flex-1 bg-transparent text-xs text-slate-200 focus:outline-none"
              />
              <button
                type="button"
                onClick={() => handleRemovePoolOption(opt.idx)}
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
    </div>
  );
}
