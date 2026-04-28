"use client";

import { useState } from "react";
import { createDeckCard } from "@/utils/api";

export default function AddCardForm({
  deckId,
  onSaved,
}: {
  deckId: string;
  onSaved?: () => void;
}) {
  const [front, setFront] = useState("");
  const [back, setBack] = useState("");
  const [hint, setHint] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");

  const handleCreate = async () => {
    if (loading) return;
    setLoading(true);
    setMsg("");

    try {
      await createDeckCard(deckId, {
        frontMd: front,
        backMd: back,
        hintMd: hint,
      });

      setMsg("Đã thêm thẻ!");
      setFront("");
      setBack("");
      setHint("");
      onSaved?.();
    } catch {
      setMsg("Lỗi khi thêm thẻ.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4 p-5 rounded-[2rem] border-[3px] border-[var(--border)] shadow-[0_4px_0_rgba(0,0,0,0.08)]">
      <div>
        <label className="block text-sm font-bold text-[var(--foreground)]">
          Mặt trước (front)
        </label>
        <textarea
          value={front}
          onChange={(e) => setFront(e.target.value)}
          className="mt-1 w-full rounded-xl border-[3px] border-b-[5px] border-[var(--border)] p-3 text-sm outline-none focus:border-[var(--primary)] transition-colors"
          rows={3}
        />
      </div>

      <div>
        <label className="block text-sm font-bold text-[var(--foreground)]">
          Mặt sau (back)
        </label>
        <textarea
          value={back}
          onChange={(e) => setBack(e.target.value)}
          className="mt-1 w-full rounded-xl border-[3px] border-b-[5px] border-[var(--border)] p-3 text-sm outline-none focus:border-[var(--primary)] transition-colors"
          rows={3}
        />
      </div>

      <div>
        <label className="block text-sm font-bold text-[var(--foreground)]">
          Gợi ý (hint)
        </label>
        <textarea
          value={hint}
          onChange={(e) => setHint(e.target.value)}
          className="mt-1 w-full rounded-xl border-[3px] border-b-[5px] border-[var(--border)] p-3 text-sm outline-none focus:border-[var(--primary)] transition-colors"
          rows={2}
        />
      </div>

      <button
        onClick={handleCreate}
        disabled={loading}
        className="w-full rounded-full bg-[var(--primary)] border-b-[4px] border-[var(--primary-dark)] px-4 py-2.5 text-white font-bold hover:-translate-y-0.5 hover:border-b-[5px] active:translate-y-[2px] active:border-b-[2px] transition-all disabled:opacity-60"
      >
        {loading ? "Đang thêm..." : "Thêm thẻ"}
      </button>

      {msg && <p className="text-center text-sm font-bold text-[var(--text-muted)]">{msg}</p>}
    </div>
  );
}
