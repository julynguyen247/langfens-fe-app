/**
 * Sprint 7 Phase 10: prompt-format contract vitest fixture.
 *
 * Locks the [N] canonical format for completion-family PromptMd. Every
 * BlankAcceptTexts key MUST be present as `[N]` in the prompt — no
 * underscores (`___`), no space-padded brackets (`[ N ]`), no legacy
 * prefixes (`blank-qN`).
 */
import { describe, it, expect } from "vitest";
import {
  validatePromptBlankParity,
} from "../validation";

describe("validatePromptBlankParity (Sprint 7 Phase 10)", () => {
  it("accepts canonical [N] placeholders for SENTENCE_COMPLETION", () => {
    const issues = validatePromptBlankParity(
      "SENTENCE_COMPLETION",
      "Answer [1] then [2] then [3]",
      ["1", "2", "3"]
    );
    expect(issues).toEqual([]);
  });

  it("rejects space-padded [ N ] placeholders", () => {
    const issues = validatePromptBlankParity(
      "SENTENCE_COMPLETION",
      "Answer [ 1 ] then [ 2 ]",
      ["1", "2"]
    );
    expect(issues).toHaveLength(2);
    expect(issues[0].level).toBe("error");
    expect(issues[0].field).toBe("promptMd");
    expect(issues[0].message).toContain('"[1]"');
  });

  it("ignores non-completion-family question types", () => {
    // MULTIPLE_CHOICE_SINGLE uses options[] not BlankAcceptTexts.
    const issues = validatePromptBlankParity(
      "MULTIPLE_CHOICE_SINGLE",
      "Pick one. No blanks here.",
      ["1", "2"]
    );
    expect(issues).toEqual([]);
  });

  it("ignores DIAGRAM_LABEL with [Diagram: ...] word-bank marker", () => {
    const issues = validatePromptBlankParity(
      "DIAGRAM_LABEL",
      "Label [Diagram: chloroplast, nucleus] in the diagram",
      ["1", "2"]
    );
    expect(issues).toEqual([]);
  });

  it("ignores MAP_LABEL with [Map: ...] word-bank marker", () => {
    const issues = validatePromptBlankParity(
      "MAP_LABEL",
      "Label [Map: harbour, district] on the map",
      ["1", "2"]
    );
    expect(issues).toEqual([]);
  });

  it("reports each missing key as a separate error", () => {
    const issues = validatePromptBlankParity(
      "SUMMARY_COMPLETION",
      "Only [1] is present",
      ["1", "2", "3"]
    );
    expect(issues).toHaveLength(2);
    expect(issues[0].message).toContain('"[2]"');
    expect(issues[1].message).toContain('"[3]"');
  });

  it("returns empty array when blankKeys is empty", () => {
    // No blanks → no errors (validateBlanks handles the empty-blank warning).
    const issues = validatePromptBlankParity(
      "SENTENCE_COMPLETION",
      "Anything goes",
      []
    );
    expect(issues).toEqual([]);
  });

  it("returns empty array when promptMd is empty", () => {
    const issues = validatePromptBlankParity(
      "SENTENCE_COMPLETION",
      "",
      ["1", "2"]
    );
    expect(issues).toEqual([]);
  });
});
