/**
 * Baseline snapshot tests for the 8 existing system prompts.
 * These snapshots capture the current prompt text BEFORE any refactor.
 * Refactoring via buildSystemPrompt must produce byte-identical output.
 *
 * Run with: npx vitest run src/app/admin/_lib/__tests__/jsonShape.test.ts
 * Update snapshots: npx vitest run src/app/admin/_lib/__tests__/jsonShape.test.ts -u
 */
import { describe, it, expect } from "vitest";
import { LLM_PROMPTS } from "../llmPrompts";

const EIGHT_TYPES = [
  "CLASSIFICATION",
  "MATCHING_HEADING",
  "MULTIPLE_CHOICE_SINGLE",
  "MULTIPLE_CHOICE_MULTIPLE",
  "TRUE_FALSE_NOT_GIVEN",
  "SUMMARY_COMPLETION",
  "SHORT_ANSWER",
  "FLOW_CHART",
] as const;

describe("llmPrompts baseline snapshot", () => {
  for (const type of EIGHT_TYPES) {
    it(`system prompt for ${type} is unchanged`, () => {
      expect(LLM_PROMPTS[type]?.system).toMatchSnapshot();
    });
  }
});
