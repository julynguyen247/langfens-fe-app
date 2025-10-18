"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

// Nếu bạn đã có api helper thì thay bằng: import api from "@/utils/api";
// và dùng: await api.post("/api/flashcards/decks", payload)
async function createDeckAPI(payload: DeckPayload) {
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL ?? ""}/api/flashcards/decks`,
    {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }
  );
  if (!res.ok) {
    const msg = await res.text();
    throw new Error(msg || "Tạo deck thất bại");
  }
  return res.json();
}

type CardInput = {
  term: string;
  meaning: string;
  example?: string;
  imageUrl?: string;
};

type DeckPayload = {
  title: string;
  description?: string;
  tags?: string[];
  hasImage?: boolean;
  cards: CardInput[];
};

export default function CreateDeckPage() {
  const router = useRouter();

  const [deckTitle, setDeckTitle] = useState("");
  const [description, setDescription] = useState("");
  const [tags, setTags] = useState<string>("");
  const [hasImage, setHasImage] = useState(false);
  const [cards, setCards] = useState<CardInput[]>([
    { term: "", meaning: "", example: "", imageUrl: "" },
  ]);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string>("");

  const totalValidCards = useMemo(
    () => cards.filter((c) => c.term.trim() && c.meaning.trim()).length,
    [cards]
  );

  const canSubmit =
    deckTitle.trim().length >= 3 && totalValidCards > 0 && !submitting;

  const addCard = () =>
    setCards((prev) => [
      ...prev,
      { term: "", meaning: "", example: "", imageUrl: "" },
    ]);

  const removeCard = (idx: number) =>
    setCards((prev) => prev.filter((_, i) => i !== idx));

  const updateCard = (idx: number, key: keyof CardInput, value: string) =>
    setCards((prev) =>
      prev.map((c, i) => (i === idx ? { ...c, [key]: value } : c))
    );

  const moveCard = (from: number, to: number) => {
    if (to < 0 || to >= cards.length) return;
    setCards((prev) => {
      const clone = [...prev];
      const [item] = clone.splice(from, 1);
      clone.splice(to, 0, item);
      return clone;
    });
  };

  const handleSubmit = async () => {
    setError("");
    if (!canSubmit) return;
    try {
      setSubmitting(true);
      const payload: DeckPayload = {
        title: deckTitle.trim(),
        description: description.trim() || undefined,
        tags:
          tags
            .split(",")
            .map((t) => t.trim())
            .filter(Boolean) || undefined,
        hasImage,
        cards: cards
          .map((c) => ({
            term: c.term.trim(),
            meaning: c.meaning.trim(),
            example: c.example?.trim() || undefined,
            imageUrl:
              hasImage && c.imageUrl?.trim() ? c.imageUrl.trim() : undefined,
          }))
          .filter((c) => c.term && c.meaning),
      };

      // Gọi API tạo deck + cards
      await createDeckAPI(payload);

      // Điều hướng về danh sách flashcards hoặc trang deck chi tiết tuỳ bạn
      router.push("/flashcards");
    } catch (e: any) {
      setError(e?.message || "Có lỗi xảy ra. Vui lòng thử lại.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-6 text-indigo-900">
      {/* Header đơn giản – tuỳ bạn gắn PageHeader/PromoBanner nếu muốn */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Tạo bộ từ vựng (Deck)</h1>
        <div className="text-sm text-indigo-700/70">
          Hợp lệ: {totalValidCards}/{cards.length} thẻ
        </div>
      </div>

      {/* Thông tin Deck */}
      <section className="mt-6 rounded-xl border border-indigo-100 bg-white p-5 shadow-sm">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium">Tên Deck *</label>
            <input
              className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-indigo-500"
              placeholder="Ví dụ: 900 từ IELTS (có ảnh)"
              value={deckTitle}
              onChange={(e) => setDeckTitle(e.target.value)}
            />
            <p className="mt-1 text-xs text-slate-500">
              Tối thiểu 3 ký tự. Đừng trùng lặp với bộ có sẵn.
            </p>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">
              Tags (phân tách bằng dấu phẩy)
            </label>
            <input
              className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-indigo-500"
              placeholder="ielts, vocabulary, image"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
            />
          </div>

          <div className="md:col-span-2">
            <label className="mb-1 block text-sm font-medium">Mô tả</label>
            <textarea
              className="min-h-[90px] w-full resize-y rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-indigo-500"
              placeholder="Mô tả ngắn về nội dung, cách học, mục tiêu..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              id="hasImage"
              type="checkbox"
              checked={hasImage}
              onChange={(e) => setHasImage(e.target.checked)}
              className="h-4 w-4 accent-indigo-600"
            />
            <label htmlFor="hasImage" className="select-none text-sm">
              Deck có ảnh minh họa cho từng card
            </label>
          </div>
        </div>
      </section>

      {/* Danh sách Cards */}
      <section className="mt-6 rounded-xl border border-indigo-100 bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Thẻ (Cards)</h2>
          <div className="flex items-center gap-2">
            <button
              onClick={addCard}
              className="rounded-lg border border-indigo-300 px-3 py-1.5 text-sm font-medium text-indigo-700 hover:bg-indigo-50"
            >
              + Thêm thẻ
            </button>
          </div>
        </div>

        <div className="space-y-4">
          {cards.map((c, idx) => {
            const termErr = !c.term.trim();
            const meaningErr = !c.meaning.trim();

            return (
              <div
                key={idx}
                className="rounded-lg border border-slate-200 p-4 shadow-sm"
              >
                <div className="mb-3 flex items-center justify-between">
                  <div className="text-sm font-medium text-slate-600">
                    Thẻ #{idx + 1}
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => moveCard(idx, idx - 1)}
                      className="rounded border border-slate-300 px-2 py-1 text-xs hover:bg-slate-50"
                    >
                      ↑ Lên
                    </button>
                    <button
                      onClick={() => moveCard(idx, idx + 1)}
                      className="rounded border border-slate-300 px-2 py-1 text-xs hover:bg-slate-50"
                    >
                      ↓ Xuống
                    </button>
                    <button
                      onClick={() => removeCard(idx)}
                      className="rounded border border-rose-300 px-2 py-1 text-xs text-rose-600 hover:bg-rose-50"
                    >
                      Xóa
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-sm">
                      Từ/Thuật ngữ (term) *
                    </label>
                    <input
                      className={`w-full rounded-lg border px-3 py-2 outline-none focus:border-indigo-500 ${
                        termErr ? "border-rose-300" : "border-slate-300"
                      }`}
                      placeholder="Ex: alleviate"
                      value={c.term}
                      onChange={(e) => updateCard(idx, "term", e.target.value)}
                    />
                    {termErr && (
                      <p className="mt-1 text-xs text-rose-600">Bắt buộc.</p>
                    )}
                  </div>

                  <div>
                    <label className="mb-1 block text-sm">
                      Nghĩa/Định nghĩa (meaning) *
                    </label>
                    <input
                      className={`w-full rounded-lg border px-3 py-2 outline-none focus:border-indigo-500 ${
                        meaningErr ? "border-rose-300" : "border-slate-300"
                      }`}
                      placeholder="Ex: to make something less severe"
                      value={c.meaning}
                      onChange={(e) =>
                        updateCard(idx, "meaning", e.target.value)
                      }
                    />
                    {meaningErr && (
                      <p className="mt-1 text-xs text-rose-600">Bắt buộc.</p>
                    )}
                  </div>

                  <div className="md:col-span-2">
                    <label className="mb-1 block text-sm">
                      Ví dụ (optional)
                    </label>
                    <textarea
                      className="min-h-[70px] w-full resize-y rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-indigo-500"
                      placeholder="Ex: The new policies aim to alleviate traffic congestion."
                      value={c.example || ""}
                      onChange={(e) =>
                        updateCard(idx, "example", e.target.value)
                      }
                    />
                  </div>

                  {hasImage && (
                    <div className="md:col-span-2">
                      <label className="mb-1 block text-sm">
                        Ảnh minh họa (URL) (optional)
                      </label>
                      <input
                        className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-indigo-500"
                        placeholder="https://..."
                        value={c.imageUrl || ""}
                        onChange={(e) =>
                          updateCard(idx, "imageUrl", e.target.value)
                        }
                      />
                      <p className="mt-1 text-xs text-slate-500">
                        Bạn có thể upload lên storage riêng rồi dán URL vào đây.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Footer actions */}
      <section className="sticky bottom-0 mt-6 border-t border-indigo-100 bg-white/80 py-4 backdrop-blur supports-[backdrop-filter]:bg-white/60">
        {error && (
          <div className="mb-3 rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
            {error}
          </div>
        )}

        <div className="flex items-center justify-between">
          <div className="text-sm text-slate-500">
            Tối thiểu 1 thẻ hợp lệ. * là bắt buộc.
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => router.push("/flashcards")}
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm hover:bg-slate-50"
              disabled={submitting}
            >
              Hủy
            </button>
            <button
              onClick={handleSubmit}
              disabled={!canSubmit}
              className={`rounded-lg px-4 py-2 text-sm font-semibold ${
                canSubmit
                  ? "bg-[#3B82F6] text-slate-900 hover:brightness-95"
                  : "bg-slate-200 text-slate-500"
              }`}
            >
              {submitting ? "Đang tạo..." : "Tạo deck"}
            </button>
          </div>
        </div>
      </section>
    </main>
  );
}
