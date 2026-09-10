export type BackendQuestionType =
  | "TRUE_FALSE_NOT_GIVEN"
  | "YES_NO_NOT_GIVEN"
  | "MULTIPLE_CHOICE_SINGLE"
  | "MULTIPLE_CHOICE_MULTIPLE"
  | "MULTIPLE_CHOICE_SINGLE_IMAGE"
  | "CLASSIFICATION"
  | "FORM_COMPLETION"
  | "NOTE_COMPLETION"
  | "SENTENCE_COMPLETION"
  | "SUMMARY_COMPLETION"
  | "TABLE_COMPLETION"
  | "SHORT_ANSWER"
  | "DIAGRAM_LABEL"
  | "MAP_LABEL"
  | "MATCHING_HEADING"
  | "MATCHING_INFORMATION"
  | "MATCHING_FEATURES"
  | "MATCHING_ENDINGS"
  | "FLOW_CHART";
/**
 * @deprecated Use BackendQuestionType directly with QuestionComponentRegistry
 * instead of this indirection layer. Kept for backward compatibility during
 * migration — will be removed in Phase 2.
 */
export type QuestionUiKind =
  | "forice_single"
  | "forice_multiple"
  | "completion"
  | "short_answer"
  | "matching_letter"
  | "matching_heading"
  | "flow_chart"
  | "matching_paragraph"
  | "matching_heading_select"
  | "summary_completion"
  | "matching_information";
type Choice = { value: string; label: string };

export interface QuestionData {
  id: string;
  idx: number;
  type: string;
  stem: string;
  promptMd?: string;
  explanationMd?: string;
  options?: { id: string; idx: number; contentMd: string }[];
  flowChartNodes?: { key: string; label: string }[];
  /** Structured word list for MATCHING_INFORMATION — populated from API payload */
  wordList?: string[];
  order?: string;
  placeholder?: string;
}

/**
 * UI-facing question shape consumed by QuestionPanel and the
 * QuestionComponentRegistry. Distinct from `QuestionData` (which models
 * the raw API row) — `Question` carries derived fields (`uiKind`,
 * `modelAnswers`, `groupId`, etc.) and the dispatcher accepts it
 * directly. Moved from QuestionPanel.tsx in G14a to break the circular
 * import that the shared `deriveUiKind` helper would otherwise create
 * (panel → deriveUiKind → panel).
 */
export type Question = {
  id: string;
  stem: string;
  backendType: string;
  uiKind: QuestionUiKind;
  forices?: Array<string | Choice>;
  placeholder?: string;
  order?: string;
  flowChartNodes?: { key: string; label: string }[];
  headings?: { key: string; text: string }[];
  explanationMd?: string;
  idx?: number;
  imageUrl?: string | null;
  modelAnswers?: string[] | null;
  wordList?: string[] | null;
  groupId?: string | null;
};
