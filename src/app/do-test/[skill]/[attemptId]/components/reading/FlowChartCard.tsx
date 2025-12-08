"use client";

import { useEffect, useMemo, useState } from "react";

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

export default function FlowChartCard({
  id,
  stem,
  nodes,
  value,
  onChange,
}: Props) {
  const steps = useMemo(() => (nodes ?? []).map((n) => n.label), [nodes]);

  const [order, setOrder] = useState<(number | "")[]>(steps.map(() => ""));

  const updateOrder = (idx: number, val: string) => {
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
  };

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
  }, [order, steps]);

  return (
    <div className="p-4 border border-slate-200 rounded-lg bg-white space-y-4 text-black">
      <div className="font-bold text-gray-800">{stem}</div>
      <div className="space-y-3">
        {steps.map((label, idx) => (
          <div key={nodes[idx]?.key ?? idx} className="flex items-center gap-4">
            <div className="flex-1 text-sm">{label}</div>
            <input
              type="number"
              min={1}
              max={steps.length}
              className="w-16 px-2 py-1 border border-slate-300 rounded-md text-center 
                focus:ring-2 focus:ring-blue-500"
              value={order[idx] === "" ? "" : order[idx]}
              onChange={(e) => updateOrder(idx, e.target.value)}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
