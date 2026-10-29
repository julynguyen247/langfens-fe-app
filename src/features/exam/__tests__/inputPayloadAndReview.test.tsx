import React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createRoot, type Root } from "react-dom/client";
import QuestionPanel from "../components/QuestionPanel";
import { AttemptReview } from "../components/AttemptReview";
import { normalizeExamPaper, sectionQuestions } from "../contract";
import { buildAnswerPayload } from "@/lib/answerPayload";
import type { AttemptResultData, InternalDeliveryExam, InternalDeliveryQuestion } from "../types";

vi.mock("@/components/BookmarkButton", () => ({ default: () => null }));
vi.mock("@/components/rag/RagFeedbackCard", () => ({ RagFeedbackCard: () => null }));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
}));

const { fetchAttemptResultMock } = vi.hoisted(() => ({
  fetchAttemptResultMock: vi.fn(),
}));
vi.mock("../resultApi", () => ({
  fetchAttemptResult: fetchAttemptResultMock,
}));

globalThis.IS_REACT_ACT_ENVIRONMENT = true;
let root: Root | undefined;
let container: HTMLDivElement;

beforeEach(() => {
  vi.clearAllMocks();
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
});

afterEach(async () => {
  if (root) {
    await React.act(async () => root!.unmount());
    root = undefined;
  }
  container?.remove();
});

const opt1 = "11111111-1111-1111-1111-111111111111";
const opt2 = "22222222-2222-2222-2222-222222222222";

describe("actual input-change -> keyed payload regression", () => {
  it("captures text, selection, and multi-option inputs into exact keyed wire payload", async () => {
    const questions: InternalDeliveryQuestion[] = [
      {
        id: "q-comp",
        sectionId: "sec-reading-1",
        idx: 1,
        type: "SENTENCE_COMPLETION",
        skill: "READING",
        difficulty: 1,
        promptMd: "Deep water [5] occurs annually",
        blankAcceptTexts: { "5": ["upwelling"] },
        options: [],
      },
      {
        id: "q-mcq",
        sectionId: "sec-reading-1",
        idx: 2,
        type: "MULTIPLE_CHOICE_SINGLE",
        skill: "READING",
        difficulty: 1,
        promptMd: "What is the primary factor?",
        options: [
          { id: opt1, idx: 1, contentMd: "Temperature" },
          { id: opt2, idx: 2, contentMd: "Salinity" },
        ],
      },
      {
        id: "q-multi",
        sectionId: "sec-reading-2",
        idx: 3,
        type: "MULTIPLE_CHOICE_MULTIPLE",
        skill: "READING",
        difficulty: 1,
        promptMd: "Choose TWO factors:",
        options: [
          { id: opt1, idx: 1, contentMd: "Depth" },
          { id: opt2, idx: 2, contentMd: "Pressure" },
        ],
      },
      {
        id: "q-match",
        sectionId: "sec-reading-2",
        idx: 4,
        type: "MATCHING_HEADING",
        skill: "READING",
        difficulty: 1,
        promptMd: "1. Section A\n2. Section B",
        matchPairs: { "1": [], "2": [] },
        options: [
          { id: "opt-h1", idx: 1, contentMd: "i. Ocean currents" },
          { id: "opt-h2", idx: 2, contentMd: "ii. Wind patterns" },
        ],
      },
    ];

    let currentAnswers: Record<string, string> = {};
    const onAnswersChange = vi.fn((next: Record<string, string>) => {
      currentAnswers = { ...currentAnswers, ...next };
    });

    await React.act(async () => {
      root!.render(
        <QuestionPanel
          attemptId="attempt-123"
          questions={questions}
          onAnswersChange={onAnswersChange}
        />
      );
    });

    // 1. Simulate typing into Completion blank [5]
    const compInput = container.querySelector<HTMLInputElement>('input[aria-label="Blank [5]"]');
    expect(compInput).not.toBeNull();
    await React.act(async () => {
      const nativeSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value")?.set;
      nativeSetter?.call(compInput, "upwelling");
      compInput!.dispatchEvent(new Event("change", { bubbles: true }));
    });
    expect(onAnswersChange).toHaveBeenCalledWith(expect.objectContaining({ "q-comp": '{"5":"upwelling"}' }));

    // 2. Simulate clicking MCQ single option
    const mcqButton = container.querySelector<HTMLButtonElement>(`button[aria-label="Temperature"]`);
    expect(mcqButton).not.toBeNull();
    await React.act(async () => {
      mcqButton!.click();
    });
    expect(onAnswersChange).toHaveBeenCalledWith(expect.objectContaining({ "q-mcq": opt1 }));

    // 3. Simulate clicking two options in MCQ multiple sequentially
    const multiBtn1 = container.querySelector<HTMLButtonElement>(`button[aria-label="Depth"]`);
    expect(multiBtn1).not.toBeNull();
    await React.act(async () => {
      multiBtn1!.click();
    });

    const multiBtn2 = container.querySelector<HTMLButtonElement>(`button[aria-label="Pressure"]`);
    expect(multiBtn2).not.toBeNull();
    await React.act(async () => {
      multiBtn2!.click();
    });
    expect(onAnswersChange).toHaveBeenCalledWith(expect.objectContaining({ "q-multi": JSON.stringify([opt1, opt2]) }));

    // 4. Simulate selecting choice in Matching dropdown
    const matchSelect = container.querySelector<HTMLSelectElement>('select[aria-label="Item 1"]');
    expect(matchSelect).not.toBeNull();
    await React.act(async () => {
      matchSelect!.value = "i";
      matchSelect!.dispatchEvent(new Event("change", { bubbles: true }));
    });
    expect(onAnswersChange).toHaveBeenCalledWith(expect.objectContaining({ "q-match": '{"1":"i"}' }));

    // 5. Verify the full keyed wire payload constructed by buildAnswerPayload
    const sectionResolver = (qid: string) => questions.find(q => q.id === qid)?.sectionId;
    const textResolver = (qid: string, val: string) => {
      const q = questions.find(item => item.id === qid);
      return ["MULTIPLE_CHOICE_SINGLE", "MULTIPLE_CHOICE_MULTIPLE", "TRUE_FALSE_NOT_GIVEN", "YES_NO_NOT_GIVEN"].includes(q?.type ?? "")
        ? undefined
        : val;
    };

    const wirePayload = buildAnswerPayload(currentAnswers, sectionResolver, textResolver);

    expect(wirePayload.answers).toEqual([
      {
        questionId: "q-comp",
        sectionId: "sec-reading-1",
        selectedOptionIds: [],
        textAnswer: '{"5":"upwelling"}',
      },
      {
        questionId: "q-mcq",
        sectionId: "sec-reading-1",
        selectedOptionIds: [opt1],
        textAnswer: "",
      },
      {
        questionId: "q-multi",
        sectionId: "sec-reading-2",
        selectedOptionIds: [opt1, opt2],
        textAnswer: "",
      },
      {
        questionId: "q-match",
        sectionId: "sec-reading-2",
        selectedOptionIds: [],
        textAnswer: '{"1":"i"}',
      },
    ]);
    expect(typeof wirePayload.clientRevision).toBe("number");
  });
});

