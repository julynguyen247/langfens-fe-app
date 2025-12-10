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
      <div className="w-full max-w-2xl rounded-2xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-blue-200 px-5 py-3 gap-2">
          <h3 className="text-base font-semibold flex-1">
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
            className="rounded-lg bg-[#317EFF] px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-300"
          >
            + Thêm thẻ
          </button>

          <button
            onClick={editingCard ? () => setEditingCard(null) : onClose}
            className="rounded-lg px-2 py-1 text-slate-600 hover:bg-slate-100"
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
            <div className="py-10 text-center text-slate-500">Đang tải...</div>
          ) : error ? (
            <div className="py-10 text-center text-red-600">{error}</div>
          ) : cards.length === 0 ? (
            <div className="py-10 text-center text-slate-600">Chưa có thẻ.</div>
          ) : (
            cards.map((c, i) => {
              const front = c.frontMd ?? c.front ?? "";
              const back = c.backMd ?? c.back ?? "";

              return (
                <div
                  key={c.id}
                  className="rounded-xl border border-blue-200 p-4 flex items-start justify-between gap-3"
                >
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
                    <button
                      onClick={() => setEditingCard(c)}
                      className="rounded-lg border border-blue-300 px-3 py-1.5 text-sm text-blue-600 hover:bg-blue-50"
                    >
                      Sửa
                    </button>

                    <button
                      onClick={() => setConfirmDeleteId(c.id)}
                      disabled={deletingId === c.id}
                      className="rounded-lg border border-rose-200 px-3 py-1.5 text-sm text-rose-700 hover:bg-rose-50 disabled:opacity-60"
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
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-sm space-y-4">
            <h2 className="text-lg font-semibold text-slate-800">
              Xác nhận xoá
            </h2>
            <p className="text-sm text-slate-600">
              Bạn có chắc muốn xoá thẻ này không?
            </p>

            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setConfirmDeleteId(null)}
                className="px-4 py-2 rounded-lg border text-slate-700 hover:bg-slate-100"
              >
                Hủy
              </button>

              <button
                onClick={async () => {
                  await handleDelete(confirmDeleteId);
                  setConfirmDeleteId(null);
                }}
                className="px-4 py-2 rounded-lg bg-rose-600 text-white hover:bg-rose-700"
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
