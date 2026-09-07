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
