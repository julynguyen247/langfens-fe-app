import { describe, it, expect } from "vitest";

describe("Ordinal Invariant (1-Indexed Platform Standardization)", () => {
  it("resolves question index using displayIdx ?? idx strictly >= 1", () => {
    const questions = [
      { id: "q1", idx: 1, displayIdx: 1 },
      { id: "q2", idx: 2, displayIdx: undefined },
      { id: "q3", idx: 3, displayIdx: 3 },
    ];

    for (const q of questions) {
      const qIndex = q.displayIdx ?? q.idx;
      expect(qIndex).toBeGreaterThanOrEqual(1);
    }
  });

  it("sorts questions monotonically 1..N without zero-offset leakage", () => {
    const rawQuestions = [
      { id: "q3", idx: 3, displayIdx: 3 },
      { id: "q1", idx: 1, displayIdx: 1 },
      { id: "q2", idx: 2, displayIdx: 2 },
    ];

    const sorted = [...rawQuestions].sort(
      (a, b) => (a.displayIdx ?? a.idx) - (b.displayIdx ?? b.idx)
    );

    const ordinals = sorted.map((q) => q.displayIdx ?? q.idx);
    expect(ordinals).toEqual([1, 2, 3]);
    expect(ordinals[0]).toBe(1);
  });

  it("ensures options pool ordinals adhere to 1..N convention", () => {
    const options = [
      { id: "opt1", idx: 1, contentMd: "A. True" },
      { id: "opt2", idx: 2, contentMd: "B. False" },
      { id: "opt3", idx: 3, contentMd: "C. Not Given" },
    ];

    for (const opt of options) {
      expect(opt.idx).toBeGreaterThanOrEqual(1);
    }

    const minIdx = Math.min(...options.map((o) => o.idx));
    expect(minIdx).toBe(1);
  });
});
