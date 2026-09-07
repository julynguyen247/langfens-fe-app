"use client";

import React, { memo, useEffect, useMemo, useRef, useState, useCallback } from "react";

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

  // QuestionPanel passes a fresh `onChange` arrow on every render. If we
  // depended on `onChange` directly the effect below would re-fire on every
  // parent render, call onChange, which calls setAnswers upstream, which
  // re-renders the parent, which gives us a new onChange — infinite loop.
  // Stash the latest onChange in a ref so we can notify the parent without
  // depending on its identity.
  const onChangeRef = useRef(onChange);
  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  const updateOrder = useCallback((idx: number, val: string) => {
    const num = Number(val);

    setOrder((prev) => {
      const next = [...prev];
      if (!num) {
        next[idx] = "";
      } else {
        next[idx] = num;
      }
      return next;
    });
  }, []);

  // Emit only when the serialized value actually changes, and never spam
  // the parent with `onChange("")` on every render while the user is
  // mid-edit. The previous version called onChange("") unconditionally on
  // every render where any slot was empty — that's what produced the
  // "Maximum update depth" error once combined with the parent's
  // onChange churn.
  const lastEmittedRef = useRef<string>("");
  useEffect(() => {
    const allFilled = order.every((x) => x !== "");
    if (!allFilled) {
      if (lastEmittedRef.current !== "") {
        lastEmittedRef.current = "";
        onChangeRef.current("");
      }
      return;
    }
    const arranged: string[] = [];
    for (let num = 1; num <= steps.length; num++) {
      const index = order.indexOf(num);
      arranged.push(steps[index]);
    }
    const next = JSON.stringify(arranged);
    if (next !== lastEmittedRef.current) {
      lastEmittedRef.current = next;
      onChangeRef.current(next);
    }
  }, [order, steps]);

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
