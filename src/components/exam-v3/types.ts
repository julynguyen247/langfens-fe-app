export {
  QuestionType,
  QuestionSkill,
  ExamCategory,
  ExamLevel,
  type InternalDeliveryExam,
  type InternalDeliverySection,
  type InternalDeliveryQuestionGroup,
  type InternalDeliveryQuestion,
  type InternalDeliveryOption,
  type InternalFlowChartNode,
} from "@/app/admin/_lib/types";

import type {
  InternalDeliveryExam,
  InternalDeliverySection,
  InternalDeliveryQuestionGroup,
  InternalDeliveryQuestion,
} from "@/app/admin/_lib/types";

export type UserAnswerValue = string | string[] | Record<string, string>;

export interface QuestionGradeResult {
  questionIdx: number;
  isCorrect: boolean;
  score: number;
  maxScore: number;
  userAnswer?: UserAnswerValue;
  correctAnswerText: string;
}

export interface ExamGradeSummary {
  totalScore: number;
  maxScore: number;
  percentage: number;
  estimatedBand: number;
  resultsByQuestion: Record<number, QuestionGradeResult>;
}

export interface AttemptAnswerItem {
  questionId: string;
  sectionId: string;
  idx: number;
  selectedOptionIds?: string[] | null;
  textAnswer?: string | null;
  isCorrect?: boolean | null;
  selectedAnswerText?: string | null;
  correctAnswerText?: string | null;
  ragFeedback?: unknown;
}

export interface AttemptResultData {
  attemptId: string;
  examId?: string;
  status: string;
  submittedAt?: string | null;
  totalTime?: number | string | null;
  rawScore?: number | null;
  scorePct?: number | null;
  correctCount: number;
  totalQuestion: number;
  ieltsBand: number;
  answers: AttemptAnswerItem[];
  paper: InternalDeliveryExam;
}

export type ResultFilterType = "ALL" | "CORRECT" | "INCORRECT" | "UNANSWERED";

/**
 * Normalizes question numbering sequentially (1, 2, 3 ... N)
 * across all sections and question groups in the exam.
 */
export function enrichExamWithSequentialNumbers(exam: InternalDeliveryExam): {
  enrichedExam: InternalDeliveryExam;
  allQuestions: InternalDeliveryQuestion[];
} {
  let counter = 1;
  const allQuestions: InternalDeliveryQuestion[] = [];

  const enrichedSections: InternalDeliverySection[] = (exam.sections || []).map((sec: InternalDeliverySection) => {
    const enrichQ = (q: InternalDeliveryQuestion): InternalDeliveryQuestion => {
      const displayIdx = counter++;
      const enriched: InternalDeliveryQuestion = { ...q, displayIdx };
      allQuestions.push(enriched);
      return enriched;
    };

    const enrichedQuestions: InternalDeliveryQuestion[] = (sec.questions || []).map(enrichQ);
    const enrichedGroups: InternalDeliveryQuestionGroup[] = (sec.questionGroups || []).map((grp: InternalDeliveryQuestionGroup) => ({
      ...grp,
      questions: (grp.questions || []).map(enrichQ),
    }));

    return {
      ...sec,
      questions: enrichedQuestions,
      questionGroups: enrichedGroups,
    };
  });

  return {
    enrichedExam: {
      ...exam,
      sections: enrichedSections,
    },
    allQuestions,
  };
}
