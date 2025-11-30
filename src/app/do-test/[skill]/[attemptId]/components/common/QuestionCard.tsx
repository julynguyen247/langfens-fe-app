"use client";

import ReactMarkdown from "react-markdown";
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
}: {
  question: { id: string; stem: string; choices: Choice[] };
  selected?: string;
  onSelect: (id: string, value: string) => void;
}) {
  return (
    <div className="rounded-lg p-4 bg-white text-black">
      <div className="font-bold mb-3">
        <ReactMarkdown
          components={{
            p: ({ node, ...props }) => (
              <p className="whitespace-pre-wrap" {...props} />
            ),
          }}
        >
          {question.stem}
        </ReactMarkdown>
      </div>

      <div className="space-y-2">
        {question.choices.map((c) => {
          const value = typeof c === "string" ? c : c.value;
          const label = typeof c === "string" ? c : c.label;
          const active = selected === value;

          return (
            <button
              key={value}
              onClick={() => onSelect(question.id, value)}
              className={`w-full text-left px-3 py-2 rounded border transition ${
                active
                  ? "border-blue-600 bg-blue-50"
                  : "border-gray-200 hover:bg-gray-50"
              }`}
            >
              <ReactMarkdown
                components={{
                  p: ({ node, ...props }) => (
                    <p className="whitespace-pre-wrap" {...props} />
                  ),
                }}
              >
                {label}
              </ReactMarkdown>
            </button>
          );
        })}
      </div>
    </div>
  );
}
