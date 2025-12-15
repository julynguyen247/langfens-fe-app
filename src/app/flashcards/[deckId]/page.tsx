"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import StudyHeader from "../components/study/StudyHeader";
import ProgressBar from "../components/study/ProgressBar";
import Flashcard from "../components/study/Flashcard";
import SRFooter from "../components/study/SRFooter";
import useDeckStudy from "../components/study/useDeckStudy";
import {
  getDeckCards,
  getDueFlashcards,
  reviewFlashcard,
  getFlashcardProgress,
} from "@/utils/api";
import { useUserStore } from "@/app/store/userStore";

type ApiCard = {
  id: string;
  idx: number;
  frontMd: string;
  backMd: string;
  hintMd?: string;
};

type ReviewResult = {
  cardId?: string;
  repetition?: number;
  easeFactor?: number;
  intervalDays?: number;
  nextDue?: string;
};

type SRStats = {
  new: number;
  learning: number;
  review: number;
  dueToday: number;
};

export default function StudyPage() {
  const { deckId } = useParams<{ deckId: string }>();
  const { user } = useUserStore();

  const [cards, setCards] = useState<ApiCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sessionTotal, setSessionTotal] = useState(0);
  const [hadSession, setHadSession] = useState(false);
  const [lastReview, setLastReview] = useState<ReviewResult | null>(null);
  const [stats, setStats] = useState<SRStats>({
    new: 0,
    learning: 0,
    review: 0,
    dueToday: 0,
  });

  useEffect(() => {
    setSessionTotal(0);
    setHadSession(false);
    setLastReview(null);
  }, [deckId]);

  useEffect(() => {
    let mounted = true;

    async function loadAll() {
      setLoading(true);
      setError(null);

      try {
        let list: ApiCard[] = [];

        if (user?.id) {
          const res = await getDueFlashcards(user.id, 50);
          const payload = Array.isArray(res.data)
            ? res.data
            : res.data?.data ?? [];
          list = (payload ?? [])
            .slice()
            .sort((a: any, b: any) => (a.idx ?? 0) - (b.idx ?? 0));
        }

        if ((!list || list.length === 0) && deckId) {
          const res = await getDeckCards(String(deckId));
          const payload = Array.isArray(res.data)
            ? res.data
            : res.data?.data ?? [];
          list = (payload ?? [])
            .slice()
            .sort((a: any, b: any) => (a.idx ?? 0) - (b.idx ?? 0));
        }

        if (mounted) {
          setCards(list);
          if (list.length > 0) {
            setSessionTotal(list.length);
            setHadSession(true);
          }
        }

        if (user?.id) {
          try {
            const sres = await getFlashcardProgress(user.id);
            const sdata = Array.isArray(sres.data)
              ? sres.data[0]
              : sres.data?.data ?? sres.data;

            const nextStats: SRStats = {
              new: Number(sdata?.new ?? 0),
              learning: Number(sdata?.learning ?? 0),
              review: Number(sdata?.review ?? 0),
              dueToday: Number(sdata?.dueToday ?? sdata?.due ?? 0),
            };

            if (mounted) setStats(nextStats);
          } catch {}
        }
      } catch (e: any) {
        if (mounted) setError(e?.message || "Không tải được danh sách thẻ.");
      } finally {
        if (mounted) setLoading(false);
      }
    }

    loadAll();

    return () => {
      mounted = false;
    };
  }, [user?.id, deckId]);

  useEffect(() => {
    if (cards.length > 0) {
      setSessionTotal(cards.length);
      setHadSession(true);
    }
  }, [cards.length]);

  const transformed = useMemo(
    () =>
      cards.map((c) => ({
        id: c.id,
        front: c.frontMd,
        back: c.backMd,
        example: c.hintMd || "",
      })),
    [cards]
  );

  const study = useDeckStudy(transformed);

  const refreshProgress = useCallback(async () => {
    if (!user?.id) return;

    try {
      const sres = await getFlashcardProgress(user.id);
      const sdata = Array.isArray(sres.data)
        ? sres.data[0]
        : sres.data?.data ?? sres.data;

      setStats({
        new: Number(sdata?.new ?? 0),
        learning: Number(sdata?.learning ?? 0),
        review: Number(sdata?.review ?? 0),
        dueToday: Number(sdata?.dueToday ?? sdata?.due ?? 0),
      });
    } catch {}
  }, [user?.id]);

  const handleGrade = useCallback(
    async (g: "again" | "hard" | "good" | "easy") => {
      if (!study?.card) return;

      const gradeMap: Record<"again" | "hard" | "good" | "easy", number> = {
        again: 0,
        hard: 1,
        good: 2,
        easy: 3,
      };

      if (typeof (study as any).grade === "function") {
        (study as any).grade(g);
      } else {
        if (g === "again") study.again();
        else study.know();
      }

      const isLastInQueue =
        (g === "good" || g === "easy") && study.stats.dueToday <= 1;

      try {
        if (user?.id) {
          const res = await reviewFlashcard(
            user.id,
            study.card.id,
            gradeMap[g]
          );
          const reviewData =
            (res as any)?.data?.data ?? (res as any)?.data ?? null;
          if (reviewData) {
            setLastReview(reviewData);
          }
          refreshProgress();
        }
      } catch {}

      if (isLastInQueue) {
        try {
          let list: ApiCard[] = [];

          if (user?.id) {
            const res = await getDueFlashcards(user.id, 50);
            const payload = Array.isArray(res.data)
              ? res.data
              : res.data?.data ?? [];
            list = (payload ?? [])
              .slice()
              .sort((a: any, b: any) => (a.idx ?? 0) - (b.idx ?? 0));
          }

          if ((!list || list.length === 0) && deckId) {
            const res = await getDeckCards(String(deckId));
            const payload = Array.isArray(res.data)
              ? res.data
              : res.data?.data ?? [];
            list = (payload ?? [])
              .slice()
              .sort((a: any, b: any) => (a.idx ?? 0) - (b.idx ?? 0));
          }

          setCards(list);
          if (list.length > 0) {
            setSessionTotal(list.length);
            setHadSession(true);
          }
        } catch {}
      }
    },
    [study, user?.id, refreshProgress, deckId]
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!study) return;

      if (e.code === "Space") {
        e.preventDefault();
        study.flip();
        return;
      }
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        study.prev();
        return;
      }
      if (e.key === "ArrowRight") {
        e.preventDefault();
        study.next();
        return;
      }
      if (e.key === "1") {
        e.preventDefault();
        handleGrade("again");
        return;
      }
      if (e.key === "2") {
        e.preventDefault();
        handleGrade("hard");
        return;
      }
      if (e.key === "3") {
        e.preventDefault();
        handleGrade("good");
        return;
      }
      if (e.key === "4") {
        e.preventDefault();
        handleGrade("easy");
        return;
      }
    };

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [study, handleGrade]);

  const hasCard = !!study?.card;
  const remaining = study?.stats?.dueToday ?? 0;
  const totalForProgress = sessionTotal || study?.total || cards.length || 0;
  const completed = Math.max(0, totalForProgress - remaining);
  const currentCardNumber = totalForProgress
    ? Math.min(totalForProgress, completed + (hasCard ? 1 : 0))
    : 0;
  const finished = hadSession && remaining === 0;
  const booting = cards.length > 0 && !hasCard && !finished;

  const progressPct = totalForProgress
    ? Math.round((currentCardNumber / totalForProgress) * 100)
    : 0;

  const formatEaseFactor = (value?: number) => {
    if (value === undefined || value === null) return "0.00";
    const num = Number(value);
    if (Number.isNaN(num)) return "0.00";
    return num.toFixed(2);
  };

  const formatNextDue = (value?: string) => {
    if (!value) return null;
    const dt = new Date(value);
    if (Number.isNaN(dt.getTime())) return null;
    return dt.toLocaleString("vi-VN", {
      hour: "2-digit",
      minute: "2-digit",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
  };

  if (loading) {
    return (
      <main className="mx-auto max-w-4xl px-4 py-6 text-center text-slate-600">
        Đang tải thẻ...
      </main>
    );
  }

  if (error) {
    return (
      <main className="mx-auto max-w-4xl px-4 py-6 text-center text-red-600">
        {error}
      </main>
    );
  }

  if (!cards.length && !finished) {
    return (
      <main className="mx-auto max-w-4xl px-4 py-6 text-center text-slate-600">
        Không có thẻ đến hạn ôn (hoặc bộ này chưa có thẻ).
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-4xl px-4 py-6">
      <StudyHeader
        deckTitle={``}
        current={currentCardNumber}
        total={totalForProgress}
        onExit={study.handleExit}
      />

      <div className="mt-4">
        <div className="flex items-center justify-between text-xs text-slate-500">
          <span>Tiến độ</span>
          <span>{Math.min(progressPct, 100)}%</span>
        </div>
        <ProgressBar value={Math.min(progressPct, 100)} />
      </div>

      <section className="mt-6">
        {finished ? (
          <div className="rounded-2xl border bg-white p-8 text-center shadow-sm">
            <div className="text-xl font-semibold text-slate-900">
              Đã hết thẻ 🎉
            </div>
            <div className="mt-2 text-sm text-slate-600">
              Bạn đã ôn xong toàn bộ thẻ trong lượt này.
            </div>
            {lastReview && (
              <div className="mt-6 rounded-xl bg-slate-50 p-4 text-left text-slate-700">
                <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Lịch nhắc lại (SM-2)
                </div>
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  <div className="rounded-lg bg-white px-3 py-2 ring-1 ring-slate-200">
                    <div className="text-xs text-slate-500">Lặp lại</div>
                    <div className="text-base font-semibold text-slate-900">
                      {lastReview.repetition ?? 0}
                    </div>
                  </div>
                  <div className="rounded-lg bg-white px-3 py-2 ring-1 ring-slate-200">
                    <div className="text-xs text-slate-500">Hệ số dễ</div>
                    <div className="text-base font-semibold text-slate-900">
                      {formatEaseFactor(lastReview.easeFactor)}
                    </div>
                  </div>
                  <div className="rounded-lg bg-white px-3 py-2 ring-1 ring-slate-200">
                    <div className="text-xs text-slate-500">Khoảng cách</div>
                    <div className="text-base font-semibold text-slate-900">
                      {lastReview.intervalDays ?? 0} ngày
                    </div>
                  </div>
                  <div className="rounded-lg bg-white px-3 py-2 ring-1 ring-slate-200">
                    <div className="text-xs text-slate-500">Mã thẻ</div>
                    <div className="text-base font-semibold text-slate-900">
                      {lastReview.cardId ?? "--"}
                    </div>
                  </div>
                </div>
                {formatNextDue(lastReview.nextDue) && (
                  <div className="mt-3 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800">
                    Thẻ sẽ đến hạn vào{" "}
                    <span className="font-semibold">
                      {formatNextDue(lastReview.nextDue)}
                    </span>
                  </div>
                )}
              </div>
            )}
            <div className="mt-5 flex items-center justify-center gap-2">
              <button
                onClick={() => window.location.reload()}
                className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-slate-800 hover:bg-gray-50"
              >
                Tải lại
              </button>
              <button
                onClick={study.handleExit}
                className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:opacity-95"
              >
                Thoát
              </button>
            </div>
          </div>
        ) : booting ? (
          <div className="rounded-2xl border bg-white p-6 shadow-sm">
            <div className="h-5 w-28 animate-pulse rounded bg-gray-200" />
            <div className="mt-4 h-8 w-3/5 animate-pulse rounded bg-gray-200" />
            <div className="mt-2 h-8 w-2/5 animate-pulse rounded bg-gray-200" />
            <div className="mt-6 h-24 w-full animate-pulse rounded bg-gray-100" />
            <div className="mt-6 flex gap-3">
              <div className="h-9 w-24 animate-pulse rounded bg-gray-200" />
              <div className="h-9 w-24 animate-pulse rounded bg-gray-200" />
              <div className="h-9 w-24 animate-pulse rounded bg-gray-200" />
            </div>
          </div>
        ) : hasCard ? (
          <div className="relative">
            {!study.flipped && (
              <div className="absolute inset-x-0 -top-6 mx-auto w-max rounded-full bg-slate-50 px-3 py-1 text-[11px] text-slate-500 ring-1 ring-slate-200">
                Nhấn{" "}
                <kbd className="rounded border px-1 text-[10px]">Space</kbd> để
                lật
              </div>
            )}
            <Flashcard
              key={study.card!.id}
              card={study.card!}
              flipped={study.flipped}
              onFlip={study.flip}
            />
          </div>
        ) : (
          <div className="rounded-lg border bg-white p-6 text-center text-slate-600">
            Không tìm thấy thẻ hợp lệ.
          </div>
        )}
      </section>

      {hasCard && !finished && (
        <SRFooter
          flipped={study.flipped}
          onFlip={study.flip}
          onGrade={handleGrade}
          onPrev={study.prev}
          onNext={study.next}
          index={currentCardNumber ? currentCardNumber - 1 : study.index}
          total={totalForProgress}
          shuffle={study.shuffle}
          onToggleShuffle={study.toggleShuffle}
        />
      )}
    </main>
  );
}
