export type PageSource = "attempt" | "writing" | "speaking";

export type AttemptResult = {
  attemptId: string;
  status: string;
  finishedAt: string;
  timeUsedSec: number;
  correctCount: number;
  totalPoints: number;
  awardedTotal: number;
  needsManualReview: number;
  bandScore?: number;
  writingBand?: number;
  speakingBand?: number;
  writingGrade?: WritingDetail;
  speakingGrade?: SpeakingDetail;
  questions: AttemptQuestionResult[];
  totalTime: string;
};

export type AttemptQuestionResult = {
  questionId: string;
  index: number;
  skill: string;
  questionType?: string;
  promptMd?: string;
  selectedOptionIds?: string[];
  selectedAnswerText?: string;
  correctAnswerText?: string;
  isCorrect?: boolean | null;
  explanationMd?: string;
  timeSpentSec?: number;
};

export type WritingCriterion = {
  band: number;
  comment: string;
};

export type WritingDetail = {
  submissionId: string;
  taskText: string;
  essayRaw: string;
  essayNormalized: string;
  wordCount: number;
  overallBand: number;
  taskResponse?: WritingCriterion;
  coherenceAndCohesion?: WritingCriterion;
  lexicalResource?: WritingCriterion;
  grammaticalRangeAndAccuracy?: WritingCriterion;
  suggestions: string[];
  improvedParagraph?: string;
  gradedAt?: string;
};

export type SpeakingCriterion = {
  band: number;
  comment: string;
};

export type SpeakingDetail = {
  submissionId?: string;
  overallBand?: number;
  taskText?: string;
  wordCount?: number;
  fluencyAndCoherence?: SpeakingCriterion;
  lexicalResource?: SpeakingCriterion;
  grammaticalRangeAndAccuracy?: SpeakingCriterion;
  pronunciation?: SpeakingCriterion;
  suggestions?: string[];
  transcript?: string;
  transcriptRaw?: string;
  transcriptNormalized?: string;
  improvedAnswer?: string;
  gradedAt?: string;
};

export const QUESTION_TYPE_LABELS: Record<string, string> = {
  TRUE_FALSE_NOT_GIVEN: "True/False/Not Given",
  YES_NO_NOT_GIVEN: "Yes/No/Not Given",
  MCQ_SINGLE: "Multiple Choice",
  MCQ_MULTIPLE: "Multiple Selection",
  MATCHING_HEADING: "Matching Headings",
  MATCHING_INFORMATION: "Matching Information",
  MATCHING_FEATURES: "Matching Features",
  SUMMARY_COMPLETION: "Summary Completion",
  TABLE_COMPLETION: "Table Completion",
  SENTENCE_COMPLETION: "Sentence Completion",
  DIAGRAM_LABEL: "Diagram Labelling",
  SHORT_ANSWER: "Short Answer",
  MAP_LABEL: "Map Labelling",
};

export function formatQuestionType(type: string): string {
  return (
    QUESTION_TYPE_LABELS[type] ||
    type
      .split("_")
      .map((w) => w.charAt(0) + w.slice(1).toLowerCase())
      .join(" ")
  );
}
