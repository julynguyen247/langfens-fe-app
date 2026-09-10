// Vitest is not yet installed in this repo. The single TS2307 error below is
// the documented signal that the runner needs `npm i -D vitest`. All cases
// are .skip — they will be picked up automatically once the runner is wired.
import { describe, it, expect } from "vitest";
import { parseUserAnswer } from "../parseUserAnswer";
import type { AttemptAnswerItem } from "@/components/exam-v3/types";

const ans = (overrides: Partial<AttemptAnswerItem>): AttemptAnswerItem => ({
  idx: 0,
  isCorrect: false,
  selectedAnswerText: null,
  selectedOptionIds: null,
  textAnswer: null,
  ...overrides,
} as AttemptAnswerItem);

describe.skip("parseUserAnswer", () => {
  it("multiline: 2 lines → 0-indexed dict {0, 1}", () => {
    const out = parseUserAnswer(ans({ textAnswer: "cortisol\nnucleus accumbens" }));
    expect(out).toEqual({ 0: "cortisol", 1: "nucleus accumbens" });
  });

  it("multiline: 3 lines → 0-indexed dict {0, 1, 2}", () => {
    const out = parseUserAnswer(ans({ textAnswer: "a\nb\nc" }));
    expect(out).toEqual({ 0: "a", 1: "b", 2: "c" });
  });

  it("JSON object: preserved as 0-indexed dict", () => {
    const out = parseUserAnswer(
      ans({ textAnswer: '{"0": "cortisol", "1": "nucleus accumbens"}' }),
    );
    expect(out).toEqual({ 0: "cortisol", 1: "nucleus accumbens" });
  });

  it("single-line plaintext: returned as-is", () => {
    const out = parseUserAnswer(ans({ textAnswer: "cortisol" }));
    expect(out).toBe("cortisol");
  });

  it("empty textAnswer: empty string", () => {
    const out = parseUserAnswer(ans({ textAnswer: "" }));
    expect(out).toBe("");
  });

  it("whitespace-only multiline: empty string (filter trims to nothing)", () => {
    const out = parseUserAnswer(ans({ textAnswer: "  \n  \n  " }));
    expect(out).toBe("");
  });

  it("JSON array: preserved as string[]", () => {
    const out = parseUserAnswer(ans({ textAnswer: '["a", "b"]' }));
    expect(out).toEqual(["a", "b"]);
  });

  it("selectedOptionIds wins over textAnswer", () => {
    const out = parseUserAnswer(
      ans({ selectedOptionIds: ["opt-1"], textAnswer: "ignored" }),
    );
    expect(out).toEqual(["opt-1"]);
  });
});
