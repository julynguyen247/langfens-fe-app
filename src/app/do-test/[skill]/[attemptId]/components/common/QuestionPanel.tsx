"use client";

import React, { memo, useEffect, useMemo, useState, useCallback, useRef } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import QuestionCard from "./QuestionCard";
import FillInBlankCard from "../reading/FillInBlankCard";
import MatchingLetterCard from "../reading/MatchingLetterCard";
import HeadingDropdown from "../reading/HeadingDropdown";
import FlowChartCard from "../reading/FlowChartCard";
import MultiCheckboxCard from "../reading/MultiCheckboxCard";
import SummaryCompletionCard from "../reading/SummaryCompletionCard";
import MatchingInformation from "../reading/WordListCompletionCard";
import { AttemptQuestionGroup } from "@/app/store/useAttemptStore";
import BookmarkButton from "@/components/BookmarkButton";

type Choice = { value: string; label: string };
type QA = Record<string, string>;

export type BackendQuestionType = string;

export type QuestionUiKind =
  | "choice_single"
  | "choice_multiple"
  | "completion"
  | "matching_letter"
  | "matching_heading"
  | "flow_chart"
  | "matching_paragraph"
  | "matching_heading_select"
  | "summary_completion"
  | "matching_information";

export type Question = {
  id: string;
  stem: string;
  backendType: BackendQuestionType;
  uiKind: QuestionUiKind;
  choices?: Array<string | Choice>;
  placeholder?: string;
  order?: string;
  flowChartNodes?: { key: string; label: string }[];
  headings?: { key: string; text: string }[];
  explanationMd?: string;
  idx?: number;
};

// Markdown components for instructions
const instructionComponents = {
  p: ({ node, ...props }: any) => (
    <p className="whitespace-pre-wrap leading-relaxed text-sm text-[var(--foreground)]" {...props} />
  ),
  img: ({ node, src, alt, ...props }: any) => (
    <img
      src={src}
      alt={alt || ""}
      className="max-w-full h-auto rounded-lg shadow-md my-3 mx-auto block"
      style={{ maxHeight: "300px" }}
      {...props}
    />
  ),
  h2: ({ node, ...props }: any) => (
    <h2 className="text-lg font-bold text-[var(--foreground)] mt-4 mb-2" {...props} />
  ),
  h3: ({ node, ...props }: any) => (
    <h3 className="text-base font-semibold text-[var(--text-body)] mt-3 mb-2" {...props} />
  ),
  strong: ({ node, ...props }: any) => (
    <strong className="font-semibold text-[var(--foreground)]" {...props} />
  ),
  ul: ({ node, ...props }: any) => (
    <ul className="list-disc pl-5 my-2 space-y-1" {...props} />
  ),
  li: ({ node, ...props }: any) => (
    <li className="text-sm text-[var(--foreground)]" {...props} />
  ),
  // Add table components
  table: ({ node, ...props }: any) => (
    <div className="overflow-x-auto my-4 border border-[var(--border)] rounded-lg">
      <table className="min-w-full divide-y divide-[var(--border)] text-sm" {...props} />
    </div>
  ),
  thead: ({ node, ...props }: any) => (
    <thead className="bg-[var(--background)]" {...props} />
  ),
  tbody: ({ node, ...props }: any) => (
    <tbody className="divide-y divide-[var(--border)] bg-white" {...props} />
  ),
  tr: ({ node, ...props }: any) => (
    <tr className="hover:bg-[var(--background)]" {...props} />
  ),
  th: ({ node, ...props }: any) => (
    <th className="px-4 py-3 text-left text-xs font-medium text-[var(--text-muted)] tracking-wider font-bold border-b border-[var(--border)]" {...props} />
  ),
  td: ({ node, ...props }: any) => (
    <td className="px-4 py-3 whitespace-pre-wrap text-[var(--text-body)] border-b border-[var(--border-light)]" {...props} />
  ),
};

