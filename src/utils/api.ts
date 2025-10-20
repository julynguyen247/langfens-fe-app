import api from "./api.customize";

export async function loginWithGoogle(idToken: string) {
  const { data } = await api.post("/api/auth/login-google", {
    idToken,
  });
  return data;
}
export async function register(email: string, password: string) {
  const res = await api.post("/api/auth/register", {
    email,
    password,
  });
  return res;
}
export async function login(email: string, password: string) {
  const res = await api.post("/api/auth/login", {
    email,
    password,
  });
  return res;
}

export async function logout() {
  const res = await api.post("/api/auth/logout");
  return res;
}

export async function refresh() {
  const res = await api.post("/api/auth/refresh");
  return res;
}

export async function getMe() {
  const res = await api.get("/api/auth/me");
  return res;
}

export async function verifyEmail(email: string, otp: string) {
  const res = await api.get("/api/auth/verify", {
    params: { email, otp },
  });
  return res;
}

export async function resendEmail(email: string) {
  const res = await api.post("/api/auth/resend-otp", null, {
    params: { email },
  });
  return res;
}
