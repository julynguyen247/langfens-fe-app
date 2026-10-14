"use client";

import React from "react";
import { InternalDeliveryOption, UserAnswerValue } from "../types";

interface TrueFalseCardV3Props {
  questionType: string;
  options: InternalDeliveryOption[];
  mode: "exam" | "review";
  value?: UserAnswerValue;
  onChange?: (val: UserAnswerValue) => void;
}

export function TrueFalseCardV3({
  questionType,
  options,
  mode,
  value,
  onChange,
}: TrueFalseCardV3Props) {
  const isReview = mode === "review";
  const isYesNo = questionType.toUpperCase().includes("YES_NO");
  const defaultLabels = isYesNo
    ? ["YES", "NO", "NOT GIVEN"]
    : ["TRUE", "FALSE", "NOT GIVEN"];

  const items: InternalDeliveryOption[] =
    options && options.length > 0
      ? options
      : defaultLabels.map((label, idx) => ({
          id: label,
          idx,
          contentMd: label,
          isCorrect: false,
        }));

  const userSelection = typeof value === "string" ? value.trim().toUpperCase() : "";

  const handleSelect = (val: string) => {
    if (isReview || !onChange) return;
    onChange(val);
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 font-sans">
      {items.map((opt) => {
        const text = opt.contentMd.trim().toUpperCase();
        const isSelected =
          userSelection === text ||
          userSelection === opt.id.toUpperCase() ||
          userSelection === text.replace(/\s+/g, "_");
        const isCorrectKey = Boolean(opt.isCorrect);

        let cardStyle = "bg-white border-slate-200 text-slate-700 hover:border-slate-300";
        let statusBadge = null;

        if (isReview) {
          if (isSelected && isCorrectKey) {
            cardStyle = "bg-emerald-50/80 border-emerald-500 text-emerald-950 font-bold shadow-xs";
            statusBadge = (
              <span className="text-[11px] text-emerald-700 font-bold block mt-1">
                Your Answer ✓
              </span>
            );
          } else if (isSelected && !isCorrectKey) {
            cardStyle = "bg-rose-50/80 border-rose-500 text-rose-950 font-semibold line-through decoration-rose-400";
            statusBadge = (
              <span className="text-[11px] text-rose-700 font-bold block mt-1">
                Your Answer ✕
              </span>
            );
          } else if (!isSelected && isCorrectKey) {
            cardStyle = "bg-emerald-50/50 border-emerald-400 border-dashed text-emerald-900";
            statusBadge = (
              <span className="text-[11px] text-emerald-700 font-bold block mt-1">
                Correct Key
              </span>
            );
          }
        } else {
          // Exam Mode
          if (isSelected) {
            cardStyle = "bg-blue-50/80 border-[#2563EB] text-[#1E40AF] font-bold shadow-xs ring-2 ring-[#2563EB]";
          }
        }

        return (
          <div
            key={opt.id || text}
            onClick={() => handleSelect(text)}
            className={`p-4 rounded-2xl border-2 text-center transition-all ${cardStyle} ${
              !isReview ? "cursor-pointer select-none active:scale-95" : ""
            }`}
          >
            <span className="text-sm font-bold tracking-wide">
              {opt.contentMd}
            </span>
            {statusBadge}
          </div>
        );
      })}
    </div>
  );
}
