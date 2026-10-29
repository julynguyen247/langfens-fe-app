import { describe, expect, it } from "vitest";
import { QuestionType, type InternalDeliveryQuestion } from "../types";
import {
  COMPLETION_ANSWER_TYPES,
  MATCHING_ANSWER_TYPES,
  OPTION_ANSWER_TYPES,
  decodeAnswer,
  encodeAnswer,
} from "../contract";
import { buildAnswerPayload } from "@/lib/answerPayload";

const CANONICAL_19_TYPES = [
  "MULTIPLE_CHOICE_SINGLE",
  "MULTIPLE_CHOICE_MULTIPLE",
  "TRUE_FALSE_NOT_GIVEN",
  "YES_NO_NOT_GIVEN",
  "MULTIPLE_CHOICE_SINGLE_IMAGE",
  "SUMMARY_COMPLETION",
  "TABLE_COMPLETION",
  "NOTE_COMPLETION",
  "FORM_COMPLETION",
  "SENTENCE_COMPLETION",
  "SHORT_ANSWER",
  "DIAGRAM_LABEL",
  "MAP_LABEL",
  "MATCHING_HEADING",
  "MATCHING_INFORMATION",
  "MATCHING_FEATURES",
  "MATCHING_ENDINGS",
  "CLASSIFICATION",
  "FLOW_CHART",
] as const;

describe("19 canonical question types parity", () => {
  it("covers all 19 types defined in question-types.v1.schema.json", () => {
    const exportedTypes = Object.values(QuestionType);
    expect(exportedTypes.sort()).toEqual([...CANONICAL_19_TYPES].sort());
  });

  it("partitions all 19 types into mutually exclusive answer families", () => {
    const allPartitioned = [
      ...OPTION_ANSWER_TYPES,
      ...COMPLETION_ANSWER_TYPES,
      ...MATCHING_ANSWER_TYPES,
      "SHORT_ANSWER",
      "FLOW_CHART",
    ];

    expect(allPartitioned).toHaveLength(19);
    expect(new Set(allPartitioned).size).toBe(19);
    expect([...allPartitioned].sort()).toEqual([...CANONICAL_19_TYPES].sort());
  });

  it.each(CANONICAL_19_TYPES)(
    "produces valid wire payload adhering to SubmissionBase for %s",
    (type) => {
      const q: InternalDeliveryQuestion = {
        id: "019488a0-1111-7000-8000-000000000001",
        sectionId: "019488a0-2222-7000-8000-000000000002",
        idx: 1,
        type,
        skill: "READING",
        difficulty: 1,
        promptMd: "Sample prompt [1]",
        options: [
          { id: "019488a0-3333-7000-8000-000000000003", idx: 1, contentMd: "A. Opt 1" },
          { id: "019488a0-4444-7000-8000-000000000004", idx: 2, contentMd: "B. Opt 2" },
        ],
        matchPairs: { "1": [] },
      };

      const optId1 = q.options[0].id;
      const optId2 = q.options[1].id;

      let testValue: any;
      if (type === "MULTIPLE_CHOICE_MULTIPLE") {
        testValue = [optId1, optId2];
      } else if (OPTION_ANSWER_TYPES.has(type)) {
        testValue = optId1;
      } else if (COMPLETION_ANSWER_TYPES.has(type)) {
        testValue = { "1": "completed-text" };
      } else if (MATCHING_ANSWER_TYPES.has(type)) {
        testValue = { "1": "A" };
      } else if (type === "SHORT_ANSWER") {
        testValue = "short text answer";
      } else if (type === "FLOW_CHART") {
        testValue = ["step-1", "step-2"];
      }

      const encoded = encodeAnswer(testValue);
      const textResolver = (qid: string, val: string) =>
        OPTION_ANSWER_TYPES.has(type) ? undefined : val;

      const payload = buildAnswerPayload(
        { [q.id!]: encoded },
        () => q.sectionId,
        textResolver
      );

      expect(payload.answers).toHaveLength(1);
      const submitted = payload.answers[0];

      expect(submitted.questionId).toBe(q.id);
      expect(submitted.sectionId).toBe(q.sectionId);

      if (type === "MULTIPLE_CHOICE_MULTIPLE") {
        expect(submitted.selectedOptionIds).toEqual([optId1, optId2]);
        expect(submitted.textAnswer).toBe("");
      } else if (OPTION_ANSWER_TYPES.has(type)) {
        expect(submitted.selectedOptionIds).toEqual([optId1]);
        expect(submitted.textAnswer).toBe("");
      } else {
        expect(submitted.selectedOptionIds).toEqual([]);
        expect(typeof submitted.textAnswer).toBe("string");
        expect(submitted.textAnswer!.length).toBeGreaterThan(0);
      }

      // Verify round-trip decoding matches the original test value
      const decoded = decodeAnswer({ textAnswer: submitted.textAnswer, selectedOptionIds: submitted.selectedOptionIds }, q);
      if (OPTION_ANSWER_TYPES.has(type)) {
        expect(decoded).toEqual(Array.isArray(testValue) ? testValue : [testValue]);
      } else {
        expect(decoded).toEqual(testValue);
      }
    }
  );
});
