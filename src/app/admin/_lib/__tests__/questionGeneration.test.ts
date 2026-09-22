import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import {
  generateQuestionsFromPassage,
  persistGeneratedQuestions,
  resolveSectionPassage,
  ParsedAuthorQuestion,
} from "../questionGeneration";
import * as aiConfigModule from "../aiConfig";
import * as adminApiModule from "../adminApi";
import { AdminQuestionItem, AdminOptionItem } from "../types";

describe("resolveSectionPassage", () => {
  it("prefers passageMd over transcriptMd", () => {
    const result = resolveSectionPassage({
      passageMd: "  The quick brown fox.  ",
      transcriptMd: "Audio transcript text",
    });
    expect(result).toBe("The quick brown fox.");
  });

  it("falls back to transcriptMd when passageMd is empty or null", () => {
    expect(
      resolveSectionPassage({
        passageMd: null,
        transcriptMd: "  Listening Section transcript  ",
      })
    ).toBe("Listening Section transcript");

    expect(
      resolveSectionPassage({
        passageMd: "   ",
        transcriptMd: "Transcript fallback",
      })
    ).toBe("Transcript fallback");
  });

  it("handles null or undefined section gracefully", () => {
    expect(resolveSectionPassage(null)).toBe("");
    expect(resolveSectionPassage(undefined)).toBe("");
    expect(resolveSectionPassage({})).toBe("");
  });
});

describe("generateQuestionsFromPassage", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("throws error when passage is empty or whitespace", async () => {
    await expect(
      generateQuestionsFromPassage({
        type: "MULTIPLE_CHOICE_SINGLE",
        passage: "   ",
      })
    ).rejects.toThrow("Source passage is required to generate questions.");

    await expect(
      generateQuestionsFromPassage({
        type: "MULTIPLE_CHOICE_SINGLE",
        passage: "",
      })
    ).rejects.toThrow("Source passage is required to generate questions.");
  });

  it("throws error if prompt template is missing for question type", async () => {
    await expect(
      generateQuestionsFromPassage({
        type: "NON_EXISTENT_TYPE",
        passage: "Some valid passage",
      })
    ).rejects.toThrow("No LLM prompt template for type NON_EXISTENT_TYPE");
  });

  it("correctly extracts options and builds AdminQuestionUpsert", async () => {
    const fakeLlmJson = JSON.stringify([
      {
        type: "MULTIPLE_CHOICE_SINGLE",
        skill: "READING",
        difficulty: 3,
        promptMd: "What is the primary topic discussed in paragraph 1?",
        explanationMd: "Paragraph 1 explicitly mentions solar flares.",
        options: [
          { idx: 1, contentMd: "Solar flares", isCorrect: true },
          { idx: 2, contentMd: "Deep ocean currents", isCorrect: false },
          { idx: 3, contentMd: "Plate tectonics", isCorrect: false },
          { idx: 4, contentMd: "Glacial movements", isCorrect: false },
        ],
      },
    ]);

    vi.spyOn(aiConfigModule, "callAi").mockResolvedValue(fakeLlmJson);
    vi.spyOn(aiConfigModule, "isAiConfigured").mockReturnValue(true);

    const result = await generateQuestionsFromPassage({
      type: "MULTIPLE_CHOICE_SINGLE",
      skill: "READING",
      passage: "Solar flares have been studied extensively since 1859...",
      count: 1,
      sectionId: "sec-123",
    });

    expect(result.rawText).toBe(fakeLlmJson);
    expect(result.questions.length).toBe(1);
    expect(result.validationErrors).toEqual([]);

    const q = result.questions[0];
    expect(q.upsert.SectionId).toBe("sec-123");
    expect(q.upsert.Type).toBe("MULTIPLE_CHOICE_SINGLE");
    expect(q.upsert.Skill).toBe("READING");
    expect(q.upsert.Difficulty).toBe(3);
    expect(q.upsert.PromptMd).toBe("What is the primary topic discussed in paragraph 1?");
    expect(q.upsert.ExplanationMd).toBe("Paragraph 1 explicitly mentions solar flares.");
    expect(q.options).toHaveLength(4);
    expect(q.options![0]).toEqual({
      idx: 1,
      contentMd: "Solar flares",
      isCorrect: true,
    });
  });

  it("flags validation errors from validateQuestionPayload", async () => {
    // Single choice requires exactly 1 correct option and >= 2 options.
    // We return 0 correct options to trigger a validation error.
    const invalidLlmJson = JSON.stringify([
      {
        type: "MULTIPLE_CHOICE_SINGLE",
        skill: "READING",
        difficulty: 3,
        promptMd: "Invalid question with no correct answer",
        options: [
          { idx: 1, contentMd: "Option A", isCorrect: false },
          { idx: 2, contentMd: "Option B", isCorrect: false },
        ],
      },
    ]);

    vi.spyOn(aiConfigModule, "callAi").mockResolvedValue(invalidLlmJson);
    vi.spyOn(aiConfigModule, "isAiConfigured").mockReturnValue(true);

    const result = await generateQuestionsFromPassage({
      type: "MULTIPLE_CHOICE_SINGLE",
      passage: "Valid passage text",
      count: 1,
    });

    expect(result.questions.length).toBe(1);
    expect(result.validationErrors.length).toBeGreaterThan(0);
    expect(
      result.validationErrors.some((e) =>
        e.includes("Single-choice question needs exactly 1 correct option")
      )
    ).toBe(true);
  });
});

