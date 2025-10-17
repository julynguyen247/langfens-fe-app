import { useEffect, useState } from "react";

type Card = { id: string; front: string; back: string; example?: string };

export default function Flashcard({
  card,
  flipped,
  onFlip,
}: {
  card: Card;
  flipped: boolean;
  onFlip: () => void;
}) {
  const [anim, setAnim] = useState(false);
  useEffect(() => {
    setAnim(true);
    const t = setTimeout(() => setAnim(false), 200);
    return () => clearTimeout(t);
  }, [card.id]);

  return (
    <div className="relative mx-auto h-[360px] max-w-2xl perspective">
      <div
        className={`relative h-full w-full rounded-2xl border bg-white shadow-sm transition-transform duration-300 [transform-style:preserve-3d] ${
          flipped ? "[transform:rotateY(180deg)]" : ""
        } ${anim ? "ring-2 ring-indigo-200" : ""}`}
      >
        {/* Front */}
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-8 [backface-visibility:hidden]">
          <span className="text-sm uppercase tracking-wide text-indigo-600">
            Thuật ngữ
          </span>
          <div className="text-3xl font-semibold text-indigo-950 text-center">
            {card.front}
          </div>
          <button
            onClick={onFlip}
            className="mt-6 rounded-lg border border-indigo-200 px-3 py-1.5 text-sm text-indigo-700 hover:bg-indigo-50"
          >
            Lật thẻ
          </button>
        </div>
        {/* Back */}
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 p-8 [backface-visibility:hidden] [transform:rotateY(180deg)]">
          <span className="text-sm uppercase tracking-wide text-emerald-600">
            Định nghĩa
          </span>
          <div className="text-2xl font-semibold text-indigo-950 text-center">
            {card.back}
          </div>
          {card.example && (
            <p className="mt-2 text-center text-sm text-indigo-700">
              Ví dụ: {card.example}
            </p>
          )}
          <button
            onClick={onFlip}
            className="mt-6 rounded-lg border border-indigo-200 px-3 py-1.5 text-sm text-indigo-700 hover:bg-indigo-50"
          >
            Lật lại
          </button>
        </div>
      </div>
    </div>
  );
}
