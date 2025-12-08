"use client";

import { useEffect, useMemo, useState } from "react";

type Props = {
  id: string;
  stem: string;
  value: string;
  onChange: (v: string) => void;
};

function extractSteps(stem: string): string[] {
  const lower = stem.toLowerCase();
  let part = stem;
  const idx = lower.lastIndexOf("read:");
  if (idx !== -1) {
    part = stem.slice(idx + "read:".length);
  } else {
    const colonIdx = stem.lastIndexOf(":");
    if (colonIdx !== -1) {
      part = stem.slice(colonIdx + 1);
    }
  }

  return part
    .replace(/\.$/, "")
    .split("->")
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

export default function FlowChartCard({ id, stem, value, onChange }: Props) {
  const steps = useMemo(() => extractSteps(stem), [stem]);

  const makeInitialOrder = (): (number | "")[] => {
    try {
      const arr = value ? JSON.parse(value) : [];
      if (Array.isArray(arr) && arr.length) {
        return arr.map((v) => {
          const idx = steps.indexOf(v);
          return idx === -1 ? "" : idx + 1;
        });
      }
    } catch {}
    return steps.map(() => ""); // tất cả ô TRỐNG
  };

  const [order, setOrder] = useState<(number | "")[]>(makeInitialOrder);

  useEffect(() => {
    try {
      const arr = value ? JSON.parse(value) : [];
      if (!Array.isArray(arr) || !arr.length) return;

      const next = arr.map((v) => {
        const idx = steps.indexOf(v);
        return idx === -1 ? "" : idx + 1;
      });

      const same =
        next.length === order.length && next.every((v, i) => v === order[i]);

      if (!same) setOrder(next);
    } catch {}
  }, [value, steps]);

  useEffect(() => {
    const arranged = order
      .map((num) => steps[(num as number) - 1])
      .filter(Boolean);

    onChange(JSON.stringify(arranged));
  }, [order, steps]);

  const updateOrder = (idx: number, val: string) => {
    const num = Number(val);
    if (!val) {
      setOrder((prev) => {
        const next = [...prev];
        next[idx] = "";
        return next;
      });
      return;
    }

    if (!Number.isFinite(num) || num < 1 || num > steps.length) return;

    setOrder((prev) => {
      const next = [...prev];
      next[idx] = num;
      return next;
    });
  };

  return (
    <div className="p-4 border border-slate-200 rounded-lg bg-white space-y-3 text-black">
      <div className="font-bold text-gray-800">{stem}</div>

      <div className="space-y-3">
        {steps.map((label, idx) => (
          <div key={idx} className="flex items-center gap-3">
            <div className="flex-1 text-sm">{label}</div>

            <input
              type="number"
              min={1}
              max={steps.length}
              className="w-16 px-2 py-1 border border-slate-200 rounded-md 
                         focus:outline-none focus:ring-2 focus:ring-blue-400 text-center"
              value={order[idx] ?? ""}
              onChange={(e) => updateOrder(idx, e.target.value)}
              placeholder=""
            />
          </div>
        ))}
      </div>
    </div>
  );
}
