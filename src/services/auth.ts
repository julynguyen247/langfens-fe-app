import { apisAuth } from "../utils/api.customize";

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
  return apisAuth.post("/auth/confirm-otp-reset-password", { email, otp, newPassword });
}
