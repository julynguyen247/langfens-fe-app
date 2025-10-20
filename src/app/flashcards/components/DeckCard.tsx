import Link from "next/link";
import { Layers, Users } from "lucide-react";
import { useMemo } from "react";

type Deck = {
  id: string;
  title: string;
  cards: number;
  learners: number;
  hasImage?: boolean;
  author: { name: string };
};

export default function DeckCard({ deck }: { deck: Deck }) {
  const initials = useMemo(
    () => deck.author.name.slice(0, 2).toUpperCase(),
    [deck.author.name]
  );

  return (
    <Link
      href={`/flashcards/${deck.id}`}
      className="group flex flex-col rounded-2xl border border-indigo-100 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md hover:border-indigo-200"
    >
      <div className="flex min-h-14 flex-col justify-between gap-1">
        <h4 className="line-clamp-2 text-[15px] font-semibold leading-5 text-[#3B82F6]">
          {deck.title}
        </h4>
        <div className="mt-2 flex items-center gap-3 text-[13px] text-[#3B82F6]">
          <div className="inline-flex items-center gap-1">
            <Layers className="h-3.5 w-3.5" />
            <span>{deck.cards} từ</span>
          </div>
          <div className="inline-flex items-center gap-1">
            <Users className="h-3.5 w-3.5" />
            <span>{deck.learners.toLocaleString()}</span>
          </div>
          {deck.hasImage && (
            <span className="rounded-full border border-indigo-300 bg-indigo-50 px-2 py-0.5 text-xs text-[#3B82F6]">
              có ảnh
            </span>
          )}
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-full border border-indigo-200 bg-indigo-50 text-xs font-semibold text-[#3B82F6]">
            {initials}
          </div>
          <span className="text-xs text-[#3B82F6]">{deck.author.name}</span>
        </div>
        <div className="rounded-lg border border-indigo-200 px-2 py-1 text-xs text-[#3B82F6] opacity-0 transition group-hover:opacity-100">
          Xem bộ thẻ
        </div>
      </div>
    </Link>
  );
}
