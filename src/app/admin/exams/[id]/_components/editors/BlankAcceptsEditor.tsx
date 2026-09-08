"use client";

import { useState } from "react";

interface BlankAcceptsEditorProps {
  blankAcceptTexts?: Record<string, string[] | null> | null;
  blankAcceptRegex?: Record<string, string[] | null> | null;
  onChange: (
    texts: Record<string, string[] | null>,
    regex: Record<string, string[] | null>
  ) => void;
  variant?: "default" | "diagram" | "map";
  imageUrl?: string | null;
  onImageUrlChange?: (url: string) => void;
}

export function BlankAcceptsEditor({
  blankAcceptTexts,
  blankAcceptRegex,
  onChange,
  variant = "default",
  imageUrl,
  onImageUrlChange,
}: BlankAcceptsEditorProps) {
  const texts = blankAcceptTexts || {};
  const regex = blankAcceptRegex || {};

  const keys = Array.from(
    new Set([...Object.keys(texts), ...Object.keys(regex)])
  ).sort((a, b) => {
    const na = Number(a);
    const nb = Number(b);
    if (!isNaN(na) && !isNaN(nb)) return na - nb;
    return a.localeCompare(b);
  });

  const [newKeyInput, setNewKeyInput] = useState("");

  const heading =
    variant === "diagram"
      ? "Diagram Label Blanks"
      : variant === "map"
        ? "Map Label Blanks"
        : "Blanks & Accepted Answers";

  const helper =
    variant === "diagram"
      ? "Use [1], [2]… placeholders in prompt to mark each labeled part of the diagram."
      : variant === "map"
        ? "Use [1], [2]… placeholders in prompt to mark each labeled position on the map."
        : "Configure accepted strings and optional regex for each blank placeholder in prompt.";

  const placeholder = variant === "diagram" || variant === "map"
    ? "e.g. chlorophyll, chloroplast"
    : "e.g. apple, apples, an apple";

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
      {(variant === "diagram" || variant === "map") && onImageUrlChange && (
        <div className="p-3 rounded-lg bg-slate-900/50 border border-slate-800 space-y-2">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
            {variant === "diagram" ? "Diagram Image" : "Map Image"}
          </span>
          <div className="flex items-center gap-2">
            {imageUrl ? (
              <img
                src={imageUrl}
                alt=""
                className="w-12 h-12 rounded border border-slate-700 object-cover shrink-0"
              />
            ) : (
              <div className="w-12 h-12 rounded border border-dashed border-slate-700 flex items-center justify-center text-[10px] text-slate-600 shrink-0">
                {variant === "diagram" ? "DIAG" : "MAP"}
              </div>
            )}
            <input
              type="url"
              value={imageUrl || ""}
              onChange={(e) => onImageUrlChange(e.target.value)}
              placeholder={
                variant === "diagram"
                  ? "https://.../diagram.png"
                  : "https://.../map.png"
              }
              className="flex-1 bg-slate-950 border border-slate-800 rounded-md px-2.5 py-1.5 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-500"
            />
          </div>
          <p className="text-[10px] text-slate-500">
            Candidates see this image and type answers into the [1], [2]… blanks
            you define below.
          </p>
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            {heading}
          </span>
          <p className="text-[11px] text-slate-500 mt-0.5">{helper}</p>
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
                      Matches placeholder [{key}] in prompt
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

                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                    Accepted Text Answers (comma-separated for multiple valid spellings) *
                  </label>
                  <input
                    type="text"
                    placeholder={placeholder}
                    value={acceptedTextsList.join(", ")}
                    onChange={(e) => handleUpdateTexts(key, e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-md px-3 py-1.5 text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-indigo-500 font-mono"
                  />
                </div>

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
