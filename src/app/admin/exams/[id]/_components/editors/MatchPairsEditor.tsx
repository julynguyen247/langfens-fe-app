"use client";

import { useState } from "react";
import { InternalDeliveryOption } from "@/app/admin/_lib/types";

interface MatchPairsEditorProps {
  matchPairs?: Record<string, string[] | null> | null;
  options: InternalDeliveryOption[];
  questionType: string;
  onChange: (
    pairs: Record<string, string[] | null>,
    options: InternalDeliveryOption[]
  ) => void;
}

export function MatchPairsEditor({
  matchPairs,
  options,
  questionType,
  onChange,
}: MatchPairsEditorProps) {
  const pairs = matchPairs || {};
  const promptKeys = Object.keys(pairs).sort();

  const [newPromptKey, setNewPromptKey] = useState("");
  const [newGradingKey, setNewGradingKey] = useState("");
  const [newDisplayText, setNewDisplayText] = useState("");

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

  // Option pool management (e.g. available headings or available categories)
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

  return (
    <div className="space-y-6">
      {/* Pairs Section */}
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

        {/* Add pair form */}
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

        {/* Existing pairs list */}
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
