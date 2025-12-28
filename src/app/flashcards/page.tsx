"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useUserStore } from "@/app/store/userStore";
import { getOwnDecks, getUserSubscriptions } from "@/utils/api";
import PenguinLottie from "@/components/PenguinLottie";

// Material Icon Component
function Icon({ name, className = "" }: { name: string; className?: string }) {
  return <span className={`material-symbols-rounded ${className}`}>{name}</span>;
}

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
};

type Subscription = {
  id: string;
  title: string;
  deckId: string;
  status: string;
  category?: string;
  cardCount?: number;
  subscribeAt?: string;
};

function pickArray<T = any>(res: any): T[] {
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
    <main className="min-h-screen w-full bg-[#F8FAFC]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* =============================================
            PAGE HEADER
        ============================================= */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="font-serif text-3xl font-bold text-slate-900">
              Vocabulary Decks
            </h1>
            <p className="text-slate-500 mt-1">
              Manage your collections or discover new topics.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/flashcards/create"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#3B82F6] hover:bg-[#2563EB] text-white font-medium rounded-lg shadow-sm transition-colors"
            >
              <Icon name="add" className="text-xl" />
              Create Deck
            </Link>
            <Link
              href="/flashcards/explore"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-white border border-slate-200 text-slate-700 font-medium rounded-lg hover:bg-slate-50 transition-colors"
            >
              <Icon name="explore" className="text-xl" />
              Explore Store
            </Link>
          </div>
        </div>

        {/* =============================================
            LEVEL CHECK BANNER (Compact CTA)
        ============================================= */}
        <div className="bg-white border border-blue-100 rounded-xl p-6 mb-8 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg bg-[#EFF6FF] flex items-center justify-center">
              <Icon name="school" className="text-2xl text-[#3B82F6]" />
            </div>
            <div>
              <p className="font-serif font-semibold text-slate-800">
                Not sure about your level?
              </p>
              <p className="text-sm text-slate-500">
                Take a quick vocabulary assessment test.
              </p>
            </div>
          </div>
          <button
            onClick={() => router.push("/placement")}
            className="px-5 py-2.5 border border-[#3B82F6] text-[#3B82F6] font-medium rounded-lg hover:bg-[#EFF6FF] transition-colors"
          >
            Start Test
          </button>
        </div>

        {/* =============================================
            TABS (Underline Style)
        ============================================= */}
        <div className="border-b border-slate-200 mb-8">
          <div className="flex items-center gap-8">
            <button
              onClick={() => setActiveTab("own")}
              className={`pb-3 text-sm font-medium transition-colors relative ${
                activeTab === "own"
                  ? "text-[#2563EB]"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              My Decks
              {activeTab === "own" && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#2563EB] rounded-full" />
              )}
            </button>
            <button
              onClick={() => setActiveTab("subs")}
              className={`pb-3 text-sm font-medium transition-colors relative ${
                activeTab === "subs"
                  ? "text-[#2563EB]"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              Subscribed
              {activeTab === "subs" && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#2563EB] rounded-full" />
              )}
            </button>
          </div>
        </div>

        {/* =============================================
            DECK CARDS GRID
        ============================================= */}
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
  };
  type: "own" | "subscribed";
}) {
  const router = useRouter();

  return (
    <div className="group relative bg-white border border-slate-200 rounded-xl shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300 overflow-hidden h-full flex flex-col">
      {/* Top Decoration - Gradient accent */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#3B82F6] to-[#60A5FA] rounded-t-xl" />

      {/* Content */}
      <div className="p-6 flex flex-col flex-1">
        {/* Title - Serif */}
        <h3 className="font-serif font-bold text-lg text-slate-900 line-clamp-2 group-hover:text-[#2563EB] transition-colors">
          {deck.title}
        </h3>

        {/* Description */}
        {deck.descriptionMd && (
          <p className="text-slate-500 text-sm line-clamp-2 mt-2">
            {deck.descriptionMd}
          </p>
        )}

        {/* Meta Tags */}
        <div className="flex flex-wrap gap-2 mt-4">
          {deck.category && (
            <span className="inline-flex items-center gap-1 text-xs px-2.5 py-1 bg-[#EFF6FF] text-[#2563EB] rounded-md font-medium">
              <Icon name="folder" className="text-sm" />
              {deck.category}
            </span>
          )}
          <span className="inline-flex items-center gap-1 text-xs px-2.5 py-1 bg-slate-100 text-slate-600 rounded-md font-medium">
            <Icon name="style" className="text-sm" />
            {deck.cardCount || 0} words
          </span>
        </div>

        {/* Action Row */}
        <div className="mt-auto pt-5 flex items-center gap-2">
          <button
            onClick={() => router.push(`/flashcards/${deck.id}`)}
            className="flex-1 h-9 bg-[#3B82F6] hover:bg-[#2563EB] text-white text-sm font-medium rounded-lg transition-colors flex items-center justify-center gap-1"
          >
            <Icon name="play_arrow" className="text-lg" />
            Study Now
          </button>
          <button
            onClick={() => router.push(`/flashcards/${deck.id}?view=cards`)}
            className="h-9 w-9 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors flex items-center justify-center"
          >
            <Icon name="visibility" className="text-lg text-slate-500" />
          </button>
          {type === "subscribed" && (
            <button className="h-9 w-9 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors flex items-center justify-center">
              <Icon name="bookmark_remove" className="text-lg text-slate-500" />
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
    <div className="animate-pulse bg-white border border-slate-200 rounded-xl p-6">
      <div className="h-1 bg-slate-200 rounded-full mb-4" />
      <div className="h-5 bg-slate-200 rounded w-3/4 mb-3" />
      <div className="h-4 bg-slate-100 rounded w-full mb-2" />
      <div className="h-4 bg-slate-100 rounded w-2/3 mb-4" />
      <div className="flex gap-2 mb-5">
        <div className="h-6 bg-slate-100 rounded-md w-20" />
        <div className="h-6 bg-slate-100 rounded-md w-16" />
      </div>
      <div className="h-9 bg-slate-200 rounded-lg" />
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

      <p className="text-lg font-medium text-slate-700 mb-2">{title}</p>
      <p className="text-sm text-slate-500 mb-6">{subtitle}</p>

      <Link
        href={actionHref}
        className="inline-flex items-center gap-2 px-6 py-3 bg-[#3B82F6] hover:bg-[#2563EB] text-white font-medium rounded-lg shadow-sm transition-colors"
      >
        <Icon name="add" className="text-xl" />
        {actionLabel}
      </Link>
    </div>
  );
}
