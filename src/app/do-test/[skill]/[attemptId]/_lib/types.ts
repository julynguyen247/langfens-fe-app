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
  InternalDeliveryQuestion,
} from "@/app/admin/_lib/types";

export interface ExtendedDeliveryQuestion extends InternalDeliveryQuestion {
  displayIdx: number;
}

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

export interface TestSessionState {
  examId: string;
  activeSectionIdx: number;
  answers: Record<number, UserAnswerValue>;
  flaggedQuestionIndices: number[];
  timeRemainingSeconds: number;
  isSubmitted: boolean;
  gradeSummary: ExamGradeSummary | null;
}

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

  const enrichedSections = (exam.sections || []).map((sec) => {
    const enrichQ = (q: InternalDeliveryQuestion): InternalDeliveryQuestion => {
      const displayIdx = counter++;
      const enriched = { ...q, displayIdx };
      allQuestions.push(enriched);
      return enriched;
    };

    const enrichedQuestions = (sec.questions || []).map(enrichQ);
    const enrichedGroups = (sec.questionGroups || []).map((grp) => ({
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
