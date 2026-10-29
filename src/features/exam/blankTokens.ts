/**
 * Single source of truth for extracting blank IDs from PromptMd.
 *
 * Contract: every blank must be encoded as `[N]` where N is a 1-indexed
 * integer matching the BlankAcceptTexts dict key in the question payload.
 * No underscores (`___`), no spaces (`[ N ]`), no prefixes (`blank-qN`).
 *
 * If a question contains a malformed placeholder, this returns an empty
 * array — the caller MUST treat that as a render contract violation.
 */
export function parseBracketedBlanks(promptMd: string | null | undefined): string[] {
  if (!promptMd) return [];
  const matches = Array.from(promptMd.matchAll(/\[(\d+)\]/g));
  const seen = new Set<string>();
  for (const m of matches) seen.add(m[1]);
  return Array.from(seen).sort((a, b) => Number(a) - Number(b));
}

/**
 * Returns true when every BlankAcceptTexts key is present as a `[N]`
 * placeholder in PromptMd. Use this as the source-of-truth validator
 * for completion-family question types.
 */
export function validatePromptBlankParity(
  promptMd: string | null | undefined,
  blankAcceptKeys: string[],
): { valid: boolean; missingInPrompt: string[] } {
  const inPrompt = new Set(parseBracketedBlanks(promptMd));
  const missing = blankAcceptKeys.filter((k) => !inPrompt.has(k));
  return { valid: missing.length === 0, missingInPrompt: missing };
}