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
    <p className="whitespace-pre-wrap leading-relaxed text-sm text-slate-800" {...props} />
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
    <h2 className="text-lg font-bold text-gray-800 mt-4 mb-2" {...props} />
  ),
  h3: ({ node, ...props }: any) => (
    <h3 className="text-base font-semibold text-gray-700 mt-3 mb-2" {...props} />
  ),
  strong: ({ node, ...props }: any) => (
    <strong className="font-semibold text-gray-900" {...props} />
  ),
  ul: ({ node, ...props }: any) => (
    <ul className="list-disc pl-5 my-2 space-y-1" {...props} />
  ),
  li: ({ node, ...props }: any) => (
    <li className="text-sm text-slate-800" {...props} />
  ),
  // Add table components
  table: ({ node, ...props }: any) => (
    <div className="overflow-x-auto my-4 border border-slate-200 rounded-lg">
      <table className="min-w-full divide-y divide-slate-200 text-sm" {...props} />
    </div>
  ),
  thead: ({ node, ...props }: any) => (
    <thead className="bg-slate-50" {...props} />
  ),
  tbody: ({ node, ...props }: any) => (
    <tbody className="divide-y divide-slate-200 bg-white" {...props} />
  ),
  tr: ({ node, ...props }: any) => (
    <tr className="hover:bg-slate-50" {...props} />
  ),
  th: ({ node, ...props }: any) => (
    <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider font-bold border-b border-slate-200" {...props} />
  ),
  td: ({ node, ...props }: any) => (
    <td className="px-4 py-3 whitespace-pre-wrap text-slate-700 border-b border-slate-100" {...props} />
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

const QuestionPanel = memo(function QuestionPanel({
  questions,
  attemptId,
  initialAnswers,
  onAnswer,
  onAnswersChange,
  questionGroups,
}: {
  questions: Question[];
  attemptId: string;
  initialAnswers?: QA;
  onAnswer?: (payload: {
    attemptId: string;
    questionId: string;
    value: string;
  }) => void;
  onAnswersChange?: (answers: QA) => void;
  questionGroups?: AttemptQuestionGroup[];
}) {
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
    <div className="flex flex-col h-full min-h-0 rounded-xl shadow bg-white overflow-hidden text-sm">
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
                  <span className="w-6 text-sm font-semibold text-slate-700">
                    {q.order}.
                  </span>
                  <p className="flex-1 text-sm text-slate-800 leading-relaxed">
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
                    className="w-12 h-10 rounded-lg border border-slate-300 text-center font-semibold text-black
                   focus:outline-none focus:ring-2 focus:ring-[#317EFF]"
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

          return (
            <div key={q.id}>
              {/* Show group instruction before the first question of each group */}
              {groupInstruction && (
                <div className="mb-4 p-4 bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-lg shadow-sm">
                  <ReactMarkdown 
                    components={instructionComponents} 
                    remarkPlugins={[remarkGfm]}
                  >
                    {groupInstruction.replace(/\\n/g, "\n")}
                  </ReactMarkdown>
                </div>
              )}
              <div className="flex items-baseline gap-2">
                <span className="inline-flex items-center justify-center min-w-[1.5rem] h-5 px-1.5 rounded-full bg-slate-100 text-slate-600 text-xs font-semibold">
                  {displayIdx + 1}
                </span>
                <div className="flex-1">{questionContent}</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
});

export default QuestionPanel;

