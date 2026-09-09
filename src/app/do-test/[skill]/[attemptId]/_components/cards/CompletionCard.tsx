"use client";

import { UserAnswerValue } from "../../_lib/types";

interface CompletionCardProps {
  blankAcceptTexts?: Record<string, string[] | null> | null;
  blankAcceptRegex?: Record<string, string[] | null> | null;
  promptMd?: string | null;
  imageUrl?: string | null;
  value?: UserAnswerValue;
  isReview: boolean;
  onChange: (val: UserAnswerValue) => void;
}

export function CompletionCard({
  blankAcceptTexts,
  promptMd,
  imageUrl,
  value,
  isReview,
  onChange,
}: CompletionCardProps) {
  const texts = blankAcceptTexts || {};
  let blankKeys = Object.keys(texts);

  // When blankAcceptTexts is empty (e.g. during live test where answers are stripped for security):
  if (blankKeys.length === 0) {
    if (promptMd) {
      // 1. Check for bracketed placeholders [0], [1], [2] or [1], [2], [3]
      const bracketMatches = Array.from(promptMd.matchAll(/\[(\d+)\]/g)).map((m) => m[1]);
      if (bracketMatches.length > 0) {
        blankKeys = Array.from(new Set(bracketMatches)).sort((a, b) => Number(a) - Number(b));
      } else {
        // 2. Check for underscore placeholders __________
        const underscores = promptMd.match(/_{3,}/g) || [];
        if (underscores.length > 0) {
          blankKeys = underscores.map((_, i) => String(i));
        }
      }
    }
  }

  if (blankKeys.length === 0) {
    blankKeys = ["0"];
  } else {
    blankKeys.sort((a, b) => {
      const na = Number(a);
      const nb = Number(b);
      if (!isNaN(na) && !isNaN(nb)) return na - nb;
      return a.localeCompare(b);
    });
  }

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
    <>
      {imageUrl && (
        <div className="mb-4 flex justify-center">
          <img
            src={imageUrl}
            alt="Question diagram"
            className="max-w-full max-h-96 rounded-lg border border-slate-200"
            loading="lazy"
          />
        </div>
      )}

      <div className="space-y-4">
      {blankKeys.map((key) => {
        const userVal = userDict[key] || "";
        const accepted = texts[key] || [];

        let isCorrect = false;
        const cleanUser = userVal.trim().toLowerCase();
        if (isReview && cleanUser) {
          if (accepted.some((acc) => acc && acc.trim().toLowerCase() === cleanUser)) {
            isCorrect = true;
          }
        }

        let inputClass = "bg-white border-slate-300 text-slate-900 focus:border-[#2563EB]";
        if (isReview) {
          if (isCorrect) {
            inputClass = "bg-emerald-50 border-emerald-500 text-emerald-950 font-bold";
          } else if (cleanUser) {
            inputClass = "bg-rose-50 border-rose-500 text-rose-950 font-semibold";
          } else {
            inputClass = "bg-slate-50 border-slate-300 text-slate-400 italic";
          }
        }

        const displayNum = !isNaN(Number(key))
          ? Number(key) + (blankKeys[0] === "0" ? 1 : 0)
          : blankKeys.indexOf(key) + 1;

        return (
          <div key={key} className="space-y-1.5 p-3 rounded-2xl bg-slate-50/50 border border-slate-100">
            <div className="flex items-center gap-3">
              <span className="font-mono text-xs font-bold text-[#2563EB] bg-blue-50 border border-blue-200 px-3 py-1.5 rounded-xl shrink-0">
                Blank [{displayNum}]
              </span>

              <div className="flex-1 relative">
                <input
                  type="text"
                  disabled={isReview}
                  value={isReview && !cleanUser ? "(Unanswered)" : userVal}
                  onChange={(e) => handleInputChange(key, e.target.value)}
                  placeholder={`Type answer for blank [${displayNum}]...`}
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
              <div className="ml-16 pl-4 text-xs space-y-0.5 pt-1">
                <div className="flex items-center gap-1.5 text-emerald-700 font-bold">
                  <span>✓ Correct answer:</span>
                  <span className="font-mono text-emerald-900 bg-emerald-100/60 px-2 py-0.5 rounded border border-emerald-200">
                    {accepted.join(" | ") || "N/A"}
                  </span>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
    </>
  );
}
