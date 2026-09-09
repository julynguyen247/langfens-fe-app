"use client";

import { InternalDeliveryOption, UserAnswerValue } from "../../_lib/types";

interface McqCardProps {
  options: InternalDeliveryOption[];
  isMultiple: boolean;
  value?: UserAnswerValue;
  onChange: (val: UserAnswerValue) => void;
}

export function McqCard({
  options,
  isMultiple,
  value,
  onChange,
}: McqCardProps) {
  const selectedList: string[] = Array.isArray(value)
    ? value.map((s) => String(s))
    : typeof value === "string" && value
    ? [value]
    : [];

  const handleSelect = (optId: string) => {
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

        const borderClass = isSelected
          ? "border-[#2563EB] bg-blue-50/70 text-slate-900 font-semibold shadow-xs"
          : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/70 text-slate-800";

        return (
          <button
            key={opt.id || opt.idx}
            type="button"
            onClick={() => handleSelect(opt.id || opt.contentMd)}
            className={`w-full text-left p-4 rounded-2xl border-2 flex items-start gap-3.5 transition-all shadow-2xs ${borderClass}`}
          >
            {/* Indicator Circle */}
            <div
              className={`mt-0.5 shrink-0 flex items-center justify-center w-5 h-5 transition-all ${
                isMultiple ? "rounded-md" : "rounded-full"
              } ${
                isSelected
                  ? "bg-[#2563EB] text-white font-bold shadow-xs"
                  : "border-2 border-slate-300 bg-white"
              }`}
            >
              {isSelected ? (
                <svg className="w-3.5 h-3.5 stroke-[3]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                </svg>
              ) : null}
            </div>

            {/* Option text */}
            <div className="flex-1 text-xs sm:text-sm leading-relaxed font-sans">
              {opt.contentMd}
            </div>
          </button>
        );
      })}
    </div>
  );
}
