import { Page, expect } from "@playwright/test";

export const TEST_EMAIL = "e2e+writing@langfens.test";
export const TEST_PASSWORD = "E2eTest!2026";

/**
 * Logs in via the FE login page. Assumes the seed_user.py script has
 * already created the user against the backing auth-service.
 */
export async function loginViaUi(page: Page): Promise<void> {
  await page.goto("/auth/login");
  await page.getByLabel(/email/i).fill(TEST_EMAIL);
  await page.getByLabel(/password/i).fill(TEST_PASSWORD);
  await page.getByRole("button", { name: /log ?in|sign ?in|đăng nhập/i }).click();
  await expect(page).not.toHaveURL(/\/auth\/login/, { timeout: 15_000 });
}

/**
 * Hits the BFF / gateway login route directly to bypass UI flake. Use for tests
 * that are not specifically about the login flow.
 */
export async function loginViaApi(
  page: Page,
  gateway = process.env.GATEWAY_URL ?? "http://localhost:5000",
): Promise<void> {
  const resp = await page.request.post(`${gateway}/api-auth/auth/login`, {
    data: { email: TEST_EMAIL, password: TEST_PASSWORD },
  });
  if (!resp.ok()) {
    throw new Error(`backend login failed: ${resp.status()} ${await resp.text()}`);
  }
}
