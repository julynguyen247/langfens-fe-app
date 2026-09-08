"use client";

import React from "react";
import { UserAnswerValue } from "../types";

interface FlowChartCardV3Props {
  orderCorrects?: string[] | null;
  mode: "exam" | "review";
  value?: UserAnswerValue;
  onChange?: (val: UserAnswerValue) => void;
}

export function FlowChartCardV3({
  orderCorrects,
  mode,
  value,
  onChange,
}: FlowChartCardV3Props) {
  const isReview = mode === "review";
  const corrects = (orderCorrects || []).filter((x): x is string => Boolean(x));
  const userOrder: string[] = Array.isArray(value)
    ? (value as string[])
    : typeof value === "string" && value
    ? [value]
    : [];

  const handleStepChange = (idx: number, text: string) => {
    if (isReview || !onChange) return;
    const next = [...userOrder];
    next[idx] = text;
    onChange(next);
  };

  return (
    <div className="space-y-4 pt-2 font-sans">
      <div className="p-4 rounded-2xl bg-slate-50 border-2 border-slate-200 text-xs space-y-3">
        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
          Flow Chart Process Sequence:
        </span>

        <div className="space-y-2">
          {corrects.map((step, idx) => {
            const userStep = userOrder[idx] || "";

            if (!isReview) {
              return (
                <div
                  key={step + idx}
                  className="p-3 rounded-xl border-2 border-slate-200 bg-white flex items-center gap-3"
                >
                  <span className="w-6 h-6 rounded-lg bg-blue-50 text-[#2563EB] border border-blue-200 flex items-center justify-center font-mono font-bold text-xs shrink-0">
                    {idx + 1}
                  </span>
                  <input
                    type="text"
                    value={userStep}
                    onChange={(e) => handleStepChange(idx, e.target.value)}
                    placeholder={`Step ${idx + 1} description / keyword...`}
                    className="w-full bg-transparent border-0 text-xs font-medium text-slate-800 focus:outline-none"
                  />
                </div>
              );
            }

            // Review Mode
            const isMatch = userStep.toLowerCase().trim() === step.toLowerCase().trim();

            return (
              <div
                key={step + idx}
                className={`p-3 rounded-xl border-2 flex items-center justify-between gap-3 ${
                  isMatch
                    ? "bg-emerald-50/70 border-emerald-400"
                    : userStep
                    ? "bg-rose-50/70 border-rose-400"
                    : "bg-white border-slate-200"
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="w-6 h-6 rounded-lg bg-blue-50 text-[#2563EB] border border-blue-200 flex items-center justify-center font-mono font-bold text-xs">
                    {idx + 1}
                  </span>
                  <div className="text-xs font-medium text-slate-800">
                    <div>
                      <span className="font-bold text-slate-500 mr-2">Expected:</span>
                      <span className="font-semibold text-slate-900">{step}</span>
                    </div>
                    {userStep && !isMatch && (
                      <div className="mt-1 text-rose-700">
                        <span className="font-bold mr-2">Your answer:</span>
                        <span className="line-through">{userStep}</span>
                      </div>
                    )}
                  </div>
                </div>

                {isMatch ? (
                  <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-emerald-600 text-white">
                    Correct ✓
                  </span>
                ) : userStep ? (
                  <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-rose-600 text-white">
                    Wrong ✕
                  </span>
                ) : (
                  <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-slate-200 text-slate-600">
                    Empty
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
