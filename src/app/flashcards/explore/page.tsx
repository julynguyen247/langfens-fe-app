"use client";

import { useEffect, useState } from "react";
import { getPublicHandler, getUserSubscriptions } from "@/utils/api";
import { useRouter } from "next/navigation";
import DeckCard from "./components/DeckCard";
import { useUserStore } from "@/app/store/userStore";

type PublicDeck = {
  id: string;
  title: string;
  description: string;
  category: string;
  status: string;
};

export default function ExploreDecksPage() {
  const router = useRouter();
  const { user } = useUserStore();

  const [decks, setDecks] = useState<PublicDeck[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("");
  const status = "PUBLISHED";

  useEffect(() => {
    const fetchDecks = async () => {
      setLoading(true);
      setError(null);
      try {
        const [pubRes, subRes] = await Promise.all([
          getPublicHandler({ status, category, page: 1, pageSize: 20 }),
          user?.id
            ? getUserSubscriptions(user.id)
            : Promise.resolve({ data: [] }),
        ]);

        const rawDecks = Array.isArray(pubRes.data)
          ? pubRes.data
          : pubRes.data?.data ?? [];
        const subsPayload = Array.isArray(subRes.data)
          ? subRes.data
          : subRes.data?.data ?? [];
        const subscribedIds = new Set(
          (subsPayload ?? []).map((s: any) => String(s.deckId ?? s.id ?? ""))
        );

        const visible = (rawDecks as PublicDeck[]).filter(
          (d) => !subscribedIds.has(String(d.id))
        );
        setDecks(visible);
      } catch (e: any) {
        setError(e?.message || "Failed to load decks.");
      } finally {
        setLoading(false);
      }
    };
    fetchDecks();
  }, [status, category, user?.id]);

  const filteredDecks = decks.filter((d) =>
    d.title?.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <main className="min-h-screen w-full bg-[var(--background)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8 flex flex-col sm:flex-row sm:items-center gap-4">
          <button
            onClick={() => router.back()}
            className="inline-flex items-center self-start px-5 py-2.5 rounded-full bg-white text-[var(--foreground)] font-bold border-[3px] border-[var(--border)] hover:-translate-y-0.5 hover:border-[var(--primary)] active:translate-y-[2px] transition-all"
          >
            Back
          </button>
          <h1
            className="text-3xl sm:text-4xl font-extrabold text-[var(--foreground)]"
            style={{ fontFamily: "var(--font-sans)" }}
          >
            Explore Decks
          </h1>
        </div>

        {/* Filters */}
        <div className="mb-8 flex flex-wrap items-center gap-3">
          <div className="relative min-w-[250px] flex-1">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search decks..."
              className="w-full rounded-xl border-[3px] border-b-[5px] border-[var(--border)] bg-white py-2.5 px-4 text-[var(--foreground)] font-medium outline-none transition-colors focus:border-[var(--primary)]"
            />
          </div>

          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="rounded-xl border-[3px] border-b-[5px] border-[var(--border)] bg-white px-4 py-2.5 text-[var(--foreground)] font-medium outline-none transition-colors focus:border-[var(--primary)]"
          >
            <option value="">All categories</option>
            <option value="study">Study</option>
            <option value="vocab">Vocabulary</option>
            <option value="grammar">Grammar</option>
          </select>
        </div>

        {/* Content */}
        {loading ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="animate-pulse bg-white border-[3px] border-[var(--border)] rounded-[2rem] p-6 shadow-[0_4px_0_rgba(0,0,0,0.08)]"
              >
                <div className="h-5 bg-[var(--border)] rounded-full w-3/4 mb-3" />
                <div className="h-4 bg-[var(--background)] rounded-full w-full mb-2" />
                <div className="h-4 bg-[var(--background)] rounded-full w-2/3 mb-4" />
                <div className="flex gap-2 mb-5">
                  <div className="h-6 bg-[var(--background)] rounded-full w-20" />
                  <div className="h-6 bg-[var(--background)] rounded-full w-16" />
                </div>
                <div className="h-10 bg-[var(--border)] rounded-full" />
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="bg-white border-[3px] border-[var(--destructive)]/30 rounded-[2rem] shadow-[0_4px_0_rgba(0,0,0,0.08)] p-8 text-center">
            <p className="text-[var(--destructive)] font-bold">{error}</p>
          </div>
        ) : filteredDecks.length === 0 ? (
          <div className="bg-white border-[3px] border-[var(--border)] rounded-[2rem] shadow-[0_4px_0_rgba(0,0,0,0.08)] p-8 text-center">
            <p className="text-[var(--text-muted)] font-bold">
              No matching decks found (or all are already subscribed).
            </p>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filteredDecks.map((deck) => (
              <DeckCard key={deck.id} deck={deck as any} />
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
