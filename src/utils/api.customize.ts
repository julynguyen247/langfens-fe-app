import axios, { AxiosError, AxiosInstance, AxiosRequestConfig } from "axios";

type ServiceKey = "auth" | "exam" | "attempt" | "vocabulary";
const GATEWAY_BASE = process.env.NEXT_PUBLIC_GATEWAY_URL || ""; 
const buildBase = (suffix: string) =>
  GATEWAY_BASE ? `${GATEWAY_BASE}${suffix}` : suffix;

const BASE_URL: Record<ServiceKey, string> = {
  auth: buildBase("/api-auth"),
  exam: buildBase("/api-exams"),
  attempt: buildBase("/api-attempts"),
  vocabulary: buildBase("/api-vocabulary"),
};

const getToken = () =>
  typeof window !== "undefined" ? localStorage.getItem("access_token") : null;

const setToken = (t: string | null) => {
  if (typeof window === "undefined") return;
  if (t) localStorage.setItem("access_token", t);
  else localStorage.removeItem("access_token");
};

const apis = Object.fromEntries(
  (Object.keys(BASE_URL) as (keyof typeof BASE_URL)[]).map((k) => {
    const api = axios.create({
      baseURL: BASE_URL[k],
      withCredentials: true,
      headers: { "Content-Type": "application/json" },
    });

    api.interceptors.request.use((config) => {
      const tok = getToken();
      if (tok) {
        config.headers = config.headers ?? {};
        (config.headers as any).Authorization = `Bearer ${tok}`;
      }
      return config;
    });
    console.log(GATEWAY_BASE);
    api.interceptors.response.use(
      (res) => res,
      async (err: AxiosError) => {
        const original = err.config as
          | (AxiosRequestConfig & { _retry?: boolean })
          | undefined;

        if (err.response?.status === 401 && original && !original._retry) {
          original._retry = true;
          try {
            const r = await apisAuth.post("/auth/refresh", undefined, {
              withCredentials: true,
            });
            const newToken = (r.data as any)?.accessToken ?? null;
            if (newToken) {
              setToken(newToken);
              original.headers = original.headers ?? {};
              (original.headers as any).Authorization = `Bearer ${newToken}`;
            }
            return api.request(original);
          } catch {
            setToken(null);
          }
        }
        return Promise.reject(err);
      }
    );

    return [k, api];
  })
) as Record<ServiceKey, AxiosInstance>;

export const apisAuth = apis.auth;
export const apisExam = apis.exam;
export const apisAttempt = apis.attempt;
export const apisVocabulary = apis.vocabulary;

const api = apisAuth;
export default api;
