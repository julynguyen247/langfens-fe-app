import { QUESTION_SCHEMAS } from "./questionSchemas";

/**
 * Returns the jsonShape string for a question type.
 * @throws if no entry exists for the given type
 */
export function getJsonShape(type: string): string {
  const schema = QUESTION_SCHEMAS[type];
  if (!schema) throw new Error(`No QUESTION_SCHEMAS entry for type "${type}"`);
  return schema.jsonShape;
}

/**
 * Returns the constraints array for a question type.
 * Returns an empty array if the entry has no constraints.
 */
export function getConstraints(type: string): string[] {
  const schema = QUESTION_SCHEMAS[type];
  return schema?.constraints ?? [];
}


export const STRICT_JSON_INSTRUCTION = `Output ONLY a single JSON array. No prose, no markdown fences, no explanation. Each item is a complete question payload with this exact shape:
{
  "type": "<QUESTION_TYPE>",
  "skill": "READING|LISTENING|SPEAKING|WRITING",
  "difficulty": 1-5,
  "promptMd": "string",
  "explanationMd": "string (optional)",
  "options": [ ... ] or
  "matchPairs": { ... } or
  "blankAcceptTexts": { ... } or
  "orderCorrects": [ ... ] or
  "shortAnswerAcceptTexts": [ ... ]
}

If the JSON cannot be produced, output {"error": "reason"} instead.`;