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
}

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
    "0": ["earth", "Earth"],
    "1": ["27", "twenty-seven"]
  }
}`,
    examplePayload: {
      type: "SUMMARY_COMPLETION",
      skill: "READING",
      difficulty: 2,
      promptMd: "Complete the summary:\n\nThe moon orbits the [1] every [2] days.",
      blankAcceptTexts: {
        "0": ["earth", "Earth"],
        "1": ["27", "twenty-seven"],
      },
    },
    constraints: [
      "promptMd should contain ___ placeholders OR numbered list",
      "blankAcceptTexts keys must match placeholder indices (e.g. '0', '1'…)",
      "each blank value can be string[] (multiple acceptable spellings)",
    ],
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
  "blankAcceptTexts": { "0": ["100", "one hundred"] }
}`,
    examplePayload: {
      type: "TABLE_COMPLETION",
      skill: "READING",
      difficulty: 3,
      promptMd: "Complete the table:\n\n| Year | Sales |\n|------|-------|\n| 2020 | [1]   |",
      blankAcceptTexts: { "0": ["100", "one hundred"] },
    },
    constraints: [
      "promptMd typically contains a markdown table with ___ cells",
      "blankAcceptTexts keys match placeholder indices",
    ],
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
  "blankAcceptTexts": { "0": ["workshop"], "1": ["20"] }
}`,
    examplePayload: {
      type: "NOTE_COMPLETION",
      skill: "LISTENING",
      difficulty: 2,
      promptMd: "Notes:\n- Type: [1]\n- Capacity: [2] people",
      blankAcceptTexts: { "0": ["workshop"], "1": ["20"] },
    },
    constraints: ["Same as SummaryCompletion."],
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
  "promptMd": "Application Form\\n\\nName: [1]\nDate: [2]\nRoom: [3]",
  "blankAcceptTexts": {
    "0": ["Rachel Torres", "Torres"],
    "1": ["15 September"],
    "2": ["single"]
  }
}`,
    examplePayload: {
      type: "FORM_COMPLETION",
      skill: "LISTENING",
      difficulty: 2,
      promptMd: "Application Form\n\nName: [1]\nDate: [2]\nRoom: [3]",
      blankAcceptTexts: {
        "0": ["Rachel Torres", "Torres"],
        "1": ["15 September"],
        "2": ["single"],
      },
    },
    constraints: ["Same as SummaryCompletion."],
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
  "difficulty": 2,
  "promptMd": "1. Listening to music reduces [1] levels.\\n2. The brain's [2] manages emotion.",
  "blankAcceptTexts": { "0": ["cortisol"], "1": ["nucleus accumbens"] }
}`,
    examplePayload: {
      type: "SENTENCE_COMPLETION",
      skill: "READING",
      difficulty: 2,
      promptMd: "1. Listening to music reduces [1] levels.\n2. The brain's [2] manages emotion.",
      blankAcceptTexts: { "0": ["cortisol"], "1": ["nucleus accumbens"] },
    },
    constraints: ["Same as SummaryCompletion."],
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
  },

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
  "blankAcceptTexts": { "0": ["chloroplast"], "1": ["nucleus"] }
}`,
    examplePayload: {
      type: "DIAGRAM_LABEL",
      skill: "LISTENING",
      difficulty: 3,
      promptMd: "Label the diagram below with [1], [2]…",
      imageUrl: "https://.../diagram.png",
      blankAcceptTexts: { "0": ["chloroplast"], "1": ["nucleus"] },
    },
    constraints: [
      "imageUrl is required for DIAGRAM_LABEL",
      "promptMd should describe what to label (or be empty)",
      "blankAcceptTexts keys match placeholder indices",
    ],
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
  "blankAcceptTexts": { "0": ["library"], "1": ["park"] }
}`,
    examplePayload: {
      type: "MAP_LABEL",
      skill: "LISTENING",
      difficulty: 3,
      promptMd: "Label positions [1] through [2] on the map.",
      imageUrl: "https://.../map.png",
      blankAcceptTexts: { "0": ["library"], "1:": ["park"] },
    },
    constraints: [
      "imageUrl is required for MAP_LABEL",
      "blankAcceptTexts keys match placeholder indices",
    ],
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
    "0": ["B", "Question 14 text"],
    "1": ["A", "Question 15 text"]
  }
}`,
    examplePayload: {
      type: "MATCHING_INFORMATION",
      skill: "READING",
      difficulty: 3,
      promptMd: "14. Which paragraph mentions X?\n15. Which paragraph describes Y?",
      matchPairs: {
        "0": ["B", "Question 14 text"],
        "1": ["A", "Question 15 text"],
      },
    },
    constraints: [
      "matchPairs keys = zero-based question index strings ('0', '1', …)",
      "matchPairs values[0] = paragraph letter (A-H)",
    ],
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
    "0": ["A", "The speaker"],
    "1": ["B", "The researcher"]
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
        "0": ["A", "The speaker"],
        "1": ["B", "The researcher"],
      },
    },
    constraints: [
      "options[] = feature list (A-H)",
      "matchPairs keys = zero-based item index ('0', '1', …)",
      "features can be reused across items",
    ],
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
    "0": ["A", "Despite the rain,"],
    "1": ["B", "As the temperature rose,"]
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
        "0": ["A", "Despite the rain,"],
        "1": ["B", "As the temperature rose,"],
      },
    },
    constraints: [
      "options[] = endings pool (A-H)",
      "matchPairs keys = zero-based beginning index",
      "endings can only be used once (one-to-one)",
    ],
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
    "0": ["C"],
    "1": ["B"],
    "2": ["A"]
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
        "0": ["C"],
        "1": ["B"],
        "2": ["A"],
      },
    },
    constraints: [
      "promptMd MUST contain 'A. label', 'B. label' for categories and '1. text', '2. text' for statements",
      "matchPairs keys = zero-based statement index ('0', '1', …)",
      "matchPairs values[0] = category letter (A, B, C…)",
    ],
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
