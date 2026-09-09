export interface LlmPromptTemplate {
  system: string;
  userTemplate: (passage: string, n: number, extra?: Record<string, string>) => string;
  fewShotExamples?: string[];
}

const STRICT_JSON_INSTRUCTION = `Output ONLY a single JSON array. No prose, no markdown fences, no explanation. Each item is a complete question payload with this exact shape:
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

export const LLM_PROMPTS: Record<string, LlmPromptTemplate> = {
  CLASSIFICATION: {
    system: `You are an IELTS Reading content author. Generate CLASSIFICATION questions with 3-4 categories and 4-6 statements. The promptMd MUST follow this exact format:
"Classify the following as referring to:\\nA. <category 1>\\nB. <category 2>\\nC. <category 3>\\n\\n1. <statement 1>\\n2. <statement 2>\\n3. <statement 3>"

matchPairs is keyed by zero-based statement index: {"0": ["A"], "1": ["B"], "2": ["C"]}
options[] must contain the categories as "A. label", "B. label", "C. label".

${STRICT_JSON_INSTRUCTION}`,
    userTemplate: (passage, n) =>
      `Passage:\n"""\n${passage}\n"""\n\nGenerate ${n} CLASSIFICATION question(s). Each should have 3-4 categories and 4-6 statements derived from the passage. Output JSON array of ${n} question(s).`,
  },

  MATCHING_HEADING: {
    system: `You are an IELTS Reading content author. Generate MATCHING_HEADING questions: choose a heading for each paragraph.

JSON shape:
{
  "type": "MATCHING_HEADING",
  "skill": "READING",
  "difficulty": 2-4,
  "promptMd": "Choose a heading for each paragraph.",
  "options": [
    { "contentMd": "i. The Early Years" },
    { "contentMd": "ii. The Modern Period" }
  ],
  "matchPairs": {
    "A": ["i", "Paragraph A excerpt"],
    "B": ["ii", "Paragraph B excerpt"]
  }
}

matchPairs keys are paragraph letters (A, B, C, …).
matchPairs values[0] is the Roman numeral heading (i, ii, iii).
options[] is the heading pool.
promptMd should include the passage (or reference it).

${STRICT_JSON_INSTRUCTION}`,
    userTemplate: (passage, n) =>
      `Passage:\n"""\n${passage}\n"""\n\nGenerate ${n} MATCHING_HEADING question(s) covering all paragraphs. Output JSON array.`,
  },

  MULTIPLE_CHOICE_SINGLE: {
    system: `You are an IELTS content author. Generate MULTIPLE_CHOICE_SINGLE questions with exactly 1 correct option.

JSON shape:
{
  "type": "MULTIPLE_CHOICE_SINGLE",
  "skill": "READING",
  "difficulty": 1-3,
  "promptMd": "Question stem?",
  "options": [
    { "contentMd": "A. First option", "isCorrect": false },
    { "contentMd": "B. Second option", "isCorrect": true }
  ]
}

${STRICT_JSON_INSTRUCTION}`,
    userTemplate: (passage, n) =>
      `Passage:\n"""\n${passage}\n"""\n\nGenerate ${n} MCQ (single answer) question(s) with 4 options each (A, B, C, D). Exactly 1 option isCorrect=true. Output JSON array.`,
  },

  MULTIPLE_CHOICE_MULTIPLE: {
    system: `You are an IELTS content author. Generate MULTIPLE_CHOICE_MULTIPLE questions (e.g. "Choose THREE letters A-H").

JSON shape:
{
  "type": "MULTIPLE_CHOICE_MULTIPLE",
  "skill": "READING",
  "difficulty": 3-4,
  "promptMd": "Which THREE of the following are mentioned?",
  "options": [
    { "contentMd": "A. Item 1", "isCorrect": true },
    { "contentMd": "B. Item 2", "isCorrect": false }
  ]
}

${STRICT_JSON_INSTRUCTION}`,
    userTemplate: (passage, n) =>
      `Passage:\n"""\n${passage}\n"""\n\nGenerate ${n} MCQ (multiple answer) question(s) with 5-8 options each. 2-4 options are isCorrect=true. Output JSON array.`,
  },

  TRUE_FALSE_NOT_GIVEN: {
    system: `You are an IELTS Reading content author. Generate TRUE_FALSE_NOT_GIVEN questions.

JSON shape:
{
  "type": "TRUE_FALSE_NOT_GIVEN",
  "skill": "READING",
  "difficulty": 2-3,
  "promptMd": "Statement to evaluate.",
  "options": [
    { "contentMd": "True", "isCorrect": true },
    { "contentMd": "False", "isCorrect": false },
    { "contentMd": "Not Given", "isCorrect": false }
  ]
}

${STRICT_JSON_INSTRUCTION}`,
    userTemplate: (passage, n) =>
      `Passage:\n"""\n${passage}\n"""\n\nGenerate ${n} TRUE/FALSE/NOT GIVEN statement(s). Each must be ambiguous between "False" and "Not Given" so candidate must read carefully. Output JSON array.`,
  },

  SUMMARY_COMPLETION: {
    system: `You are an IELTS content author. Generate SUMMARY_COMPLETION questions.

JSON shape:
{
  "type": "SUMMARY_COMPLETION",
  "skill": "READING",
  "difficulty": 2-3,
  "promptMd": "Complete the summary below using words from the passage.\\n\\nThe moon orbits the [1] every [2] days.",
  "blankAcceptTexts": {
    "0": ["earth", "Earth"],
    "1": ["27", "twenty-seven"]
  }
}

promptMd MUST contain [1], [2]… placeholders.
blankAcceptTexts keys are '0', '1', … matching the placeholder index.
Each blank value is string[] of acceptable spellings.

${STRICT_JSON_INSTRUCTION}`,
    userTemplate: (passage, n) =>
      `Passage:\n"""\n${passage}\n"""\n\nGenerate ${n} SUMMARY_COMPLETION question(s) with 2-4 blanks each. Output JSON array.`,
  },

  SHORT_ANSWER: {
    system: `You are an IELTS content author. Generate SHORT_ANSWER questions (no choices, free text).

JSON shape:
{
  "type": "SHORT_ANSWER",
  "skill": "READING",
  "difficulty": 2-3,
  "promptMd": "What percentage...?",
  "shortAnswerAcceptTexts": ["15", "fifteen", "15%"]
}

${STRICT_JSON_INSTRUCTION}`,
    userTemplate: (passage, n) =>
      `Passage:\n"""\n${passage}\n"""\n\nGenerate ${n} SHORT_ANSWER question(s). Provide 1-3 acceptable answers each. Output JSON array.`,
  },

  FLOW_CHART: {
    system: `You are an IELTS content author. Generate FLOW_CHART questions (order steps).

JSON shape:
{
  "type": "FLOW_CHART",
  "skill": "LISTENING",
  "difficulty": 3,
  "promptMd": "Complete the flow chart below.",
  "orderCorrects": ["step-one", "step-two", "step-three"]
}

orderCorrects must be slug-like (lowercase, hyphens).
Must have 2-6 unique steps.

${STRICT_JSON_INSTRUCTION}`,
    userTemplate: (passage, n) =>
      `Source:\n"""\n${passage}\n"""\n\nGenerate ${n} FLOW_CHART question(s) with 3-5 sequential steps. Output JSON array.`,
  },

};

export function getLlmPrompt(type: string): LlmPromptTemplate | null {
  return LLM_PROMPTS[type] || null;
}
