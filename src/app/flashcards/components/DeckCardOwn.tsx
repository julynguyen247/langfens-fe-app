// app/flashcards/components/DeckCard.tsx
"use client";

import Link from "next/link";
import { Calendar, Folder, FileText } from "lucide-react";
import { useState } from "react";
import DeckCardsModal from "./DeckCardsModal";

type Deck = {
  id: string;
  userId: string;
  title: string;
  slug: string;
  descriptionMd?: string;
  status: string;
  category?: string;
  createdAt?: string;
  updatedAt?: string;
};

export default function DeckCardOwn({ deck }: { deck: Deck }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <div className="rounded-2xl border border-blue-100 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md hover:border-blue-200">
        <div>
          <h4 className="line-clamp-2 text-[15px] font-semibold leading-5 text-[#3B82F6]">
            {deck.title}
          </h4>
          {deck.category && (
            <div className="mt-2 flex items-center gap-1 text-[13px] text-[#3B82F6]">
              <Folder className="h-3.5 w-3.5" />
              <span>{deck.category}</span>
            </div>
          )}
          {deck.descriptionMd && (
            <p className="mt-2 line-clamp-2 text-sm text-slate-600">
              {deck.descriptionMd}
            </p>
          )}
        </div>

        <div className="mt-4 flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center gap-1">
            <FileText className="h-3.5 w-3.5" />
            <span>{deck.status}</span>
          </div>
          {deck.createdAt && (
            <div className="flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5" />
              <span>
                {new Date(deck.createdAt).toLocaleDateString("vi-VN")}
              </span>
            </div>
          )}
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2">
          <Link
            href={`/flashcards/${deck.id}`}
            className="inline-block w-full rounded-xl bg-blue-600 px-4 py-2 text-center text-sm font-medium text-white hover:brightness-110"
          >
            Học ngay
          </Link>
          <button
            onClick={() => setOpen(true)}
            className="w-full rounded-xl border border-blue-200 bg-white px-4 py-2 text-center text-sm font-medium text-blue-700 hover:bg-blue-50"
          >
            Xem thẻ
          </button>
        </div>
      </div>

      <DeckCardsModal
        deckId={deck.id}
        open={open}
        onClose={() => setOpen(false)}
      />
    </>
  );
}
