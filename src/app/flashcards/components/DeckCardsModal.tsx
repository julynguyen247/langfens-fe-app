// app/flashcards/components/DeckCardsModal.tsx
"use client";

import { useEffect, useState } from "react";
import { getDeckCards } from "@/utils/api";
import Link from "next/link";

type CardItem = {
  id: string;
  idx?: number;
  frontMd?: string;
  backMd?: string;
  front?: string;
  back?: string;
  hintMd?: string;
  hint?: string;
};

export default function DeckCardsModal({
  deckId,
  open,
  onClose,
  onDelete,
}: {
  deckId: string;
  open: boolean;
  onClose: () => void;
  onDelete?: (cardId: string) => Promise<void> | void;
}) {
  const [loading, setLoading] = useState(false);
  const [cards, setCards] = useState<CardItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    let mounted = true;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await getDeckCards(deckId);
        const payload = Array.isArray(res.data)
          ? res.data
          : res.data?.data ?? [];
        const list: CardItem[] = (payload ?? [])
          .slice()
          .sort((a: any, b: any) => (a?.idx ?? 0) - (b?.idx ?? 0));
        if (mounted) setCards(list);
      } catch (e: any) {
        if (mounted) setError(e?.message || "Không tải được thẻ.");
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [open, deckId]);

  const handleDelete = async (id: string) => {
    if (!onDelete) return;
    if (deletingId) return;
    setDeletingId(id);
    try {
      await onDelete(id);
      setCards((prev) => prev.filter((c) => c.id !== id));
    } finally {
      setDeletingId(null);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-2xl rounded-2xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b px-5 py-3">
          <h3 className="text-base font-semibold">Thẻ trong bộ</h3>
          <button
            onClick={onClose}
            className="rounded-lg px-2 py-1 text-slate-600 hover:bg-slate-100"
          >
            Đóng
          </button>
        </div>

        <div className="max-h-[70vh] overflow-y-auto p-5">
          {loading ? (
            <div className="py-10 text-center text-slate-500">Đang tải...</div>
          ) : error ? (
            <div className="py-10 text-center text-red-600">{error}</div>
          ) : cards.length === 0 ? (
            <div className="py-10 text-center text-slate-600">Chưa có thẻ.</div>
          ) : (
            <ul className="space-y-3">
              {cards.map((c, i) => {
                const front = c.frontMd ?? c.front ?? "";
                const back = c.backMd ?? c.back ?? "";
                return (
                  <li key={c.id} className="rounded-xl border p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="text-xs text-slate-500">#{i + 1}</div>
                        <div className="mt-1 line-clamp-2 font-medium text-slate-900">
                          {front || "(Front trống)"}
                        </div>
                        <div className="mt-1 line-clamp-2 text-sm text-slate-600">
                          {back || "(Back trống)"}
                        </div>
                      </div>
                      <div className="flex shrink-0 items-center gap-2">
                        <Link
                          href={`/flashcards/${deckId}/cards/${c.id}/edit`}
                          className="rounded-lg border border-indigo-200 px-3 py-1.5 text-sm text-indigo-700 hover:bg-indigo-50"
                        >
                          Sửa
                        </Link>
                        <button
                          onClick={() => handleDelete(c.id)}
                          disabled={!onDelete || deletingId === c.id}
                          className="rounded-lg border border-rose-200 px-3 py-1.5 text-sm text-rose-700 hover:bg-rose-50 disabled:opacity-60"
                        >
                          {deletingId === c.id ? "Đang xóa..." : "Xóa"}
                        </button>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
