"use client";

import { AttemptAnswerItem } from "../_lib/types";

interface ResultNavigatorProps {
  totalQuestions: number;
  answersByDisplayIdx: Record<number, AttemptAnswerItem>;
  activeIdx?: number | null;
  onSelect: (displayIdx: number) => void;
}

export function ResultNavigator({
  totalQuestions,
  answersByDisplayIdx,
  activeIdx,
  onSelect,
}: ResultNavigatorProps) {
  const indices = Array.from({ length: totalQuestions }, (_, i) => i + 1);

  return (
    <footer className="fixed bottom-0 inset-x-0 h-16 z-40 bg-white/95 backdrop-blur-md border-t-2 border-slate-200 flex items-center justify-between px-6 select-none font-sans shadow-xs">
      {/* Question buttons row */}
      <div className="flex items-center gap-2 overflow-x-auto py-2 pr-4 flex-1">
        {indices.map((idx) => {
          const ans = answersByDisplayIdx[idx];
          const isCorrect = ans?.isCorrect === true;
          const isWrong = ans?.isCorrect === false;
          const isActive = activeIdx === idx;

          let btnClass = "bg-slate-100 border-2 border-slate-200 text-slate-500";
          if (isCorrect) {
            btnClass = "bg-emerald-500 border-2 border-emerald-600 text-white font-bold shadow-xs";
          } else if (isWrong) {
            btnClass = "bg-rose-500 border-2 border-rose-600 text-white font-bold shadow-xs";
          }

          if (isActive) {
            btnClass += " ring-3 ring-[#2563EB] ring-offset-2 scale-105 z-10";
          }

          return (
            <button
              key={idx}
              type="button"
              onClick={() => onSelect(idx)}
              className={`w-8 h-8 rounded-full text-xs font-mono flex items-center justify-center transition-all cursor-pointer shrink-0 ${btnClass}`}
              title={`Question ${idx}: ${isCorrect ? "Correct" : isWrong ? "Incorrect" : "Unanswered"}`}
            >
              {idx}
            </button>
          );
        })}
      </div>

      {/* Legend */}
      <div className="hidden lg:flex items-center gap-4 pl-4 border-l-2 border-slate-200 shrink-0 text-xs font-medium text-slate-500">
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-emerald-500 border border-emerald-600" />
          <span className="text-slate-700">Correct</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-rose-500 border border-rose-600" />
          <span className="text-slate-700">Incorrect</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-slate-100 border-2 border-slate-200" />
          <span className="text-slate-700">Unanswered</span>
        </div>
      </div>
    </footer>
  );
}
