export const ExamCategory = {
  IELTS: "IELTS",
  TOEIC: "TOEIC",
  VSTEP: "VSTEP",
  PLACEMENT: "PLACEMENT",
  EXERCISE: "EXERCISE",
  GRAMMAR: "GRAMMAR",
} as const;

export type ExamCategoryType = (typeof ExamCategory)[keyof typeof ExamCategory];

export const ExamLevel = {
  A1: "A1",
  A2: "A2",
  B1: "B1",
  B2: "B2",
  C1: "C1",
  C2: "C2",
} as const;

export type ExamLevelType = (typeof ExamLevel)[keyof typeof ExamLevel];

export const ExamStatus = {
  Draft: "DRAFT",
  Published: "PUBLISHED",
  Archived: "ARCHIVED",
} as const;

export type ExamStatusType = (typeof ExamStatus)[keyof typeof ExamStatus];

export const QuestionSkill = {
  Speaking: "SPEAKING",
  Listening: "LISTENING",
  Writing: "WRITING",
  Reading: "READING",
} as const;

export type QuestionSkillType = (typeof QuestionSkill)[keyof typeof QuestionSkill];

export const QuestionType = {
  MultipleChoiceSingle: "MULTIPLE_CHOICE_SINGLE",
  MultipleChoiceMultiple: "MULTIPLE_CHOICE_MULTIPLE",
  TrueFalseNotGiven: "TRUE_FALSE_NOT_GIVEN",
  YesNoNotGiven: "YES_NO_NOT_GIVEN",
  MultipleChoiceSingleImage: "MULTIPLE_CHOICE_SINGLE_IMAGE",
  SummaryCompletion: "SUMMARY_COMPLETION",
  TableCompletion: "TABLE_COMPLETION",
  NoteCompletion: "NOTE_COMPLETION",
  FormCompletion: "FORM_COMPLETION",
  SentenceCompletion: "SENTENCE_COMPLETION",
  ShortAnswer: "SHORT_ANSWER",
  AudioResponse: "AUDIO_RESPONSE",
  DiagramLabel: "DIAGRAM_LABEL",
  MapLabel: "MAP_LABEL",
  MatchingHeading: "MATCHING_HEADING",
  MatchingInformation: "MATCHING_INFORMATION",
  MatchingFeatures: "MATCHING_FEATURES",
  MatchingEndings: "MATCHING_ENDINGS",
  Classification: "CLASSIFICATION",
  FlowChart: "FLOW_CHART",
  FlowChartCompletion: "FLOW_CHART_COMPLETION",
} as const;

export type QuestionTypeEnum = (typeof QuestionType)[keyof typeof QuestionType];

// Admin DTOs matching backend C# records
export interface AdminExamCreate {
  Title: string;
  Slug?: string;
  DescriptionMd?: string | null;
  Category: string;
  Level: string;
  DurationMin: number;
  ImageUrl?: string | null;
}

export interface AdminExamUpdate {
  Title: string;
  DescriptionMd?: string | null;
  Category: string;
  Level: string;
  DurationMin: number;
  ImageUrl?: string | null;
  Status: string;
}

export interface AdminExamListItem {
  id: string;
  slug: string;
  title: string;
  category: string;
  level: string;
  status: string;
  durationMin: number;
  createdAt: string;
  updatedAt?: string | null;
}

export interface AdminSectionUpsert {
  ExamId: string;
  Idx?: number;
  Title: string;
  InstructionsMd?: string | null;
  PassageMd?: string | null;
  AudioUrl?: string | null;
  TranscriptMd?: string | null;
}

export interface AdminSectionUpdate {
  ExamId: string;
  Idx?: number;
  Title: string;
  InstructionsMd?: string | null;
  PassageMd?: string | null;
  AudioUrl?: string | null;
  TranscriptMd?: string | null;
}

