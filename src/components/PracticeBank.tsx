"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { FiSearch, FiFilter, FiX } from "react-icons/fi";
import { useRouter } from "next/navigation";
import { useAttemptStore } from "@/app/store/useAttemptStore";
import { startAttempt, startWritingExam, startSpeakingExam, getQuestionTypes } from "@/utils/api";

export type PracticeItem = {
  id: string;
  title: string;
  summary: string;
  section?: string;
  thumb?: string;
  imageUrl?: string;  
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
  onQuestionTypesChange?: (types: string[]) => void; // Callback for server-side filtering
};

type QuestionType = { type: string; count: number };

const QUESTION_TYPE_LABELS: Record<string, string> = {
  "TRUE_FALSE_NOT_GIVEN": "True/False/Not Given",
  "YES_NO_NOT_GIVEN": "Yes/No/Not Given",
  "MCQ_SINGLE": "Multiple Choice (Single)",
  "MCQ_MULTIPLE": "Multiple Choice (Multiple)",
  "MATCHING_HEADING": "Matching Headings",
  "MATCHING_INFORMATION": "Matching Information",
  "MATCHING_FEATURES": "Matching Features",
  "SUMMARY_COMPLETION": "Summary Completion",
  "TABLE_COMPLETION": "Table Completion",
  "SENTENCE_COMPLETION": "Sentence Completion",
  "DIAGRAM_LABEL": "Diagram Labelling",
  "SHORT_ANSWER": "Short Answer",
  "MAP_LABEL": "Map Labelling",
};

export default function PracticeBank({
  items,
  pageSize = 12,
  className = "",
  onClickItem,
  userId,
  skill,
  onQuestionTypesChange,
}: PracticeBankProps) {
  const router = useRouter();
  const setAttempt = useAttemptStore((s) => s.setAttempt);
  const [tab, setTab] = useState<"todo" | "done">("todo");
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  
  // Question type filter state
  const [questionTypes, setQuestionTypes] = useState<QuestionType[]>([]);
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [showFilter, setShowFilter] = useState(false);

  // Notify parent when filter changes (for server-side filtering)
  useEffect(() => {
    if (onQuestionTypesChange) {
      onQuestionTypesChange(selectedTypes);
    }
  }, [selectedTypes, onQuestionTypesChange]);

  // Fetch question types for the skill
  useEffect(() => {
    async function fetchTypes() {
      if (skill === "writing" || skill === "speaking") return; // No question types for these
      try {
        const res = await getQuestionTypes(skill);
        const data = (res as any)?.data?.data ?? [];
        if (Array.isArray(data)) {
          setQuestionTypes(data);
        }
      } catch (e) {
        console.error("Failed to fetch question types:", e);
      }
    }
    fetchTypes();
  }, [skill]);

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

  function handleGoToExam(item: PracticeItem) {
    router.push(`/do-test/${skill}/start/${item.id}`);
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
            onClick={() => setShowFilter(!showFilter)}
            className={`rounded-full px-4 py-2 text-sm flex items-center gap-2 transition ${
              showFilter || selectedTypes.length > 0
                ? "bg-blue-600 text-white"
                : "bg-slate-900 text-white"
            }`}
          >
            <FiFilter className="w-4 h-4" />
            Lọc dạng câu
            {selectedTypes.length > 0 && (
              <span className="bg-white text-blue-600 px-1.5 py-0.5 rounded-full text-xs font-bold">
                {selectedTypes.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Question Type Filter Chips */}
      {showFilter && questionTypes.length > 0 && (
        <div className="mt-3 p-4 bg-slate-50 rounded-xl border border-slate-200">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-medium text-slate-700">Lọc theo dạng câu hỏi</h4>
            {selectedTypes.length > 0 && (
              <button
                onClick={() => setSelectedTypes([])}
                className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1"
              >
                <FiX className="w-3 h-3" />
                Xóa bộ lọc
              </button>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            {questionTypes.map((qt) => (
              <button
                key={qt.type}
                onClick={() => {
                  setSelectedTypes((prev) =>
                    prev.includes(qt.type)
                      ? prev.filter((t) => t !== qt.type)
                      : [...prev, qt.type]
                  );
                  setPage(1);
                }}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition flex items-center gap-1.5 ${
                  selectedTypes.includes(qt.type)
                    ? "bg-blue-600 text-white"
                    : "bg-white border border-slate-300 text-slate-700 hover:border-blue-400 hover:text-blue-600"
                }`}
              >
                {QUESTION_TYPE_LABELS[qt.type] || qt.type}
                <span className={`px-1.5 py-0.5 rounded-full text-[10px] ${
                  selectedTypes.includes(qt.type)
                    ? "bg-blue-500 text-white"
                    : "bg-slate-100 text-slate-500"
                }`}>
                  {qt.count}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Selected filters preview */}
      {selectedTypes.length > 0 && !showFilter && (
        <div className="mt-3 flex flex-wrap gap-2 items-center">
          <span className="text-xs text-slate-500">Đang lọc:</span>
          {selectedTypes.map((type) => (
            <span
              key={type}
              className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs flex items-center gap-1"
            >
              {QUESTION_TYPE_LABELS[type] || type}
              <button
                onClick={() => setSelectedTypes((prev) => prev.filter((t) => t !== type))}
                className="hover:text-blue-900"
              >
                <FiX className="w-3 h-3" />
              </button>
            </span>
          ))}
        </div>
      )}

      <div className="mt-4 flex flex-wrap justify-start gap-4">
        {pageItems.map((it) => (
          <article
            key={it.id}
            className="w-full sm:w-[48%] lg:w-[31%] xl:w-[23%] rounded-xl border border-slate-200 bg-white shadow-sm transition hover:shadow "
          >
            <button
              className="relative block h-48 w-full overflow-hidden cursor-pointer bg-slate-100"
              onClick={() => handleGoToExam(it)}
              disabled={loadingId === it.id}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={
                  it.imageUrl ??
                  "https://th.bing.com/th/id/R.0901589eef10038b5f3298ca9e4bb370?rik=EcrM4tIYeQ%2bfYQ&pid=ImgRaw&r=0"
                }
                alt={it.title}
                className="absolute inset-0 w-full h-full object-cover"
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
                onClick={() => handleGoToExam(it)}
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
                  onClick={() => handleGoToExam(it)}
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
