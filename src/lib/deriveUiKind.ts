import type { BackendQuestionType, QuestionUiKind } from "@/types/question.type";

/**
 * Canonical BackendQuestionType → QuestionUiKind mapping.
 *
 * Replaces the legacy `mapApiQuestionToUi` wrapper (deleted in G14c).
 * Callers that previously went through `mapApiQuestionToUi` should now
 * call `deriveUiKind(q.type)` directly and construct `Question` inline.
 *
 * NOTE: SHORT_ANSWER, DIAGRAM_LABEL, MAP_LABEL all map to "completion"
 * (canonical). The legacy mapper returned "short_answer" for these —
 * that asymmetry is what G14b removes. Dispatch sites in QuestionPanel
 * (line 366) rely on this canonical mapping to pick the right wire API
 * (`values`+`onBlankChange` for completion, `value`+`onChange` for
 * everything else). Wire-up added in G20b (MapLabelCard, DiagramLabelCard)
 * activates automatically once this mapping takes effect.
 */
export function deriveUiKind(type: BackendQuestionType | string): QuestionUiKind {
  switch (type) {
    case "TRUE_FALSE_NOT_GIVEN":
    case "YES_NO_NOT_GIVEN":
    case "MULTIPLE_CHOICE_SINGLE":
    case "MULTIPLE_CHOICE_SINGLE_IMAGE":
    case "CLASSIFICATION":
      return "forice_single";
    case "MULTIPLE_CHOICE_MULTIPLE":
      return "forice_multiple";
    case "FORM_COMPLETION":
    case "NOTE_COMPLETION":
    case "SENTENCE_COMPLETION":
    case "SUMMARY_COMPLETION":
    case "TABLE_COMPLETION":
    case "SHORT_ANSWER":
    case "DIAGRAM_LABEL":
    case "MAP_LABEL":
      return "completion";
    case "MATCHING_FEATURES":
    case "MATCHING_ENDINGS":
      return "matching_letter";
    case "MATCHING_HEADING":
      return "matching_heading";
    case "MATCHING_INFORMATION":
      return "matching_information";
    case "FLOW_CHART":
      return "flow_chart";
    default:
      return "completion";
  }
}

/**
 * MATCHING_INFORMATION sub-dispatch helper. Detects whether the prompt
 * exposes a structured word list (WordListCompletionCard subkind) or
 * the generic paragraph form (MatchingLetterCard fallback inline at
 * QuestionPanel line 314).
 */
export function isWordListBlank(promptMd: string): boolean {
  const s = promptMd ?? "";
  return s.includes("**Word List:**") && s.includes("___");
}