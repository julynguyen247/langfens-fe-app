import type { RagFeedbackEnvelope } from "@/types/rag";

export type WrongAnswer = {
  answerId: string;
  questionId: string;
  questionContent: string;
  questionType: string;
  skill: string;
  sectionTitle: string;
  userAnswer: string;
  correctAnswer: string;
  explanation?: string;
  ragFeedback?: RagFeedbackEnvelope;
  attemptDate: string;
  examId: string;
  attemptId: string;
};

export type WrongAnswersResult = {
  items: WrongAnswer[];
  total: number;
  page: number;
  pageSize: number;
  statsByType: Record<string, number>;
};
