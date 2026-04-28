const TOKEN_NAME = "access_token";

/**
 * Get token from cookie (client-side read for non-HttpOnly fallback)
 */
export function getToken(): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(
    new RegExp("(^| )" + TOKEN_NAME + "=([^;]+)")
  );
  return match ? decodeURIComponent(match[2]) : null;
}

/**
 * Set token cookie with security flags
 * HttpOnly cannot be set from JS (server must do it), but we set the others
 */
export function setTokenCookie(token: string | null): void {
  if (typeof document === "undefined") return;
  if (token) {
    // Note: HttpOnly must be set by server; Secure and SameSite can be set here
    document.cookie = `${TOKEN_NAME}=${encodeURIComponent(token)}; path=/; SameSite=Strict; secure`;
  } else {
    removeTokenCookie();
  }
}

/**
 * Remove token cookie
 */
export function removeTokenCookie(): void {
  if (typeof document === "undefined") return;
  document.cookie = `${TOKEN_NAME}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Strict; secure`;
}
