"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getToken, setTokenCookie, removeTokenCookie } from "@/utils/cookie";
import { apisAuth } from "@/utils/api.customize";
export interface AdminUser {
  id: string;
  email: string;
  emailConfirmed: boolean;
  roles: string[];
}

export const ADMIN_AUTH_KEY = "langfens_admin_auth";

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
        id: typeof parsed.id === "string" ? parsed.id : "",
        email: typeof parsed.email === "string" ? parsed.email : "",
        emailConfirmed: Boolean(parsed.emailConfirmed),
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

/**
 * Authenticates an admin user using the backend auth-service.
 * Validates credentials via /auth/login and confirms ADMIN role via /auth/me.
 */
export async function loginAdmin(
  email: string,
  pass: string
): Promise<{ success: boolean; message?: string }> {
  const normalizedEmail = email.trim();
  const password = pass.trim();

  if (!normalizedEmail || !password) {
    return { success: false, message: "Email and password are required." };
  }

  try {
    const loginRes = await apisAuth.post("/auth/login", {
      email: normalizedEmail,
      password,
    });

    const token =
      typeof loginRes.data?.data === "string"
        ? loginRes.data.data
        : typeof loginRes.data === "string"
        ? loginRes.data
        : null;

    if (!token) {
      return {
        success: false,
        message: loginRes.data?.message || "Login failed. No token received.",
      };
    }

    setTokenCookie(token);

    // Verify user profile and roles from auth-service /auth/me
    const meRes = await apisAuth.get("/auth/me", {
      headers: { Authorization: `Bearer ${token}` },
    });
    const userData = meRes.data?.data || meRes.data;
    const roles = Array.isArray(userData?.roles) ? userData.roles : [];

    if (!isAdminRole(roles)) {
      removeTokenCookie();
      clearStoredAdminUser();
      return {
        success: false,
        message: "Access denied. Your account does not have administrator privileges.",
      };
    }

    const adminUser: AdminUser = {
      id: userData?.id || "",
      email: userData?.email || normalizedEmail,
      emailConfirmed: Boolean(userData?.emailConfirmed),
      roles,
    };

    setStoredAdminUser(adminUser);
    return { success: true };
  } catch (err: unknown) {
    removeTokenCookie();
    clearStoredAdminUser();
    let errMsg = "Authentication failed. Please check your credentials.";
    if (err && typeof err === "object" && "response" in err) {
      const errResp = err as { response?: { data?: { message?: string; detail?: string } } };
      const data = errResp.response?.data;
      if (typeof data?.message === "string") errMsg = data.message;
      else if (typeof data?.detail === "string") errMsg = data.detail;
    }
    return { success: false, message: errMsg };
  }
}

export async function fetchCurrentAdminUser(): Promise<AdminUser | null> {
  const token = getToken();
  if (!token) {
    clearStoredAdminUser();
    return null;
  }

  try {
    const meRes = await apisAuth.get("/auth/me");
    const userData = meRes.data?.data || meRes.data;
    const roles = Array.isArray(userData?.roles) ? userData.roles : [];

    if (!isAdminRole(roles)) {
      clearStoredAdminUser();
      removeTokenCookie();
      return null;
    }

    const adminUser: AdminUser = {
      id: userData?.id || "",
      email: userData?.email || "",
      emailConfirmed: Boolean(userData?.emailConfirmed),
      roles,
    };
    setStoredAdminUser(adminUser);
    return adminUser;
  } catch {
    clearStoredAdminUser();
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

  // Initialize synchronously with cached state if token exists
  const [user, setUser] = useState<AdminUser | null>(() => {
    if (typeof window === "undefined" || !enabled) return null;
    const token = getToken();
    if (!token) return null;
    const stored = getStoredAdminUser();
    return stored && isAdminRole(stored.roles) ? stored : null;
  });

  const [isAuthorized, setIsAuthorized] = useState<boolean>(() => {
    if (typeof window === "undefined" || !enabled) return false;
    const token = getToken();
    if (!token) return false;
    const stored = getStoredAdminUser();
    return !!(stored && isAdminRole(stored.roles));
  });

  const [isLoading, setIsLoading] = useState<boolean>(() => {
    if (typeof window === "undefined" || !enabled) return false;
    const token = getToken();
    const stored = getStoredAdminUser();
    return !(token && stored && isAdminRole(stored.roles));
  });

  useEffect(() => {
    if (!enabled) {
      setIsLoading(false);
      return;
    }

    let isMounted = true;

    async function checkAuth() {
      const token = getToken();
      if (!token) {
        if (isMounted) {
          clearStoredAdminUser();
          setUser(null);
          setIsAuthorized(false);
          setIsLoading(false);
          router.replace(redirectTo);
        }
        return;
      }

      const admin = await fetchCurrentAdminUser();
      if (isMounted) {
        if (admin && isAdminRole(admin.roles)) {
          setUser(admin);
          setIsAuthorized(true);
        } else {
          clearStoredAdminUser();
          removeTokenCookie();
          setUser(null);
          setIsAuthorized(false);
          router.replace(redirectTo);
        }
        setIsLoading(false);
      }
    }

    checkAuth();

    return () => {
      isMounted = false;
    };
  }, [router, redirectTo, enabled]);

  return { user, isLoading, isAuthorized };
}
