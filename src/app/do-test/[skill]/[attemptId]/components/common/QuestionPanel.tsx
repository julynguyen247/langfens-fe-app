"use client";
import { useMemo, useState } from "react";
import QuestionCard from "./QuestionCard";
import QuestionNav from "./QuestionNav";
import InstructionBox from "./InstructionBox";

type QA = Record<number, string>;

export default function QuestionPanel({
  questions,
  attemptId,
}: {
  questions: Array<{ id: number; [k: string]: any }>;
  attemptId: string;
}) {
  const [answers, setAnswers] = useState<QA>({});

  const handleAnswer = (id: number, value: string) =>
    setAnswers((prev) => ({ ...prev, [id]: value }));

  // tổng số câu
  const total = questions.length;

  // xác định "current" = index (1-based) của câu CHƯA trả lời đầu tiên, nếu tất cả đã trả lời thì = tổng số câu
  const current = useMemo(() => {
    if (!questions.length) return 1;
    const firstUnansweredIdx = questions.findIndex(
      (q) => answers[q.id] == null
    );
    return firstUnansweredIdx === -1 ? total : firstUnansweredIdx + 1;
  }, [questions, answers, total]);

  return (
    <div className="flex flex-col bg-white rounded-xl shadow h-full overflow-hidden">
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <InstructionBox
          title="Question 1 – 6  Do the following statements agree with the information given in this Passage?"
          note="In the following statements below, choose"
          items={[
            {
              label: "TRUE",
              text: "if the statement agrees with the information",
            },
            {
              label: "FALSE",
              text: "if the statement contradicts the information",
            },
            {
              label: "NOT GIVEN",
              text: "if it is impossible to say what the writer thinks about this",
            },
          ]}
        />

        {questions.map((q) => (
          <QuestionCard
            question={{
              id: 1,
              stem: "Choose the correct answer:",
              choices: [
                { value: "A", label: "Option A" },
                { value: "B", label: "Option B" },
                "Option C",
                "Option D",
              ],
            }}
            selected={answers[1]}
            onSelect={(id, v) => setAnswers((s) => ({ ...s, [id]: v }))}
          />
        ))}
      </div>
    </div>
  );
}
