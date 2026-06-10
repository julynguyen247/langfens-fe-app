"use client";

import React, { useMemo } from "react";
import { Group, Panel } from "react-resizable-panels";
import PassageView from "../../do-test/[skill]/[attemptId]/components/reading/PassageView";
import QuestionPanel, {
  Question,
  ReviewResult,
} from "../../do-test/[skill]/[attemptId]/components/common/QuestionPanel";
import type { RagFeedbackEnvelope } from "@/types/rag";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const isUuidLike = (s: unknown) =>
  typeof s === "string" && UUID_RE.test(s.trim());

type AttemptQuestionResult = {
  questionId: string;
  index: number;
  skill: string;
  questionType?: string;
  promptMd?: string;
  selectedOptionIds?: string[];
  selectedAnswerText?: string;
  correctAnswerText?: string;
  isCorrect?: boolean | null;
  explanationMd?: string;
  ragFeedback?: RagFeedbackEnvelope;
};

type Section = {
  id: string;
  title?: string;
  passageMd?: string;
  questionGroups?: any[];
};

type PaperOption = { id: string; idx: number; contentMd: string };

type Props = {
  attemptId: string;
  paper: {
    title?: string;
    imageUrl?: string;
    sections?: Section[];
  };
  questions: AttemptQuestionResult[];
  skill: "READING" | "LISTENING";
};

function mapQuestionType(backendType?: string) {
  if (!backendType) return "forice_single";
  const t = backendType.toUpperCase();
  if (t.includes("MCQ_SINGLE") || t.includes("TRUE_FALSE") || t.includes("YES_NO")) return "forice_single";
  if (t.includes("MCQ_MULTIPLE")) return "forice_multiple";
  if (t.includes("MATCHING_HEADING")) return "matching_heading";
  if (t.includes("MATCHING_INFORMATION")) return "matching_information";
  if (t.includes("MATCHING_LETTER") || t.includes("MATCHING_FEATURES")) return "matching_letter";
  if (t.includes("SUMMARY") || t.includes("COMPLETION") || t.includes("FILL") || t.includes("TABLE")) return "completion";
  if (t.includes("DIAGRAM") || t.includes("MAP") || t.includes("FLOW")) return "completion";
  return "forice_single";
}

