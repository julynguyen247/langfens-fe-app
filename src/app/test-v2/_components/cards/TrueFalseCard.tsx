"use client";

import { InternalDeliveryOption, UserAnswerValue } from "../../_lib/types";

interface TrueFalseCardProps {
  questionType: string;
  options: InternalDeliveryOption[];
  value?: UserAnswerValue;
  isReview: boolean;
  onChange: (val: UserAnswerValue) => void;
}

export function TrueFalseCard({
  questionType,
  options,
  value,
  isReview,
  onChange,
}: TrueFalseCardProps) {
  const isYesNo = questionType === "YES_NO_NOT_GIVEN";
  const defaultPills = isYesNo
    ? ["YES", "NO", "NOT GIVEN"]
    : ["TRUE", "FALSE", "NOT GIVEN"];

  const choices =
    options && options.length > 0
      ? options.map((o) => o.contentMd.trim())
      : defaultPills;

  const correctOption = options.find((o) => o.isCorrect);
  const correctText = correctOption?.contentMd?.trim()?.toUpperCase() || "";

  const userSelection = typeof value === "string" ? value.trim().toUpperCase() : "";

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
      {choices.map((choice) => {
        const choiceUpper = choice.toUpperCase();
        const isSelected = userSelection === choiceUpper;
        const isCorrectChoice = isReview && correctText === choiceUpper;

        let styleClass = "border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50";

        if (isSelected && !isReview) {
          styleClass = "border-[#2563EB] bg-blue-50/80 text-[#2563EB] font-bold shadow-xs";
        }

        if (isReview) {
          if (isCorrectChoice && isSelected) {
            styleClass = "border-emerald-500 bg-emerald-50 text-emerald-950 font-bold shadow-xs";
          } else if (isCorrectChoice && !isSelected) {
            styleClass = "border-emerald-500 bg-emerald-50/60 text-emerald-900 font-semibold";
          } else if (!isCorrectChoice && isSelected) {
            styleClass = "border-rose-500 bg-rose-50 text-rose-950 font-semibold shadow-xs";
          } else {
            styleClass = "border-slate-200 bg-slate-50/50 text-slate-500";
          }
        }

        return (
          <button
            key={choice}
            type="button"
            disabled={isReview}
            onClick={() => onChange(choiceUpper)}
            className={`py-4 px-4 rounded-2xl border-2 text-xs font-bold flex flex-col items-center justify-center gap-1.5 transition-all shadow-2xs cursor-pointer ${styleClass}`}
          >
            <span className="text-sm tracking-wide">{choice}</span>

            {isReview && (
              <div className="mt-0.5">
                {isCorrectChoice && isSelected && (
                  <span className="text-[10px] uppercase font-bold text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded-md border border-emerald-300">
                    ✓ Your Choice (Correct)
                  </span>
                )}
                {isCorrectChoice && !isSelected && (
                  <span className="text-[10px] uppercase font-bold text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded-md border border-emerald-300">
                    ✓ Correct Answer
                  </span>
                )}
                {isSelected && !isCorrectChoice && (
                  <span className="text-[10px] uppercase font-bold text-rose-800 bg-rose-100 px-2.5 py-0.5 rounded-md border border-rose-300">
                    ✕ Your Choice (Incorrect)
                  </span>
                )}
              </div>
            )}
          </button>
        );
      })}
    </div>
  );
}
