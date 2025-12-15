"use client";

import { useEffect, useMemo, useState } from "react";
import QuestionCard from "./QuestionCard";
import FillInBlankCard from "../reading/FillInBlankCard";
import MatchingLetterCard from "../reading/MatchingLetterCard";
import FlowChartCard from "../reading/FlowChartCard";

type Choice = { value: string; label: string };
type QA = Record<string, string>;

export type BackendQuestionType = string;

export type QuestionUiKind =
  | "choice_single"
  | "completion"
  | "matching_letter"
  | "flow_chart"
  | "matching_paragraph";

export type Question = {
  id: string;
  stem: string;
  backendType: BackendQuestionType;
  uiKind: QuestionUiKind;
  choices?: Array<string | Choice>;
  placeholder?: string;
  order?: string;
  flowChartNodes?: { key: string; label: string }[];
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
    if (onAnswersChange) {
      onAnswersChange(answers);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [answers]);

  const handleAnswer = (id: string, value: string) => {
    setAnswers((prev) => {
      const next = { ...prev, [id]: value };
      onAnswer?.({
        attemptId,
        questionId: id,
        value,
      });

      return next;
    });
  };

  return (
    <div className="flex flex-col h-full min-h-0 rounded-xl shadow bg-white overflow-hidden text-sm">
      <div className="flex-1 min-h-0 overflow-auto bg-white p-4 space-y-2 leading-relaxed mb-12">
        {qList.map((q) => {
          const value = answers[q.id] ?? "";

          switch (q.uiKind) {
            case "choice_single":
              return (
                <QuestionCard
                  key={q.id}
                  question={{
                    id: q.id,
                    stem: q.stem,
                    choices: q.choices ?? [],
                  }}
                  selected={value}
                  onSelect={(_, v) => handleAnswer(q.id, v)}
                />
              );

            case "completion":
              return (
                <FillInBlankCard
                  key={q.id}
                  id={q.id}
                  stem={q.stem}
                  value={value}
                  onChange={(v) => handleAnswer(q.id, v)}
                />
              );
            case "matching_paragraph":
              return (
                <div
                  key={q.id}
                  className="flex items-start gap-3 py-3 border-b last:border-b-0"
                >
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
                    className="w-12 h-10 rounded-lg border border-slate-300 text-center font-semibold
                   focus:outline-none focus:ring-2 focus:ring-[#317EFF]"
                  />
                </div>
              );

            case "matching_letter":
              return (
                <MatchingLetterCard
                  key={q.id}
                  id={q.id}
                  stem={q.stem}
                  value={value}
                  onChange={(v) => handleAnswer(q.id, v)}
                />
              );

            case "flow_chart":
              return (
                <FlowChartCard
                  key={q.id}
                  id={q.id}
                  stem={q.stem}
                  nodes={q.flowChartNodes ?? []}
                  value={value}
                  onChange={(v) => handleAnswer(q.id, v)}
                />
              );
            default:
          }
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
