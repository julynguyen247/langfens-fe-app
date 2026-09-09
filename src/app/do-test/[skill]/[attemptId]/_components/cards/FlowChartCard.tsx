"use client";

import { useEffect, useState } from "react";
import { UserAnswerValue } from "../../_lib/types";

interface FlowChartCardProps {
  orderCorrects?: string[] | null;
  value?: UserAnswerValue;
  onChange: (val: UserAnswerValue) => void;
}

export function FlowChartCard({
  orderCorrects,
  value,
  onChange,
}: FlowChartCardProps) {
  const expected = orderCorrects || [];

  const currentOrder: string[] = Array.isArray(value)
    ? (value as string[])
    : expected;

  const [items, setItems] = useState<string[]>(currentOrder);

  useEffect(() => {
    if (Array.isArray(value) && value.length > 0) {
      setItems(value as string[]);
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
    onChange(copy);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between text-xs text-slate-600 font-medium">
        <span>Arrange steps in the correct chronological order:</span>
      </div>

      <div className="space-y-2.5">
        {items.map((key, idx) => {
          const humanLabel = key.replace(/-/g, " ");

          return (
            <div
              key={`${key}-${idx}`}
              className="p-3.5 rounded-2xl border-2 flex items-center gap-3.5 transition-all shadow-2xs bg-white border-slate-200 text-slate-800"
            >
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
          );
        })}
      </div>
    </div>
  );
}
