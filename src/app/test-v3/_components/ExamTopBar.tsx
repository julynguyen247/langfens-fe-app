"use client";

import React from "react";

interface ExamTopBarProps {
  title: string;
  category?: string;
  timeRemainingSeconds: number;
  isSubmitted: boolean;
  answeredCount: number;
  totalQuestions: number;
  estimatedBand?: number;
  onOpenScoreModal?: () => void;
  onSubmitExam: () => void;
  onExit: () => void;
}

export function ExamTopBar({
  title,
  category,
  timeRemainingSeconds,
  isSubmitted,
  answeredCount,
  totalQuestions,
  estimatedBand,
  onOpenScoreModal,
  onSubmitExam,
  onExit,
}: ExamTopBarProps) {
  const m = Math.floor(timeRemainingSeconds / 60);
  const s = timeRemainingSeconds % 60;
  const timeFormatted = `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  const isUrgent = timeRemainingSeconds < 300 && !isSubmitted;

  return (
    <header className="h-16 border-b-2 border-slate-200 bg-white/95 backdrop-blur-md px-6 flex items-center justify-between shrink-0 shadow-2xs z-30 font-sans">
      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={onExit}
          className="p-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition border border-transparent hover:border-slate-200 cursor-pointer"
          title="Exit test session"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
          </svg>
        </button>

        <div className="flex items-center gap-3">
          <span className="bg-[#D32F2F] text-white text-[11px] font-black px-2 py-0.5 rounded tracking-wider uppercase shrink-0">
            IELTS
          </span>
          <div>
            <span className="font-bold text-sm text-slate-900 truncate max-w-xs sm:max-w-md block">
              {title}
            </span>
            <span className="text-[10px] font-medium text-slate-500">
              {category || "Academic"} • Official Test Engine v3
            </span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-4">
        {/* Timer Capsule */}
        <div
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-2xl border-2 transition-all font-mono font-bold text-sm ${
            isSubmitted
              ? "bg-slate-50 border-slate-200 text-slate-400"
              : isUrgent
              ? "bg-rose-50 border-rose-400 text-rose-600 animate-pulse"
              : "bg-slate-50 border-slate-200 text-slate-800 shadow-2xs"
          }`}
        >
          <svg className="w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>{isSubmitted ? "00:00" : timeFormatted}</span>
        </div>

        {/* Answered Counter */}
        <div className="hidden sm:flex items-center gap-1.5 text-xs font-bold text-slate-600 px-3 py-1.5 rounded-xl bg-slate-100 border border-slate-200">
          <span>Answered:</span>
          <span className="font-mono text-[#2563EB]">{answeredCount}</span>
          <span>/</span>
          <span className="font-mono">{totalQuestions}</span>
        </div>

        {/* Action Button */}
        {isSubmitted ? (
          <button
            type="button"
            onClick={onOpenScoreModal}
            className="px-4 py-2 text-xs font-bold rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white shadow-xs transition flex items-center gap-1.5 cursor-pointer"
          >
            <span>📊</span>
            <span>Band {estimatedBand ? estimatedBand.toFixed(1) : "N/A"} Score</span>
          </button>
        ) : (
          <button
            type="button"
            onClick={onSubmitExam}
            className="px-5 py-2 text-xs font-bold rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] text-white border-b-[3px] border-[#1E40AF] active:translate-y-0.5 shadow-xs transition-all cursor-pointer"
          >
            Submit Exam
          </button>
        )}
      </div>
    </header>
  );
}