export interface AdminSectionItem {
  id: string;
  examId: string;
  idx: number;
  title: string;
  instructionsMd?: string | null;
  passageMd?: string | null;
  audioUrl?: string | null;
  transcriptMd?: string | null;
}

export interface AdminQuestionUpsert {
  SectionId: string;
  Idx?: number;
  Type: string;
  Skill: string;
  Difficulty: number;
  PromptMd?: string | null;
  ExplanationMd?: string | null;
  BlankAcceptTexts?: Record<string, string[] | null> | null;
  BlankAcceptRegex?: Record<string, string[] | null> | null;
  MatchPairs?: Record<string, string[] | null> | null;
  OrderCorrects?: string[] | null;
  ShortAnswerAcceptTexts?: string[] | null;
  ShortAnswerAcceptRegex?: string[] | null;
}

export interface AdminQuestionUpdate {
  SectionId: string;
  Idx?: number;
  Type: string;
  Skill: string;
  Difficulty: number;
  PromptMd?: string | null;
  ExplanationMd?: string | null;
  BlankAcceptTexts?: Record<string, string[] | null> | null;
  BlankAcceptRegex?: Record<string, string[] | null> | null;
  MatchPairs?: Record<string, string[] | null> | null;
  OrderCorrects?: string[] | null;
  ShortAnswerAcceptTexts?: string[] | null;
  ShortAnswerAcceptRegex?: string[] | null;
}

export interface AdminQuestionItem {
  id: string;
  sectionId: string;
  idx: number;
  type: string;
  skill: string;
  difficulty: number;
  promptMd?: string | null;
  explanationMd?: string | null;
}

export interface AdminOptionUpsert {
  QuestionId: string;
  Idx?: number;
  ContentMd: string;
  IsCorrect: boolean;
}

export interface AdminOptionUpdate {
  QuestionId: string;
  Idx?: number;
  ContentMd: string;
  IsCorrect: boolean;
}

export interface AdminOptionItem {
  id: string;
  questionId: string;
  idx: number;
  contentMd: string;
  isCorrect: boolean;
}

// Internal Delivery Types (full paper structure)
export interface InternalDeliveryOption {
  id: string;
  idx: number;
  contentMd: string;
  isCorrect?: boolean | null;
}

export interface InternalFlowChartNode {
  key: string;
  label: string;
}

export interface InternalDeliveryQuestion {
  id?: string; // Resolved client-side from AdminQuestion
  idx: number;
  type: string;
  skill: string;
  difficulty: number;
  promptMd?: string | null;
  explanationMd?: string | null;
  options: InternalDeliveryOption[];
  flowChartNodes?: InternalFlowChartNode[] | null;
  blankAcceptTexts?: Record<string, string[] | null> | null;
  blankAcceptRegex?: Record<string, string[] | null> | null;
  matchPairs?: Record<string, string[] | null> | null;
  orderCorrects?: string[] | null;
  shortAnswerAcceptTexts?: string[] | null;
  shortAnswerAcceptRegex?: string[] | null;
}

export interface InternalDeliveryQuestionGroup {
  id: string;
  idx: number;
  startIdx: number;
  endIdx: number;
  instructionMd: string;
  questions: InternalDeliveryQuestion[];
}

export interface InternalDeliverySection {
  id?: string; // Resolved client-side from AdminSection
  idx: number;
  title: string;
  instructionsMd?: string | null;
  passageMd?: string | null;
  audioUrl?: string | null;
  transcriptMd?: string | null;
  questions: InternalDeliveryQuestion[];
  questionGroups?: InternalDeliveryQuestionGroup[] | null;
}

export interface InternalDeliveryExam {
  id: string;
  slug: string;
  title: string;
  descriptionMd?: string | null;
  category: string;
  level: string;
  durationMin: number;
  imageUrl?: string | null;
  sections: InternalDeliverySection[];
}

// Standard API response wrapper
export interface ApiResult<T> {
  success: boolean;
  message?: string;
  data: T;
}
