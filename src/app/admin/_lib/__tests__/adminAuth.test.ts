import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  isAdminRole,
  getStoredAdminUser,
  setStoredAdminUser,
  clearStoredAdminUser,
  loginAdmin,
  fetchCurrentAdminUser,
  ADMIN_AUTH_KEY,
  type AdminUser,
} from "../adminAuth";
import { apisAuth } from "@/utils/api.customize";
import type { AxiosResponse } from "axios";

vi.mock("@/utils/api.customize", () => ({
  apisAuth: {
    post: vi.fn(),
    get: vi.fn(),
  },
}));

const TEST_ADMIN: AdminUser = {
  id: "admin-123",
  email: "admin@langfens.test",
  emailConfirmed: true,
  roles: ["ADMIN"],
};

describe("adminAuth", () => {
  beforeEach(() => {
    localStorage.clear();
    document.cookie = "access_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT;";
    vi.clearAllMocks();
  });

  describe("isAdminRole", () => {
    it("returns true when roles contains ADMIN (any case)", () => {
      expect(isAdminRole(["ADMIN"])).toBe(true);
      expect(isAdminRole(["admin"])).toBe(true);
      expect(isAdminRole(["User", "Admin"])).toBe(true);
    });

    it("returns false when roles does not contain ADMIN or is empty", () => {
      expect(isAdminRole(["USER"])).toBe(false);
      expect(isAdminRole([])).toBe(false);
      expect(isAdminRole(null)).toBe(false);
      expect(isAdminRole(undefined)).toBe(false);
    });
  });

  describe("storage helpers", () => {
    it("stores and retrieves admin user", () => {
      setStoredAdminUser(TEST_ADMIN);
      const retrieved = getStoredAdminUser();
      expect(retrieved).not.toBeNull();
      expect(retrieved?.email).toBe("admin@langfens.test");
      expect(retrieved?.roles).toEqual(["ADMIN"]);
    });

    it("returns null when no user is stored or roles are not admin", () => {
      expect(getStoredAdminUser()).toBeNull();

      localStorage.setItem(
        ADMIN_AUTH_KEY,
        JSON.stringify({ id: "u1", email: "user@test.com", roles: ["USER"] })
      );
      expect(getStoredAdminUser()).toBeNull();
    });

    it("clears stored admin user", () => {
      setStoredAdminUser(TEST_ADMIN);
      expect(getStoredAdminUser()).not.toBeNull();
      clearStoredAdminUser();
      expect(getStoredAdminUser()).toBeNull();
    });
  });

  describe("loginAdmin", () => {
    it("succeeds with valid admin credentials and stores user", async () => {
      vi.mocked(apisAuth.post).mockResolvedValueOnce({
        data: { isSuccess: true, data: "mock-backend-jwt-token" },
      } as unknown as AxiosResponse);
      vi.mocked(apisAuth.get).mockResolvedValueOnce({
        data: {
          isSuccess: true,
          data: {
            id: "admin-123",
            email: "admin@langfens.test",
            emailConfirmed: true,
            roles: ["ADMIN"],
          },
        },
      } as unknown as AxiosResponse);

      const res = await loginAdmin("admin@langfens.test", "SecurePass!123");
      expect(res.success).toBe(true);
      expect(getStoredAdminUser()).toEqual(TEST_ADMIN);
      expect(document.cookie).toContain("access_token=");
    });

    it("fails when user does not have ADMIN role", async () => {
      vi.mocked(apisAuth.post).mockResolvedValueOnce({
        data: { isSuccess: true, data: "mock-student-jwt-token" },
      } as unknown as AxiosResponse);
      vi.mocked(apisAuth.get).mockResolvedValueOnce({
        data: {
          isSuccess: true,
          data: {
            id: "user-456",
            email: "student@langfens.test",
            emailConfirmed: true,
            roles: ["USER"],
          },
        },
      } as unknown as AxiosResponse);

      const res = await loginAdmin("student@langfens.test", "Pass!123");
      expect(res.success).toBe(false);
      expect(res.message).toContain("administrator privileges");
      expect(getStoredAdminUser()).toBeNull();
    });

    it("fails when login API returns error", async () => {
      vi.mocked(apisAuth.post).mockRejectedValueOnce({
        response: { data: { message: "Invalid email or password." } },
      });

      const res = await loginAdmin("unknown@test.com", "wrongpass");
      expect(res.success).toBe(false);
      expect(res.message).toBe("Invalid email or password.");
      expect(getStoredAdminUser()).toBeNull();
    });
  });

  describe("fetchCurrentAdminUser", () => {
    it("returns null when no token cookie exists", async () => {
      const user = await fetchCurrentAdminUser();
      expect(user).toBeNull();
    });

    it("fetches and validates admin user when token exists", async () => {
      document.cookie = "access_token=valid-jwt-token; path=/;";
      vi.mocked(apisAuth.get).mockResolvedValueOnce({
        data: {
          isSuccess: true,
          data: {
            id: "admin-123",
            email: "admin@langfens.test",
            emailConfirmed: true,
            roles: ["ADMIN"],
          },
        },
      } as unknown as AxiosResponse);

      const user = await fetchCurrentAdminUser();
      expect(user).toEqual(TEST_ADMIN);
      expect(getStoredAdminUser()).toEqual(TEST_ADMIN);
    });
  });
});
