"use client";

import React from "react";
import { InternalDeliveryOption, UserAnswerValue } from "../types";

interface MatchingCardV3Props {
  matchPairs?: Record<string, string[] | null> | null;
  options: InternalDeliveryOption[];
  promptMd?: string | null;
  mode: "exam" | "review";
  value?: UserAnswerValue;
  onChange?: (val: UserAnswerValue) => void;
}

interface MatchingTarget {
  key: string;
  label: string;
}

function normalizeMatchPairs(raw: unknown): Record<string, string[]> {
  const result: Record<string, string[]> = {};
  if (!raw) return result;

  if (Array.isArray(raw)) {
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

  const numberedRe = /^(\d+)[\.\)]\s+(.+)$/gm;
  let m: RegExpExecArray | null;
  while ((m = numberedRe.exec(text)) !== null) {
    targets.push({
      key: m[1],
      label: m[2].trim(),
    });
  }

  if (targets.length > 0) return targets;

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

  return [{ key: "1", label: "Item 1" }];
}

function parseCategoriesFromPrompt(
  prompt: string | null | undefined
): { key: string; label: string }[] {
  if (!prompt) return [];
  const text = prompt.replace(/\\n/g, "\n");
  const out: { key: string; label: string }[] = [];
  const re = /^([A-Z])\.\s+(.+)$/gm;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) {
    out.push({ key: m[1], label: m[2].trim() });
  }
  return out;
}

export function MatchingCardV3({
  matchPairs,
  options,
  promptMd,
  mode,
  value,
  onChange,
}: MatchingCardV3Props) {
  const isReview = mode === "review";
  const pairs = normalizeMatchPairs(matchPairs);
  const targets = parseTargets(promptMd, matchPairs);

  const userDict: Record<string, string> =
    value && typeof value === "object" && !Array.isArray(value)
      ? (value as Record<string, string>)
      : {};
  const handleSelect = (pKey: string, choiceKey: string) => {
    if (isReview || !onChange) return;
    const next = { ...userDict, [pKey]: choiceKey };
    onChange(next);
  };

  const choices: { key: string; label: string }[] = [];
  if (options && options.length > 0) {
    for (const opt of options) {
      const match = opt.contentMd.match(/^([ivxlcdm]+|[a-z0-9]+)\.?\s*(.*)/i);
      const k = match ? match[1].toLowerCase() : String(opt.idx);
      choices.push({
        key: k,
        label: opt.contentMd,
      });
    }
  } else {
    const seen = new Set<string>();
    const promptKeys = Object.keys(pairs).sort();
    for (const pKey of promptKeys) {
      const val = pairs[pKey];
      if (val && val[0]) {
        const k = val[0].toLowerCase();
        if (!seen.has(k)) {
          seen.add(k);
          choices.push({ key: k, label: val[1] || val[0] });
        }
      }
    }
    if (choices.length === 0) {
      for (const c of parseCategoriesFromPrompt(promptMd)) choices.push(c);
    }
  }

  return (
    <div className="space-y-4 pt-2 font-sans">
      {/* Pool of Choices box */}
      {choices.length > 0 && (
        <div className="p-4 rounded-2xl bg-slate-50 border-2 border-slate-200 text-xs space-y-2">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
            List of Available Headings / Options:
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {choices.map((c) => (
              <div key={c.key} className="flex items-start gap-2 text-slate-700">
                <span className="font-mono text-[#2563EB] font-bold shrink-0">
                  [{c.key}]
                </span>
                <span className="font-medium">{c.label}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Target Items List */}
      <div className="space-y-3">
        {targets.map((target) => {
          const pKey = target.key;
          const userChoice = (userDict[pKey] || "").toLowerCase().trim();
          const targetPair = pairs[pKey] || [];
          const correctKey = (targetPair[0] || "").toLowerCase().trim();
          const correctLabel = targetPair[1] || targetPair[0] || target.label;

          const isMatchCorrect = Boolean(userChoice && userChoice === correctKey);
          const hasAnswered = Boolean(userChoice);
          const selectedVal =
            choices.find((c) => c.key.toLowerCase() === userChoice.toLowerCase())?.key ||
            userChoice;

          if (!isReview) {
            // Exam Mode: Selector
            return (
              <div
                key={pKey}
                className="p-4 rounded-2xl border-2 border-slate-200 bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs"
              >
                <div className="flex items-start sm:items-center gap-2.5 min-w-0 flex-1">
                  <span className="font-mono text-xs font-bold text-[#2563EB] bg-blue-50 border border-blue-200 px-2.5 py-1 rounded-xl shrink-0">
                    {target.key}
                  </span>
                  <span className="text-xs font-semibold text-slate-800">
                    {target.label}
                  </span>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <select
                    value={selectedVal}
                    onChange={(e) => handleSelect(pKey, e.target.value)}
                    className="bg-white border-2 border-slate-300 rounded-xl px-3.5 py-2 text-xs font-medium text-slate-800 focus:outline-none focus:border-[#2563EB] min-w-48 shadow-2xs cursor-pointer"
                  >
                    <option value="">-- Select option --</option>
                    {choices.map((c) => (
                      <option key={c.key} value={c.key}>
                        [{c.key}] {c.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            );
          }

          // Review Mode: Admin-style 2-column comparison
          let borderStyle = "border-slate-200 bg-white";
          let statusBadge = null;

          if (isMatchCorrect) {
            borderStyle = "border-emerald-500 bg-emerald-50/40";
            statusBadge = (
              <span className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-emerald-600 text-white shrink-0">
                Correct ✓
              </span>
            );
          } else if (hasAnswered) {
            borderStyle = "border-rose-400 bg-rose-50/40";
            statusBadge = (
              <span className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-rose-600 text-white shrink-0">
                Wrong ✕
              </span>
            );
          } else {
            statusBadge = (
              <span className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-slate-200 text-slate-600 shrink-0">
                Unanswered
              </span>
            );
          }

          return (
            <div
              key={pKey}
              className={`p-4 rounded-2xl border-2 space-y-3 transition-all ${borderStyle}`}
            >
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-start sm:items-center gap-2.5 min-w-0 flex-1">
                  <span className="font-mono text-xs font-bold text-[#2563EB] bg-blue-50 border border-blue-200 px-2.5 py-1 rounded-xl shrink-0">
                    {target.key}
                  </span>
                  <span className="text-xs font-semibold text-slate-800">
                    {target.label}
                  </span>
                </div>

                {statusBadge}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 border-t border-slate-100">
                <div className="p-3 rounded-xl bg-white border border-slate-200 text-xs">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                    Your Answer:
                  </span>
                  <span
                    className={`font-medium ${
                      isMatchCorrect
                        ? "text-emerald-700 font-bold"
                        : hasAnswered
                        ? "text-rose-700 font-bold line-through"
                        : "text-slate-400 italic"
                    }`}
                  >
                    {userChoice ? `[${userChoice}]` : "(No answer given)"}
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-emerald-50/60 border border-emerald-200 text-xs">
                  <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider block mb-1">
                    Correct Key:
                  </span>
                  <span className="font-bold text-emerald-950 font-mono">
                    [{correctKey}] {correctLabel && `— ${correctLabel}`}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
