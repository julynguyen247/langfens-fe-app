"use client";

import Link from "next/link";
import { AttemptAnswerItem, AttemptResultData } from "../_lib/types";

interface ScoreReportModalProps {
  isOpen: boolean;
  result: AttemptResultData;
  answersByDisplayIdx?: Record<number, AttemptAnswerItem>;
  onClose: () => void;
}

export function ScoreReportModal({
  isOpen,
  result,
  answersByDisplayIdx = {},
  onClose,
}: ScoreReportModalProps) {
  if (!isOpen) return null;

  const band = result.ieltsBand || 0;
  let bandColor = "text-[#2563EB] border-blue-200 bg-blue-50";
  let bandDescriptor = "Competent User";
  if (band >= 8.5) {
    bandColor = "text-emerald-700 border-emerald-300 bg-emerald-50";
    bandDescriptor = "Expert User";
  } else if (band >= 7.5) {
    bandColor = "text-emerald-700 border-emerald-300 bg-emerald-50";
    bandDescriptor = "Very Good User";
  } else if (band >= 6.5) {
    bandColor = "text-[#2563EB] border-blue-200 bg-blue-50";
    bandDescriptor = "Good User";
  } else if (band >= 5.5) {
    bandColor = "text-amber-700 border-amber-300 bg-amber-50";
    bandDescriptor = "Modest User";
  } else if (band > 0) {
    bandColor = "text-rose-700 border-rose-300 bg-rose-50";
    bandDescriptor = "Limited User";
  }

  const incorrectCount = Math.max(0, result.totalQuestion - result.correctCount);
  const examId = result.examId || result.paper?.id;

  // Calculate score breakdown for each Section / Part
  const sectionBreakdowns = (result.paper?.sections || []).map((sec, i) => {
    const questionIndices: number[] = [];
    for (const q of sec.questions || []) {
      const num = q.displayIdx ?? q.idx;
      if (!questionIndices.includes(num)) questionIndices.push(num);
    }
    for (const grp of sec.questionGroups || []) {
      for (const q of grp.questions || []) {
        const num = q.displayIdx ?? q.idx;
        if (!questionIndices.includes(num)) questionIndices.push(num);
      }
    }

    const total = questionIndices.length;
    const correct = questionIndices.filter(
      (idx) => answersByDisplayIdx[idx]?.isCorrect === true
    ).length;

    const pct = total > 0 ? Math.round((correct / total) * 100) : 0;

    return {
      partNumber: i + 1,
      title: sec.title || `Part ${i + 1}`,
      correct,
      total,
      pct,
    };
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs font-sans animate-in fade-in duration-150">
      <div className="max-w-xl w-full bg-white rounded-3xl border-2 border-slate-200 shadow-2xl p-6 sm:p-8 space-y-6 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 pb-4 border-b-2 border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <span className="bg-[#D32F2F] text-white text-[11px] font-black px-2 py-0.5 rounded tracking-wider uppercase">
                IELTS
              </span>
              <span className="text-xs font-bold text-[#2563EB] uppercase tracking-wider">
                Official Score Report
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight mt-1.5">
              {result.paper?.title || "Test Result Summary"}
            </h2>
            {result.submittedAt && (
              <p className="text-xs text-slate-500 mt-1">
                Completed on {new Date(result.submittedAt).toLocaleString()}
              </p>
            )}
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition cursor-pointer"
            title="Close"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Hero Band Score & Quick Stats */}
        <div className="flex flex-col sm:flex-row items-center gap-6 p-6 rounded-2xl bg-slate-50 border-2 border-slate-200">
          <div
            className={`w-28 h-28 rounded-2xl border-2 flex flex-col items-center justify-center text-center shadow-xs shrink-0 ${bandColor}`}
          >
            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500">
              IELTS Band
            </span>
            <span className="text-3xl font-extrabold tracking-tight font-mono">
              {band > 0 ? band.toFixed(1) : "N/A"}
            </span>
            <span className="text-[10px] font-bold mt-0.5 opacity-80">
              {bandDescriptor}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3 flex-1 w-full">
            <div className="p-3 rounded-xl bg-white border border-slate-200 text-center">
              <span className="text-[10px] uppercase font-bold text-slate-500 block mb-0.5">
                Score
              </span>
              <span className="text-lg font-mono font-bold text-slate-900">
                {result.correctCount} / {result.totalQuestion}
              </span>
            </div>

            <div className="p-3 rounded-xl bg-white border border-slate-200 text-center">
              <span className="text-[10px] uppercase font-bold text-slate-500 block mb-0.5">
                Accuracy
              </span>
              <span className="text-lg font-mono font-bold text-slate-900">
                {result.scorePct ?? 0}%
              </span>
            </div>

            <div className="p-3 rounded-xl bg-white border border-slate-200 text-center">
              <span className="text-[10px] uppercase font-bold text-emerald-600 block mb-0.5">
                Correct
              </span>
              <span className="text-lg font-mono font-bold text-emerald-700">
                {result.correctCount}
              </span>
            </div>

            <div className="p-3 rounded-xl bg-white border border-slate-200 text-center">
              <span className="text-[10px] uppercase font-bold text-rose-600 block mb-0.5">
                Incorrect
              </span>
              <span className="text-lg font-mono font-bold text-rose-700">
                {incorrectCount}
              </span>
            </div>
          </div>
        </div>

        {/* Section / Part Breakdown */}
        {sectionBreakdowns.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Performance by Part
            </h3>

            <div className="space-y-2.5">
              {sectionBreakdowns.map((item) => (
                <div
                  key={item.partNumber}
                  className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2"
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-800">
                      Part {item.partNumber}: {item.title}
                    </span>
                    <span className="font-mono font-bold text-slate-700">
                      {item.correct} / {item.total} ({item.pct}%)
                    </span>
                  </div>

                  <div className="w-full h-2 rounded-full bg-slate-200 overflow-hidden">
                    <div
                      className={`h-full transition-all duration-500 rounded-full ${
                        item.pct >= 80
                          ? "bg-emerald-500"
                          : item.pct >= 60
                          ? "bg-[#2563EB]"
                          : "bg-amber-500"
                      }`}
                      style={{ width: `${item.pct}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-4 border-t-2 border-slate-100">
          {examId && (
            <Link
              href={`/test-v2/${examId}`}
              className="w-full sm:w-auto px-5 py-2.5 text-xs font-bold rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-center transition shadow-xs"
            >
              Retake Test
            </Link>
          )}

          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-5 py-2.5 text-xs font-bold rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-center transition cursor-pointer"
          >
            Review Answers
          </button>
        </div>
      </div>
    </div>
  );
}
