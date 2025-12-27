"use client";

import { useEffect, useMemo, useState } from "react";
import { FiSearch, FiFilter, FiX, FiChevronLeft, FiChevronRight } from "react-icons/fi";
import { HiOutlineFire } from "react-icons/hi";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { getQuestionTypes } from "@/utils/api";

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
  questionTypes?: string[];
};

export type PracticeBankProps = {
  items?: PracticeItem[];
  pageSize?: number;
  className?: string;
  userId: string;
  skill: string;
  onQuestionTypesChange?: (types: string[]) => void;
  loading?: boolean;
};

type QuestionType = { type: string; count: number };

const QUESTION_TYPE_LABELS: Record<string, string> = {
  "TRUE_FALSE_NOT_GIVEN": "True/False/Not Given",
  "YES_NO_NOT_GIVEN": "Yes/No/Not Given",
  "MCQ_SINGLE": "Multiple Choice",
  "MCQ_MULTIPLE": "Multiple Selection",
  "MATCHING_HEADING": "Matching Headings",
  "MATCHING_INFORMATION": "Matching Info",
  "MATCHING_FEATURES": "Matching Features",
  "SUMMARY_COMPLETION": "Gap Filling",
  "TABLE_COMPLETION": "Table Completion",
  "SENTENCE_COMPLETION": "Sentence Completion",
  "DIAGRAM_LABEL": "Diagram Label",
  "SHORT_ANSWER": "Short Answer",
  "MAP_LABEL": "Map Label",
};

// Skeleton Loader
function SkeletonCard() {
  return (
    <div className="animate-pulse rounded-2xl bg-white overflow-hidden shadow-md">
      <div className="h-40 bg-slate-200" />
      <div className="p-4 space-y-2">
        <div className="h-4 bg-slate-200 rounded w-4/5" />
        <div className="h-3 bg-slate-100 rounded w-3/5" />
        <div className="h-3 bg-slate-100 rounded w-2/3" />
      </div>
    </div>
  );
}

