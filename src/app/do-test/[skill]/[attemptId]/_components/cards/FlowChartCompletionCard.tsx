"use client";

import { UserAnswerValue } from "../../_lib/types";

interface FlowChartCompletionCardProps {
  promptMd?: string | null;
  blankAcceptTexts?: Record<string, string[] | null> | null;
  blankAcceptRegex?: Record<string, string[] | null> | null;
  value?: UserAnswerValue;
  isReview: boolean;
  onChange: (val: UserAnswerValue) => void;
}

interface FlowStep {
  stepNumber: number;
  key: string;
  prefix: string;
  suffix: string;
}

export function FlowChartCompletionCard({
  promptMd,
  blankAcceptTexts,
  value,
  isReview,
  onChange,
}: FlowChartCompletionCardProps) {
  const texts = blankAcceptTexts || {};
  const blankKeys = Object.keys(texts).sort((a, b) => {
    const na = Number(a);
    const nb = Number(b);
    if (!isNaN(na) && !isNaN(nb)) return na - nb;
    return a.localeCompare(b);
  });

  const userDict: Record<string, string> =
    value && typeof value === "object" && !Array.isArray(value)
      ? (value as Record<string, string>)
      : typeof value === "string"
      ? { "0": value }
      : {};

  // Parse prompt into flowchart steps
  const steps: FlowStep[] = [];
  const lines = (promptMd || "").split("\n").map((l) => l.trim()).filter(Boolean);

  let stepIdx = 0;
  for (const line of lines) {
    const match = line.match(/^(\d+)\.\s*(.*)$/);
    if (match) {
      const stepNum = Number(match[1]);
      const content = match[2];

      const parts = content.split(/_{2,}|\[\d+\]/);
      const prefix = parts[0] ? parts[0].trim() : "";
      const suffix = parts[1] ? parts[1].trim() : "";
      const key = blankKeys[stepIdx] ?? String(stepIdx);

      steps.push({
        stepNumber: stepNum,
        key,
        prefix,
        suffix,
      });
      stepIdx++;
    }
  }

  // Fallback if prompt doesn't have numbered lines
  if (steps.length === 0 && blankKeys.length > 0) {
    blankKeys.forEach((k, i) => {
      steps.push({
        stepNumber: i + 1,
        key: k,
        prefix: `Stage ${i + 1}`,
        suffix: "",
      });
    });
  }

  const handleInputChange = (key: string, text: string) => {
    if (isReview) return;
    const next = { ...userDict, [key]: text };
    onChange(next);
  };

  return (
    <div className="space-y-4 py-2">
      <div className="space-y-3 max-w-xl mx-auto">
        {steps.map((step, idx) => {
          const userVal = userDict[step.key] || "";
          const accepted = texts[step.key] || [];

          let isCorrect = false;
          const cleanUser = userVal.trim().toLowerCase();
          if (isReview && cleanUser) {
            if (accepted.some((acc) => acc && acc.trim().toLowerCase() === cleanUser)) {
              isCorrect = true;
            }
          }

          let inputClass = "bg-white border-2 border-slate-300 focus:border-[#2563EB] text-slate-900";
          if (isReview) {
            inputClass = isCorrect
              ? "bg-emerald-50 border-2 border-emerald-500 text-emerald-950 font-bold"
              : "bg-rose-50 border-2 border-rose-500 text-rose-950 font-semibold";
          }

          return (
            <div key={step.key} className="space-y-2">
              {/* Flowchart Box */}
              <div
                className={`p-5 rounded-2xl border-2 transition-all shadow-2xs ${
                  isReview
                    ? isCorrect
                      ? "bg-white border-emerald-400 ring-2 ring-emerald-50"
                      : "bg-white border-rose-400 ring-2 ring-rose-50"
                    : "bg-white border-slate-200 hover:border-slate-300"
                }`}
              >
                {/* Step Header */}
                <div className="flex items-center gap-2 mb-2 pb-2 border-b border-slate-100">
                  <span className="w-6 h-6 rounded-full bg-blue-50 text-[#2563EB] border border-blue-200 flex items-center justify-center font-bold text-xs font-mono">
                    {step.stepNumber}
                  </span>
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    Stage {step.stepNumber}
                  </span>
                  {isReview && (
                    <span className="ml-auto text-xs">
                      {isCorrect ? (
                        <span className="text-emerald-600 font-bold flex items-center gap-1">
                          <span>✓</span> Correct
                        </span>
                      ) : (
                        <span className="text-rose-600 font-bold flex items-center gap-1">
                          <span>✕</span> Incorrect
                        </span>
                      )}
                    </span>
                  )}
                </div>

                {/* Content with input */}
                <div className="flex flex-wrap items-center gap-2 text-xs sm:text-sm text-slate-800 leading-relaxed font-sans">
                  {step.prefix && <span>{step.prefix}</span>}

                  <input
                    type="text"
                    disabled={isReview}
                    value={isReview && !cleanUser ? "(Unanswered)" : userVal}
                    onChange={(e) => handleInputChange(step.key, e.target.value)}
                    placeholder="[ type answer ]"
                    className={`rounded-xl px-3.5 py-1.5 text-xs sm:text-sm font-medium focus:outline-none min-w-44 transition-all ${inputClass}`}
                  />

                  {step.suffix && <span>{step.suffix}</span>}
                </div>

                {/* Review Mode Inline Correct Answer */}
                {isReview && !isCorrect && (
                  <div className="mt-3 pt-2.5 border-t border-rose-100 text-xs flex items-center gap-2">
                    <span className="text-emerald-700 font-bold">✓ Correct answer:</span>
                    <span className="font-mono text-emerald-900 font-bold bg-emerald-100/60 px-2.5 py-0.5 rounded border border-emerald-300">
                      {accepted.join(" | ") || "N/A"}
                    </span>
                  </div>
                )}
              </div>

              {/* Downward connecting arrow to next step */}
              {idx < steps.length - 1 && (
                <div className="flex justify-center py-0.5">
                  <div className="w-8 h-8 rounded-full bg-blue-50 text-[#2563EB] border-2 border-blue-200 flex items-center justify-center shadow-2xs">
                    <svg className="w-4 h-4 stroke-[3]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                    </svg>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