function normalizeChoices(
  choices: Array<string | Choice> | undefined
): Choice[] {
  if (!choices || choices.length === 0) return [];
  return choices.map((c, i) =>
    typeof c === "string" ? { value: String(i + 1), label: c } : c
  );
}

function unpackBlanks(value: string): string[] {
  if (!value) return [];
  if (value.includes("\n")) return value.split("\n");
  return [value];
}

function packBlanks(values: string[]): string {
  const cleaned = values.map((v) => (v ?? "").trim());
  while (cleaned.length && cleaned[cleaned.length - 1] === "") cleaned.pop();
  return cleaned.join("\n");
}

// Clean raw answer strings like "feature-q1: D / D" -> "D"
function cleanAnswer(s: string | undefined): string {
  if (!s) return "";
  let clean = String(s)
    .replace(/blank[-_]\w+:\s*/gi, "")
    .replace(/label[-_ ]*\w*:\s*/gi, "")
    .replace(/^feature[-_]?q?\d*:\s*/i, "")
    .replace(/^q\d+:\s*/i, "")
    .replace(/^(heading|item|answer|key)[-_]?\d*:\s*/gi, "")
    .replace(/^[\w-]+:\s*/, "")
    .trim();
  // Handle "D / D" patterns - take first value
  if (clean.includes(" / ")) {
    clean = clean.split(" / ")[0].trim();
  }
  return clean;
}

export type ReviewResult = {
  questionId: string;
  isCorrect: boolean | null;
  correctAnswer?: string;
  explanation?: string;
};

