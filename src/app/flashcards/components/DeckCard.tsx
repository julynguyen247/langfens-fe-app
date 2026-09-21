"use client";

import { useRouter } from "next/navigation";
import { ProgressRing } from "@/components/ui/ProgressRing";

import { getMasteryColor } from "../utils";

// ====================================
// DECK CARD COMPONENT
// ====================================
export function DeckCard({
  deck,
  type,
  onRemove,
  removingId,
}: {
  deck: {
    id: string;
    title: string;
    descriptionMd?: string;
    category?: string;
    cardCount?: number;
    mastery?: number;
    lastStudied?: string;
  };
  type: "own" | "subscribed";
  onRemove?: (deckId: string) => void;
  removingId?: string | null;
}) {
  const router = useRouter();
  const mastery = deck.mastery ?? 0;
  const isRemoving = removingId != null && removingId === deck.id;

  return (
    <div className="group bg-white border-[3px] border-[var(--border)] rounded-[2rem] shadow-[0_4px_0_rgba(0,0,0,0.08)] hover:-translate-y-[3px] hover:border-[var(--primary)] hover:shadow-[0_6px_0_rgba(0,0,0,0.08)] transition-all duration-200 h-full flex flex-col overflow-hidden">
      {/* Content */}
      <div className="p-6 flex flex-col flex-1">
        {/* Top row: Title + Mastery Ring */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            {/* Title */}
            <h3
              className="font-bold text-lg text-[var(--foreground)] line-clamp-2 group-hover:text-[var(--primary)] transition-colors"
              style={{ fontFamily: "var(--font-heading)" }}
            >
              {deck.title}
            </h3>

            {/* Description */}
            {deck.descriptionMd && (
              <p className="text-[var(--text-muted)] text-sm line-clamp-2 mt-1">
                {deck.descriptionMd}
              </p>
            )}
          </div>

          {/* Mastery Ring */}
          <ProgressRing
            progress={mastery}
            size={52}
            strokeWidth={5}
            color={getMasteryColor(mastery)}
          >
            <span
              className="text-xs font-bold text-[var(--foreground)]"
              style={{ fontFamily: "var(--font-mono)" }}
            >
              {mastery}%
            </span>
          </ProgressRing>
        </div>

        {/* Meta Tags */}
        <div className="flex flex-wrap items-center gap-2 mt-4">
          {deck.category && (
            <span className="inline-flex items-center text-xs px-3 py-1 bg-[var(--primary-light)] text-[var(--primary)] rounded-full border-[2px] border-[var(--primary)]/20 font-bold">
              {deck.category}
            </span>
          )}
          <span
            className="inline-flex items-center text-xs px-3 py-1 bg-[var(--background)] text-[var(--text-body)] rounded-full border-[2px] border-[var(--border)] font-bold"
            style={{ fontFamily: "var(--font-mono)" }}
          >
            {deck.cardCount || 0} words
          </span>
          {deck.lastStudied && (
            <span className="text-xs text-[var(--text-muted)]">
              Last studied:{" "}
              {new Date(deck.lastStudied).toLocaleDateString("vi-VN")}
            </span>
          )}
        </div>

        {/* Action Row */}
        <div className="mt-auto pt-5 flex items-center gap-2">
          <button
            onClick={() => router.push(`/flashcards/${deck.id}`)}
            className="flex-1 h-10 rounded-full bg-[var(--primary)] text-white text-sm font-bold border-b-[4px] border-[var(--primary-dark)] hover:-translate-y-0.5 hover:border-b-[5px] active:translate-y-[2px] active:border-b-[2px] transition-all flex items-center justify-center"
          >
            Study Now
          </button>
          <button
            onClick={() => router.push(`/flashcards/${deck.id}?view=cards`)}
            className="h-10 px-4 rounded-full bg-white text-[var(--text-body)] text-sm font-bold border-[2px] border-[var(--border)] hover:border-[var(--primary)] hover:text-[var(--primary)] active:translate-y-[1px] transition-all flex items-center justify-center"
          >
            View
          </button>
          {type === "subscribed" && onRemove && (
            <button
              onClick={() => onRemove(deck.id)}
              disabled={isRemoving}
              className="h-10 px-4 rounded-full bg-white text-[var(--destructive)] text-sm font-bold border-[2px] border-[var(--border)] hover:border-[var(--destructive)] active:translate-y-[1px] transition-all flex items-center justify-center disabled:opacity-60"
            >
              {isRemoving ? "..." : "Remove"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
