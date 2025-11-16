"use client";

import { useEffect, useState } from "react";
import { getPublicHandler, getUserSubscriptions } from "@/utils/api";
import { Search, ArrowLeft } from "lucide-react";
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
        setError(e?.message || "Không tải được danh sách deck.");
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
    <main className="mx-auto max-w-6xl px-4 py-8 text-blue-500">
      <div className="mb-6 flex items-center gap-3">
        <button
          onClick={() => router.back()}
          className="inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-sm font-medium hover:bg-blue-50"
        >
          <ArrowLeft className="h-4 w-4" />
          Quay lại
        </button>
        <h1 className="text-2xl font-bold">Khám phá các bộ thẻ</h1>
      </div>

      <div className="mb-6 flex flex-wrap items-center gap-3">
        <div className="relative min-w-[250px] flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Tìm kiếm deck..."
            className="w-full rounded-xl border border-blue-200 py-2 pl-9 pr-3 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-200"
          />
        </div>

        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="rounded-xl border border-blue-200 bg-white px-3 py-2 text-sm focus:border-blue-400 focus:ring-2 focus:ring-blue-200"
        >
          <option value="">Tất cả danh mục</option>
          <option value="study">Study</option>
          <option value="vocab">Vocabulary</option>
          <option value="grammar">Grammar</option>
        </select>
      </div>

      {loading ? (
        <div className="py-10 text-center text-slate-500">Đang tải...</div>
      ) : error ? (
        <div className="py-10 text-center text-red-600">{error}</div>
      ) : filteredDecks.length === 0 ? (
        <div className="py-10 text-center text-slate-600">
          Không có deck phù hợp (hoặc tất cả đã subscribe).
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {filteredDecks.map((deck) => (
            <DeckCard key={deck.id} deck={deck as any} />
          ))}
        </div>
      )}
    </main>
  );
}
