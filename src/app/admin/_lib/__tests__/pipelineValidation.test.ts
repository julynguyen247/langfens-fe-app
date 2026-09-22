import { describe, it, expect } from "vitest";
import { validateQuestionPayload } from "../validation";

describe("validateQuestionPayload — Pipeline Validation (Q1 - Q10)", () => {
  // ── Q1: MULTIPLE_CHOICE_SINGLE ──────────────────────────────────────────
  describe("Q1: MULTIPLE_CHOICE_SINGLE", () => {
    it("accepts valid single choice with exactly 1 correct option", () => {
      const issues = validateQuestionPayload({
        type: "MULTIPLE_CHOICE_SINGLE",
        skill: "READING",
        difficulty: 2,
        promptMd: "Which material was NOT used?",
        options: [
          { idx: 1, contentMd: "Papyrus", isCorrect: false },
          { idx: 2, contentMd: "Clay", isCorrect: false },
          { idx: 3, contentMd: "All of the above", isCorrect: true },
          { idx: 4, contentMd: "Wood", isCorrect: false },
        ],
      });
      const errors = issues.filter((i) => i.level === "error");
      expect(errors).toHaveLength(0);
    });

    it("rejects when multiple options are marked correct", () => {
      const issues = validateQuestionPayload({
        type: "MULTIPLE_CHOICE_SINGLE",
        skill: "READING",
        difficulty: 2,
        promptMd: "Pick one.",
        options: [
          { idx: 1, contentMd: "A", isCorrect: true },
          { idx: 2, contentMd: "B", isCorrect: true },
        ],
      });
      const errors = issues.filter((i) => i.level === "error");
      expect(errors.some((e) => e.field === "options.isCorrect")).toBe(true);
    });

    it("rejects when forbidden fields are populated", () => {
      const issues = validateQuestionPayload({
        type: "MULTIPLE_CHOICE_SINGLE",
        skill: "READING",
        difficulty: 2,
        promptMd: "Pick one.",
        options: [
          { idx: 1, contentMd: "A", isCorrect: true },
          { idx: 2, contentMd: "B", isCorrect: false },
        ],
        blankAcceptTexts: { "1": ["leak"] },
      });
      const errors = issues.filter((i) => i.level === "error");
      expect(errors.some((e) => e.field === "blankAcceptTexts")).toBe(true);
    });
  });

  // ── Q2: TRUE_FALSE_NOT_GIVEN ────────────────────────────────────────────
  describe("Q2: TRUE_FALSE_NOT_GIVEN", () => {
    it("accepts valid True/False/Not Given with exactly 1 correct option", () => {
      const issues = validateQuestionPayload({
        type: "TRUE_FALSE_NOT_GIVEN",
        skill: "READING",
        difficulty: 2,
        promptMd: "The statement is true.",
        options: [
          { idx: 1, contentMd: "True", isCorrect: true },
          { idx: 2, contentMd: "False", isCorrect: false },
          { idx: 3, contentMd: "Not Given", isCorrect: false },
        ],
      });
      const errors = issues.filter((i) => i.level === "error");
      expect(errors).toHaveLength(0);
    });

    it("rejects when options do not match True/False/Not Given", () => {
      const issues = validateQuestionPayload({
        type: "TRUE_FALSE_NOT_GIVEN",
        skill: "READING",
        difficulty: 2,
        promptMd: "The statement is true.",
        options: [
          { idx: 1, contentMd: "Yes", isCorrect: true },
          { idx: 2, contentMd: "No", isCorrect: false },
          { idx: 3, contentMd: "Maybe", isCorrect: false },
        ],
      });
      const errors = issues.filter((i) => i.level === "error");
      expect(errors.some((e) => e.field === "options")).toBe(true);
    });
  });

  // ── Q3: SENTENCE_COMPLETION ─────────────────────────────────────────────
  describe("Q3: SENTENCE_COMPLETION", () => {
    it("accepts valid completion with prompt [N] ↔ BlankAcceptTexts parity", () => {
      const issues = validateQuestionPayload({
        type: "SENTENCE_COMPLETION",
        skill: "READING",
        difficulty: 2,
        promptMd: "Complete: The dynasty was [1] and the trade road was [2].",
        blankAcceptTexts: {
          "1": ["Han"],
          "2": ["Silk Road"],
        },
      });
      const errors = issues.filter((i) => i.level === "error");
      expect(errors).toHaveLength(0);
    });

    it("rejects when promptMd is missing [N] placeholder required by BlankAcceptTexts", () => {
      const issues = validateQuestionPayload({
        type: "SENTENCE_COMPLETION",
        skill: "READING",
        difficulty: 2,
        promptMd: "Complete: The dynasty was [1] only.",
        blankAcceptTexts: {
          "1": ["Han"],
          "2": ["Silk Road"],
        },
      });
      const errors = issues.filter((i) => i.level === "error");
      expect(errors.some((e) => e.field === "promptMd" && e.message.includes("[2]"))).toBe(true);
    });
  });

  // ── Q4: TABLE_COMPLETION ────────────────────────────────────────────────
  describe("Q4: TABLE_COMPLETION", () => {
    it("accepts valid table completion with markdown table and blanks", () => {
      const issues = validateQuestionPayload({
        type: "TABLE_COMPLETION",
        skill: "READING",
        difficulty: 3,
        promptMd: "| Era | Material |\n|---|---|\n| 19th century | [1] |",
        blankAcceptTexts: {
          "1": ["wood pulp"],
        },
      });
      const errors = issues.filter((i) => i.level === "error");
      expect(errors).toHaveLength(0);
    });
  });

  // ── Q5: FLOW_CHART ──────────────────────────────────────────────────────
  describe("Q5: FLOW_CHART", () => {
    it("accepts valid flow chart with >= 2 lowercase hyphenated slugs", () => {
      const issues = validateQuestionPayload({
        type: "FLOW_CHART",
        skill: "READING",
        difficulty: 2,
        promptMd: "Put steps in order:\nA. First\nB. Second\nC. Third",
        orderCorrects: [
          "collect-raw-materials",
          "soak-fibres-in-water",
          "dry-resulting-sheets",
        ],
      });
      const errors = issues.filter((i) => i.level === "error");
      expect(errors).toHaveLength(0);
    });

    it("rejects when FLOW_CHART contains blankAcceptTexts", () => {
      const issues = validateQuestionPayload({
        type: "FLOW_CHART",
        skill: "READING",
        difficulty: 2,
        promptMd: "Process flow with illegal blanks.",
        orderCorrects: ["step-one", "step-two"],
        blankAcceptTexts: { "1": ["illegal"] },
      });
      const errors = issues.filter((i) => i.level === "error");
      expect(errors.some((e) => e.field === "blankAcceptTexts")).toBe(true);
    });

    it("rejects when orderCorrects contains uppercase or spaces (non-slug)", () => {
      const issues = validateQuestionPayload({
        type: "FLOW_CHART",
        skill: "READING",
        difficulty: 2,
        promptMd: "Process flow.",
        orderCorrects: ["Invalid Step One", "step-two"],
      });
      const errors = issues.filter((i) => i.level === "error");
      expect(errors.some((e) => e.field === "orderCorrects")).toBe(true);
    });
  });

  // ── Q6: MATCHING_HEADING ────────────────────────────────────────────────
  describe("Q6: MATCHING_HEADING", () => {
    it("accepts valid matching heading with paragraph range and heading list in prompt", () => {
      const issues = validateQuestionPayload({
        type: "MATCHING_HEADING",
        skill: "READING",
        difficulty: 3,
        promptMd: "The reading passage has five paragraphs, 1–5.\nChoose the correct heading for each paragraph.\n\ni. First heading\nii. Second heading\niii. Third heading\niv. Fourth heading\nv. Fifth heading",
        options: [
          { idx: 1, contentMd: "i. First heading" },
          { idx: 2, contentMd: "ii. Second heading" },
          { idx: 3, contentMd: "iii. Third heading" },
          { idx: 4, contentMd: "iv. Fourth heading" },
          { idx: 5, contentMd: "v. Fifth heading" },
        ],
        matchPairs: {
          "1": ["i", "First heading"],
          "2": ["ii", "Second heading"],
          "3": ["iii", "Third heading"],
          "4": ["iv", "Fourth heading"],
          "5": ["v", "Fifth heading"],
        },
      });
      const errors = issues.filter((i) => i.level === "error");
      expect(errors).toHaveLength(0);
    });
  });

  // ── Q7: MATCHING_INFORMATION ────────────────────────────────────────────
  describe("Q7: MATCHING_INFORMATION", () => {
    it("accepts valid matching information with numbered statements in prompt", () => {
      const issues = validateQuestionPayload({
        type: "MATCHING_INFORMATION",
        skill: "READING",
        difficulty: 3,
        promptMd: "Which paragraph contains the following information?\n\n1. First statement\n2. Second statement",
        options: [
          { idx: 1, contentMd: "A. Paragraph A" },
          { idx: 2, contentMd: "B. Paragraph B" },
        ],
        matchPairs: {
          "1": ["B", "First statement"],
          "2": ["A", "Second statement"],
        },
      });
      const errors = issues.filter((i) => i.level === "error");
      expect(errors).toHaveLength(0);
    });

    it("rejects when promptMd is missing the numbered statements matching MatchPairs", () => {
      const issues = validateQuestionPayload({
        type: "MATCHING_INFORMATION",
        skill: "READING",
        difficulty: 3,
        promptMd: "Which paragraph contains information? (no statements listed)",
        options: [
          { idx: 1, contentMd: "A. Paragraph A" },
          { idx: 2, contentMd: "B. Paragraph B" },
        ],
        matchPairs: {
          "1": ["B", "First statement"],
          "2": ["A", "Second statement"],
        },
      });
      const errors = issues.filter((i) => i.level === "error");
      expect(errors.some((e) => e.field === "promptMd")).toBe(true);
    });
  });

  // ── Q8: YES_NO_NOT_GIVEN ────────────────────────────────────────────────
  describe("Q8: YES_NO_NOT_GIVEN", () => {
    it("accepts valid Yes/No/Not Given with exactly 1 correct option", () => {
      const issues = validateQuestionPayload({
        type: "YES_NO_NOT_GIVEN",
        skill: "READING",
        difficulty: 2,
        promptMd: "The claim is supported by the text.",
        options: [
          { idx: 1, contentMd: "Yes", isCorrect: true },
          { idx: 2, contentMd: "No", isCorrect: false },
          { idx: 3, contentMd: "Not Given", isCorrect: false },
        ],
      });
      const errors = issues.filter((i) => i.level === "error");
      expect(errors).toHaveLength(0);
    });
  });

  // ── Q9: MATCHING_FEATURES ───────────────────────────────────────────────
  describe("Q9: MATCHING_FEATURES", () => {
    it("accepts valid matching features with numbered initiatives in prompt", () => {
      const issues = validateQuestionPayload({
        type: "MATCHING_FEATURES",
        skill: "READING",
        difficulty: 3,
        promptMd: "Match each initiative with the correct feature.\n\n1. Blockbuster exhibitions\n2. Digital technology",
        options: [
          { idx: 1, contentMd: "A. Feature A" },
          { idx: 2, contentMd: "B. Feature B" },
        ],
        matchPairs: {
          "1": ["A", "Blockbuster exhibitions"],
          "2": ["B", "Digital technology"],
        },
      });
      const errors = issues.filter((i) => i.level === "error");
      expect(errors).toHaveLength(0);
    });
  });

  // ── Q10: MATCHING_ENDINGS ───────────────────────────────────────────────
  describe("Q10: MATCHING_ENDINGS", () => {
    it("accepts valid matching endings with numbered beginnings in prompt", () => {
      const issues = validateQuestionPayload({
        type: "MATCHING_ENDINGS",
        skill: "READING",
        difficulty: 3,
        promptMd: "Complete each sentence with the correct ending.\n\n1. Beginning one\n2. Beginning two",
        options: [
          { idx: 1, contentMd: "A. Ending A" },
          { idx: 2, contentMd: "B. Ending B" },
        ],
        matchPairs: {
          "1": ["A", "Beginning one"],
          "2": ["B", "Beginning two"],
        },
      });
      const errors = issues.filter((i) => i.level === "error");
      expect(errors).toHaveLength(0);
    });

    it("rejects when sentence beginnings are missing from promptMd", () => {
      const issues = validateQuestionPayload({
        type: "MATCHING_ENDINGS",
        skill: "READING",
        difficulty: 3,
        promptMd: "Complete each sentence. (sentences omitted)",
        options: [
          { idx: 1, contentMd: "A. Ending A" },
          { idx: 2, contentMd: "B. Ending B" },
        ],
        matchPairs: {
          "1": ["A", "Beginning one"],
          "2": ["B", "Beginning two"],
        },
      });
      const errors = issues.filter((i) => i.level === "error");
      expect(errors.some((e) => e.field === "promptMd")).toBe(true);
    });
  });

  // ── Canonical Q23 & Q25 Parity ──────────────────────────────────────────
  describe("Canonical Standard Exam Parity (Q23 Classification & Q25 Image MCQ)", () => {
    it("Q23: accepts CLASSIFICATION with single-element matchPairs values like ['A']", () => {
      const issues = validateQuestionPayload({
        type: "CLASSIFICATION",
        skill: "READING",
        difficulty: 3,
        promptMd: "Classify statements:\n1. Statement one\n2. Statement two",
        options: [
          { idx: 1, contentMd: "A. Category A" },
          { idx: 2, contentMd: "B. Category B" },
        ],
        matchPairs: {
          "1": ["A"],
          "2": ["B"],
        },
      });
      const errors = issues.filter((i) => i.level === "error");
      expect(errors).toHaveLength(0);
    });

    it("Q25: accepts MULTIPLE_CHOICE_SINGLE_IMAGE with option-level images when question imageUrl is null", () => {
      const issues = validateQuestionPayload({
        type: "MULTIPLE_CHOICE_SINGLE_IMAGE",
        skill: "READING",
        difficulty: 2,
        promptMd: "Which image matches?",
        imageUrl: null,
        options: [
          { idx: 1, contentMd: "A", imageUrl: "https://example.com/1.png", altText: "Opt 1", isCorrect: true },
          { idx: 2, contentMd: "B", imageUrl: "https://example.com/2.png", altText: "Opt 2", isCorrect: false },
        ],
      });
      const errors = issues.filter((i) => i.level === "error");
      expect(errors).toHaveLength(0);
    });
  });
});
