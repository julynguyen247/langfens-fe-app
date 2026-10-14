/**
 * LLM Prompt builder — assembles system and user prompts from schema + prose.
 *
 * Architecture:
 * - `buildSystemPrompt(type)` = `questionSchemas[type].systemProse + "\n\n" + (MATCHING_STRICT_JSON_INSTRUCTION | STRICT_JSON_INSTRUCTION)`
 * - `buildUserPrompt(type, passage, count, vars?)` = the per-type user template string
 *
 * The system prompt is driven entirely by `questionSchemas[type].systemProse` — no template
 * interpolation of role prefix or constraints. Each type's prose is the authoritative source.
 */
import { QUESTION_SCHEMAS } from "./questionSchemas";
import { STRICT_JSON_INSTRUCTION } from "./jsonShape";
import { QuestionType } from "./types";

// Sprint 7 Phase 10: prompt-format contract enforcement.
// Appended to every generated user prompt so the LLM emits canonical [N]
// placeholders in PromptMd matching BlankAcceptTexts keys (1-indexed).
const PROMPT_FORMAT_CONTRACT = `

PromptMd contract (Sprint 7 Phase 10):
- Every blank must be encoded as "[N]" (e.g. "[1]", "[2]", "[3]") — no spaces inside brackets, no underscores, no blank-q prefix.
- The N in "[N]" must be a 1-indexed integer matching a BlankAcceptTexts key.
- Do NOT use legacy placeholders like "__________", "[ 1 ]", or "blank-q1".`;

const MATCHING_TYPES: Record<string, true> = {
  [QuestionType.MatchingHeading]: true,
  [QuestionType.MatchingInformation]: true,
  [QuestionType.MatchingFeatures]: true,
  [QuestionType.MatchingEndings]: true,
};

const MATCHING_STRICT_JSON_INSTRUCTION = `Output ONLY a single JSON array. No prose, no markdown fences outside the JSON block, no explanation. Each item is a complete question payload and MUST include BOTH "options" (the choice pool) and "matchPairs" (the correct mappings).

If the JSON cannot be produced, output {"error": "reason"} instead.`;

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
  const suffix = MATCHING_TYPES[type]
    ? MATCHING_STRICT_JSON_INSTRUCTION
    : STRICT_JSON_INSTRUCTION;
  return `${schema.systemProse}\n\n${suffix}`;
}

/**
 * Builds the user prompt for a question type.
 */
