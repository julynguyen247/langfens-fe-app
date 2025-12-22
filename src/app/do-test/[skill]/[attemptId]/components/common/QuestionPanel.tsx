"use client";

import { useEffect, useMemo, useState } from "react";
import QuestionCard from "./QuestionCard";
import FillInBlankCard from "../reading/FillInBlankCard";
import MatchingLetterCard from "../reading/MatchingLetterCard";
import HeadingDropdown from "../reading/HeadingDropdown";
import FlowChartCard from "../reading/FlowChartCard";
import MultiCheckboxCard from "../reading/MultiCheckboxCard";
import SummaryCompletionCard from "../reading/SummaryCompletionCard";
import MatchingInformation from "../reading/WordListCompletionCard";

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
};

export default function QuestionPanel({
  questions,
  attemptId,
  initialAnswers,
  onAnswer,
  onAnswersChange,
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

  const [answers, setAnswers] = useState<QA>(() => initialAnswers ?? {});

  useEffect(() => {
    if (initialAnswers) setAnswers(initialAnswers);
  }, [initialAnswers]);

  useEffect(() => {
    onAnswersChange?.(answers);
  }, [answers, onAnswersChange]);

  const handleAnswer = (id: string, value: string) => {
    setAnswers((prev) => {
      const next = { ...prev, [id]: value };
      onAnswer?.({ attemptId, questionId: id, value });
      return next;
    });
  };

  return (
    <div className="flex flex-col h-full min-h-0 rounded-xl shadow bg-white overflow-hidden text-sm">
      <div className="flex-1 min-h-0 overflow-auto bg-white p-4 space-y-2 leading-relaxed mb-12">
        {qList.map((q, idx) => {
          const value = answers[q.id] ?? "";
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
              <div className="flex items-baseline gap-2">
                <span className="inline-flex items-center justify-center min-w-[1.5rem] h-5 px-1.5 rounded-full bg-slate-100 text-slate-600 text-xs font-semibold">
                  {idx + 1}
                </span>
                <div className="flex-1">{questionContent}</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

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
