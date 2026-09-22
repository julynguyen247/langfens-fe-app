// @vitest-environment happy-dom
import React from "react";
import { describe, it, expect, afterEach, vi } from "vitest";
import { createRoot, Root } from "react-dom/client";
import { MatchingCard } from "../MatchingCard";

declare global {
  // eslint-disable-next-line no-var
  var IS_REACT_ACT_ENVIRONMENT: boolean | undefined;
}

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

describe("MatchingCard", () => {
  let container: HTMLDivElement | null = null;
  let root: Root | null = null;

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

  it("renders 5 paragraph dropdowns for MATCHING_HEADING (Q6) when matchPairs is empty", async () => {
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);

    const promptMd = `The reading passage has five paragraphs, 1–5.
Choose the correct heading for each paragraph from the list of headings below.

List of Headings:
i. How museum purposes have changed over time
ii. The economic model of major international exhibitions`;

    const options = [
      { id: "opt1", idx: 1, contentMd: "i. How museum purposes have changed over time" },
      { id: "opt2", idx: 2, contentMd: "ii. The economic model of major international exhibitions" },
    ];

    const onChange = vi.fn();

    await React.act(async () => {
      root?.render(
        <MatchingCard
          matchPairs={[]}
          options={options}
          promptMd={promptMd}
          onChange={onChange}
        />
      );
    });

    // Should render 5 paragraph targets, not a single Target [0]
    expect(container.textContent).toContain("Paragraph 1");
    expect(container.textContent).toContain("Paragraph 2");
    expect(container.textContent).toContain("Paragraph 3");
    expect(container.textContent).toContain("Paragraph 4");
    expect(container.textContent).toContain("Paragraph 5");
    expect(container.textContent).not.toContain("Target [0]");

    const selects = container.querySelectorAll("select");
    expect(selects.length).toBe(5);
  });

  it("renders numbered statements with dropdowns for MATCHING_INFORMATION (Q7)", async () => {
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);

    const promptMd = `The reading passage has five paragraphs, A–E.
Which paragraph contains the following information?

Questions 1–4:
1. Commercial pressures and blockbuster exhibitions
2. Technology reshaping the museum experience
3. Ethical complexities of colonial-era collections
4. Community outreach and social programmes`;

    const options = [
      { id: "optA", idx: 1, contentMd: "A. Paragraph A" },
      { id: "optB", idx: 2, contentMd: "B. Paragraph B" },
      { id: "optC", idx: 3, contentMd: "C. Paragraph C" },
      { id: "optD", idx: 4, contentMd: "D. Paragraph D" },
      { id: "optE", idx: 5, contentMd: "E. Paragraph E" },
    ];

    const onChange = vi.fn();

    await React.act(async () => {
      root?.render(
        <MatchingCard
          matchPairs={[]}
          options={options}
          promptMd={promptMd}
          onChange={onChange}
        />
      );
    });

    expect(container.textContent).toContain("Commercial pressures and blockbuster exhibitions");
    expect(container.textContent).toContain("Technology reshaping the museum experience");
    expect(container.textContent).toContain("Ethical complexities of colonial-era collections");
    expect(container.textContent).toContain("Community outreach and social programmes");

    const selects = container.querySelectorAll("select");
    expect(selects.length).toBe(4);

    // Select option B for statement 1
    await React.act(async () => {
      if (selects[0]) {
        selects[0].value = "A";
        selects[0].dispatchEvent(new Event("change", { bubbles: true }));
      }
    });

    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ "1": "A" }));
  });

  it("normalizes protobuf matchPairs array and displays human labels", async () => {
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);

    const matchPairs = [
      { promptKey: "1", acceptedValues: ["A", "Blockbuster exhibitions"] },
      { promptKey: "2", acceptedValues: ["E", "Digital technology"] },
    ];

    const options = [
      { id: "optA", idx: 1, contentMd: "A. Generates significant income" },
      { id: "optE", idx: 2, contentMd: "E. Makes use of digital devices" },
    ];

    const onChange = vi.fn();

    await React.act(async () => {
      root?.render(
        <MatchingCard
          matchPairs={matchPairs}
          options={options}
          promptMd="Some prompt"
          onChange={onChange}
        />
      );
    });

    expect(container.textContent).toContain("Blockbuster exhibitions");
    expect(container.textContent).toContain("Digital technology");
  });
});
