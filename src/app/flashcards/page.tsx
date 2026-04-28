"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useUserStore } from "@/app/store/userStore";
import { getOwnDecks, getUserSubscriptions } from "@/utils/api";
import { ProgressRing } from "@/components/ui/ProgressRing";
import PenguinLottie from "@/components/PenguinLottie";

type ApiDeck = {
  id: string;
  userId: string;
  title: string;
  slug: string;
  descriptionMd?: string;
  status: string;
  category?: string;
  cardCount?: number;
  createdAt?: string;
  updatedAt?: string;
  mastery?: number;
  lastStudied?: string;
};

type Subscription = {
  id: string;
  title: string;
  deckId: string;
  status: string;
  category?: string;
  cardCount?: number;
  subscribeAt?: string;
  mastery?: number;
  lastStudied?: string;
};

function pickArray<T = unknown>(res: any): T[] {
  const payload = res?.data?.data ?? res?.data ?? [];
  if (Array.isArray(payload)) return payload as T[];
  return [payload as T];
}

type TabKey = "own" | "subs";

export default function FlashcardsPage() {
  const router = useRouter();
  const { user } = useUserStore();
  const [activeTab, setActiveTab] = useState<TabKey>("own");
  const [ownDecks, setOwnDecks] = useState<ApiDeck[]>([]);
  const [subs, setSubs] = useState<Subscription[]>([]);
  const [loadingTab, setLoadingTab] = useState<TabKey | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadOwn = async () => {
    if (!user?.id) return;
    setLoadingTab("own");
    setError(null);
    try {
      const res = await getOwnDecks(user.id);
      const data = pickArray<ApiDeck>(res);
      setOwnDecks(data);
    } catch (e: any) {
      setError(e?.message || "Failed to load your decks.");
    } finally {
      setLoadingTab(null);
    }
  };

  const loadSubs = async () => {
    if (!user?.id) return;
    setLoadingTab("subs");
    setError(null);
    try {
      const res = await getUserSubscriptions(user.id);
      setSubs(res.data.data);
    } catch (e: any) {
      setError(e?.message || "Failed to load subscribed decks.");
    } finally {
      setLoadingTab(null);
    }
  };

  useEffect(() => {
    if (!user?.id) return;
    loadOwn();
  }, [user?.id]);

  useEffect(() => {
    if (!user?.id) return;
    if (activeTab === "own" && ownDecks.length === 0) loadOwn();
    if (activeTab === "subs" && subs.length === 0) loadSubs();
  }, [activeTab, user?.id]);

  const isLoading = loadingTab === activeTab;

  return (
    <main className="min-h-screen w-full bg-[var(--background)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* PAGE HEADER */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1
              className="text-3xl sm:text-4xl font-extrabold text-[var(--foreground)]"
              style={{ fontFamily: "var(--font-sans)" }}
            >
              Vocabulary Decks
            </h1>
            <p className="text-[var(--text-muted)] mt-1">
              Manage your collections or discover new topics.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/flashcards/create"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-[var(--primary)] text-white font-bold border-b-[4px] border-[var(--primary-dark)] hover:-translate-y-0.5 hover:border-b-[5px] active:translate-y-[2px] active:border-b-[2px] transition-all"
            >
              Create Deck
            </Link>
            <Link
              href="/flashcards/explore"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-white text-[var(--foreground)] font-bold border-[3px] border-[var(--border)] hover:-translate-y-0.5 hover:border-[var(--primary)] active:translate-y-[2px] transition-all"
            >
              Explore Store
            </Link>
          </div>
        </div>

        {/* TABS (Pill Style) */}
        <div className="flex items-center gap-2 mb-8">
          <button
            onClick={() => setActiveTab("own")}
            className={`px-5 py-2.5 rounded-full font-bold text-sm transition-all ${
              activeTab === "own"
                ? "bg-[var(--primary)] text-white border-b-[3px] border-[var(--primary-dark)]"
                : "bg-white text-[var(--text-muted)] border-[2px] border-[var(--border)] hover:border-[var(--primary)] hover:text-[var(--primary)]"
            }`}
          >
            My Decks
          </button>
          <button
            onClick={() => setActiveTab("subs")}
            className={`px-5 py-2.5 rounded-full font-bold text-sm transition-all ${
              activeTab === "subs"
                ? "bg-[var(--primary)] text-white border-b-[3px] border-[var(--primary-dark)]"
                : "bg-white text-[var(--text-muted)] border-[2px] border-[var(--border)] hover:border-[var(--primary)] hover:text-[var(--primary)]"
            }`}
          >
            Subscribed
          </button>
        </div>

        {/* DECK CARDS GRID */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        ) : (
          <>
            {/* Own Decks */}
            {activeTab === "own" && ownDecks.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Create Deck Card */}
                <Link
                  href="/flashcards/create"
                  className="group flex flex-col items-center justify-center gap-3 rounded-[2rem] border-[3px] border-dashed border-[var(--border)] bg-white shadow-[0_4px_0_rgba(0,0,0,0.08)] hover:bg-[var(--primary-light)] hover:border-[var(--primary)] hover:-translate-y-[3px] hover:shadow-[0_6px_0_rgba(0,0,0,0.08)] transition-all duration-200 min-h-[220px]"
                >
                  <span
                    className="text-4xl font-bold text-[var(--text-muted)] group-hover:text-[var(--primary)] transition-colors"
                    style={{ fontFamily: "var(--font-sans)" }}
                  >
                    +
                  </span>
                  <span className="text-sm font-bold text-[var(--text-muted)] group-hover:text-[var(--primary)] transition-colors">
                    Create Deck
                  </span>
                </Link>
                {ownDecks.map((deck) => (
                  <DeckCard key={deck.id} deck={deck} type="own" />
                ))}
              </div>
            )}

            {/* Subscribed Decks */}
            {activeTab === "subs" && subs.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {subs.map((s) => (
                  <DeckCard
                    key={s.deckId}
                    deck={{
                      id: s.deckId,
                      title: s.title,
                      category: s.category,
                      cardCount: s.cardCount,
                      mastery: s.mastery,
                      lastStudied: s.lastStudied,
                    }}
                    type="subscribed"
                  />
                ))}
              </div>
            )}

            {/* Empty State - Own */}
            {activeTab === "own" && ownDecks.length === 0 && (
              <EmptyState
                title="You haven't created any decks yet."
                subtitle="Start building your vocabulary today."
                actionLabel="Create First Deck"
                actionHref="/flashcards/create"
              />
            )}

            {/* Empty State - Subscribed */}
            {activeTab === "subs" && subs.length === 0 && (
              <EmptyState
                title="No subscribed decks yet."
                subtitle="Explore the store to find topics you love."
                actionLabel="Explore Store"
                actionHref="/flashcards/explore"
              />
            )}
          </>
        )}
      </div>
    </main>
  );
}

