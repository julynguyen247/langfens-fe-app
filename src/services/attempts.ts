import { apisAttempt } from "../utils/api.customize";
import { enqueueAttemptSave } from "@/lib/attemptSaveQueue";

export async function getAttemptDetail(attemptId: string) {
  return apisAttempt.get(`/attempt/${attemptId}`);
}

export async function startAttempt(examId: string) {
  const res = await apisAttempt.post("/attempt/attempts:start", { examId });
  return res;
}

export async function autoSaveAttempt(
  attemptId: string,
  payload: {
    answers: Array<{
      questionId: string;
      sectionId: string;
      selectedOptionIds: string[];
      textAnswer?: string;
    }>;
    clientRevision: number;
  }
) {
  // Snapshot before queueing: later edits must not change a pending request.
  const snapshot = { ...payload, answers: payload.answers.map(a => ({ ...a, selectedOptionIds: [...a.selectedOptionIds] })) };
  return enqueueAttemptSave(attemptId, () => apisAttempt.post(
    `/attempt/autosave/${attemptId}`,
    snapshot,
    { headers: { "Content-Type": "application/json" } }
  ));
}

export async function submitAttempt(
  attemptId: string,
  answers?: Array<{
    questionId: string;
    sectionId: string;
    selectedOptionIds: string[];
    textAnswer?: string;
  }>
) {
  // The backend submit endpoint ignores an answers body. Persist explicitly,
  // and NEVER submit when that save fails.
  if (answers) await autoSaveAttempt(attemptId, { answers, clientRevision: Date.now() });
  return enqueueAttemptSave(attemptId, () => apisAttempt.post(`/attempt/submit/${attemptId}`, {}));
}

export async function getAttemptResult(attemptId: string) {
  const res = await apisAttempt.get(`/attempt/getresult/${attemptId}`);
  return res;
}

export interface NavigatorEntry {
  questionId: string;
  idx: number;
  isAnswered: boolean;
  isFlagged: boolean;
}

export interface NavigatorResponse {
  totalQuestions: number;
  answeredCount: number;
  questions: NavigatorEntry[];
}

export async function getQuestionNavigator(attemptId: string): Promise<NavigatorResponse> {
  const res = await apisAttempt.get(`/attempt/${attemptId}/navigator`);
  return res.data?.data;
}

export async function toggleQuestionFlag(
  attemptId: string,
  questionId: string
): Promise<{ flagged: boolean }> {
  const res = await apisAttempt.patch(`/attempt/${attemptId}/question/${questionId}/flag`);
  return res.data?.data;
}

export async function getAttempt(
  page: number,
  pageSize: number,
  opts?: { category?: string; level?: string }
) {
  const res = await apisAttempt.get("/attempt/getlistattempt", {
    params: {
      page,
      pageSize,
    },
  });
  return res;
}

export async function getPlacementStatus() {
  const res = await apisAttempt.get("/attempt/placement/status");
  return res;
}
