import { describe, it, expect } from "vitest";
import { cleanAnswer } from "../cleanAnswer";

describe("cleanAnswer", () => {
  it("handles empty, null, and undefined input", () => {
    expect(cleanAnswer(undefined)).toBe("");
    expect(cleanAnswer(null)).toBe("");
    expect(cleanAnswer("")).toBe("");
  });

  it("collapses whitespace and trims", () => {
    expect(cleanAnswer("  hello   world  ")).toBe("hello world");
    expect(cleanAnswer("line1\\nline2")).toBe("line1\nline2");
  });

  it("deduplicates slash tokens", () => {
    expect(cleanAnswer("D / D")).toBe("D");
    expect(cleanAnswer("D/D")).toBe("D");
    expect(cleanAnswer("True / True")).toBe("True");
    expect(cleanAnswer("Option A / Option B")).toBe("Option A");
  });

  it("strips administrative prefixes", () => {
    expect(cleanAnswer("blank_1: photosynthesis")).toBe("photosynthesis");
    expect(cleanAnswer("[blank-2] mitochondria")).toBe("mitochondria");
    expect(cleanAnswer("label-a: Library")).toBe("Library");
    expect(cleanAnswer("step 1: Boil water")).toBe("Boil water");
    expect(cleanAnswer("node_3: Server")).toBe("Server");
    expect(cleanAnswer("paragraph A: Overview")).toBe("Overview");
    expect(cleanAnswer("feature-q1: Feature")).toBe("Feature");
    expect(cleanAnswer("q2: Answer")).toBe("Answer");
    expect(cleanAnswer("heading-3: The Roman Empire")).toBe("The Roman Empire");
  });

  it("preserves G15 invariant (legitimate answer prefixes remain intact)", () => {
    expect(cleanAnswer("Reason: Global warming")).toBe("Reason: Global warming");
    expect(cleanAnswer("Title: A New Era")).toBe("Title: A New Era");
  });

  it("preserves case (does not call toLowerCase)", () => {
    expect(cleanAnswer("VII")).toBe("VII");
    expect(cleanAnswer("True")).toBe("True");
    expect(cleanAnswer("NASA")).toBe("NASA");
    expect(cleanAnswer("heading-1: VII")).toBe("VII");
  });
});
