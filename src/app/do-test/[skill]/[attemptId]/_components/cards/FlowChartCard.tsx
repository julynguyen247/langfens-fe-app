"use client";

import { useEffect, useState } from "react";
import { UserAnswerValue } from "../../_lib/types";

interface FlowChartCardProps {
  orderCorrects?: string[] | null;
  blankAcceptTexts?: Record<string, string[] | null> | null;
  promptMd?: string | null;
  value?: UserAnswerValue;
  onChange: (val: UserAnswerValue) => void;
}

export function FlowChartCard({
  orderCorrects,
  blankAcceptTexts,
  value,
  onChange,
}: FlowChartCardProps) {
  const expected = orderCorrects || [];
  const blanks = blankAcceptTexts || {};
  const hasBlanks = Object.keys(blanks).length > 0;

  // value can be:
  //   - string[]            → step order + label at same index
  //   - { steps: string[]; labels: Record<string,string> }  → split payload
  const userOrder: string[] = Array.isArray(value)
    ? (value as string[])
    : value && typeof value === "object" && Array.isArray((value as any).steps)
    ? ((value as any).steps as string[])
    : expected;
  const userLabels: Record<string, string> =
    value && typeof value === "object" && !Array.isArray(value) && (value as any).labels
      ? ((value as any).labels as Record<string, string>)
      : {};

  const [items, setItems] = useState<string[]>(userOrder);

  useEffect(() => {
    if (Array.isArray(value)) {
      setItems(value as string[]);
    } else if (value && typeof value === "object" && Array.isArray((value as any).steps)) {
      setItems((value as any).steps);
    } else if (expected.length > 0) {
      setItems(expected);
    }
  }, [value, expected]);

  const handleMove = (index: number, direction: "up" | "down") => {
    const target = direction === "up" ? index - 1 : index + 1;
    if (target < 0 || target >= items.length) return;

    const copy = [...items];
    const temp = copy[index];
    copy[index] = copy[target];
    copy[target] = temp;
    setItems(copy);
    persist(copy, userLabels);
  };

  const handleLabelChange = (stepKey: string, text: string) => {
    const next = { ...userLabels, [stepKey]: text };
    persist(items, next);
  };

  const persist = (nextSteps: string[], nextLabels: Record<string, string>) => {
    if (hasBlanks) {
      onChange({ steps: nextSteps, labels: nextLabels } as any);
    } else {
      onChange(nextSteps);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between text-xs text-slate-600 font-medium">
        <span>Arrange steps in the correct chronological order{hasBlanks ? ", then fill each label" : ""}:</span>
      </div>

      <div className="space-y-2.5">
        {items.map((key, idx) => {
          const humanLabel = key.replace(/-/g, " ");
          const blankKey = String(idx + 1);
          const blankLabels = blanks[blankKey];
          const showInput = hasBlanks && blankLabels && blankLabels.length > 0;

          return (
            <div
              key={`${key}-${idx}`}
              className="p-3.5 rounded-2xl border-2 flex flex-col gap-2 transition-all shadow-2xs bg-white border-slate-200 text-slate-800"
            >
              <div className="flex items-center gap-3.5">
                <div className="w-7 h-7 rounded-full bg-blue-50 text-[#2563EB] border border-blue-200 flex items-center justify-center text-xs font-mono font-bold shrink-0">
                  {idx + 1}
                </div>

                <div className="flex-1 font-semibold text-xs sm:text-sm capitalize">
                  {humanLabel}
                </div>

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    disabled={idx === 0}
                    onClick={() => handleMove(idx, "up")}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-slate-800 hover:bg-slate-100 disabled:opacity-30 transition"
                    title="Move up"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
                    </svg>
                  </button>
                  <button
                    type="button"
                    disabled={idx === items.length - 1}
                    onClick={() => handleMove(idx, "down")}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-slate-800 hover:bg-slate-100 disabled:opacity-30 transition"
                    title="Move down"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                </div>
              </div>

              {showInput && (
                <div className="flex items-center gap-2 pl-10">
                  <span className="font-mono text-xs font-bold text-[#2563EB] bg-blue-50 border border-blue-200 px-2 py-1 rounded-lg shrink-0">
                    Blank [{blankKey}]
                  </span>
                  <input
                    type="text"
                    value={userLabels[blankKey] || ""}
                    onChange={(e) => handleLabelChange(blankKey, e.target.value)}
                    placeholder={`Type label for blank [${blankKey}]...`}
                    className="flex-1 rounded-lg border-2 px-3 py-1.5 text-xs bg-white border-slate-300 text-slate-900 focus:border-[#2563EB] focus:outline-none transition-all"
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
