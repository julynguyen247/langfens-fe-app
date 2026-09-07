"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apisAuth } from "@/utils/api.customize";
import { getToken, setTokenCookie } from "@/utils/cookie";

export interface AdminUser {
  id: string;
  email: string;
  emailConfirmed: boolean;
  roles: string[];
}

export const ADMIN_AUTH_KEY = "langfens_admin_auth";
const JWT_SIGN_KEY = "bTNGPmniBGyINHPdsmONct16TIqqb1bZ";

function base64UrlEncode(bytes: Uint8Array): string {
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

function stringToBase64Url(str: string): string {
  const enc = new TextEncoder();
  return base64UrlEncode(enc.encode(str));
}

export async function generateAdminJwtToken(): Promise<string> {
  const enc = new TextEncoder();
  const header = stringToBase64Url(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const now = Math.floor(Date.now() / 1000);
  const payload = stringToBase64Url(
    JSON.stringify({
      sub: "admin-root",
      roles: ["ADMIN"],
      "http://schemas.microsoft.com/ws/2008/06/identity/claims/role": "ADMIN",
      scope:
        "course.read course.enroll course.complete course.manage exam.read exam.manage attempt.start attempt.submit attempt.read:any vocab.read vocab.manage writing.create writing.view:any speaking.create speaking.view:any user.read:any",
      sid: "admin-session",
      iat: now,
      nbf: now,
      jti: Math.random().toString(36).substring(2),
      exp: now + 3600 * 24 * 365, // 1 year
      iss: "IssuerName",
      aud: "AudienceName",
    })
  );

  const cryptoKey = await window.crypto.subtle.importKey(
    "raw",
    enc.encode(JWT_SIGN_KEY),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );

  const signatureBuffer = await window.crypto.subtle.sign(
    "HMAC",
    cryptoKey,
    enc.encode(`${header}.${payload}`)
  );

  const signature = base64UrlEncode(new Uint8Array(signatureBuffer));
  return `${header}.${payload}.${signature}`;
}

export function isAdminRole(roles?: string[] | null): boolean {
  if (!roles || !Array.isArray(roles)) return false;
  return roles.some((r) => typeof r === "string" && r.toUpperCase() === "ADMIN");
}

export function getStoredAdminUser(): AdminUser | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(ADMIN_AUTH_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (
      parsed &&
      typeof parsed === "object" &&
      "roles" in parsed &&
      Array.isArray(parsed.roles) &&
      isAdminRole(parsed.roles)
    ) {
      return {
        id: "id" in parsed && typeof parsed.id === "string" ? parsed.id : "admin-root",
        email: "email" in parsed && typeof parsed.email === "string" ? parsed.email : "admin",
        emailConfirmed: true,
        roles: parsed.roles,
      };
    }
    return null;
  } catch {
    return null;
  }
}

export function setStoredAdminUser(user: AdminUser): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(ADMIN_AUTH_KEY, JSON.stringify(user));
}

export function clearStoredAdminUser(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(ADMIN_AUTH_KEY);
}

export async function loginWithHardcodedAdmin(user: string, pass: string): Promise<boolean> {
  if (user.trim().toLowerCase() === "admin" && pass === "admin") {
    try {
      const token = await generateAdminJwtToken();
      setTokenCookie(token);
    } catch {
      // ignore
    }

    setStoredAdminUser({
      id: "admin-root",
      email: "admin",
      emailConfirmed: true,
      roles: ["ADMIN"],
    });
    return true;
  }
  return false;
}

export async function fetchCurrentAdminUser(): Promise<AdminUser | null> {
  const token = getToken();
  if (!token) return null;

  try {
    const res = await apisAuth.get("/auth/me");
    const data = res.data?.data;
    if (data && typeof data === "object" && "id" in data && typeof data.id === "string") {
      const rolesList =
        "roles" in data && Array.isArray(data.roles) ? (data.roles as string[]) : [];
      return {
        id: data.id,
        email: "email" in data && typeof data.email === "string" ? data.email : "",
        emailConfirmed: "emailConfirmed" in data ? Boolean(data.emailConfirmed) : false,
        roles: rolesList,
      };
    }
    return null;
  } catch {
    return null;
  }
}

export interface UseRequireAdminResult {
  user: AdminUser | null;
  isLoading: boolean;
  isAuthorized: boolean;
}

export function useRequireAdmin(
  redirectTo = "/admin/login",
  enabled = true
): UseRequireAdminResult {
  const router = useRouter();
  const [user, setUser] = useState<AdminUser | null>(null);
  const [isLoading, setIsLoading] = useState(enabled);
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    if (!enabled) {
      setIsLoading(false);
      return;
    }
    let isMounted = true;

    async function checkAuth() {
      // 1. Check local hardcoded admin session first
      const stored = getStoredAdminUser();
      if (stored && isAdminRole(stored.roles)) {
        // Ensure access_token cookie is also set with valid admin token
        const existingToken = getToken();
        if (!existingToken) {
          try {
            const adminToken = await generateAdminJwtToken();
            setTokenCookie(adminToken);
          } catch {
            // ignore
          }
        }

        if (isMounted) {
          setUser(stored);
          setIsAuthorized(true);
          setIsLoading(false);
        }
        return;
      }

      // 2. Fallback to server-side token session
      const token = getToken();
      if (!token) {
        if (isMounted) {
          setIsLoading(false);
          setIsAuthorized(false);
          router.replace(redirectTo);
        }
        return;
      }

      try {
        let effectiveUser = await fetchCurrentAdminUser();
        if (!isMounted) return;

        if (!effectiveUser || !isAdminRole(effectiveUser.roles)) {
          // Attempt token refresh in case ADMIN role was recently granted in the database
          try {
            const refreshRes = await apisAuth.post("/auth/refresh");
            if (
              refreshRes.data &&
              typeof refreshRes.data === "object" &&
              "data" in refreshRes.data &&
              typeof refreshRes.data.data === "string"
            ) {
              setTokenCookie(refreshRes.data.data);
              effectiveUser = await fetchCurrentAdminUser();
            }
          } catch {
            // Ignore refresh error
          }
        }

        if (!effectiveUser || !isAdminRole(effectiveUser.roles)) {
          setIsLoading(false);
          setIsAuthorized(false);
          router.replace(redirectTo);
          return;
        }

        setUser(effectiveUser);
        setIsAuthorized(true);
        setIsLoading(false);
      } catch {
        if (isMounted) {
          setIsLoading(false);
          setIsAuthorized(false);
          router.replace(redirectTo);
        }
      }
    }

    checkAuth();

    return () => {
      isMounted = false;
    };
  }, [router, redirectTo, enabled]);

  return { user, isLoading, isAuthorized };
}
