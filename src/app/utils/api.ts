import api from "./api.customize";

export const checkEmailExist = async (email: string) => {
  const response = await api.get(
    "/api/v1/auth/is_email_available?email=" + email
  );
  return response.data.is_available;
};
