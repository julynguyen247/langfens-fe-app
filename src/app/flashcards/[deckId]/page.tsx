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
        if (mounted) setError(e?.message || "Failed to load cards.");
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
      <main className="min-h-screen w-full bg-[var(--background)]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 text-center">
          <div className="bg-white border-[3px] border-[var(--border)] rounded-[2rem] shadow-[0_4px_0_rgba(0,0,0,0.08)] p-8">
            <p className="text-[var(--text-muted)] font-bold">Loading cards...</p>
          </div>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="min-h-screen w-full bg-[var(--background)]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 text-center">
          <div className="bg-white border-[3px] border-[var(--destructive)]/30 rounded-[2rem] shadow-[0_4px_0_rgba(0,0,0,0.08)] p-8">
            <p className="text-[var(--destructive)] font-bold">{error}</p>
          </div>
        </div>
      </main>
    );
  }

  if (!cards.length && !finished) {
    return (
      <main className="min-h-screen w-full bg-[var(--background)]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 text-center">
          <div className="bg-white border-[3px] border-[var(--border)] rounded-[2rem] shadow-[0_4px_0_rgba(0,0,0,0.08)] p-8">
            <p className="text-[var(--text-muted)] font-bold">
              No cards due for review (or this deck has no cards yet).
            </p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen w-full bg-[var(--background)]">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <StudyHeader
          deckTitle={``}
          current={currentCardNumber}
          total={totalForProgress}
          onExit={study.handleExit}
        />

        <div className="mt-4">
          <div className="flex items-center justify-between text-xs font-bold text-[var(--text-muted)] mb-1">
            <span>Progress</span>
            <span style={{ fontFamily: "var(--font-mono)" }}>
              {currentCardNumber} / {totalForProgress}
            </span>
          </div>
          <ProgressBar value={Math.min(progressPct, 100)} />
        </div>

        <section className="mt-6">
          {finished ? (
            <div className="bg-white border-[3px] border-[var(--border)] rounded-[2rem] shadow-[0_4px_0_rgba(0,0,0,0.08)] p-8 text-center">
              <div
                className="text-2xl font-bold text-[var(--foreground)]"
                style={{ fontFamily: "var(--font-sans)" }}
              >
                Session Complete
              </div>
              <div className="mt-2 text-sm text-[var(--text-muted)] font-medium">
                You have reviewed all cards in this session.
              </div>
              {lastReview && (
                <div className="mt-6 bg-[var(--background)] border-[3px] border-[var(--border)] rounded-[2rem] p-4 text-left">
                  <div className="text-xs font-bold text-[var(--text-muted)] tracking-wide mb-3">
                    SM-2 Review Schedule
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="bg-white border-[3px] border-[var(--border)] rounded-[2rem] shadow-[0_4px_0_rgba(0,0,0,0.08)] px-4 py-3">
                      <div className="text-xs font-bold text-[var(--text-muted)]">
                        Repetition
                      </div>
                      <div
                        className="text-lg font-bold text-[var(--foreground)]"
                        style={{ fontFamily: "var(--font-mono)" }}
                      >
                        {lastReview.repetition ?? 0}
                      </div>
                    </div>
                    <div className="bg-white border-[3px] border-[var(--border)] rounded-[2rem] shadow-[0_4px_0_rgba(0,0,0,0.08)] px-4 py-3">
                      <div className="text-xs font-bold text-[var(--text-muted)]">
                        Ease Factor
                      </div>
                      <div
                        className="text-lg font-bold text-[var(--foreground)]"
                        style={{ fontFamily: "var(--font-mono)" }}
                      >
                        {formatEaseFactor(lastReview.easeFactor)}
                      </div>
                    </div>
                    <div className="bg-white border-[3px] border-[var(--border)] rounded-[2rem] shadow-[0_4px_0_rgba(0,0,0,0.08)] px-4 py-3">
                      <div className="text-xs font-bold text-[var(--text-muted)]">
                        Interval
                      </div>
                      <div
                        className="text-lg font-bold text-[var(--foreground)]"
                        style={{ fontFamily: "var(--font-mono)" }}
                      >
                        {lastReview.intervalDays ?? 0} days
                      </div>
                    </div>
                    <div className="bg-white border-[3px] border-[var(--border)] rounded-[2rem] shadow-[0_4px_0_rgba(0,0,0,0.08)] px-4 py-3">
                      <div className="text-xs font-bold text-[var(--text-muted)]">
                        Card ID
                      </div>
                      <div
                        className="text-lg font-bold text-[var(--foreground)] truncate"
                        style={{ fontFamily: "var(--font-mono)" }}
                      >
                        {lastReview.cardId ?? "--"}
                      </div>
                    </div>
                  </div>
                  {formatNextDue(lastReview.nextDue) && (
                    <div className="mt-3 bg-white border-[3px] border-[var(--border)] rounded-[2rem] shadow-[0_4px_0_rgba(0,0,0,0.08)] px-4 py-3 text-sm text-[var(--text-body)]">
                      Next due:{" "}
                      <span
                        className="font-bold"
                        style={{ fontFamily: "var(--font-mono)" }}
                      >
                        {formatNextDue(lastReview.nextDue)}
                      </span>
                    </div>
                  )}
                </div>
              )}
              <div className="mt-6 flex items-center justify-center gap-3">
                <button
                  onClick={() => window.location.reload()}
                  className="px-6 py-2.5 rounded-full bg-white text-[var(--foreground)] font-bold border-[3px] border-[var(--border)] hover:-translate-y-0.5 hover:border-[var(--primary)] active:translate-y-[2px] transition-all"
                >
                  Reload
                </button>
                <button
                  onClick={study.handleExit}
                  className="px-6 py-2.5 rounded-full bg-[var(--primary)] text-white font-bold border-b-[4px] border-[var(--primary-dark)] hover:-translate-y-0.5 hover:border-b-[5px] active:translate-y-[2px] active:border-b-[2px] transition-all"
                >
                  Exit
                </button>
              </div>
            </div>
          ) : booting ? (
            <div className="bg-white border-[3px] border-[var(--border)] rounded-[2rem] shadow-[0_4px_0_rgba(0,0,0,0.08)] p-6">
              <div className="h-5 w-28 animate-pulse rounded-full bg-[var(--border)]" />
              <div className="mt-4 h-8 w-3/5 animate-pulse rounded-full bg-[var(--border)]" />
              <div className="mt-2 h-8 w-2/5 animate-pulse rounded-full bg-[var(--border)]" />
              <div className="mt-6 h-24 w-full animate-pulse rounded-xl bg-[var(--background)]" />
              <div className="mt-6 flex gap-3">
                <div className="h-10 w-24 animate-pulse rounded-full bg-[var(--border)]" />
                <div className="h-10 w-24 animate-pulse rounded-full bg-[var(--border)]" />
                <div className="h-10 w-24 animate-pulse rounded-full bg-[var(--border)]" />
              </div>
            </div>
          ) : hasCard ? (
            <div className="relative">
              {!study.flipped && (
                <div className="absolute inset-x-0 -top-6 mx-auto w-max rounded-full bg-white px-4 py-1.5 text-xs font-bold text-[var(--text-muted)] border-[2px] border-[var(--border)] shadow-[0_2px_0_rgba(0,0,0,0.05)]">
                  Press{" "}
                  <kbd className="rounded-md border-[2px] border-[var(--border)] px-1.5 py-0.5 text-[10px] font-bold bg-[var(--background)]">
                    Space
                  </kbd>{" "}
                  to flip
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
            <div className="bg-white border-[3px] border-[var(--border)] rounded-[2rem] shadow-[0_4px_0_rgba(0,0,0,0.08)] p-6 text-center">
              <p className="text-[var(--text-muted)] font-bold">
                No valid cards found.
              </p>
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
      </div>
    </main>
  );
}
