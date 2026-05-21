"use client";

import React, { memo, useEffect, useMemo, useState, useCallback } from "react";

type FlowChartNode = {
  key: string;
  label: string;
};

type Props = {
  id: string;
  stem: string;
  nodes: FlowChartNode[];
  value: string;
  onChange: (v: string) => void;
};

const FlowChartCard = memo(function FlowChartCard({
  id,
  stem,
  nodes,
  value,
  onChange,
}: Props) {
  const steps = useMemo(() => (nodes ?? []).map((n) => n.label), [nodes]);

  const [order, setOrder] = useState<(number | "")[]>(steps.map(() => ""));

  const updateOrder = useCallback((idx: number, val: string) => {
    const num = Number(val);

    setOrder((prev) => {
      let next = [...prev];
      if (!num) {
        next[idx] = "";
      } else {
        next[idx] = num;
      }
      return next;
    });
  }, []);

  useEffect(() => {
    const allFilled = order.every((x) => x !== "");
    if (!allFilled) {
      onChange("");
      return;
    }
    const arranged = [];
    for (let num = 1; num <= steps.length; num++) {
      const index = order.indexOf(num);
      arranged.push(steps[index]);
    }
    onChange(JSON.stringify(arranged));
  }, [order, steps, onChange]);

  return (
    <div className="p-4 border border-[var(--border)] rounded-lg bg-[var(--card)] space-y-4 text-[var(--foreground)]">
      <div className="font-bold text-[var(--foreground)]">{stem}</div>
      <div className="space-y-3">
        {steps.map((label, idx) => (
          <div key={nodes[idx]?.key ?? idx} className="flex items-center gap-4">
            <div className="flex-1 text-sm">{label}</div>
            <input
              type="number"
              min={1}
              max={steps.length}
              className="w-16 px-2 py-1 border border-[var(--border)] rounded-md text-center
                focus:ring-2 focus:ring-[var(--primary)]"
              value={order[idx] === "" ? "" : order[idx]}
              onChange={(e) => updateOrder(idx, e.target.value)}
            />
          </div>
        ))}
      </div>
    </div>
  );
});

export default FlowChartCard;
