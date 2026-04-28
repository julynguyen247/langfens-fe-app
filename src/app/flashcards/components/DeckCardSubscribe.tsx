"use client";

import Link from "next/link";

export default function DeckCardSubscribe({ sub }: { sub: any }) {
  const deck = sub;
  const deckIdForHref = deck?.id || sub.deckId;

  return (
    <div className="rounded-[2rem] border-[3px] border-[var(--border)] bg-white p-4 shadow-[0_4px_0_rgba(0,0,0,0.08)] transition-all duration-200 hover:-translate-y-[3px] hover:shadow-[0_6px_0_rgba(0,0,0,0.08)] hover:border-[var(--primary)]">
      <div>
        {deck ? (
          <>
            <h4
              className="line-clamp-2 text-[15px] font-bold leading-5 text-[var(--foreground)]"
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
          </>
        ) : (
          <div className="text-sm text-[var(--text-muted)]"></div>
        )}
      </div>

      <div className="mt-4 flex items-center justify-between text-xs text-[var(--text-muted)]">
        <div className="flex items-center gap-1">
          <span className="font-bold">{deck?.status ?? sub.status}</span>
        </div>
        {sub.subscribeAt && (
          <div className="flex items-center gap-1">
            <span>{new Date(sub.subscribeAt).toLocaleDateString("vi-VN")}</span>
          </div>
        )}
      </div>
      <div className="mt-4 grid grid-cols-2 gap-2">
        <Link
          href={deckIdForHref ? `/flashcards/${deckIdForHref}` : "#"}
          className={`inline-flex items-center justify-center w-full rounded-full px-4 py-2 text-center text-sm font-bold ${
            deckIdForHref
              ? "bg-[var(--primary)] border-b-[4px] border-[var(--primary-dark)] text-white hover:-translate-y-0.5 hover:border-b-[5px] active:translate-y-[2px] active:border-b-[2px] transition-all"
              : "bg-[var(--border)] text-[var(--text-muted)] cursor-not-allowed"
          }`}
          aria-disabled={!deckIdForHref}
        >
          Học ngay
        </Link>
        <Link
          href={deckIdForHref ? `/flashcards/${deckIdForHref}` : "#"}
          className={`inline-flex items-center justify-center w-full rounded-full border-[3px] px-4 py-2 text-center text-sm font-bold ${
            deckIdForHref
              ? "border-[var(--border)] border-b-[5px] bg-white text-[var(--foreground)] hover:border-[var(--primary)] hover:text-[var(--primary)] hover:-translate-y-0.5 active:translate-y-[2px] active:border-b-[3px] transition-all"
              : "border-[var(--border)] bg-[var(--background)] text-[var(--text-muted)] cursor-not-allowed"
          }`}
          aria-disabled={!deckIdForHref}
        >
          Xem thẻ
        </Link>
      </div>
    </div>
  );
}
