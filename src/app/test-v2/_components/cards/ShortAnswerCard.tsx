"use client";

import { UserAnswerValue } from "../../_lib/types";

interface ShortAnswerCardProps {
  shortAnswerAcceptTexts?: string[] | null;
  value?: UserAnswerValue;
  isReview: boolean;
  onChange: (val: UserAnswerValue) => void;
}

export function ShortAnswerCard({
  shortAnswerAcceptTexts,
  value,
  isReview,
  onChange,
}: ShortAnswerCardProps) {
  const userVal = typeof value === "string" ? value : "";
  const accepted = shortAnswerAcceptTexts || [];

  let isCorrect = false;
  if (isReview) {
    const clean = userVal.trim().toLowerCase();
    isCorrect = Boolean(clean && accepted.some((a) => a.trim().toLowerCase() === clean));
  }

  let borderClass = "border-slate-300 bg-white text-slate-900 focus:border-[#2563EB]";
  if (isReview) {
    borderClass = isCorrect
      ? "border-emerald-500 bg-emerald-50 text-emerald-950 font-bold"
      : "border-rose-500 bg-rose-50 text-rose-950 font-bold";
  }

  return (
    <div className="space-y-2">
      <div className="relative">
        <input
          type="text"
          disabled={isReview}
          value={userVal}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Type your short answer here..."
          className={`w-full rounded-2xl border-2 px-4 py-3 text-xs sm:text-sm focus:outline-none transition-all shadow-2xs ${borderClass}`}
        />
        {isReview && (
          <span className="absolute right-3.5 top-3 text-sm">
            {isCorrect ? (
              <span className="text-emerald-600 font-bold">✓</span>
            ) : (
              <span className="text-rose-600 font-bold">✕</span>
            )}
          </span>
        )}
      </div>

      {isReview && !isCorrect && (
        <div className="text-xs text-emerald-700 font-mono font-medium">
          Accepted: <strong className="text-emerald-800">{accepted.join(" | ") || "N/A"}</strong>
        </div>
      )}
    </div>
  );
}
