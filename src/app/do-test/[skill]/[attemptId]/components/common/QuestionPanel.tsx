// app/.../QuestionPanel.tsx
"use client";
import { useMemo, useState } from "react";
import QuestionCard from "./QuestionCard";

type QA = Record<number, string>;
type Question = {
  id: number;
  stem: string;
  choices: Array<string | { value: string; label: string }>;
};

export default function QuestionPanel({
  questions,
  attemptId,
}: {
  questions: Question[];
  attemptId: string;
}) {
  const [answers, setAnswers] = useState<QA>({});

  const handleAnswer = (id: number, value: string) =>
    setAnswers((prev) => ({ ...prev, [id]: value }));

  const total = questions.length;
  const current = useMemo(() => {
    if (!questions.length) return 1;
    const firstUnansweredIdx = questions.findIndex(
      (q) => answers[q.id] == null
    );
    return firstUnansweredIdx === -1 ? total : firstUnansweredIdx + 1;
  }, [questions, answers, total]);

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
    <div className="flex flex-col h-full min-h-0 rounded-xl shadow bg-white overflow-hidden text-sm">
      <div className="flex-1 min-h-0 overflow-auto overscroll-contain bg-white p-4 space-y-4 [scrollbar-gutter:stable] leading-relaxed">
        {questions.map((q, idx) => (
          <QuestionCard
            key={q.id}
            question={{ id: q.id, stem: q.stem, choices: q.choices }}
            selected={answers[q.id]}
            onSelect={handleAnswer}
            instruction={idx === 0 ? instructionData : undefined}
          />
        ))}
      </div>
    </div>
  );
}
