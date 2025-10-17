// app/.../QuestionCard.tsx
"use client";
import InstructionBox from "./InstructionBox";

type Choice =
  | string
  | {
      value: string;
      label: string;
    };

export default function QuestionCard({
  question,
  selected,
  onSelect,
  instruction, // ⬅️ mới
}: {
  question: { id: number; stem: string; choices: Choice[] };
  selected?: string;
  onSelect: (id: number, value: string) => void;
  instruction?: {
    title: string;
    note?: string;
    items: { label: string; text: string }[];
  };
}) {
  return (
    <div className="rounded-lg border p-4 bg-white text-black">
      {instruction && (
        <div className="mb-3">
          <InstructionBox
            title={instruction.title}
            note={instruction.note}
            items={instruction.items}
            sticky={false} // ⬅️ quan trọng: KHÔNG sticky
            className="text-sm" // chữ nhỏ gọn
          />
        </div>
      )}

      {/* Stem */}
      <div className="font-medium mb-3">{question.stem}</div>

      {/* Choices */}
      <div className="space-y-2">
        {question.choices.map((c) => {
          const value = typeof c === "string" ? c : c.value;
          const label = typeof c === "string" ? c : c.label;
          const active = selected === value;

          return (
            <button
              key={value}
              onClick={() => onSelect(question.id, value)}
              className={`w-full text-left px-3 py-2 rounded border transition 
                ${
                  active
                    ? "border-blue-600 bg-blue-50"
                    : "border-gray-200 hover:bg-gray-50"
                }`}
            >
              {label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
