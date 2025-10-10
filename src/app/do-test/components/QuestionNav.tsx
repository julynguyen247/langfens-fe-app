export default function QuestionNav({
  total,
  current,
}: {
  total: number;
  current: number;
}) {
  return (
    <div className="flex flex-wrap gap-2 justify-center">
      {Array.from({ length: total }, (_, i) => i + 1).map((n) => (
        <button
          key={n}
          className={`w-8 h-8 rounded transition-colors duration-150 font-medium
            ${
              n === current
                ? "bg-blue-600 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-blue-50 hover:text-blue-600"
            }`}
        >
          {n}
        </button>
      ))}
    </div>
  );
}
