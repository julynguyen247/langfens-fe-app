"use client";

import { InternalDeliveryOption, UserAnswerValue } from "../../_lib/types";

interface MatchingCardProps {
  matchPairs?: Record<string, string[] | null> | null;
  options: InternalDeliveryOption[];
  promptMd?: string | null;
  value?: UserAnswerValue;
  onChange: (val: UserAnswerValue) => void;
}

function countStatementsInPrompt(prompt: string | null | undefined): number {
  if (!prompt) return 0;
  const text = prompt.replace(/\\n/g, "\n");
  let count = 0;
  const re = /^\d+\.\s+/gm;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) count++;
  return count;
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
    out.push({
      key: m[1].toLowerCase(),
      label: `${m[1]}. ${m[2].trim()}`,
    });
  }
  return out;
}

export function MatchingCard({
  matchPairs,
  options,
  promptMd,
  value,
  onChange,
}: MatchingCardProps) {
  const pairs = matchPairs || {};
  const promptKeys = Object.keys(pairs).sort();
  const fallbackCount = countStatementsInPrompt(promptMd);
  const effectiveKeys =
    promptKeys.length > 0
      ? promptKeys
      : Array.from({ length: Math.max(fallbackCount, 1) }, (_, i) => String(i));

  const userDict: Record<string, string> =
    value && typeof value === "object" && !Array.isArray(value)
      ? (value as Record<string, string>)
      : {};

  const handleSelect = (promptKey: string, selectedGradingKey: string) => {
    const next = { ...userDict, [promptKey]: selectedGradingKey };
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
    const fromPairs = new Set<string>();
    for (const pKey of promptKeys) {
      const val = pairs[pKey];
      if (val && val[0]) {
        const k = val[0].toLowerCase();
        if (!fromPairs.has(k)) {
          fromPairs.add(k);
          choices.push({ key: k, label: val[1] || val[0] });
        }
      }
    }
    if (choices.length === 0) {
      const fromPrompt = parseCategoriesFromPrompt(promptMd);
      for (const c of fromPrompt) choices.push(c);
    }
  }

  return (
    <div className="space-y-4">
      {/* Available choice pool reference box */}
      {choices.length > 0 && (
        <div className="p-5 rounded-2xl bg-slate-50 border-2 border-slate-200 text-xs space-y-2 shadow-2xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
            List of Available Choices:
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {choices.map((c) => (
              <div key={c.key} className="flex items-start gap-2 text-slate-700">
                <span className="font-mono text-[#2563EB] font-bold shrink-0">[{c.key}]</span>
                <span className="font-medium">{c.label}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Prompt items to match */}
      <div className="space-y-3">
        {effectiveKeys.map((pKey) => {
          const userChoice = (userDict[pKey] || "").toLowerCase();

          return (
            <div
              key={pKey}
              className="p-4 rounded-2xl border-2 border-slate-200 bg-white space-y-2 transition-all shadow-2xs"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <span className="font-mono text-xs font-bold text-[#2563EB] bg-blue-50 border border-blue-200 px-3 py-1 rounded-xl">
                    Target [{pKey}]
                  </span>
                  <span className="text-xs font-bold text-slate-700">Match to choice</span>
                </div>

                <div className="flex items-center gap-2">
                  <select
                    value={userChoice}
                    onChange={(e) => handleSelect(pKey, e.target.value)}
                    className="bg-white border-2 border-slate-300 rounded-xl px-3.5 py-2 text-xs font-medium text-slate-800 focus:outline-none focus:border-[#2563EB] min-w-48 shadow-2xs"
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
