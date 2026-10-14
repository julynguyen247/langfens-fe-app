"use client";

import React from "react";
import { AttemptResultData } from "@/components/exam-v3/types";
import { RESULT_BUTTON_PRIMARY } from "@/components/exam-v3/resultButtonStyles";

interface ScoreReportModalV3Props {
  isOpen: boolean;
  onClose: () => void;
  result: AttemptResultData | null;
}

export function ScoreReportModalV3({
  isOpen,
  onClose,
  result,
}: ScoreReportModalV3Props) {
  if (!isOpen || !result) return null;

  const band = result.ieltsBand && result.ieltsBand > 0 ? result.ieltsBand.toFixed(1) : "--";
  const accuracy =
    result.totalQuestion > 0
      ? Math.round((result.correctCount / result.totalQuestion) * 100)
      : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 font-sans animate-fade-in">
      <div className="w-full max-w-lg rounded-[2rem] bg-[var(--surface)] border-[3px] border-[var(--border)] p-8 shadow-[0_4px_0_rgba(0,0,0,0.08)] space-y-6 text-center">
        {/* Header Badge */}
        <div className="mx-auto w-16 h-16 rounded-2xl bg-[var(--primary)] border-b-[4px] border-[var(--primary-dark)] text-white flex items-center justify-center text-2xl shadow-xs">
          📊
        </div>

        <div>
          <h2 className="text-2xl font-black text-[var(--foreground)] tracking-tight">
            IELTS Score Report
          </h2>
          <p className="text-xs text-[var(--text-muted)] mt-1">
            Standardized IELTS Diagnostic Evaluation (Engine v3)
          </p>
        </div>

        {/* Score Breakdown Cards */}
        <div className="grid grid-cols-2 gap-4">
          <div className="p-5 rounded-2xl bg-[var(--primary-light)] border-2 border-[var(--skill-reading-border)]">
            <span className="text-[11px] font-bold text-[var(--primary)] uppercase tracking-wider block">
              Estimated Band
            </span>
            <span className="text-4xl font-black text-[var(--primary-dark)] mt-1 block font-mono">
              {band}
            </span>
          </div>

          <div className="p-5 rounded-2xl bg-[var(--background)] border-2 border-[var(--border)]">
            <span className="text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-wider block">
              Score
            </span>
            <span className="text-4xl font-black text-[var(--foreground)] mt-1 block font-mono">
              {result.correctCount} <span className="text-lg font-bold text-[var(--text-muted)]">/ {result.totalQuestion}</span>
            </span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-[var(--background)] border border-[var(--border)] grid grid-cols-3 gap-2 text-center text-xs">
          <div>
            <span className="text-[var(--text-muted)] block text-[10px] uppercase font-bold">Accuracy</span>
            <span className="font-bold text-[var(--foreground)] font-mono text-sm">{accuracy}%</span>
          </div>
          <div>
            <span className="text-[var(--text-muted)] block text-[10px] uppercase font-bold">Questions</span>
            <span className="font-bold text-[var(--foreground)] font-mono text-sm">{result.totalQuestion}</span>
          </div>
          <div>
            <span className="text-[var(--text-muted)] block text-[10px] uppercase font-bold">Status</span>
            <span className="font-bold text-emerald-600 font-mono text-sm">{result.status || "Graded"}</span>
          </div>
        </div>

        {/* Close Button */}
        <div className="pt-2">
          <button
            type="button"
            onClick={onClose}
            className={`${RESULT_BUTTON_PRIMARY} w-full py-3 px-5 text-xs`}
          >
            Close Score Report
          </button>
        </div>
      </div>
    </div>
  );
}
