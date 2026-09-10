import {
  AttemptAnswerItem,
  UserAnswerValue,
} from "@/components/exam-v3/types";

/**
 * Convert an AttemptAnswerItem into a render-ready UserAnswerValue.
 *
 * Wire-format conventions on the BE (CompletionGrader JSON path, S31 validator,
 * seeder) are 0-indexed: "Blank [1]" reads `userDict["0"]`. The legacy
 * pre-TestV2Runner multi-line wire format uses one line per blank, also
 * 0-indexed to match the active data path. JSON-shaped answers are preserved as-is.
 */
export function parseUserAnswer(ans?: AttemptAnswerItem): UserAnswerValue {
  if (!ans) return "";

  if (ans.selectedOptionIds && ans.selectedOptionIds.length > 0) {
    return ans.selectedOptionIds;
  }

  const raw = ans.textAnswer?.trim() || "";

  // Legacy format (pre-TestV2Runner): multi-line string with newline-separated
  // positional answers, e.g. "asdas\nasdas" for SENTENCE_COMPLETION /
  // FORM_COMPLETION / matching. Split into a positional dict keyed by 0-indexed
  // string keys so the value shape matches the canonical 0-indexed convention
  // used by the BE grader (CompletionGrader JSON path) and S31 validator.
  // Single-line strings fall through unchanged (no false-positive splitting).
  if (raw.includes("\n") && !raw.startsWith("{") && !raw.startsWith("[")) {
    const lines = raw.split("\n").map((l) => l.trim()).filter(Boolean);
    if (lines.length > 1) {
      const dict: Record<string, string> = {};
      lines.forEach((line, i) => {
        dict[String(i)] = line;
      });
      return dict;
    }
  }

  if (raw.startsWith("{") && raw.endsWith("}")) {
    try {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
        return parsed as Record<string, string>;
      }
    } catch {
      // ignore
    }
  }

  if (raw.startsWith("[") && raw.endsWith("]")) {
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed as string[];
      }
    } catch {
      // ignore
    }
  }

  return ans.selectedAnswerText || raw;
}
