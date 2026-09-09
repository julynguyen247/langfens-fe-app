import { QuestionSkill, QuestionType } from "./types";

export type EditorKind =
  | "options"
  | "options-multiple"
  | "blanks"
  | "match-pairs"
  | "classification"
  | "matching-heading"
  | "matching-information"
  | "matching-features"
  | "matching-endings"
  | "short-answer"
  | "flow-chart";

export type QuestionCategory =
  | "mcq"
  | "completion"
  | "matching"
  | "ordering"
  | "speaking"
  | "writing";

export interface QuestionTypeMeta {
  type: string;
  label: string;
  shortLabel: string;
  description: string;
  category: QuestionCategory;
  editorKind: EditorKind;
  skillHints: string[];
  defaultDifficulty: number;
  groupFamily?: boolean;
}

export const QUESTION_TYPE_REGISTRY: Record<string, QuestionTypeMeta> = {
  [QuestionType.MultipleChoiceSingle]: {
    type: QuestionType.MultipleChoiceSingle,
    label: "Multiple Choice (Single)",
    shortLabel: "MCQ Single",
    description: "Pick exactly one correct option from A, B, C, D.",
    category: "mcq",
    editorKind: "options",
    skillHints: [QuestionSkill.Reading, QuestionSkill.Listening],
    defaultDifficulty: 2,
  },
  [QuestionType.MultipleChoiceSingleImage]: {
    type: QuestionType.MultipleChoiceSingleImage,
    label: "Multiple Choice (Image)",
    shortLabel: "MCQ + Image",
    description: "Single answer accompanied by an image (rare).",
    category: "mcq",
    editorKind: "options",
    skillHints: [QuestionSkill.Listening],
    defaultDifficulty: 3,
  },
  [QuestionType.TrueFalseNotGiven]: {
    type: QuestionType.TrueFalseNotGiven,
    label: "True / False / Not Given",
    shortLabel: "T / F / NG",
    description: "IELTS Reading: True, False, or Not Given based on passage.",
    category: "mcq",
    editorKind: "options",
    skillHints: [QuestionSkill.Reading],
    defaultDifficulty: 2,
  },
  [QuestionType.YesNoNotGiven]: {
    type: QuestionType.YesNoNotGiven,
    label: "Yes / No / Not Given",
    shortLabel: "Yes / No / NG",
    description: "IELTS Reading: opinion-based Yes/No/Not Given.",
    category: "mcq",
    editorKind: "options",
    skillHints: [QuestionSkill.Reading],
    defaultDifficulty: 2,
  },
  [QuestionType.MultipleChoiceMultiple]: {
    type: QuestionType.MultipleChoiceMultiple,
    label: "Multiple Choice (Multiple)",
    shortLabel: "MCQ Multiple",
    description: "Pick N correct options from a larger letter set (A–H).",
    category: "mcq",
    editorKind: "options-multiple",
    skillHints: [QuestionSkill.Reading, QuestionSkill.Listening],
    defaultDifficulty: 3,
  },
  [QuestionType.SummaryCompletion]: {
    type: QuestionType.SummaryCompletion,
    label: "Summary Completion",
    shortLabel: "Summary",
    description: "Fill blanks in a summary of the passage/listening.",
    category: "completion",
    editorKind: "blanks",
    skillHints: [QuestionSkill.Reading, QuestionSkill.Listening],
    defaultDifficulty: 2,
  },
  [QuestionType.TableCompletion]: {
    type: QuestionType.TableCompletion,
    label: "Table Completion",
    shortLabel: "Table",
    description: "Complete a table from the source material.",
    category: "completion",
    editorKind: "blanks",
    skillHints: [QuestionSkill.Reading, QuestionSkill.Listening],
    defaultDifficulty: 3,
  },
  [QuestionType.NoteCompletion]: {
    type: QuestionType.NoteCompletion,
    label: "Note Completion",
    shortLabel: "Notes",
    description: "Complete bullet/note-taking format.",
    category: "completion",
    editorKind: "blanks",
    skillHints: [QuestionSkill.Listening, QuestionSkill.Reading],
    defaultDifficulty: 2,
  },
  [QuestionType.FormCompletion]: {
    type: QuestionType.FormCompletion,
    label: "Form Completion",
    shortLabel: "Form",
    description: "Fill a form-style layout with key facts.",
    category: "completion",
    editorKind: "blanks",
    skillHints: [QuestionSkill.Listening],
    defaultDifficulty: 2,
  },
  [QuestionType.SentenceCompletion]: {
    type: QuestionType.SentenceCompletion,
    label: "Sentence Completion",
    shortLabel: "Sentence",
    description: "Complete sentences with one or two words from source.",
    category: "completion",
    editorKind: "blanks",
    skillHints: [QuestionSkill.Reading, QuestionSkill.Listening],
    defaultDifficulty: 2,
  },
  [QuestionType.ShortAnswer]: {
    type: QuestionType.ShortAnswer,
    label: "Short Answer",
    shortLabel: "Short Answer",
    description: "Single free-text answer, no choices.",
    category: "completion",
    editorKind: "short-answer",
    skillHints: [QuestionSkill.Reading, QuestionSkill.Listening],
    defaultDifficulty: 2,
  },
  [QuestionType.DiagramLabel]: {
    type: QuestionType.DiagramLabel,
    label: "Diagram Label",
    shortLabel: "Diagram",
    description: "Label blanks on a diagram (e.g. plant life cycle).",
    category: "completion",
    editorKind: "blanks",
    skillHints: [QuestionSkill.Listening, QuestionSkill.Reading],
    defaultDifficulty: 3,
  },
  [QuestionType.MapLabel]: {
    type: QuestionType.MapLabel,
    label: "Map Label",
    shortLabel: "Map",
    description: "Label positions on a map.",
    category: "completion",
    editorKind: "blanks",
    skillHints: [QuestionSkill.Listening],
    defaultDifficulty: 3,
  },
  [QuestionType.MatchingHeading]: {
    type: QuestionType.MatchingHeading,
    label: "Matching Headings",
    shortLabel: "Headings",
    description: "Match paragraphs (A, B, C) to headings (i–x).",
    category: "matching",
    editorKind: "matching-heading",
    skillHints: [QuestionSkill.Reading],
    defaultDifficulty: 3,
  },
  [QuestionType.MatchingInformation]: {
    type: QuestionType.MatchingInformation,
    label: "Matching Information",
    shortLabel: "Info Match",
    description: "Match statements to the paragraph that contains them.",
    category: "matching",
    editorKind: "matching-information",
    skillHints: [QuestionSkill.Reading],
    defaultDifficulty: 3,
  },
  [QuestionType.MatchingFeatures]: {
    type: QuestionType.MatchingFeatures,
    label: "Matching Features",
    shortLabel: "Features",
    description: "Match items to a list of features (A–H).",
    category: "matching",
    editorKind: "matching-features",
    skillHints: [QuestionSkill.Reading, QuestionSkill.Listening],
    defaultDifficulty: 3,
  },
  [QuestionType.MatchingEndings]: {
    type: QuestionType.MatchingEndings,
    label: "Matching Sentence Endings",
    shortLabel: "Endings",
    description: "Match sentence beginnings to their endings.",
    category: "matching",
    editorKind: "matching-endings",
    skillHints: [QuestionSkill.Reading, QuestionSkill.Listening],
    defaultDifficulty: 3,
  },
  [QuestionType.Classification]: {
    type: QuestionType.Classification,
    label: "Classification",
    shortLabel: "Classify",
    description: "Classify statements into predefined categories (A, B, C…).",
    category: "matching",
    editorKind: "classification",
    skillHints: [QuestionSkill.Reading, QuestionSkill.Listening],
    defaultDifficulty: 3,
  },
  [QuestionType.FlowChart]: {
    type: QuestionType.FlowChart,
    label: "Flow Chart",
    shortLabel: "Flow Chart",
    description: "Order steps in a flow chart sequence.",
    category: "ordering",
    editorKind: "flow-chart",
    skillHints: [QuestionSkill.Listening],
    defaultDifficulty: 3,
  },
};

export function getMeta(type: string): QuestionTypeMeta {
  return (
    QUESTION_TYPE_REGISTRY[type] || {
      type,
      label: type,
      shortLabel: type,
      description: "Custom question type.",
      category: "mcq",
      editorKind: "options",
      skillHints: Object.values(QuestionSkill),
      defaultDifficulty: 1,
    }
  );
}

export function listByCategory(category: QuestionCategory): QuestionTypeMeta[] {
  return Object.values(QUESTION_TYPE_REGISTRY).filter((m) => m.category === category);
}
