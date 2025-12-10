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
    <div className="space-y-4 text-black">
      <div>
        <label className="block text-sm font-medium ">Mặt trước (front)</label>
        <textarea
          value={front}
          onChange={(e) => setFront(e.target.value)}
          className="mt-1 w-full rounded-lg border border-blue-200 p-3 text-sm focus:border-[#317EFF]  outline-none"
          rows={4}
        />
      </div>

      <div>
        <label className="block text-sm font-medium ">Mặt sau (back)</label>
        <textarea
          value={back}
          onChange={(e) => setBack(e.target.value)}
          className="mt-1 w-full rounded-lg border border-blue-200 p-3 text-sm focus:border-[#317EFF]  outline-none"
          rows={4}
        />
      </div>

      <div>
        <label className="block text-sm font-medium ">Gợi ý (hint)</label>
        <textarea
          value={hint}
          onChange={(e) => setHint(e.target.value)}
          className="mt-1 w-full rounded-lg border border-blue-200 p-3 text-sm focus:border-[#317EFF]  outline-none"
          rows={3}
        />
      </div>

      <button
        onClick={handleSave}
        disabled={loading}
        className="w-full rounded-lg bg-[#317EFF] px-4 py-2 text-white font-medium hover:bg-indigo-700 disabled:opacity-60"
      >
        {loading ? "Đang lưu..." : "Lưu thẻ"}
      </button>

      {msg && <p className="text-center text-sm text-slate-600">{msg}</p>}
    </div>
  );
}
