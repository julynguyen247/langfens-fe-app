import React from "react";
import { createRoot } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
const { detail, submitAttempt, saveNow, run, cancel } = vi.hoisted(() => ({ detail: vi.fn(), submitAttempt: vi.fn(), saveNow: vi.fn(), run: vi.fn(), cancel: vi.fn() }));
vi.mock("@/services/attempts", () => ({ getAttemptDetail: detail, submitAttempt }));
vi.mock("@/hooks/useDebouncedAutoSave", () => ({ useDebouncedAutoSave: () => ({ saveNow, run, cancel }) }));
import { useExamSession } from "../useExamSession";
import type { InternalDeliveryQuestion } from "../types";

globalThis.IS_REACT_ACT_ENVIRONMENT = true;
let session: ReturnType<typeof useExamSession>;
let container: HTMLDivElement;
let root: ReturnType<typeof createRoot>;
const questions = ["s1", "s2"].map((sectionId, i) => ({ id: `q${i + 1}`, sectionId, idx: i + 1, type: "SENTENCE_COMPLETION", promptMd: "[5]", options: [] } as unknown as InternalDeliveryQuestion));
function Harness() { session = useExamSession("attempt", questions); return <span>{session.ready ? "Ready" : session.error ?? "Loading"}</span>; }
async function mount() { container = document.createElement("div"); root = createRoot(container); await React.act(async () => root.render(<Harness />)); }
beforeEach(() => { vi.clearAllMocks(); sessionStorage.clear(); detail.mockResolvedValue({ data: { data: { status: "STARTED", answers: [{ questionId: "q1", textAnswer: '{"5":"saved"}' }] } } }); saveNow.mockResolvedValue(undefined); submitAttempt.mockResolvedValue(undefined); });
afterEach(async () => { await React.act(async () => root?.unmount()); container?.remove(); });

describe("one exam answer session", () => {
  it("hydrates server answers plus the latest local draft before allowing submit", async () => {
    sessionStorage.setItem("attempt-answers:attempt", JSON.stringify({ q2: '{"5":"draft"}', unknown: "discard" }));
    await mount();
    expect(session.ready).toBe(true);
    expect(session.answers).toEqual({ q1: '{"5":"saved"}', q2: '{"5":"draft"}' });
    await React.act(async () => session.changeAnswers({ q2: '{"5":"latest"}' }));
    await session.submit();
    const [answers, resolveSection] = saveNow.mock.calls[0];
    expect(answers).toEqual({ q1: '{"5":"saved"}', q2: '{"5":"latest"}' });
    expect(resolveSection("q1")).toBe("s1");
    expect(resolveSection("q2")).toBe("s2");
    expect(sessionStorage.getItem("attempt-answers:attempt")).toBeNull();
    await session.submit();
    expect(submitAttempt).toHaveBeenCalledTimes(1);
  });
  it("retains draft and blocks submit after a failed final save, then permits retry", async () => {
    await mount();
    await React.act(async () => session.changeAnswers({ q1: '{"5":"new"}' }));
    saveNow.mockRejectedValueOnce(new Error("offline"));
    await expect(session.submit()).rejects.toThrow("offline");
    expect(submitAttempt).not.toHaveBeenCalled();
    expect(sessionStorage.getItem("attempt-answers:attempt")).toContain("new");
    await session.submit();
    expect(submitAttempt).toHaveBeenCalledTimes(1);
  });
  it("fails closed when restoring saved answers fails", async () => {
    detail.mockRejectedValue(new Error("offline"));
    await mount();
    expect(session.ready).toBe(false);
    expect(session.error).toBeTruthy();
    await expect(session.submit()).rejects.toThrow("Answers have not loaded yet");
    expect(submitAttempt).not.toHaveBeenCalled();
  });
});
