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
      const selectedText =
        ("selectedAnswerText" in item && typeof item.selectedAnswerText === "string" ? item.selectedAnswerText : null) ||
        ("selectedText" in item && typeof item.selectedText === "string" ? item.selectedText : null);
      const correctAnswerText = "correctAnswerText" in item && typeof item.correctAnswerText === "string" ? item.correctAnswerText : null;
      let selectedOptionIds = "selectedOptionIds" in item && Array.isArray(item.selectedOptionIds) ? (item.selectedOptionIds as string[]) : null;

      // If selectedOptionIds is empty and textAnswer contains a UUID option ID, populate selectedOptionIds
      if (
        (!selectedOptionIds || selectedOptionIds.length === 0) &&
        textAnswer &&
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(textAnswer.trim())
      ) {
        selectedOptionIds = [textAnswer.trim()];
      }

      answers.push({
        questionId: qId,
        sectionId: sId,
        idx,
        selectedOptionIds,
        textAnswer,
        isCorrect,
        selectedAnswerText: selectedText,
        correctAnswerText,
        ragFeedback: "ragFeedback" in item ? item.ragFeedback : null,
      });
    }
  }

  // Determine paper snapshot: prefer paperWithAnswers, fallback to fullSnapshot or attemptPaper
  const attemptPaper =
    (resultData.paperWithAnswers as InternalDeliveryExam) ||
    (resultData.fullSnapshot as InternalDeliveryExam) ||
    (attemptData.paper as InternalDeliveryExam) ||
    null;

  const examId =
    ("examId" in resultData && typeof resultData.examId === "string" ? resultData.examId : "") ||
    ("examId" in attemptData && typeof attemptData.examId === "string" ? attemptData.examId : "") ||
    (attemptPaper && typeof attemptPaper === "object" && "id" in attemptPaper && typeof attemptPaper.id === "string" ? attemptPaper.id : "");

  let deliveryPaper: InternalDeliveryExam | null = null;
  if (examId) {
    try {
      deliveryPaper = await getExamDelivery(examId, true);
    } catch {
      // ignore fallback error
    }
  }

  // Use deliveryPaper (which has isCorrect: true and explanations) or fallback to attemptPaper
  const selectedPaper = deliveryPaper || attemptPaper;

  if (!selectedPaper) {
    throw new Error("Unable to load exam paper snapshot for this attempt.");
  }

  // Ensure isCorrect is populated on all options using answers[].correctAnswerText as fallback
  for (const sec of selectedPaper.sections || []) {
    const allQ = [
      ...(sec.questions || []),
      ...(sec.questionGroups || []).flatMap((g) => g.questions || []),
    ];

    for (const q of allQ) {
      const matchedAns = answers.find(
        (a) =>
          (a.questionId && q.id && a.questionId.toLowerCase() === q.id.toLowerCase()) ||
          a.idx === q.idx
      );

      if (matchedAns?.correctAnswerText && q.options && q.options.length > 0) {
        const correctText = matchedAns.correctAnswerText.trim().toLowerCase();
        for (const opt of q.options) {
          if (opt.isCorrect === undefined || opt.isCorrect === null) {
            const optContent = opt.contentMd.trim().toLowerCase();
            if (
              optContent === correctText ||
              correctText.startsWith(optContent) ||
              optContent.startsWith(correctText) ||
              (opt.id && opt.id.toLowerCase() === correctText)
            ) {
              opt.isCorrect = true;
            } else {
              opt.isCorrect = false;
            }
          }
        }
      }
    }
  }

  const { enrichedExam } = enrichExamWithSequentialNumbers(selectedPaper);

  const rawCorrect = answers.filter((a) => a.isCorrect === true).length;
  const correctCount = typeof resultData.correct === "number" ? resultData.correct : rawCorrect;
  const totalQuestion =
    typeof resultData.total === "number"
      ? resultData.total
      : answers.length > 0
      ? answers.length
      : 40;

  const rawScore =
    typeof resultData.scoreRaw === "number"
      ? resultData.scoreRaw
      : typeof resultData.rawScore === "number"
      ? resultData.rawScore
      : correctCount;

  const scorePct =
    typeof resultData.scorePct === "number"
      ? resultData.scorePct
      : totalQuestion > 0
      ? Math.round((correctCount / totalQuestion) * 100)
      : 0;

  const ieltsBand =
    typeof resultData.ieltsBand === "number" ? resultData.ieltsBand : 0;

  return {
    attemptId,
    examId: examId || undefined,
    status:
      typeof resultData.status === "string"
        ? resultData.status
        : "status" in attemptData && typeof attemptData.status === "string"
        ? attemptData.status
        : "SUBMITTED",
    submittedAt:
      typeof resultData.submittedAt === "string"
        ? resultData.submittedAt
        : "submittedAt" in attemptData && typeof attemptData.submittedAt === "string"
        ? attemptData.submittedAt
        : null,
    totalTime:
      typeof resultData.totalTime === "number" || typeof resultData.totalTime === "string"
        ? resultData.totalTime
        : "timeLeftSec" in attemptData
        ? (attemptData.timeLeftSec as number)
        : null,
    rawScore,
    scorePct,
    correctCount,
    totalQuestion,
    ieltsBand,
    answers,
    paper: enrichedExam,
  };
}
