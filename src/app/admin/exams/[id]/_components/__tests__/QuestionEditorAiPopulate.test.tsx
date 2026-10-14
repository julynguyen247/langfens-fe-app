// @vitest-environment happy-dom
import React from "react";
import { describe, it, expect, afterEach, beforeEach, vi } from "vitest";
import { createRoot, Root } from "react-dom/client";
import { QuestionEditor } from "../QuestionEditor";
import * as qgen from "@/app/admin/_lib/questionGeneration";
import {
  InternalDeliveryQuestion,
  QuestionSkill,
  QuestionType,
} from "@/app/admin/_lib/types";

declare global {
  // eslint-disable-next-line no-var
  var IS_REACT_ACT_ENVIRONMENT: boolean | undefined;
}

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

describe("QuestionEditor — AI Auto-fill validation error guardrail", () => {
  let container: HTMLDivElement | null = null;
  let root: Root | null = null;

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(async () => {
    if (root) {
      await React.act(async () => {
        root?.unmount();
      });
      root = null;
    }
    if (container && container.parentNode) {
      container.parentNode.removeChild(container);
      container = null;
    }
  });

  it("handles validationErrors from AI generation without updating draft or saving", async () => {
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);

    const initialQuestion: InternalDeliveryQuestion = {
      id: "test-q-1",
      sectionId: "sec-1",
      idx: 1,
      type: QuestionType.MatchingHeading,
      skill: QuestionSkill.Reading,
      difficulty: 3,
      promptMd: "Question 1 prompt",
      explanationMd: null,
      imageUrl: null,
      options: [],
      matchPairs: null,
    };

    const onSave = vi.fn().mockResolvedValue(undefined);
    const onDelete = vi.fn().mockResolvedValue(undefined);

    vi.spyOn(qgen, "generateQuestionsFromPassage").mockResolvedValue({
      rawText: "{}",
      questions: [
        {
          upsert: {
            SectionId: "sec-1",
            Type: QuestionType.MatchingHeading,
            Skill: QuestionSkill.Reading,
            Difficulty: 3,
            PromptMd: "Malformed Prompt",
          },
          options: [],
        },
      ],
      validationErrors: ["Q#1 [options]: options must be a non-empty array"],
    });

    await React.act(async () => {
      root?.render(
        <QuestionEditor
          question={initialQuestion}
          sectionId="sec-1"
          sectionPassageMd="Some authentic section passage text."
          onSave={onSave}
          onDelete={onDelete}
        />
      );
    });

    // Find the AI Auto-fill button
    const buttons = Array.from(container.querySelectorAll("button"));
    const aiButton = buttons.find((b) => b.textContent?.includes("AI Auto-fill"));
    expect(aiButton).toBeDefined();

    // Click AI Auto-fill
    await React.act(async () => {
      aiButton?.click();
    });

    // Assert that the error is displayed to the user
    expect(container.textContent).toContain(
      "AI generation failed: Q#1 [options]: options must be a non-empty array"
    );

    // Assert that the original prompt text is still present in the prompt input/textarea
    const textarea = container.querySelector("textarea") as HTMLTextAreaElement | null;
    if (textarea) {
      expect(textarea.value).toBe("Question 1 prompt");
    }

    // Assert that onSave was never called
    expect(onSave).not.toHaveBeenCalled();
  });
});
