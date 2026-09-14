/**
 * LLM Prompt templates for the 8 question types that support AI authoring.
 *
 * All system/user prompts are now driven by `buildSystemPrompt` and `buildUserPrompt`
 * from `./llmPromptBuilder`, which source their prose from `questionSchemas[type].systemProse`.
 *
 * These delegates produce byte-identical output to the original inline strings
 * (verified by `__tests__/jsonShape.test.ts` snapshots).
 */
import { buildSystemPrompt, buildUserPrompt } from "./llmPromptBuilder";
import { QuestionType } from "./types";

export interface LlmPromptTemplate {
  system: string;
  userTemplate: (passage: string, n: number, extra?: Record<string, string>) => string;
  fewShotExamples?: string[];
}

/** Re-exported so consumers that need the verbatim constant can import it. */
export { STRICT_JSON_INSTRUCTION } from "./jsonShape";

export const LLM_PROMPTS: Record<string, LlmPromptTemplate> = {
  CLASSIFICATION: {
    system: buildSystemPrompt(QuestionType.Classification),
    userTemplate: (passage, n) => buildUserPrompt("CLASSIFICATION", passage, n),
  },
  MATCHING_HEADING: {
    system: buildSystemPrompt(QuestionType.MatchingHeading),
    userTemplate: (passage, n) => buildUserPrompt("MATCHING_HEADING", passage, n),
  },
  MULTIPLE_CHOICE_SINGLE: {
    system: buildSystemPrompt(QuestionType.MultipleChoiceSingle),
    userTemplate: (passage, n) => buildUserPrompt("MULTIPLE_CHOICE_SINGLE", passage, n),
  },
  MULTIPLE_CHOICE_MULTIPLE: {
    system: buildSystemPrompt(QuestionType.MultipleChoiceMultiple),
    userTemplate: (passage, n) => buildUserPrompt("MULTIPLE_CHOICE_MULTIPLE", passage, n),
  },
  TRUE_FALSE_NOT_GIVEN: {
    system: buildSystemPrompt(QuestionType.TrueFalseNotGiven),
    userTemplate: (passage, n) => buildUserPrompt("TRUE_FALSE_NOT_GIVEN", passage, n),
  },
  SUMMARY_COMPLETION: {
    system: buildSystemPrompt(QuestionType.SummaryCompletion),
    userTemplate: (passage, n) => buildUserPrompt("SUMMARY_COMPLETION", passage, n),
  },
  SHORT_ANSWER: {
    system: buildSystemPrompt(QuestionType.ShortAnswer),
    userTemplate: (passage, n) => buildUserPrompt("SHORT_ANSWER", passage, n),
  },
  FLOW_CHART: {
    system: buildSystemPrompt(QuestionType.FlowChart),
    userTemplate: (passage, n) => buildUserPrompt("FLOW_CHART", passage, n),
  },
};

export function getLlmPrompt(type: string): LlmPromptTemplate | null {
  return LLM_PROMPTS[type] || null;
}
