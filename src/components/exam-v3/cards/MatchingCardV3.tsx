"use client";

import React from "react";
import { InternalDeliveryOption, UserAnswerValue } from "../types";

interface MatchingCardV3Props {
  matchPairs?: Record<string, string[] | null> | null;
  options: InternalDeliveryOption[];
  mode: "exam" | "review";
  value?: UserAnswerValue;
  onChange?: (val: UserAnswerValue) => void;
}

export function MatchingCardV3({
  matchPairs,
  options,
  mode,
  value,
  onChange,
}: MatchingCardV3Props) {
  const isReview = mode === "review";
  const pairs = matchPairs || {};
  const promptKeys = Object.keys(pairs).sort();

  const userDict: Record<string, string> =
    value && typeof value === "object" && !Array.isArray(value)
      ? (value as Record<string, string>)
      : {};

  const handleSelect = (pKey: string, choiceKey: string) => {
    if (isReview || !onChange) return;
    const next = { ...userDict, [pKey]: choiceKey };
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
        let exists = false;
        for (const c of choices) {
          if (c.key === k) {
            exists = true;
            break;
          }
        }
        if (!exists) {
          choices.push({
            key: k,
            label: val[1] || val[0],
          });
        }
      }
    }
  }

  return (
    <div className="space-y-4 pt-2 font-sans">
      {/* Pool of Choices box */}
      {choices.length > 0 && (
        <div className="p-4 rounded-2xl bg-slate-50 border-2 border-slate-200 text-xs space-y-2">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
            List of Available Headings / Options:
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {choices.map((c) => (
              <div key={c.key} className="flex items-start gap-2 text-slate-700">
                <span className="font-mono text-[#2563EB] font-bold shrink-0">
                  [{c.key}]
                </span>
                <span className="font-medium">{c.label}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Target Items List */}
      <div className="space-y-3">
        {promptKeys.map((pKey) => {
          const userChoice = (userDict[pKey] || "").toLowerCase().trim();
          const targetPair = pairs[pKey] || [];
          const correctKey = (targetPair[0] || "").toLowerCase().trim();
          const correctLabel = targetPair[1] || targetPair[0] || "";

          const isMatchCorrect = Boolean(userChoice && userChoice === correctKey);
          const hasAnswered = Boolean(userChoice);

          if (!isReview) {
            // Exam Mode: Selector
            return (
              <div
                key={pKey}
                className="p-4 rounded-2xl border-2 border-slate-200 bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs"
              >
                <div className="flex items-center gap-2.5">
                  <span className="font-mono text-xs font-bold text-[#2563EB] bg-blue-50 border border-blue-200 px-3 py-1 rounded-xl">
                    Target [{pKey}]
                  </span>
                  <span className="text-xs font-bold text-slate-700">Choose match:</span>
                </div>

                <select
                  value={userChoice}
                  onChange={(e) => handleSelect(pKey, e.target.value)}
                  className="bg-white border-2 border-slate-300 rounded-xl px-3.5 py-2 text-xs font-medium text-slate-800 focus:outline-none focus:border-[#2563EB] min-w-48 shadow-2xs cursor-pointer"
                >
                  <option value="">-- Select option --</option>
                  {choices.map((c) => (
                    <option key={c.key} value={c.key}>
                      [{c.key}] {c.label}
                    </option>
                  ))}
                </select>
              </div>
            );
          }

          // Review Mode: Admin-style 2-column comparison
          let borderStyle = "border-slate-200 bg-white";
          let statusBadge = null;

          if (isMatchCorrect) {
            borderStyle = "border-emerald-500 bg-emerald-50/40";
            statusBadge = (
              <span className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-emerald-600 text-white shrink-0">
                Correct ✓
              </span>
            );
          } else if (hasAnswered) {
            borderStyle = "border-rose-400 bg-rose-50/40";
            statusBadge = (
              <span className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-rose-600 text-white shrink-0">
                Wrong ✕
              </span>
            );
          } else {
            statusBadge = (
              <span className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-slate-200 text-slate-600 shrink-0">
                Unanswered
              </span>
            );
          }

          return (
            <div
              key={pKey}
              className={`p-4 rounded-2xl border-2 space-y-3 transition-all ${borderStyle}`}
            >
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <span className="font-mono text-xs font-bold text-[#2563EB] bg-blue-50 border border-blue-200 px-3 py-1 rounded-xl">
                    Target [{pKey}]
                  </span>
                  <span className="text-xs font-bold text-slate-700">Matched to</span>
                </div>

                {statusBadge}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 border-t border-slate-100">
                <div className="p-3 rounded-xl bg-white border border-slate-200 text-xs">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                    Your Answer:
                  </span>
                  <span
                    className={`font-medium ${
                      isMatchCorrect
                        ? "text-emerald-700 font-bold"
                        : hasAnswered
                        ? "text-rose-700 font-bold line-through"
                        : "text-slate-400 italic"
                    }`}
                  >
                    {userChoice ? `[${userChoice}]` : "(No answer given)"}
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-emerald-50/60 border border-emerald-200 text-xs">
                  <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider block mb-1">
                    Correct Key:
                  </span>
                  <span className="font-bold text-emerald-950 font-mono">
                    [{correctKey}] {correctLabel && `— ${correctLabel}`}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
