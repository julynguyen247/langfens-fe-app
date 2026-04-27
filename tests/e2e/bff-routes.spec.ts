import { expect, test } from "@playwright/test";
import { TEST_EMAIL, TEST_PASSWORD } from "./helpers/auth";

test.describe("BFF route smoke", () => {
  test("grammar/explain BFF proxies to ai-service", async ({ request }) => {
    const gateway = process.env.GATEWAY_URL ?? "http://localhost:5000";
    const login = await request.post(
      `${gateway}/api-auth/api/auth/login`,
      { data: { email: TEST_EMAIL, password: TEST_PASSWORD } },
    );
    expect(login.ok(), `login: ${login.status()}`).toBeTruthy();

    const resp = await request.post("/api/grammar/explain", {
      data: {
        error_text: "the goverment must to spend",
        context: "the goverment must to spend more money",
        correct_form: "the government must spend",
        language: "en-GB",
      },
    });
    expect(resp.status(), await resp.text()).toBe(200);
    const body = await resp.json();
    expect(body.explanation).toBeTruthy();
    expect(Array.isArray(body.examples)).toBeTruthy();
    expect(body.examples.length).toBeGreaterThanOrEqual(2);
  });
});
