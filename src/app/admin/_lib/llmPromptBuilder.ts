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

// Sprint 7 Phase 10: prompt-format contract enforcement.
// Appended to every generated user prompt so the LLM emits canonical [N]
// placeholders in PromptMd matching BlankAcceptTexts keys (1-indexed).
const PROMPT_FORMAT_CONTRACT = `

PromptMd contract (Sprint 7 Phase 10):
- Every blank must be encoded as "[N]" (e.g. "[1]", "[2]", "[3]") — no spaces inside brackets, no underscores, no blank-q prefix.
- The N in "[N]" must be a 1-indexed integer matching a BlankAcceptTexts key.
- Do NOT use legacy placeholders like "__________", "[ 1 ]", or "blank-q1".`;

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
      return `Passage:\n"""\n${passage}\n"""\n\nGenerate ${count} MATCHING_INFORMATION question(s). Each requires matching statements to paragraphs or sections of the passage. Output JSON array.`;

    case "MATCHING_FEATURES":
      return `Passage:\n"""\n${passage}\n"""\n\nGenerate ${count} MATCHING_FEATURES question(s). Each requires matching features or characteristics as described in the passage. Output JSON array.`;

    case "MATCHING_ENDINGS":
      return `Passage:\n"""\n${passage}\n"""\n\nGenerate ${count} MATCHING_ENDINGS question(s). Each requires selecting the correct sentence endings from options provided. Output JSON array.`;

    default:
      throw new Error(`buildUserPrompt: unknown type "${type}"`);
  }
  // Sprint 7 Phase 10: unreachable — all branches return; placeholder for
  // clarity. Real returns above already include PROMPT_FORMAT_CONTRACT via the
  // switch body. Keep this block dead for future types that may throw.
}
