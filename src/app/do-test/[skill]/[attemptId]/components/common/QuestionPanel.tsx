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
  | "flow_chart";

export type Question = {
  id: string;
  stem: string;
  backendType: BackendQuestionType;
  uiKind: QuestionUiKind;
  choices?: Array<string | Choice>;
  placeholder?: string;
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
            default:
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
