"use client";

import Link from "next/link";
import { AttemptAnswerItem, AttemptResultData } from "../_lib/types";

interface ResultHeroProps {
  result: AttemptResultData;
  answersByDisplayIdx?: Record<number, AttemptAnswerItem>;
}

export function ResultHero({ result, answersByDisplayIdx = {} }: ResultHeroProps) {
  const band = result.ieltsBand || 0;
  let bandColor = "text-[#2563EB] border-blue-200 bg-blue-50/80";
  if (band >= 8.0) {
    bandColor = "text-emerald-700 border-emerald-300 bg-emerald-50/80";
  } else if (band >= 6.5) {
    bandColor = "text-[#2563EB] border-blue-200 bg-blue-50/80";
  } else if (band < 5.5 && band > 0) {
    bandColor = "text-amber-700 border-amber-300 bg-amber-50/80";
  }

  const incorrectCount = Math.max(0, result.totalQuestion - result.correctCount);
  const examId = result.examId || result.paper?.id;

  // Calculate score breakdown for each Section / Part
  const sectionBreakdowns = (result.paper?.sections || []).map((sec, i) => {
    const questionIndices: number[] = [];
    for (const q of sec.questions || []) {
      questionIndices.push(q.displayIdx ?? q.idx);
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
    <div className="p-8 rounded-3xl bg-white border-2 border-slate-200 shadow-xs space-y-6">
      {/* Top section: Title, Band & Quick stats */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 pb-6 border-b-2 border-slate-100">
        {/* Left: Info & Title */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 text-xs font-bold rounded-lg bg-blue-50 text-[#2563EB] border border-blue-200 uppercase tracking-wider">
              {result.paper?.category || "IELTS"} Review
            </span>
            <span className="text-xs font-medium text-slate-500 font-mono">
              Attempt #{result.attemptId.slice(0, 8)}
            </span>
          </div>

          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            {result.paper?.title || "Exam Result Review"}
          </h1>

          {result.submittedAt && (
            <p className="text-xs text-slate-500 font-medium">
              Completed on {new Date(result.submittedAt).toLocaleString()}
            </p>
          )}
        </div>

        {/* Middle: Big Band Display */}
        <div className="shrink-0 flex items-center gap-6">
          <div
            className={`w-28 h-28 rounded-3xl border-2 flex flex-col items-center justify-center text-center shadow-xs ${bandColor}`}
          >
            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500">
              IELTS Band
            </span>
            <span className="text-3xl font-extrabold tracking-tight font-mono">
              {band > 0 ? band.toFixed(1) : "N/A"}
            </span>
          </div>

          {/* Quick breakdown stats */}
          <div className="grid grid-cols-2 gap-2.5">
            <div className="p-3 rounded-2xl bg-slate-50 border-2 border-slate-200 text-center min-w-24">
              <span className="text-[10px] uppercase font-bold text-slate-500 block mb-0.5">
                Accuracy
              </span>
              <span className="text-sm font-mono font-bold text-slate-800">
                {result.scorePct ?? 0}%
              </span>
            </div>

            <div className="p-3 rounded-2xl bg-emerald-50/60 border-2 border-emerald-200 text-center min-w-24">
              <span className="text-[10px] uppercase font-bold text-emerald-700 block mb-0.5">
                Correct
              </span>
              <span className="text-sm font-mono font-bold text-emerald-800">
                {result.correctCount} / {result.totalQuestion}
              </span>
            </div>

            <div className="p-3 rounded-2xl bg-rose-50/60 border-2 border-rose-200 text-center min-w-24">
              <span className="text-[10px] uppercase font-bold text-rose-700 block mb-0.5">
                Incorrect
              </span>
              <span className="text-sm font-mono font-bold text-rose-800">
                {incorrectCount}
              </span>
            </div>

            <div className="p-3 rounded-2xl bg-blue-50/60 border-2 border-blue-200 text-center min-w-24">
              <span className="text-[10px] uppercase font-bold text-blue-700 block mb-0.5">
                Questions
              </span>
              <span className="text-sm font-mono font-bold text-blue-800">
                {result.totalQuestion}
              </span>
            </div>
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex flex-col sm:flex-row md:flex-col gap-2.5 shrink-0 w-full md:w-auto">
          {examId && (
            <Link
              href={`/test-v2/${examId}`}
              className="px-5 py-2.5 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-bold uppercase tracking-wider text-center border-b-[3px] border-[#1E40AF] active:translate-y-0.5 transition-all shadow-xs"
            >
              Retake Exam
            </Link>
          )}
          <Link
            href="/admin/exams"
            className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold text-center border-2 border-slate-200 transition"
          >
            Exit to Exams
          </Link>
        </div>
      </div>

      {/* Bottom section: Part 1 / Part 2 / Part 3 Score Breakdown */}
      {sectionBreakdowns.length > 0 && (
        <div className="space-y-3">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-600 block">
            Section / Part Breakdown
          </span>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {sectionBreakdowns.map((part) => (
              <div
                key={part.partNumber}
                className="p-4 rounded-2xl bg-slate-50 border-2 border-slate-200 space-y-2.5 shadow-2xs"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-slate-800 truncate" title={part.title}>
                    Part {part.partNumber}
                  </span>
                  <span className="font-mono text-xs font-bold text-slate-700">
                    {part.correct} / {part.total} ({part.pct}%)
                  </span>
                </div>

                {/* Progress bar */}
                <div className="h-2 w-full rounded-full bg-slate-200 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${
                      part.pct >= 80
                        ? "bg-emerald-500"
                        : part.pct >= 50
                        ? "bg-[#2563EB]"
                        : "bg-amber-500"
                    }`}
                    style={{ width: `${part.pct}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
