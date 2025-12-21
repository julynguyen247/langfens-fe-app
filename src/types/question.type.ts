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
export type QuestionUiKind =
  | "choice_single"
  | "choice_multiple"
  | "completion"
  | "matching_letter"
  | "matching_heading"
  | "flow_chart"
  | "matching_paragraph"
  | "matching_heading_select"
  | "summary_completion"
  | "matching_information";
type Choice = { value: string; label: string };

export type QuestionUi = {
  id: string;
  stem: string;
  backendType: BackendQuestionType;
  uiKind: QuestionUiKind;
  choices?: Choice[];
  placeholder?: string;
};
