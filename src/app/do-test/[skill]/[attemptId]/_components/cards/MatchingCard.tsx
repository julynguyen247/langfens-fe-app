"use client";

import { useMemo } from "react";
import { InternalDeliveryOption, UserAnswerValue } from "../../_lib/types";

interface MatchingCardProps {
  matchPairs?: unknown;
  options: InternalDeliveryOption[];
  promptMd?: string | null;
  value?: UserAnswerValue;
  onChange: (val: UserAnswerValue) => void;
}

interface MatchingTarget {
  key: string;
  label: string;
}

function normalizeMatchPairs(raw: unknown): Record<string, string[]> {
  const result: Record<string, string[]> = {};
  if (!raw) return result;

  if (Array.isArray(raw)) {
    // Protobuf format: [ { promptKey: "1", acceptedValues: ["i", "label"] }, ... ]
    for (const item of raw) {
      if (item && typeof item === "object") {
        const key =
          "promptKey" in item && typeof item.promptKey === "string"
            ? item.promptKey
            : "";
        const values =
          "acceptedValues" in item && Array.isArray(item.acceptedValues)
            ? item.acceptedValues
            : [];
        if (key) {
          result[key] = values as string[];
        }
      }
    }
    return result;
  }

  if (typeof raw === "object") {
    // Dictionary format: { "1": ["i", "label"], ... }
    for (const [k, v] of Object.entries(raw)) {
      if (Array.isArray(v)) {
        result[k] = v as string[];
      }
    }
  }

  return result;
}

function parseTargets(
  promptMd: string | null | undefined,
  matchPairs?: unknown
): MatchingTarget[] {
  const targets: MatchingTarget[] = [];
  const text = (promptMd || "").replace(/\\n/g, "\n");
  const normalizedPairs = normalizeMatchPairs(matchPairs);

  // 1. If matchPairs is present and non-empty (e.g. in review mode or when seeded)
  if (Object.keys(normalizedPairs).length > 0) {
    const keys = Object.keys(normalizedPairs).sort((a, b) => {
      const na = Number(a);
      const nb = Number(b);
      if (!Number.isNaN(na) && !Number.isNaN(nb)) return na - nb;
      return a.localeCompare(b);
    });
    for (const k of keys) {
      const pair = normalizedPairs[k];
      const label = pair && pair.length > 1 && pair[1] ? pair[1] : `Item ${k}`;
      targets.push({ key: k, label });
    }
    return targets;
  }

  // 2. Parse numbered statements from promptMd: "1. Statement..." or "1) Statement..."
  // Only match numbers at the beginning of a line (avoid Roman numerals i., ii. or letters A., B.)
  const numberedRe = /^(\d+)[\.\)]\s+(.+)$/gm;
  let m: RegExpExecArray | null;
  while ((m = numberedRe.exec(text)) !== null) {
    targets.push({
      key: m[1],
      label: m[2].trim(),
    });
  }

  if (targets.length > 0) {
    return targets;
  }

  // 3. Detect paragraphs for MATCHING_HEADING (e.g. "five paragraphs, 1–5" or "five paragraphs, A–E")
  const headingParaMatch = text.match(
    /(?:five|six|seven|eight|nine|ten|\d+)\s+paragraphs[,\s]+(?:1[–-](\d+)|([A-Z])[–-]([A-Z]))/i
  );
  if (headingParaMatch) {
    if (headingParaMatch[1]) {
      const total = parseInt(headingParaMatch[1], 10);
      for (let i = 1; i <= total; i++) {
        targets.push({ key: String(i), label: `Paragraph ${i}` });
      }
    } else if (headingParaMatch[2] && headingParaMatch[3]) {
      const start = headingParaMatch[2].charCodeAt(0);
      const end = headingParaMatch[3].charCodeAt(0);
      let idx = 1;
      for (let c = start; c <= end; c++, idx++) {
        targets.push({
          key: String(idx),
          label: `Paragraph ${String.fromCharCode(c)}`,
        });
      }
    }
    if (targets.length > 0) return targets;
  }

  // 4. Detect item ranges in prompt like "(1–4)" or "initiatives (1–4)" or "Questions 1–4" or "beginnings 1–4"
  const rangeMatch = text.match(
    /(?:initiatives?|statements?|sentences?|beginnings?|groups?|items?|questions?|paragraphs?)?\s*\(?\b(\d+)[–-](\d+)\b\)?/i
  );
  if (rangeMatch) {
    const start = parseInt(rangeMatch[1], 10);
    const end = parseInt(rangeMatch[2], 10);
    if (end > start && end - start < 20) {
      for (let i = start; i <= end; i++) {
        targets.push({ key: String(i), label: `Item ${i}` });
      }
      if (targets.length > 0) return targets;
    }
  }

  // 5. Default fallback: 1-indexed target
  return [{ key: "1", label: "Item 1" }];
}

