// app/.../QuestionPanel.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import QuestionCard from "./QuestionCard";

type Choice = { value: string; label: string };
type QA = Record<string, string>;

export type Question = {
  id: string;
  stem: string;
  choices: Array<string | Choice>;
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
        choices: normalizeChoices(q.choices),
      })),
    [questions]
  );

  const [answers, setAnswers] = useState<QA>(() => initialAnswers ?? {});

  useEffect(() => {
    if (initialAnswers) setAnswers(initialAnswers);
  }, [initialAnswers]);

  const handleAnswer = (id: string, value: string) => {
    setAnswers((prev) => {
      const next = { ...prev, [id]: value };
      onAnswersChange?.(next);
      onAnswer?.({ attemptId, questionId: id, value });
      return next;
    });
  };

  const total = qList.length;
  const current = useMemo(() => {
    if (!qList.length) return 1;
    const firstUnansweredIdx = qList.findIndex((q) => answers[q.id] == null);
    return firstUnansweredIdx === -1 ? total : firstUnansweredIdx + 1;
  }, [qList, answers, total]);

  const instructionData = {
    title:
      "Questions — Do the following statements agree with the information given in this Passage?",
    note: "In the following statements below, choose:",
    items: [
      { label: "TRUE", text: "if the statement agrees with the information" },
      { label: "FALSE", text: "if the statement contradicts the information" },
      {
        label: "NOT GIVEN",
        text: "if it is impossible to say what the writer thinks about this",
      },
    ],
  };

  return (
    <div className="flex flex-col h-full min-h-0 rounded-xl shadow bg-white overflow-hidden text-sm ">
      <div className="flex-1 min-h-0 overflow-auto overscroll-contain bg-white p-4 space-y-2 [scrollbar-gutter:stable] leading-relaxed mb-12">
        {qList.map((q, idx) => (
          <QuestionCard
            key={q.id}
            question={{ id: q.id, stem: q.stem, choices: q.choices }}
            selected={answers[q.id]}
            onSelect={(_id: number | string, value: string) =>
              handleAnswer(String(q.id), value)
            }
            instruction={idx === 0 ? instructionData : undefined}
          />
        ))}
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
