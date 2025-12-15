import axios from "axios";
import api, {
  apisAttempt,
  apisAuth,
  apisDictionary,
  apisExam,
  apisSpeaking,
  apisVocabulary,
  apisWriting,
} from "./api.customize";
import { webmToWavFile } from "./audio";

export async function loginWithGoogle(idToken: string) {
  const { data } = await apisAuth.post("/auth/login-google", {
    idToken,
  });
  return data;
}
export async function register(email: string, password: string) {
  const res = await apisAuth.post("/auth/register", {
    email,
    password,
  });
  return res;
}
export async function login(email: string, password: string) {
  const res = await apisAuth.post("/auth/login", {
    email,
    password,
  });
  return res;
}

export async function logout() {
  const res = await apisAuth.post("/auth/logout");
  return res;
}

export async function refresh() {
  const res = await apisAuth.post("/auth/refresh");
  return res;
}

export async function getMe() {
  const res = await apisAuth.get("/auth/me");
  return res;
}

export async function verifyEmail(email: string, otp: string) {
  const res = await apisAuth.get("/auth/verify", {
    params: { email, otp },
  });
  return res;
}

export async function resendEmail(email: string) {
  const res = await apisAuth.post("/auth/resend-otp", null, {
    params: { email },
  });
  return res;
}
export async function forgotPassword(email: string) {
  return apisAuth.post("/auth/forgot-password", null, { params: { email } });
}

export async function resendEmailForgot(email: string) {
  return apisAuth.post("/auth/resend-otp-reset-password", null, {
    params: { email },
  });
}

export async function verifyEmailForgot(
  email: string,
  otp: string,
  newPassword: string
) {
  return apisAuth.post("/auth/confirm-otp-reset-password", null, {
    params: { email, otp, newPassword },
  });
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
  const res = await apisAttempt.post(
    `/attempt/autosave/${attemptId}`,
    payload,
    {
      headers: { "Content-Type": "application/json" },
    }
  );
  return res;
}

export async function getPublicExams(
  page: number,
  pageSize: number,
  opts?: { category?: string; level?: string }
) {
  const res = await apisExam.get("/public/exam/getall", {
    params: {
      page,
      pageSize,
    },
  });
  return res;
}
export async function submitAttempt(attemptId: string) {
  const res = await apisAttempt.post(`/attempt/submit/${attemptId}`, {});
  return res;
}

export async function getAttemptResult(attemptId: string) {
  const res = await apisAttempt.get(`/attempt/getresult/${attemptId}`);
  return res;
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
export async function createDeck(payload: {
  slug: string;
  title: string;
  descriptionMd: string;
  category: string;
  status: "draft" | "published";
  userId: string;
}) {
  const res = await apisVocabulary.post("/users/deck", payload);
  return res;
}
export async function createDeckCard(
  deckId: string,
  payload: {
    frontMd: string;
    backMd: string;
    hintMd?: string;
  }
) {
  const res = await apisVocabulary.post(`/users/deck/${deckId}/card`, payload);
  return res;
}
export async function updateDeck(
  deckId: string,
  payload: {
    slug: string;
    title: string;
    description: string;
    category: string;
    status: "draft" | "published";
  }
) {
  const res = await apisVocabulary.put(`/users/deck/${deckId}`, payload);
  return res;
}
export async function updateCard(
  cardId: string,
  payload: {
    frontMd: string;
    backMd: string;
    hintMd: string;
  }
) {
  const res = await apisVocabulary.put(`/users/deck/card/${cardId}`, payload);
  return res;
}

export async function deleteCard(cardId: string) {
  const res = await apisVocabulary.delete(`/users/deck/card/${cardId}`);
  return res;
}

export async function getOwnDecks(userId: string) {
  const res = await apisVocabulary.get(`/users/${userId}/own`);
  return res;
}
export async function getDeckCards(deckId: string) {
  const res = await apisVocabulary.get(`/decks/deck:${deckId}/cards`);
  return res;
}
export async function getDueFlashcards(userId: string, limit: number = 20) {
  const res = await apisVocabulary.get(`/users/${userId}/flashcard/due`, {
    params: { limit },
  });
  return res;
}
export async function reviewFlashcard(
  userId: string,
  cardId: string,
  grade: number
) {
  const res = await apisVocabulary.post(
    `/users/${userId}/flashcard/${cardId}/review`,
    {
      grade,
    }
  );
  return res;
}
export async function getFlashcardProgress(userId: string) {
  const res = await apisVocabulary.get(`/users/${userId}/flashcard/progress`);
  return res;
}
export async function getPublicHandler(params?: {
  status?: string;
  category?: string;
  page?: number;
  pageSize?: number;
}) {
  const res = await apisVocabulary.get("/decks", {
    params: {
      status: params?.status ?? "",
      category: params?.category ?? "",
      page: params?.page ?? 1,
      pageSize: params?.pageSize ?? 10,
    },
  });
  return res;
}
export async function subscribeDeck(userId: string, deckId: string) {
  const res = await apisVocabulary.post(`/users/${userId}/subscribe/${deckId}`);
  return res;
}
export async function getUserSubscriptions(userId: string) {
  const res = await apisVocabulary.get(`/users/${userId}/subscribe`);
  return res;
}
export async function audioSubmitFromUrl(mediaBlobUrl: string) {
  const file = await webmToWavFile(mediaBlobUrl);

  const form = new FormData();
  form.append("request", file);

  const resp = await apisSpeaking.post("/speaking/transcript", form, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
    transformRequest: (data) => data,
  });

  return resp;
}

