"use client";
import { useState } from "react";
import QuestionCard from "./QuestionCard";
import QuestionNav from "./QuestionNav";
import InstructionBox from "./InstructionBox";

export default function QuestionPanel({ questions }: { questions: any[] }) {
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const handleAnswer = (id: number, value: string) =>
    setAnswers((prev) => ({ ...prev, [id]: value }));

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

        {questions.map((q: any) => (
          <QuestionCard
            key={q.id}
            question={q}
            selected={answers[q.id]}
            onSelect={handleAnswer}
          />
        ))}
      </div>

      <div className="border-t p-4">
        <QuestionNav total={13} current={1} />
      </div>
    </div>
  );
}
