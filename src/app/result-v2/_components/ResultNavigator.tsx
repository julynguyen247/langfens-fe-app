"use client";

import { AttemptAnswerItem, InternalDeliverySection } from "../_lib/types";

interface ResultNavigatorProps {
  totalQuestions: number;
  answersByDisplayIdx: Record<number, AttemptAnswerItem>;
  activeIdx?: number | null;
  sections?: InternalDeliverySection[];
  onSelect: (displayIdx: number) => void;
}

export function ResultNavigator({
  totalQuestions,
  answersByDisplayIdx,
  activeIdx,
  sections,
  onSelect,
}: ResultNavigatorProps) {
  // If sections provided, group questions by section
  const sectionGroups = (sections || []).map((sec, i) => {
    const indices: number[] = [];
    for (const q of sec.questions || []) {
      const num = q.displayIdx ?? q.idx;
      if (!indices.includes(num)) indices.push(num);
    }
    for (const grp of sec.questionGroups || []) {
      for (const q of grp.questions || []) {
        const num = q.displayIdx ?? q.idx;
        if (!indices.includes(num)) indices.push(num);
      }
    }
    indices.sort((a, b) => a - b);

    return {
      partNumber: i + 1,
      indices,
    };
  }).filter((g) => g.indices.length > 0);

  const currentActive = activeIdx ?? 1;

  const handlePrev = () => {
    const prev = Math.max(1, currentActive - 1);
    onSelect(prev);
  };

  const handleNext = () => {
    const next = Math.min(totalQuestions, currentActive + 1);
    onSelect(next);
  };

  const renderButton = (idx: number) => {
    const ans = answersByDisplayIdx[idx];
    const isCorrect = ans?.isCorrect === true;
    const isWrong = ans?.isCorrect === false;
    const isActive = activeIdx === idx;

    // Authentic IELTS CD button styling: rectangular button with clear status border
    let btnClass = "bg-white border-2 border-slate-200 text-slate-400 hover:border-slate-300";
    let indicator = null;

    if (isCorrect) {
      btnClass = "bg-emerald-50/70 border-2 border-emerald-500 text-emerald-800 font-bold shadow-2xs";
      indicator = <span className="text-[9px] text-emerald-600 leading-none">✓</span>;
    } else if (isWrong) {
      btnClass = "bg-rose-50/70 border-2 border-rose-400 text-rose-800 font-bold shadow-2xs";
      indicator = <span className="text-[9px] text-rose-500 leading-none">✕</span>;
    }

    if (isActive) {
      btnClass += " ring-2 ring-[#2563EB] ring-offset-1 z-10 scale-105";
    }

    return (
      <button
        key={idx}
        type="button"
        onClick={() => onSelect(idx)}
        className={`w-9 h-8 rounded-lg text-xs font-mono flex flex-col items-center justify-center gap-0 transition-all cursor-pointer shrink-0 ${btnClass}`}
        title={`Question ${idx}: ${isCorrect ? "Correct" : isWrong ? "Incorrect" : "Unanswered"}`}
      >
        <span className="leading-tight">{idx}</span>
        {indicator}
      </button>
    );
  };

  return (
    <footer className="fixed bottom-0 inset-x-0 h-16 z-40 bg-white/95 backdrop-blur-md border-t-2 border-slate-200 flex items-center justify-between px-4 sm:px-6 select-none font-sans shadow-xs gap-3">
      {/* Prev button */}
      <button
        type="button"
        onClick={handlePrev}
        disabled={currentActive <= 1}
        className="px-3 py-1.5 rounded-xl border-2 border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-bold transition flex items-center gap-1 shrink-0 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
      >
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
        </svg>
        <span className="hidden sm:inline">Prev</span>
      </button>

      {/* Question buttons row */}
      <div className="flex items-center gap-3 overflow-x-auto py-2 px-1 flex-1 justify-center sm:justify-start">
        {sectionGroups.length > 0 ? (
          sectionGroups.map((group, gIndex) => (
            <div key={group.partNumber} className="flex items-center gap-1.5 shrink-0">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 font-mono shrink-0 mr-1">
                P{group.partNumber}
              </span>

              <div className="flex items-center gap-1.5">
                {group.indices.map((idx) => renderButton(idx))}
              </div>

              {gIndex < sectionGroups.length - 1 && (
                <div className="h-6 w-[2px] bg-slate-200 mx-2 shrink-0" />
              )}
            </div>
          ))
        ) : (
          <div className="flex items-center gap-1.5">
            {Array.from({ length: totalQuestions }, (_, i) => i + 1).map((idx) =>
              renderButton(idx)
            )}
          </div>
        )}
      </div>

      {/* Next button */}
      <button
        type="button"
        onClick={handleNext}
        disabled={currentActive >= totalQuestions}
        className="px-3 py-1.5 rounded-xl border-2 border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-bold transition flex items-center gap-1 shrink-0 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
      >
        <span className="hidden sm:inline">Next</span>
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
        </svg>
      </button>

      {/* Legend */}
      <div className="hidden xl:flex items-center gap-4 pl-4 border-l-2 border-slate-200 shrink-0 text-xs font-medium text-slate-500">
        <div className="flex items-center gap-1.5">
          <span className="w-4 h-3.5 rounded-md bg-emerald-50 border-2 border-emerald-500 text-[9px] text-emerald-600 font-bold flex items-center justify-center">
            ✓
          </span>
          <span className="text-slate-700 font-medium">Correct</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-4 h-3.5 rounded-md bg-rose-50 border-2 border-rose-400 text-[9px] text-rose-500 font-bold flex items-center justify-center">
            ✕
          </span>
          <span className="text-slate-700 font-medium">Incorrect</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-4 h-3.5 rounded-md bg-white border-2 border-slate-200" />
          <span className="text-slate-700 font-medium">Unanswered</span>
        </div>
      </div>
    </footer>
  );
}
