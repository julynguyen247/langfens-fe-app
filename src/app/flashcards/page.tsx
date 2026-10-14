"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useUserStore } from "@/stores/userStore";
import { getOwnDecks, getUserSubscriptions, unsubscribeDeck } from "@/services/vocabulary";

import { type TabKey, type ApiDeck, type Subscription } from "./types";
import { pickArray } from "./utils";
import { SkeletonCard } from "./components/SkeletonCard";
import { DeckCard } from "./components/DeckCard";
import { EmptyState } from "./components/EmptyState";

export default function FlashcardsPage() {
  const router = useRouter();
  const { user } = useUserStore();
  const [activeTab, setActiveTab] = useState<TabKey>("own");
  const [ownDecks, setOwnDecks] = useState<ApiDeck[]>([]);
  const [subs, setSubs] = useState<Subscription[]>([]);
  const [loadingTab, setLoadingTab] = useState<TabKey | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [removingId, setRemovingId] = useState<string | null>(null);

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
      setSubs((res as any)?.data?.data ?? []);
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

  const handleUnsubscribe = async (deckId: string) => {
    if (!user?.id || removingId) return;
    setRemovingId(deckId);
    try {
      await unsubscribeDeck(user.id, deckId);
      setSubs((prev) => prev.filter((s) => s.deckId !== deckId));
    } catch (e: any) {
      console.error("Failed to unsubscribe:", e);
    } finally {
      setRemovingId(null);
    }
  };

  const isLoading = loadingTab === activeTab;

  return (
    <main className="min-h-screen w-full bg-[var(--background)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* PAGE HEADER */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1
              className="text-3xl sm:text-4xl font-extrabold text-[var(--foreground)]"
              style={{ fontFamily: "var(--font-heading)" }}
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
                    style={{ fontFamily: "var(--font-heading)" }}
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
                    onRemove={handleUnsubscribe}
                    removingId={removingId}
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
