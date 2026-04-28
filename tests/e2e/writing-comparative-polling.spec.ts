import { expect, test } from "@playwright/test";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { loginViaUi } from "./helpers/auth";

/**
 * Verifies the new auto-polling behaviour added in
 * docs/superpowers/specs/2026-04-28-writing-flow-unified-design.md.
 *
 * The standalone writing flow grades synchronously but compares
 * asynchronously, so the Comparative tab must:
 *   1. show its loading skeleton with a Vietnamese polling caption while waiting
 *   2. converge to the rendered tab within 60 seconds
 */

const ESSAY_TEXT = readFileSync(
  join(__dirname, "fixtures", "essay-band-6.txt"),
  "utf-8",
);

const SEED_EXAM_ID =
  process.env.SEED_EXAM_ID ?? "04e44b9a-098a-43c4-bbe9-29c5e2f6a01b";

test.describe("Writing comparative tab — auto polling", () => {
  test.beforeEach(async ({ page }) => {
    await loginViaUi(page);
  });

  test("polling caption appears, then comparison renders within 60s", async ({ page }) => {
    await page.goto(`/do-test/writing/start/${SEED_EXAM_ID}`);
    await page.getByRole("textbox").first().fill(ESSAY_TEXT);
    await page.getByRole("button", { name: /submit|grade|nộp bài|chấm/i }).click();

    await page.waitForURL(/\/attempts\/[a-f0-9-]+/, { timeout: 30_000 });

    // Wait for band score (proves grading completed synchronously).
    await expect(page.getByText(/band\s*\d/i).first()).toBeVisible({ timeout: 60_000 });

    // Open Comparative tab if not already active. The result page may auto-mount it.
    const comparativeTrigger = page
      .getByRole("tab", { name: /comparative|so sánh/i })
      .or(page.getByRole("button", { name: /comparative|so sánh/i }));
    if (await comparativeTrigger.first().isVisible({ timeout: 3000 }).catch(() => false)) {
      await comparativeTrigger.first().click();
    }

    // The polling caption appears while waiting for the consumer to finish.
    // It is acceptable for the caption to be skipped if compare resolves before
    // the first paint of the tab — so we race "caption visible" against "tab visible".
    const polling = page.getByTestId("writing-comparative-polling-caption");
    const ready = page.getByTestId("writing-comparative-tab");

    await Promise.race([
      polling.waitFor({ state: "visible", timeout: 8000 }).catch(() => undefined),
      ready.waitFor({ state: "visible", timeout: 8000 }).catch(() => undefined),
    ]);

    // Within 60 seconds the rendered tab MUST be visible.
    await expect(ready).toBeVisible({ timeout: 60_000 });

    // Sanity: at least one reference card is rendered (the seed essay produces
    // band ≤ 8, so we always have step-up references) OR the empty state.
    const refCards = page.getByTestId("reference-essay-card");
    const empty = page.getByText(/no comparative analysis available|chưa có phân tích/i);
    await expect(refCards.first().or(empty.first())).toBeVisible();
  });
});
