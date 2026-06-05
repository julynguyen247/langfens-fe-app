/**
 * Single source of truth for the visual letter labels used by:
 *   - QuestionCard (MC single, T/F/NG, Y/N/NG, classification)
 *   - MultiCheckboxCard (MC multiple)
 *   - MatchingLetterCard (matching features / endings)
 *   - HeadingDropdown (matching heading — derived from Prefix instead,
 *     but the A-J keyboard fallback uses the same set)
 *
 * Keeping one constant avoids drift between renderers.
 */
export const LETTERS = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J"] as const;

/**
 * Auto-derive the visual letter for a 0-based option index. The
 * MATCHING_HEADING / MATCHING_FEATURES / MC-IMAGE renderers prefer
 * the canonical `opt.prefix` from the API; this helper is the
 * fallback when `prefix` is null/undefined (which is the standard
 * shape for every non-HEADING option after the data standard was
 * applied in the previous session).
 */
export function letterForIndex(idx: number): string {
  return LETTERS[idx] ?? String(idx + 1);
}
