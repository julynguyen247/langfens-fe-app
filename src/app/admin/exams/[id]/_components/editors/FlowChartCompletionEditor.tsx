"use client";

import { useState } from "react";
import { FlowChartEditor } from "./FlowChartEditor";
import { BlankAcceptsEditor } from "./BlankAcceptsEditor";

interface FlowChartCompletionEditorProps {
  orderCorrects?: string[] | null;
  blankAcceptTexts?: Record<string, string[] | null> | null;
  blankAcceptRegex?: Record<string, string[] | null> | null;
  onOrderChange: (orderedKeys: string[]) => void;
  onBlanksChange: (
    texts: Record<string, string[] | null>,
    regex: Record<string, string[] | null>
  ) => void;
}

export function FlowChartCompletionEditor({
  orderCorrects,
  blankAcceptTexts,
  blankAcceptRegex,
  onOrderChange,
  onBlanksChange,
}: FlowChartCompletionEditorProps) {
  const [tab, setTab] = useState<"order" | "blanks">("order");

  return (
    <div className="space-y-4">
      <div className="p-3 rounded-xl bg-indigo-950/30 border border-indigo-900/40 text-[11px] text-indigo-200">
        Flow chart completion: arrange the steps in correct order AND fill in the
        missing words inside each step. Candidates complete blanks in the
        rendered flow chart.
      </div>

      <div className="flex items-center gap-1.5 border-b border-slate-800">
        <button
          type="button"
          onClick={() => setTab("order")}
          className={`px-3 py-1.5 text-xs font-semibold rounded-t-md transition border-b-2 ${
            tab === "order"
              ? "text-indigo-300 border-indigo-400"
              : "text-slate-400 border-transparent hover:text-slate-200"
          }`}
        >
          Step Order ({orderCorrects?.length || 0})
        </button>
        <button
          type="button"
          onClick={() => setTab("blanks")}
          className={`px-3 py-1.5 text-xs font-semibold rounded-t-md transition border-b-2 ${
            tab === "blanks"
              ? "text-indigo-300 border-indigo-400"
              : "text-slate-400 border-transparent hover:text-slate-200"
          }`}
        >
          Blanks ({Object.keys(blankAcceptTexts || {}).length})
        </button>
      </div>

      {tab === "order" && (
        <FlowChartEditor
          orderCorrects={orderCorrects}
          onChange={onOrderChange}
        />
      )}

      {tab === "blanks" && (
        <BlankAcceptsEditor
          blankAcceptTexts={blankAcceptTexts}
          blankAcceptRegex={blankAcceptRegex}
          onChange={onBlanksChange}
        />
      )}
    </div>
  );
}
