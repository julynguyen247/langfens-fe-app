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
import autogenContract from "../autogenContract.json";

function getContractQuestion(type: string): Record<string, unknown> {
  const ex = (autogenContract.examples as Array<{ question?: { type?: string } }> | undefined)?.find(
    (e) => e?.question?.type === type
  );
  if (!ex?.question) throw new Error(`Missing contract example for ${type}`);
  return JSON.parse(JSON.stringify(ex.question));
}

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
        transcriptMd: "Audio transcript text",
      })
    ).toBe("Audio transcript text");
  });

  it("handles null or undefined section gracefully", () => {
    expect(resolveSectionPassage(null)).toBe("");
    expect(resolveSectionPassage(undefined)).toBe("");
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
  });

  it("throws error if prompt template is missing for question type", async () => {
    await expect(
      generateQuestionsFromPassage({
        type: "UNKNOWN_TYPE_THAT_DOES_NOT_EXIST",
        passage: "Valid passage",
      })
    ).rejects.toThrow("No LLM prompt template for type UNKNOWN_TYPE_THAT_DOES_NOT_EXIST");
  });

  it("correctly extracts options and builds AdminQuestionUpsert", async () => {
    const fakeLlmJson = JSON.stringify([
      {
        type: "MULTIPLE_CHOICE_SINGLE",
        skill: "READING",
        difficulty: 3,
        promptMd: "What was invented in China?",
        explanationMd: "Paper was invented by Cai Lun.",
        options: [
          { idx: 1, contentMd: "Paper", isCorrect: true },
          { idx: 2, contentMd: "Steam engine", isCorrect: false },
          { idx: 3, contentMd: "Telescope", isCorrect: false },
        ],
      },
    ]);

    vi.spyOn(aiConfigModule, "callAi").mockResolvedValue(fakeLlmJson);
    vi.spyOn(aiConfigModule, "isAiConfigured").mockReturnValue(true);

    const result = await generateQuestionsFromPassage({
      type: "MULTIPLE_CHOICE_SINGLE",
      passage: "Paper papermaking Cai Lun history...",
      sectionId: "sec-uuid-1",
      count: 1,
    });

    expect(result.rawText).toBe(fakeLlmJson);
    expect(result.questions.length).toBe(1);
    expect(result.validationErrors.length).toBe(0);

    const q = result.questions[0];
    expect(q.upsert.SectionId).toBe("sec-uuid-1");
    expect(q.upsert.Type).toBe("MULTIPLE_CHOICE_SINGLE");
    expect(q.upsert.Difficulty).toBe(3);
    expect(q.upsert.PromptMd).toBe("What was invented in China?");
    expect(q.upsert.ExplanationMd).toBe("Paper was invented by Cai Lun.");

    expect(q.options?.length).toBe(3);
    expect(q.options?.[0]).toEqual({
      idx: 1,
      contentMd: "Paper",
      isCorrect: true,
    });
  });

  it("flags validation errors from validateQuestionPayload", async () => {
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

  const matchingTypes = [
    "MATCHING_HEADING",
    "MATCHING_INFORMATION",
    "MATCHING_FEATURES",
    "MATCHING_ENDINGS",
  ] as const;

  for (const qtype of matchingTypes) {
    it(`generates valid matching question for ${qtype} from contract with 0 validation errors`, async () => {
      const q = getContractQuestion(qtype);
      vi.spyOn(aiConfigModule, "callAi").mockResolvedValue(JSON.stringify([q]));
      vi.spyOn(aiConfigModule, "isAiConfigured").mockReturnValue(true);

      const result = await generateQuestionsFromPassage({
        type: qtype,
        passage: "Some valid museum passage...",
        sectionId: "sec-match",
        count: 1,
        difficulty: Number(q.difficulty || 3),
        skill: String(q.skill || "READING"),
      });

      expect(result.questions.length).toBe(1);
      expect(result.validationErrors).toEqual([]);
      expect(result.questions[0].options?.length).toBeGreaterThanOrEqual(2);
      expect(result.questions[0].upsert.MatchPairs).toBeTruthy();
    });

    it(`flags raw validation error when matching output has invalid gradingKey for ${qtype}`, async () => {
      const q = getContractQuestion(qtype);
      const mp = q.matchPairs as Record<string, string[]>;
      const firstKey = Object.keys(mp)[0];
      mp[firstKey] = ["Z", mp[firstKey][1]];

      vi.spyOn(aiConfigModule, "callAi").mockResolvedValue(JSON.stringify([q]));
      vi.spyOn(aiConfigModule, "isAiConfigured").mockReturnValue(true);

      const result = await generateQuestionsFromPassage({
        type: qtype,
        passage: "Some valid museum passage...",
        count: 1,
        difficulty: Number(q.difficulty || 3),
        skill: String(q.skill || "READING"),
      });

      expect(result.validationErrors.length).toBeGreaterThan(0);
      expect(result.validationErrors.some((e) => e.startsWith("Q#1") && e.includes("options choice pool"))).toBe(true);
    });
  }

  it("flags error when matching question count does not match requested count", async () => {
    const q = getContractQuestion("MATCHING_FEATURES");
    vi.spyOn(aiConfigModule, "callAi").mockResolvedValue(JSON.stringify([q]));
    vi.spyOn(aiConfigModule, "isAiConfigured").mockReturnValue(true);

    const result = await generateQuestionsFromPassage({
      type: "MATCHING_FEATURES",
      passage: "Valid passage",
      count: 2,
    });

    expect(
      result.validationErrors.some((e) =>
        e.includes("Invalid MATCHING_FEATURES question count: expected 2, got 1")
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

  it("persists valid matching question and all options preserving idx and content", async () => {
    const q = getContractQuestion("MATCHING_FEATURES");
    const mockCreateQuestion = vi
      .spyOn(adminApiModule, "createQuestion")
      .mockResolvedValue({
        id: "created-feat-q-id",
        sectionId: "sec-features",
        idx: 1,
        type: "MATCHING_FEATURES",
        skill: "READING",
        difficulty: 3,
      } as AdminQuestionItem);

    const mockCreateOption = vi
      .spyOn(adminApiModule, "createOption")
      .mockResolvedValue({
        id: "created-opt-id",
        questionId: "created-feat-q-id",
        idx: 1,
        contentMd: "opt",
        isCorrect: false,
      } as AdminOptionItem);

    const optionsRaw = q.options as Array<{ idx: number; contentMd: string; isCorrect: boolean }>;
    const questionToPersist: ParsedAuthorQuestion = {
      upsert: {
        SectionId: "sec-features",
        Type: "MATCHING_FEATURES",
        Skill: "READING",
        Difficulty: 3,
        PromptMd: String(q.promptMd),
        MatchPairs: q.matchPairs as AdminQuestionItem["matchPairs"],
      },
      options: optionsRaw.map((o) => ({
        idx: o.idx,
        contentMd: o.contentMd,
        isCorrect: false,
      })),
    };

    const savedCount = await persistGeneratedQuestions("sec-features", [questionToPersist]);
    expect(savedCount).toBe(1);
    expect(mockCreateQuestion).toHaveBeenCalledTimes(1);
    expect(mockCreateOption).toHaveBeenCalledTimes(optionsRaw.length);
    expect(mockCreateOption).toHaveBeenNthCalledWith(1, {
      QuestionId: "created-feat-q-id",
      Idx: optionsRaw[0].idx,
      ContentMd: optionsRaw[0].contentMd,
      IsCorrect: false,
    });
  });

  it("refuses to persist invalid matching question and does not call createQuestion", async () => {
    const q = getContractQuestion("MATCHING_FEATURES");
    const mockCreateQuestion = vi.spyOn(adminApiModule, "createQuestion");

    const badQuestionToPersist: ParsedAuthorQuestion = {
      upsert: {
        SectionId: "sec-features",
        Type: "MATCHING_FEATURES",
        Skill: "READING",
        Difficulty: 3,
        PromptMd: String(q.promptMd),
        MatchPairs: { "1": ["Z", "Non existent grading key"] },
      },
      options: (q.options as Array<{ idx: number; contentMd: string }>).map((o) => ({
        idx: o.idx,
        contentMd: o.contentMd,
        isCorrect: false,
      })),
    };

    await expect(
      persistGeneratedQuestions("sec-features", [badQuestionToPersist])
    ).rejects.toThrow(/Cannot persist invalid matching Q#1/);
    expect(mockCreateQuestion).not.toHaveBeenCalled();
  });

  it("throws error when createQuestion does not return an id", async () => {
    vi.spyOn(adminApiModule, "createQuestion").mockResolvedValue(null as unknown as AdminQuestionItem);
    const mockCreateOption = vi.spyOn(adminApiModule, "createOption");

    const validQ: ParsedAuthorQuestion = {
      upsert: {
        SectionId: "sec-id",
        Type: "MULTIPLE_CHOICE_SINGLE",
        Skill: "READING",
        Difficulty: 3,
        PromptMd: "Prompt",
      },
      options: [
        { idx: 1, contentMd: "A", isCorrect: true },
        { idx: 2, contentMd: "B", isCorrect: false },
      ],
    };

    await expect(persistGeneratedQuestions("sec-id", [validQ])).rejects.toThrow(
      "Failed to create question: server did not return a valid question ID."
    );
    expect(mockCreateOption).not.toHaveBeenCalled();
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
