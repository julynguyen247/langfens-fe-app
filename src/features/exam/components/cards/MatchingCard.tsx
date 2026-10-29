"use client";

import { useMemo } from "react";
import { InternalDeliveryOption, UserAnswerValue } from "../../types";
import { getBlankKeys } from "../../contract";

interface MatchingCardProps {
  matchPairs?: unknown;
  options: InternalDeliveryOption[];
  wordList?: string[] | null;
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

  // 1. Parse potential target statements or paragraphs from promptMd
  const promptTargetMap = new Map<string, string>();
  const numberedRe = /^(\d+)[\.\)]\s+(.+)$/gm;
  let m: RegExpExecArray | null;
  while ((m = numberedRe.exec(text)) !== null) {
    promptTargetMap.set(m[1], m[2].trim());
  }

  if (promptTargetMap.size === 0) {
    const headingParaMatch = text.match(
      /(?:five|six|seven|eight|nine|ten|\d+)\s+paragraphs[,\s]+(?:1[–-](\d+)|([A-Z])[–-]([A-Z]))/i
    );
    if (headingParaMatch) {
      if (headingParaMatch[1]) {
        const total = parseInt(headingParaMatch[1], 10);
        for (let i = 1; i <= total; i++) {
          promptTargetMap.set(String(i), `Paragraph ${i}`);
        }
      } else if (headingParaMatch[2] && headingParaMatch[3]) {
        const start = headingParaMatch[2].charCodeAt(0);
        const end = headingParaMatch[3].charCodeAt(0);
        let idx = 1;
        for (let c = start; c <= end; c++, idx++) {
          promptTargetMap.set(String(idx), `Paragraph ${String.fromCharCode(c)}`);
        }
      }
    }
  }

  if (promptTargetMap.size === 0) {
    const rangeMatch = text.match(
      /(?:initiatives?|statements?|sentences?|beginnings?|groups?|items?|questions?|paragraphs?)?\s*\(?\b(\d+)[–-](\d+)\b\)?/i
    );
    if (rangeMatch) {
      const start = parseInt(rangeMatch[1], 10);
      const end = parseInt(rangeMatch[2], 10);
      if (end > start && end - start < 20) {
        for (let i = start; i <= end; i++) {
          promptTargetMap.set(String(i), `Item ${i}`);
        }
      }
    }
  }

  // 2. If matchPairs is present and non-empty
  if (Object.keys(normalizedPairs).length > 0) {
    const keys = Object.keys(normalizedPairs).sort((a, b) => {
      const na = Number(a);
      const nb = Number(b);
      if (!Number.isNaN(na) && !Number.isNaN(nb)) return na - nb;
      return a.localeCompare(b);
    });
    for (const k of keys) {
      const pair = normalizedPairs[k];
      const label =
        (pair && pair.length > 1 && pair[1]?.trim()) ||
        promptTargetMap.get(k) ||
        `Item ${k}`;
      targets.push({ key: k, label });
    }
    return targets;
  }

  // 3. Fallback to promptTargetMap if matchPairs is empty
  if (promptTargetMap.size > 0) {
    const keys = Array.from(promptTargetMap.keys()).sort((a, b) => {
      const na = Number(a);
      const nb = Number(b);
      if (!Number.isNaN(na) && !Number.isNaN(nb)) return na - nb;
      return a.localeCompare(b);
    });
    for (const k of keys) {
      targets.push({ key: k, label: promptTargetMap.get(k)! });
    }
    return targets;
  }

  const blankKeys = getBlankKeys({ promptMd });
  if (blankKeys.length) return blankKeys.map((key) => ({ key, label: `Item ${key}` }));

  return [{ key: "1", label: "Item 1" }];
}

export function MatchingCard({
  matchPairs,
  options,
  wordList,
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
    if (typeof value === "string" && targets.length === 1) return { [targets[0].key]: value };
    return {};
  }, [value, targets]);

  const handleSelect = (promptKey: string, selectedChoiceKey: string) => {
    const next = { ...userDict, [promptKey]: selectedChoiceKey };
    onChange(next);
  };

  const choices = useMemo(() => {
    const list: { key: string; label: string }[] = [];
    const promptChoices = Array.from((promptMd ?? "").replace(/\\n/g, "\n").matchAll(/^([A-Z])[.)]\s+(.+)$/gm), m => `${m[1]}. ${m[2]}`);
    const words = wordList?.length ? wordList : promptChoices;
    const pool = options?.length ? options : words.map((word, i) => ({ id: word, idx: i + 1, contentMd: word }));
    if (pool.length > 0) {
      for (const opt of pool) {
        const match = opt.contentMd.trim().match(/^\[([a-z0-9]+)\](?=$|\s)|^([a-z0-9]+)(?:[.)\-:]\s*|$)/i);
        const k = match?.[1] ?? match?.[2] ?? (wordList?.length ? opt.contentMd : String(opt.idx));
        list.push({
          key: k,
          label: opt.contentMd,
        });
      }
    }
    return list;
  }, [options, wordList, promptMd]);


  return (
    <div className="space-y-5">
      {/* Available choice pool reference box */}
      {choices.length > 0 && (
        <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 border-2 border-slate-200 shadow-2xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-3">
            List of Available Choices:
          </span>
          <div className="flex flex-col gap-2">
            {choices.map((c) => {
              const cleanLabel = c.label.replace(
                new RegExp(`^(\\[${c.key}\\]|${c.key}[.)\\-:])\\s*`, "i"),
                ""
              );
              return (
                <div
                  key={c.key}
                  className="flex items-start gap-2.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-slate-700"
                >
                  <span className="inline-flex shrink-0 items-center justify-center min-w-[2.25rem] px-2 py-0.5 rounded-md font-mono text-xs font-bold text-[#2563EB] bg-blue-50 border border-blue-200">
                    [{c.key}]
                  </span>
                  <span className="font-medium text-sm leading-snug whitespace-pre-line">
                    {cleanLabel || c.label}
                  </span>
                </div>
              );
            })}
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
                    aria-label={`Item ${target.key}`}
                    value={selectedVal}
                    onChange={(e) => handleSelect(target.key, e.target.value)}
                    className="bg-white border-2 border-slate-300 rounded-xl px-3.5 py-2 text-xs font-medium text-slate-800 focus:outline-none focus:border-[#2563EB] min-w-48 max-w-xs shadow-2xs cursor-pointer"
                  >
                    <option value="">-- Select choice --</option>
                    {choices.map((c) => {
                      const cleanLabel = c.label.replace(
                        new RegExp(`^(\\[${c.key}\\]|${c.key}[.)\\-:])\\s*`, "i"),
                        ""
                      );
                      return (
                        <option key={c.key} value={c.key}>
                          [{c.key}] {cleanLabel || c.label}
                        </option>
                      );
                    })}
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
