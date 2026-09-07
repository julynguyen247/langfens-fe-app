"use client";

import { InternalDeliveryOption, UserAnswerValue } from "../../_lib/types";

interface MatchingCardProps {
  matchPairs?: Record<string, string[] | null> | null;
  options: InternalDeliveryOption[];
  value?: UserAnswerValue;
  isReview: boolean;
  onChange: (val: UserAnswerValue) => void;
}

export function MatchingCard({
  matchPairs,
  options,
  value,
  isReview,
  onChange,
}: MatchingCardProps) {
  const pairs = matchPairs || {};
  const promptKeys = Object.keys(pairs).sort();

  const userDict: Record<string, string> =
    value && typeof value === "object" && !Array.isArray(value)
      ? (value as Record<string, string>)
      : {};

  const handleSelect = (promptKey: string, selectedGradingKey: string) => {
    if (isReview) return;
    const next = { ...userDict, [promptKey]: selectedGradingKey };
    onChange(next);
  };

  const choices: { key: string; label: string }[] = [];
  if (options && options.length > 0) {
    for (const opt of options) {
      const match = opt.contentMd.match(/^([ivxlcdm]+|[a-z0-9]+)\.?\s*(.*)/i);
      const k = match ? match[1].toLowerCase() : String(opt.idx);
      choices.push({
        key: k,
        label: opt.contentMd,
      });
    }
  } else {
    for (const pKey of promptKeys) {
      const val = pairs[pKey];
      if (val && val[0]) {
        const k = val[0].toLowerCase();
        if (!choices.some((c) => c.key === k)) {
          choices.push({
            key: k,
            label: val[1] || val[0],
          });
        }
      }
    }
  }

  return (
    <div className="space-y-4">
      {/* Available choice pool reference box */}
      {choices.length > 0 && (
        <div className="p-5 rounded-2xl bg-slate-50 border-2 border-slate-200 text-xs space-y-2 shadow-2xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
            List of Available Choices:
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {choices.map((c) => (
              <div key={c.key} className="flex items-start gap-2 text-slate-700">
                <span className="font-mono text-[#2563EB] font-bold shrink-0">[{c.key}]</span>
                <span className="font-medium">{c.label}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Prompt items to match */}
      <div className="space-y-3">
        {promptKeys.map((pKey) => {
          const userChoice = (userDict[pKey] || "").toLowerCase();
          const targetPair = pairs[pKey] || [];
          const correctKey = (targetPair[0] || "").toLowerCase();
          const correctLabel = targetPair[1] || targetPair[0] || "";

          const isMatchCorrect = isReview && userChoice && userChoice === correctKey;
          const hasAnswered = Boolean(userChoice);

          let borderClass = "border-slate-200 bg-white";
          if (isReview) {
            borderClass = isMatchCorrect
              ? "border-emerald-500 bg-emerald-50/50"
              : "border-rose-500 bg-rose-50/50";
          }

          return (
            <div
              key={pKey}
              className={`p-4 rounded-2xl border-2 space-y-2 transition-all shadow-2xs ${borderClass}`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <span className="font-mono text-xs font-bold text-[#2563EB] bg-blue-50 border border-blue-200 px-3 py-1 rounded-xl">
                    Target [{pKey}]
                  </span>
                  <span className="text-xs font-bold text-slate-700">Match to choice</span>
                </div>

                <div className="flex items-center gap-2">
                  <select
                    disabled={isReview}
                    value={userChoice}
                    onChange={(e) => handleSelect(pKey, e.target.value)}
                    className={`bg-white border-2 rounded-xl px-3.5 py-2 text-xs font-medium text-slate-800 focus:outline-none focus:border-[#2563EB] min-w-48 shadow-2xs ${
                      isReview
                        ? isMatchCorrect
                          ? "border-emerald-500 text-emerald-900 font-bold bg-emerald-50"
                          : "border-rose-500 text-rose-900 font-bold bg-rose-50"
                        : "border-slate-300"
                    }`}
                  >
                    <option value="">{isReview && !hasAnswered ? "(Unanswered)" : "-- Select choice --"}</option>
                    {choices.map((c) => (
                      <option key={c.key} value={c.key}>
                        [{c.key}] {c.label}
                      </option>
                    ))}
                  </select>

                  {isReview && (
                    <span className="text-xs">
                      {isMatchCorrect ? (
                        <span className="text-emerald-600 font-bold text-sm">✓</span>
                      ) : (
                        <span className="text-rose-600 font-bold text-sm">✕</span>
                      )}
                    </span>
                  )}
                </div>
              </div>

              {/* Review Mode: Inline correct answer display */}
              {isReview && !isMatchCorrect && (
                <div className="pt-2 border-t border-rose-200 text-xs flex items-center gap-2">
                  <span className="text-emerald-700 font-bold">✓ Correct match:</span>
                  <span className="font-mono text-emerald-900 font-bold bg-emerald-100/60 px-2 py-0.5 rounded border border-emerald-300">
                    [{correctKey}] {correctLabel}
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
