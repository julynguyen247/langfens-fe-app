import { describe, expect, it } from "vitest";
import { QuestionType } from "../types";
import { LLM_PROMPTS, getLlmPrompt } from "../llmPrompts";
import { callAi, tryParseLlmJson } from "../aiConfig";
import type { AiConfig } from "../aiConfig";

const ALL_TYPES: string[] = Object.values(QuestionType);

describe("LLM_PROMPTS coverage", () => {
  it("has entries for all 19 QuestionType values", () => {
    expect(Object.keys(LLM_PROMPTS).length).toBe(ALL_TYPES.length);
    expect(Object.keys(LLM_PROMPTS).sort()).toEqual([...ALL_TYPES].sort());
  });

  for (const type of ALL_TYPES) {
    describe(`${type}`, () => {
      it("getLlmPrompt returns non-null entry", () => {
        expect(getLlmPrompt(type)).not.toBeNull();
      });

      it("system prompt contains STRICT_JSON_INSTRUCTION markers", () => {
        const entry = getLlmPrompt(type);
        expect(entry).not.toBeNull();
        expect(entry!.system).toContain("Output ONLY a single JSON array");
        expect(entry!.system).toContain("No prose, no markdown fences");
      });

      it("userTemplate substitutes count and passage", () => {
        const entry = getLlmPrompt(type)!;
        const user = entry.userTemplate("foo passage", 3, { difficulty: "4" });
        expect(user).toContain("Generate 3");
        expect(user).toContain("foo passage");
      });
    });
  }
});

describe("server-proxy round-trip (mocked fetch)", () => {
  it("callAi parses response.questions into array", async () => {
    const originalFetch = global.fetch;
    global.fetch = (async (url: string | URL | Request, opts?: RequestInit) => {
      expect(String(url)).toContain("/api/v1/autogen/questions");
      const body = JSON.parse(String(opts?.body ?? "{}"));
      expect(body.type).toBe("MULTIPLE_CHOICE_SINGLE");
      expect(body.skill).toBe("READING");
      expect(body.count).toBe(1);
      return new Response(
        JSON.stringify({
          questions: [
            { type: "MULTIPLE_CHOICE_SINGLE", options: [], difficulty: 3 },
          ],
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    }) as typeof fetch;

    try {
      const cfg: AiConfig = {
        provider: "server-proxy",
        apiKey: "",
        model: "",
        endpoint: "http://test-server:8092",
        maxTokens: 4096,
      };
      const text = await callAi(cfg, "system", "user", {
        type: "MULTIPLE_CHOICE_SINGLE",
        skill: "READING",
        count: 1,
        difficulty: 3,
      });
      const parsed = tryParseLlmJson(text);
      expect(parsed).not.toBeNull();
      expect(Array.isArray(parsed)).toBe(true);
      expect((parsed as unknown[]).length).toBe(1);
    } finally {
      global.fetch = originalFetch;
    }
  });
});
