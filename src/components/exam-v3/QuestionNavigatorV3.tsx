"use client";

import React from "react";
import {
  AttemptAnswerItem,
  InternalDeliverySection,
  InternalDeliveryQuestionGroup,
  InternalDeliveryQuestion,
  UserAnswerValue,
} from "./types";

interface QuestionNavigatorV3Props {
  totalQuestions: number;
  sections: InternalDeliverySection[];
  mode: "exam" | "review";
  activeIdx: number | null;
  answers?: Record<number, UserAnswerValue>;
  flaggedIndices?: number[];
  answersByDisplayIdx?: Record<number, AttemptAnswerItem>;
  onSelect: (qIdx: number) => void;
}

export function QuestionNavigatorV3({
  totalQuestions,
  sections,
  mode,
  activeIdx,
  answers = {},
  flaggedIndices = [],
  answersByDisplayIdx = {},
  onSelect,
}: QuestionNavigatorV3Props) {
  const isReview = mode === "review";

  const sectionGroups: { sectionTitle: string; indices: number[] }[] = [];

  for (let sIdx = 0; sIdx < sections.length; sIdx++) {
    const sec = sections[sIdx];
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
    if (indices.length > 0) {
      const partNum = (sec.idx ?? sIdx) + 1;
      sectionGroups.push({
        sectionTitle: `Part ${partNum}`,
        indices,
      });
    }
  }

  if (sectionGroups.length === 0) {
    const all: number[] = [];
    for (let i = 1; i <= totalQuestions; i++) all.push(i);
    sectionGroups.push({ sectionTitle: "Questions", indices: all });
  }

  return (
    <nav aria-label="Question Navigator" className="h-16 border-t border-[var(--border)] bg-white px-6 flex items-center justify-between shrink-0 z-30 font-sans">
      <div className="flex items-center gap-6 overflow-x-auto py-2 w-full">
        {sectionGroups.map((group, gIdx) => (
          <div key={group.sectionTitle + gIdx} className="flex items-center gap-2 shrink-0">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)] font-mono">
              {group.sectionTitle}:
            </span>

            <div className="flex items-center gap-1.5">
              {group.indices.map((num) => {
                const isActive = activeIdx === num;

                if (isReview) {
                  // Review Mode Pill
                  const ans = answersByDisplayIdx[num];
                  const isAnswered =
                    ans &&
                    (ans.textAnswer !== null ||
                      (ans.selectedOptionIds && ans.selectedOptionIds.length > 0) ||
                      (ans.selectedAnswerText !== null && ans.selectedAnswerText !== ""));
                  const isCorrect = ans?.isCorrect === true;

                  let pillColor = "bg-[var(--background)] text-[var(--text-muted)] hover:bg-[var(--border-light)] border-[var(--border)]";
                  if (isCorrect) {
                    pillColor = "bg-emerald-600 text-white border-emerald-700 shadow-2xs";
                  } else if (isAnswered) {
                    pillColor = "bg-rose-600 text-white border-rose-700 shadow-2xs";
                  }

                  return (
                    <button
                      key={num}
                      type="button"
                      onClick={() => onSelect(num)}
                      className={`w-7 h-7 rounded-lg text-xs font-mono font-bold transition-all border flex items-center justify-center cursor-pointer ${pillColor} ${
                        isActive ? "ring-2 ring-[var(--primary)] ring-offset-1 scale-110 z-10" : ""
                      }`}
                      title={`Question ${num}: ${
                        isCorrect ? "Correct" : isAnswered ? "Incorrect" : "Unanswered"
                      }`}
                    >
                      {num}
                    </button>
                  );
                }

                // Exam Mode Pill
                const hasAnswer = Boolean(answers[num]);
                const isFlagged = flaggedIndices.includes(num);

                let pillColor = "bg-[var(--surface)] text-[var(--text-body)] border-[var(--border)] hover:bg-[var(--background)]";
                if (hasAnswer) {
                  pillColor = "bg-[var(--primary)] text-white border-[var(--primary-dark)] shadow-2xs";
                }

                return (
                  <button
                    key={num}
                    type="button"
                    onClick={() => onSelect(num)}
                    className={`relative w-7 h-7 rounded-lg text-xs font-mono font-bold transition-all border flex items-center justify-center cursor-pointer ${pillColor} ${
                      isActive ? "ring-2 ring-[var(--primary)] ring-offset-1 scale-110 z-10" : ""
                    }`}
                    title={`Question ${num}${hasAnswer ? " (Answered)" : ""}${isFlagged ? " (Flagged)" : ""}`}
                  >
                    {num}
                    {isFlagged && (
                      <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-amber-400 border border-white rounded-full" />
                    )}
                  </button>
                );
              })}
            </div>

            {gIdx < sectionGroups.length - 1 && (
              <div className="h-4 w-px bg-[var(--border)] mx-2" />
            )}
          </div>
        ))}
      </div>
    </nav>
  );
}
