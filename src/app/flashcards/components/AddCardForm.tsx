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
    <div className="space-y-4  p-5 rounded-xl ">
      <div>
        <label className="block text-sm font-medium text-slate-700">
          Mặt trước (front)
        </label>
        <textarea
          value={front}
          onChange={(e) => setFront(e.target.value)}
          className="mt-1 w-full rounded-lg border border-blue-300 p-3 text-sm outline-none focus:border-[#317EFF]"
          rows={3}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700">
          Mặt sau (back)
        </label>
        <textarea
          value={back}
          onChange={(e) => setBack(e.target.value)}
          className="mt-1 w-full rounded-lg border border-blue-300 p-3 text-sm outline-none focus:border-[#317EFF]"
          rows={3}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700">
          Gợi ý (hint)
        </label>
        <textarea
          value={hint}
          onChange={(e) => setHint(e.target.value)}
          className="mt-1 w-full rounded-lg border border-blue-300 p-3 text-sm outline-none focus:border-[#317EFF]"
          rows={2}
        />
      </div>

      <button
        onClick={handleCreate}
        disabled={loading}
        className="w-full rounded-lg bg-blue-500 px-4 py-2 text-white font-medium hover:bg-blue-600 disabled:opacity-60"
      >
        {loading ? "Đang thêm..." : "Thêm thẻ"}
      </button>

      {msg && <p className="text-center text-sm text-slate-600">{msg}</p>}
    </div>
  );
}
