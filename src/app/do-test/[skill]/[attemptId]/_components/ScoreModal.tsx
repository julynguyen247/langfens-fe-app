"use client";

import Link from "next/link";
import { ExamGradeSummary } from "../_lib/types";

interface ScoreModalProps {
  summary: ExamGradeSummary | null;
  isOpen: boolean;
  onClose: () => void;
  onRetake: () => void;
}

export function ScoreModal({
  summary,
  isOpen,
  onClose,
  onRetake,
}: ScoreModalProps) {
  if (!isOpen || !summary) return null;

  const band = summary.estimatedBand;
  let bandColor = "text-[#2563EB] border-blue-300 bg-blue-50";
  if (band >= 8.0) {
    bandColor = "text-emerald-600 border-emerald-300 bg-emerald-50";
  } else if (band >= 6.5) {
    bandColor = "text-[#2563EB] border-blue-300 bg-blue-50";
  } else if (band < 5.5) {
    bandColor = "text-amber-600 border-amber-300 bg-amber-50";
  }

  const correctCount = Object.values(summary.resultsByQuestion).filter(
    (r) => r.isCorrect
  ).length;
  const incorrectCount = summary.maxScore - correctCount;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 select-none font-sans">
      <div className="w-full max-w-md rounded-3xl bg-white border-2 border-slate-200 p-8 shadow-2xl space-y-6 text-center animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="space-y-1">
          <span className="text-xs font-bold uppercase tracking-widest text-[#2563EB]">
            Exam Completed
          </span>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
            Practice Test Results
          </h2>
        </div>

        {/* Estimated Band Display */}
        <div className="py-2">
          <div
            className={`w-32 h-32 rounded-3xl mx-auto border-3 flex flex-col items-center justify-center shadow-md ${bandColor}`}
          >
            <span className="text-[10px] uppercase tracking-wider font-bold opacity-80">
              Estimated Band
            </span>
            <span className="text-4xl font-extrabold tracking-tight font-mono">
              {band.toFixed(1)}
            </span>
          </div>
        </div>

        {/* Breakdown Stats */}
        <div className="grid grid-cols-3 gap-3">
          <div className="p-3.5 rounded-2xl bg-slate-50 border-2 border-slate-200">
            <span className="text-[10px] uppercase font-bold text-slate-500 block mb-0.5">
              Score
            </span>
            <span className="text-sm font-mono font-bold text-slate-800">
              {summary.totalScore} / {summary.maxScore}
            </span>
          </div>

          <div className="p-3.5 rounded-2xl bg-emerald-50/60 border-2 border-emerald-200">
            <span className="text-[10px] uppercase font-bold text-emerald-700 block mb-0.5">
              Correct
            </span>
            <span className="text-sm font-mono font-bold text-emerald-800">
              {correctCount}
            </span>
          </div>

          <div className="p-3.5 rounded-2xl bg-rose-50/60 border-2 border-rose-200">
            <span className="text-[10px] uppercase font-bold text-rose-700 block mb-0.5">
              Incorrect
            </span>
            <span className="text-sm font-mono font-bold text-rose-800">
              {incorrectCount}
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="space-y-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="w-full py-3.5 rounded-2xl bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-bold uppercase tracking-wider border-b-[4px] border-[#1E40AF] active:translate-y-0.5 shadow-md transition-all cursor-pointer"
          >
            Review Answers & Explanation
          </button>

          <div className="grid grid-cols-2 gap-2.5">
            <button
              type="button"
              onClick={onRetake}
              className="py-3 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 border-2 border-slate-200 text-xs font-bold transition cursor-pointer"
            >
              Retake Test
            </button>
            <Link
              href="/admin/exams"
              className="py-3 rounded-2xl bg-white hover:bg-slate-50 border-2 border-slate-200 text-slate-700 text-xs font-bold flex items-center justify-center transition"
            >
              Exit to Admin
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
