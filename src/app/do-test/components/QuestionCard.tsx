export default function QuestionCard({
  question,
  selected,
  onSelect,
}: {
  question: { id: number; stem: string; choices: string[] };
  selected?: string;
  onSelect: (id: number, value: string) => void;
}) {
  return (
    <div className="p-4 border border-gray-200 rounded-xl bg-white shadow-sm">
      <p className="font-medium mb-3 text-gray-800">
        {question.id}. {question.stem}
      </p>
      <div className="space-y-2">
        {question.choices.map((c) => (
          <label
            key={c}
            className={`block p-3 border rounded-lg cursor-pointer transition-colors duration-150
              ${
                selected === c
                  ? "bg-blue-50 border-blue-400 text-blue-700"
                  : "bg-white hover:bg-blue-50 border-gray-200 text-gray-700"
              }`}
          >
            <input
              type="radio"
              name={`q${question.id}`}
              value={c}
              checked={selected === c}
              onChange={() => onSelect(question.id, c)}
              className="mr-2 accent-blue-500"
            />
            {c}
          </label>
        ))}
      </div>
    </div>
  );
}
