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
    <div className="rounded-2xl  bg-white p-5 shadow-sm hover:shadow-md transition-all duration-200">
      <h2 className="text-lg font-semibold text-blue-900 line-clamp-1">
        {deck.title}
      </h2>
      <p className="mt-1 text-sm text-slate-600 line-clamp-2">
        {deck.description || "Không có mô tả."}
      </p>
      <div className="mt-3 flex items-center justify-between text-xs">
        <span className="rounded-full bg-blue-50 px-2 py-0.5">
          {deck.category || "other"}
        </span>
        <span className="font-medium text-emerald-600">
          {deck.status || "published"}
        </span>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2">
        <Link
          href={`/flashcards/${deck.id}`}
          className="inline-block w-full rounded-xl bg-blue-600 px-4 py-2 text-center text-sm font-medium text-white hover:brightness-110"
        >
          Học ngay
        </Link>

        <button
          onClick={onSubscribe}
          disabled={subscribed}
          className={`w-full rounded-xl px-4 py-2 text-center text-sm font-medium transition ${
            subscribed
              ? "bg-blue-600 text-white"
              : "bg-white text-blue-700 border border-blue-200 hover:bg-blue-50"
          } disabled:opacity-60 disabled:cursor-not-allowed`}
        >
          {subscribed
            ? "Đã theo dõi"
            : subLoading
            ? "Đang theo dõi..."
            : "Theo dõi"}
        </button>
      </div>
    </div>
  );
}
