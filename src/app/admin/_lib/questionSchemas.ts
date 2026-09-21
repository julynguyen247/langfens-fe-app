import { QuestionType } from "./types";

export interface QuestionSchema {
  type: string;
  label: string;
  description: string;
  requiredFields: string[];
  optionalFields: string[];
  examplePayload: Record<string, unknown>;
  jsonShape: string;
  constraints: string[];
  systemProse?: string;
}
/**
 * Invariant: All ordinals across the platform are strictly 1-indexed.
 * - Idx: 1-based ordinal (1, 2, 3...)
 * - BlankAcceptTexts: 1-based keys ("1", "2"...)
 * - Options: idx >= 1
 */
const commonFields = ["SectionId", "Idx", "Type", "Skill", "Difficulty", "PromptMd"];
const optionalCommon = ["ExplanationMd", "ImageUrl"];
export const QUESTION_SCHEMAS: Record<string, QuestionSchema> = {
  [QuestionType.MultipleChoiceSingle]: {
    type: QuestionType.MultipleChoiceSingle,
    label: "Multiple Choice (Single)",
    description: "Pick exactly one correct option from A, B, C, D.",
    requiredFields: [...commonFields],
    optionalFields: [...optionalCommon],
    jsonShape: `{
  "type": "MULTIPLE_CHOICE_SINGLE",
  "skill": "READING",
  "difficulty": 2,
  "promptMd": "What is the main idea of paragraph 2?",
  "explanationMd": "The passage states...",
  "options": [
    { "contentMd": "A. The moon's orbit", "isCorrect": false },
    { "contentMd": "B. The sun's energy", "isCorrect": true }
  ]
}`,
    examplePayload: {
      type: "MULTIPLE_CHOICE_SINGLE",
      skill: "READING",
      difficulty: 2,
      promptMd: "What is the main idea of paragraph 2?",
      options: [
        { contentMd: "A. The moon's orbit", isCorrect: false },
        { contentMd: "B. The sun's energy", isCorrect: true },
      ],
    },
    constraints: [
      "options[] must have exactly 1 with isCorrect=true (single answer)",
      "options[].contentMd should follow 'A. text', 'B. text' convention",
    ],
    systemProse: `You are an IELTS content author. Generate MULTIPLE_CHOICE_SINGLE questions with exactly 1 correct option.

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
}`,
  },

  [QuestionType.MultipleChoiceMultiple]: {
    type: QuestionType.MultipleChoiceMultiple,
    label: "Multiple Choice (Multiple)",
    description: "Choose N correct options (e.g. Choose THREE letters A-H).",
    requiredFields: [...commonFields],
    optionalFields: [...optionalCommon],
    jsonShape: `{
  "type": "MULTIPLE_CHOICE_MULTIPLE",
  "skill": "READING",
  "difficulty": 3,
  "promptMd": "Which THREE of the following are mentioned?",
  "options": [
    { "contentMd": "A. Item one", "isCorrect": true },
    { "contentMd": "B. Item two", "isCorrect": false }
  ]
}`,
    examplePayload: {
      type: "MULTIPLE_CHOICE_MULTIPLE",
      skill: "READING",
      difficulty: 3,
      promptMd: "Which THREE of the following are mentioned?",
      options: [
        { contentMd: "A. Item one", isCorrect: true },
        { contentMd: "B. Item two", isCorrect: false },
      ],
    },
    constraints: [
      "options[] must have 2+ with isCorrect=true",
      "options[].contentMd should follow 'A. text'...'H. text' convention",
    ],
    systemProse: `You are an IELTS content author. Generate MULTIPLE_CHOICE_MULTIPLE questions (e.g. "Choose THREE letters A-H").

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
}`,
  },

  [QuestionType.TrueFalseNotGiven]: {
    type: QuestionType.TrueFalseNotGiven,
    label: "True / False / Not Given",
    description: "IELTS Reading: True, False, or Not Given.",
    requiredFields: [...commonFields],
    optionalFields: [...optionalCommon],
    jsonShape: `{
  "type": "TRUE_FALSE_NOT_GIVEN",
  "skill": "READING",
  "difficulty": 2,
  "promptMd": "The author argues that...",
  "options": [
    { "contentMd": "True", "isCorrect": true },
    { "contentMd": "False", "isCorrect": false },
    { "contentMd": "Not Given", "isCorrect": false }
  ]
}`,
    examplePayload: {
      type: "TRUE_FALSE_NOT_GIVEN",
      skill: "READING",
      difficulty: 2,
      promptMd: "The author argues that...",
      options: [
        { contentMd: "True", isCorrect: true },
        { contentMd: "False", isCorrect: false },
        { contentMd: "Not Given", isCorrect: false },
      ],
    },
    constraints: [
      "options[] must contain exactly 3 items: True, False, Not Given",
      "exactly 1 must be isCorrect=true",
    ],
    systemProse: `You are an IELTS Reading content author. Generate TRUE_FALSE_NOT_GIVEN questions.

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
}`,
  },

  [QuestionType.YesNoNotGiven]: {
    type: QuestionType.YesNoNotGiven,
    label: "Yes / No / Not Given",
    description: "IELTS Reading opinion-based.",
    requiredFields: [...commonFields],
    optionalFields: [...optionalCommon],
    jsonShape: `{
  "type": "YES_NO_NOT_GIVEN",
  "skill": "READING",
  "difficulty": 2,
  "promptMd": "The author believes...",
  "options": [
    { "contentMd": "Yes", "isCorrect": true },
    { "contentMd": "No", "isCorrect": false },
    { "contentMd": "Not Given", "isCorrect": false }
  ]
}`,
    examplePayload: {
      type: "YES_NO_NOT_GIVEN",
      skill: "READING",
      difficulty: 2,
      promptMd: "The author believes...",
      options: [
        { contentMd: "Yes", isCorrect: true },
        { contentMd: "No", isCorrect: false },
        { contentMd: "Not Given", isCorrect: false },
      ],
    },
    constraints: [
      "options[] must contain exactly 3 items: Yes, No, Not Given",
      "exactly 1 must be isCorrect=true",
    ],
    systemProse: `You are an IELTS Reading content author. Generate YES_NO_NOT_GIVEN questions (opinion vs facts).

JSON shape:
{
  "type": "YES_NO_NOT_GIVEN",
  "skill": "READING",
  "difficulty": 2-3,
  "promptMd": "Statement to evaluate.",
  "options": [
    { "contentMd": "Yes", "isCorrect": true },
    { "contentMd": "No", "isCorrect": false },
    { "contentMd": "Not Given", "isCorrect": false }
  ]
}

Each statement requires the candidate to decide if the author's opinion matches: Yes (author agrees), No (author disagrees), Not Given (no opinion stated).`,
  },

  [QuestionType.MultipleChoiceSingleImage]: {
    type: QuestionType.MultipleChoiceSingleImage,
    label: "Multiple Choice (Image)",
    description: "MCQ where options include images.",
    requiredFields: [...commonFields],
    optionalFields: [...optionalCommon],
    jsonShape: `{
  "type": "MULTIPLE_CHOICE_SINGLE_IMAGE",
  "skill": "LISTENING",
  "difficulty": 3,
  "promptMd": "Which image matches the description?",
  "options": [
    { "contentMd": "A. Option 1", "imageUrl": "https://.../1.png", "altText": "...", "isCorrect": true }
  ]
}`,
    examplePayload: {
      type: "MULTIPLE_CHOICE_SINGLE_IMAGE",
      skill: "LISTENING",
      difficulty: 3,
      promptMd: "Which image matches the description?",
      options: [
        { contentMd: "A. Option 1", imageUrl: "https://.../1.png", altText: "...", isCorrect: true },
      ],
    },
    constraints: [
      "options[].imageUrl is recommended for image-based MCQ",
      "options[].altText is required when imageUrl is set (a11y)",
    ],
    systemProse: `You are an IELTS content author. Generate MULTIPLE_CHOICE_SINGLE_IMAGE questions with an image context and exactly 1 correct option.

JSON shape:
{
  "type": "MULTIPLE_CHOICE_SINGLE_IMAGE",
  "skill": "LISTENING",
  "difficulty": 2-3,
  "promptMd": "Which image matches the description?",
  "options": [
    { "contentMd": "A. Option 1", "imageUrl": "https://.../1.png", "altText": "...", "isCorrect": true },
    { "contentMd": "B. Option 2", "imageUrl": "https://.../2.png", "altText": "...", "isCorrect": false }
  ]
}

Exactly 1 option must be isCorrect=true.`,
  },

  [QuestionType.SummaryCompletion]: {
    type: QuestionType.SummaryCompletion,
    label: "Summary Completion",
    description: "Fill blanks in a summary.",
    requiredFields: [...commonFields],
    optionalFields: [...optionalCommon],
    jsonShape: `{
  "type": "SUMMARY_COMPLETION",
  "skill": "READING",
  "difficulty": 2,
  "promptMd": "Complete the summary:\\n\\nThe moon orbits the [1] every [2] days.",
  "blankAcceptTexts": {
    "1": ["earth", "Earth"],
    "2": ["27", "twenty-seven"]
  }
}`,
    examplePayload: {
      type: "SUMMARY_COMPLETION",
      skill: "READING",
      difficulty: 2,
      promptMd: "Complete the summary:\n\nThe moon orbits the [1] every [2] days.",
      blankAcceptTexts: {
        "1": ["earth", "Earth"],
        "2": ["27", "twenty-seven"],
      },
    },
    constraints: [
      "promptMd should contain [N] placeholders OR numbered list",
      "blankAcceptTexts keys must match placeholder indices (e.g. '1', '2'…)",
      "each blank value can be string[] (multiple acceptable spellings)",
    ],
    systemProse: `You are an IELTS content author. Generate SUMMARY_COMPLETION questions.

JSON shape:
{
  "type": "SUMMARY_COMPLETION",
  "skill": "READING",
  "difficulty": 2-3,
  "blankAcceptTexts": {
    "1": ["earth", "Earth"],
    "2": ["27", "twenty-seven"]
  }
}

promptMd MUST contain [1], [2]… placeholders.
blankAcceptTexts keys are '1', '2', … matching the placeholder index.`,
  },

  [QuestionType.TableCompletion]: {
    type: QuestionType.TableCompletion,
    label: "Table Completion",
    description: "Complete a table from the source material.",
    requiredFields: [...commonFields],
    optionalFields: [...optionalCommon],
    jsonShape: `{
  "type": "TABLE_COMPLETION",
  "skill": "READING",
  "difficulty": 3,
  "promptMd": "Complete the table:\\n\\n| Year | Sales |\\n|------|-------|\\n| 2020 | [1]   |",
  "blankAcceptTexts": { "1": ["100", "one hundred"] }
}`,
    examplePayload: {
      type: "TABLE_COMPLETION",
      skill: "READING",
      difficulty: 3,
      promptMd: "Complete the table:\n\n| Year | Sales |\n|------|-------|\n| 2020 | [1]   |",
      blankAcceptTexts: { "1": ["100", "one hundred"] },
    },
    constraints: [
      "promptMd typically contains a markdown table with [N] cells",
      "blankAcceptTexts keys match placeholder indices",
    ],
    systemProse: `You are an IELTS Reading content author. Generate TABLE_COMPLETION questions: fill in blanks in a table from the passage.

JSON shape:
{
  "type": "TABLE_COMPLETION",
  "skill": "READING",
  "difficulty": 2-3,
  "promptMd": "Complete the table:\\n\\n| Year | Sales |\\n|------|-------|\\n| 2020 | [1]   |",
  "blankAcceptTexts": { "1": ["100"] }
}

blankAcceptTexts keys match [N] placeholder indices in promptMd.`,
  },

  [QuestionType.NoteCompletion]: {
    type: QuestionType.NoteCompletion,
    label: "Note Completion",
    description: "Complete bullet/note-taking format.",
    requiredFields: [...commonFields],
    optionalFields: [...optionalCommon],
    jsonShape: `{
  "type": "NOTE_COMPLETION",
  "skill": "LISTENING",
  "difficulty": 2,
  "promptMd": "Notes:\\n- Type: [1]\\n- Capacity: [2] people",
  "blankAcceptTexts": { "1": ["workshop"], "2": ["20"] }
}`,
    examplePayload: {
      type: "NOTE_COMPLETION",
      skill: "LISTENING",
      difficulty: 2,
      promptMd: "Notes:\n- Type: [1]\n- Capacity: [2] people",
      blankAcceptTexts: { "1": ["workshop"], "2": ["20"] },
    },
    constraints: ["Same as SummaryCompletion."],
    systemProse: `You are an IELTS content author. Generate NOTE_COMPLETION questions: fill in blanks in notes from the passage.

JSON shape:
{
  "type": "NOTE_COMPLETION",
  "skill": "LISTENING",
  "difficulty": 2-3,
  "promptMd": "Notes:\\n- Type: [1]\\n- Capacity: [2] people",
  "blankAcceptTexts": { "1": ["workshop"], "2": ["20"] }
}

blankAcceptTexts keys match [N] placeholder indices in promptMd.`,
  },

  [QuestionType.FormCompletion]: {
    type: QuestionType.FormCompletion,
    label: "Form Completion",
    description: "Fill a form-style layout with key facts.",
    requiredFields: [...commonFields],
    optionalFields: [...optionalCommon],
    jsonShape: `{
  "type": "FORM_COMPLETION",
  "skill": "LISTENING",
  "difficulty": 2,
  "promptMd": "Application Form\\n\\nName: [1]\\nDate: [2]\\nRoom: [3]",
  "blankAcceptTexts": {
    "1": ["Rachel Torres", "Torres"],
    "2": ["15 September"],
    "3": ["single"]
  }
}`,
    examplePayload: {
      type: "FORM_COMPLETION",
      skill: "LISTENING",
      difficulty: 2,
      promptMd: "Application Form\n\nName: [1]\nDate: [2]\nRoom: [3]",
      blankAcceptTexts: {
        "1": ["Rachel Torres", "Torres"],
        "2": ["15 September"],
        "3": ["single"],
      },
    },
    constraints: ["Same as SummaryCompletion."],
    systemProse: `You are an IELTS content author. Generate FORM_COMPLETION questions: fill in a form with key facts from the passage.

JSON shape:
{
  "type": "FORM_COMPLETION",
  "skill": "LISTENING",
  "difficulty": 2-3,
  "promptMd": "Application Form\\n\\nName: [1]\\nDate: [2]",
  "blankAcceptTexts": { "1": ["Rachel Torres"], "2": ["15 September"] }
}

blankAcceptTexts keys match [N] placeholder indices in promptMd.`,
  },

  [QuestionType.SentenceCompletion]: {
    type: QuestionType.SentenceCompletion,
    label: "Sentence Completion",
    description: "Complete sentences with one or two words from source.",
    requiredFields: [...commonFields],
    optionalFields: [...optionalCommon],
    jsonShape: `{
  "type": "SENTENCE_COMPLETION",
  "skill": "READING",
  "promptMd": "1. Listening to music reduces [1] levels.\\n2. The brain's [2] manages emotion.",
  "blankAcceptTexts": { "1": ["cortisol"], "2": ["nucleus accumbens"] }
}`,
    examplePayload: {
      type: "SENTENCE_COMPLETION",
      skill: "READING",
      difficulty: 2,
      promptMd: "1. Listening to music reduces [1] levels.\n2. The brain's [2] manages emotion.",
      blankAcceptTexts: { "1": ["cortisol"], "2": ["nucleus accumbens"] },
    },
    constraints: ["Same as SummaryCompletion."],
    systemProse: `You are an IELTS Reading content author. Generate SENTENCE_COMPLETION questions: complete sentences with words from the passage.

JSON shape:
{
  "type": "SENTENCE_COMPLETION",
  "skill": "READING",
  "difficulty": 2-3,
  "promptMd": "1. Listening to music reduces [1] levels.\\n2. The brain's [2] manages emotion.",
  "blankAcceptTexts": { "1": ["cortisol"], "2": ["nucleus accumbens"] }
}

blankAcceptTexts keys match [N] placeholder indices in promptMd. Answers are 1-3 words from the passage.`,
  },

  [QuestionType.ShortAnswer]: {
    type: QuestionType.ShortAnswer,
    label: "Short Answer",
    description: "Single free-text answer, no choices.",
    requiredFields: [...commonFields],
    optionalFields: [...optionalCommon],
    jsonShape: `{
  "type": "SHORT_ANSWER",
  "skill": "READING",
  "difficulty": 2,
  "promptMd": "What percentage of patients showed improvement?",
  "shortAnswerAcceptTexts": ["15", "fifteen", "15%"],
  "shortAnswerAcceptRegex": ["^\\\\d+(\\\\.\\\\d+)?\\\\s*%?$"]
}`,
    examplePayload: {
      type: "SHORT_ANSWER",
      skill: "READING",
      difficulty: 2,
      promptMd: "What percentage of patients showed improvement?",
      shortAnswerAcceptTexts: ["15", "fifteen", "15%"],
      shortAnswerAcceptRegex: ["^\\d+(\\.\\d+)?\\s*%?$"],
    },
    constraints: [
      "shortAnswerAcceptTexts is compared case-insensitively",
      "shortAnswerAcceptRegex uses .NET regex syntax",
      "at least one of texts/regex must be non-empty",
    ],
    systemProse: `You are an IELTS content author. Generate SHORT_ANSWER questions (no choices, free text).

JSON shape:
{
  "type": "SHORT_ANSWER",
  "skill": "READING",
  "difficulty": 2-3,
  "promptMd": "What percentage...?",
  "shortAnswerAcceptTexts": ["15", "fifteen", "15%"]
}`,
  },

// Remove duplicate DiagramLabel constraint + duplicate MapLabel block
  [QuestionType.DiagramLabel]: {
    type: QuestionType.DiagramLabel,
    label: "Diagram Label",
    description: "Label blanks on a diagram (e.g. plant life cycle).",
    requiredFields: [...commonFields, "ImageUrl"],
    optionalFields: ["ExplanationMd"],
    jsonShape: `{
  "type": "DIAGRAM_LABEL",
  "skill": "LISTENING",
  "difficulty": 3,
  "promptMd": "Label the diagram below with [1], [2]…",
  "imageUrl": "https://.../diagram.png",
  "blankAcceptTexts": { "1": ["chloroplast"], "2": ["nucleus"] }
}`,
    examplePayload: {
      type: "DIAGRAM_LABEL",
      skill: "LISTENING",
      difficulty: 3,
      promptMd: "Label the diagram below with [1], [2]…",
      imageUrl: "https://.../diagram.png",
      blankAcceptTexts: { "1": ["chloroplast"], "2": ["nucleus"] },
    },
    constraints: [
      "imageUrl is required for DIAGRAM_LABEL",
      "promptMd should describe what to label (or be empty)",
      "blankAcceptTexts keys match placeholder indices",
    ],
    systemProse: `You are an IELTS content author. Generate DIAGRAM_LABEL questions: label parts of a diagram from the passage.

JSON shape:
{
  "type": "DIAGRAM_LABEL",
  "skill": "LISTENING",
  "difficulty": 2-3,
  "promptMd": "Label the diagram below with [1], [2]…",
  "imageUrl": "https://.../diagram.png",
  "blankAcceptTexts": { "1": ["chloroplast"], "2": ["nucleus"] }
}

imageUrl is required. blankAcceptTexts keys match [N] placeholder indices in promptMd.`,
  },

  [QuestionType.MapLabel]: {
    type: QuestionType.MapLabel,
    label: "Map Label",
    description: "Label positions on a map.",
    requiredFields: [...commonFields, "ImageUrl"],
    optionalFields: ["ExplanationMd"],
    jsonShape: `{
  "type": "MAP_LABEL",
  "skill": "LISTENING",
  "difficulty": 3,
  "promptMd": "Label positions [1] through [2] on the map.",
  "imageUrl": "https://.../map.png",
  "blankAcceptTexts": { "1": ["library"], "2": ["park"] }
}`,
    examplePayload: {
      type: "MAP_LABEL",
      skill: "LISTENING",
      difficulty: 3,
      promptMd: "Label positions [1] through [2] on the map.",
      imageUrl: "https://.../map.png",
      blankAcceptTexts: { "1": ["library"], "2": ["park"] },
    },
    constraints: [
      "imageUrl is required for MAP_LABEL",
      "blankAcceptTexts keys match placeholder indices",
    ],
    systemProse: `You are an IELTS content author. Generate MAP_LABEL questions: label locations on a map from the passage.

JSON shape:
{
  "type": "MAP_LABEL",
  "skill": "LISTENING",
  "difficulty": 2-3,
  "promptMd": "Label positions [1] through [2] on the map.",
  "imageUrl": "https://.../map.png",
  "blankAcceptTexts": { "1": ["library"], "2": ["park"] }
}

imageUrl is required. blankAcceptTexts keys match [N] placeholder indices in promptMd.`,
  },

  [QuestionType.MatchingHeading]: {
    type: QuestionType.MatchingHeading,
    label: "Matching Headings",
    description: "Match paragraphs (A, B, C) to headings (i, ii, iii, iv, v).",
    requiredFields: [...commonFields],
    optionalFields: [...optionalCommon],
    jsonShape: `{
  "type": "MATCHING_HEADING",
  "skill": "READING",
  "difficulty": 3,
  "promptMd": "Reading passage...",
  "options": [
    { "contentMd": "i. The Early Years" },
    { "contentMd": "ii. The Modern Period" }
  ],
  "matchPairs": {
    "A": ["i", "Paragraph A excerpt"],
    "B": ["ii", "Paragraph B excerpt"]
  }
}`,
    examplePayload: {
      type: "MATCHING_HEADING",
      skill: "READING",
      difficulty: 3,
      promptMd: "Reading passage...",
      options: [
        { contentMd: "i. The Early Years" },
        { contentMd: "ii. The Modern Period" },
      ],
      matchPairs: {
        A: ["i", "Paragraph A excerpt"],
        B: ["ii", "Paragraph B excerpt"],
      },
    },
    constraints: [
      "matchPairs keys = paragraph letters (A, B, C…)",
      "matchPairs values[0] = heading Roman numeral",
      "options[] = heading pool (i, ii, iii…)",
    ],
    systemProse: `You are an IELTS Reading content author. Generate MATCHING_HEADING questions: choose a heading for each paragraph.

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
promptMd should include the passage (or reference it).`,
  },

  [QuestionType.MatchingInformation]: {
    type: QuestionType.MatchingInformation,
    label: "Matching Information",
    description: "Match statements to the paragraph that contains them.",
    requiredFields: [...commonFields],
    optionalFields: [...optionalCommon],
    jsonShape: `{
  "type": "MATCHING_INFORMATION",
  "skill": "READING",
  "difficulty": 3,
  "promptMd": "14. Which paragraph mentions X?\\n15. Which paragraph describes Y?",
  "matchPairs": {
    "1": ["B", "Question 14 text"],
    "2": ["A", "Question 15 text"]
  }
}`,
    examplePayload: {
      type: "MATCHING_INFORMATION",
      skill: "READING",
      difficulty: 3,
      promptMd: "14. Which paragraph mentions X?\n15. Which paragraph describes Y?",
      matchPairs: {
        "1": ["B", "Question 14 text"],
        "2": ["A", "Question 15 text"],
      },
    },
    constraints: [
      "matchPairs keys = 1-based question index strings ('1', '2', …)",
      "matchPairs values[0] = paragraph letter (A-H)",
    ],
    systemProse: `You are an IELTS Reading content author. Generate MATCHING_INFORMATION questions: match statements to the paragraph that contains the relevant information.

JSON shape:
{
  "type": "MATCHING_INFORMATION",
  "skill": "READING",
  "difficulty": 2-3,
  "promptMd": "Which paragraph contains the following information?",
  "options": [
    { "contentMd": "A. Paragraph A text…" },
    { "contentMd": "B. Paragraph B text…" }
  ],
  "matchPairs": {
    "1": ["A", "Question 1 text"],
    "2": ["B", "Question 2 text"]
  }
}

matchPairs keys = 1-based question index strings. matchPairs values[0] = paragraph letter (A-H). options[] = paragraph pool.`,
  },

  [QuestionType.MatchingFeatures]: {
    type: QuestionType.MatchingFeatures,
    label: "Matching Features",
    description: "Match items to a list of features (A-H).",
    requiredFields: [...commonFields],
    optionalFields: [...optionalCommon],
    jsonShape: `{
  "type": "MATCHING_FEATURES",
  "skill": "READING",
  "difficulty": 3,
  "promptMd": "1. The speaker\\n2. The researcher",
  "options": [
    { "contentMd": "A. Used the method" },
    { "contentMd": "B. Criticised the theory" }
  ],
  "matchPairs": {
    "1": ["A", "The speaker"],
    "2": ["B", "The researcher"]
  }
}`,
    examplePayload: {
      type: "MATCHING_FEATURES",
      skill: "READING",
      difficulty: 3,
      promptMd: "1. The speaker\n2. The researcher",
      options: [
        { contentMd: "A. Used the method" },
        { contentMd: "B. Criticised the theory" },
      ],
      matchPairs: {
        "1": ["A", "The speaker"],
        "2": ["B", "The researcher"],
      },
    },
    constraints: [
      "options[] = feature list (A-H)",
      "matchPairs keys = 1-based item index ('1', '2', …)",
      "features can be reused across items",
    ],
    systemProse: `You are an IELTS Reading content author. Generate MATCHING_FEATURES questions: match items to their features (A-H).

JSON shape:
{
  "type": "MATCHING_FEATURES",
  "skill": "READING",
  "difficulty": 2-3,
  "promptMd": "1. The speaker\\n2. The researcher",
  "options": [
    { "contentMd": "A. Used the method" },
    { "contentMd": "B. Criticised the theory" }
  ],
  "matchPairs": {
    "1": ["A", "The speaker"],
    "2": ["B", "The researcher"]
  }
}

matchPairs keys = 1-based item index strings. matchPairs values[0] = feature letter (A-H). options[] = feature pool.`,
  },

  [QuestionType.MatchingEndings]: {
    type: QuestionType.MatchingEndings,
    label: "Matching Sentence Endings",
    description: "Match sentence beginnings to their endings.",
    requiredFields: [...commonFields],
    optionalFields: [...optionalCommon],
    jsonShape: `{
  "type": "MATCHING_ENDINGS",
  "skill": "READING",
  "difficulty": 3,
  "promptMd": "21. Despite the rain,\\n22. As the temperature rose,",
  "options": [
    { "contentMd": "A. the team continued." },
    { "contentMd": "B. the ice began to melt." }
  ],
  "matchPairs": {
    "1": ["A", "Despite the rain,"],
    "2": ["B", "As the temperature rose,"]
  }
}`,
    examplePayload: {
      type: "MATCHING_ENDINGS",
      skill: "READING",
      difficulty: 3,
      promptMd: "21. Despite the rain,\n22. As the temperature rose,",
      options: [
        { contentMd: "A. the team continued." },
        { contentMd: "B. the ice began to melt." },
      ],
      matchPairs: {
        "1": ["A", "Despite the rain,"],
        "2": ["B", "As the temperature rose,"],
      },
    },
    constraints: [
      "options[] = endings pool (A-H)",
      "matchPairs keys = 1-based beginning index ('1', '2', …)",
      "endings can only be used once (one-to-one)",
    ],
    systemProse: `You are an IELTS Reading content author. Generate MATCHING_ENDINGS questions: match sentence beginnings to their correct endings (A-H).

JSON shape:
{
  "type": "MATCHING_ENDINGS",
  "skill": "READING",
  "difficulty": 2-3,
  "promptMd": "21. Despite the rain,\\n22. As the temperature rose,",
  "options": [
    { "contentMd": "A. the team continued." },
    { "contentMd": "B. the ice began to melt." }
  ],
  "matchPairs": {
    "1": ["A", "Despite the rain,"],
    "2": ["B", "As the temperature rose,"]
  }
}

matchPairs keys = 1-based beginning index strings. matchPairs values[0] = ending letter (A-H). options[] = ending pool. Each ending used once.`,
  },

  [QuestionType.Classification]: {
    type: QuestionType.Classification,
    label: "Classification",
    description: "Classify statements into predefined categories.",
    requiredFields: [...commonFields],
    optionalFields: [...optionalCommon],
    jsonShape: `{
  "type": "CLASSIFICATION",
  "skill": "READING",
  "difficulty": 3,
  "promptMd": "Classify as:\\nA. dopamine research\\nB. cultural factors\\nC. musical training\\n\\n1. Musicians have more gray matter...\\n2. What one finds beautiful...\\n3. The brain shows...",
  "options": [
    { "contentMd": "A. dopamine research" },
    { "contentMd": "B. cultural factors" },
    { "contentMd": "C. musical training" }
  ],
  "matchPairs": {
    "1": ["C"],
    "2": ["B"],
    "3": ["A"]
  }
}`,
    examplePayload: {
      type: "CLASSIFICATION",
      skill: "READING",
      difficulty: 3,
      promptMd: "Classify as:\nA. dopamine research\nB. cultural factors\nC. musical training\n\n1. Musicians have more gray matter...\n2. What one finds beautiful...\n3. The brain shows...",
      options: [
        { contentMd: "A. dopamine research" },
        { contentMd: "B. cultural factors" },
        { contentMd: "C. musical training" },
      ],
      matchPairs: {
        "1": ["C"],
        "2": ["B"],
        "3": ["A"],
      },
    },
    constraints: [
      "promptMd MUST contain 'A. label', 'B. label' for categories and '1. text', '2. text' for statements",
      "matchPairs keys = 1-based statement index ('1', '2', …)",
      "matchPairs values[0] = category letter (A, B, C…)",
    ],
    systemProse: `You are an IELTS Reading content author. Generate CLASSIFICATION questions with 3-4 categories and 4-6 statements. The promptMd MUST follow this exact format:
"Classify the following as referring to:\nA. <category 1>\nB. <category 2>\nC. <category 3>\n\n1. <statement 1>\n2. <statement 2>\n3. <statement 3>"

matchPairs is keyed by 1-based statement index: {"1": ["A"], "2": ["B"], "3": ["C"]}
options[] must contain the categories as "A. label", "B. label", "C. label".`,
  },

  [QuestionType.FlowChart]: {
    type: QuestionType.FlowChart,
    label: "Flow Chart",
    description: "Order steps in a flow chart sequence.",
    requiredFields: [...commonFields, "OrderCorrects"],
    optionalFields: [...optionalCommon],
    jsonShape: `{
  "type": "FLOW_CHART",
  "skill": "LISTENING",
  "difficulty": 3,
  "promptMd": "Complete the flow chart below.",
  "orderCorrects": ["collect-samples", "analyze-data", "publish-results"]
}`,
    examplePayload: {
      type: "FLOW_CHART",
      skill: "LISTENING",
      difficulty: 3,
      promptMd: "Complete the flow chart below.",
      orderCorrects: ["collect-samples", "analyze-data", "publish-results"],
    },
    constraints: [
      "orderCorrects must be slug-like (lowercase, hyphenated)",
      "must have at least 2 unique steps",
    ],
    systemProse: `You are an IELTS content author. Generate FLOW_CHART questions (order steps).

JSON shape:
{
  "type": "FLOW_CHART",
  "skill": "LISTENING",
  "difficulty": 3,
  "promptMd": "Complete the flow chart below.",
  "orderCorrects": ["step-one", "step-two", "step-three"]
}

orderCorrects must be slug-like (lowercase, hyphens).
Must have 2-6 unique steps.`,
  },

};

export function getSchema(type: string): QuestionSchema {
  return (
    QUESTION_SCHEMAS[type] || {
      type,
      label: type,
      description: "Custom question type.",
      requiredFields: [...commonFields],
      optionalFields: [...optionalCommon],
      jsonShape: "{}",
      examplePayload: { type },
      constraints: ["Unknown type — verify spelling."],
    }
  );
}
