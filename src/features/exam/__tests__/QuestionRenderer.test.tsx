import React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { createRoot, type Root } from "react-dom/client";
import { QuestionRenderer } from "../components/QuestionRenderer";
import QuestionPanel from "../components/QuestionPanel";
import { QuestionType, type InternalDeliveryQuestion } from "../types";

vi.mock("@/components/BookmarkButton", () => ({ default: () => null }));
vi.mock("@/components/rag/RagFeedbackCard", () => ({ RagFeedbackCard: () => null }));
globalThis.IS_REACT_ACT_ENVIRONMENT = true;
let root: Root | undefined;
let container: HTMLDivElement;
afterEach(async () => { await React.act(async () => root?.unmount()); container?.remove(); });
async function render(element: React.ReactNode) {
  container = document.createElement("div"); document.body.appendChild(container); root = createRoot(container);
  await React.act(async () => root!.render(element));
}
const optionA = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa";
const optionB = "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb";
const q = (type: string, extra: Partial<InternalDeliveryQuestion> = {}): InternalDeliveryQuestion => ({ id: "q", idx: 1, type, skill: "READING", difficulty: 1, promptMd: "Complete [3], [4], [5]", options: [{ id: optionA, idx: 1, contentMd: "A. CAT" }, { id: optionB, idx: 2, contentMd: "B. CATS" }], matchPairs: { "5": [] }, flowChartNodes: [{ key: "b", label: "Second" }, { key: "a", label: "First" }], ...extra });

describe("shared question renderer", () => {
  it.each(Object.values(QuestionType))("supports backend type %s without a parallel review renderer", async type => {
    await render(<QuestionRenderer question={q(type)} onChange={() => undefined} />);
    expect(container.textContent).not.toContain("Unsupported question type");
    expect(container.querySelector("input,textarea,select,button")).not.toBeNull();
  });
  it("renders blank [5] with the persisted [5] answer and server correctness only", async () => {
    await render(<QuestionPanel attemptId="attempt" questions={[q("SENTENCE_COMPLETION")]} initialAnswers={{ q: '{"3":"","4":"","5":"twenty"}' }} isReviewMode reviewData={[{ questionId: "q", isCorrect: true, correctAnswer: "20" }]} />);
    expect(container.querySelector<HTMLInputElement>('input[aria-label="Blank [5]"]')?.value).toBe("twenty");
    expect(container.querySelector<HTMLInputElement>('input[aria-label="Blank [3]"]')?.value).toBe("");
    expect(container.querySelector('[role="status"]')?.textContent).toBe("Correct");
    expect(container.querySelector("fieldset")?.disabled).toBe(true);
    expect(container.textContent).not.toContain("Wrong");
  });
  it.each(["TRUE_FALSE_NOT_GIVEN", "YES_NO_NOT_GIVEN"])("emits option IDs for %s and hydrates selected IDs", async type => {
    const change = vi.fn();
    await render(<QuestionRenderer question={q(type, { options: [{ id: optionA, idx: 1, contentMd: type.startsWith("TRUE") ? "True" : "Yes" }] })} value={[optionA]} onChange={change} />);
    const button = container.querySelector("button")!;
    expect(button.getAttribute("aria-pressed")).toBe("true");
    await React.act(async () => button.click());
    expect(change).toHaveBeenCalledWith(optionA);
  });
  it("does not use fuzzy prefix matching to select MCQ options", async () => {
    await render(<QuestionRenderer question={q("MULTIPLE_CHOICE_SINGLE")} value={optionB} />);
    expect([...container.querySelectorAll('button[aria-pressed="true"]')].map(b => b.textContent)).toEqual(["B. CATS"]);
  });
  it("classification uses real 1-based matching keys and prompt categories", async () => {
    const change = vi.fn();
    await render(<QuestionRenderer question={q("CLASSIFICATION", { promptMd: "1. Statement\nA. Group alpha\nB. Group beta", matchPairs: { "1": [] }, options: [] })} onChange={change} />);
    const select = container.querySelector("select")!;
    await React.act(async () => { select.value = "B"; select.dispatchEvent(new Event("change", { bubbles: true })); });
    expect(change).toHaveBeenCalledWith({ "1": "B" });
    expect(container.querySelectorAll("option")).toHaveLength(3);
  });
  it("uses structured wordList without requiring markdown markers", async () => {
    const change = vi.fn();
    await render(<QuestionRenderer question={q("MATCHING_INFORMATION", { promptMd: "Choose [5]", matchPairs: { "5": [] }, options: [], wordList: ["A. alpha", "B. beta"] })} onChange={change} />);
    const select = container.querySelector("select")!;
    await React.act(async () => { select.value = "B"; select.dispatchEvent(new Event("change", { bubbles: true })); });
    expect(change).toHaveBeenCalledWith({ "5": "B" });
  });
  it("renders question-level imageUrl for MULTIPLE_CHOICE_SINGLE_IMAGE", async () => {
    await render(
      <QuestionRenderer
        question={q("MULTIPLE_CHOICE_SINGLE_IMAGE", {
          imageUrl: "https://example.com/diagram.png",
          options: [{ id: optionA, idx: 1, contentMd: "A. Plan A" }],
        })}
      />
    );
    const img = container.querySelector<HTMLImageElement>('img[alt="Question illustration"]');
    expect(img).not.toBeNull();
    expect(img?.src).toBe("https://example.com/diagram.png");
  });
});
