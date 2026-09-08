"use client";

import React from "react";
import { ExamGradeSummary } from "@/components/exam-v3/types";

interface ScoreModalV3Props {
  summary: ExamGradeSummary | null;
  isOpen: boolean;
  onClose: () => void;
  onRetake: () => void;
}

export function ScoreModalV3({
  summary,
  isOpen,
  onClose,
  onRetake,
}: ScoreModalV3Props) {
  if (!isOpen || !summary) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 font-sans animate-fade-in">
      <div className="w-full max-w-lg rounded-3xl bg-white border-2 border-slate-200 p-8 shadow-2xl space-y-6 text-center">
        {/* Header Badge */}
        <div className="mx-auto w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white flex items-center justify-center text-2xl shadow-lg shadow-emerald-500/20">
          🏆
        </div>

        <div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">
            Exam Completed!
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Your answers have been graded against the official IELTS scoring criteria.
          </p>
        </div>

        {/* Score Cards */}
        <div className="grid grid-cols-2 gap-4">
          <div className="p-5 rounded-2xl bg-blue-50/70 border-2 border-blue-200">
            <span className="text-[11px] font-bold text-[#2563EB] uppercase tracking-wider block">
              Estimated Band
            </span>
            <span className="text-4xl font-black text-[#1E40AF] mt-1 block font-mono">
              {summary.estimatedBand.toFixed(1)}
            </span>
          </div>

          <div className="p-5 rounded-2xl bg-slate-50 border-2 border-slate-200">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
              Raw Score
            </span>
            <span className="text-4xl font-black text-slate-800 mt-1 block font-mono">
              {summary.totalScore} <span className="text-lg font-bold text-slate-400">/ {summary.maxScore}</span>
            </span>
          </div>
        </div>

        <div className="p-3.5 rounded-2xl bg-slate-100 text-xs font-semibold text-slate-600">
          Accuracy: <strong className="text-emerald-700 font-bold">{summary.percentage}%</strong> • Review mode is now unlocked!
        </div>

        {/* Actions */}
        <div className="pt-2 flex flex-col sm:flex-row gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-3 px-5 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-bold transition shadow-xs cursor-pointer"
          >
            Review Answers & Explanations
          </button>

          <button
            type="button"
            onClick={onRetake}
            className="py-3 px-5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition cursor-pointer"
          >
            Retake Exam
          </button>
        </div>
      </div>
    </div>
  );
}
