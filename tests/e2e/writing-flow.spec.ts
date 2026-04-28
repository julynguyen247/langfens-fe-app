import { expect, test } from "@playwright/test";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { loginViaUi } from "./helpers/auth";

const ESSAY_TEXT = readFileSync(
  join(__dirname, "fixtures", "essay-band-6.txt"),
  "utf-8",
);

const SEED_EXAM_ID =
  process.env.SEED_EXAM_ID ?? "04e44b9a-098a-43c4-bbe9-29c5e2f6a01b";

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

    // Direct-URL navigation to the writing-task page (avoids brittle nav clicks).
    await page.goto(`/do-test/writing/start/${SEED_EXAM_ID}`);

    // Find the essay editor; fall back to first textbox if a specific testid isn't present.
    const editor = page.getByRole("textbox").first();
    await editor.fill(ESSAY_TEXT);

    await page.getByRole("button", { name: /submit|grade|nộp bài|chấm/i }).click();

    // Land on /attempts/{attemptId}
    await page.waitForURL(/\/attempts\/[a-f0-9-]+/, { timeout: 30_000 });

    // Wait for band score to appear.
    await expect(page.getByText(/band\s*\d/i).first()).toBeVisible({ timeout: 60_000 });

    // Comparative tab should mount.
    await expect(page.getByTestId("writing-comparative-tab"))
      .toBeVisible({ timeout: 90_000 });

    // Reference essay card visible.
    await expect(page.getByTestId("reference-essay-card").first())
      .toBeVisible();

    // Sentence comparison table has at least one row.
    await expect(page.getByTestId("sentence-comparison-row").first())
      .toBeVisible();

    // Band progress indicator + vocabulary suggestions present.
    await expect(page.getByTestId("band-progress-indicator")).toBeVisible();
    await expect(page.getByTestId("vocabulary-suggestions")).toBeVisible();

    // Grammar explainer card present (renders inside SentenceComparisonTable rows).
    await expect(page.getByTestId("grammar-explainer-card").first())
      .toBeVisible();

    // Console hygiene.
    expect(
      consoleErrors,
      `console errors:\n${consoleErrors.join("\n")}`,
    ).toHaveLength(0);

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
    await page.goto(`/do-test/writing/start/${SEED_EXAM_ID}`);
    await page.getByRole("textbox").first().fill(ESSAY_TEXT);
    await page.getByRole("button", { name: /submit|grade|nộp bài|chấm/i }).click();
    await page.waitForURL(/\/attempts\/[a-f0-9-]+/, { timeout: 30_000 });
    await expect(page.getByText(/band\s*\d/i).first()).toBeVisible({ timeout: 60_000 });

    // Comparative tab still mounts but its content shows graceful empty state.
    await expect(page.getByTestId("writing-comparative-tab"))
      .toBeVisible({ timeout: 30_000 });
    await expect(
      page
        .getByText(/unavailable|not available|chưa có|không khả dụng/i)
        .first(),
    ).toBeVisible({ timeout: 30_000 });
  });
});
