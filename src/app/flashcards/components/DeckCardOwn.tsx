// app/flashcards/components/DeckCard.tsx
"use client";

import Link from "next/link";
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
      <div className="flex h-full flex-col rounded-[2rem] border-[3px] border-[var(--border)] bg-white p-4 shadow-[0_4px_0_rgba(0,0,0,0.08)] transition-all duration-200 hover:-translate-y-[3px] hover:shadow-[0_6px_0_rgba(0,0,0,0.08)] hover:border-[var(--primary)]">
        <div>
          <h4
            className="line-clamp-2 text-[15px] font-bold leading-5 text-[var(--foreground)] group-hover:text-[var(--primary)] transition-colors"
            style={{ fontFamily: "var(--font-sans)" }}
          >
            {deck.title}
          </h4>
          {deck.category && (
            <div className="mt-2">
              <span className="inline-flex items-center text-xs px-3 py-1 bg-[var(--primary-light)] text-[var(--primary)] rounded-full border-[2px] border-[var(--primary)]/20 font-bold">
                {deck.category}
              </span>
            </div>
          )}
          {deck.descriptionMd && (
            <p className="mt-2 line-clamp-2 text-sm text-[var(--text-muted)]">
              {deck.descriptionMd}
            </p>
          )}
        </div>

        <div className="mt-auto">
          <div className="mt-4 flex items-center justify-between text-xs text-[var(--text-muted)]">
            <div className="flex items-center gap-1">
              <span className="font-bold">{deck.status}</span>
            </div>
            {deck.createdAt && (
              <div className="flex items-center gap-1">
                <span>
                  {new Date(deck.createdAt).toLocaleDateString("vi-VN")}
                </span>
              </div>
            )}
          </div>

          <div className="mt-4 grid grid-cols-2 gap-2">
            <Link
              href={`/flashcards/${deck.id}`}
              className="inline-flex items-center justify-center w-full rounded-full border-b-[4px] border-[var(--primary-dark)] bg-[var(--primary)] px-4 py-2 text-center text-sm font-bold text-white hover:-translate-y-0.5 hover:border-b-[5px] active:translate-y-[2px] active:border-b-[2px] transition-all"
            >
              Học ngay
            </Link>
            <button
              onClick={() => setOpen(true)}
              className="w-full rounded-full border-[3px] border-[var(--border)] border-b-[5px] bg-white px-4 py-2 text-sm font-bold text-[var(--foreground)] hover:border-[var(--primary)] hover:text-[var(--primary)] hover:-translate-y-0.5 active:translate-y-[2px] active:border-b-[3px] transition-all"
            >
              Xem thẻ
            </button>
          </div>
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
