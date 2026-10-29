"use client";

import { useEffect, useId, useMemo, useState } from "react";
import { UserAnswerValue } from "../../types";
import { parseBracketedBlanks } from "../../blankTokens";

interface FlowChartCardProps {
  orderCorrects?: string[] | null;
  blankAcceptTexts?: Record<string, string[] | null> | null;
  flowChartNodes?: Array<{ key: string; label: string }> | null;
  promptMd?: string | null;
  value?: UserAnswerValue;
  onChange: (val: UserAnswerValue) => void;
  readOnly?: boolean;
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
  readOnly = false,
}: FlowChartCardProps) {
  const inputIdPrefix = useId();
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
        return stepMatches.map((s) => {
          const label = s.replace(/^[A-Z][.)]\s*/, "").trim();
          return label.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
        });
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
    : readOnly ? [] : expected;
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
    } else {
      setItems(readOnly ? [] : expected);
    }
  }, [value, expected, readOnly]);

  useEffect(() => {
    if (isStructuredAnswer(value) && value.labels) {
      setLabels(value.labels);
    }
  }, [value]);

  const handleMove = (index: number, direction: "up" | "down") => {
    if (readOnly) return;
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
    if (readOnly) return;
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
      onChange(payload);
    } else {
      onChange(nextSteps);
    }
  };

  return (
    <div className="space-y-5">
      <section className="rounded-3xl border border-slate-200 bg-slate-50/80 p-4 sm:p-5">
        <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-200 pb-4">
          <div>
            <h3 className="text-sm font-semibold text-slate-900 sm:text-base">
              Process sequence
            </h3>
            <p className="mt-1 text-xs leading-5 text-slate-500">
              Move each step into its correct position
              {hasBlanks ? " and complete the missing details" : ""}.
            </p>
          </div>
          <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-600">
            {items.length} {items.length === 1 ? "step" : "steps"}
          </span>
        </div>

        {items.length > 0 ? (
          <ol className="mt-5 space-y-3" aria-label="Flowchart steps">
            {items.map((key, idx) => {
              const node = (flowChartNodes || []).find((n) => n.key === key);
              // Resolution order: flowChartNode label → promptMd "A. Label" map → de-slug
              const humanLabel =
                node?.label ||
                promptLabelMap.get(key) ||
                key.replace(/-/g, " ");

              return (
                <li
                  key={`${key}-${idx}`}
                  className="grid grid-cols-[2.25rem_minmax(0,1fr)] gap-3 sm:grid-cols-[2.5rem_minmax(0,1fr)] sm:gap-4"
                >
                  <div className="relative flex justify-center">
                    {idx < items.length - 1 && (
                      <span
                        aria-hidden="true"
                        className="absolute top-9 bottom-[-0.75rem] w-px bg-blue-200"
                      />
                    )}
                    <span className="relative z-10 flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-blue-200 bg-blue-50 font-mono text-xs font-bold text-blue-700">
                      {String(idx + 1).padStart(2, "0")}
                    </span>
                  </div>

                  <div className="flex min-w-0 flex-col justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-3.5 text-slate-800 shadow-sm transition-colors hover:border-slate-300 sm:flex-row sm:items-center sm:gap-4 sm:p-4">
                    <div className="min-w-0 flex-1">
                      <span className="mb-1 block text-[11px] font-medium text-slate-400">
                        Step {idx + 1}
                      </span>
                      <span className="block break-words text-sm font-semibold leading-6 text-slate-800">
                        {humanLabel}
                      </span>
                    </div>

                    <div className="flex shrink-0 items-center gap-2 border-t border-slate-100 pt-3 sm:border-l sm:border-t-0 sm:pl-3 sm:pt-0">
                      <button
                        type="button"
                        disabled={readOnly || idx === 0}
                        onClick={() => handleMove(idx, "up")}
                        aria-label={`Move step ${idx + 1} up`}
                        title="Move up"
                        className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-600 transition-colors hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700 disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        Move up
                      </button>
                      <button
                        type="button"
                        disabled={readOnly || idx === items.length - 1}
                        onClick={() => handleMove(idx, "down")}
                        aria-label={`Move step ${idx + 1} down`}
                        title="Move down"
                        className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-600 transition-colors hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700 disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        Move down
                      </button>
                    </div>
                  </div>
                </li>
              );
            })}
          </ol>
        ) : (
          <p className="mt-5 rounded-2xl border border-dashed border-slate-300 bg-white px-4 py-6 text-center text-sm text-slate-500">
            {readOnly ? "No flowchart steps were submitted for this question." : "Flowchart steps are not available for this question."}
          </p>
        )}
      </section>

      {/* Blank Inputs Section */}
      {hasBlanks && (
        <section className="space-y-3 rounded-3xl border border-slate-200 bg-white p-4 sm:p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h3 className="text-sm font-semibold text-slate-900">
                Complete the flowchart
              </h3>
              <p className="mt-1 text-xs leading-5 text-slate-500">
                Fill in each blank with one or two words from the passage.
              </p>
            </div>
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
              {blankKeys.length} {blankKeys.length === 1 ? "answer" : "answers"}
            </span>
          </div>
          <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
            {blankKeys.map((blankKey) => (
              <div
                key={blankKey}
                className="flex min-w-0 items-center gap-2.5 rounded-2xl border border-slate-200 bg-slate-50/70 p-3 transition-colors focus-within:border-blue-300 focus-within:bg-white"
              >
                <label
                  htmlFor={`flowchart-blank-${inputIdPrefix}-${blankKey}`}
                  className="shrink-0 rounded-lg border border-blue-200 bg-blue-50 px-2.5 py-1.5 font-mono text-xs font-bold text-blue-700"
                >
                  Blank [{blankKey}]
                </label>
                <input
                  id={`flowchart-blank-${inputIdPrefix}-${blankKey}`}
                  type="text"
                  readOnly={readOnly}
                  disabled={readOnly}
                  value={labels[blankKey] || ""}
                  onChange={(e) => handleLabelChange(blankKey, e.target.value)}
                  placeholder={`Type answer for [${blankKey}]...`}
                  className="min-w-0 flex-1 border-0 bg-transparent px-1 py-1.5 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:ring-0 disabled:opacity-60"
                />
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
