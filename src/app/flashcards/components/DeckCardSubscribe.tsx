"use client";

import Link from "next/link";
import { Calendar, Folder, FileText } from "lucide-react";

export default function DeckCardSubscribe({ sub }: { sub: any }) {
  const deck = sub;
  const deckIdForHref = deck?.id || sub.deckId;

  return (
    <div className="rounded-2xl border border-blue-100 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md hover:border-blue-200">
      <div>
        {deck ? (
          <>
            <h4 className="line-clamp-2 text-[15px] font-semibold leading-5 text-[#3B82F6]">
              {deck.title}
            </h4>

            {deck.category && (
              <div className="mt-2 falex items-center gap-1 text-[13px] text-[#3B82F6]">
                <Folder className="h-3.5 w-3.5" />
                <span>{deck.category}</span>
              </div>
            )}

            {deck.descriptionMd && (
              <p className="mt-2 line-clamp-2 text-sm text-slate-600">
                {deck.descriptionMd}
              </p>
            )}
          </>
        ) : (
          <div className="text-sm text-slate-600"></div>
        )}
      </div>

      <div className="mt-4 flex items-center justify-between text-xs text-slate-500">
        <div className="flex items-center gap-1">
          <FileText className="h-3.5 w-3.5" />
          <span>{deck?.status ?? sub.status}</span>
        </div>
        {sub.subscribeAt && (
          <div className="flex items-center gap-1">
            <Calendar className="h-3.5 w-3.5" />
            <span>{new Date(sub.subscribeAt).toLocaleDateString("vi-VN")}</span>
          </div>
        )}
      </div>
      <div className="mt-4 grid grid-cols-2 gap-2">
        <Link
          href={deckIdForHref ? `/flashcards/${deckIdForHref}` : "#"}
          className={`inline-block w-full rounded-xl px-4 py-2 text-center text-sm font-medium ${
            deckIdForHref
              ? "bg-blue-600 text-white hover:brightness-110"
              : "bg-gray-200 text-gray-500 cursor-not-allowed"
          }`}
          aria-disabled={!deckIdForHref}
        >
          Học ngay
        </Link>
        <Link
          href={deckIdForHref ? `/flashcards/${deckIdForHref}` : "#"}
          className={`inline-block w-full rounded-xl border px-4 py-2 text-center text-sm font-medium ${
            deckIdForHref
              ? "border-blue-200 bg-white text-blue-700 hover:bg-blue-50"
              : "border-gray-200 bg-gray-50 text-gray-400 cursor-not-allowed"
          }`}
          aria-disabled={!deckIdForHref}
        >
          Xem thẻ
        </Link>
      </div>
    </div>
  );
}
