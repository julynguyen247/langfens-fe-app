"use client";

import { UserAnswerValue } from "../../_lib/types";

interface CompletionCardProps {
  blankAcceptTexts?: Record<string, string[] | null> | null;
  blankAcceptRegex?: Record<string, string[] | null> | null;
  value?: UserAnswerValue;
  isReview: boolean;
  onChange: (val: UserAnswerValue) => void;
}

export function CompletionCard({
  blankAcceptTexts,
  value,
  isReview,
  onChange,
}: CompletionCardProps) {
  const texts = blankAcceptTexts || {};
  const blankKeys = Object.keys(texts).length > 0 ? Object.keys(texts) : ["1"];

  // Sort keys numerically if possible
  blankKeys.sort((a, b) => {
    const na = Number(a);
    const nb = Number(b);
    if (!isNaN(na) && !isNaN(nb)) return na - nb;
    return a.localeCompare(b);
  });

  const userDict: Record<string, string> =
    value && typeof value === "object" && !Array.isArray(value)
      ? (value as Record<string, string>)
      : typeof value === "string"
      ? { "1": value }
      : {};

  const handleInputChange = (key: string, text: string) => {
    if (isReview) return;
    const next = { ...userDict, [key]: text };
    onChange(next);
  };

  return (
    <div className="space-y-3">
      {blankKeys.map((key) => {
        const userVal = userDict[key] || "";
        const accepted = texts[key] || [];

        let isCorrect = false;
        if (isReview) {
          const cleanUser = userVal.trim().toLowerCase();
          if (cleanUser && accepted.some((acc) => acc && acc.trim().toLowerCase() === cleanUser)) {
            isCorrect = true;
          }
        }

        let inputClass = "bg-white border-slate-300 text-slate-900 focus:border-[#2563EB]";
        if (isReview) {
          inputClass = isCorrect
            ? "bg-emerald-50 border-emerald-500 text-emerald-950 font-bold"
            : "bg-rose-50 border-rose-500 text-rose-950 font-bold";
        }

        return (
          <div key={key} className="space-y-1.5">
            <div className="flex items-center gap-3">
              <span className="font-mono text-xs font-bold text-[#2563EB] bg-blue-50 border border-blue-200 px-3 py-1.5 rounded-xl shrink-0">
                [{key}]
              </span>

              <div className="flex-1 relative">
                <input
                  type="text"
                  disabled={isReview}
                  value={userVal}
                  onChange={(e) => handleInputChange(key, e.target.value)}
                  placeholder={`Type answer for blank [${key}]...`}
                  className={`w-full rounded-xl border-2 px-4 py-2.5 text-xs sm:text-sm focus:outline-none transition-all shadow-2xs ${inputClass}`}
                />

                {isReview && (
                  <span className="absolute right-3.5 top-2.5 text-sm">
                    {isCorrect ? (
                      <span className="text-emerald-600 font-bold">✓</span>
                    ) : (
                      <span className="text-rose-600 font-bold">✕</span>
                    )}
                  </span>
                )}
              </div>
            </div>

            {/* Review feedback: show correct acceptable answers */}
            {isReview && !isCorrect && (
              <div className="ml-16 text-xs text-emerald-700 font-mono font-medium">
                Accepted: <strong className="text-emerald-800">{accepted.join(" | ") || "N/A"}</strong>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
