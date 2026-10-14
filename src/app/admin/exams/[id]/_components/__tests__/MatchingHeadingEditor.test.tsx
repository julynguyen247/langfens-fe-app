// @vitest-environment happy-dom
import React from "react";
import { describe, it, expect, afterEach, beforeEach, vi } from "vitest";
import { createRoot, Root } from "react-dom/client";
import { MatchingHeadingEditor } from "../editors/MatchingHeadingEditor";
import { InternalDeliveryOption } from "@/app/admin/_lib/types";
import {
  validateGeneratedMatchingQuestion,
  validateQuestionPayload,
} from "@/app/admin/_lib/validation";

declare global {
  // eslint-disable-next-line no-var
  var IS_REACT_ACT_ENVIRONMENT: boolean | undefined;
}

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

describe("MatchingHeadingEditor", () => {
  let container: HTMLDivElement | null = null;
  let root: Root | null = null;

  beforeEach(() => {
    vi.restoreAllMocks();
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
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

  const promptMd = `The reading passage has five paragraphs, 1–5.
Choose the correct heading for each paragraph from the list of headings below.

List of Headings:
i. The origins of paper
ii. The invention of paper and early materials
iii. Cai Lun and the first Chinese papermaking process
iv. Spread of papermaking to the West
v. Technological advances in European paper production
vi. Modern challenges and materials in paper manufacturing

Paragraphs:
1. The Origins of Paper
2. The invention of paper marked one of the most significant technological advances in human history.
3. The earliest form of paper was developed in China around 105 CE during the Han Dynasty.
4. The secret of papermaking spread slowly westward.
5. Medieval European paper was initially of lower quality than its Chinese counterpart.`;

  const matchPairs = {
    "1": ["i", "The origins of paper"],
    "2": ["ii", "The invention of paper and early materials"],
    "3": ["iii", "Cai Lun and the first Chinese papermaking process"],
    "4": ["iv", "Spread of papermaking to the West"],
    "5": ["v", "Technological advances in European paper production"],
  };

  const options: InternalDeliveryOption[] = [
    { id: "opt-1", idx: 1, contentMd: "i. The origins of paper", isCorrect: false },
    { id: "opt-2", idx: 2, contentMd: "ii. The invention of paper and early materials", isCorrect: false },
    { id: "opt-3", idx: 3, contentMd: "iii. Cai Lun and the first Chinese papermaking process", isCorrect: false },
    { id: "opt-4", idx: 4, contentMd: "iv. Spread of papermaking to the West", isCorrect: false },
    { id: "opt-5", idx: 5, contentMd: "v. Technological advances in European paper production", isCorrect: false },
    { id: "opt-6", idx: 6, contentMd: "vi. Modern challenges and materials in paper manufacturing", isCorrect: false },
  ];

  it("renders numeric paragraphs and roman headings correctly for IELTS Matching Headings", async () => {
    const onChange = vi.fn();

    await React.act(async () => {
      root?.render(
        <MatchingHeadingEditor
          matchPairs={matchPairs}
          options={options}
          promptMd={promptMd}
          onChange={onChange}
        />
      );
    });

    // Check paragraphs count
    expect(container?.textContent).toContain("Paragraphs (5)");
    expect(container?.textContent).toContain("Headings Pool (6)");

    // Check that paragraph keys 1 to 5 are rendered
    const text = container?.textContent || "";
    expect(text).toContain("The Origins of Paper");
    expect(text).toContain("The secret of papermaking spread slowly westward");

    // Check that selects have the correct initial values
    const selects = Array.from(container?.querySelectorAll("select") || []) as HTMLSelectElement[];
    expect(selects.length).toBe(5);
    expect(selects[0].value).toBe("i");
    expect(selects[1].value).toBe("ii");
    expect(selects[2].value).toBe("iii");
    expect(selects[3].value).toBe("iv");
    expect(selects[4].value).toBe("v");
  });

  it("ignores MCQ options like 'C. Fishnets' and 'D. Bamboo' without polluting headings pool", async () => {
    const mcqOptions: InternalDeliveryOption[] = [
      { id: "opt-1", idx: 1, contentMd: "A. Rags", isCorrect: false },
      { id: "opt-2", idx: 2, contentMd: "B. Hemp", isCorrect: false },
      { id: "opt-3", idx: 3, contentMd: "C. Fishnets", isCorrect: false },
      { id: "opt-4", idx: 4, contentMd: "D. Bamboo", isCorrect: false },
    ];
    const onChange = vi.fn();

    await React.act(async () => {
      root?.render(
        <MatchingHeadingEditor
          matchPairs={{}}
          options={mcqOptions}
          promptMd=""
          onChange={onChange}
        />
      );
    });

    // The MCQ options should NOT be treated as Roman numerals
    expect(container?.textContent).not.toContain("C. Fishnets");
    expect(container?.textContent).not.toContain("D. Bamboo");
    // Fallback headings are used
    expect(container?.textContent).toContain("Headings Pool (4)");
  });

  it("calls onChange with correct heading text as displayLabel when assigned in match grid", async () => {
    const onChange = vi.fn();

    await React.act(async () => {
      root?.render(
        <MatchingHeadingEditor
          matchPairs={matchPairs}
          options={options}
          promptMd={promptMd}
          onChange={onChange}
        />
      );
    });

    const selects = Array.from(container?.querySelectorAll("select") || []) as HTMLSelectElement[];
    expect(selects.length).toBe(5);

    // Change paragraph 1's heading to 'vi'
    await React.act(async () => {
      selects[0].value = "vi";
      selects[0].dispatchEvent(new Event("change", { bubbles: true }));
    });

    expect(onChange).toHaveBeenCalledTimes(1);
    const [nextPairs, nextOptions] = onChange.mock.calls[0];

    // Paragraph 1 should now be mapped to ['vi', 'Modern challenges and materials in paper manufacturing']
    expect(nextPairs["1"]).toEqual([
      "vi",
      "Modern challenges and materials in paper manufacturing",
    ]);

    // nextOptions should preserve the 6 headings
    expect(nextOptions.length).toBe(6);
    expect(nextOptions[0].contentMd).toBe("i. The origins of paper");
  });

  it("validates the entire user question payload with 0 validation errors", () => {
    const userQuestion = {
      type: "MATCHING_HEADING",
      skill: "READING",
      difficulty: 2,
      promptMd,
      matchPairs,
      options,
    };
    const issues = validateQuestionPayload(userQuestion);
    expect(issues.filter((i) => i.level === "error")).toEqual([]);

    const matchingIssues = validateGeneratedMatchingQuestion(
      userQuestion,
      "MATCHING_HEADING",
      "READING",
      2
    );
    expect(matchingIssues.filter((i) => i.level === "error")).toEqual([]);
  });
});
