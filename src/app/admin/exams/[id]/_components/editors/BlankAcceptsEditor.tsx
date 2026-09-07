"use client";

import { useState } from "react";

interface BlankAcceptsEditorProps {
  blankAcceptTexts?: Record<string, string[] | null> | null;
  blankAcceptRegex?: Record<string, string[] | null> | null;
  onChange: (
    texts: Record<string, string[] | null>,
    regex: Record<string, string[] | null>
  ) => void;
}

export function BlankAcceptsEditor({
  blankAcceptTexts,
  blankAcceptRegex,
  onChange,
}: BlankAcceptsEditorProps) {
  const texts = blankAcceptTexts || {};
  const regex = blankAcceptRegex || {};

  // All unique blank keys sorted
  const keys = Array.from(
    new Set([...Object.keys(texts), ...Object.keys(regex)])
  ).sort((a, b) => {
    const na = Number(a);
    const nb = Number(b);
    if (!isNaN(na) && !isNaN(nb)) return na - nb;
    return a.localeCompare(b);
  });

  const [newKeyInput, setNewKeyInput] = useState("");

  const handleUpdateTexts = (key: string, rawCsv: string) => {
    const items = rawCsv
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    const nextTexts = { ...texts, [key]: items.length > 0 ? items : null };
    onChange(nextTexts, regex);
  };

  const handleUpdateRegex = (key: string, rawCsv: string) => {
    const items = rawCsv
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    const nextRegex = { ...regex, [key]: items.length > 0 ? items : null };
    onChange(texts, nextRegex);
  };

  const handleAddBlank = (customKey?: string) => {
    let nextKey = customKey?.trim() || newKeyInput.trim();
    if (!nextKey) {
      // Find lowest unused integer key starting from 1
      let i = 1;
      while (keys.includes(String(i))) {
        i++;
      }
      nextKey = String(i);
    }

    if (keys.includes(nextKey)) {
      alert(`Blank "${nextKey}" already exists`);
      return;
    }

    const nextTexts = { ...texts, [nextKey]: [""] };
    const nextRegex = { ...regex, [nextKey]: null };
    setNewKeyInput("");
    onChange(nextTexts, nextRegex);
  };

  const handleRemoveBlank = (key: string) => {
    const nextTexts = { ...texts };
    const nextRegex = { ...regex };
    delete nextTexts[key];
    delete nextRegex[key];
    onChange(nextTexts, nextRegex);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Blanks & Accepted Answers
          </span>
          <p className="text-[11px] text-slate-500 mt-0.5">
            Configure accepted strings and optional regex for each blank placeholder in prompt.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <input
            type="text"
            placeholder="Blank key (e.g. 1)"
            value={newKeyInput}
            onChange={(e) => setNewKeyInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleAddBlank())}
            className="w-28 bg-slate-950 border border-slate-800 rounded-md px-2.5 py-1 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-500 font-mono"
          />
          <button
            type="button"
            onClick={() => handleAddBlank()}
            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-md bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-200 border border-indigo-500/40 transition"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            Add Blank
          </button>
        </div>
      </div>

      {/* List of Blanks */}
      <div className="space-y-3">
        {keys.length === 0 ? (
          <div className="p-4 text-center rounded-lg border border-dashed border-slate-800 text-xs text-slate-500">
            No blanks configured yet. Click &ldquo;Add Blank&rdquo; to define accepted answers for blank #1.
          </div>
        ) : (
          keys.map((key) => {
            const acceptedTextsList = texts[key] || [];
            const acceptedRegexList = regex[key] || [];

            return (
              <div
                key={key}
                className="p-3.5 rounded-lg bg-slate-900/70 border border-slate-800 space-y-2.5"
              >
                <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center justify-center px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-mono text-xs font-bold">
                      Blank [{key}]
                    </span>
                    <span className="text-[11px] text-slate-500">
                      Matches placeholder [1] or [{key}] in prompt
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveBlank(key)}
                    className="text-slate-500 hover:text-rose-400 text-xs flex items-center gap-1 transition"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    Delete Blank
                  </button>
                </div>

                {/* Accepted texts */}
                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                    Accepted Text Answers (comma-separated for multiple valid spellings) *
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. apple, apples, an apple"
                    value={acceptedTextsList.join(", ")}
                    onChange={(e) => handleUpdateTexts(key, e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-md px-3 py-1.5 text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-indigo-500 font-mono"
                  />
                </div>

                {/* Accepted regex */}
                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                    Optional Regex Patterns (comma-separated, e.g. ^apple(s)?$)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. ^apple(s)?$"
                    value={acceptedRegexList.join(", ")}
                    onChange={(e) => handleUpdateRegex(key, e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-md px-3 py-1.5 text-xs text-slate-300 placeholder-slate-700 focus:outline-none focus:border-indigo-500 font-mono text-[11px]"
                  />
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
