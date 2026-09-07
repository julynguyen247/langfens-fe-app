"use client";

import { useState } from "react";

interface ShortAnswerEditorProps {
  shortAnswerAcceptTexts?: string[] | null;
  shortAnswerAcceptRegex?: string[] | null;
  onChange: (texts: string[], regex: string[]) => void;
}

export function ShortAnswerEditor({
  shortAnswerAcceptTexts,
  shortAnswerAcceptRegex,
  onChange,
}: ShortAnswerEditorProps) {
  const texts = shortAnswerAcceptTexts || [];
  const regex = shortAnswerAcceptRegex || [];

  const [newTextInput, setNewTextInput] = useState("");
  const [newRegexInput, setNewRegexInput] = useState("");

  const handleAddText = () => {
    const val = newTextInput.trim();
    if (!val) return;
    onChange([...texts, val], regex);
    setNewTextInput("");
  };

  const handleRemoveText = (index: number) => {
    onChange(
      texts.filter((_, i) => i !== index),
      regex
    );
  };

  const handleAddRegex = () => {
    const val = newRegexInput.trim();
    if (!val) return;
    onChange(texts, [...regex, val]);
    setNewRegexInput("");
  };

  const handleRemoveRegex = (index: number) => {
    onChange(
      texts,
      regex.filter((_, i) => i !== index)
    );
  };

  return (
    <div className="space-y-4">
      {/* Accepted Texts Section */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Accepted Answer Texts *
          </label>
          <span className="text-[11px] text-slate-500">
            Candidate answer will be compared case-insensitively with these
          </span>
        </div>

        <div className="flex items-center gap-2">
          <input
            type="text"
            placeholder="Add valid answer text (e.g. 15 percent, 15%)..."
            value={newTextInput}
            onChange={(e) => setNewTextInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleAddText())}
            className="flex-1 bg-slate-950 border border-slate-800 rounded-md px-3 py-1.5 text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-indigo-500"
          />
          <button
            type="button"
            onClick={handleAddText}
            className="px-3 py-1.5 text-xs font-medium rounded-md bg-indigo-600 hover:bg-indigo-500 text-white transition"
          >
            Add
          </button>
        </div>

        <div className="flex flex-wrap gap-2 pt-1">
          {texts.map((t, idx) => (
            <span
              key={idx}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-900 border border-slate-800 text-xs text-slate-200"
            >
              <span>{t}</span>
              <button
                type="button"
                onClick={() => handleRemoveText(idx)}
                className="text-slate-500 hover:text-rose-400 leading-none"
              >
                ✕
              </button>
            </span>
          ))}
          {texts.length === 0 && (
            <p className="text-xs text-amber-400/80 italic">
              No accepted texts added yet. Add at least one valid answer text.
            </p>
          )}
        </div>
      </div>

      {/* Accepted Regex Patterns */}
      <div className="space-y-2 pt-3 border-t border-slate-800">
        <div className="flex items-center justify-between">
          <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Optional Regex Matchers
          </label>
          <span className="text-[11px] text-slate-500">
            Advanced regex patterns for fuzzy or formatted answers
          </span>
        </div>

        <div className="flex items-center gap-2">
          <input
            type="text"
            placeholder="e.g. ^15\\s*(%|percent)$"
            value={newRegexInput}
            onChange={(e) => setNewRegexInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleAddRegex())}
            className="flex-1 bg-slate-950 border border-slate-800 rounded-md px-3 py-1.5 text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-indigo-500 font-mono"
          />
          <button
            type="button"
            onClick={handleAddRegex}
            className="px-3 py-1.5 text-xs font-medium rounded-md bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition"
          >
            Add Regex
          </button>
        </div>

        <div className="flex flex-wrap gap-2 pt-1">
          {regex.map((r, idx) => (
            <span
              key={idx}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-950 border border-slate-800 text-xs font-mono text-indigo-300"
            >
              <span>{r}</span>
              <button
                type="button"
                onClick={() => handleRemoveRegex(idx)}
                className="text-slate-500 hover:text-rose-400 leading-none"
              >
                ✕
              </button>
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
