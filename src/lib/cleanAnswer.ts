/**
 * Consolidates canonical answer cleaning logic from:
 * - src/app/attempts/[attemptId]/utils.ts:66-94
 * - src/app/do-test/[skill]/[attemptId]/components/common/QuestionPanel.tsx:111-130
 *
 * Preserves G15 invariant: explicitly named administrative prefixes are stripped,
 * but legitimate user answer prefixes (e.g. "Reason: ...", "Title: ...") remain intact.
 * Case is PRESERVED (no forced toLowerCase).
 */
export function cleanAnswer(s: string | undefined | null): string {
  if (!s) return "";

  let clean = String(s)
    .replace(/\\n/g, "\n")
    .replace(/blank[-_]\w+:\s*/gi, "")
    .replace(/\[blank[-_]\w+\]/gi, "")
    .replace(/label[-_ ]*\w*:\s*/gi, "")
    .replace(/step[-_ ]*\w*:\s*/gi, "")
    .replace(/node[-_ ]*\w*:\s*/gi, "")
    .replace(
      /^\s*(?:paragraph|info|step|flow|node|part|section)[-_ ]*\w*:\s*/i,
      ""
    )
    .replace(/\b(?:paragraph|info)[-_ ]*\w*:\s*/gi, "")
    .replace(/^feature[-_]?q?\d*:\s*/i, "")
    .replace(/^q\d+:\s*/i, "")
    .replace(
      /^(heading|item|answer|key|option|part|section|paragraph|info|flow)[-_]?\d*:\s*/gi,
      ""
    )
    .replace(/[^\S\r\n]+/g, " ")
    .trim();

  // Deduplicate identical slash tokens e.g. "D / D" -> "D" or "True/True" -> "True"
  if (/^([A-Za-z0-9]+)\s*\/\s*\1$/i.test(clean)) {
    clean = clean.split("/")[0].trim();
  } else if (clean.includes(" / ")) {
    clean = clean.split(" / ")[0].trim();
  }

  return clean;
}