export function MatchingCard({
  matchPairs,
  options,
  promptMd,
  value,
  onChange,
}: MatchingCardProps) {
  const targets = useMemo(
    () => parseTargets(promptMd, matchPairs),
    [promptMd, matchPairs]
  );

  const userDict: Record<string, string> = useMemo(() => {
    if (value && typeof value === "object" && !Array.isArray(value)) {
      return value as Record<string, string>;
    }
    return {};
  }, [value]);

  const handleSelect = (promptKey: string, selectedChoiceKey: string) => {
    const next = { ...userDict, [promptKey]: selectedChoiceKey };
    onChange(next);
  };

  const choices = useMemo(() => {
    const list: { key: string; label: string }[] = [];
    if (options && options.length > 0) {
      for (const opt of options) {
        const match = opt.contentMd.match(/^([ivxlcdm]+|[a-z0-9]+)\.?\s*(.*)/i);
        const k = match ? match[1] : String(opt.idx);
        list.push({
          key: k,
          label: opt.contentMd,
        });
      }
    }
    return list;
  }, [options]);


  return (
    <div className="space-y-5">
      {/* Available choice pool reference box */}
      {choices.length > 0 && (
        <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 border-2 border-slate-200 shadow-2xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-3">
            List of Available Choices:
          </span>
          <div className="flex flex-col gap-2">
            {choices.map((c) => (
              <div
                key={c.key}
                className="flex items-start gap-2.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-slate-700"
              >
                <span className="inline-flex shrink-0 items-center justify-center min-w-[2.25rem] px-2 py-0.5 rounded-md font-mono text-xs font-bold text-[#2563EB] bg-blue-50 border border-blue-200">
                  [{c.key}]
                </span>
                <span className="font-medium text-sm leading-snug whitespace-pre-line">
                  {c.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
      {/* Target items to match */}
      <div className="space-y-3">
        {targets.map((target) => {
          const userChoice = userDict[target.key] || "";
          const selectedVal =
            choices.find(
              (c) => c.key.toLowerCase() === userChoice.toLowerCase()
            )?.key || userChoice;

          return (
            <div
              key={target.key}
              className="p-3.5 sm:p-4 rounded-2xl border-2 border-slate-200 bg-white space-y-2 transition-all shadow-2xs"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-start sm:items-center gap-3 min-w-0 flex-1">
                  <span className="font-mono text-xs font-bold text-[#2563EB] bg-blue-50 border border-blue-200 px-2.5 py-1 rounded-xl shrink-0">
                    {target.key}
                  </span>
                  <span className="text-xs sm:text-sm font-semibold text-slate-800 leading-snug">
                    {target.label}
                  </span>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <select
                    value={selectedVal}
                    onChange={(e) => handleSelect(target.key, e.target.value)}
                    className="bg-white border-2 border-slate-300 rounded-xl px-3.5 py-2 text-xs font-medium text-slate-800 focus:outline-none focus:border-[#2563EB] min-w-48 max-w-xs shadow-2xs cursor-pointer"
                  >
                    <option value="">-- Select choice --</option>
                    {choices.map((c) => (
                      <option key={c.key} value={c.key}>
                        [{c.key}] {c.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
