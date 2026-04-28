import axios, { AxiosError, AxiosInstance, AxiosRequestConfig } from "axios";
import { getToken as getCookieToken, setTokenCookie } from "./cookie";

type ServiceKey =
  | "auth"
  | "exam"
  | "attempt"
  | "vocabulary"
  | "speaking"
  | "writing"
  | "dictionary"
  | "gamification"
  | "analytics"
  | "notification"
  | "studyplan"
  | "course"
  | "ai";

const GATEWAY_BASE = process.env.NEXT_PUBLIC_GATEWAY_URL || "";
const buildBase = (suffix: string) =>
  GATEWAY_BASE ? `${GATEWAY_BASE}${suffix}` : suffix;

const BASE_URL: Record<ServiceKey, string> = {
  auth: buildBase("/api-auth"),
  exam: buildBase("/api-exams"),
  attempt: buildBase("/api-attempts"),
  vocabulary: buildBase("/api-vocabulary"),
  speaking: buildBase("/api-speaking"),
  writing: buildBase("/api-writing"),
  dictionary: buildBase("/api-dictionary"),
  gamification: buildBase("/api-gamification"),
  analytics: buildBase("/api-analytics"),
  notification: buildBase("/api-notification"),
  studyplan: buildBase("/api-study-plan"),
  course: buildBase("/api-course"),
  ai: buildBase("/api-ai"),
};

const getToken = () => getCookieToken();

const setToken = (t: string | null) => {
  setTokenCookie(t);
};

// Raw axios instance for refresh — no interceptors, prevents infinite loop
const rawAuthClient = axios.create({
  baseURL: BASE_URL.auth,
  withCredentials: true,
  headers: { "Content-Type": "application/json" },
});

// Mutex: only one refresh at a time, others wait for the same promise
let refreshPromise: Promise<string | null> | null = null;

async function refreshToken(): Promise<string | null> {
  if (refreshPromise) return refreshPromise;

  refreshPromise = rawAuthClient
    .post("/auth/refresh")
    .then((r) => {
      const newToken: string | null = r.data?.data ?? null;
      setTokenCookie(newToken);
      return newToken;
    })
    .catch(() => {
      setToken(null);
      return null;
    })
    .finally(() => {
      refreshPromise = null;
    });

  return refreshPromise;
}

const apis = Object.fromEntries(
  (Object.keys(BASE_URL) as (keyof typeof BASE_URL)[]).map((k) => {
    const api = axios.create({
      baseURL: BASE_URL[k],
      withCredentials: true,
      headers: { "Content-Type": "application/json" },
    });

    // Attach token
    api.interceptors.request.use((config) => {
      const tok = getToken();
      if (tok) {
        config.headers = config.headers ?? {};
        (config.headers as any).Authorization = `Bearer ${tok}`;
      }
      return config;
    });

    // Auto refresh token
    api.interceptors.response.use(
      (res) => res,
      async (err: AxiosError) => {
        const original = err.config as
          | (AxiosRequestConfig & { _retry?: boolean })
          | undefined;

        if (err.response?.status === 401 && original && !original._retry) {
          original._retry = true;
          const newToken = await refreshToken();

          if (newToken) {
            original.headers = original.headers ?? {};
            (original.headers as any).Authorization = `Bearer ${newToken}`;
            return api.request(original);
          }
        }

        return Promise.reject(err);
      }
    );

    return [k, api];
  })
) as Record<ServiceKey, AxiosInstance>;

// Exports
export const apisAuth = apis.auth;
export const apisExam = apis.exam;
export const apisAttempt = apis.attempt;
export const apisVocabulary = apis.vocabulary;
export const apisSpeaking = apis.speaking;
export const apisWriting = apis.writing;
export const apisDictionary = apis.dictionary;
export const apisGamification = apis.gamification;
export const apisAnalytics = apis.analytics;
export const apisNotification = apis.notification;
export const apisStudyplan = apis.studyplan;
export const apisCourse = apis.course;
export const apisAi = apis.ai;
const api = apisAuth;
export default api;