export async function createExam(
  title: string,
  taskText: string,
  examType: number,
  level: string,
  tag: string
) {
  const res = await apisWriting.post(`/admin/create`, {
    title,
    taskText,
    examType,
    level,
    tag,
  });
  return res;
}
export async function gradeWriting(
  examId: string,
  answer: string,
  timeSpentSeconds: number
) {
  const res = await apisWriting.post(`/writing/grade`, {
    examId,
    answer,
    timeSpentSeconds,
  });

  return res;
}
export async function getWritingExams() {
  const res = await apisWriting.get("/writing/exams");
  return res;
}
export async function getWritingExamById(examId: string) {
  const res = await apisWriting.get(`/writing/exams/${examId}`);
  return res;
}
export async function getSpeakingExams() {
  const res = await apisSpeaking.get("/speaking/exams");
  return res;
}
export async function startWritingExam(examId: string) {
  const res = await apisWriting.post(`/writing/start/${examId}`, {});

  return res;
}
export async function startSpeakingExam(examId: string) {
  const res = await apisSpeaking.post(`/speaking/start/${examId}`);
  return res;
}
export async function getWritingExam(examId: string) {
  const res = await apisWriting.get(`/writing/exams/${examId}`);
  return res;
}
export async function getSpeakingExamsById(examId: string) {
  const res = await apisSpeaking.get(`/speaking/exams/${examId}`);
  return res;
}
export async function gradeSpeaking(params: {
  examId: string;
  timeSpentSeconds: number;
  speech: Blob | File;
}) {
  const { examId, timeSpentSeconds, speech } = params;

  const formData = new FormData();
  formData.append("examId", examId);
  formData.append("timeSpentSeconds", String(timeSpentSeconds));

  const filename =
    speech instanceof File ? speech.name : "speaking-recording.webm";

  formData.append("speech", speech, filename);

  const res = await apisSpeaking.post("/speaking/grade", formData, {
    headers: {
      "Content-Type": undefined,
    },
    withCredentials: true,
  });

  return res;
}
export async function uploadFile(params: { file: Blob | File }) {
  const { file } = params;
  const filename = file instanceof File ? file.name : "speaking-recording.webm";
  const formData = new FormData();
  formData.append("file", file, filename);
  const res = await apisSpeaking.post("/upload/audio", formData, {
    headers: {
      "Content-Type": undefined,
    },
    withCredentials: true,
  });
  return res;
}
export async function getPlacementStatus() {
  const res = await apisAttempt.get("/attempt/placement/status");
  return res;
}
export async function getWritingHistory() {
  const res = await apisWriting.get("/writing/history");
  return res;
}
export async function getSpeakingHistory() {
  const res = await apisSpeaking.get("/speaking/history");
  return res;
}

export async function getWritingHistoryById(submissionId: string) {
  const res = await apisWriting.get(`/writing/history/${submissionId}`);
  return res;
}
export async function getSpeakingHistoryById(submissionId: string) {
  const res = await apisSpeaking.get(`/speaking/history/${submissionId}`);
  return res;
}
export async function suggestDictionary(word: string, pos?: string) {
  const res = await apisDictionary.get("/dictionary/suggest", {
    params: {
      word,
      pos,
    },
  });
  return res.data;
}
export async function getDictionaryDetails(id: number) {
  const res = await apisDictionary.get(`/dictionary/details/${id}`);
  return res.data;
}
