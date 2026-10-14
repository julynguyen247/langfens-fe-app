"use client";

import { InternalDeliveryOption, UserAnswerValue } from "../../_lib/types";

interface TrueFalseCardProps {
  questionType: string;
  options: InternalDeliveryOption[];
  value?: UserAnswerValue;
  onChange: (val: UserAnswerValue) => void;
}

export function TrueFalseCard({
  questionType,
  options,
  value,
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

  const userSelection = typeof value === "string" ? value.trim().toUpperCase() : "";

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
      {choices.map((choice) => {
        const choiceUpper = choice.toUpperCase();
        const isSelected = userSelection === choiceUpper;

        const styleClass = isSelected
          ? "border-[#2563EB] bg-blue-50/80 text-[#2563EB] font-bold shadow-xs"
          : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50";

        return (
          <button
            key={choice}
            type="button"
            onClick={() => onChange(choiceUpper)}
            className={`py-4 px-4 rounded-2xl border-2 text-xs font-bold flex flex-col items-center justify-center gap-1.5 transition-all shadow-2xs cursor-pointer ${styleClass}`}
          >
            <span className="text-sm tracking-wide">{choice}</span>
          </button>
        );
      })}
    </div>
  );
}
