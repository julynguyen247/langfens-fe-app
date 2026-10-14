import { expect, test, type Page, type Request } from "@playwright/test";

const user = {
  id: "audit-user",
  email: "audit@example.com",
  emailConfirmed: true,
};
const baseURL = process.env.E2E_BASE_URL ?? "http://localhost:3000";

function json(body: unknown) {
  return {
    status: 200,
    contentType: "application/json",
    body: JSON.stringify(body),
  };
}

async function mockServices(
  page: Page,
  handler?: (request: Request) => unknown | undefined,
) {
  await page.route("**/api-*/**", async (route) => {
    const customBody = handler?.(route.request());
    if (customBody !== undefined) {
      await route.fulfill(json(customBody));
      return;
    }

    const pathname = new URL(route.request().url()).pathname;
    if (pathname.endsWith("/auth/me")) {
      await route.fulfill(json({ data: user }));
      return;
    }

    await route.fulfill(json({ data: [] }));
  });
}

function captureRuntimeErrors(page: Page) {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  return errors;
}

test("signs in and stores the access token", async ({ page }) => {
  const errors = captureRuntimeErrors(page);
  await mockServices(page, (request) => {
    if (new URL(request.url()).pathname.endsWith("/auth/login")) {
      return { data: "audit-token" };
    }
  });

  await page.goto("/auth/login");
  await page.getByLabel("Email").fill("audit@example.com");
  await page.getByLabel("Password").fill("correct-password");
  await page.getByRole("button", { name: "Sign in" }).click();

  await expect(page).toHaveURL(/\/home$/);
  await expect.poll(async () =>
    (await page.context().cookies()).some(
      (cookie) => cookie.name === "access_token" && cookie.value === "audit-token",
    ),
  ).toBe(true);
  expect(errors).toEqual([]);
});

test("looks up and saves a dictionary entry", async ({ page, context }) => {
  const errors = captureRuntimeErrors(page);
  await context.addCookies([
    { name: "access_token", value: "audit-token", url: baseURL },
  ]);
  await mockServices(page, (request) => {
    const pathname = new URL(request.url()).pathname;
    if (pathname.endsWith("/dictionary/suggest")) return [];
    if (pathname.endsWith("/dictionary/lookup")) {
      return {
        id: 1,
        word: "mitigate",
        pos: "verb",
        pronunciations: [{ region: "UK", ipa: "ˈmɪtɪɡeɪt", mp3Url: null }],
        senses: [{
          id: "sense-1",
          definitionEn: "Make something harmful less severe.",
          examples: ["Trees help mitigate urban heat."],
          labels: [],
        }],
        forms: [],
      };
    }
  });

  await page.goto("/dictionary");
  await page.getByPlaceholder("Type a word (e.g., 'mitigate')...").fill("mitigate");
  await page.getByRole("button", { name: "Search" }).click();

  await expect(page.getByRole("heading", { name: "mitigate" })).toBeVisible();
  await expect(page.getByText("Make something harmful less severe.")).toBeVisible();
  await page.getByRole("button", { name: "Save Word" }).click();
  await expect(page.getByRole("button", { name: "Saved" })).toBeVisible();
  expect(errors).toEqual([]);
});

test("subscribes to a public flashcard deck", async ({ page, context }) => {
  const errors = captureRuntimeErrors(page);
  await context.addCookies([
    { name: "access_token", value: "audit-token", url: baseURL },
  ]);
  let subscribed = false;
  await mockServices(page, (request) => {
    const pathname = new URL(request.url()).pathname;
    if (pathname.endsWith("/decks")) {
      return {
        data: [{
          id: "deck-1",
          title: "Academic Vocabulary",
          description: "High-frequency IELTS words",
          category: "vocab",
          creator: "Langfens",
          cardCount: 20,
        }],
      };
    }
    if (pathname.endsWith("/users/audit-user/subscribe")) return { data: [] };
    if (pathname.endsWith("/users/audit-user/subscribe/deck-1")) {
      subscribed = true;
      return { data: { deckId: "deck-1" } };
    }
  });

  await page.goto("/flashcards/explore");
  await expect(page.getByText("Academic Vocabulary")).toBeVisible();
  await page.getByRole("button", { name: "Clone" }).click();
  await expect(page.getByRole("button", { name: "Subscribed" })).toBeVisible();
  expect(subscribed).toBe(true);
  expect(errors).toEqual([]);
});

test("creates a flashcard deck and its first card", async ({ page, context }) => {
  const errors = captureRuntimeErrors(page);
  await context.addCookies([
    { name: "access_token", value: "audit-token", url: baseURL },
  ]);
  const requests: string[] = [];
  await mockServices(page, (request) => {
    const pathname = new URL(request.url()).pathname;
    if (request.method() === "POST" && pathname.endsWith("/users/deck")) {
      requests.push("deck");
      return { data: { id: "deck-1" } };
    }
    if (request.method() === "POST" && pathname.endsWith("/users/deck/deck-1/card")) {
      requests.push("card");
      return { data: { id: "card-1" } };
    }
  });

  await page.goto("/flashcards/create");
  await page.getByPlaceholder("Enter deck name...").fill("Audit Vocabulary");
  await page.locator("select").first().selectOption("ielts");
  await page.getByPlaceholder("Term *").fill("mitigate");
  await page.getByPlaceholder("Meaning *").fill("make less severe");
  await page.getByRole("button", { name: "Save Deck" }).click();

  await expect(page).toHaveURL(/\/flashcards$/);
  expect(requests).toEqual(["deck", "card"]);
  expect(errors).toEqual([]);
});

test("switches between grammar explanations", async ({ page, context }) => {
  const errors = captureRuntimeErrors(page);
  await context.addCookies([
    { name: "access_token", value: "audit-token", url: baseURL },
  ]);
  await mockServices(page);
  await page.goto("/grammar/explainer");
  await page.getByRole("button", { name: /Error 2/ }).click();
  await expect(page.getByText("I agree with this opinion.", { exact: true })).toBeVisible();
  expect(errors).toEqual([]);
});
