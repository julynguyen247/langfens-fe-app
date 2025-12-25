import { Question } from "@/app/do-test/[skill]/[attemptId]/components/common/QuestionPanel";
import { BackendQuestionType, QuestionUiKind } from "@/types/question.type";

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
  explanationMd?: string;
  options?: ApiOption[];
  flowChartNodes?: { key: string; label: string }[];
};

function normalizeOptionLabel(contentMd: string): string {
  const trimmed = contentMd.trim();
  const m = trimmed.match(/^[A-Z]\.\s+(.*)$/);
  return m ? m[1] : trimmed;
}

function isWordListBlank(promptMd: string): boolean {
  const s = promptMd ?? "";
  return s.includes("**Word List:**") && s.includes("___");
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

    // checkbox
    case "MULTIPLE_CHOICE_MULTIPLE":
      return "choice_multiple";

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

    // matching letter
    case "MATCHING_FEATURES":
    case "MATCHING_ENDINGS":
      return "matching_letter";

    // matching heading
    case "MATCHING_HEADING":
      return "matching_heading";

    case "FLOW_CHART":
      return "flow_chart";

    default:
      return "completion";
  }
}

export function mapApiQuestionToUi(q: ApiQuestion): Question {
  const uiKind: QuestionUiKind =
    q.type === "MATCHING_INFORMATION"
      ? isWordListBlank(q.promptMd)
        ? "matching_information"
        : "matching_paragraph"
      : mapBackendTypeToUiKind(q.type);

  const base: Question = {
    id: q.id,
    stem: q.promptMd, 
    backendType: q.type,
    uiKind,
    explanationMd: q.explanationMd,
    idx: q.idx,  // Pass through idx for question group matching
  };

  // choice single
  if (uiKind === "choice_single") {
    return {
      ...base,
      choices: (q.options ?? []).map((opt) => ({
        value: opt.id,
        label: normalizeOptionLabel(opt.contentMd),
      })),
    };
  }

  // choice multiple
  if (uiKind === "choice_multiple") {
    return {
      ...base,
      choices: (q.options ?? []).map((opt) => ({
        value: opt.id,
        label: normalizeOptionLabel(opt.contentMd),
      })),
    };
  }

  // flow chart
  if (uiKind === "flow_chart") {
    return {
      ...base,
      flowChartNodes: q.flowChartNodes ?? [],
    };
  }

  // matching heading
  if (uiKind === "matching_heading" && q.options?.length) {
    return {
      ...base,
      choices: q.options.map((opt) => ({
        value: opt.contentMd.split(".")[0].trim(), // e.g. "i", "ii"
        label: opt.contentMd,
      })),
    };
  }

  // matching_information_wordlist: không cần choices từ BE (nằm trong promptMd)
  if (uiKind === "matching_information") {
    return base;
  }

  // matching_paragraph: hiện bạn đang render input A-F theo q.order/placeholder
  if (uiKind === "matching_paragraph") {
    return {
      ...base,
    };
  }

  // completion & others
  return base;
}
