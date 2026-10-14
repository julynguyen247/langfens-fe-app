"use client";

import { useState } from "react";

interface FlowChartEditorProps {
  orderCorrects?: string[] | null;
  onChange: (orderedKeys: string[]) => void;
}

export function FlowChartEditor({
  orderCorrects,
  onChange,
}: FlowChartEditorProps) {
  const keys = orderCorrects || [];
  const [newKey, setNewKey] = useState("");

  const handleAdd = () => {
    const raw = newKey.trim();
    if (!raw) return;

    // Convert to slug-like key: lowercased, spaces replaced by '-'
    const slugKey = raw
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9-]/g, "");

    if (!slugKey) return;
    if (keys.includes(slugKey)) {
      alert(`Step "${slugKey}" is already in the flow chart`);
      return;
    }

    onChange([...keys, slugKey]);
    setNewKey("");
  };

  const handleRemove = (index: number) => {
    onChange(keys.filter((_, i) => i !== index));
  };

  const handleMove = (index: number, direction: "up" | "down") => {
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= keys.length) return;

    const copy = [...keys];
    const temp = copy[index];
    copy[index] = copy[targetIndex];
    copy[targetIndex] = temp;
    onChange(copy);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Flow Chart Ordered Sequence *
          </span>
          <p className="text-[11px] text-slate-500 mt-0.5">
            Arrange the stages in correct chronological order. Test-takers will be asked to sequence them.
          </p>
        </div>
      </div>

      {/* Add step form */}
      <div className="flex items-center gap-2">
        <input
          type="text"
          placeholder="Add flowchart step (e.g. collect water samples)..."
          value={newKey}
          onChange={(e) => setNewKey(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleAdd())}
          className="flex-1 bg-slate-950 border border-slate-800 rounded-md px-3 py-1.5 text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-indigo-500"
        />
        <button
          type="button"
          onClick={handleAdd}
          className="px-3 py-1.5 text-xs font-medium rounded-md bg-indigo-600 hover:bg-indigo-500 text-white transition"
        >
          Add Step
        </button>
      </div>

      {/* Ordered steps list */}
      <div className="space-y-2">
        {keys.length === 0 ? (
          <div className="p-4 text-center rounded-lg border border-dashed border-slate-800 text-xs text-slate-500">
            No steps added yet. Add at least two sequential steps.
          </div>
        ) : (
          keys.map((k, idx) => (
            <div
              key={`${k}-${idx}`}
              className="flex items-center gap-3 p-3 rounded-lg bg-slate-900/80 border border-slate-800"
            >
              <div className="w-6 h-6 rounded-full bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center text-xs font-bold shrink-0">
                {idx + 1}
              </div>

              <div className="flex-1 min-w-0">
                <div className="font-semibold text-xs text-slate-200 capitalize">
                  {k.replace(/-/g, " ")}
                </div>
                <div className="text-[10px] font-mono text-slate-500 truncate">
                  slug: {k}
                </div>
              </div>

              {/* Up/Down buttons */}
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  disabled={idx === 0}
                  onClick={() => handleMove(idx, "up")}
                  className="p-1 text-slate-400 hover:text-slate-100 disabled:opacity-30 transition"
                  title="Move up"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
                  </svg>
                </button>
                <button
                  type="button"
                  disabled={idx === keys.length - 1}
                  onClick={() => handleMove(idx, "down")}
                  className="p-1 text-slate-400 hover:text-slate-100 disabled:opacity-30 transition"
                  title="Move down"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                <button
                  type="button"
                  onClick={() => handleRemove(idx)}
                  className="p-1 text-slate-500 hover:text-rose-400 transition ml-1"
                  title="Remove step"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
