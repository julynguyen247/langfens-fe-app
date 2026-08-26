"use client";

import React, { memo, useEffect, useMemo, useState, useCallback, useRef } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import BookmarkButton from "@/components/BookmarkButton";
import { AttemptQuestionGroup } from "@/app/store/useAttemptStore";
import { QuestionComponentRegistry, RawQuestion } from "../QuestionComponentRegistry";
import { QuestionFeedbackPanel } from "../QuestionFeedbackPanel";
import type { RagFeedbackEnvelope } from "@/types/rag";
import type { QuestionTypeSlug } from "@langfens/question-schema";

type Choice = { value: string; label: string };
type QA = Record<string, string>;

/**
 * Question types whose renderer takes `values` + `onBlankChange` (one input
 * per `___` blank in the prompt), as opposed to a single `selected`/`value`
 * input. Phase 1 made SummaryCompletionCard the dispatch target for every
 * blank-bearing type when `values` is supplied; the rest of the completion
 * family still falls through to FillInBlankCard via the registry.
 */
const COMPLETION_SLUGS: Record<QuestionTypeSlug, boolean> = {
  FORM_COMPLETION: true,
  NOTE_COMPLETION: true,
  SENTENCE_COMPLETION: true,
  SUMMARY_COMPLETION: true,
  TABLE_COMPLETION: true,
  SHORT_ANSWER: true,
  AUDIO_RESPONSE: true,
  DIAGRAM_LABEL: true,
  MAP_LABEL: true,
  FLOW_CHART_COMPLETION: true,
  TRUE_FALSE_NOT_GIVEN: false,
  YES_NO_NOT_GIVEN: false,
  MULTIPLE_CHOICE_SINGLE: false,
  MULTIPLE_CHOICE_SINGLE_IMAGE: false,
  MULTIPLE_CHOICE_MULTIPLE: false,
  MATCHING_HEADING: false,
  MATCHING_INFORMATION: false,
  MATCHING_FEATURES: false,
  MATCHING_ENDINGS: false,
  CLASSIFICATION: false,
  FLOW_CHART: false,
};

/**
 * Slugs whose renderer expects a single radio-style selection driven by
 * `selected` + `onSelect`. Every other non-completion slug falls through
 * to the `value` + `onChange` API.
 */
const CHOICE_SLUGS: Record<QuestionTypeSlug, boolean> = {
  TRUE_FALSE_NOT_GIVEN: true,
  YES_NO_NOT_GIVEN: true,
  MULTIPLE_CHOICE_SINGLE: true,
  MULTIPLE_CHOICE_SINGLE_IMAGE: true,
  CLASSIFICATION: true,
  MULTIPLE_CHOICE_MULTIPLE: false,
  MATCHING_HEADING: false,
  MATCHING_INFORMATION: false,
  MATCHING_FEATURES: false,
  MATCHING_ENDINGS: false,
  FORM_COMPLETION: false,
  NOTE_COMPLETION: false,
  SENTENCE_COMPLETION: false,
  SUMMARY_COMPLETION: false,
  TABLE_COMPLETION: false,
  SHORT_ANSWER: false,
  AUDIO_RESPONSE: false,
  DIAGRAM_LABEL: false,
  MAP_LABEL: false,
  FLOW_CHART: false,
  FLOW_CHART_COMPLETION: false,
};

/**
 * MATCHING_INFORMATION has two real render variants — same BE slug:
 *   - "Word List" blanks (BE injects `**Word List:**` + `___` runs and
 *     ships a structured `wordList`); rendered by WordListCompletionCard.
 *   - Paragraph-match A-F inputs (no word list, just a stem with blanks);
 *     rendered inline by QuestionPanel as an A-F single-letter input.
 *
 * The prompt tells us apart — replicate mapApiQuestionToUi's heuristic
 * inline so the panel can dispatch without round-tripping through the
 * upstream mapper.
 */
function isWordListBlank(promptMd: string | undefined): boolean {
  const s = promptMd ?? "";
  return s.includes("**Word List:**") && s.includes("___");
}

export type Question = {
  id: string;
  stem: string;
  backendType: QuestionTypeSlug;
  forices?: Array<string | Choice>;
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
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt={alt} {...props} />
  ),
};

function normalizeChoices(
  forices: Array<string | Choice> | undefined
): Choice[] {
  if (!forices) return [];
  return forices.map((c) => (typeof c === "string" ? { value: c, label: c } : c));
}

function unpackBlanks(value: string): string[] {
  if (!value) return [];
  return value.split(" ").map((v) => v.trim());
}

function packBlanks(values: string[]): string {
  return values
    .map((v) => v.trim())
    .filter((v) => v.length > 0)
    .join(" ");
}

// Clean raw answer strings like "feature-q1: D / D" -> "D"
function cleanAnswer(s: string | undefined): string {
  if (!s) return "";
  const m = s.match(/^[A-Za-z]/);
  return m ? s.trim() : s.trim();
}

