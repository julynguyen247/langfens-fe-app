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
  type UserAnswerValue,
  type QuestionGradeResult,
  type ExamGradeSummary,
  enrichExamWithSequentialNumbers,
} from "@/app/test-v2/_lib/types";

import type { InternalDeliveryExam } from "@/app/test-v2/_lib/types";

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
