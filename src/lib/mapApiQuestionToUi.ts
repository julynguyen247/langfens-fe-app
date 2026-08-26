import { Question } from "@/app/do-test/[skill]/[attemptId]/components/common/QuestionPanel";
import type { QuestionTypeSlug } from "@langfens/question-schema";

type ApiOption = {
  id: string;
  idx: number;
  contentMd: string;
};

type ApiQuestion = {
  id: string;
  idx: number;
  type: QuestionTypeSlug | string;
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

/**
 * MATCHING_INFORMATION has two real render variants:
 *   - "Word List" blanks (the BE injects `**Word List:**` + `___` runs and
 *     ships a structured `wordList`); rendered by WordListCompletionCard.
 *   - Paragraph-match A-F inputs (no word list, just a stem with blanks);
 *     rendered inline by QuestionPanel as an A-F single-letter input.
 *
 * The BE sends the same `type` for both — the prompt tells us apart.
 */
function isWordListBlank(promptMd: string): boolean {
  const s = promptMd ?? "";
  return s.includes("**Word List:**") && s.includes("___");
}

export function mapApiQuestionToUi(q: ApiQuestion): Question {
  const isMatchingWordList =
    q.type === "MATCHING_INFORMATION" && isWordListBlank(q.promptMd);

  const base: Question = {
    id: q.id,
    stem: q.promptMd,
    backendType: q.type as QuestionTypeSlug,
    explanationMd: q.explanationMd,
  };

  // Radio-forice: derive forices from `options`.
  const radioSlugs: QuestionTypeSlug[] = [
    "TRUE_FALSE_NOT_GIVEN",
    "YES_NO_NOT_GIVEN",
    "MULTIPLE_CHOICE_SINGLE",
    "MULTIPLE_CHOICE_SINGLE_IMAGE",
    "CLASSIFICATION",
  ];
  if (radioSlugs.includes(q.type as QuestionTypeSlug)) {
    return {
      ...base,
      forices: (q.options ?? []).map((opt) => ({
        value: opt.id,
        label: normalizeOptionLabel(opt.contentMd),
      })),
    };
  }

  // Checkbox-forice: derive forices from `options`.
  if (q.type === "MULTIPLE_CHOICE_MULTIPLE") {
    return {
      ...base,
      forices: (q.options ?? []).map((opt) => ({
        value: opt.id,
        label: normalizeOptionLabel(opt.contentMd),
      })),
    };
  }

  // Flow chart: pass through structured nodes.
  if (q.type === "FLOW_CHART") {
    return {
      ...base,
      flowChartNodes: q.flowChartNodes ?? [],
    };
  }

  // Matching heading — value is the roman numeral extracted from the option's
  // contentMd (e.g. "viii" from "viii. The Spread of Coffee"), label is the
  // full content. QuestionPanel then maps this to RawQuestion.options for the
  // HeadingDropdown registry handler.
  if (q.type === "MATCHING_HEADING" && q.options?.length) {
    return {
      ...base,
      forices: q.options.map((opt) => ({
        value: opt.contentMd.split(".")[0].trim(),
        label: opt.contentMd,
      })),
    };
  }

  // matching_information_wordlist: WordListCompletionCard reads `wordList`
  // straight off the question — no choices to derive here. Leave `base` bare
  // so the registry handler can pull wordList via RawQuestion.
  if (isMatchingWordList) {
    return base;
  }

  // matching_information_paragraph (A-F single-letter input rendered inline
  // by QuestionPanel) and all completion types: nothing extra to attach.
  return base;
}