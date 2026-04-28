"use client";

import Link from "next/link";
import { useState } from "react";
import { subscribeDeck } from "@/utils/api";
import { useUserStore } from "@/app/store/userStore";

export type PublicDeck = {
  id: string;
  title: string;
  description?: string;
  category?: string;
  status?: string;
  creator?: string;
  cardCount?: number;
};

export default function DeckCard({ deck }: { deck: PublicDeck }) {
  const { user } = useUserStore();
  const [subLoading, setSubLoading] = useState(false);
  const [subscribed, setSubscribed] = useState(false);

  const onSubscribe = async () => {
    if (!user?.id || !deck?.id) return;
    if (subscribed || subLoading) return;
    setSubLoading(true);
    try {
      await subscribeDeck(user.id, deck.id);
      setSubscribed(true);
    } finally {
      setSubLoading(false);
    }
  };

  return (
    <div className="group bg-white border-[3px] border-[var(--border)] rounded-[2rem] shadow-[0_4px_0_rgba(0,0,0,0.08)] hover:-translate-y-[3px] hover:border-[var(--primary)] hover:shadow-[0_6px_0_rgba(0,0,0,0.08)] transition-all duration-200 p-6 flex flex-col">
      <h2
        className="text-lg font-bold text-[var(--foreground)] line-clamp-1 group-hover:text-[var(--primary)] transition-colors"
        style={{ fontFamily: "var(--font-sans)" }}
      >
        {deck.title}
      </h2>

      {deck.creator && (
        <p className="mt-1 text-xs font-bold text-[var(--text-muted)]">
          by {deck.creator}
        </p>
      )}

      <p className="mt-2 text-sm text-[var(--text-muted)] line-clamp-2">
        {deck.description || "No description."}
      </p>

      <div className="mt-3 flex items-center gap-2 text-xs">
        <span className="rounded-full bg-[var(--primary-light)] text-[var(--primary)] px-3 py-1 border-[2px] border-[var(--primary)]/20 font-bold">
          {deck.category || "other"}
        </span>
        {deck.cardCount !== undefined && (
          <span
            className="rounded-full bg-[var(--background)] text-[var(--text-body)] px-3 py-1 border-[2px] border-[var(--border)] font-bold"
            style={{ fontFamily: "var(--font-mono)" }}
          >
            {deck.cardCount} words
          </span>
        )}
      </div>

      <div className="mt-auto pt-5 grid grid-cols-2 gap-2">
        <Link
          href={`/flashcards/${deck.id}`}
          className="flex items-center justify-center h-10 rounded-full bg-[var(--primary)] text-white text-sm font-bold border-b-[4px] border-[var(--primary-dark)] hover:-translate-y-0.5 hover:border-b-[5px] active:translate-y-[2px] active:border-b-[2px] transition-all"
        >
          Study Now
        </Link>

        <button
          onClick={onSubscribe}
          disabled={subscribed}
          className={`h-10 rounded-full text-sm font-bold transition-all ${
            subscribed
              ? "bg-[var(--primary)] text-white border-b-[4px] border-[var(--primary-dark)]"
              : "bg-white text-[var(--primary)] border-[3px] border-[var(--border)] border-b-[5px] hover:border-[var(--primary)] hover:-translate-y-0.5 active:translate-y-[2px] active:border-b-[3px]"
          } disabled:opacity-60 disabled:cursor-not-allowed`}
        >
          {subscribed
            ? "Subscribed"
            : subLoading
            ? "Subscribing..."
            : "Clone"}
        </button>
      </div>
    </div>
  );
}
