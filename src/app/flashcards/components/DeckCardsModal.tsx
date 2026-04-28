"use client";

import { useEffect, useState } from "react";
import { getDeckCards, deleteCard } from "@/utils/api";
import EditCardForm from "./EditCardForm";
import AddCardForm from "./AddCardForm";

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
}: {
  deckId: string;
  open: boolean;
  onClose: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const [cards, setCards] = useState<CardItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [editingCard, setEditingCard] = useState<CardItem | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

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
        const list = payload
          .slice()
          .sort((a: any, b: any) => (a?.idx ?? 0) - (b?.idx ?? 0));
        if (mounted) setCards(list);
      } catch {
        if (mounted) setError("Không tải được thẻ.");
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [open, deckId]);

  const handleDelete = async (id: string) => {
    if (deletingId) return;
    setDeletingId(id);
    try {
      await deleteCard(id);
      setCards((prev) => prev.filter((c) => c.id !== id));
    } finally {
      setDeletingId(null);
    }
  };

  const refreshAfterEdit = async () => {
    setEditingCard(null);
    const res = await getDeckCards(deckId);
    const payload = Array.isArray(res.data) ? res.data : res.data?.data ?? [];
    const list = payload
      .slice()
      .sort((a: any, b: any) => (a?.idx ?? 0) - (b?.idx ?? 0));
    setCards(list);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-2xl rounded-[2rem] border-[3px] border-[var(--border)] bg-white shadow-lg">
        <div className="flex items-center justify-between border-b-[3px] border-[var(--border)] px-5 py-3 gap-2">
          <h3
            className="text-base font-bold flex-1 text-[var(--foreground)]"
            style={{ fontFamily: "var(--font-sans)" }}
          >
            {editingCard
              ? editingCard.id === "__new"
                ? "Thêm thẻ mới"
                : "Chỉnh sửa thẻ"
              : "Thẻ trong bộ"}
          </h3>

          <button
            onClick={() =>
              setEditingCard({
                id: "__new",
                frontMd: "",
                backMd: "",
                hintMd: "",
              })
            }
            className="rounded-full border-b-[4px] border-[var(--primary-dark)] bg-[var(--primary)] px-3 py-1.5 text-sm font-bold text-white hover:-translate-y-0.5 hover:border-b-[5px] active:translate-y-[2px] active:border-b-[2px] transition-all"
          >
            + Thêm thẻ
          </button>

          <button
            onClick={editingCard ? () => setEditingCard(null) : onClose}
            className="rounded-full px-3 py-1.5 text-[var(--text-muted)] font-bold border-[3px] border-[var(--border)] hover:bg-[var(--background)] hover:border-[var(--primary)] transition-all"
          >
            Đóng
          </button>
        </div>

        <div className="max-h-[70vh] overflow-y-auto p-5 space-y-4">
          {editingCard ? (
            editingCard.id === "__new" ? (
              <AddCardForm deckId={deckId} onSaved={refreshAfterEdit} />
            ) : (
              <EditCardForm
                cardId={editingCard.id}
                initialFront={editingCard.frontMd ?? editingCard.front ?? ""}
                initialBack={editingCard.backMd ?? editingCard.back ?? ""}
                initialHint={editingCard.hintMd ?? editingCard.hint ?? ""}
                onSaved={refreshAfterEdit}
              />
            )
          ) : loading ? (
            <div className="py-10 text-center text-[var(--text-muted)] font-bold">Đang tải...</div>
          ) : error ? (
            <div className="py-10 text-center text-[var(--destructive)] font-bold">{error}</div>
          ) : cards.length === 0 ? (
            <div className="py-10 text-center text-[var(--text-muted)] font-bold">Chưa có thẻ.</div>
          ) : (
            cards.map((c, i) => {
              const front = c.frontMd ?? c.front ?? "";
              const back = c.backMd ?? c.back ?? "";

              return (
                <div
                  key={c.id}
                  className="rounded-[2rem] border-[3px] border-[var(--border)] p-4 flex items-start justify-between gap-3 shadow-[0_4px_0_rgba(0,0,0,0.08)]"
                >
                  <div className="min-w-0">
                    <div
                      className="text-xs font-bold text-[var(--text-muted)]"
                      style={{ fontFamily: "var(--font-mono)" }}
                    >
                      #{i + 1}
                    </div>
                    <div className="mt-1 line-clamp-2 font-bold text-[var(--foreground)]">
                      {front || "(Front trống)"}
                    </div>
                    <div className="mt-1 line-clamp-2 text-sm text-[var(--text-muted)]">
                      {back || "(Back trống)"}
                    </div>
                  </div>

                  <div className="flex shrink-0 items-center gap-2">
                    <button
                      onClick={() => setEditingCard(c)}
                      className="rounded-full border-[3px] border-[var(--border)] border-b-[5px] px-3 py-1.5 text-sm font-bold text-[var(--primary)] hover:border-[var(--primary)] hover:bg-[var(--primary-light)] hover:-translate-y-0.5 active:translate-y-[2px] active:border-b-[3px] transition-all"
                    >
                      Sửa
                    </button>

                    <button
                      onClick={() => setConfirmDeleteId(c.id)}
                      disabled={deletingId === c.id}
                      className="rounded-full border-[3px] border-[var(--destructive)]/30 border-b-[5px] px-3 py-1.5 text-sm font-bold text-[var(--destructive)] hover:bg-red-50 hover:-translate-y-0.5 active:translate-y-[2px] active:border-b-[3px] transition-all disabled:opacity-60"
                    >
                      {deletingId === c.id ? "Đang xóa..." : "Xóa"}
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {confirmDeleteId && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-[2rem] border-[3px] border-[var(--border)] shadow-lg p-6 w-full max-w-sm space-y-4">
            <h2
              className="text-lg font-bold text-[var(--foreground)]"
              style={{ fontFamily: "var(--font-sans)" }}
            >
              Xác nhận xoá
            </h2>
            <p className="text-sm text-[var(--text-muted)]">
              Bạn có chắc muốn xoá thẻ này không?
            </p>

            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setConfirmDeleteId(null)}
                className="px-4 py-2 rounded-full border-[3px] border-[var(--border)] border-b-[5px] font-bold text-[var(--foreground)] hover:bg-[var(--background)] hover:-translate-y-0.5 active:translate-y-[2px] active:border-b-[3px] transition-all"
              >
                Hủy
              </button>

              <button
                onClick={async () => {
                  await handleDelete(confirmDeleteId);
                  setConfirmDeleteId(null);
                }}
                className="px-4 py-2 rounded-full border-b-[4px] border-red-700 bg-[var(--destructive)] text-white font-bold hover:-translate-y-0.5 hover:border-b-[5px] active:translate-y-[2px] active:border-b-[2px] transition-all"
              >
                Xoá
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