export type ReviewResult = {
  questionId: string;
  isCorrect: boolean | null;
  correctAnswer?: string;
  explanation?: string;
  ragFeedback?: RagFeedbackEnvelope;
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
  skill: string;
  initialAnswers?: QA;
  onAnswer?: (a: { attemptId: string; questionId: string; value: string }) => void;
  onAnswersChange?: (a: QA) => void;
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

          // Build a RawQuestion-compatible object from the transformed Question
          const rawQ: RawQuestion = {
            id: q.id,
            idx: q.idx,
            type: q.backendType,
            promptMd: q.stem,
            explanationMd: q.explanationMd,
            // For matching heading, the renderer stores the label-only contentMd
            // in forices (e.g. "viii. The Spread of Coffee") and the heading
            // prefix is added by the dropdown itself. Adding a second letter
            // prefix here would produce "H. viii. The Spread of Coffee" — the
            // exact double-prefix the question-data standard forbids.
            options: q.forices
              ? (q.forices as Choice[]).map((c, i) => {
                  if (q.backendType === "MATCHING_HEADING") {
                    return {
                      id: typeof c === "string" ? String(i + 1) : c.value,
                      idx: i,
                      contentMd: typeof c === "string" ? c : c.label,
                    };
                  }
                  return {
                    id: typeof c === "string" ? String(i + 1) : c.value,
                    idx: i,
                    contentMd: typeof c === "string"
                      ? c
                      : `${String.fromCharCode(65 + i)}. ${c.label}`,
                  };
                })
              : undefined,
            flowChartNodes: q.flowChartNodes,
          };

          // Dynamic dispatch via registry — replaces the giant switch statement
          const TargetComponent = QuestionComponentRegistry[q.backendType];

          // MATCHING_INFORMATION-paragraph (A-F single-letter input) is the
          // one inline rendering path; the wordlist variant dispatches to
          // WordListCompletionCard via the registry. The discriminant is the
          // prompt, not the slug.
          if (q.backendType === "MATCHING_INFORMATION" && !isWordListBlank(q.stem)) {
            questionContent = (
              <div className="flex items-start gap-3 py-3 border-b last:border-b-0">
                <span className="w-6 text-sm font-semibold text-[var(--text-body)]">
                  {q.order ?? ""}.
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
          } else if (TargetComponent) {
            if (CHOICE_SLUGS[q.backendType]) {
              // Single-forice: use selected + onSelect API
              const normalizedChoices = normalizeChoices(q.forices);
              questionContent = (
                <TargetComponent
                  question={rawQ}
                  selected={value}
                  onSelect={(_, v) => handleAnswer(q.id, v)}
                />
              );
            } else if (COMPLETION_SLUGS[q.backendType]) {
              // Completion types: unpack blanks for SummaryCompletionCard
              const arr = unpackBlanks(value);
              questionContent = (
                <TargetComponent
                  question={rawQ}
                  values={arr}
                  onBlankChange={(blankIndex: number, v: string) => {
                    const next = [...arr];
                    next[blankIndex] = v;
                    handleAnswer(q.id, packBlanks(next));
                  }}
                />
              );
            } else {
              // All other types: use value + onChange API
              questionContent = (
                <TargetComponent
                  question={rawQ}
                  value={value}
                  onChange={(v: string) => handleAnswer(q.id, v)}
                />
              );
            }
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
                  <ReactMarkdown components={instructionComponents}>
                    {groupInstruction}
                  </ReactMarkdown>
                </div>
              )}
              {isReviewMode ? (
                <div className={reviewCardClass}>
                  <div className="flex items-baseline gap-2 p-3">
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
                    <div className="flex-1">{questionContent}</div>
                  </div>
                  <div className="bg-[var(--background)] border-t border-[var(--border-light)] px-4 py-3 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <span className="text-[10px] font-bold text-[var(--text-muted)] tracking-wider block mb-1">
                        Your answer
                      </span>
                      <div className={`text-sm font-medium ${
                        isCorrect === true
                          ? "text-[var(--text-body)]"
                          : isSkipped
                            ? "text-[var(--text-muted)] italic"
                            : "text-red-600 line-through decoration-red-200"
                      }`}>
                        {isSkipped
                          ? "Empty"
                          : (() => {
                              // For MATCHING_HEADING, the user's dropdown value
                              // is the roman ("viii") but the correct key is
                              // shown as the full option content
                              // ("viii. The Spread of Coffee"). Resolve to the
                              // same full content so the two columns match.
                              if (q.backendType === "MATCHING_HEADING") {
                                const userVal = answers[q.id] ?? "";
                                const matched = (rawQ.options ?? []).find(
                                  (o) =>
                                    o.contentMd
                                      .split(".")[0]
                                      .trim()
                                      .toLowerCase() === userVal.trim().toLowerCase()
                                );
                                return matched?.contentMd || userVal || "--";
                              }
                              return answers[q.id] || "--";
                            })()}
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
                      <div
                        className="prose prose-sm prose-neutral max-w-none text-[var(--text-body)]"
                        style={{ fontFamily: "var(--font-heading)" }}
                      >
                        <ReactMarkdown components={instructionComponents}>
                          {review.explanation}
                        </ReactMarkdown>
                      </div>
                    </div>
                  )}

                  {/* RAG feedback (if available) */}
                  {review?.ragFeedback && (
                    <div className="px-4 py-3 border-t border-[var(--border-light)]">
                      <QuestionFeedbackPanel envelope={review.ragFeedback} />
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