import { beforeEach, describe, expect, it, vi } from "vitest";
const { get } = vi.hoisted(() => ({ get: vi.fn() }));
vi.mock("@/utils/api.customize", () => ({ apisAttempt: { get } }));
import { fetchAttemptResult } from "../resultApi";

beforeEach(() => { get.mockReset(); });
const snapshot = { id: "exam", title: "Frozen attempt", sections: [{ id: "s", idx: 1, questions: [{ id: "q", idx: 1, type: "MULTIPLE_CHOICE_SINGLE", options: [{ id: "a", idx: 1, contentMd: "CAT" }, { id: "b", idx: 2, contentMd: "CATS" }] }] }] };

describe("attempt result source of truth", () => {
  it("uses frozen fullSnapshot, server totals and raw answers without fuzzy correctness", async () => {
    get.mockResolvedValue({ data: { isSuccess: true, data: { fullSnapshot: snapshot, totalQuestion: 40, correctCount: 12, rawScore: 12, answers: [{ questionId: "q", idx: 1, isCorrect: true, selectedOptionIds: ["b"], correctAnswerText: "CATS" }] } } });
    const result = await fetchAttemptResult("attempt");
    expect(get.mock.calls).toEqual([["/attempt/getresult/attempt"]]);
    expect(result.paper.title).toBe("Frozen attempt");
    expect(result.correctCount).toBe(12);
    expect(result.totalQuestion).toBe(40);
    expect(result.paper.sections[0].questions[0].options.every(o => o.isCorrect === undefined)).toBe(true);
  });
  it("propagates failed results rather than fabricating a zero-score review", async () => {
    get.mockRejectedValue(new Error("offline"));
    await expect(fetchAttemptResult("attempt")).rejects.toThrow("offline");
    expect(get).toHaveBeenCalledTimes(1);
  });
  it("only falls back to the attempt snapshot, never to current exam delivery", async () => {
    get.mockResolvedValueOnce({ data: { isSuccess: true, data: { answers: [] } } }).mockResolvedValueOnce({ data: { isSuccess: true, data: { paper: snapshot } } });
    const result = await fetchAttemptResult("attempt");
    expect(result.totalQuestion).toBe(1);
    expect(get.mock.calls).toEqual([["/attempt/getresult/attempt"], ["/attempt/attempt"]]);
  });
});
