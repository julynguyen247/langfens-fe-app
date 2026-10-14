// @vitest-environment happy-dom
import React from "react";
import { afterEach, describe, expect, it } from "vitest";
import { createRoot, Root } from "react-dom/client";
import { MatchingCardV3 } from "../MatchingCardV3";

declare global {
  // eslint-disable-next-line no-var
  var IS_REACT_ACT_ENVIRONMENT: boolean | undefined;
}

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

describe("MatchingCardV3 review mode", () => {
  let container: HTMLDivElement | null = null;
  let root: Root | null = null;

  afterEach(async () => {
    if (root) {
      await React.act(async () => {
        root?.unmount();
      });
      root = null;
    }
    if (container?.parentNode) {
      container.parentNode.removeChild(container);
      container = null;
    }
  });

  it.each([
    {
      optionLabel: "i. The invention and early uses of paper",
      expectedAnswer: "i. The invention and early uses of paper",
    },
    {
      optionLabel: "[i] The invention and early uses of paper",
      expectedAnswer: "[i] The invention and early uses of paper",
    },
  ])(
    "shows the full selected heading in the Your Answer cell for $optionLabel",
    async ({ optionLabel, expectedAnswer }) => {
      container = document.createElement("div");
      document.body.appendChild(container);
      root = createRoot(container);

      await React.act(async () => {
        root?.render(
          <MatchingCardV3
            matchPairs={{ "1": ["i", "The invention and early uses of paper"] }}
            options={[
              {
                id: "option-i",
                idx: 1,
                contentMd: optionLabel,
              },
              {
                id: "option-ii",
                idx: 2,
                contentMd: "ii. Cai Lun and the Chinese origin of papermaking",
              },
            ]}
            promptMd="1. The invention and early uses of paper"
            mode="review"
            value={{ "1": "i" }}
          />
        );
      });

      const yourAnswerLabel = Array.from(
        container.querySelectorAll("span")
      ).find((span) => span.textContent?.trim() === "Your Answer:");
      const yourAnswerCell = yourAnswerLabel?.parentElement;

      expect(yourAnswerCell).not.toBeNull();
      expect(yourAnswerCell?.textContent).toContain(expectedAnswer);
    }
  );
});
