"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import { FiSearch } from "react-icons/fi";
import { useRouter } from "next/navigation";
import { useAttemptStore } from "@/app/store/useAttemptStore";
import { startAttempt, startWritingExam, startSpeakingExam } from "@/utils/api";

export type PracticeItem = {
  id: string;
  title: string;
  summary: string;
  section?: string;
  thumb?: string;
  attempts?: number;
  done: boolean;
  tags?: string[];
  skill?: string;
  slug: string;
  durationMin?: number;
};

export type PracticeBankProps = {
  items?: PracticeItem[];
  pageSize?: number;
  className?: string;
  onClickItem?: (item: PracticeItem) => void;
  userId: string;
  skill: string; // "reading" | "listening" | "writing" | "speaking"
};

export default function PracticeBank({
  items,
  pageSize = 12,
  className = "",
  onClickItem,
  userId,
  skill,
}: PracticeBankProps) {
  const router = useRouter();
  const setAttempt = useAttemptStore((s) => s.setAttempt);
  const [tab, setTab] = useState<"todo" | "done">("todo");
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return (items ?? []).filter((it) => {
      if (tab === "todo" && it.done) return false;
      if (tab === "done" && !it.done) return false;
      if (!q) return true;
      const hay = `${it.title} ${it.summary}`.toLowerCase();
      return hay.includes(q);
    });
  }, [items, tab, query]);

  const total = filtered.length;
  const maxPage = Math.max(1, Math.ceil(total / pageSize));
  const currentPage = Math.min(page, maxPage);
  const start = (currentPage - 1) * pageSize;
  const pageItems = filtered.slice(start, start + pageSize);

  const goPage = (p: number) => {
    const np = Math.max(1, Math.min(p, maxPage));
    setPage(np);
  };

  const buildPages = () => {
    const range = (a: number, b: number) =>
      Array.from({ length: b - a + 1 }, (_, i) => a + i);
    if (maxPage <= 7) return range(1, maxPage);
    const pages: (number | "...")[] = [1];
    let startPage = Math.max(2, currentPage - 1);
    let endPage = Math.min(maxPage - 1, currentPage + 1);
    if (startPage > 2) pages.push("...");
    for (let i = startPage; i <= endPage; i++) pages.push(i);
    if (endPage < maxPage - 1) pages.push("...");
    pages.push(maxPage);
    return pages;
  };

  const pages = buildPages();

  async function handleStart(item: PracticeItem) {
    try {
      setLoadingId(item.id);

      if (onClickItem) {
        onClickItem(item);
        return;
      }

      let res;

      if (skill === "reading" || skill === "listening") {
        res = await startAttempt(item.id);
        console.log(res);
      } else if (skill === "writing") {
        res = await startWritingExam(item.id);
      } else if (skill === "speaking") {
        res = await startSpeakingExam(item.id);
      } else {
        throw new Error("Unknown skill: " + skill);
      }

      const payload = res.data?.data;

      const attemptId: string | undefined = payload?.attemptId ?? payload?.id;

      if (!attemptId) {
        throw new Error("Missing attemptId");
      }
      setAttempt(payload);
      router.push(`/do-test/${skill}/${attemptId}`);
    } catch (err) {
      console.error(err);
      alert("Không thể bắt đầu bài. Vui lòng thử lại!");
    } finally {
      setLoadingId(null);
    }
  }

  return (
    <section className={`w-full ${className}`}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        {/* <div className="inline-flex rounded-lg border border-slate-200 bg-white p-1">
          <button
            onClick={() => {
              setTab("todo");
              setPage(1);
            }}
            className={`rounded-md px-3 py-1.5 text-sm transition ${
              tab === "todo"
                ? "bg-slate-900 text-white"
                : "text-slate-700 hover:bg-slate-100"
            }`}
          >
            Bài chưa làm
          </button>
          <button
            onClick={() => {
              setTab("done");
              setPage(1);
            }}
            className={`rounded-md px-3 py-1.5 text-sm transition ${
              tab === "done"
                ? "bg-slate-900 text-white"
                : "text-slate-700 hover:bg-slate-100"
            }`}
          >
            Bài đã làm
          </button>
        </div> */}

        <div className="flex items-center gap-2">
          <div className="relative w-full sm:w-96">
            <FiSearch className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setPage(1);
              }}
              placeholder="Nhập từ khóa bạn muốn tìm kiếm"
              className="w-full rounded-full border border-slate-300 py-2 pl-9 pr-4 text-sm outline-none focus:border-slate-400 text-black"
            />
          </div>
          <button
            onClick={() => {}}
            className="rounded-full bg-slate-900 px-4 py-2 text-sm text-white"
          >
            Tìm kiếm
          </button>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap justify-start gap-4">
        {pageItems.map((it) => (
          <article
            key={it.id}
            className="w-full sm:w-[48%] lg:w-[31%] xl:w-[23%] rounded-xl border border-slate-200 bg-white shadow-sm transition hover:shadow "
          >
            <button
              className="relative block aspect-video w-full overflow-hidden cursor-pointer"
              onClick={() => handleStart(it)}
              disabled={loadingId === it.id}
            >
              <Image
                src={
                  it.thumb ??
                  "https://th.bing.com/th/id/R.0901589eef10038b5f3298ca9e4bb370?rik=EcrM4tIYeQ%2bfYQ&pid=ImgRaw&r=0"
                }
                alt={it.title}
                fill
                className="object-cover"
                unoptimized
                priority={false}
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
              />
              {it.section && (
                <span className="absolute right-2 top-2 rounded-full bg-blue-600 px-2 py-0.5 text-[10px] font-medium text-white shadow">
                  {it.section}
                </span>
              )}
            </button>

            <div className="flex min-h-0 flex-col p-3">
              <button
                className="text-left"
                onClick={() => handleStart(it)}
                disabled={loadingId === it.id}
                title={it.title}
              >
                <h3 className="min-w-0 truncate text-sm font-semibold text-slate-800 hover:underline">
                  {it.title}
                </h3>
                <div className="mt-0.5 flex items-center gap-2 text-[11px] text-slate-500">
                  <span>⏱ {it.durationMin ?? 20} phút</span>
                </div>
              </button>

              <p className="mt-0.5 min-w-0 truncate text-[12px] text-slate-500">
                • {it.summary}
              </p>

              <div className="mt-3 self-end">
                <button
                  onClick={() => handleStart(it)}
                  disabled={loadingId === it.id}
                  className="rounded-full bg-slate-900 px-3 py-1.5 text-xs text-white disabled:opacity-60"
                >
                  {loadingId === it.id ? "Đang bắt đầu…" : "Làm bài"}
                </button>
              </div>
            </div>
          </article>
        ))}
      </div>

      {total === 0 && (
        <div className="py-16 text-center text-slate-500">
          Không có bài phù hợp.
        </div>
      )}

      {total > 0 && (
        <div className="mt-6 flex items-center justify-between text-sm text-slate-600">
          <button
            onClick={() => goPage(currentPage - 1)}
            disabled={currentPage === 1}
            className="rounded-md px-3 py-1.5 hover:bg-slate-100 disabled:opacity-40"
          >
            Trang trước
          </button>

          <div className="flex items-center gap-1">
            {pages.map((p, idx) =>
              p === "..." ? (
                <span key={`dot-${idx}`} className="px-2">
                  …
                </span>
              ) : (
                <button
                  key={p}
                  onClick={() => goPage(p)}
                  className={`min-w-8 rounded-md px-2 py-1 ${
                    p === currentPage
                      ? "bg-slate-900 text-white"
                      : "hover:bg-slate-100"
                  }`}
                >
                  {p}
                </button>
              )
            )}
          </div>

          <button
            onClick={() => goPage(currentPage + 1)}
            disabled={currentPage === maxPage}
            className="rounded-md px-3 py-1.5 hover:bg-slate-100 disabled:opacity-40"
          >
            Trang sau
          </button>
        </div>
      )}
    </section>
  );
}