describe("persistGeneratedQuestions", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("creates questions and sequential options in database", async () => {
    const mockCreateQuestion = vi
      .spyOn(adminApiModule, "createQuestion")
      .mockResolvedValue({
        id: "new-question-id-1",
        sectionId: "target-sec-id",
        idx: 1,
        type: "MULTIPLE_CHOICE_SINGLE",
        skill: "READING",
        difficulty: 3,
      } as AdminQuestionItem);

    const mockCreateOption = vi
      .spyOn(adminApiModule, "createOption")
      .mockResolvedValue({
        id: "opt-1",
        questionId: "new-question-id-1",
        idx: 1,
        contentMd: "Option 1",
        isCorrect: true,
      } as AdminOptionItem);

    const questionsToPersist: ParsedAuthorQuestion[] = [
      {
        upsert: {
          SectionId: "placeholder",
          Type: "MULTIPLE_CHOICE_SINGLE",
          Skill: "READING",
          Difficulty: 3,
          PromptMd: "Prompt text",
        },
        options: [
          { idx: 1, contentMd: "Option A", isCorrect: true },
          { idx: 2, contentMd: "Option B", isCorrect: false },
        ],
      },
    ];

    const savedCount = await persistGeneratedQuestions("target-sec-id", questionsToPersist);

    expect(savedCount).toBe(1);
    expect(mockCreateQuestion).toHaveBeenCalledTimes(1);
    expect(mockCreateQuestion).toHaveBeenCalledWith(
      expect.objectContaining({
        SectionId: "target-sec-id",
        PromptMd: "Prompt text",
      })
    );
    expect(mockCreateOption).toHaveBeenCalledTimes(2);
    expect(mockCreateOption).toHaveBeenNthCalledWith(1, {
      QuestionId: "new-question-id-1",
      Idx: 1,
      ContentMd: "Option A",
      IsCorrect: true,
    });
    expect(mockCreateOption).toHaveBeenNthCalledWith(2, {
      QuestionId: "new-question-id-1",
      Idx: 2,
      ContentMd: "Option B",
      IsCorrect: false,
    });
  });

  it("returns 0 when questions array is empty", async () => {
    const saved = await persistGeneratedQuestions("target-sec-id", []);
    expect(saved).toBe(0);
  });

  it("throws error and refuses to persist when questions fail validation", async () => {
    const mockCreateQuestion = vi.spyOn(adminApiModule, "createQuestion");
    const invalidQuestions: ParsedAuthorQuestion[] = [
      {
        upsert: {
          SectionId: "sec-1",
          Type: "MULTIPLE_CHOICE_SINGLE",
          Skill: "READING",
          Difficulty: 2,
          PromptMd: "Invalid MCQ with no correct option",
        },
        options: [
          { idx: 1, contentMd: "Option A", isCorrect: false },
          { idx: 2, contentMd: "Option B", isCorrect: false },
        ],
      },
    ];

    await expect(persistGeneratedQuestions("sec-1", invalidQuestions)).rejects.toThrow(
      /Cannot persist invalid Q#1/
    );
    expect(mockCreateQuestion).not.toHaveBeenCalled();
  });

  it("preserves option imageUrl and altText and enforces requested skill", async () => {
    const fakeLlmJson = JSON.stringify([
      {
        type: "MULTIPLE_CHOICE_SINGLE_IMAGE",
        skill: "LISTENING",
        difficulty: 2,
        promptMd: "Which image matches?",
        options: [
          { idx: 1, contentMd: "A", imageUrl: "https://img.co/1.png", altText: "Alt 1", isCorrect: true },
          { idx: 2, contentMd: "B", imageUrl: "https://img.co/2.png", altText: "Alt 2", isCorrect: false },
        ],
      },
    ]);

    vi.spyOn(aiConfigModule, "callAi").mockResolvedValue(fakeLlmJson);
    vi.spyOn(aiConfigModule, "isAiConfigured").mockReturnValue(true);

    const result = await generateQuestionsFromPassage({
      type: "MULTIPLE_CHOICE_SINGLE_IMAGE",
      skill: "READING",
      passage: "Passage mentioning visual artifacts...",
    });

    expect(result.questions[0].upsert.Skill).toBe("READING");
    expect(result.questions[0].options?.[0]).toMatchObject({
      imageUrl: "https://img.co/1.png",
      altText: "Alt 1",
    });
  });
});
