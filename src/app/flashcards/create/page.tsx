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
  imageUrl?: string;
};

export default function CreateDeckPage() {
  const router = useRouter();

  const [deckTitle, setDeckTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<string>("");
  const [status, setStatus] = useState<"draft" | "published">("published");

  const [tags, setTags] = useState<string>("");
  const [hasImage, setHasImage] = useState(false);

  const [card, setCard] = useState<SingleCard>({
    term: "",
    meaning: "",
    example: "",
    imageUrl: "",
  });
  const { user } = useUserStore();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string>("");

  const termErr = !card.term.trim();
  const meaningErr = !card.meaning.trim();
  const titleErr = deckTitle.trim().length < 3;
  const categoryErr = !category.trim();

  const totalValidCards = useMemo(
    () => (termErr || meaningErr ? 0 : 1),
    [termErr, meaningErr]
  );

  const canSubmit =
    !titleErr && !categoryErr && totalValidCards === 1 && !submitting;

  const handleSubmit = async () => {
    if (!user) return;
    setError("");
    if (!canSubmit) return;

    try {
      setSubmitting(true);

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

      if (!deckId) throw new Error("Không tìm thấy deckId từ API /deck.");

      await createDeckCard(deckId, {
        frontMd: card.term.trim(),
        backMd: card.meaning.trim(),
        hintMd: card.example?.trim() || undefined,
      });

      router.push("/flashcards");
    } catch (e: any) {
      const msg =
        e?.response?.data?.message ||
        e?.message ||
        "Có lỗi xảy ra. Vui lòng thử lại.";
      setError(String(msg));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-6 text-indigo-900">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Tạo bộ từ vựng (Deck)</h1>
        <div className="text-sm text-indigo-700/70">
          Hợp lệ: {totalValidCards}/1 thẻ
        </div>
      </div>

      <section className="mt-6 rounded-xl border border-indigo-100 bg-white p-5 shadow-sm">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium">Tên Deck *</label>
            <input
              className={`w-full rounded-lg border px-3 py-2 outline-none focus:border-indigo-500 ${
                titleErr ? "border-rose-300" : "border-slate-300"
              }`}
              placeholder="Ví dụ: 900 từ IELTS (1 thẻ mẫu)"
              value={deckTitle}
              onChange={(e) => setDeckTitle(e.target.value)}
            />
            <p className="mt-1 text-xs text-slate-500">Tối thiểu 3 ký tự.</p>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">Category *</label>
            <select
              className={`w-full rounded-lg border px-3 py-2 outline-none focus:border-indigo-500 ${
                categoryErr ? "border-rose-300" : "border-slate-300"
              }`}
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              <option value="">-- Chọn category --</option>
              <option value="ielts">IELTS</option>
              <option value="toeic">TOEIC</option>
              <option value="general">General</option>
              <option value="business">Business</option>
              <option value="academic">Academic</option>
            </select>
            {categoryErr && (
              <p className="mt-1 text-xs text-rose-600">Bắt buộc.</p>
            )}
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">Status *</label>
            <select
              className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-indigo-500"
              value={status}
              onChange={(e) =>
                setStatus(e.target.value as "draft" | "published")
              }
            >
              <option value="published">Published</option>
              <option value="draft">Draft</option>
            </select>
            <p className="mt-1 text-xs text-slate-500">
              Có thể tạo ở dạng bản nháp để sửa sau.
            </p>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">
              Tags (chỉ hiển thị)
            </label>
            <input
              className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-indigo-500"
              placeholder="ielts, vocabulary"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
            />
          </div>

          <div className="md:col-span-2">
            <label className="mb-1 block text-sm font-medium">Mô tả</label>
            <textarea
              className="min-h-[90px] w-full resize-y rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-indigo-500"
              placeholder="Mô tả ngắn về bộ từ vựng..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
        </div>
      </section>

      <section className="mt-6 rounded-xl border border-indigo-100 bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Thẻ (Cards)</h2>
        </div>

        <div className="rounded-lg border border-slate-200 p-4 shadow-sm">
          <div className="mb-3 text-sm font-medium text-slate-600">Thẻ #1</div>

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
                value={card.term}
                onChange={(e) =>
                  setCard((p) => ({ ...p, term: e.target.value }))
                }
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
                value={card.meaning}
                onChange={(e) =>
                  setCard((p) => ({ ...p, meaning: e.target.value }))
                }
              />
              {meaningErr && (
                <p className="mt-1 text-xs text-rose-600">Bắt buộc.</p>
              )}
            </div>

            <div className="md:col-span-2">
              <label className="mb-1 block text-sm">Ví dụ (optional)</label>
              <textarea
                className="min-h-[70px] w-full resize-y rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-indigo-500"
                placeholder="Ex: The new policies aim to alleviate traffic congestion."
                value={card.example || ""}
                onChange={(e) =>
                  setCard((p) => ({ ...p, example: e.target.value }))
                }
              />
            </div>
          </div>
        </div>
      </section>
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
                  ? "bg-[#3B82F6] text-white hover:brightness-95"
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
