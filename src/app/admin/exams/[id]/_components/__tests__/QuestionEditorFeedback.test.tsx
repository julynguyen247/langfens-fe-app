// @vitest-environment happy-dom
import React from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { QuestionEditor } from "../QuestionEditor";
import { InternalDeliveryQuestion } from "@/app/admin/_lib/types";

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

const initialQuestion: InternalDeliveryQuestion = {
  id: "q-test-1",
  sectionId: "sec-1",
  idx: 1,
  type: "MULTIPLE_CHOICE_SINGLE",
  skill: "READING",
  difficulty: 2,
  promptMd: "Original prompt statement regarding ocean ecosystems.",
  explanationMd: "Evidence found in paragraph 1.",
  options: [
    { id: "opt-1", idx: 1, contentMd: "Option A", isCorrect: true },
    { id: "opt-2", idx: 2, contentMd: "Option B", isCorrect: false },
    { id: "opt-3", idx: 3, contentMd: "Option C", isCorrect: false },
    { id: "opt-4", idx: 4, contentMd: "Option D", isCorrect: false },
  ],
};

describe("QuestionEditor Feedback & Small-Edit Integration", () => {
  let root: Root;
  let container: HTMLDivElement;

  beforeEach(() => {
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(async () => {
    await React.act(async () => root.unmount());
    container.remove();
    vi.resetAllMocks();
  });

  it("renders small-edit indicator as optional when minor typo is made", async () => {
    const onSave = vi.fn().mockResolvedValue(undefined);
    const onDelete = vi.fn();

    await React.act(async () => {
      root.render(
        <QuestionEditor
          question={initialQuestion}
          sectionId="sec-1"
          onSave={onSave}
          onDelete={onDelete}
        />
      );
    });

    // Make a minor 1-character edit in prompt
    const promptInput = container.querySelector(
      "textarea[placeholder*='Question prompt']"
    ) as HTMLTextAreaElement;
    expect(promptInput).toBeDefined();
    await React.act(async () => {
      const setter = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, "value")?.set;
      setter?.call(promptInput, "Original prompt statement regarding ocean ecosystems!");
      promptInput.dispatchEvent(new Event("input", { bubbles: true }));
    });
    expect(container.textContent).toContain("Small Edit Policy Met (Reasons Optional)");
    expect(container.textContent).toContain("Original Version");
    expect(container.textContent).toContain("Edited Version");

    // Clicking Save Question opens the confirm-before-save review modal
    const saveBtn = Array.from(container.querySelectorAll("button")).find((btn) =>
      btn.textContent?.includes("Save Question")
    );
    await React.act(async () => saveBtn?.click());

    expect(container.textContent).toContain("Review Substantive Question Edit");
    expect(container.textContent).toContain("Small edit detected — taxonomy reasons are optional.");

    // Confirm save in modal without selecting any reasons (reasons are optional for small edit)
    const confirmSaveBtn = Array.from(container.querySelectorAll("button")).find((btn) =>
      btn.textContent?.includes("Confirm & Save Edit")
    );
    expect(confirmSaveBtn).toBeDefined();
    await React.act(async () => confirmSaveBtn?.click());

    expect(onSave).toHaveBeenCalledWith(
      expect.objectContaining({
        promptMd: "Original prompt statement regarding ocean ecosystems!",
      }),
      expect.objectContaining({
        reasons: [],
        comment: "",
        idempotencyKey: expect.any(String),
      })
    );
  });

  it("allows selecting reason taxonomy chips and curator comment on substantive edit", async () => {
    const onSave = vi.fn().mockResolvedValue(undefined);
    const onDelete = vi.fn();

    await React.act(async () => {
      root.render(
        <QuestionEditor
          question={initialQuestion}
          sectionId="sec-1"
          onSave={onSave}
          onDelete={onDelete}
        />
      );
    });

    // Substantive prompt rewrite
    const promptInput = container.querySelector(
      "textarea[placeholder*='Question prompt']"
    ) as HTMLTextAreaElement;
    expect(promptInput).toBeDefined();
    await React.act(async () => {
      const setter = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, "value")?.set;
      setter?.call(promptInput, "Completely new prompt regarding renewable energy grid stability.");
      promptInput.dispatchEvent(new Event("input", { bubbles: true }));
    });
    expect(container.textContent).toContain("Substantive Edit (Reason Taxonomy Recommended)");

    // Select reason taxonomy chips: "Unsupported Claim" and "Weak Distractor"
    const unsupportedBtn = Array.from(container.querySelectorAll("button")).find((btn) =>
      btn.textContent?.trim() === "Unsupported Claim"
    );
    const weakDistractorBtn = Array.from(container.querySelectorAll("button")).find((btn) =>
      btn.textContent?.trim() === "Weak Distractor"
    );
    await React.act(async () => unsupportedBtn?.click());
    await React.act(async () => weakDistractorBtn?.click());

    // Enter curator comment
    const commentInput = container.querySelector(
      "input[aria-label='Edit rationale / comments']"
    ) as HTMLInputElement;
    await React.act(async () => {
      const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")?.set;
      setter?.call(commentInput, "Rewrote item to test grid balancing factors.");
      commentInput.dispatchEvent(new Event("input", { bubbles: true }));
    });

    // Clicking Save Question opens the confirm-before-save review modal
    const saveBtn = Array.from(container.querySelectorAll("button")).find((btn) =>
      btn.textContent?.includes("Save Question")
    );
    await React.act(async () => saveBtn?.click());

    expect(container.textContent).toContain("Review Substantive Question Edit");
    expect(container.textContent).toContain("Original Question");
    expect(container.textContent).toContain("Edited Question");

    // Confirm save in modal
    const confirmSaveBtn = Array.from(container.querySelectorAll("button")).find((btn) =>
      btn.textContent?.includes("Confirm & Save Edit")
    );
    expect(confirmSaveBtn).toBeDefined();
    await React.act(async () => confirmSaveBtn?.click());

    expect(onSave).toHaveBeenCalledWith(
      expect.objectContaining({
        promptMd: "Completely new prompt regarding renewable energy grid stability.",
      }),
      expect.objectContaining({
        reasons: ["unsupported_claim", "weak_distractor"],
        comment: "Rewrote item to test grid balancing factors.",
        idempotencyKey: expect.any(String),
      })
    );
  });

  it("retains the exact same idempotency key across retries when onSave fails", async () => {
    let callCount = 0;
    const capturedKeys: string[] = [];
    const onSave = vi.fn().mockImplementation((draft, feedbackMeta) => {
      callCount++;
      capturedKeys.push(feedbackMeta.idempotencyKey);
      if (callCount === 1) {
        return Promise.reject(new Error("504 Gateway Timeout"));
      }
      return Promise.resolve();
    });
    const onDelete = vi.fn();

    await React.act(async () => {
      root.render(
        <QuestionEditor
          question={initialQuestion}
          sectionId="sec-1"
          onSave={onSave}
          onDelete={onDelete}
        />
      );
    });

    const promptInput = container.querySelector(
      "textarea[placeholder*='Question prompt']"
    ) as HTMLTextAreaElement;
    expect(promptInput).toBeDefined();
    await React.act(async () => {
      const setter = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, "value")?.set;
      setter?.call(promptInput, "Prompt modified for retry test.");
      promptInput.dispatchEvent(new Event("input", { bubbles: true }));
    });
    const saveBtn = Array.from(container.querySelectorAll("button")).find((btn) =>
      btn.textContent?.includes("Save Question")
    );
    await React.act(async () => saveBtn?.click());

    // Modal is open
    expect(container.textContent).toContain("Review Substantive Question Edit");

    const confirmSaveBtn = Array.from(container.querySelectorAll("button")).find((btn) =>
      btn.textContent?.includes("Confirm & Save Edit")
    );
    expect(confirmSaveBtn).toBeDefined();

    // Attempt 1: fails
    await React.act(async () => confirmSaveBtn?.click());
    expect(container.textContent).toContain("504 Gateway Timeout");

    // Attempt 2: retry clicked in open modal
    await React.act(async () => confirmSaveBtn?.click());
    expect(onSave).toHaveBeenCalledTimes(2);
    expect(capturedKeys).toHaveLength(2);
    expect(capturedKeys[0]).toBeDefined();
    expect(capturedKeys[0]).toBe(capturedKeys[1]); // Exact same key retained across retries!
    expect(container.textContent).toContain("Saved successfully");
  });
  it("attaches X-Feedback-Reasons, X-Feedback-Comment, and Idempotency-Key headers on updateQuestion", async () => {
    const { updateQuestion } = await import("@/app/admin/_lib/adminApi");
    const { apisExam } = await import("@/utils/api.customize");
    const putSpy = vi.spyOn(apisExam, "put").mockResolvedValue({ data: { success: true } });

    await updateQuestion("q-123", {
      SectionId: "sec-1",
      Type: "MULTIPLE_CHOICE_SINGLE",
      Skill: "READING",
      Difficulty: 2,
      PromptMd: "Updated prompt",
    }, {
      reasons: ["unsupported_claim", "ambiguity"],
      comment: "Curator prompt fix",
      idempotencyKey: "idemp-test-999",
    });

    expect(putSpy).toHaveBeenCalledWith(
      "/admin/question/update/q-123",
      expect.objectContaining({ PromptMd: "Updated prompt" }),
      {
        headers: {
          "Idempotency-Key": "idemp-test-999",
          "X-Feedback-Reasons": "unsupported_claim,ambiguity",
          "X-Feedback-Comment": "Curator prompt fix",
        },
      }
    );
  });

  it("attaches X-Feedback-Reasons, X-Feedback-Comment, and Idempotency-Key headers on updateSection", async () => {
    const { updateSection } = await import("@/app/admin/_lib/adminApi");
    const { apisExam } = await import("@/utils/api.customize");
    const putSpy = vi.spyOn(apisExam, "put").mockResolvedValue({ data: { success: true } });

    await updateSection("sec-456", {
      ExamId: "exam-789",
      Idx: 1,
      Title: "Updated Section Title",
    }, {
      reasons: ["style_or_grammar", "source_license_issue"],
      comment: "Updated passage license attribution",
      idempotencyKey: "sec-key-111",
    });

    expect(putSpy).toHaveBeenCalledWith(
      "/admin/section/update/sec-456",
      expect.objectContaining({ Title: "Updated Section Title" }),
      {
        headers: {
          "Idempotency-Key": "sec-key-111",
          "X-Feedback-Reasons": "style_or_grammar,source_license_issue",
          "X-Feedback-Comment": "Updated passage license attribution",
        },
      }
    );
  });
});