describe("result ID collision & review integrity", () => {
  it("joins answers strictly by questionId even when idx collides across sections", async () => {
    // Both sections have questions with idx = 1
    const paper = {
      id: "exam-colliding-idx",
      title: "Colliding Index Exam",
      sections: [
        {
          id: "sec-1",
          idx: 1,
          title: "Section 1",
          questions: [
            {
              id: "q-sec1-q1",
              idx: 1, // Collides with sec-2
              type: "MULTIPLE_CHOICE_SINGLE",
              skill: "READING",
              difficulty: 1,
              promptMd: "Question from Sec 1",
              options: [
                { id: opt1, idx: 1, contentMd: "Option A" },
                { id: opt2, idx: 2, contentMd: "Option B" },
              ],
            },
          ],
        },
        {
          id: "sec-2",
          idx: 2,
          title: "Section 2",
          questions: [
            {
              id: "q-sec2-q1",
              idx: 1, // Same idx as sec-1!
              type: "MULTIPLE_CHOICE_SINGLE",
              skill: "READING",
              difficulty: 1,
              promptMd: "Question from Sec 2",
              options: [
                { id: opt1, idx: 1, contentMd: "Choice X" },
                { id: opt2, idx: 2, contentMd: "Choice Y" },
              ],
            },
          ],
        },
      ],
    };

    const mockResultData: AttemptResultData = {
      attemptId: "att-collision",
      status: "SUBMITTED",
      totalQuestion: 2,
      correctCount: 1,
      ieltsBand: 6.0,
      paper: normalizeExamPaper(paper as unknown as InternalDeliveryExam),
      answers: [
        {
          questionId: "q-sec1-q1",
          sectionId: "sec-1",
          idx: 1,
          isCorrect: true,
          selectedOptionIds: [opt1],
          correctAnswerText: "Option A",
        },
        {
          questionId: "q-sec2-q1",
          sectionId: "sec-2",
          idx: 1,
          isCorrect: false,
          selectedOptionIds: [opt2],
          correctAnswerText: "Choice X",
        },
      ],
    };

    fetchAttemptResultMock.mockResolvedValue(mockResultData);

    await React.act(async () => {
      root!.render(<AttemptReview attemptId="att-collision" />);
    });

    // In Section 1: Question 1 must be marked Correct, and show user answer "Option A"
    expect(container.textContent).toContain("Section 1");
    expect(container.textContent).toContain("Score: 1 / 2");
    expect(container.textContent).toContain("Band: 6.0");
    expect(container.querySelector('[role="status"]')?.textContent).toBe("Correct");
    expect(container.textContent).toContain("Your answer: Option A");
    expect(container.textContent).toContain("Correct answer: Option A");

    // Switch to Section 2
    const sec2Button = container.querySelector<HTMLButtonElement>('button[aria-current="page"]')?.parentElement?.querySelectorAll("button")[1];
    expect(sec2Button).toBeDefined();
    await React.act(async () => {
      sec2Button!.click();
    });

    // In Section 2: Question 2 (displayIdx 2) must be marked Wrong, and show user answer "Choice Y"
    expect(container.querySelector('[role="status"]')?.textContent).toBe("Wrong");
    expect(container.textContent).toContain("Your answer: Choice Y");
    expect(container.textContent).toContain("Correct answer: Choice X");
  });

  it("deduplicates identical question IDs appearing across section questions and questionGroups", () => {
    const rawPaper = {
      id: "exam-dup",
      title: "Duplicate Exam",
      sections: [
        {
          id: "sec-dup",
          idx: 1,
          title: "Section with duplicate row",
          questions: [
            {
              id: "q-duplicate",
              idx: 1,
              type: "SHORT_ANSWER",
              skill: "READING",
              difficulty: 1,
              promptMd: "Duplicated question",
              options: [],
            },
          ],
          questionGroups: [
            {
              id: "grp-dup",
              idx: 1,
              startIdx: 1,
              endIdx: 1,
              instructionMd: "Group instruction",
              questions: [
                {
                  id: "q-duplicate", // Same ID in group as in questions list
                  idx: 1,
                  type: "SHORT_ANSWER",
                  skill: "READING",
                  difficulty: 1,
                  promptMd: "Duplicated question in group",
                  options: [],
                },
              ],
            },
          ],
        },
      ],
    };

    const normalized = normalizeExamPaper(rawPaper as unknown as InternalDeliveryExam);
    const questions = normalized.sections.flatMap(sectionQuestions);

    // Must be deduplicated to exactly one question
    expect(questions).toHaveLength(1);
    expect(questions[0].id).toBe("q-duplicate");
    expect(questions[0].displayIdx).toBe(1);
  });

  it("server-authoritative correctness overrides fuzzy matching without local regrading", async () => {
    const qItem: InternalDeliveryQuestion = {
      id: "q-strict",
      sectionId: "sec-1",
      idx: 1,
      type: "SHORT_ANSWER",
      skill: "READING",
      difficulty: 1,
      promptMd: "Write the species name:",
      options: [],
    };

    // Candidate answered "canis lupus", correct answer is "Canis lupus".
    // Server says isCorrect: false (e.g. strict case or punctuation mismatch on backend).
    // Client MUST NOT override server result with local case-insensitive grading!
    await React.act(async () => {
      root!.render(
        <QuestionPanel
          attemptId="att-1"
          questions={[qItem]}
          initialAnswers={{ "q-strict": "canis lupus" }}
          isReviewMode={true}
          reviewData={[
            {
              questionId: "q-strict",
              isCorrect: false, // Server authoritative: wrong
              correctAnswer: "Canis lupus",
              explanation: "Capitalization required.",
            },
          ]}
        />
      );
    });

    expect(container.querySelector('[role="status"]')?.textContent).toBe("Wrong");
    expect(container.textContent).toContain("Your answer: canis lupus");
    expect(container.textContent).toContain("Correct answer: Canis lupus");
    expect(container.textContent).toContain("Capitalization required.");
    // The fieldset is locked
    expect(container.querySelector("fieldset")?.disabled).toBe(true);
  });
});