export default function ResultReviewScreen({
  attemptId,
  paper,
  questions,
  skill,
}: Props) {
  const section = paper?.sections?.[0];

  // Build a questionId -> {promptMd, options} lookup from the snapshot so
  // MATCHING_HEADING questions can render with their full list of headings
  // (instead of an empty dropdown in review mode).
  const questionLookup = useMemo(() => {
    const m: Record<
      string,
      { promptMd?: string; options: PaperOption[] }
    > = {};
    for (const sec of paper?.sections ?? []) {
      for (const grp of sec.questionGroups ?? []) {
        for (const q of grp.questions ?? []) {
          if (!q?.id) continue;
          m[String(q.id)] = {
            promptMd: q.promptMd,
            options: Array.isArray(q.options) ? q.options : [],
          };
        }
      }
    }
    return m;
  }, [paper]);

  // Convert questions to QuestionPanel format
  const panelQuestions: Question[] = useMemo(() => {
    return questions.map((q) => {
      const snap = questionLookup[q.questionId];
      // For MATCHING_HEADING the dropdown in review mode must show the full
      // list of headings (snap.options), not the single user answer. We feed
      // those into QuestionPanel as `forices`; the panel then passes them to
      // HeadingDropdown so the user can see what they picked vs the rest of
      // the option list. `value` is the option id (used as the <select> value)
      // and `label` is the full content (e.g. "viii. The Spread of Coffee").
      const isMatchingHeading =
        (q.questionType ?? "").toUpperCase() === "MATCHING_HEADING";
      const forices = isMatchingHeading
        ? (snap?.options ?? []).map((o) => ({
            value: o.contentMd.split(".")[0].trim(),
            label: o.contentMd,
          }))
        : undefined;
      return {
        id: q.questionId,
        stem: q.promptMd || snap?.promptMd || `Question ${q.index}`,
        backendType: q.questionType || "MCQ_SINGLE",
        uiKind: mapQuestionType(q.questionType) as any,
        idx: q.index,
        forices,
      };
    });
  }, [questions, questionLookup]);

  // Create review data
  const reviewData: ReviewResult[] = useMemo(() => {
    return questions.map((q) => ({
      questionId: q.questionId,
      isCorrect: q.isCorrect ?? null,
      correctAnswer: q.correctAnswerText,
      explanation: q.explanationMd,
      ragFeedback: q.ragFeedback as RagFeedbackEnvelope | undefined,
    }));
  }, [questions]);

  // Build initial answers from user selections
  const initialAnswers = useMemo(() => {
    const ans: Record<string, string> = {};
    for (const q of questions) {
      // For MATCHING_HEADING the BE returns the full option content
      // (e.g. "viii. The Spread of Coffee") as selectedAnswerText, but the
      // dropdown's <option value> is the roman ("viii"). Re-derive the key
      // so the select actually highlights the right option.
      // Also: the BE occasionally falls back to the raw option UUID when it
      // cannot resolve the user's selection to option text. Treat that as
      // "no answer" so the dropdown shows as unselected.
      const isMatchingHeading =
        (q.questionType ?? "").toUpperCase() === "MATCHING_HEADING";
      const raw = q.selectedAnswerText || "";
      const text = isUuidLike(raw) ? "" : raw;
      ans[q.questionId] = isMatchingHeading
        ? text.split(".")[0].trim()
        : text;
    }
    return ans;
  }, [questions]);

  const correctCount = questions.filter((q) => q.isCorrect === true).length;
  const totalCount = questions.length;

  return (
    <div className="flex flex-col h-full">
      {/* Stats bar */}
      <div className="bg-white border-b-[3px] border-[var(--border)] shadow-[0_4px_0_rgba(0,0,0,0.08)] px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <h2
            className="text-lg font-semibold text-[var(--foreground)]"
            style={{ fontFamily: "var(--font-heading)" }}
          >
            {skill.charAt(0) + skill.slice(1).toLowerCase()} Review
          </h2>
          <div className="flex items-center gap-4 text-sm">
            <span className="px-3 py-1 rounded-full border-[2px] border-[var(--skill-speaking-border)] bg-[var(--skill-speaking-light)] text-[var(--skill-speaking)] font-bold">
              Correct: {correctCount}
            </span>
            <span className="px-3 py-1 rounded-full border-[2px] border-red-300 bg-red-50 text-red-600 font-bold">
              Wrong: {totalCount - correctCount}
            </span>
            <span className="text-[var(--text-body)] font-medium">
              Total: {totalCount}
            </span>
          </div>
        </div>
      </div>

      {/* Main content - reuse exam layout */}
      <div className="flex-1 overflow-hidden">
        <Group orientation="horizontal">
          <Panel defaultSize={65} minSize={40} className="overflow-hidden">
            <div className="h-full overflow-hidden border-r bg-[var(--background)]">
              <PassageView
                passage={{
                  title: section?.title || paper?.title || `${skill} Passage`,
                  content: section?.passageMd || "",
                }}
                imageUrl={paper?.imageUrl}
                attemptId={attemptId}
                sectionId={section?.id}
              />
            </div>
          </Panel>
          <Panel defaultSize={35} minSize={25} className="overflow-hidden">
            <div className="h-full flex flex-col overflow-hidden border-l bg-white shadow-xl z-20">
              <div className="border-b-[3px] border-[var(--border)] px-5 py-4 bg-white sticky top-0 z-10">
                <h2
                  className="text-lg font-semibold text-[var(--foreground)]"
                  style={{ fontFamily: "var(--font-heading)" }}
                >
                  Questions (Review Mode)
                </h2>
              </div>
              <div className="flex-1 overflow-auto p-4">
                <QuestionPanel
                  attemptId={attemptId}
                  questions={panelQuestions}
                  questionGroups={section?.questionGroups}
                  initialAnswers={initialAnswers}
                  isReviewMode={true}
                  reviewData={reviewData}
                />
              </div>
            </div>
          </Panel>
        </Group>
      </div>
    </div>
  );
}