export default function PracticeBank({
  items,
  pageSize = 12,
  className = "",
  userId,
  skill,
  onQuestionTypesChange,
  loading = false,
}: PracticeBankProps) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  
  const [questionTypes, setQuestionTypes] = useState<QuestionType[]>([]);
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [showFilter, setShowFilter] = useState(false);

  useEffect(() => {
    if (onQuestionTypesChange) {
      onQuestionTypesChange(selectedTypes);
    }
  }, [selectedTypes, onQuestionTypesChange]);

  useEffect(() => {
    async function fetchTypes() {
      if (skill === "writing" || skill === "speaking") return;
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
      if (!q) return true;
      const hay = `${it.title} ${it.summary}`.toLowerCase();
      return hay.includes(q);
    });
  }, [items, query]);

  const total = filtered.length;
  const maxPage = Math.max(1, Math.ceil(total / pageSize));
  const currentPage = Math.min(page, maxPage);
  const start = (currentPage - 1) * pageSize;
  const pageItems = filtered.slice(start, start + pageSize);

  const goPage = (p: number) => setPage(Math.max(1, Math.min(p, maxPage)));

  function handleGoToExam(item: PracticeItem) {
    setLoadingId(item.id);
    router.push(`/do-test/${skill}/start/${item.id}`);
  }

  function getPassageInfo(title: string, index: number): { label: string; num: number } {
    const match = title.match(/passage\s*(\d+)/i);
    const num = match ? parseInt(match[1]) : ((index % 3) + 1);
    return { label: `Passage ${num}`, num };
  }

  const PASSAGE_COLORS = [
    "bg-blue-400/80",
    "bg-emerald-400/80",
    "bg-purple-400/80",
  ];

  function getPassageColor(num: number): string {
    return PASSAGE_COLORS[(num - 1) % PASSAGE_COLORS.length];
  }

  function getViewCount(id: string): number {
    const hash = id.split('').reduce((a, b) => { a = ((a << 5) - a) + b.charCodeAt(0); return a & a; }, 0);
    return Math.abs(hash % 9000) + 500;
  }

  return (
    <section className={`w-full ${className}`}>
      {/* Search & Filter Bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center mb-5">
        <div className="relative flex-1">
          <FiSearch className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setPage(1);
            }}
            placeholder="Tìm kiếm bài thi..."
            className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-11 pr-4 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 text-slate-800 transition shadow-sm"
          />
        </div>
        
        {questionTypes.length > 0 && (
          <button
            onClick={() => setShowFilter(!showFilter)}
            className={`rounded-xl px-5 py-3 text-sm font-medium flex items-center gap-2 transition shadow-sm ${
              showFilter || selectedTypes.length > 0
                ? "bg-blue-500 text-white"
                : "bg-white border border-slate-200 text-slate-600 hover:border-blue-300"
            }`}
          >
            <FiFilter className="w-4 h-4" />
            Lọc dạng câu
            {selectedTypes.length > 0 && (
              <span className="bg-white/20 px-1.5 rounded text-xs">{selectedTypes.length}</span>
            )}
          </button>
        )}
      </div>

      {/* Filter Chips */}
      <AnimatePresence>
        {showFilter && questionTypes.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden mb-5"
          >
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium text-slate-700">Chọn dạng câu hỏi</span>
                {selectedTypes.length > 0 && (
                  <button
                    onClick={() => setSelectedTypes([])}
                    className="text-xs text-rose-500 hover:text-rose-600 flex items-center gap-1"
                  >
                    <FiX className="w-3 h-3" /> Xóa
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
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                      selectedTypes.includes(qt.type)
                        ? "bg-blue-500 text-white"
                        : "bg-white border border-slate-200 text-slate-600 hover:border-blue-300"
                    }`}
                  >
                    {QUESTION_TYPE_LABELS[qt.type] || qt.type}
                    <span className="ml-1.5 opacity-60">{qt.count}</span>
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Selected Filters */}
      {selectedTypes.length > 0 && !showFilter && (
        <div className="mb-4 flex flex-wrap gap-2 items-center">
          <span className="text-xs text-slate-500">Đang lọc:</span>
          {selectedTypes.map((type) => (
            <span key={type} className="px-2 py-1 bg-blue-100 text-blue-700 rounded-lg text-xs flex items-center gap-1">
              {QUESTION_TYPE_LABELS[type] || type}
              <button onClick={() => setSelectedTypes((prev) => prev.filter((t) => t !== type))}>
                <FiX className="w-3 h-3" />
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {loading ? (
          Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)
        ) : (
          pageItems.map((it, index) => (
            <motion.article
              key={it.id}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.03 }}
              className="group relative cursor-pointer rounded-lg border border-slate-200 bg-white overflow-hidden hover:border-slate-300 hover:shadow-sm transition-all duration-200"
            >
              {/* Default View - Image + Content */}
              <div className="group-hover:opacity-0 group-hover:invisible transition-opacity duration-150">
                {/* Image */}
                <div className="relative h-36 w-full overflow-hidden bg-slate-100">
                  {it.imageUrl ? (
                    <img
                      src={it.imageUrl}
                      alt={it.title}
                      loading="lazy"
                      className="absolute inset-0 w-full h-full object-cover"
                    />
                  ) : (
                    <div className="absolute inset-0 bg-slate-100 flex items-center justify-center">
                      <span className="text-slate-300 text-4xl">📄</span>
                    </div>
                  )}
                  
                  {/* View Count - Simple badge */}
                  <div className="absolute top-2 left-2 bg-slate-900/80 text-white px-2 py-0.5 rounded text-[11px] font-medium flex items-center gap-1">
                    <HiOutlineFire className="w-3 h-3 text-orange-400" />
                    {getViewCount(it.id)}
                  </div>

                  {/* Passage Badge */}
                  {(() => {
                    const passageInfo = getPassageInfo(it.title, index);
                    return (
                      <div className="absolute bottom-2 left-2 bg-white/90 text-slate-700 px-2 py-0.5 rounded text-[11px] font-medium border border-slate-200">
                        {passageInfo.label}
                      </div>
                    );
                  })()}
                </div>

                {/* Content */}
                <div className="p-3">
                  <h3 className="font-medium text-slate-900 text-sm leading-snug line-clamp-2 min-h-[2.25rem]">
                    {it.title}
                  </h3>
                  
                  <div className="mt-2 flex flex-wrap gap-1">
                    {(it.questionTypes || it.tags || ["MATCHING_HEADING", "TRUE_FALSE_NOT_GIVEN"]).slice(0, 2).map((type, idx) => (
                      <span key={idx} className="text-[10px] text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                        {QUESTION_TYPE_LABELS[type] || type}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Hover View - Full card replacement */}
              <div className="absolute inset-0 bg-white p-4 flex flex-col opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-opacity duration-150">
                <h4 className="font-semibold text-slate-900 text-sm leading-snug mb-3">
                  {it.title}
                </h4>
                
                <div className="flex-1 space-y-1.5 mb-4">
                  {(it.questionTypes || it.tags || ["MATCHING_HEADING", "TRUE_FALSE_NOT_GIVEN", "MCQ_SINGLE"]).slice(0, 4).map((type, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-xs text-slate-600">
                      <span className="text-slate-300">•</span>
                      {QUESTION_TYPE_LABELS[type] || type}
                    </div>
                  ))}
                </div>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleGoToExam(it);
                  }}
                  className="w-full py-2 bg-blue-500 hover:bg-blue-600 text-white font-medium rounded-md transition text-xs"
                >
                  Làm bài
                </button>
              </div>

              {loadingId === it.id && (
                <div className="absolute inset-0 bg-white/90 flex items-center justify-center z-30">
                  <div className="w-5 h-5 border-2 border-slate-200 border-t-slate-600 rounded-full animate-spin" />
                </div>
              )}
            </motion.article>
          ))
        )}
      </div>

      {/* Empty State */}
      {!loading && total === 0 && (
        <div className="py-16 text-center">
          <div className="text-5xl mb-3">📭</div>
          <p className="text-slate-500">Không tìm thấy bài thi nào</p>
        </div>
      )}

      {/* Pagination */}
      {total > pageSize && (
        <div className="mt-6 flex items-center justify-center gap-1">
          <button
            onClick={() => goPage(currentPage - 1)}
            disabled={currentPage === 1}
            className="p-2 rounded-lg bg-white border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-40 transition"
          >
            <FiChevronLeft className="w-4 h-4" />
          </button>

          {Array.from({ length: Math.min(5, maxPage) }, (_, i) => {
            let pageNum;
            if (maxPage <= 5) pageNum = i + 1;
            else if (currentPage <= 3) pageNum = i + 1;
            else if (currentPage >= maxPage - 2) pageNum = maxPage - 4 + i;
            else pageNum = currentPage - 2 + i;
            return (
              <button
                key={pageNum}
                onClick={() => goPage(pageNum)}
                className={`min-w-9 h-9 rounded-lg text-sm font-medium transition ${
                  pageNum === currentPage
                    ? "bg-blue-500 text-white"
                    : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
                }`}
              >
                {pageNum}
              </button>
            );
          })}

          <button
            onClick={() => goPage(currentPage + 1)}
            disabled={currentPage === maxPage}
            className="p-2 rounded-lg bg-white border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-40 transition"
          >
            <FiChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </section>
  );
}
