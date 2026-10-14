import { describe, it, expect } from "vitest";
import { buildQuestion } from "../buildQuestion";

describe("buildQuestion", () => {
  it("maps MULTIPLE_CHOICE_SINGLE to forice_single and strips 'A. ' prefix in options", () => {
    const raw = {
      id: "q-1",
      idx: 1,
      type: "MULTIPLE_CHOICE_SINGLE",
      promptMd: "Choose the correct letter.",
      explanationMd: "Detailed explanation here",
      options: [
        { id: "opt-1", contentMd: "A. First option" },
        { id: "opt-2", contentMd: "B.  Second option" },
        { id: "opt-3", contentMd: "Third option without prefix" },
      ],
    };

    const q = buildQuestion(raw);

    expect(q.id).toBe("q-1");
    expect(q.idx).toBe(1);
    expect(q.backendType).toBe("MULTIPLE_CHOICE_SINGLE");
    expect(q.uiKind).toBe("forice_single");
    expect(q.stem).toBe("Choose the correct letter.");
    expect(q.explanationMd).toBe("Detailed explanation here");
    expect(q.forices).toEqual([
      { value: "opt-1", label: "First option" },
      { value: "opt-2", label: "Second option" },
      { value: "opt-3", label: "Third option without prefix" },
    ]);
  });

  it("distinguishes matching_information vs matching_paragraph via promptMd", () => {
    // When isWordListBlank returns true: includes "**Word List:**" and "___" -> matching_information
    const qInfoWithWordList = buildQuestion({
      id: "q-info-wordlist",
      idx: 2,
      type: "MATCHING_INFORMATION",
      promptMd: "Complete the summary.\n\n**Word List:**\nA. dog\nB. cat\n\nThe pet is a ___.",
    });
    expect(qInfoWithWordList.uiKind).toBe("matching_information");

    // When isWordListBlank returns false (standard matching information paragraph task) -> matching_paragraph
    const qParagraph = buildQuestion({
      id: "q-para",
      idx: 3,
      type: "MATCHING_INFORMATION",
      promptMd: "Which paragraph contains information about renewable energy?",
    });
    expect(qParagraph.uiKind).toBe("matching_paragraph");

    const qParagraphEmptyPrompt = buildQuestion({
      id: "q-para-empty",
      idx: 4,
      type: "MATCHING_INFORMATION",
      promptMd: "",
    });
    expect(qParagraphEmptyPrompt.uiKind).toBe("matching_paragraph");
  });

  it("preserves flowChartNodes for FLOW_CHART question type", () => {
    const nodes = [
      { id: "n1", text: "Step 1", position: { x: 0, y: 0 } },
      { id: "n2", text: "Step 2", position: { x: 100, y: 0 } },
    ];
    const raw = {
      id: "q-flow",
      idx: 5,
      type: "FLOW_CHART",
      promptMd: "Complete the flowchart below.",
      flowChartNodes: nodes,
    };

    const q = buildQuestion(raw);

    expect(q.uiKind).toBe("flow_chart");
    expect(q.flowChartNodes).toEqual(nodes);
  });

  it("splits MATCHING_HEADING options by '.' into value and label", () => {
    const raw = {
      id: "q-heading",
      idx: 6,
      type: "MATCHING_HEADING",
      promptMd: "Choose the correct heading for each section.",
      options: [
        { id: "opt-i", contentMd: "i. The beginning of agriculture" },
        { id: "opt-ii", contentMd: "ii. Modern farming practices" },
      ],
    };

    const q = buildQuestion(raw);

    expect(q.uiKind).toBe("matching_heading");
    expect(q.forices).toEqual([
      { value: "i", label: "i. The beginning of agriculture" },
      { value: "ii", label: "ii. Modern farming practices" },
    ]);
  });

  it("populates default and base question properties correctly", () => {
    const raw = {
      id: "q-base",
      idx: 7,
      type: "SHORT_ANSWER",
      promptMd: "Answer in no more than three words.",
      explanationMd: "Look at paragraph 3",
      imageUrl: "https://example.com/diagram.png",
      modelAnswers: ["photosynthesis"],
      wordList: ["leaf", "chlorophyll"],
      groupId: "grp-42",
    };

    const q = buildQuestion(raw);

    expect(q.id).toBe("q-base");
    expect(q.idx).toBe(7);
    expect(q.stem).toBe("Answer in no more than three words.");
    expect(q.backendType).toBe("SHORT_ANSWER");
    expect(q.uiKind).toBe("completion");
    expect(q.explanationMd).toBe("Look at paragraph 3");
    expect(q.imageUrl).toBe("https://example.com/diagram.png");
    expect(q.modelAnswers).toEqual(["photosynthesis"]);
    expect(q.wordList).toEqual(["leaf", "chlorophyll"]);
    expect(q.groupId).toBe("grp-42");
  });

  it("falls back to null for omitted nullable fields", () => {
    const raw = {
      id: "q-nulls",
      idx: 8,
      type: "TRUE_FALSE_NOT_GIVEN",
      promptMd: "The experiment succeeded.",
    };

    const q = buildQuestion(raw);

    expect(q.imageUrl).toBeNull();
    expect(q.modelAnswers).toBeNull();
    expect(q.wordList).toBeNull();
    expect(q.groupId).toBeNull();
  });
});
