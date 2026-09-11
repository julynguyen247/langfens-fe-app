// @vitest-environment happy-dom
import React from "react";
import { describe, it, expect, afterEach } from "vitest";
import { createRoot, Root } from "react-dom/client";
import { UnsupportedQuestionCard } from "../UnsupportedQuestionCard";

declare global {
  // eslint-disable-next-line no-var
  var IS_REACT_ACT_ENVIRONMENT: boolean | undefined;
}

// React 19 expects globalThis.IS_REACT_ACT_ENVIRONMENT before React is loaded or act is run
globalThis.IS_REACT_ACT_ENVIRONMENT = true;

describe("UnsupportedQuestionCard", () => {
  let container: HTMLDivElement | null = null;
  let root: Root | null = null;

  afterEach(async () => {
    if (root) {
      await React.act(async () => {
        root!.unmount();
      });
      root = null;
    }
    if (container && container.parentNode) {
      container.parentNode.removeChild(container);
      container = null;
    }
  });

  it("renders the unsupported backend type and message", async () => {
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);

    await React.act(async () => {
      root!.render(<UnsupportedQuestionCard backendType="HYPOTHETICAL_FUTURE_TYPE" />);
    });

    const card = container.querySelector('[data-testid="unsupported-question-card"]');
    expect(card).toBeDefined();
    expect(card).not.toBeNull();
    expect(container.textContent).toContain("Unsupported question type: HYPOTHETICAL_FUTURE_TYPE");
    expect(container.textContent).toContain(
      "This question format is not supported by the test runner yet."
    );
  });
});
