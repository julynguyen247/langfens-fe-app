import { describe, it, expect } from "vitest";
import {
  validateMatchingPromptParity,
  validateGeneratedMatchingQuestion,
} from "../validation";
import autogenContract from "../autogenContract.json";

function getContractQuestion(type: string): Record<string, unknown> {
  const ex = (autogenContract.examples as Array<{ question?: { type?: string } }> | undefined)?.find(
    (e) => e?.question?.type === type
  );
  if (!ex?.question) throw new Error(`Missing contract example for ${type}`);
  return JSON.parse(JSON.stringify(ex.question));
}

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

describe("validateGeneratedMatchingQuestion — Contract Parity & Guardrails", () => {
  const matchingTypes = [
    "MATCHING_HEADING",
    "MATCHING_INFORMATION",
    "MATCHING_FEATURES",
    "MATCHING_ENDINGS",
  ] as const;

  for (const qtype of matchingTypes) {
    it(`accepts canonical contract example for ${qtype} with 0 errors`, () => {
      const q = getContractQuestion(qtype);
      const issues = validateGeneratedMatchingQuestion(
        q,
        qtype,
        String(q.skill || "READING"),
        Number(q.difficulty || 3)
      );
      const errors = issues.filter((iss) => iss.level === "error");
      expect(errors).toEqual([]);
    });

    it(`rejects non-object payload for ${qtype}`, () => {
      const issues = validateGeneratedMatchingQuestion("not-an-object", qtype, "READING", 3);
      expect(issues.some((iss) => iss.field === "root")).toBe(true);
    });

    it(`rejects mismatched type for ${qtype}`, () => {
      const q = getContractQuestion(qtype);
      q.type = "MULTIPLE_CHOICE_SINGLE";
      const issues = validateGeneratedMatchingQuestion(q, qtype, "READING", 3);
      expect(issues.some((iss) => iss.field === "type")).toBe(true);
    });

    it(`rejects mismatched skill for ${qtype}`, () => {
      const q = getContractQuestion(qtype);
      q.skill = "LISTENING";
      const issues = validateGeneratedMatchingQuestion(q, qtype, "READING", 3);
      expect(issues.some((iss) => iss.field === "skill")).toBe(true);
    });

    it(`rejects boolean difficulty for ${qtype}`, () => {
      const q = getContractQuestion(qtype);
      q.difficulty = true as unknown as number;
      const issues = validateGeneratedMatchingQuestion(q, qtype, "READING", 3);
      expect(issues.some((iss) => iss.field === "difficulty")).toBe(true);
    });
  }

  it("rejects forbidden answer-family fields on matching questions", () => {
    const q = getContractQuestion("MATCHING_FEATURES");
    q.blankAcceptTexts = { "1": ["text"] };
    const issues = validateGeneratedMatchingQuestion(q, "MATCHING_FEATURES", "READING", 3);
    expect(issues.some((iss) => iss.field === "blankAcceptTexts")).toBe(true);
  });

  it("rejects letter keys in matchPairs", () => {
    const q = getContractQuestion("MATCHING_FEATURES");
    const mp = q.matchPairs as Record<string, unknown>;
    mp["A"] = mp["1"];
    delete mp["1"];
    const issues = validateGeneratedMatchingQuestion(q, "MATCHING_FEATURES", "READING", 3);
    expect(issues.some((iss) => iss.message.includes("positive decimal string"))).toBe(true);
  });

  it("rejects when isCorrect is true for any option", () => {
    const q = getContractQuestion("MATCHING_FEATURES");
    const opts = q.options as Array<Record<string, unknown>>;
    opts[0].isCorrect = true;
    const issues = validateGeneratedMatchingQuestion(q, "MATCHING_FEATURES", "READING", 3);
    expect(issues.some((iss) => iss.field.includes("isCorrect"))).toBe(true);
  });

  it("rejects non-sequential or duplicate option idx", () => {
    const q = getContractQuestion("MATCHING_FEATURES");
    const opts = q.options as Array<Record<string, unknown>>;
    opts[1].idx = 1;
    const issues = validateGeneratedMatchingQuestion(q, "MATCHING_FEATURES", "READING", 3);
    expect(issues.some((iss) => iss.field === "options.idx")).toBe(true);
  });

  it("rejects unknown gradingKey not in options pool", () => {
    const q = getContractQuestion("MATCHING_FEATURES");
    const mp = q.matchPairs as Record<string, string[]>;
    mp["1"] = ["Z", "Blockbuster exhibitions"];
    const issues = validateGeneratedMatchingQuestion(q, "MATCHING_FEATURES", "READING", 3);
    expect(issues.some((iss) => iss.message.includes("does not exist in options choice pool"))).toBe(true);
  });

  it("rejects missing distractor option", () => {
    const q = getContractQuestion("MATCHING_HEADING");
    const opts = q.options as Array<Record<string, unknown>>;
    // Retain only 5 options for 5 targets (no distractor)
    q.options = opts.slice(0, 5);
    const issues = validateGeneratedMatchingQuestion(q, "MATCHING_HEADING", "READING", 3);
    expect(issues.some((iss) => iss.message.includes("distractor"))).toBe(true);
  });

  it("rejects duplicate gradingKey for MATCHING_HEADING", () => {
    const q = getContractQuestion("MATCHING_HEADING");
    const mp = q.matchPairs as Record<string, string[]>;
    mp["2"] = ["i", mp["1"][1]];
    const issues = validateGeneratedMatchingQuestion(q, "MATCHING_HEADING", "READING", 3);
    expect(issues.some((iss) => iss.message.includes("grading keys must be distinct"))).toBe(true);
  });

  it("rejects duplicate gradingKey for MATCHING_ENDINGS", () => {
    const q = getContractQuestion("MATCHING_ENDINGS");
    const mp = q.matchPairs as Record<string, string[]>;
    mp["2"] = ["A", mp["2"][1]];
    const issues = validateGeneratedMatchingQuestion(q, "MATCHING_ENDINGS", "READING", 3);
    expect(issues.some((iss) => iss.message.includes("grading keys must be distinct"))).toBe(true);
  });

  it("rejects MATCHING_HEADING displayLabel when set to paragraph name instead of heading", () => {
    const q = getContractQuestion("MATCHING_HEADING");
    const mp = q.matchPairs as Record<string, string[]>;
    mp["1"] = ["i", "Paragraph 1"];
    const issues = validateGeneratedMatchingQuestion(q, "MATCHING_HEADING", "READING", 3);
    expect(issues.some((iss) => iss.message.includes("does not match correct heading text"))).toBe(true);
  });

  it("rejects non-heading displayLabel when mismatched with prompt target text", () => {
    const q = getContractQuestion("MATCHING_FEATURES");
    const mp = q.matchPairs as Record<string, string[]>;
    mp["1"] = ["A", "Wrong Target Text"];
    const issues = validateGeneratedMatchingQuestion(q, "MATCHING_FEATURES", "READING", 3);
    expect(issues.some((iss) => iss.message.includes("does not match target text"))).toBe(true);
  });

  it("enforces MATCHING_INFORMATION pool label format 'X. Paragraph X'", () => {
    const q = getContractQuestion("MATCHING_INFORMATION");
    const opts = q.options as Array<Record<string, unknown>>;
    opts[0].contentMd = "A. Some invalid text";
    const issues = validateGeneratedMatchingQuestion(q, "MATCHING_INFORMATION", "READING", 3);
    expect(issues.some((iss) => iss.message.includes("must be 'A. Paragraph A'"))).toBe(true);
  });
});