export function buildUserPrompt(
  type: string,
  passage: string,
  count: number,
  _vars?: { difficulty?: string; extra?: string; skill?: string }
): string {
  const diff = _vars?.difficulty ? ` at difficulty ${_vars.difficulty}` : "";
  const extra = _vars?.extra ? `\nExtra context: ${_vars.extra}\n` : "";
  const skill = _vars?.skill || "READING";

  // Per-type user template strings
  switch (type) {
    case "CLASSIFICATION":
      return `Passage:\n"""\n${passage}\n"""\n\nGenerate ${count} CLASSIFICATION question(s). Each should have 3-4 categories and 4-6 statements derived from the passage. Output JSON array of ${count} question(s).`;

    case "MATCHING_HEADING":
      return `Passage:\n"""\n${passage}\n"""\n\nGenerate ${count} complete MATCHING_HEADING question(s) for skill ${skill}${diff}.${extra}
Each question must contain at least 2 numbered paragraph targets (e.g. '1. Paragraph 1', '2. Paragraph 2') in promptMd, a Roman numeral heading pool in promptMd (under 'List of Headings:') and options[], at least one unused distractor option, and matchPairs mapping each target number to [Roman numeral key, heading text without Roman prefix].
Output JSON array of ${count} question(s).`;

    case "MULTIPLE_CHOICE_SINGLE":
      return `Passage:\n"""\n${passage}\n"""\n\nGenerate ${count} MCQ (single answer) question(s) with 4 options each (A, B, C, D). Exactly 1 option isCorrect=true. Output JSON array.`;

    case "MULTIPLE_CHOICE_MULTIPLE":
      return `Passage:\n"""\n${passage}\n"""\n\nGenerate ${count} MCQ (multiple answer) question(s) with 5-8 options each. 2-4 options are isCorrect=true. Output JSON array.`;

    case "TRUE_FALSE_NOT_GIVEN":
      return `Passage:\n"""\n${passage}\n"""\n\nGenerate ${count} TRUE/FALSE/NOT GIVEN statement(s). Each must be ambiguous between "False" and "Not Given" so candidate must read carefully. Output JSON array.`;

    case "SUMMARY_COMPLETION":
      return `Passage:\n"""\n${passage}\n"""\n\nGenerate ${count} SUMMARY_COMPLETION question(s) with 2-4 blanks each. Output JSON array.`
      + PROMPT_FORMAT_CONTRACT;

    case "SHORT_ANSWER":
      return `Passage:\n"""\n${passage}\n"""\n\nGenerate ${count} SHORT_ANSWER question(s). Provide 1-3 acceptable answers each. Output JSON array.`;

    case "FLOW_CHART":
      return `Source:\n"""\n${passage}\n"""\n\nGenerate ${count} FLOW_CHART question(s). Each question presents 3-5 sequential process steps from the passage to be ordered chronologically. In promptMd, clearly describe the process and list available steps (A, B, C, D) separated by blank lines. Set orderCorrects to the list of step slugs in the correct chronological order (lowercase, hyphenated, e.g. ["collect-materials", "soak-fibres", "press-sheets"]). Do not include [N] blanks or BlankAcceptTexts. Output JSON array.`;

    // --- Phase 2: 11 new cases ---
    case "MULTIPLE_CHOICE_SINGLE_IMAGE":
      return `Passage:\n"""\n${passage}\n"""\n\nGenerate ${count} MULTIPLE_CHOICE_SINGLE_IMAGE question(s). Each is based on an image in the passage and has 4 options (A, B, C, D). Exactly 1 option isCorrect=true. Output JSON array.`;

    case "YES_NO_NOT_GIVEN":
      return `Passage:\n"""\n${passage}\n"""\n\nGenerate ${count} YES/NO/NOT GIVEN statement(s). Each statement must be carefully constructed so the candidate must distinguish between "Yes" (confirmed by passage), "No" (contradicted by passage), and "Not Given" (neither confirmed nor contradicted). Output JSON array.`;

    case "TABLE_COMPLETION":
      return `Passage:\n"""\n${passage}\n"""\n\nGenerate ${count} TABLE_COMPLETION question(s). Each presents a table with blanks to fill from the passage. Output JSON array.`
      + PROMPT_FORMAT_CONTRACT;

    case "NOTE_COMPLETION":
      return `Passage:\n"""\n${passage}\n"""\n\nGenerate ${count} NOTE_COMPLETION question(s). Each presents notes with blanks corresponding to information from the passage. Output JSON array.`
      + PROMPT_FORMAT_CONTRACT;

    case "FORM_COMPLETION":
      return `Passage:\n"""\n${passage}\n"""\n\nGenerate ${count} FORM_COMPLETION question(s). Each presents a form with fields to complete from the passage. Output JSON array.`
      + PROMPT_FORMAT_CONTRACT;

    case "SENTENCE_COMPLETION":
      return `Passage:\n"""\n${passage}\n"""\n\nGenerate ${count} SENTENCE_COMPLETION question(s). Each sentence has one or more blanks to fill with correct answers from the passage. Output JSON array.`
      + PROMPT_FORMAT_CONTRACT;

    case "DIAGRAM_LABEL":
      return `Passage:\n"""\n${passage}\n"""\n\nGenerate ${count} DIAGRAM_LABEL question(s). Each requires labeling a diagram with information drawn from the passage. Output JSON array.`
      + PROMPT_FORMAT_CONTRACT;

    case "MAP_LABEL":
      return `Passage:\n"""\n${passage}\n"""\n\nGenerate ${count} MAP_LABEL question(s). Each requires labeling locations on a map based on information in the passage. Output JSON array.`
      + PROMPT_FORMAT_CONTRACT;

    case "MATCHING_INFORMATION":
      return `Passage:\n"""\n${passage}\n"""\n\nGenerate ${count} complete MATCHING_INFORMATION question(s) for skill ${skill}${diff}.${extra}
Each question must contain at least 2 numbered information statements (e.g. '1. Statement text') in promptMd, options[] listing paragraph options formatted as 'A. Paragraph A', 'B. Paragraph B', etc. with at least one unused distractor option, and matchPairs mapping each statement number to [paragraph letter, exact statement text].
Output JSON array of ${count} question(s).`;

    case "MATCHING_FEATURES":
      return `Passage:\n"""\n${passage}\n"""\n\nGenerate ${count} complete MATCHING_FEATURES question(s) for skill ${skill}${diff}.${extra}
Each question must contain at least 2 numbered items or groups (e.g. '1. Item text') in promptMd, options[] listing lettered features ('A. Feature text', 'B. ...') with at least one unused distractor option, and matchPairs mapping each item number to [feature letter, exact item text].
Output JSON array of ${count} question(s).`;

    case "MATCHING_ENDINGS":
      return `Passage:\n"""\n${passage}\n"""\n\nGenerate ${count} complete MATCHING_ENDINGS question(s) for skill ${skill}${diff}.${extra}
Each question must contain at least 2 numbered sentence beginnings (e.g. '1. Beginning text...') in promptMd, options[] listing lettered endings ('A. ...ending text', 'B. ...') with at least one unused distractor option, distinct endings across targets forming meaningful sentences, and matchPairs mapping each beginning number to [ending letter, exact beginning text].
Output JSON array of ${count} question(s).`;

    default:
      throw new Error(`buildUserPrompt: unknown type "${type}"`);
  }
}
