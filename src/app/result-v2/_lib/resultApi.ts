import { apisAttempt } from "@/utils/api.customize";
import { getExamDelivery } from "@/app/admin/_lib/adminApi";
import {
  AttemptAnswerItem,
  AttemptResultData,
  InternalDeliveryExam,
  enrichExamWithSequentialNumbers,
} from "./types";

interface RawApiResult<T> {
  isSuccess: boolean;
  message?: string;
  data: T;
}

export async function fetchAttemptResult(attemptId: string): Promise<AttemptResultData> {
  const [resultRes, attemptRes] = await Promise.all([
    apisAttempt.get<RawApiResult<Record<string, unknown>>>(`/attempt/getresult/${attemptId}`).catch(() => null),
    apisAttempt.get<RawApiResult<Record<string, unknown>>>(`/attempt/${attemptId}`).catch(() => null),
  ]);

  const resultData = resultRes?.data?.data || {};
  const attemptData = attemptRes?.data?.data || {};

  // Extract answers
  const rawAnswers = (resultData.answers as unknown[]) || [];
  const answers: AttemptAnswerItem[] = [];

  for (const item of rawAnswers) {
    if (item && typeof item === "object") {
      const qId = "questionId" in item && typeof item.questionId === "string" ? item.questionId : "";
      const sId = "sectionId" in item && typeof item.sectionId === "string" ? item.sectionId : "";
      const idx = "idx" in item && typeof item.idx === "number" ? item.idx : 0;
      const textAnswer = "textAnswer" in item && typeof item.textAnswer === "string" ? item.textAnswer : null;
      const isCorrect = "isCorrect" in item && typeof item.isCorrect === "boolean" ? item.isCorrect : null;
      const selectedText = "selectedAnswerText" in item && typeof item.selectedAnswerText === "string" ? item.selectedAnswerText : null;
      const correctText = "correctAnswerText" in item && typeof item.correctAnswerText === "string" ? item.correctAnswerText : null;
      const selectedOptionIds = "selectedOptionIds" in item && Array.isArray(item.selectedOptionIds) ? (item.selectedOptionIds as string[]) : null;

      answers.push({
        questionId: qId,
        sectionId: sId,
        idx,
        selectedOptionIds,
        textAnswer,
        isCorrect,
        selectedAnswerText: selectedText,
        correctAnswerText: correctText,
        ragFeedback: "ragFeedback" in item ? item.ragFeedback : null,
      });
    }
  }

  // Extract paper
  let rawPaper =
    (attemptData.paper as InternalDeliveryExam) ||
    (resultData.fullSnapshot as InternalDeliveryExam) ||
    null;

  const examId =
    ("examId" in attemptData && typeof attemptData.examId === "string" ? attemptData.examId : "") ||
    (rawPaper && typeof rawPaper === "object" && "id" in rawPaper && typeof rawPaper.id === "string" ? rawPaper.id : "");

  if (!rawPaper && examId) {
    try {
      rawPaper = await getExamDelivery(examId, true);
    } catch {
      // ignore fallback error
    }
  }

  if (!rawPaper) {
    throw new Error("Unable to load exam paper snapshot for this attempt.");
  }

  const { enrichedExam } = enrichExamWithSequentialNumbers(rawPaper);

  const correctCount = answers.filter((a) => a.isCorrect === true).length;
  const totalQuestion = answers.length > 0 ? answers.length : 40;
  const ieltsBand =
    typeof resultData.ieltsBand === "number" ? resultData.ieltsBand : 0;

  return {
    attemptId,
    examId: examId || undefined,
    status: ("status" in attemptData && typeof attemptData.status === "string" ? attemptData.status : "SUBMITTED"),
    submittedAt: ("submittedAt" in attemptData && typeof attemptData.submittedAt === "string" ? attemptData.submittedAt : null),
    totalTime: ("timeLeftSec" in attemptData ? (attemptData.timeLeftSec as number) : null),
    rawScore: typeof resultData.rawScore === "number" ? resultData.rawScore : correctCount,
    scorePct: typeof resultData.scorePct === "number" ? resultData.scorePct : Math.round((correctCount / totalQuestion) * 100),
    correctCount,
    totalQuestion,
    ieltsBand,
    answers,
    paper: enrichedExam,
  };
}
