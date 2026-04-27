import { expect, test } from "@playwright/test";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { loginViaUi } from "./helpers/auth";

const ESSAY_TEXT = readFileSync(
  join(__dirname, "fixtures", "essay-band-6.txt"),
  "utf-8",
);

test.describe("Writing E2E — golden path", () => {
  test.beforeEach(async ({ page }) => {
    await loginViaUi(page);
  });

  test("submit essay → see comparison → drill into grammar error", async ({ page }) => {
    const consoleErrors: string[] = [];
    page.on("console", (msg) => {
      if (msg.type() === "error") consoleErrors.push(msg.text());
    });
    page.on("pageerror", (err) => consoleErrors.push(`PAGE_ERROR: ${err.message}`));

    // Pick first writing exam — selectors are heuristic; adjust per real FE markup.
    await page.goto("/writing");
    const firstExam = page.getByRole("link", { name: /task 2|writing|đề thi/i }).first();
    await firstExam.click();

    const editor = page.getByRole("textbox").first();
    await editor.fill(ESSAY_TEXT);

    await page.getByRole("button", { name: /submit|grade|nộp bài|chấm/i }).click();

    // Land on attempts/[attemptId]
    await page.waitForURL(/\/attempts\/[a-f0-9-]+/, { timeout: 30_000 });

    // Wait for WritingResultView (band score visible)
    await expect(page.getByText(/band\s*\d/i).first()).toBeVisible({ timeout: 60_000 });

    // Open Comparative tab
    const comparativeTab = page.getByRole("tab", {
      name: /comparative|so sánh|đối chiếu/i,
    });
    await comparativeTab.click();

    // Reference essay card visible
    await expect(
      page.getByText(/band\s*[789](\.\d)?/i).first(),
    ).toBeVisible({ timeout: 90_000 });

    // SentenceComparisonTable: at least one "improved" cell
    await expect(
      page.getByText(/improved|better version|cải thiện/i).first(),
    ).toBeVisible();

    // BandProgressIndicator shows step-up band
    await expect(
      page.getByText(/step.?up|target|mục tiêu/i).first(),
    ).toBeVisible();

    // Click an inline grammar marker → GrammarExplainerCard appears
    const grammarTrigger = page.getByText(/explain|grammar|ngữ pháp/i).first();
    if (await grammarTrigger.isVisible().catch(() => false)) {
      await grammarTrigger.click();
      await expect(
        page.getByText(/rule|theory|quy tắc/i).first(),
      ).toBeVisible();
    }

    expect(consoleErrors, `console errors: ${consoleErrors.join("\n")}`).toHaveLength(0);

    await page.screenshot({
      path: "tests/e2e/screenshots/golden-path.png",
      fullPage: true,
    });
  });
});

test.describe("Writing E2E — comparison unavailable", () => {
  test.skip(
    !process.env.RUN_AI_DOWN,
    "set RUN_AI_DOWN=1 after stopping ai-service to run this scenario",
  );

  test.beforeEach(async ({ page }) => {
    await loginViaUi(page);
  });

  test("graceful empty state when ai-service down", async ({ page }) => {
    await page.goto("/writing");
    await page.getByRole("link", { name: /task 2|writing|đề thi/i }).first().click();
    await page.getByRole("textbox").first().fill(ESSAY_TEXT);
    await page.getByRole("button", { name: /submit|grade|nộp bài|chấm/i }).click();
    await page.waitForURL(/\/attempts\/[a-f0-9-]+/, { timeout: 30_000 });
    await expect(page.getByText(/band\s*\d/i).first()).toBeVisible({ timeout: 60_000 });
    await page
      .getByRole("tab", { name: /comparative|so sánh|đối chiếu/i })
      .click();
    await expect(
      page
        .getByText(/unavailable|not available|chưa có|không khả dụng/i)
        .first(),
    ).toBeVisible({ timeout: 30_000 });
  });
});
