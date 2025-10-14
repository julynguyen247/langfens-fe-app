import React from "react";

type Choice = string | { value: string; label: string };

export default function QuestionCard({
  question,
  selected,
  onSelect,
  disabled = false,
  groupName,
  renderStemAsHTML = false,
}: {
  question: { id: number; stem: string; choices: Choice[] };
  selected?: string;
  onSelect: (id: number, value: string) => void;
  disabled?: boolean;
  groupName?: string; // nếu không truyền sẽ dùng q{question.id}
  renderStemAsHTML?: boolean; // true nếu stem có HTML (bold, italic, ... )
}) {
  const name = groupName ?? `q${question.id}`;

  const toValue = (c: Choice) => (typeof c === "string" ? c : c.value);
  const toLabel = (c: Choice) => (typeof c === "string" ? c : c.label);

  const letter = (i: number) => String.fromCharCode(65 + i); // A, B, C...

  return (
    <div className="p-4 border border-gray-200 rounded-xl bg-white shadow-sm">
      <p className="font-medium mb-3 text-gray-800">
        {question.id}.{" "}
        {renderStemAsHTML ? (
          <span dangerouslySetInnerHTML={{ __html: question.stem }} />
        ) : (
          question.stem
        )}
      </p>

      <div
        role="radiogroup"
        aria-labelledby={`label-${name}`}
        className="space-y-2"
      >
        {question.choices.map((c, idx) => {
          const value = toValue(c);
          const label = toLabel(c);
          const id = `${name}-${idx}`;

          const checked = selected === value;

          return (
            <label
              key={id}
              htmlFor={id}
              className={`flex items-start gap-3 p-3 border rounded-lg cursor-pointer transition-colors duration-150
                ${
                  checked
                    ? "bg-blue-50 border-blue-400 text-blue-700"
                    : "bg-white hover:bg-blue-50 border-gray-200 text-gray-700"
                }
                ${disabled ? "opacity-60 cursor-not-allowed" : ""}
              `}
              aria-checked={checked}
            >
              {/* Input visually hidden but accessible */}
              <input
                id={id}
                type="radio"
                name={name}
                value={value}
                checked={checked}
                onChange={() => onSelect(question.id, value)}
                disabled={disabled}
                className="sr-only"
              />

              {/* Custom radio bullet */}
              <span
                className={`mt-1 inline-block w-4 h-4 rounded-full ring-1 ring-inset
                ${
                  checked
                    ? "bg-blue-600 ring-blue-600"
                    : "bg-white ring-gray-300"
                }
              `}
                aria-hidden="true"
              />

              {/* Choice text */}
              <div className="flex-1">
                <div className="font-medium">
                  {letter(idx)}. <span className="font-normal">{label}</span>
                </div>
              </div>
            </label>
          );
        })}
      </div>
    </div>
  );
}
