import { describe, expect, it } from "vitest";
import { decodeAnswer, encodeAnswer, getBlankKeys, hasAnswer, normalizeDeliveryQuestion, normalizeExamPaper, sectionQuestions } from "../contract";
import type { InternalDeliveryExam, InternalDeliveryQuestion } from "../types";
import { buildAnswerPayload } from "@/lib/answerPayload";

const question = (extra: Partial<InternalDeliveryQuestion> = {}): InternalDeliveryQuestion => ({ id: "q", idx: 1, type: "SENTENCE_COMPLETION", skill: "READING", difficulty: 1, options: [], promptMd: "[3] and [4] and [5]", ...extra });

describe("canonical attempt contract", () => {
  it("does not rebase blank [5] onto [3], or remove empty legacy positions", () => {
    expect(decodeAnswer({ textAnswer: "alpha\nbeta\ngamma" }, question())).toEqual({ "3": "alpha", "4": "beta", "5": "gamma" });
    expect(decodeAnswer({ textAnswer: "\n\ngamma" }, question())).toEqual({ "3": "", "4": "", "5": "gamma" });
    expect(decodeAnswer({ textAnswer: "alpha\n\ngamma" }, question())).toEqual({ "3": "alpha", "4": "", "5": "gamma" });
    expect(decodeAnswer({ textAnswer: '{"5":"gamma"}' }, question())).toEqual({ "5": "gamma" });
  });
  it("round trips exact non-contiguous keys through autosave and submit payloads", () => {
    const value = { "3": "", "5": "gamma", "10": "ten" };
    const encoded = encodeAnswer(value);
    const autosave = buildAnswerPayload({ q: encoded }, () => "section", (_, text) => text);
    const submit = buildAnswerPayload({ q: encoded }, () => "section", (_, text) => text);
    expect(autosave.answers).toEqual(submit.answers);
    expect(JSON.parse(autosave.answers[0].textAnswer!)).toEqual(value);
  });
  it("normalizes repeated protobuf fields and keeps regex-only slot IDs", () => {
    const q = normalizeDeliveryQuestion({ ...question(), promptMd: "", completionAccepts: [{ blankId: "5", acceptedTexts: [] }, { blankId: "10", acceptedRegex: ["x"] }], matchPairs: [{ promptKey: "7", acceptedValues: [] }] } as unknown as InternalDeliveryQuestion);
    expect(getBlankKeys(q)).toEqual(["5", "10"]);
    expect(q.matchPairs).toEqual({ "7": [] });
    expect(getBlankKeys(question({ blankAcceptRegex: { "10": ["x"] } }))).toEqual(["3", "4", "5", "10"]);
  });
  it("decodes legacy multiline matching using matchPairs keys, not prompt bracket numbers", () => {
    const matchingQ: InternalDeliveryQuestion = {
      id: "m",
      idx: 1,
      type: "MATCHING_HEADING",
      skill: "READING",
      difficulty: 1,
      options: [],
      promptMd: "Read paragraphs [3] to [5] and match headings",
      matchPairs: { "1": [], "2": [] },
    };
    expect(decodeAnswer({ textAnswer: "i\nii" }, matchingQ)).toEqual({ "1": "i", "2": "ii" });
  });
  it("preserves short-answer newlines and structured flowchart labels", () => {
    expect(decodeAnswer({ textAnswer: "one\ntwo" }, question({ type: "SHORT_ANSWER" }))).toBe("one\ntwo");
    const flow = { steps: ["b", "a"], labels: { "5": "gamma" } };
    expect(decodeAnswer({ textAnswer: JSON.stringify(flow) }, question({ type: "FLOW_CHART" }))).toEqual(flow);
  });
  it("treats empty answers consistently", () => {
    for (const textAnswer of ["", " ", "[]", "{}", '{"5":""}', '{"5":"  "}']) expect(hasAnswer({ textAnswer })).toBe(false);
    expect(hasAnswer({ textAnswer: '{"5":"x"}' })).toBe(true);
  });
  it("sorts and deduplicates a snapshot without mutating source or replacing IDs", () => {
    const paper = { id: "paper", sections: [{ id: "s2", idx: 2, questions: [question({ id: "b" })] }, { id: "s1", idx: 1, questions: [question({ id: "a" })], questionGroups: [{ id: "g", idx: 1, questions: [question({ id: "a" })] }] }] } as unknown as InternalDeliveryExam;
    const original = JSON.stringify(paper);
    const normalized = normalizeExamPaper(paper);
    expect(normalized.sections.flatMap(sectionQuestions).map(q => [q.id, q.displayIdx, q.sectionId])).toEqual([["a", 1, "s1"], ["b", 2, "s2"]]);
    expect(JSON.stringify(normalizeExamPaper(normalized))).toBe(JSON.stringify(normalized));
    expect(JSON.stringify(paper)).toBe(original);
  });
});
