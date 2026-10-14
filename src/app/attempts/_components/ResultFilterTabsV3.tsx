"use client";

import React from "react";
import {
  RESULT_BUTTON_BASE,
  RESULT_BUTTON_PRIMARY,
  RESULT_BUTTON_SECONDARY,
} from "@/components/exam-v3/resultButtonStyles";
import { ResultFilterType } from "@/components/exam-v3/types";

interface ResultFilterTabsV3Props {
  activeFilter: ResultFilterType;
  totalCount: number;
  correctCount: number;
  incorrectCount: number;
  unansweredCount: number;
  onChange: (filter: ResultFilterType) => void;
}

export function ResultFilterTabsV3({
  activeFilter,
  totalCount,
  correctCount,
  incorrectCount,
  unansweredCount,
  onChange,
}: ResultFilterTabsV3Props) {
  const statusButtonBase = `${RESULT_BUTTON_BASE} h-8 px-3.5 text-xs border-2 border-b-[4px] hover:-translate-y-0.5 hover:border-b-[5px] active:translate-y-[2px] active:border-b-[2px]`;

  return (
    <div className="flex items-center gap-2 overflow-x-auto pb-1 font-sans">
      <button
        type="button"
        onClick={() => onChange("ALL")}
        aria-pressed={activeFilter === "ALL"}
        className={`${
          activeFilter === "ALL"
            ? RESULT_BUTTON_PRIMARY
            : RESULT_BUTTON_SECONDARY
        } h-8 px-3.5 text-xs`}
      >
        All ({totalCount})
      </button>

      <button
        type="button"
        onClick={() => onChange("CORRECT")}
        aria-pressed={activeFilter === "CORRECT"}
        className={`${statusButtonBase} ${
          activeFilter === "CORRECT"
            ? "bg-emerald-600 text-white border-emerald-600 border-b-emerald-800"
            : "bg-emerald-50 text-emerald-700 border-emerald-200 border-b-emerald-300 hover:bg-emerald-100 hover:-translate-y-0.5"
        }`}
      >
        <span>✓</span>
        <span>Correct ({correctCount})</span>
      </button>

      <button
        type="button"
        onClick={() => onChange("INCORRECT")}
        aria-pressed={activeFilter === "INCORRECT"}
        className={`${statusButtonBase} ${
          activeFilter === "INCORRECT"
            ? "bg-rose-600 text-white border-rose-600 border-b-rose-800"
            : "bg-rose-50 text-rose-700 border-rose-200 border-b-rose-300 hover:bg-rose-100 hover:-translate-y-0.5"
        }`}
      >
        <span>✕</span>
        <span>Incorrect ({incorrectCount})</span>
      </button>

      <button
        type="button"
        onClick={() => onChange("UNANSWERED")}
        aria-pressed={activeFilter === "UNANSWERED"}
        className={`${
          activeFilter === "UNANSWERED"
            ? `${statusButtonBase} bg-[var(--text-muted)] text-white border-[var(--text-muted)] border-b-slate-600`
            : `${RESULT_BUTTON_SECONDARY} h-8 px-3.5 text-xs`
        }`}
      >
        <span>⚪</span>
        <span>Unanswered ({unansweredCount})</span>
      </button>
    </div>
  );
}
