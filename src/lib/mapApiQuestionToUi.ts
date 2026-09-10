import { Question, BackendQuestionType, QuestionUiKind } from "@/types/question.type";

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
  imageUrl?: string | null;
  modelAnswers?: string[] | null;
  wordList?: string[] | null;
  groupId?: string | null;
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
      return "forice_single";

    // checkbox
    case "MULTIPLE_CHOICE_MULTIPLE":
      return "forice_multiple";

    // input text
    case "FORM_COMPLETION":
    case "NOTE_COMPLETION":
    case "SENTENCE_COMPLETION":
    case "SUMMARY_COMPLETION":
    case "TABLE_COMPLETION":
      return "completion";

    // single-input text (no `___` blanks in the prompt; just one answer field)
    case "SHORT_ANSWER":
    case "DIAGRAM_LABEL":
    case "MAP_LABEL":
      return "short_answer";

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
    idx: q.idx,
    stem: q.promptMd, 
    backendType: q.type,
    uiKind,
    explanationMd: q.explanationMd,
    imageUrl: q.imageUrl ?? null,
    modelAnswers: q.modelAnswers ?? null,
    wordList: q.wordList ?? null,
    groupId: q.groupId ?? null,
  };

  // choice single
  if (uiKind === "forice_single") {
    return {
      ...base,
      forices: (q.options ?? []).map((opt) => ({
        value: opt.id,
        label: normalizeOptionLabel(opt.contentMd),
      })),
    };
  }

  // choice multiple
  if (uiKind === "forice_multiple") {
    return {
      ...base,
      forices: (q.options ?? []).map((opt) => ({
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

  // matching heading — value is the roman numeral extracted from the option's
  // contentMd (e.g. "viii" from "viii. The Spread of Coffee"), label is the
  // full content. QuestionPanel then maps this to RawQuestion.options for the
  // HeadingDropdown registry handler.
  if (uiKind === "matching_heading" && q.options?.length) {
    return {
      ...base,
      forices: q.options.map((opt) => ({
        value: opt.contentMd.split(".")[0].trim(),
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
