"use client";

import { InternalDeliveryOption, UserAnswerValue } from "../../_lib/types";

interface McqCardProps {
  options: InternalDeliveryOption[];
  isMultiple: boolean;
  value?: UserAnswerValue;
  isReview: boolean;
  onChange: (val: UserAnswerValue) => void;
}

export function McqCard({
  options,
  isMultiple,
  value,
  isReview,
  onChange,
}: McqCardProps) {
  const selectedList: string[] = Array.isArray(value)
    ? value.map((s) => String(s))
    : typeof value === "string" && value
    ? [value]
    : [];

  const handleSelect = (optId: string) => {
    if (isReview) return;

    if (isMultiple) {
      if (selectedList.includes(optId)) {
        onChange(selectedList.filter((x) => x !== optId));
      } else {
        onChange([...selectedList, optId]);
      }
    } else {
      onChange(optId);
    }
  };

  return (
    <div className="space-y-3">
      {options.map((opt) => {
        const isSelected = selectedList.some((s) => {
          const str = String(s).trim().toLowerCase();
          return (
            (opt.id && str === opt.id.toLowerCase()) ||
            (opt.contentMd && str === opt.contentMd.trim().toLowerCase()) ||
            (opt.contentMd && opt.contentMd.trim().toLowerCase().startsWith(str)) ||
            (opt.contentMd && str.startsWith(opt.contentMd.trim().toLowerCase())) ||
            str === String(opt.idx)
          );
        });
        const isAnswerCorrect = Boolean(opt.isCorrect);

        let borderClass = "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/70 text-slate-800";
        if (isSelected && !isReview) {
          borderClass = "border-[#2563EB] bg-blue-50/70 text-slate-900 font-semibold shadow-xs";
        }

        if (isReview) {
          if (isAnswerCorrect && isSelected) {
            borderClass = "border-emerald-500 bg-emerald-50 text-emerald-950 font-bold shadow-xs";
          } else if (isAnswerCorrect && !isSelected) {
            borderClass = "border-emerald-400 bg-emerald-50/60 text-emerald-900 font-medium";
          } else if (!isAnswerCorrect && isSelected) {
            borderClass = "border-rose-500 bg-rose-50 text-rose-950 font-medium shadow-xs";
          } else {
            borderClass = "border-slate-200 bg-slate-50/50 text-slate-500";
          }
        }

        return (
          <button
            key={opt.id || opt.idx}
            type="button"
            disabled={isReview}
            onClick={() => handleSelect(opt.id || opt.contentMd)}
            className={`w-full text-left p-4 rounded-2xl border-2 flex items-start gap-3.5 transition-all shadow-2xs ${borderClass}`}
          >
            {/* Indicator Circle */}
            <div
              className={`mt-0.5 shrink-0 flex items-center justify-center w-5 h-5 transition-all ${
                isMultiple ? "rounded-md" : "rounded-full"
              } ${
                isReview
                  ? isAnswerCorrect
                    ? "bg-emerald-500 text-white font-bold shadow-xs"
                    : isSelected
                    ? "bg-rose-500 text-white font-bold shadow-xs"
                    : "border-2 border-slate-300 bg-white"
                  : isSelected
                  ? "bg-[#2563EB] text-white font-bold shadow-xs"
                  : "border-2 border-slate-300 bg-white"
              }`}
            >
              {isReview ? (
                isAnswerCorrect ? (
                  <span className="text-[11px] leading-none font-bold">✓</span>
                ) : isSelected ? (
                  <span className="text-[11px] leading-none font-bold">✕</span>
                ) : null
              ) : isSelected ? (
                <svg className="w-3.5 h-3.5 stroke-[3]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                </svg>
              ) : null}
            </div>

            {/* Option text (no strikethrough) */}
            <div className="flex-1 text-xs sm:text-sm leading-relaxed font-sans">
              {opt.contentMd}
            </div>

            {/* Review mode badges */}
            {isReview && (
              <div className="shrink-0 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider">
                {isAnswerCorrect && isSelected && (
                  <span className="px-2.5 py-1 rounded-md bg-emerald-100 text-emerald-800 border border-emerald-300">
                    ✓ Your Choice (Correct)
                  </span>
                )}
                {isAnswerCorrect && !isSelected && (
                  <span className="px-2.5 py-1 rounded-md bg-emerald-100 text-emerald-800 border border-emerald-300">
                    ✓ Correct Answer
                  </span>
                )}
                {isSelected && !isAnswerCorrect && (
                  <span className="px-2.5 py-1 rounded-md bg-rose-100 text-rose-800 border border-rose-300">
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
