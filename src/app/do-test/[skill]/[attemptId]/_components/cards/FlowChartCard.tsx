"use client";

import { useEffect, useMemo, useState } from "react";
import { UserAnswerValue } from "../../_lib/types";
import { parseBracketedBlanks } from "../../../../_lib/parseBlankTokens";

interface FlowChartCardProps {
  orderCorrects?: string[] | null;
  blankAcceptTexts?: Record<string, string[] | null> | null;
  flowChartNodes?: Array<{ key: string; label: string }> | null;
  promptMd?: string | null;
  value?: UserAnswerValue;
  onChange: (val: UserAnswerValue) => void;
}

type StructuredFlowChartAnswer = {
  steps: string[];
  labels: Record<string, string>;
};
function isStructuredAnswer(val: unknown): val is StructuredFlowChartAnswer {
  return (
    typeof val === "object" &&
    val !== null &&
    "steps" in val &&
    Array.isArray(val.steps)
  );
}

function isStringArray(val: unknown): val is string[] {
  return Array.isArray(val) && val.every((s) => typeof s === "string");
}

export function FlowChartCard({
  orderCorrects,
  blankAcceptTexts,
  flowChartNodes,
  promptMd,
  value,
  onChange,
}: FlowChartCardProps) {
  // Derive blank keys either from blankAcceptTexts (admin / review)
  // or from bracketed placeholders in promptMd (live test snapshot where answers are stripped)
  const blankKeys = useMemo(() => {
    if (blankAcceptTexts && Object.keys(blankAcceptTexts).length > 0) {
      return Object.keys(blankAcceptTexts).sort((a, b) => {
        const na = Number(a);
        const nb = Number(b);
        if (!Number.isNaN(na) && !Number.isNaN(nb)) return na - nb;
        return String(a).localeCompare(String(b));
      });
    }
    return parseBracketedBlanks(promptMd);
  }, [blankAcceptTexts, promptMd]);

  const hasBlanks = blankKeys.length > 0;

  // Build a slug→human-label map from "A. Step label" lines in promptMd.
  // This is the primary label source when flowChartNodes is absent (live delivery
  // only ships orderCorrects; the prose labels come from promptMd).
  const promptLabelMap = useMemo((): Map<string, string> => {
    const map = new Map<string, string>();
    if (!promptMd) return map;
    const text = promptMd.replace(/\\n/g, "\n");
    const re = /^[A-Z][.)]\s*(.+)$/gm;
    let m: RegExpExecArray | null;
    while ((m = re.exec(text)) !== null) {
      const label = m[1].trim();
      // Build the slug the same way the backend does: lowercase, spaces→dashes.
      const slug = label.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
      map.set(slug, label);
    }
    return map;
  }, [promptMd]);

  // Expected steps order:
  // 1. flowChartNodes (shuffled user-facing step nodes provided during live delivery)
  // 2. orderCorrects (answer key — shuffle it so the user must reorder)
  // 3. Prompt fallback: extract lines matching "A. ...", "B. ..." if neither provided
  const expected = useMemo(() => {
    if (flowChartNodes && flowChartNodes.length > 0) {
      return flowChartNodes.map((n) => n.key);
    }
    if (orderCorrects && orderCorrects.length > 0) {
      const keys = orderCorrects.filter((k): k is string => Boolean(k));
      // Shuffle so the user must arrange them (Fisher-Yates, seeded by key length
      // to stay stable across re-renders without persisting a random seed).
      const shuffled = [...keys];
      for (let i = shuffled.length - 1; i > 0; i--) {
        const j = (i * 31 + shuffled[i].length * 17) % (i + 1);
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
      }
      return shuffled;
    }
    if (promptMd) {
      const text = promptMd.replace(/\\n/g, "\n");
      const stepMatches = text.match(/^[A-Z][.)]\s*(.+)$/gm);
      if (stepMatches && stepMatches.length > 0) {
        return stepMatches.map((s) => s.replace(/^[A-Z][.)]\s*/, "").trim());
      }
    }
    return [];
  }, [flowChartNodes, orderCorrects, promptMd]);

  // value can be:
  //   - string[]            → step order
  //   - { steps: string[]; labels: Record<string,string> }  → split payload
  const userOrder: string[] = isStringArray(value)
    ? value
    : isStructuredAnswer(value)
    ? value.steps
    : expected;
  const initialLabels: Record<string, string> = useMemo(() => {
    return isStructuredAnswer(value) && value.labels ? value.labels : {};
  }, [value]);

  const [items, setItems] = useState<string[]>(userOrder);
  const [labels, setLabels] = useState<Record<string, string>>(initialLabels);

  useEffect(() => {
    if (isStringArray(value) && value.length > 0) {
      setItems(value);
    } else if (isStructuredAnswer(value) && value.steps.length > 0) {
      setItems(value.steps);
    } else if (expected.length > 0) {
      setItems(expected);
    }
  }, [value, expected]);

  useEffect(() => {
    if (isStructuredAnswer(value) && value.labels) {
      setLabels(value.labels);
    }
  }, [value]);

  const handleMove = (index: number, direction: "up" | "down") => {
    const target = direction === "up" ? index - 1 : index + 1;
    if (target < 0 || target >= items.length) return;

    const copy = [...items];
    const temp = copy[index];
    copy[index] = copy[target];
    copy[target] = temp;
    setItems(copy);
    persist(copy, labels);
  };

  const handleLabelChange = (stepKey: string, text: string) => {
    const next = { ...labels, [stepKey]: text };
    setLabels(next);
    persist(items, next);
  };
  const persist = (nextSteps: string[], nextLabels: Record<string, string>) => {
    if (hasBlanks) {
      const payload: StructuredFlowChartAnswer = {
        steps: nextSteps,
        labels: nextLabels,
      };
      onChange(payload as unknown as UserAnswerValue);
    } else {
      onChange(nextSteps);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between text-xs text-slate-600 font-medium">
        <span>
          Arrange steps in the correct chronological order
          {hasBlanks ? ", then fill each blank" : ""}:
        </span>
      </div>

      {/* Step Reordering List */}
      <div className="space-y-2.5">
        {items.map((key, idx) => {
          const node = (flowChartNodes || []).find((n) => n.key === key);
          // Resolution order: flowChartNode label → promptMd "A. Label" map → de-slug
          const humanLabel =
            node?.label ||
            promptLabelMap.get(key) ||
            key.replace(/-/g, " ");

          return (
            <div
              key={`${key}-${idx}`}
              className="p-3.5 rounded-2xl border-2 flex items-center justify-between gap-3.5 transition-all shadow-2xs bg-white border-slate-200 text-slate-800"
            >
              <div className="flex items-center gap-3.5 min-w-0">
                <div className="w-7 h-7 rounded-full bg-blue-50 text-[#2563EB] border border-blue-200 flex items-center justify-center text-xs font-mono font-bold shrink-0">
                  {idx + 1}
                </div>

                <div className="font-semibold text-xs sm:text-sm leading-snug break-words min-w-0">
                  {humanLabel}
                </div>
              </div>

              <div className="flex items-center gap-1 shrink-0">
                <button
                  type="button"
                  disabled={idx === 0}
                  onClick={() => handleMove(idx, "up")}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-800 hover:bg-slate-100 disabled:opacity-30 transition cursor-pointer disabled:cursor-not-allowed"
                  title="Move up"
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2.5}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M5 15l7-7 7 7"
                    />
                  </svg>
                </button>
                <button
                  type="button"
                  disabled={idx === items.length - 1}
                  onClick={() => handleMove(idx, "down")}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-800 hover:bg-slate-100 disabled:opacity-30 transition cursor-pointer disabled:cursor-not-allowed"
                  title="Move down"
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2.5}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Blank Inputs Section */}
      {hasBlanks && (
        <div className="pt-2 space-y-2.5 border-t border-slate-100">
          <div className="text-xs text-slate-600 font-medium">
            Fill in each blank with ONE OR TWO WORDS from the passage:
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {blankKeys.map((blankKey) => (
              <div
                key={blankKey}
                className="flex items-center gap-2 p-2.5 rounded-xl border-2 border-slate-200 bg-white shadow-2xs"
              >
                <span className="font-mono text-xs font-bold text-[#2563EB] bg-blue-50 border border-blue-200 px-2.5 py-1 rounded-lg shrink-0">
                  Blank [{blankKey}]
                </span>
                <input
                  type="text"
                  value={labels[blankKey] || ""}
                  onChange={(e) => handleLabelChange(blankKey, e.target.value)}
                  placeholder={`Type answer for [${blankKey}]...`}
                  className="flex-1 rounded-lg border px-3 py-1.5 text-xs bg-white border-slate-300 text-slate-900 focus:border-[#2563EB] focus:outline-none transition-all"
                />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
