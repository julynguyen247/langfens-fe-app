"use client";

import React from "react";
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
  return (
    <div className="flex items-center gap-2 overflow-x-auto pb-1 font-sans">
      <button
        type="button"
        onClick={() => onChange("ALL")}
        className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
          activeFilter === "ALL"
            ? "bg-[var(--primary)] text-white shadow-2xs"
            : "bg-[var(--background)] text-[var(--text-muted)] hover:bg-[var(--border-light)] border border-[var(--border)]"
        }`}
      >
        All ({totalCount})
      </button>

      <button
        type="button"
        onClick={() => onChange("CORRECT")}
        className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
          activeFilter === "CORRECT"
            ? "bg-emerald-600 text-white shadow-2xs"
            : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200"
        }`}
      >
        <span>✓</span>
        <span>Correct ({correctCount})</span>
      </button>

      <button
        type="button"
        onClick={() => onChange("INCORRECT")}
        className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
          activeFilter === "INCORRECT"
            ? "bg-rose-600 text-white shadow-2xs"
            : "bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200"
        }`}
      >
        <span>✕</span>
        <span>Incorrect ({incorrectCount})</span>
      </button>

      <button
        type="button"
        onClick={() => onChange("UNANSWERED")}
        className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
          activeFilter === "UNANSWERED"
            ? "bg-[var(--text-muted)] text-white shadow-2xs"
            : "bg-[var(--background)] text-[var(--text-muted)] hover:bg-[var(--border-light)] border border-[var(--border)]"
        }`}
      >
        <span>⚪</span>
        <span>Unanswered ({unansweredCount})</span>
      </button>
    </div>
  );
}
