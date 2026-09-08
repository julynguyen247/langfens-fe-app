"use client";

import React from "react";
import { InternalDeliveryOption, UserAnswerValue } from "../types";

interface McqCardV3Props {
  options: InternalDeliveryOption[];
  isMultiple: boolean;
  mode: "exam" | "review";
  value?: UserAnswerValue;
  onChange?: (val: UserAnswerValue) => void;
}

export function McqCardV3({
  options,
  isMultiple,
  mode,
  value,
  onChange,
}: McqCardV3Props) {
  const isReview = mode === "review";

  const selectedMap: Record<string, boolean> = {};
  if (Array.isArray(value)) {
    for (const v of value) selectedMap[String(v)] = true;
  } else if (typeof value === "string" && value) {
    selectedMap[value] = true;
  }

  const handleSelect = (optId: string) => {
    if (isReview || !onChange) return;

    if (isMultiple) {
      const currentList = Array.isArray(value) ? [...value] : typeof value === "string" && value ? [value] : [];
      const idx = currentList.indexOf(optId);
      if (idx >= 0) {
        currentList.splice(idx, 1);
      } else {
        currentList.push(optId);
      }
      onChange(currentList);
    } else {
      onChange(optId);
    }
  };

  return (
    <div className="space-y-2.5 pt-2 font-sans">
      {options.map((opt, i) => {
        const letter = String.fromCharCode(65 + i);
        const optId = opt.id || String(opt.idx ?? i);
        const isSelected = Boolean(selectedMap[optId]);
        const isCorrectKey = Boolean(opt.isCorrect);

        let rowStyle = "bg-white border-slate-200 text-slate-700 hover:border-slate-300";
        let badgeStyle = "bg-slate-100 text-slate-600 border-slate-200";
        let statusBadge = null;

        if (isReview) {
          if (isSelected && isCorrectKey) {
            rowStyle = "bg-emerald-50/80 border-emerald-500 text-emerald-950 font-medium";
            badgeStyle = "bg-emerald-600 text-white border-emerald-600 font-bold";
            statusBadge = (
              <span className="px-2 py-0.5 text-[11px] font-bold rounded-md bg-emerald-600 text-white shrink-0">
                Your Answer ✓
              </span>
            );
          } else if (isSelected && !isCorrectKey) {
            rowStyle = "bg-rose-50/80 border-rose-500 text-rose-950 line-through decoration-rose-400";
            badgeStyle = "bg-rose-600 text-white border-rose-600 font-bold";
            statusBadge = (
              <span className="px-2 py-0.5 text-[11px] font-bold rounded-md bg-rose-600 text-white shrink-0">
                Your Answer ✕
              </span>
            );
          } else if (!isSelected && isCorrectKey) {
            rowStyle = "bg-emerald-50/50 border-emerald-400 border-dashed text-emerald-900";
            badgeStyle = "bg-emerald-100 text-emerald-800 border-emerald-300 font-bold";
            statusBadge = (
              <span className="px-2 py-0.5 text-[11px] font-bold rounded-md bg-emerald-100 text-emerald-800 border border-emerald-300 shrink-0">
                Correct Key
              </span>
            );
          }
        } else {
          // Exam Mode
          if (isSelected) {
            rowStyle = "bg-blue-50/80 border-[#2563EB] text-[#1E40AF] font-semibold shadow-xs ring-1 ring-[#2563EB]";
            badgeStyle = "bg-[#2563EB] text-white border-[#2563EB] font-bold";
          }
        }

        return (
          <div
            key={optId}
            onClick={() => handleSelect(optId)}
            className={`p-3.5 rounded-2xl border-2 flex items-center justify-between gap-3 transition-all ${rowStyle} ${
              !isReview ? "cursor-pointer select-none active:scale-[0.99]" : ""
            }`}
          >
            <div className="flex items-center gap-3 min-w-0">
              <span
                className={`w-7 h-7 rounded-xl border flex items-center justify-center text-xs font-mono shrink-0 ${badgeStyle}`}
              >
                {letter}
              </span>
              <span className="text-xs sm:text-sm leading-relaxed">
                {opt.contentMd}
              </span>
            </div>

            {statusBadge}
          </div>
        );
      })}
    </div>
  );
}
