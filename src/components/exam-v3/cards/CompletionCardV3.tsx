"use client";

import React from "react";
import { UserAnswerValue } from "../types";

interface CompletionCardV3Props {
  blankAcceptTexts?: Record<string, string[] | null> | null;
  blankAcceptRegex?: Record<string, string[] | null> | null;
  promptMd?: string | null;
  mode: "exam" | "review";
  value?: UserAnswerValue;
  onChange?: (val: UserAnswerValue) => void;
}

export function CompletionCardV3({
  blankAcceptTexts,
  blankAcceptRegex,
  promptMd,
  mode,
  value,
  onChange,
}: CompletionCardV3Props) {
  const isReview = mode === "review";
  const texts = blankAcceptTexts || {};
  let blankKeys = Object.keys(texts);

  if (blankKeys.length === 0) {
    if (promptMd) {
      const bracketMatches = Array.from(promptMd.matchAll(/\[(\d+)\]/g)).map((m) => m[1]);
      if (bracketMatches.length > 0) {
        blankKeys = Array.from(new Set(bracketMatches)).sort((a, b) => Number(a) - Number(b));
      } else {
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
    if (isReview || !onChange) return;
    const next = { ...userDict, [key]: text };
    onChange(next);
  };

  return (
    <div className="space-y-3.5 pt-2 font-sans">
      {blankKeys.map((key) => {
        const userVal = (userDict[key] || "").trim();
        const accepted = (texts[key] || []).filter((x): x is string => Boolean(x));

        if (!isReview) {
          // Exam Mode: interactive input
          return (
            <div
              key={key}
              className="p-3.5 rounded-2xl bg-slate-50/50 border-2 border-slate-200 flex items-center gap-3 shadow-2xs"
            >
              <span className="font-mono text-xs font-bold text-[#2563EB] bg-blue-50 border border-blue-200 px-3 py-1.5 rounded-xl shrink-0">
                Blank [{key}]
              </span>

              <input
                type="text"
                value={userDict[key] || ""}
                onChange={(e) => handleInputChange(key, e.target.value)}
                placeholder={`Type answer for blank [${key}]...`}
                className="w-full rounded-xl border-2 border-slate-300 bg-white px-4 py-2 text-xs sm:text-sm text-slate-800 focus:outline-none focus:border-[#2563EB] transition-all shadow-2xs"
              />
            </div>
          );
        }

        // Review Mode: Admin-style 2-column comparison
        let isBlankCorrect = false;
        const cleanUser = userVal.toLowerCase();
        if (cleanUser) {
          for (const acc of accepted) {
            if (acc.trim().toLowerCase() === cleanUser) {
              isBlankCorrect = true;
              break;
            }
          }
        }

        let containerClass = "border-slate-200 bg-white";
        let statusBadge = null;

        if (isBlankCorrect) {
          containerClass = "border-emerald-500 bg-emerald-50/30";
          statusBadge = (
            <span className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-emerald-600 text-white shrink-0">
              Correct ✓
            </span>
          );
        } else if (cleanUser) {
          containerClass = "border-rose-400 bg-rose-50/30";
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
        const displayNum = !isNaN(Number(key))
          ? Number(key) + (blankKeys[0] === "0" ? 1 : 0)
          : blankKeys.indexOf(key) + 1;

        return (
          <div
            key={key}
            className={`p-4 rounded-2xl border-2 space-y-3 transition-all ${containerClass}`}
          >
            <div className="flex items-center justify-between gap-3">
              <span className="font-mono text-xs font-bold text-[#2563EB] bg-blue-50 border border-blue-200 px-3 py-1 rounded-xl">
                Blank [{displayNum}]
              </span>
              {statusBadge}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 border-t border-slate-100">
              <div className="p-3 rounded-xl bg-white border border-slate-200 text-xs">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                  Your Answer:
                </span>
                <span
                  className={`font-medium ${
                    isBlankCorrect
                      ? "text-emerald-700 font-bold"
                      : cleanUser
                      ? "text-rose-700 font-bold line-through"
                      : "text-slate-400 italic"
                  }`}
                >
                  {userVal || "(Empty)"}
                </span>
              </div>

              <div className="p-3 rounded-xl bg-emerald-50/60 border border-emerald-200 text-xs">
                <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider block mb-1">
                  Accepted Key(s):
                </span>
                <span className="font-mono font-bold text-emerald-950">
                  {accepted.length > 0 ? accepted.join("  |  ") : "N/A"}
                </span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
