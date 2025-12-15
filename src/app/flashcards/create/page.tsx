"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createDeck, createDeckCard } from "@/utils/api";
import { useUserStore } from "@/app/store/userStore";

function slugify(input: string) {
  return input
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
}

type SingleCard = {
  term: string;
  meaning: string;
  example?: string;
};

export default function CreateDeckPage() {
  const router = useRouter();
  const { user } = useUserStore();

  /* ---------------- deck ---------------- */
  const [deckTitle, setDeckTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [status, setStatus] = useState<"draft" | "published">("published");

  /* ---------------- cards ---------------- */
  const [cards, setCards] = useState<SingleCard[]>([
    { term: "", meaning: "", example: "" },
  ]);

  /* ---------------- ui state ---------------- */
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  /* ---------------- validate ---------------- */
  const titleErr = deckTitle.trim().length < 3;
  const categoryErr = !category.trim();

  const isValidCard = (c: SingleCard) => c.term.trim() && c.meaning.trim();

  const totalValidCards = useMemo(
    () => cards.filter(isValidCard).length,
    [cards]
  );

  const canSubmit =
    !titleErr && !categoryErr && totalValidCards >= 1 && !submitting;

  /* ---------------- handlers ---------------- */
  const addCard = () => {
    setCards((prev) => [...prev, { term: "", meaning: "", example: "" }]);
  };

  const removeCard = (index: number) => {
    setCards((prev) => prev.filter((_, i) => i !== index));
  };

  const updateCard = (index: number, patch: Partial<SingleCard>) => {
    setCards((prev) =>
      prev.map((c, i) => (i === index ? { ...c, ...patch } : c))
    );
  };

  const handleSubmit = async () => {
    if (!user || !canSubmit) return;
    setError("");

    try {
      setSubmitting(true);

      /* ---- create deck ---- */
      const deckRes = await createDeck({
        slug: slugify(deckTitle.trim()),
        title: deckTitle.trim(),
        descriptionMd: description.trim(),
        category: category.trim(),
        status,
        userId: user.id,
      });

      const resData = (deckRes as any)?.data ?? deckRes;
      const deckId =
        resData?.data?.id ??
        resData?.id ??
        resData?.deckId ??
        resData?.data?.deckId;

      if (!deckId) {
        throw new Error("Không lấy được deckId từ API");
      }

      /* ---- create cards ---- */
      const validCards = cards.filter(isValidCard);

      await Promise.all(
        validCards.map((card) =>
          createDeckCard(deckId, {
            frontMd: card.term.trim(),
            backMd: card.meaning.trim(),
            hintMd: card.example?.trim() || undefined,
          })
        )
      );

      router.push("/flashcards");
    } catch (e: any) {
      setError(
        e?.response?.data?.message ||
          e?.message ||
          "Có lỗi xảy ra, vui lòng thử lại."
      );
    } finally {
      setSubmitting(false);
    }
  };

  /* ---------------- render ---------------- */
  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-6 text-indigo-900">
      {/* header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Tạo bộ từ vựng</h1>
        <div className="text-sm text-indigo-700/70">
          Thẻ hợp lệ: {totalValidCards}/{cards.length}
        </div>
      </div>

      {/* deck info */}
      <section className="mt-6 rounded-xl border bg-white p-5 shadow-sm">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <label className="text-sm font-medium">Tên Deck *</label>
            <input
              className={`mt-1 w-full rounded-lg border px-3 py-2 ${
                titleErr ? "border-rose-300" : "border-slate-300"
              }`}
              value={deckTitle}
              onChange={(e) => setDeckTitle(e.target.value)}
            />
          </div>

          <div>
            <label className="text-sm font-medium">Category *</label>
            <select
              className={`mt-1 w-full rounded-lg border px-3 py-2 ${
                categoryErr ? "border-rose-300" : "border-slate-300"
              }`}
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              <option value="">-- Chọn --</option>
              <option value="ielts">IELTS</option>
              <option value="toeic">TOEIC</option>
              <option value="general">General</option>
            </select>
          </div>

          <div>
            <label className="text-sm font-medium">Status</label>
            <select
              className="mt-1 w-full rounded-lg border px-3 py-2"
              value={status}
              onChange={(e) =>
                setStatus(e.target.value as "draft" | "published")
              }
            >
              <option value="published">Published</option>
              <option value="draft">Draft</option>
            </select>
          </div>

          <div className="md:col-span-2">
            <label className="text-sm font-medium">Mô tả</label>
            <textarea
              className="mt-1 min-h-[90px] w-full rounded-lg border px-3 py-2"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
        </div>
      </section>

      {/* cards */}
      <section className="mt-6 rounded-xl border bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Cards</h2>
          <button
            onClick={addCard}
            className="rounded-lg bg-indigo-600 px-3 py-1.5 text-sm text-white"
          >
            + Thêm card
          </button>
        </div>

        <div className="space-y-4">
          {cards.map((card, i) => {
            const termErr = !card.term.trim();
            const meaningErr = !card.meaning.trim();

            return (
              <div key={i} className="rounded-lg border border-slate-200 p-4">
                <div className="mb-2 flex justify-between">
                  <span className="text-sm font-medium">Thẻ #{i + 1}</span>
                  {cards.length > 1 && (
                    <button
                      onClick={() => removeCard(i)}
                      className="text-sm text-rose-600"
                    >
                      Xóa
                    </button>
                  )}
                </div>

                <div className="grid gap-3 md:grid-cols-2">
                  <input
                    placeholder="Term *"
                    className={`rounded-lg border px-3 py-2 ${
                      termErr ? "border-rose-300" : "border-slate-300"
                    }`}
                    value={card.term}
                    onChange={(e) => updateCard(i, { term: e.target.value })}
                  />
                  <input
                    placeholder="Meaning *"
                    className={`rounded-lg border px-3 py-2 ${
                      meaningErr ? "border-rose-300" : "border-slate-300"
                    }`}
                    value={card.meaning}
                    onChange={(e) => updateCard(i, { meaning: e.target.value })}
                  />
                  <textarea
                    placeholder="Example (optional)"
                    className="md:col-span-2 rounded-lg border px-3 py-2"
                    value={card.example || ""}
                    onChange={(e) => updateCard(i, { example: e.target.value })}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* footer */}
      <section className="sticky bottom-0 mt-6 border-t bg-white/80 py-4 backdrop-blur">
        {error && (
          <div className="mb-3 rounded-lg bg-rose-50 p-3 text-sm text-rose-700">
            {error}
          </div>
        )}

        <div className="flex justify-between">
          <span className="text-sm text-slate-500">
            Tối thiểu 1 card hợp lệ
          </span>
          <button
            onClick={handleSubmit}
            disabled={!canSubmit}
            className={`rounded-lg px-4 py-2 text-sm font-semibold ${
              canSubmit
                ? "bg-indigo-600 text-white"
                : "bg-slate-200 text-slate-500"
            }`}
          >
            {submitting ? "Đang tạo..." : "Tạo deck"}
          </button>
        </div>
      </section>
    </main>
  );
}
