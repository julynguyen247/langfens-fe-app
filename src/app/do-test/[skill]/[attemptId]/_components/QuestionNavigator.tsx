"use client";

import { QuestionGradeResult, UserAnswerValue } from "../_lib/types";

interface QuestionNavigatorProps {
  questionIndices: number[];
  answers: Record<number, UserAnswerValue>;
  flaggedIndices: number[];
  activeQuestionIdx?: number | null;
  isSubmitted: boolean;
  gradeResults?: Record<number, QuestionGradeResult> | null;
  onSelectQuestion: (idx: number) => void;
  onToggleFlag: (idx: number) => void;
}

export function QuestionNavigator({
  questionIndices,
  answers,
  flaggedIndices,
  activeQuestionIdx,
  isSubmitted,
  gradeResults,
  onSelectQuestion,
  onToggleFlag,
}: QuestionNavigatorProps) {
  const isAnswered = (idx: number): boolean => {
    const a = answers[idx];
    if (a === undefined || a === null) return false;
    if (typeof a === "string") return a.trim().length > 0;
    if (Array.isArray(a)) return a.length > 0;
    if (typeof a === "object") return Object.keys(a).length > 0;
    return false;
  };

  return (
    <footer className="fixed bottom-0 inset-x-0 h-16 z-40 bg-white/95 backdrop-blur-md border-t-2 border-slate-200 flex items-center justify-between px-6 select-none font-sans shadow-xs">
      {/* Question buttons row (scrollable horizontally) */}
      <div className="flex items-center gap-2 overflow-x-auto py-2 pr-4 flex-1">
        {questionIndices.map((idx) => {
          const answered = isAnswered(idx);
          const isFlagged = flaggedIndices.includes(idx);
          const isActive = activeQuestionIdx === idx;
          const grade = gradeResults?.[idx];

          let btnClass = "bg-slate-100 border-2 border-slate-200 text-slate-700 hover:bg-slate-200";

          if (isSubmitted && grade) {
            btnClass = grade.isCorrect
              ? "bg-emerald-500 border-2 border-emerald-600 text-white font-bold shadow-xs"
              : "bg-rose-500 border-2 border-rose-600 text-white font-bold shadow-xs";
          } else if (answered) {
            btnClass = "bg-emerald-500 border-2 border-emerald-600 text-white font-bold shadow-xs";
          }

          if (isActive) {
            btnClass += " ring-3 ring-[#2563EB] ring-offset-2 scale-105 z-10";
          }

          return (
            <div key={idx} className="relative shrink-0">
              <button
                type="button"
                onClick={() => onSelectQuestion(idx)}
                className={`w-8 h-8 rounded-full text-xs font-mono flex items-center justify-center transition-all cursor-pointer ${btnClass}`}
              >
                {idx}
              </button>

              {/* Flag dot */}
              {isFlagged && (
                <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-rose-500 ring-2 ring-white shadow-xs" />
              )}
            </div>
          );
        })}
      </div>

      {/* Flag active button & Legend */}
      <div className="flex items-center gap-4 pl-4 border-l-2 border-slate-200 shrink-0">
        {activeQuestionIdx !== undefined && activeQuestionIdx !== null && !isSubmitted && (
          <button
            type="button"
            onClick={() => onToggleFlag(activeQuestionIdx)}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl border-2 transition active:translate-y-0.5 ${
              flaggedIndices.includes(activeQuestionIdx)
                ? "bg-rose-50 border-rose-300 text-rose-600 shadow-xs"
                : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
            }`}
          >
            <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
              <path d="M5 21V4h9l.4 2H20v10h-7l-.4-2H7v7H5z" />
            </svg>
            <span>Flag Q{activeQuestionIdx}</span>
          </button>
        )}

        {/* Legend */}
        <div className="hidden lg:flex items-center gap-3.5 text-xs font-medium text-slate-500">
          {isSubmitted ? (
            <>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-emerald-500" />
                <span className="text-slate-700">Correct</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-rose-500" />
                <span className="text-slate-700">Incorrect</span>
              </div>
            </>
          ) : (
            <>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-emerald-500" />
                <span className="text-slate-700">Answered</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-slate-200 border border-slate-300" />
                <span className="text-slate-700">Unanswered</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                <span className="text-slate-700">Flagged</span>
              </div>
            </>
          )}
        </div>
      </div>
    </footer>
  );
}
