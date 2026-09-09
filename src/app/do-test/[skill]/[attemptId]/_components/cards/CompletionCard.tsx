"use client";

import { UserAnswerValue } from "../../_lib/types";

interface CompletionCardProps {
  blankAcceptTexts?: Record<string, string[] | null> | null;
  blankAcceptRegex?: Record<string, string[] | null> | null;
  promptMd?: string | null;
  imageUrl?: string | null;
  value?: UserAnswerValue;
  onChange: (val: UserAnswerValue) => void;
}

export function CompletionCard({
  blankAcceptTexts,
  promptMd,
  imageUrl,
  value,
  onChange,
}: CompletionCardProps) {
  const texts = blankAcceptTexts || {};
  let blankKeys = Object.keys(texts);

  // When blankAcceptTexts is empty (e.g. during live test where answers are stripped for security):
  if (blankKeys.length === 0) {
    if (promptMd) {
      // 1. Check for bracketed placeholders [0], [1], [2] or [1], [2], [3]
      const bracketMatches = Array.from(promptMd.matchAll(/\[(\d+)\]/g)).map((m) => m[1]);
      if (bracketMatches.length > 0) {
        blankKeys = Array.from(new Set(bracketMatches)).sort((a, b) => Number(a) - Number(b));
      } else {
        // 2. Check for underscore placeholders __________
        const underscores = promptMd.match(/_{3,}/g) || [];
        if (underscores.length > 0) {
          blankKeys = underscores.map((_, i) => String(i));
        } else {
          // 3. DIAGRAM_LABEL/MAP_LABEL: prompt carries "[Diagram: a, b, c, d]" — one
          // blank per label. Used by ReadingSeeder for q13 (DIAGRAM_LABEL) where the
          // live exam snapshot strips BlankAcceptTexts (security), so the promptMd
          // is the only place left to infer blank count.
          const labelListMatch = promptMd.match(/\[(Diagram|Map):\s*([^\]]+)\]/i);
          if (labelListMatch) {
            const labels = labelListMatch[2]
              .split(",")
              .map((s) => s.trim())
              .filter(Boolean);
            if (labels.length > 0) {
              blankKeys = labels.map((_, i) => String(i));
            }
          }
        }
      }
    }
  }
  if (blankKeys.length === 0) {
    blankKeys = ["0"];
  } else {
    blankKeys.sort((a, b) => {
      const na = Number(a);
      const nb = Number(b);
      if (!isNaN(na) && !isNaN(nb)) return na - nb;
      return a.localeCompare(b);
    });
  }

  // Parse word bank labels from "[Diagram: a, b, c, d]" / "[Map: a, b, c, d]" in
  // promptMd. Used by DIAGRAM_LABEL/MAP_LABEL — the live exam snapshot strips
  // BlankAcceptTexts (security), so the promptMd is the only place left to
  // surface the label list to the candidate (IELTS-style word bank above
  // numbered input blanks).
  const wordBank: string[] = (() => {
    if (!promptMd) return [];
    const m = promptMd.match(/\[(Diagram|Map):\s*([^\]]+)\]/i);
    if (!m) return [];
    return m[2]
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
  })();

  const userDict: Record<string, string> =
    value && typeof value === "object" && !Array.isArray(value)
      ? (value as Record<string, string>)
      : typeof value === "string"
      ? { "1": value }
      : {};

  const handleInputChange = (key: string, text: string) => {
    const next = { ...userDict, [key]: text };
    onChange(next);
  };

  return (
    <>
      {imageUrl && (
        <div className="mb-4 flex justify-center">
          <img
            src={imageUrl}
            alt="Question diagram"
            className="max-w-full max-h-96 rounded-lg border border-slate-200"
            loading="lazy"
          />
        </div>
      )}

      {wordBank.length > 0 && (
        <div className="mb-4 p-3 rounded-2xl bg-blue-50/40 border border-blue-200">
          <div className="text-[10px] font-bold uppercase tracking-wider text-blue-700 mb-2">
            Word List — Choose from:
          </div>
          <div className="flex flex-wrap gap-2">
            {wordBank.map((label, i) => (
              <span
                key={i}
                className="px-3 py-1.5 text-xs font-medium bg-white border border-blue-300 text-slate-800 rounded-lg shadow-2xs"
              >
                {label}
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="space-y-4">
        {blankKeys.map((key) => {
          const userVal = userDict[key] || "";

          const displayNum = !isNaN(Number(key))
            ? Number(key) + (blankKeys[0] === "0" ? 1 : 0)
            : blankKeys.indexOf(key) + 1;

          return (
            <div key={key} className="space-y-1.5 p-3 rounded-2xl bg-slate-50/50 border border-slate-100">
              <div className="flex items-center gap-3">
                <span className="font-mono text-xs font-bold text-[#2563EB] bg-blue-50 border border-blue-200 px-3 py-1.5 rounded-xl shrink-0">
                  Blank [{displayNum}]
                </span>

                <div className="flex-1 relative">
                  <input
                    type="text"
                    value={userVal}
                    onChange={(e) => handleInputChange(key, e.target.value)}
                    placeholder={`Type answer for blank [${displayNum}]...`}
                    className="w-full rounded-xl border-2 px-4 py-2.5 text-xs sm:text-sm bg-white border-slate-300 text-slate-900 focus:border-[#2563EB] focus:outline-none transition-all shadow-2xs"
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}
