import { expect, test } from "@playwright/test";
import { loginViaUi } from "./helpers/auth";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const ESSAY_TEXT = readFileSync(
  join(__dirname, "fixtures", "essay-band-6.txt"),
  "utf-8",
);

const SEED_EXAM_ID =
  process.env.SEED_EXAM_ID ?? "04e44b9a-098a-43c4-bbe9-29c5e2f6a01b";

test.describe("Writing Grammar tab — detect + explain pipeline (mocked AI)", () => {
  test.beforeEach(async ({ page }) => {
    await loginViaUi(page);

    // Mock comparison endpoint — return a minimal valid response immediately.
    await page.route(/\/api-writing\/writing\/[^/]+\/comparison$/, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          overall_analysis: "ok",
          vocabulary_feedback: "",
          grammar_feedback: "",
          task_response_feedback: "",
          coherence_feedback: "",
          step_up_band: 6.5,
          target_band: 7.0,
          step_up_analysis: "",
          target_analysis: "",
          key_improvements: [],
          sentence_comparisons: [],
          references: [],
          no_references_found: true,
        }),
      });
    });

    // Mock detect → return 2 errors.
    await page.route(/\/api-ai\/v1\/grammar\/detect$/, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          errors: [
            {
              error_text: "He go",
              context: "He go to school yesterday.",
              correct_form: "He went",
            },
            {
              error_text: "She have",
              context: "She have many books.",
              correct_form: "She has",
            },
          ],
        }),
      });
    });

    // Mock batch-explain → 2 explanations.
    await page.route(/\/api-ai\/v1\/grammar\/batch-explain$/, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          results: [
            {
              explanation: "Past tense required.",
              rule_description: "Simple past tense",
              correct_form: "He went",
              examples: ["She went home."],
              category: "tense",
            },
            {
              explanation: "Third-person singular needs '-s'.",
              rule_description: "Subject-verb agreement",
              correct_form: "She has",
              examples: ["He has a dog."],
              category: "subject-verb",
            },
          ],
          failed_count: 0,
          total_count: 2,
        }),
      });
    });
  });

  test("Grammar tab loads on click and renders explained errors", async ({ page }) => {
    await page.goto(`/do-test/writing/start/${SEED_EXAM_ID}`);
    await page.getByRole("textbox").first().fill(ESSAY_TEXT);
    await page.getByRole("button", { name: /submit|grade|nộp bài|chấm/i }).click();
    await page.waitForURL(/\/attempts\/[a-f0-9-]+/, { timeout: 30_000 });

    // Wait for band score (proves grading completed).
    await expect(page.getByText(/band\s*\d/i).first()).toBeVisible({ timeout: 60_000 });

    // Click the Grammar Analysis tab.
    await page.getByRole("button", { name: /grammar analysis/i }).click();

    // GrammarBatchView header appears with the count of grammar issues found.
    await expect(page.getByText(/2 grammar issues found/i)).toBeVisible({
      timeout: 15_000,
    });

    // Both grammar-explainer cards render.
    await expect(page.getByTestId("grammar-explainer-card")).toHaveCount(2);
  });

  test("Grammar tab shows empty state when detect returns no errors", async ({ page }) => {
    // Override detect to return empty.
    await page.unroute(/\/api-ai\/v1\/grammar\/detect$/);
    await page.route(/\/api-ai\/v1\/grammar\/detect$/, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ errors: [] }),
      });
    });

    await page.goto(`/do-test/writing/start/${SEED_EXAM_ID}`);
    await page.getByRole("textbox").first().fill(ESSAY_TEXT);
    await page.getByRole("button", { name: /submit|grade|nộp bài|chấm/i }).click();
    await page.waitForURL(/\/attempts\/[a-f0-9-]+/, { timeout: 30_000 });
    await expect(page.getByText(/band\s*\d/i).first()).toBeVisible({ timeout: 60_000 });

    await page.getByRole("button", { name: /grammar analysis/i }).click();
    await expect(page.getByText(/no grammar issues to analyze/i)).toBeVisible({
      timeout: 10_000,
    });
  });

  test("Grammar tab shows error state + retry button when detect fails", async ({ page }) => {
    await page.unroute(/\/api-ai\/v1\/grammar\/detect$/);
    await page.route(/\/api-ai\/v1\/grammar\/detect$/, async (route) => {
      await route.fulfill({
        status: 500,
        contentType: "application/json",
        body: JSON.stringify({ detail: "Internal" }),
      });
    });

    await page.goto(`/do-test/writing/start/${SEED_EXAM_ID}`);
    await page.getByRole("textbox").first().fill(ESSAY_TEXT);
    await page.getByRole("button", { name: /submit|grade|nộp bài|chấm/i }).click();
    await page.waitForURL(/\/attempts\/[a-f0-9-]+/, { timeout: 30_000 });
    await expect(page.getByText(/band\s*\d/i).first()).toBeVisible({ timeout: 60_000 });

    await page.getByRole("button", { name: /grammar analysis/i }).click();
    await expect(page.getByText(/failed to load grammar analysis/i)).toBeVisible({
      timeout: 10_000,
    });
    await expect(page.getByRole("button", { name: /retry/i })).toBeVisible();
  });
});
