export default function PassageView({
  passage,
}: {
  passage: { title: string; content: string };
}) {
  return (
    <div className="flex flex-col h-full min-h-0 bg-white overflow-hidden">
      <div className="px-6 py-3 border-b">
        <h2 className="text-2xl font-semibold text-gray-800">
          {passage.title}
        </h2>
      </div>

      <div className="flex-1 min-h-0 overflow-auto overscroll-contain p-6 bg-white [scrollbar-gutter:stable]">
        <p className="text-gray-700 leading-relaxed whitespace-pre-line">
          {passage.content}
        </p>
      </div>
    </div>
  );
}