const QuestionPanel = memo(function QuestionPanel({
  questions,
  attemptId,
  skill,
  initialAnswers,
  onAnswer,
  onAnswersChange,
  questionGroups,
  isReviewMode = false,
  reviewData = [],
}: {
  questions: Question[];
  attemptId: string;
  skill?: string;
  initialAnswers?: QA;
  onAnswer?: (payload: {
    attemptId: string;
    questionId: string;
    value: string;
  }) => void;
  onAnswersChange?: (answers: QA) => void;
  questionGroups?: AttemptQuestionGroup[];
  isReviewMode?: boolean;
  reviewData?: ReviewResult[];
}) {
  // Build review lookup map
  const reviewMap = useMemo(() => {
    const map: Record<string, ReviewResult> = {};
    for (const r of reviewData) {
      map[r.questionId] = r;
    }
    return map;
  }, [reviewData]);

  const qList = useMemo(
    () =>
      questions.map((q) => ({
        ...q,
        id: String(q.id),
        choices: q.choices ? normalizeChoices(q.choices) : undefined,
      })),
    [questions]
  );

  // Build a map of question index (1-based) to group instructionMd for first questions
  const groupInstructionByIdx = useMemo(() => {
    const map: Record<number, string> = {};
    if (questionGroups && questionGroups.length > 0) {
      for (const grp of questionGroups) {
        if (grp.instructionMd) {
          map[grp.startIdx] = grp.instructionMd;
        }
      }
    }
    return map;
  }, [questionGroups]);

  const [answers, setAnswers] = useState<QA>(() => initialAnswers ?? {});
  const onAnswersChangeRef = useRef(onAnswersChange);

  // Keep the callback ref updated
  useEffect(() => {
    onAnswersChangeRef.current = onAnswersChange;
  }, [onAnswersChange]);

  useEffect(() => {
    if (initialAnswers) setAnswers(initialAnswers);
  }, [initialAnswers]);

  const handleAnswer = useCallback((id: string, value: string) => {
    setAnswers((prev) => {
      const next = { ...prev, [id]: value };
      // Call onAnswersChange directly with the new state
      onAnswersChangeRef.current?.(next);
      return next;
    });
    onAnswer?.({ attemptId, questionId: id, value });
  }, [attemptId, onAnswer]);

  return (
    <div className="flex flex-col h-full min-h-0 rounded-[1.5rem] shadow-[0_4px_0_rgba(0,0,0,0.08)] bg-white overflow-hidden text-sm border-[3px] border-[var(--border)]">
      <div className="flex-1 min-h-0 overflow-auto bg-white p-4 space-y-2 leading-relaxed mb-12">
        {qList.map((q, displayIdx) => {
          const value = answers[q.id] ?? "";
          // Get 1-based question index
          const questionIdx = q.idx ?? (displayIdx + 1);
          // Check if this question is the start of a group
          const groupInstruction = groupInstructionByIdx[questionIdx];

          let questionContent: React.ReactNode = null;

          switch (q.uiKind) {
            case "choice_single":
              questionContent = (
                <QuestionCard
                  question={{
                    id: q.id,
                    stem: q.stem,
                    choices: q.choices ?? [],
                  }}
                  selected={value}
                  onSelect={(_, v) => handleAnswer(q.id, v)}
                />
              );
              break;

            case "completion": {
              const arr = unpackBlanks(value);
              questionContent = (
                <SummaryCompletionCard
                  id={q.id}
                  stem={q.stem}
                  values={arr}
                  onChange={(blankIndex, v) => {
                    const next = [...arr];
                    next[blankIndex] = v;
                    handleAnswer(q.id, packBlanks(next));
                  }}
                />
              );
              break;
            }

            case "matching_information": {
              const arr = unpackBlanks(value);
              questionContent = (
                <MatchingInformation
                  stem={q.stem}
                  values={arr}
                  onChange={(blankIndex, v) => {
                    const next = [...arr];
                    next[blankIndex] = v;
                    handleAnswer(q.id, packBlanks(next));
                  }}
                />
              );
              break;
            }

            case "matching_paragraph":
              questionContent = (
                <div className="flex items-start gap-3 py-3 border-b last:border-b-0">
                  <span className="w-6 text-sm font-semibold text-[var(--text-body)]">
                    {q.order}.
                  </span>
                  <p className="flex-1 text-sm text-[var(--foreground)] leading-relaxed">
                    {q.stem}
                  </p>
                  <input
                    value={value}
                    maxLength={1}
                    placeholder={q.placeholder ?? "A"}
                    onChange={(e) =>
                      handleAnswer(
                        q.id,
                        e.target.value.toUpperCase().replace(/[^A-F]/g, "")
                      )
                    }
                    className="w-12 h-10 rounded-lg border border-[var(--border)] text-center font-semibold text-black
                   focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                  />
                </div>
              );
              break;

            case "choice_multiple":
              questionContent = (
                <MultiCheckboxCard
                  id={q.id}
                  stem={q.stem}
                  choices={q.choices ?? []}
                  value={value}
                  onChange={(v) => handleAnswer(q.id, v)}
                />
              );
              break;

            case "matching_letter":
              questionContent = (
                <MatchingLetterCard
                  id={q.id}
                  stem={q.stem}
                  value={value}
                  onChange={(v) => handleAnswer(q.id, v)}
                />
              );
              break;

            case "matching_heading":
              questionContent = (
                <HeadingDropdown
                  id={q.id}
                  stem={q.stem}
                  options={(q.choices ?? []).map((c) => ({
                    contentMd: typeof c === "string" ? c : c.label,
                  }))}
                  value={value}
                  onChange={(v) => handleAnswer(q.id, v)}
                />
              );
              break;

            case "flow_chart":
              questionContent = (
                <FlowChartCard
                  id={q.id}
                  stem={q.stem}
                  nodes={q.flowChartNodes ?? []}
                  value={value}
                  onChange={(v) => handleAnswer(q.id, v)}
                />
              );
              break;

            default:
              questionContent = null;
          }

          const review = reviewMap[q.id];
          const isCorrect = review?.isCorrect;
          const isSkipped = !answers[q.id] || answers[q.id] === "";

          // Clean card style for review mode
          const reviewCardClass = isReviewMode
            ? "bg-white border-[3px] border-[var(--border)] rounded-[1.5rem] mb-4 overflow-hidden transition-all hover:border-[var(--primary)] shadow-[0_4px_0_rgba(0,0,0,0.08)]"
            : "";

          // For non-review mode, keep original simple styling
          const normalClass = !isReviewMode ? "flex items-baseline gap-2 p-2 rounded-lg transition-colors" : "";

          return (
            <div key={q.id}>
              {/* Show group instruction before the first question of each group */}
              {groupInstruction && (
                <div className="mb-4 p-4 bg-[var(--primary-light)] border-[3px] border-[var(--border)] rounded-[1.5rem] shadow-[0_4px_0_rgba(0,0,0,0.08)]">
                  <ReactMarkdown
                    components={instructionComponents}
                    remarkPlugins={[remarkGfm]}
                  >
                    {groupInstruction.replace(/\\n/g, "\n")}
                  </ReactMarkdown>
                </div>
              )}

              {isReviewMode ? (
                /* === REVIEW MODE: Clean Card === */
                <div className={reviewCardClass}>
                  {/* Header: Question Number + Content + Status */}
                  <div className="p-4 flex gap-3">
                    {/* Number Badge */}
                    <span className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                      isCorrect === true
                        ? "bg-[var(--background)] text-[var(--text-body)]"
                        : isCorrect === false
                          ? "bg-red-50 text-red-500"
                          : "bg-[var(--background)] text-[var(--text-muted)]"
                    }`}>
                      {displayIdx + 1}
                    </span>

                    <div className="flex-1 min-w-0">
                      {/* Question Content (Read-only) */}
                      <div className="pointer-events-none">
                        {questionContent}
                      </div>
                    </div>

                    {/* Status Icon */}
                    <span className={`text-xl shrink-0 ${
                      isCorrect === true
                        ? "text-green-600"
                        : isCorrect === false
                          ? "text-red-500"
                          : "text-[var(--text-muted)]"
                    }`}>
                      {isCorrect === true ? "Correct" : isCorrect === false ? "Wrong" : "--"}
                    </span>
                  </div>

                  {/* Footer: Answer Comparison */}
                  <div className="bg-[var(--background)] border-t border-[var(--border-light)] px-4 py-3 grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* User Answer */}
                    <div>
                      <span className="text-[10px] font-bold text-[var(--text-muted)] tracking-wider block mb-1">
                        Your Answer
                      </span>
                      <div className={`text-sm font-medium ${
                        isCorrect === true
                          ? "text-[var(--text-body)]"
                          : isSkipped
                            ? "text-[var(--text-muted)] italic"
                            : "text-red-600 line-through decoration-red-200"
                      }`}>
                        {isSkipped ? "Empty" : answers[q.id] || "--"}
                      </div>
                    </div>

                    {/* Correct Key */}
                    {review?.correctAnswer && (
                      <div>
                        <span className="text-[10px] font-bold text-[var(--text-muted)] tracking-wider block mb-1">
                          Correct Key
                        </span>
                        <div className="text-sm font-bold" style={{ color: 'var(--primary)' }}>
                          {cleanAnswer(review.correctAnswer)}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Explanation (if available) */}
                  {review?.explanation && (
                    <div className="px-4 py-3 bg-[var(--background)] border-t border-[var(--border-light)]">
                      <p className="text-[10px] font-bold text-[var(--text-muted)] tracking-wider mb-1">Explanation</p>
                      <div className="prose prose-sm prose-neutral max-w-none text-[var(--text-body)]">
                        <ReactMarkdown components={instructionComponents}>
                          {review.explanation}
                        </ReactMarkdown>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                /* === NORMAL (TEST) MODE === */
                <div className={normalClass}>
                  <span className="inline-flex items-center justify-center min-w-[1.5rem] h-5 px-1.5 rounded-full bg-[var(--background)] text-[var(--text-body)] text-xs font-semibold">
                    {displayIdx + 1}
                  </span>
                  <BookmarkButton
                    questionId={q.id}
                    attemptId={attemptId}
                    skill={skill}
                    questionContent={q.stem}
                    questionType={q.backendType}
                    className="opacity-50 hover:opacity-100"
                  />
                  <div className="flex-1">
                    {questionContent}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
});

export default QuestionPanel;
