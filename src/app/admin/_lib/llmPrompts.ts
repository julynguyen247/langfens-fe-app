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
    userTemplate: (passage, n, vars) => buildUserPrompt("CLASSIFICATION", passage, n, vars as { difficulty: string; extra?: string }),
  },
  MATCHING_HEADING: {
    system: buildSystemPrompt(QuestionType.MatchingHeading),
    userTemplate: (passage, n, vars) => buildUserPrompt("MATCHING_HEADING", passage, n, vars as { difficulty: string; extra?: string }),
  },
  MULTIPLE_CHOICE_SINGLE: {
    system: buildSystemPrompt(QuestionType.MultipleChoiceSingle),
    userTemplate: (passage, n, vars) => buildUserPrompt("MULTIPLE_CHOICE_SINGLE", passage, n, vars as { difficulty: string; extra?: string }),
  },
  MULTIPLE_CHOICE_MULTIPLE: {
    system: buildSystemPrompt(QuestionType.MultipleChoiceMultiple),
    userTemplate: (passage, n, vars) => buildUserPrompt("MULTIPLE_CHOICE_MULTIPLE", passage, n, vars as { difficulty: string; extra?: string }),
  },
  TRUE_FALSE_NOT_GIVEN: {
    system: buildSystemPrompt(QuestionType.TrueFalseNotGiven),
    userTemplate: (passage, n, vars) => buildUserPrompt("TRUE_FALSE_NOT_GIVEN", passage, n, vars as { difficulty: string; extra?: string }),
  },
  SUMMARY_COMPLETION: {
    system: buildSystemPrompt(QuestionType.SummaryCompletion),
    userTemplate: (passage, n, vars) => buildUserPrompt("SUMMARY_COMPLETION", passage, n, vars as { difficulty: string; extra?: string }),
  },
  SHORT_ANSWER: {
    system: buildSystemPrompt(QuestionType.ShortAnswer),
    userTemplate: (passage, n, vars) => buildUserPrompt("SHORT_ANSWER", passage, n, vars as { difficulty: string; extra?: string }),
  },
  FLOW_CHART: {
    system: buildSystemPrompt(QuestionType.FlowChart),
    userTemplate: (passage, n, vars) => buildUserPrompt("FLOW_CHART", passage, n, vars as { difficulty: string; extra?: string }),
  },
  // --- Phase 2: 11 new entries ---
  MULTIPLE_CHOICE_SINGLE_IMAGE: {
    system: buildSystemPrompt(QuestionType.MultipleChoiceSingleImage),
    userTemplate: (passage, n, vars) => buildUserPrompt("MULTIPLE_CHOICE_SINGLE_IMAGE", passage, n, vars as { difficulty: string; extra?: string }),
  },
  YES_NO_NOT_GIVEN: {
    system: buildSystemPrompt(QuestionType.YesNoNotGiven),
    userTemplate: (passage, n, vars) => buildUserPrompt("YES_NO_NOT_GIVEN", passage, n, vars as { difficulty: string; extra?: string }),
  },
  TABLE_COMPLETION: {
    system: buildSystemPrompt(QuestionType.TableCompletion),
    userTemplate: (passage, n, vars) => buildUserPrompt("TABLE_COMPLETION", passage, n, vars as { difficulty: string; extra?: string }),
  },
  NOTE_COMPLETION: {
    system: buildSystemPrompt(QuestionType.NoteCompletion),
    userTemplate: (passage, n, vars) => buildUserPrompt("NOTE_COMPLETION", passage, n, vars as { difficulty: string; extra?: string }),
  },
  FORM_COMPLETION: {
    system: buildSystemPrompt(QuestionType.FormCompletion),
    userTemplate: (passage, n, vars) => buildUserPrompt("FORM_COMPLETION", passage, n, vars as { difficulty: string; extra?: string }),
  },
  SENTENCE_COMPLETION: {
    system: buildSystemPrompt(QuestionType.SentenceCompletion),
    userTemplate: (passage, n, vars) => buildUserPrompt("SENTENCE_COMPLETION", passage, n, vars as { difficulty: string; extra?: string }),
  },
  DIAGRAM_LABEL: {
    system: buildSystemPrompt(QuestionType.DiagramLabel),
    userTemplate: (passage, n, vars) => buildUserPrompt("DIAGRAM_LABEL", passage, n, vars as { difficulty: string; extra?: string }),
  },
  MAP_LABEL: {
    system: buildSystemPrompt(QuestionType.MapLabel),
    userTemplate: (passage, n, vars) => buildUserPrompt("MAP_LABEL", passage, n, vars as { difficulty: string; extra?: string }),
  },
  MATCHING_INFORMATION: {
    system: buildSystemPrompt(QuestionType.MatchingInformation),
    userTemplate: (passage, n, vars) => buildUserPrompt("MATCHING_INFORMATION", passage, n, vars as { difficulty: string; extra?: string }),
  },
  MATCHING_FEATURES: {
    system: buildSystemPrompt(QuestionType.MatchingFeatures),
    userTemplate: (passage, n, vars) => buildUserPrompt("MATCHING_FEATURES", passage, n, vars as { difficulty: string; extra?: string }),
  },
  MATCHING_ENDINGS: {
    system: buildSystemPrompt(QuestionType.MatchingEndings),
    userTemplate: (passage, n, vars) => buildUserPrompt("MATCHING_ENDINGS", passage, n, vars as { difficulty: string; extra?: string }),
  },
};

export function getLlmPrompt(type: string): LlmPromptTemplate | null {
  return LLM_PROMPTS[type] || null;
}