// ====================================
// MASTERY RING COLOR HELPER
// ====================================
function getMasteryColor(mastery: number): string {
  if (mastery < 30) return "var(--destructive)";
  if (mastery <= 70) return "var(--accent-gold)";
  return "var(--skill-speaking)";
}

// ====================================
// DECK CARD COMPONENT
// ====================================
function DeckCard({
  deck,
  type,
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
}) {
  const router = useRouter();
  const mastery = deck.mastery ?? 0;

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
              style={{ fontFamily: "var(--font-sans)" }}
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
          {type === "subscribed" && (
            <button className="h-10 px-4 rounded-full bg-white text-[var(--destructive)] text-sm font-bold border-[2px] border-[var(--border)] hover:border-[var(--destructive)] active:translate-y-[1px] transition-all flex items-center justify-center">
              Remove
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ====================================
// SKELETON CARD
// ====================================
function SkeletonCard() {
  return (
    <div className="animate-pulse bg-white border-[3px] border-[var(--border)] rounded-[2rem] p-6 shadow-[0_4px_0_rgba(0,0,0,0.08)]">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1">
          <div className="h-5 bg-[var(--border)] rounded-full w-3/4 mb-3" />
          <div className="h-4 bg-[var(--background)] rounded-full w-full mb-2" />
        </div>
        <div className="w-[52px] h-[52px] rounded-full bg-[var(--background)]" />
      </div>
      <div className="flex gap-2 mt-4 mb-5">
        <div className="h-6 bg-[var(--background)] rounded-full w-20" />
        <div className="h-6 bg-[var(--background)] rounded-full w-16" />
      </div>
      <div className="h-10 bg-[var(--border)] rounded-full" />
    </div>
  );
}

// ====================================
// EMPTY STATE WITH PENGUIN
// ====================================
function EmptyState({
  title,
  subtitle,
  actionLabel,
  actionHref,
}: {
  title: string;
  subtitle: string;
  actionLabel: string;
  actionHref: string;
}) {
  return (
    <div className="col-span-full flex flex-col items-center justify-center py-16 text-center">
      {/* Penguin Mascot */}
      <div className="w-32 h-32 mb-6">
        <PenguinLottie />
      </div>

      <p
        className="text-lg font-bold text-[var(--foreground)] mb-2"
        style={{ fontFamily: "var(--font-sans)" }}
      >
        {title}
      </p>
      <p className="text-sm text-[var(--text-muted)] mb-6">{subtitle}</p>

      <Link
        href={actionHref}
        className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-[var(--primary)] text-white font-bold border-b-[4px] border-[var(--primary-dark)] hover:-translate-y-0.5 hover:border-b-[5px] active:translate-y-[2px] active:border-b-[2px] transition-all"
      >
        {actionLabel}
      </Link>
    </div>
  );
}
