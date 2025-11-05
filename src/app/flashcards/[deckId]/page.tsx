"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import StudyHeader from "../components/study/StudyHeader";
import ProgressBar from "../components/study/ProgressBar";
import Flashcard from "../components/study/Flashcard";
import SRFooter from "../components/study/SRFooter";
import useDeckStudy from "../components/study/useDeckStudy";
import { getDeckCards } from "@/utils/api";
import {
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
  const [stats, setStats] = useState<SRStats>({
    new: 0,
    learning: 0,
    review: 0,
    dueToday: 0,
  });

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
        if (mounted) setCards(list);

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
      try {
        if (user?.id) {
          await reviewFlashcard(user.id, study.card.id, gradeMap[g]);
          refreshProgress();
        }
      } catch {}
      if (study.index >= study.total - 1) {
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
        } catch {}
      }
    },
    [study, user?.id, refreshProgress]
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
      } else if (e.key === "2") {
        e.preventDefault();
        handleGrade("hard");
      } else if (e.key === "3") {
        e.preventDefault();
        handleGrade("good");
      } else if (e.key === "4") {
        e.preventDefault();
        handleGrade("easy");
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [study, handleGrade]);

  const hasCard = !!study?.card;
  const booting = cards.length > 0 && !hasCard;
  const uiStats: SRStats = study?.stats ?? {
    new: stats.new || (study?.total ?? cards.length),
    learning: stats.learning || 0,
    review: stats.review || 0,
    dueToday: stats.dueToday || (study?.total ?? cards.length),
  };
  const progressPct = study?.total
    ? Math.round(((study.index + 1) / study.total) * 100)
    : 0;

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

  if (!cards.length) {
    return (
      <main className="mx-auto max-w-4xl px-4 py-6 text-center text-slate-600">
        Không có thẻ đến hạn ôn (hoặc bộ này chưa có thẻ).
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-4xl px-4 py-6">
      <StudyHeader
        deckTitle={`Học bộ thẻ: ${deckId}`}
        current={study.index + 1}
        total={study.total}
        onExit={study.handleExit}
      />

      <div className="mt-4">
        <div className="flex items-center justify-between text-xs text-slate-500">
          <span>Tiến độ</span>
          <span>{progressPct}%</span>
        </div>
        <ProgressBar value={progressPct} />
      </div>

      <section className="mt-6">
        {booting ? (
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

      <SRFooter
        flipped={study.flipped}
        onFlip={study.flip}
        onGrade={handleGrade}
        onPrev={study.prev}
        onNext={study.next}
        index={study.index}
        total={study.total}
        shuffle={study.shuffle}
        onToggleShuffle={study.toggleShuffle}
      />
    </main>
  );
}

function StatPill({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border bg-white px-3 py-2 text-center shadow-sm">
      <div className="text-[11px] uppercase tracking-wide text-slate-500">
        {label}
      </div>
      <div className="text-lg font-semibold text-slate-800">{value}</div>
    </div>
  );
}
