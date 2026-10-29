import { beforeEach, describe, expect, it, vi } from "vitest";
const { post } = vi.hoisted(() => ({ post: vi.fn() }));
vi.mock("@/utils/api.customize", () => ({ apisAttempt: { post } }));
import { autoSaveAttempt, submitAttempt } from "@/services/attempts";

beforeEach(() => { post.mockReset(); });
const answer = (text: string) => ({ questionId: "q", sectionId: "s", selectedOptionIds: [] as string[], textAnswer: text });
const tick = async () => { for (let i = 0; i < 5; i++) await Promise.resolve(); };

describe("serialized autosave and submit", () => {
  it("does not start the newer save until the older request completes", async () => {
    let release!: () => void;
    post.mockImplementationOnce(() => new Promise<void>(resolve => { release = resolve; })).mockResolvedValue({ data: {} });
    const older = autoSaveAttempt("serialized", { answers: [answer("old")], clientRevision: 1 });
    const newer = autoSaveAttempt("serialized", { answers: [answer("new")], clientRevision: 2 });
    await tick();
    expect(post).toHaveBeenCalledTimes(1);
    release(); await Promise.all([older, newer]);
    expect(post.mock.calls.map(c => c[1].answers[0].textAnswer)).toEqual(["old", "new"]);
  });
  it("never submits when the final save fails", async () => {
    post.mockRejectedValue(new Error("offline"));
    await expect(submitAttempt("failed", [answer("latest")])).rejects.toThrow("offline");
    expect(post.mock.calls.map(c => c[0])).toEqual(["/attempt/autosave/failed"]);
  });
  it("persists inline answers explicitly BEFORE calling the body-less backend submit", async () => {
    post.mockResolvedValue({ data: {} });
    await submitAttempt("final", [answer("latest")]);
    expect(post.mock.calls.map(c => c[0])).toEqual(["/attempt/autosave/final", "/attempt/submit/final"]);
    expect(post.mock.calls[1][1]).toEqual({});
  });
  it("can retry a failed save without poisoning the queue", async () => {
    post.mockRejectedValueOnce(new Error("offline")).mockResolvedValue({ data: {} });
    await expect(autoSaveAttempt("retry", { answers: [answer("old")], clientRevision: 1 })).rejects.toThrow();
    await expect(autoSaveAttempt("retry", { answers: [answer("latest")], clientRevision: 2 })).resolves.toBeDefined();
  });
});
