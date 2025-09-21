import api from "./api.customize";

export async function loginWithGoogle(idToken: string) {
  const { data } = await api.post("/api/auth/login-google", {
    idToken,
  });
  return data;
}
