import { Question } from "@/app/do-test/[skill]/[attemptId]/components/common/QuestionPanel";
import { BackendQuestionType, QuestionUiKind } from "@/type/question.type";

type ApiOption = {
  id: string;
  idx: number;
  contentMd: string;
};

type ApiQuestion = {
  id: string;
  idx: number;
  type: BackendQuestionType;
  promptMd: string;
  options?: ApiOption[];
};

function normalizeOptionLabel(contentMd: string): string {
  const trimmed = contentMd.trim();
  const m = trimmed.match(/^[A-Z]\.\s+(.*)$/);
  return m ? m[1] : trimmed;
}

function mapBackendTypeToUiKind(type: BackendQuestionType): QuestionUiKind {
  switch (type) {
    // radio
    case "TRUE_FALSE_NOT_GIVEN":
    case "YES_NO_NOT_GIVEN":
    case "MULTIPLE_CHOICE_SINGLE":
    case "MULTIPLE_CHOICE_SINGLE_IMAGE":
    case "CLASSIFICATION":
      return "choice_single";

    // input text
    case "FORM_COMPLETION":
    case "NOTE_COMPLETION":
    case "SENTENCE_COMPLETION":
    case "SUMMARY_COMPLETION":
    case "TABLE_COMPLETION":
    case "SHORT_ANSWER":
    case "DIAGRAM_LABEL":
    case "MAP_LABEL":
      return "completion";

    // matching: nhập A–F
    case "MATCHING_HEADING":
    case "MATCHING_INFORMATION":
    case "MATCHING_FEATURES":
    case "MATCHING_ENDINGS":
      return "matching_letter";

    case "FLOW_CHART":
      return "flow_chart";

    default:
      return "completion";
  }
}

export function mapApiQuestionToUi(q: ApiQuestion): Question {
  const uiKind = mapBackendTypeToUiKind(q.type);

  const base: Question = {
    id: q.id,
    stem: q.promptMd,
    backendType: q.type,
    uiKind,
  };

  if (uiKind === "choice_single") {
    return {
      ...base,
      choices: (q.options ?? []).map((opt) => ({
        value: opt.id, // gửi optionId
        label: normalizeOptionLabel(opt.contentMd),
      })),
    };
  }

  return base;
}
