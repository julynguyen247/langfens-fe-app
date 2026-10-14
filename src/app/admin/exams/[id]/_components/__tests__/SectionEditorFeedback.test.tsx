// @vitest-environment happy-dom
import React from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { SectionEditorModal } from "../SectionEditorModal";
import type { InternalDeliverySection } from "@/app/admin/_lib/types";

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

const initialSection: InternalDeliverySection = {
  id: "sec-test-1",
  idx: 1,
  title: "Original Section Title: Planetary Systems",
  instructionsMd: "Read the passage and answer questions 1–13.",
  passageMd: "The solar system consists of the Sun and celestial objects bound by gravity in elliptical orbits.",
  questions: [],
  questionGroups: [],
};

describe("SectionEditorModal Feedback, Diff Preview & Retry State Retention", () => {
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

  it("renders title and passage diffs in confirm modal and allows small-edit save without reasons", async () => {
    const onSave = vi.fn().mockResolvedValue(undefined);
    const onClose = vi.fn();

    await React.act(async () => {
      root.render(
        <SectionEditorModal
          section={initialSection}
          originalSection={initialSection}
          isOpen={true}
          onClose={onClose}
          onSave={onSave}
        />
      );
    });

    // Make minor 1-char edit in passage
    const passageInput = container.querySelector("textarea[aria-label='Passage Markdown']") as HTMLTextAreaElement;
    expect(passageInput).toBeDefined();

    await React.act(async () => {
      const setter = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, "value")?.set;
      setter?.call(passageInput, "The solar system consists of the Sun and celestial objects bound by gravity in elliptical orbits!");
      passageInput.dispatchEvent(new Event("input", { bubbles: true }));
    });

    expect(container.textContent).toContain("Small Edit Policy Met (Reasons Optional)");

    // Click "Review & Save" to open the confirm review modal
    const reviewBtn = Array.from(container.querySelectorAll("button")).find((btn) =>
      btn.textContent?.includes("Review & Save")
    );
    await React.act(async () => reviewBtn?.click());

    expect(container.textContent).toContain("Review Section Edit Confirmation");
    expect(container.textContent).toContain("Passage Text Diff");

    // Click "Confirm & Save Section" in modal without selecting reasons (optional for small edit)
    const confirmBtn = Array.from(container.querySelectorAll("button")).find((btn) =>
      btn.textContent?.includes("Confirm & Save Section")
    );
    await React.act(async () => confirmBtn?.click());

    expect(onSave).toHaveBeenCalledTimes(1);
    expect(onSave).toHaveBeenCalledWith(
      expect.objectContaining({
        title: "Original Section Title: Planetary Systems",
        passageMd: "The solar system consists of the Sun and celestial objects bound by gravity in elliptical orbits!",
      }),
      expect.objectContaining({
        reasons: [],
        idempotencyKey: expect.any(String),
      })
    );
  });

  it("shows both title and passage diffs on substantive edit and preserves state on failed submit retry", async () => {
    let callCount = 0;
    const onSave = vi.fn().mockImplementation(async () => {
      callCount++;
      if (callCount === 1) {
        throw new Error("Simulated network failure on section update");
      }
    });
    const onClose = vi.fn();

    await React.act(async () => {
      root.render(
        <SectionEditorModal
          section={initialSection}
          originalSection={initialSection}
          isOpen={true}
          onClose={onClose}
          onSave={onSave}
        />
      );
    });

    // Change title and passage significantly
    const titleInput = container.querySelector("input[aria-label='Section Title']") as HTMLInputElement;
    const passageInput = container.querySelector("textarea[aria-label='Passage Markdown']") as HTMLTextAreaElement;

    await React.act(async () => {
      const titleSetter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")?.set;
      titleSetter?.call(titleInput, "Revised Title: Deep Space Exploration");
      titleInput.dispatchEvent(new Event("input", { bubbles: true }));

      const passageSetter = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, "value")?.set;
      passageSetter?.call(passageInput, "Deep space exploration probes investigate interstellar matter and outer solar boundaries.");
      passageInput.dispatchEvent(new Event("input", { bubbles: true }));
    });

    // Open review modal
    const reviewBtn = Array.from(container.querySelectorAll("button")).find((btn) =>
      btn.textContent?.includes("Review & Save")
    );
    await React.act(async () => reviewBtn?.click());

    expect(container.textContent).toContain("Review Section Edit Confirmation");
    expect(container.textContent).toContain("Section Title Diff:");
    expect(container.textContent).toContain("Original Title");
    expect(container.textContent).toContain("Edited Title");
    expect(container.textContent).toContain("Passage Text Diff");

    // Select a taxonomy reason
    const reasonCheckbox = Array.from(container.querySelectorAll("input[type='checkbox']"))[0] as HTMLInputElement;
    await React.act(async () => reasonCheckbox.click());

    // Enter comment
    const commentInput = container.querySelector("textarea[placeholder*='Describe reason']") as HTMLTextAreaElement;
    await React.act(async () => {
      const cSetter = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, "value")?.set;
      cSetter?.call(commentInput, "Rewrote section to cover interstellar boundaries.");
      commentInput.dispatchEvent(new Event("input", { bubbles: true }));
    });

    // Attempt 1 -> fails
    const confirmBtn = Array.from(container.querySelectorAll("button")).find((btn) =>
      btn.textContent?.includes("Confirm & Save Section")
    );
    await React.act(async () => confirmBtn?.click());

    expect(onSave).toHaveBeenCalledTimes(1);
    expect(container.textContent).toContain("Simulated network failure on section update");

    const firstKey = onSave.mock.calls[0][1].idempotencyKey;
    expect(firstKey).toBeDefined();

    // User retries without closing modal -> clicks confirm again
    await React.act(async () => confirmBtn?.click());

    expect(onSave).toHaveBeenCalledTimes(2);
    const secondKey = onSave.mock.calls[1][1].idempotencyKey;
    expect(secondKey).toBe(firstKey); // Exact same idempotency key retained
    expect(onSave.mock.calls[1][1].reasons.length).toBeGreaterThan(0);
    expect(onSave.mock.calls[1][1].comment).toBe("Rewrote section to cover interstellar boundaries.");
  });
});
