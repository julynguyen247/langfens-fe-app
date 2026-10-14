// @vitest-environment happy-dom
import React from "react";
import { afterEach, describe, expect, it } from "vitest";
import { createRoot, Root } from "react-dom/client";
import SummaryCompletionCard from "./SummaryCompletionCard";

declare global {
  // eslint-disable-next-line no-var
  var IS_REACT_ACT_ENVIRONMENT: boolean | undefined;
}

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

describe("SummaryCompletionCard", () => {
  let container: HTMLDivElement | null = null;
  let root: Root | null = null;

  afterEach(async () => {
    if (root) {
      await React.act(async () => root?.unmount());
      root = null;
    }
    container?.remove();
    container = null;
  });

  it("renders a numbered [N] marker as an inline answer input", async () => {
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);

    await React.act(async () => {
      root?.render(
        <SummaryCompletionCard
          id="question-8"
          stem="The team recorded [8] during the study."
          values={[]}
          onChange={() => undefined}
        />
      );
    });

    expect(container.querySelectorAll("input")).toHaveLength(1);
    expect(container.textContent).not.toContain("[8]");
    expect(container.textContent).toContain("The team recorded");
    expect(container.textContent).toContain("during the study.");
  });
});
