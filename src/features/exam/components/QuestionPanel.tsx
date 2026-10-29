"use client";

import React, { memo, useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import BookmarkButton from "@/components/BookmarkButton";
import { RagFeedbackCard } from "@/components/rag/RagFeedbackCard";
import type { RagFeedbackEnvelope } from "@/types/rag";
import type { AnswerMap, InternalDeliveryQuestion, InternalDeliveryQuestionGroup } from "../types";
import { QuestionRenderer } from "./QuestionRenderer";
import { decodeAnswer, encodeAnswer, hasAnswer } from "../contract";

export type ReviewResult = {
  questionId: string;
  isCorrect: boolean | null;
  correctAnswer?: string;
  explanation?: string;
  ragFeedback?: RagFeedbackEnvelope;
};

const QuestionPanel = memo(function QuestionPanel({ questions, attemptId, skill, initialAnswers, answers: controlledAnswers, onAnswersChange, questionGroups, isReviewMode = false, reviewData = [] }: {
  questions: InternalDeliveryQuestion[];
  attemptId: string;
  skill?: string;
  initialAnswers?: AnswerMap;
  answers?: AnswerMap;
  onAnswersChange?: (answers: AnswerMap) => void;
  questionGroups?: InternalDeliveryQuestionGroup[] | null;
  isReviewMode?: boolean;
  reviewData?: ReviewResult[];
}) {
  const [localAnswers, setLocalAnswers] = useState<AnswerMap>(initialAnswers ?? {});
  const answers = controlledAnswers ?? localAnswers;
  const answersRef = useRef(answers);
  answersRef.current = answers;
  useEffect(() => { if (initialAnswers) setLocalAnswers(initialAnswers); }, [initialAnswers]);
  const handleAnswer = (id: string, value: string) => {
    if (isReviewMode) return;
    const next = { ...answersRef.current, [id]: value };
    answersRef.current = next;
    if (!controlledAnswers) setLocalAnswers(next);
    onAnswersChange?.(next);
  };
  const reviewMap = new Map(reviewData.map(r => [r.questionId, r]));
  const instructions = new Map((questionGroups ?? []).filter(g => g.questions?.[0]?.id).map(g => [g.questions[0].id, g.instructionMd]));
  return (
    <div className="flex flex-col min-h-0 rounded-[1.5rem] border-[3px] border-[var(--border)] bg-white text-sm">
      <div className="p-4 space-y-4">
        {questions.map((q, index) => {
          if (!q.id) return <p role="alert" key={index}>Question identity is missing. Please reload the exam.</p>;
          const id = q.id;
          const number = q.displayIdx ?? q.idx;
          const answer = answers[id] ?? "";
          const value = decodeAnswer({ textAnswer: answer }, q);
          const review = reviewMap.get(id);
          const answered = hasAnswer({ textAnswer: answer });
          const status = review?.isCorrect === true ? "Correct" : !answered ? "Unanswered" : review?.isCorrect === false ? "Wrong" : "Not graded";
          const userText = Array.isArray(value)
            ? (q.type === "FLOW_CHART" ? value.join(" -> ") : value.map(optionId => q.options?.find(o => o.id === optionId)?.contentMd ?? optionId).join(", "))
            : typeof value === "string"
            ? (q.options?.find(o => o.id === value)?.contentMd ?? value)
            : value && typeof value === "object" && "steps" in value && Array.isArray((value as any).steps)
            ? (value as any).steps.join(" -> ")
            : Object.entries(value).map(([key, text]) => `[${key}]: ${typeof text === "string" ? text : JSON.stringify(text)}`).join("\n");
          return (
            <div key={id} id={`q-${number}`} className="space-y-3 scroll-mt-24">
              {instructions.get(id) && <div className="rounded-xl bg-[var(--primary-light)] p-4"><ReactMarkdown remarkPlugins={[remarkGfm]}>{instructions.get(id)!.replace(/\\n/g, "\n")}</ReactMarkdown></div>}
              <div className="rounded-xl border border-[var(--border)] p-4 space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-semibold">Question {number}</span>
                  {isReviewMode ? <span role="status">{status}</span> : <BookmarkButton questionId={id} attemptId={attemptId} skill={skill} questionContent={q.promptMd ?? ""} questionType={q.type} />}
                </div>
                <div className="prose prose-sm max-w-none"><ReactMarkdown remarkPlugins={[remarkGfm]}>{(q.promptMd ?? "").replace(/\\n/g, "\n")}</ReactMarkdown></div>
                <QuestionRenderer question={q} value={value} readOnly={isReviewMode} onChange={next => handleAnswer(id, encodeAnswer(next))} />
                {isReviewMode && <div className="grid gap-3 border-t border-[var(--border)] pt-3 sm:grid-cols-2 whitespace-pre-wrap">
                  <div><span className="font-semibold">Your answer: </span>{answered ? userText : "Empty"}</div>
                  {review?.correctAnswer && <div><span className="font-semibold">Correct answer: </span>{review.correctAnswer}</div>}
                </div>}
                {isReviewMode && review?.explanation && <ReactMarkdown remarkPlugins={[remarkGfm]}>{review.explanation}</ReactMarkdown>}
                {isReviewMode && review?.ragFeedback && <RagFeedbackCard envelope={review.ragFeedback} />}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
});
export default QuestionPanel;
