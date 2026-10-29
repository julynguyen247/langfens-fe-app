import { apisAttempt } from "@/utils/api.customize";
import type { AttemptAnswerItem, AttemptResultData, InternalDeliveryExam } from "./types";
import { normalizeExamPaper, sectionQuestions } from "./contract";

interface RawApiResult<T> { isSuccess: boolean; message?: string; data: T }

export async function fetchAttemptResult(attemptId: string): Promise<AttemptResultData> {
  const response = await apisAttempt.get<RawApiResult<Record<string, unknown>>>(`/attempt/getresult/${attemptId}`);
  const result = response.data?.data;
  if (!result || response.data.isSuccess === false) throw new Error("Unable to load attempt results.");
  let paper = result.fullSnapshot as InternalDeliveryExam | undefined;
  let attempt: Record<string, unknown> = {};
  if (!paper?.sections) {
    const response = await apisAttempt.get<RawApiResult<Record<string, unknown>>>(`/attempt/${attemptId}`);
    attempt = response.data?.data ?? {};
    paper = attempt.paper as InternalDeliveryExam | undefined;
  }
  if (!paper?.sections) throw new Error("Unable to load this attempt's paper snapshot.");
  const normalized = normalizeExamPaper(paper);
  const answers: AttemptAnswerItem[] = (Array.isArray(result.answers) ? result.answers : []).filter(raw => raw && typeof raw === "object").map((raw: Record<string, unknown>) => ({
    questionId: typeof raw.questionId === "string" ? raw.questionId : "",
    sectionId: typeof raw.sectionId === "string" ? raw.sectionId : "",
    idx: typeof raw.idx === "number" ? raw.idx : 0,
    selectedOptionIds: Array.isArray(raw.selectedOptionIds) ? raw.selectedOptionIds.filter((id): id is string => typeof id === "string") : [],
    textAnswer: typeof raw.textAnswer === "string" ? raw.textAnswer : null,
    selectedAnswerText: typeof raw.selectedAnswerText === "string" ? raw.selectedAnswerText : null,
    correctAnswerText: typeof raw.correctAnswerText === "string" ? raw.correctAnswerText : null,
    isCorrect: typeof raw.isCorrect === "boolean" ? raw.isCorrect : null,
    ragFeedback: raw.ragFeedback,
  }));
  const totalQuestion = typeof result.totalQuestion === "number" ? result.totalQuestion : normalized.sections.flatMap(sectionQuestions).length;
  const correctCount = typeof result.correctCount === "number" ? result.correctCount : answers.filter(a => a.isCorrect === true).length;
  return {
    attemptId,
    examId: typeof attempt.examId === "string" ? attempt.examId : paper.id,
    status: typeof result.status === "string" ? result.status : "SUBMITTED",
    submittedAt: typeof result.submittedAt === "string" ? result.submittedAt : null,
    totalTime: typeof result.totalTime === "number" || typeof result.totalTime === "string" ? result.totalTime : null,
    rawScore: typeof result.rawScore === "number" ? result.rawScore : correctCount,
    scorePct: typeof result.scorePct === "number" ? result.scorePct : (totalQuestion ? 100 * correctCount / totalQuestion : 0),
    correctCount, totalQuestion,
    ieltsBand: typeof result.ieltsBand === "number" ? result.ieltsBand : 0,
    answers, paper: normalized,
  };
}
