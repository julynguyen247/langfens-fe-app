import { describe, it, expect } from "vitest";
import { validateMatchingPromptParity } from "../validation";

describe("validateMatchingPromptParity", () => {
  it("accepts MATCHING_INFORMATION when all keys are numbered in promptMd", () => {
    const promptMd = `Which paragraph contains the following information?

1. Commercial pressures and exhibitions
2. Technology reshaping the museum
3. Ethical complexities of collections`;

    const issues = validateMatchingPromptParity(
      "MATCHING_INFORMATION",
      promptMd,
      ["1", "2", "3"]
    );
    expect(issues).toEqual([]);
  });

  it("reports error when a MatchPairs key is missing from promptMd", () => {
    const promptMd = `Which paragraph contains the following information?

1. Commercial pressures and exhibitions
2. Technology reshaping the museum`;

    const issues = validateMatchingPromptParity(
      "MATCHING_INFORMATION",
      promptMd,
      ["1", "2", "3"]
    );
    expect(issues).toHaveLength(1);
    expect(issues[0].level).toBe("error");
    expect(issues[0].field).toBe("promptMd");
    expect(issues[0].message).toContain('"3"');
  });

  it("accepts MATCHING_HEADING with paragraph range (e.g. five paragraphs, 1–5)", () => {
    const promptMd = `The reading passage has five paragraphs, 1–5.
Choose the correct heading for each paragraph.`;

    const issues = validateMatchingPromptParity(
      "MATCHING_HEADING",
      promptMd,
      ["1", "2", "3", "4", "5"]
    );
    expect(issues).toEqual([]);
  });

  it("ignores non-matching question types", () => {
    const issues = validateMatchingPromptParity(
      "MULTIPLE_CHOICE_SINGLE",
      "No matching here",
      ["1", "2"]
    );
    expect(issues).toEqual([]);
  });
});
