"use client";

import { useEffect, useState } from "react";
import PageHeader from "./components/PageHeader";
import PromoBanner from "./components/PromoBanner";
import { useUserStore } from "@/app/store/userStore";
import { getOwnDecks, getUserSubscriptions } from "@/utils/api";
import DeckCardOwn from "./components/DeckCardOwn";
import DeckCardSubscribe from "./components/DeckCardSubscribe";

type ApiDeck = {
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

type Subscription = {
  id: string;
  title: string;
  deckId: string;
  status: string;
  subscribeAt?: string;
};

function pickArray<T = any>(res: any): T[] {
  const payload = res?.data?.data ?? res?.data ?? [];
  if (Array.isArray(payload)) return payload as T[];
  return [payload as T];
}

type TabKey = "own" | "subs";

export default function FlashcardsPage() {
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
      setError(e?.message || "Không tải được danh sách bộ thẻ của bạn.");
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
      setError(e?.message || "Không tải được danh sách bộ thẻ đã theo dõi.");
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
    <main className="mx-auto w-full max-w-6xl px-4 py-6 text-blue-900">
      <PageHeader />
      <PromoBanner />

      <div className="mt-4 flex items-center gap-2">
        <button
          onClick={() => setActiveTab("own")}
          className={`rounded-xl px-4 py-2 text-sm font-medium transition border ${
            activeTab === "own"
              ? "bg-blue-600 text-white border-blue-600"
              : "bg-white text-blue-700 border-blue-200 hover:bg-blue-50"
          }`}
        >
          Own
        </button>
        <button
          onClick={() => setActiveTab("subs")}
          className={`rounded-xl px-4 py-2 text-sm font-medium transition border ${
            activeTab === "subs"
              ? "bg-blue-600 text-white border-blue-600"
              : "bg-white text-blue-700 border-blue-200 hover:bg-blue-50"
          }`}
        >
          Subscribed
        </button>
      </div>

      {error && (
        <div className="mt-4 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {isLoading ? (
        <section className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="h-40 animate-pulse rounded-xl border bg-white/60 p-4"
            >
              <div className="h-5 w-2/3 rounded bg-gray-200" />
              <div className="mt-3 h-4 w-1/3 rounded bg-gray-200" />
              <div className="mt-6 h-4 w-1/2 rounded bg-gray-200" />
            </div>
          ))}
        </section>
      ) : (
        <section className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {activeTab === "own" &&
            ownDecks.map((deck) => <DeckCardOwn key={deck.id} deck={deck} />)}

          {activeTab === "subs" &&
            subs.map((s) => <DeckCardSubscribe key={s.deckId} sub={s} />)}

          {activeTab === "own" && !ownDecks.length && (
            <div className="col-span-full rounded-lg border bg-white p-6 text-center text-sm text-slate-600">
              Bạn chưa có bộ thẻ nào. Hãy tạo bộ đầu tiên!
            </div>
          )}
          {activeTab === "subs" && !subs.length && (
            <div className="col-span-full rounded-lg border bg-white p-6 text-center text-sm text-slate-600">
              Chưa theo dõi bộ thẻ nào.
            </div>
          )}
        </section>
      )}
    </main>
  );
}
