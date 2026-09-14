/**
 * LLM Prompt builder — assembles system and user prompts from schema + prose.
 *
 * Architecture:
 * - `buildSystemPrompt(type)` = `questionSchemas[type].systemProse + "\n\n" + STRICT_JSON_INSTRUCTION`
 * - `buildUserPrompt(type, passage, count, vars?)` = the per-type user template string
 *
 * The system prompt is driven entirely by `questionSchemas[type].systemProse` — no template
 * interpolation of role prefix or constraints. Each type's prose is the authoritative source.
 */
import { QUESTION_SCHEMAS } from "./questionSchemas";
import { STRICT_JSON_INSTRUCTION } from "./jsonShape";

/**
 * Builds the system prompt for a question type.
 * @throws if no QUESTION_SCHEMAS entry exists for the given type
 */
export function buildSystemPrompt(type: string): string {
  const schema = QUESTION_SCHEMAS[type];
  if (!schema) throw new Error(`No QUESTION_SCHEMAS entry for type "${type}"`);
  if (!schema.systemProse) {
    throw new Error(
      `QuestionSchema for "${type}" is missing the systemProse field required by buildSystemPrompt`
    );
  }
  return `${schema.systemProse}\n\n${STRICT_JSON_INSTRUCTION}`;
}

/**
 * Builds the user prompt for a question type.
 * The _vars parameter is accepted for future use (Phase 6 difficulty/extra support) but
 * currently all 8 types use verbatim strings with no interpolation.
 */
export function buildUserPrompt(
  type: string,
  passage: string,
  count: number,
  _vars?: { difficulty?: string; extra?: string }
): string {
  // Per-type user template strings — verbatim from the existing llmPrompts.ts entries.
  switch (type) {
    case "CLASSIFICATION":
      return `Passage:\n"""\n${passage}\n"""\n\nGenerate ${count} CLASSIFICATION question(s). Each should have 3-4 categories and 4-6 statements derived from the passage. Output JSON array of ${count} question(s).`;

    case "MATCHING_HEADING":
      return `Passage:\n"""\n${passage}\n"""\n\nGenerate ${count} MATCHING_HEADING question(s) covering all paragraphs. Output JSON array.`;

    case "MULTIPLE_CHOICE_SINGLE":
      return `Passage:\n"""\n${passage}\n"""\n\nGenerate ${count} MCQ (single answer) question(s) with 4 options each (A, B, C, D). Exactly 1 option isCorrect=true. Output JSON array.`;

    case "MULTIPLE_CHOICE_MULTIPLE":
      return `Passage:\n"""\n${passage}\n"""\n\nGenerate ${count} MCQ (multiple answer) question(s) with 5-8 options each. 2-4 options are isCorrect=true. Output JSON array.`;

    case "TRUE_FALSE_NOT_GIVEN":
      return `Passage:\n"""\n${passage}\n"""\n\nGenerate ${count} TRUE/FALSE/NOT GIVEN statement(s). Each must be ambiguous between "False" and "Not Given" so candidate must read carefully. Output JSON array.`;

    case "SUMMARY_COMPLETION":
      return `Passage:\n"""\n${passage}\n"""\n\nGenerate ${count} SUMMARY_COMPLETION question(s) with 2-4 blanks each. Output JSON array.`;

    case "SHORT_ANSWER":
      return `Passage:\n"""\n${passage}\n"""\n\nGenerate ${count} SHORT_ANSWER question(s). Provide 1-3 acceptable answers each. Output JSON array.`;

    case "FLOW_CHART":
      return `Source:\n"""\n${passage}\n"""\n\nGenerate ${count} FLOW_CHART question(s) with 3-5 sequential steps. Output JSON array.`;

    default:
      throw new Error(`buildUserPrompt: unknown type "${type}"`);
  }
}
