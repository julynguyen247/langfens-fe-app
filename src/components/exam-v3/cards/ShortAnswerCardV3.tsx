"use client";

import React from "react";
import { UserAnswerValue } from "../types";

interface ShortAnswerCardV3Props {
  shortAnswerAcceptTexts?: string[] | null;
  mode: "exam" | "review";
  value?: UserAnswerValue;
  onChange?: (val: UserAnswerValue) => void;
}

export function ShortAnswerCardV3({
  shortAnswerAcceptTexts,
  mode,
  value,
  onChange,
}: ShortAnswerCardV3Props) {
  const isReview = mode === "review";
  const userVal = typeof value === "string" ? value.trim() : "";
  const accepted = (shortAnswerAcceptTexts || []).filter((x): x is string => Boolean(x));

  if (!isReview) {
    return (
      <div className="pt-2 font-sans">
        <input
          type="text"
          value={typeof value === "string" ? value : ""}
          onChange={(e) => onChange?.(e.target.value)}
          placeholder="Type your short answer here..."
          className="w-full rounded-2xl border-2 border-slate-300 bg-white px-5 py-3 text-sm text-slate-800 focus:outline-none focus:border-[#2563EB] transition-all shadow-2xs"
        />
      </div>
    );
  }

  // Review Mode: Admin-style comparison
  let isShortCorrect = false;
  const cleanUser = userVal.toLowerCase();
  if (cleanUser) {
    for (const acc of accepted) {
      if (acc.trim().toLowerCase() === cleanUser) {
        isShortCorrect = true;
        break;
      }
    }
  }

  let containerClass = "border-slate-200 bg-white";
  let statusBadge = null;

  if (isShortCorrect) {
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

  return (
    <div className={`p-4 rounded-2xl border-2 space-y-3 transition-all ${containerClass} pt-2 font-sans`}>
      <div className="flex items-center justify-between gap-3">
        <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
          Short Answer Response
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
              isShortCorrect
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
}
