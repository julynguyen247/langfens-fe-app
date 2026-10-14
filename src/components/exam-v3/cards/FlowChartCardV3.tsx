"use client";

import React, { useId } from "react";
import { UserAnswerValue } from "../types";

interface FlowChartCardV3Props {
  orderCorrects?: string[] | null;
  flowChartNodes?: Array<{ key: string; label: string }> | null;
  mode: "exam" | "review";
  value?: UserAnswerValue;
  onChange?: (val: UserAnswerValue) => void;
}

function isStructuredSteps(val: unknown): val is { steps: string[] } {
  return (
    typeof val === "object" &&
    val !== null &&
    "steps" in val &&
    Array.isArray(val.steps)
  );
}

export function FlowChartCardV3({
  orderCorrects,
  flowChartNodes,
  mode,
  value,
  onChange,
}: FlowChartCardV3Props) {
  const isReview = mode === "review";
  const inputIdPrefix = useId();
  const corrects = (
    orderCorrects && orderCorrects.length > 0
      ? orderCorrects
      : flowChartNodes?.map((n) => n.key) || []
  ).filter((x): x is string => Boolean(x));

  const userOrder: string[] = Array.isArray(value)
    ? (value as string[])
    : isStructuredSteps(value)
      ? value.steps
      : typeof value === "string" && value
        ? [value]
        : [];
  const norm = (s: string) =>
    s.toLowerCase().replace(/[-_]/g, " ").replace(/\s+/g, " ").trim();

  const getLabel = (k: string) => {
    const n = (flowChartNodes || []).find((node) => node.key === k);
    if (n?.label) return n.label;
    return k.replace(/-/g, " ");
  };

  const handleStepChange = (idx: number, text: string) => {
    if (isReview || !onChange) return;
    const next = [...userOrder];
    next[idx] = text;
    onChange(next);
  };

  return (
    <div className="space-y-4 pt-2 font-sans">
      <section className="rounded-3xl border border-slate-200 bg-slate-50/80 p-4 sm:p-5">
        <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-200 pb-4">
          <div>
            <h3 className="text-sm font-semibold text-slate-900 sm:text-base">
              Process sequence
            </h3>
            <p className="mt-1 text-xs leading-5 text-slate-500">
              {isReview
                ? "Review each step and compare it with your answer."
                : "Add the key information for each step."}
            </p>
          </div>
          <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-600">
            {corrects.length} {corrects.length === 1 ? "step" : "steps"}
          </span>
        </div>

        {corrects.length > 0 ? (
          <ol className="mt-5 space-y-3" aria-label="Flowchart steps">
            {corrects.map((step, idx) => {
              const userStep = userOrder[idx] || "";

              if (!isReview) {
                return (
                  <li
                    key={`${step}-${idx}`}
                    className="grid grid-cols-[2.25rem_minmax(0,1fr)] gap-3 sm:grid-cols-[2.5rem_minmax(0,1fr)] sm:gap-4"
                  >
                    <div className="relative flex justify-center">
                      {idx < corrects.length - 1 && (
                        <span
                          aria-hidden="true"
                          className="absolute top-9 bottom-[-0.75rem] w-px bg-blue-200"
                        />
                      )}
                      <span className="relative z-10 flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-blue-200 bg-blue-50 font-mono text-xs font-bold text-blue-700">
                        {String(idx + 1).padStart(2, "0")}
                      </span>
                    </div>

                    <div className="min-w-0 rounded-2xl border border-slate-200 bg-white p-3.5 shadow-sm sm:p-4">
                      <label
                        htmlFor={`flowchart-step-${inputIdPrefix}-${idx + 1}`}
                        className="mb-2 block text-[11px] font-medium text-slate-500"
                      >
                        Step {idx + 1}
                      </label>
                      <input
                        id={`flowchart-step-${inputIdPrefix}-${idx + 1}`}
                        type="text"
                        value={userStep}
                        onChange={(e) => handleStepChange(idx, e.target.value)}
                        placeholder={`Enter step ${idx + 1}...`}
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-800 outline-none transition-colors placeholder:text-slate-400 focus:border-blue-300 focus:bg-white focus:ring-2 focus:ring-blue-100"
                      />
                    </div>
                  </li>
                );
              }

              const isMatch = norm(userStep) === norm(step);
              const itemStyle = isMatch
                ? "border-emerald-200 bg-emerald-50/60"
                : userStep
                  ? "border-rose-200 bg-rose-50/60"
                  : "border-slate-200 bg-white";
              const statusStyle = isMatch
                ? "bg-emerald-100 text-emerald-800"
                : userStep
                  ? "bg-rose-100 text-rose-800"
                  : "bg-slate-100 text-slate-600";

              return (
                <li
                  key={`${step}-${idx}`}
                  className="grid grid-cols-[2.25rem_minmax(0,1fr)] gap-3 sm:grid-cols-[2.5rem_minmax(0,1fr)] sm:gap-4"
                >
                  <div className="relative flex justify-center">
                    {idx < corrects.length - 1 && (
                      <span
                        aria-hidden="true"
                        className="absolute top-9 bottom-[-0.75rem] w-px bg-blue-200"
                      />
                    )}
                    <span className="relative z-10 flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-blue-200 bg-blue-50 font-mono text-xs font-bold text-blue-700">
                      {String(idx + 1).padStart(2, "0")}
                    </span>
                  </div>

                  <div
                    className={`flex min-w-0 flex-col gap-3 rounded-2xl border p-3.5 shadow-sm sm:flex-row sm:items-center sm:justify-between sm:gap-4 sm:p-4 ${itemStyle}`}
                  >
                    <div className="min-w-0 text-sm">
                      <span className="mb-1 block text-[11px] font-medium text-slate-500">
                        Expected step
                      </span>
                      <span className="break-words font-semibold leading-6 text-slate-900">
                        {getLabel(step)}
                      </span>
                      {userStep && !isMatch && (
                        <span className="mt-2 block break-words text-rose-700">
                          Your answer:{" "}
                          <span className="line-through">{getLabel(userStep)}</span>
                        </span>
                      )}
                    </div>

                    <span
                      className={`w-fit shrink-0 rounded-full px-3 py-1 text-xs font-semibold ${statusStyle}`}
                    >
                      {isMatch ? "Correct" : userStep ? "Incorrect" : "Unanswered"}
                    </span>
                  </div>
                </li>
              );
            })}
          </ol>
        ) : (
          <p className="mt-5 rounded-2xl border border-dashed border-slate-300 bg-white px-4 py-6 text-center text-sm text-slate-500">
            Flowchart steps are not available for this question.
          </p>
        )}
      </section>
    </div>
  );
}
