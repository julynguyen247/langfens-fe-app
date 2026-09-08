import { apisAttempt, apisExam } from "@/utils/api.customize";
import {
  AttemptAnswerItem,
  AttemptResultData,
  InternalDeliveryExam,
  InternalDeliverySection,
  InternalDeliveryQuestionGroup,
  InternalDeliveryQuestion,
  InternalDeliveryOption,
  enrichExamWithSequentialNumbers,
} from "@/components/exam-v3/types";

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
      const correctAnswerText = "correctAnswerText" in item && typeof item.correctAnswerText === "string" ? item.correctAnswerText : null;
      const selectedOptionIds = "selectedOptionIds" in item && Array.isArray(item.selectedOptionIds) ? (item.selectedOptionIds as string[]) : null;
      const ragFeedback = "ragFeedback" in item ? item.ragFeedback : null;

      answers.push({
        questionId: qId,
        sectionId: sId,
        idx,
        selectedOptionIds,
        textAnswer,
        isCorrect,
        selectedAnswerText: selectedText,
        correctAnswerText,
        ragFeedback,
      });
    }
  }

  const attemptPaper =
    (attemptData.paper as InternalDeliveryExam) ||
    (resultData.fullSnapshot as InternalDeliveryExam) ||
    null;

  const examId =
    ("examId" in attemptData && typeof attemptData.examId === "string" ? attemptData.examId : "") ||
    (attemptPaper && typeof attemptPaper === "object" && "id" in attemptPaper && typeof attemptPaper.id === "string" ? attemptPaper.id : "");

  let deliveryPaper: InternalDeliveryExam | null = null;
  if (examId) {
    try {
      const res = await apisExam.get<RawApiResult<InternalDeliveryExam>>(
        `/internal/exams/${examId}/delivery`,
        { params: { showAnswers: true } }
      );
      deliveryPaper = res.data?.data;
    } catch {
      // ignore
    }
  }

  const selectedPaper = deliveryPaper || attemptPaper;
  if (!selectedPaper) {
    throw new Error("Unable to load exam paper snapshot for this attempt.");
  }

  // Preserve database question IDs from attemptPaper if deliveryPaper omitted them
  if (attemptPaper?.sections && selectedPaper.sections) {
    selectedPaper.sections.forEach((sec: InternalDeliverySection, sIdx: number) => {
      const attSec = attemptPaper.sections?.[sIdx];
      if (!attSec) return;

      (sec.questions || []).forEach((q: InternalDeliveryQuestion, qIdx: number) => {
        if (!q.id && attSec.questions?.[qIdx]?.id) {
          q.id = attSec.questions[qIdx].id;
        }
      });

      (sec.questionGroups || []).forEach((grp: InternalDeliveryQuestionGroup, gIdx: number) => {
        const attGrp = attSec.questionGroups?.[gIdx];
        if (!attGrp) return;

        (grp.questions || []).forEach((q: InternalDeliveryQuestion, qIdx: number) => {
          if (!q.id && attGrp.questions?.[qIdx]?.id) {
            q.id = attGrp.questions[qIdx].id;
          }
        });
      });
    });
  }
  for (const sec of selectedPaper.sections || []) {
    const allQ: InternalDeliveryQuestion[] = [
      ...(sec.questions || []),
      ...((sec.questionGroups || []).flatMap((g: InternalDeliveryQuestionGroup) => g.questions || [])),
    ];

    for (const q of allQ) {
      const matchedAns = answers.find(
        (a: AttemptAnswerItem) => (a.questionId && q.id && a.questionId === q.id) || a.idx === q.idx
      );

      if (matchedAns?.correctAnswerText && q.options && q.options.length > 0) {
        const correctText = matchedAns.correctAnswerText.trim().toLowerCase();
        for (const opt of q.options) {
          if (opt.isCorrect === undefined || opt.isCorrect === null) {
            const optContent = opt.contentMd.trim().toLowerCase();
            if (
              optContent === correctText ||
              correctText.startsWith(optContent) ||
              optContent.startsWith(correctText)
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

  const correctCount = answers.filter((a: AttemptAnswerItem) => a.isCorrect === true).length;
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
