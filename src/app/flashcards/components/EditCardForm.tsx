"use client";

import { useState } from "react";
import { updateCard } from "@/utils/api";

type Props = {
  cardId: string;
  initialFront?: string;
  initialBack?: string;
  initialHint?: string;
  onSaved?: () => void;
};

export default function EditCardForm({
  cardId,
  initialFront = "",
  initialBack = "",
  initialHint = "",
  onSaved,
}: Props) {
  const [front, setFront] = useState(initialFront);
  const [back, setBack] = useState(initialBack);
  const [hint, setHint] = useState(initialHint);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");

  const handleSave = async () => {
    if (loading) return;

    setLoading(true);
    setMsg("");

    try {
      await updateCard(cardId, {
        frontMd: front,
        backMd: back,
        hintMd: hint,
      });

      setMsg("Đã lưu thẻ!");
      onSaved?.();
    } catch (e: any) {
      setMsg("Lỗi khi lưu thẻ.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4 text-[var(--foreground)]">
      <div>
        <label className="block text-sm font-bold text-[var(--foreground)]">Mặt trước (front)</label>
        <textarea
          value={front}
          onChange={(e) => setFront(e.target.value)}
          className="mt-1 w-full rounded-xl border-[3px] border-b-[5px] border-[var(--border)] p-3 text-sm focus:border-[var(--primary)] outline-none transition-colors"
          rows={4}
        />
      </div>

      <div>
        <label className="block text-sm font-bold text-[var(--foreground)]">Mặt sau (back)</label>
        <textarea
          value={back}
          onChange={(e) => setBack(e.target.value)}
          className="mt-1 w-full rounded-xl border-[3px] border-b-[5px] border-[var(--border)] p-3 text-sm focus:border-[var(--primary)] outline-none transition-colors"
          rows={4}
        />
      </div>

      <div>
        <label className="block text-sm font-bold text-[var(--foreground)]">Gợi ý (hint)</label>
        <textarea
          value={hint}
          onChange={(e) => setHint(e.target.value)}
          className="mt-1 w-full rounded-xl border-[3px] border-b-[5px] border-[var(--border)] p-3 text-sm focus:border-[var(--primary)] outline-none transition-colors"
          rows={3}
        />
      </div>

      <button
        onClick={handleSave}
        disabled={loading}
        className="w-full rounded-full bg-[var(--primary)] border-b-[4px] border-[var(--primary-dark)] px-4 py-2.5 text-white font-bold hover:-translate-y-0.5 hover:border-b-[5px] active:translate-y-[2px] active:border-b-[2px] transition-all disabled:opacity-60"
      >
        {loading ? "Đang lưu..." : "Lưu thẻ"}
      </button>

      {msg && <p className="text-center text-sm font-bold text-[var(--text-muted)]">{msg}</p>}
    </div>
  );
}
