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
    <main className="min-h-screen w-full bg-[var(--background)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <h1
            className="text-3xl sm:text-4xl font-extrabold text-[var(--foreground)]"
            style={{ fontFamily: "var(--font-sans)" }}
          >
            Create Deck
          </h1>
          <div
            className="text-sm font-bold text-[var(--text-muted)] bg-white px-4 py-2 rounded-full border-[2px] border-[var(--border)]"
            style={{ fontFamily: "var(--font-mono)" }}
          >
            Valid cards: {totalValidCards}/{cards.length}
          </div>
        </div>

        {/* Deck Info */}
        <section className="bg-white border-[3px] border-[var(--border)] rounded-[2rem] shadow-[0_4px_0_rgba(0,0,0,0.08)] p-6 mb-6">
          <h2
            className="text-xl font-bold text-[var(--foreground)] mb-4"
            style={{ fontFamily: "var(--font-sans)" }}
          >
            Deck Details
          </h2>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label className="text-sm font-bold text-[var(--text-body)] block mb-1">
                Deck Name *
              </label>
              <input
                className={`w-full rounded-xl border-[3px] border-b-[5px] px-4 py-2.5 text-[var(--foreground)] font-medium outline-none transition-colors focus:border-[var(--primary)] ${
                  titleErr
                    ? "border-[var(--destructive)]"
                    : "border-[var(--border)]"
                }`}
                value={deckTitle}
                onChange={(e) => setDeckTitle(e.target.value)}
                placeholder="Enter deck name..."
              />
            </div>

            <div>
              <label className="text-sm font-bold text-[var(--text-body)] block mb-1">
                Category *
              </label>
              <select
                className={`w-full rounded-xl border-[3px] border-b-[5px] px-4 py-2.5 text-[var(--foreground)] font-medium outline-none transition-colors focus:border-[var(--primary)] bg-white ${
                  categoryErr
                    ? "border-[var(--destructive)]"
                    : "border-[var(--border)]"
                }`}
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              >
                <option value="">-- Select --</option>
                <option value="ielts">IELTS</option>
                <option value="toeic">TOEIC</option>
                <option value="general">General</option>
              </select>
            </div>

            <div>
              <label className="text-sm font-bold text-[var(--text-body)] block mb-1">
                Status
              </label>
              <select
                className="w-full rounded-xl border-[3px] border-b-[5px] border-[var(--border)] px-4 py-2.5 text-[var(--foreground)] font-medium outline-none transition-colors focus:border-[var(--primary)] bg-white"
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
              <label className="text-sm font-bold text-[var(--text-body)] block mb-1">
                Description
              </label>
              <textarea
                className="min-h-[90px] w-full rounded-xl border-[3px] border-b-[5px] border-[var(--border)] px-4 py-2.5 text-[var(--foreground)] font-medium outline-none transition-colors focus:border-[var(--primary)]"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe this deck..."
              />
            </div>
          </div>
        </section>

        {/* Cards */}
        <section className="bg-white border-[3px] border-[var(--border)] rounded-[2rem] shadow-[0_4px_0_rgba(0,0,0,0.08)] p-6 mb-6">
          <div className="mb-4 flex items-center justify-between">
            <h2
              className="text-xl font-bold text-[var(--foreground)]"
              style={{ fontFamily: "var(--font-sans)" }}
            >
              Cards
            </h2>
            <button
              onClick={addCard}
              className="px-5 py-2 rounded-full bg-[var(--primary)] text-white text-sm font-bold border-b-[4px] border-[var(--primary-dark)] hover:-translate-y-0.5 hover:border-b-[5px] active:translate-y-[2px] active:border-b-[2px] transition-all"
            >
              + Add card
            </button>
          </div>

          <div className="space-y-4">
            {cards.map((card, i) => {
              const termErr = !card.term.trim();
              const meaningErr = !card.meaning.trim();

              return (
                <div
                  key={i}
                  className="rounded-[2rem] border-[3px] border-[var(--border)] shadow-[0_4px_0_rgba(0,0,0,0.08)] p-4"
                >
                  <div className="mb-3 flex justify-between items-center">
                    <span
                      className="text-sm font-bold text-[var(--text-body)] bg-[var(--background)] px-3 py-1 rounded-full"
                      style={{ fontFamily: "var(--font-mono)" }}
                    >
                      Card #{i + 1}
                    </span>
                    {cards.length > 1 && (
                      <button
                        onClick={() => removeCard(i)}
                        className="text-sm font-bold text-[var(--destructive)] hover:underline"
                      >
                        Remove
                      </button>
                    )}
                  </div>

                  <div className="grid gap-3 md:grid-cols-2">
                    <input
                      placeholder="Term *"
                      className={`rounded-xl border-[3px] border-b-[5px] px-4 py-2.5 text-[var(--foreground)] font-medium outline-none transition-colors focus:border-[var(--primary)] ${
                        termErr
                          ? "border-[var(--destructive)]"
                          : "border-[var(--border)]"
                      }`}
                      value={card.term}
                      onChange={(e) => updateCard(i, { term: e.target.value })}
                    />
                    <input
                      placeholder="Meaning *"
                      className={`rounded-xl border-[3px] border-b-[5px] px-4 py-2.5 text-[var(--foreground)] font-medium outline-none transition-colors focus:border-[var(--primary)] ${
                        meaningErr
                          ? "border-[var(--destructive)]"
                          : "border-[var(--border)]"
                      }`}
                      value={card.meaning}
                      onChange={(e) =>
                        updateCard(i, { meaning: e.target.value })
                      }
                    />
                    <textarea
                      placeholder="Example (optional)"
                      className="md:col-span-2 rounded-xl border-[3px] border-b-[5px] border-[var(--border)] px-4 py-2.5 text-[var(--foreground)] font-medium outline-none transition-colors focus:border-[var(--primary)]"
                      value={card.example || ""}
                      onChange={(e) =>
                        updateCard(i, { example: e.target.value })
                      }
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Footer */}
        <section className="sticky bottom-0 bg-white/90 backdrop-blur border-[3px] border-[var(--border)] rounded-[2rem] shadow-[0_4px_0_rgba(0,0,0,0.08)] p-4">
          {error && (
            <div className="mb-3 rounded-xl bg-red-50 border-[2px] border-[var(--destructive)]/30 p-3 text-sm font-bold text-[var(--destructive)]">
              {error}
            </div>
          )}

          <div className="flex items-center justify-between">
            <span className="text-sm font-bold text-[var(--text-muted)]">
              Minimum 1 valid card required
            </span>
            <button
              onClick={handleSubmit}
              disabled={!canSubmit}
              className={`px-6 py-2.5 rounded-full text-sm font-bold transition-all ${
                canSubmit
                  ? "bg-[var(--primary)] text-white border-b-[4px] border-[var(--primary-dark)] hover:-translate-y-0.5 hover:border-b-[5px] active:translate-y-[2px] active:border-b-[2px]"
                  : "bg-[var(--border)] text-[var(--text-muted)] cursor-not-allowed"
              }`}
            >
              {submitting ? "Creating..." : "Save Deck"}
            </button>
          </div>
        </section>
      </div>
    </main>
  );
}
