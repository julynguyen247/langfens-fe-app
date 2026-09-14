"use client";

import { UserAnswerValue } from "../../_lib/types";
import { parseBracketedBlanks } from "../../../../_lib/parseBlankTokens";

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
  // Sprint 3: Object.keys preserves insertion order, which may be non-numeric
  // (Admin UI typing order) or non-monotonic (seeder order). Sort numerically
  // so rendering + grading agree on blank order independent of dict insertion.
  // Kept as `let` because the fallback branch below (promptMd regex parse)
  // reassigns blankKeys when BlankAccepts is stripped.
  let blankKeys = Object.keys(texts).sort((a, b) => {
    const na = Number(a);
    const nb = Number(b);
    if (!Number.isNaN(na) && !Number.isNaN(nb)) return na - nb;
    return String(a).localeCompare(String(b));
  });

  // When blankAcceptTexts is empty (e.g. during live test where answers are
  // stripped for security): derive blank keys from the promptMd.
  //
  // Phase 2 (S32) cutover — the legacy `___` underscore fallback was
  // retired alongside the DB migration. The DB now ships every
  // completion-family question in `[N]` bracket format (no underscores),
  // so this card only has to handle:
  //   (a) `[1] [2] [3]` — ordinal blanks in the prompt body
  //   (b) `[Diagram: a, b, c, d]` / `[Map: ...]` — word-bank list for
  //       DIAGRAM_LABEL / MAP_LABEL (live-snapshot path where BlankAccepts
  //       are stripped for security)

  // Sprint 3 fix: blankKeys equal the literal digit from the prompt's `[N]`
  // placeholder, so typing into "Blank [1]" stores `{"1":"..."}` and the BE
  // grader looks up `BlankAcceptTexts["1"]` directly. The convention is
  // end-to-end 1-indexed (prompt digit = dict key).
  if (blankKeys.length === 0 && promptMd) {
    // 1. Bracketed ordinal placeholders — `[1] [2] [3]`.
    //    Use the shared parseBracketedBlanks utility (1-indexed) so prompt
    //    and dict keys agree. Sprint 7 Phase 10.
    const bracketKeys = parseBracketedBlanks(promptMd);
    if (bracketKeys.length > 0) {
      blankKeys = bracketKeys;
    } else {
      // 2. `[Diagram: a, b, c, d]` / `[Map: ...]` word-bank marker. One
      // blank per label, 1-indexed.
      const labelListMatch = promptMd.match(/\[(Diagram|Map):\s*([^\]]+)\]/i);
      if (labelListMatch) {
        const labels = labelListMatch[2]
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean);
        if (labels.length > 0) {
          blankKeys = labels.map((_, i) => String(i + 1));
        }
      }
    }
  }
  // 3. Render contract enforcement (Sprint 7 Phase 10): if a completion-family
  // question arrives with no BlankAccepts AND no `[N]` AND no Diagram/Map
  // marker, the prompt likely escaped the S32 DB migration. Throw in production
  // so the regression surfaces immediately; warn in dev for friendlier DX.
  if (blankKeys.length === 0) {
    if (process.env.NODE_ENV === "development") {
      console.warn(
        "[CompletionCard] no blank keys derived from promptMd; check that the row uses `[N]` placeholders or a `[Diagram/Map: ...]` word-bank marker.",
        { promptMd: promptMd?.slice(0, 200) },
      );
      blankKeys = ["1"];
    } else {
      throw new Error(
        "[CompletionCard] render contract violated: PromptMd has no [N] placeholders and no [Diagram/Map: ...] word-bank marker. This question was rejected at save time by Sprint 7 Phase 10 validation; investigate data integrity.",
      );
    }
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
            ? Number(key)
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
