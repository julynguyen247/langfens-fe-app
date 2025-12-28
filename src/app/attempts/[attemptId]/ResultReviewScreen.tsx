"use client";

import React, { useMemo } from "react";
import { Group, Panel } from "react-resizable-panels";
import PassageView from "../../do-test/[skill]/[attemptId]/components/reading/PassageView";
import QuestionPanel, {
  Question,
  ReviewResult,
} from "../../do-test/[skill]/[attemptId]/components/common/QuestionPanel";

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
};

type Section = {
  id: string;
  title?: string;
  passageMd?: string;
  questionGroups?: any[];
};

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
  if (!backendType) return "choice_single";
  const t = backendType.toUpperCase();
  if (t.includes("MCQ_SINGLE") || t.includes("TRUE_FALSE") || t.includes("YES_NO")) return "choice_single";
  if (t.includes("MCQ_MULTIPLE")) return "choice_multiple";
  if (t.includes("MATCHING_HEADING")) return "matching_heading";
  if (t.includes("MATCHING_INFORMATION")) return "matching_information";
  if (t.includes("MATCHING_LETTER") || t.includes("MATCHING_FEATURES")) return "matching_letter";
  if (t.includes("SUMMARY") || t.includes("COMPLETION") || t.includes("FILL") || t.includes("TABLE")) return "completion";
  if (t.includes("DIAGRAM") || t.includes("MAP") || t.includes("FLOW")) return "completion";
  return "choice_single";
}

export default function ResultReviewScreen({
  attemptId,
  paper,
  questions,
  skill,
}: Props) {
  const section = paper?.sections?.[0];

  // Convert questions to QuestionPanel format
  const panelQuestions: Question[] = useMemo(() => {
    return questions.map((q, i) => ({
      id: q.questionId,
      stem: q.promptMd || `Question ${q.index}`,
      backendType: q.questionType || "MCQ_SINGLE",
      uiKind: mapQuestionType(q.questionType) as any,
      idx: q.index,
    }));
  }, [questions]);

  // Create review data
  const reviewData: ReviewResult[] = useMemo(() => {
    return questions.map((q) => ({
      questionId: q.questionId,
      isCorrect: q.isCorrect ?? null,
      correctAnswer: q.correctAnswerText,
      explanation: q.explanationMd,
    }));
  }, [questions]);

  // Build initial answers from user selections
  const initialAnswers = useMemo(() => {
    const ans: Record<string, string> = {};
    for (const q of questions) {
      ans[q.questionId] = q.selectedAnswerText || "";
    }
    return ans;
  }, [questions]);

  const correctCount = questions.filter((q) => q.isCorrect === true).length;
  const totalCount = questions.length;

  return (
    <div className="flex flex-col h-full">
      {/* Stats bar */}
      <div className="bg-white border-b px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <h2 className="text-lg font-semibold text-slate-900">{skill} Review</h2>
          <div className="flex items-center gap-4 text-sm">
            <span className="text-green-600 font-medium">
              ✓ Đúng: {correctCount}
            </span>
            <span className="text-red-600 font-medium">
              ✗ Sai: {totalCount - correctCount}
            </span>
            <span className="text-slate-600">
              Tổng: {totalCount}
            </span>
          </div>
        </div>
      </div>

      {/* Main content - reuse exam layout */}
      <div className="flex-1 overflow-hidden">
        <Group orientation="horizontal">
          <Panel defaultSize={65} minSize={40} className="overflow-hidden">
            <div className="h-full overflow-hidden border-r bg-gray-50">
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
              <div className="border-b px-5 py-4 bg-white sticky top-0 z-10">
                <h2 className="text-lg font-semibold text-black">Questions (Review Mode)</h2>
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
