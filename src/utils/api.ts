import { apisAttempt, apisAuth, apisExam } from "./api.customize";

export async function loginWithGoogle(idToken: string) {
  const { data } = await apisAuth.post("/api/auth/login-google", {
    idToken,
  });
  return data;
}
export async function register(email: string, password: string) {
  const res = await apisAuth.post("/api/auth/register", {
    email,
    password,
  });
  return res;
}
export async function login(email: string, password: string) {
  const res = await apisAuth.post("/api/auth/login", {
    email,
    password,
  });
  return res;
}

export async function logout() {
  const res = await apisAuth.post("/api/auth/logout");
  return res;
}

export async function refresh() {
  const res = await apisAuth.post("/api/auth/refresh");
  return res;
}

export async function getMe() {
  const res = await apisAuth.get("/api/auth/me");
  return res;
}

export async function verifyEmail(email: string, otp: string) {
  const res = await apisAuth.get("/api/auth/verify", {
    params: { email, otp },
  });
  return res;
}

export async function resendEmail(email: string) {
  const res = await apisAuth.post("/api/auth/resend-otp", null, {
    params: { email },
  });
  return res;
}

export async function startAttempt(userId: string, examId: string) {
  const res = await apisAttempt.post(
    "/attempts:start",
    { examId },
    {
      params: { userId },
    }
  );
  return res;
}

export async function autoSaveAttempt(
  userId: string,
  attemptId: string,
  payload: {
    answers: Array<{
      questionId: string;
      sectionId: string;
      selectedOptionIds?: string[];
      textAnswer?: string;
    }>;
    clientRevision: number;
  }
) {
  const res = await apisAttempt.post(
    `/attempt/autosave/${userId}/${attemptId}`,
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
  const res = await apisExam.get("/api/public/exam/getall", {
    params: {
      page,
      pageSize,
      category: opts?.category,
      level: opts?.level,
    },
  });
  return res;
}
