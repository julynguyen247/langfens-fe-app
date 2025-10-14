export default function PassageView({
  passage,
}: {
  passage: { title: string; content: string };
}) {
  return (
    <div className="bg-white rounded-xl p-6 shadow overflow-y-auto">
      <h2 className="text-2xl font-semibold mb-4">{passage.title}</h2>
      <p className="text-gray-700 leading-relaxed whitespace-pre-line">
        {passage.content}
      </p>
    </div>
  );
}
