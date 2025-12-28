"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { getQuestionTypes } from "@/utils/api";

// Material Icon Component
function Icon({ name, className = "" }: { name: string; className?: string }) {
  return <span className={`material-symbols-rounded ${className}`}>{name}</span>;
}

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
  TRUE_FALSE_NOT_GIVEN: "True/False/NG",
  YES_NO_NOT_GIVEN: "Yes/No/NG",
  MCQ_SINGLE: "Multiple Choice",
  MCQ_MULTIPLE: "Multiple Selection",
  MULTIPLE_CHOICE_SINGLE: "Multiple Choice",
  MULTIPLE_CHOICE_MULTIPLE: "Multiple Selection",
  MATCHING_HEADING: "Matching Headings",
  MATCHING_INFORMATION: "Matching Info",
  MATCHING_FEATURES: "Matching Features",
  SUMMARY_COMPLETION: "Gap Filling",
  TABLE_COMPLETION: "Table Completion",
  SENTENCE_COMPLETION: "Sentence Completion",
  DIAGRAM_LABEL: "Diagram Label",
  SHORT_ANSWER: "Short Answer",
  MAP_LABEL: "Map Label",
};

// Badge colors for question types
const TYPE_COLORS: Record<string, string> = {
  TRUE_FALSE_NOT_GIVEN: "bg-emerald-50 text-emerald-700",
  YES_NO_NOT_GIVEN: "bg-emerald-50 text-emerald-700",
  MCQ_SINGLE: "bg-blue-50 text-blue-700",
  MCQ_MULTIPLE: "bg-blue-50 text-blue-700",
  MULTIPLE_CHOICE_SINGLE: "bg-blue-50 text-blue-700",
  MULTIPLE_CHOICE_MULTIPLE: "bg-blue-50 text-blue-700",
  MATCHING_HEADING: "bg-purple-50 text-purple-700",
  MATCHING_INFORMATION: "bg-amber-50 text-amber-700",
  MATCHING_FEATURES: "bg-rose-50 text-rose-700",
  SUMMARY_COMPLETION: "bg-cyan-50 text-cyan-700",
  TABLE_COMPLETION: "bg-orange-50 text-orange-700",
  SENTENCE_COMPLETION: "bg-indigo-50 text-indigo-700",
  DIAGRAM_LABEL: "bg-pink-50 text-pink-700",
  SHORT_ANSWER: "bg-teal-50 text-teal-700",
  MAP_LABEL: "bg-violet-50 text-violet-700",
};

// Skeleton Loader
function SkeletonCard() {
  return (
    <div className="animate-pulse rounded-xl bg-white border border-slate-200 overflow-hidden">
      <div className="aspect-video bg-slate-200" />
      <div className="p-5 space-y-3">
        <div className="h-3 bg-slate-100 rounded w-1/3" />
        <div className="h-5 bg-slate-200 rounded w-full" />
        <div className="h-5 bg-slate-200 rounded w-4/5" />
        <div className="flex gap-2 mt-3">
          <div className="h-6 bg-slate-100 rounded-md w-20" />
          <div className="h-6 bg-slate-100 rounded-md w-16" />
        </div>
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

  function getViewCount(id: string): number {
    const hash = id.split("").reduce((a, b) => {
      a = (a << 5) - a + b.charCodeAt(0);
      return a & a;
    }, 0);
    return Math.abs(hash % 9000) + 500;
  }

  function getDuration(): number {
    return Math.floor(Math.random() * 15) + 15; // 15-30 mins
  }

  return (
    <section className={`w-full ${className}`}>
      {/* Search & Toolbar */}
      <div className="mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        {/* Search Input */}
        <div className="relative flex-1 max-w-xl">
          <Icon name="search" className="absolute left-4 top-1/2 -translate-y-1/2 text-xl text-slate-400" />
          <input
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setPage(1);
            }}
            placeholder="Search for topics (e.g., Environment, History)..."
            className="w-full rounded-lg border border-slate-200 bg-white py-3 pl-12 pr-4 text-sm outline-none focus:border-[#3B82F6] focus:ring-2 focus:ring-blue-100 text-slate-800 transition shadow-sm placeholder:text-slate-400"
          />
        </div>

        {/* Sort & Filter */}
        <div className="flex items-center gap-3">
          {questionTypes.length > 0 && (
            <button
              onClick={() => setShowFilter(!showFilter)}
              className={`rounded-lg px-4 py-2.5 text-sm font-medium flex items-center gap-2 transition shadow-sm ${
                showFilter || selectedTypes.length > 0
                  ? "bg-[#3B82F6] text-white"
                  : "bg-white border border-slate-200 text-slate-600 hover:border-[#3B82F6]"
              }`}
            >
              <Icon name="filter_list" className="text-lg" />
              Filter
              {selectedTypes.length > 0 && (
                <span className="bg-white/20 px-1.5 rounded text-xs">{selectedTypes.length}</span>
              )}
            </button>
          )}

          <button className="rounded-lg px-4 py-2.5 text-sm font-medium bg-white border border-slate-200 text-slate-600 hover:border-slate-300 flex items-center gap-2 shadow-sm">
            <Icon name="sort" className="text-lg" />
            Sort: Newest
          </button>
        </div>
      </div>

      {/* Filter Panel */}
      <AnimatePresence>
        {showFilter && questionTypes.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden mb-6"
          >
            <div className="p-5 bg-white rounded-xl border border-slate-200 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm font-semibold text-slate-800">Filter by Question Type</span>
                {selectedTypes.length > 0 && (
                  <button
                    onClick={() => setSelectedTypes([])}
                    className="text-xs text-red-500 hover:text-red-600 flex items-center gap-1"
                  >
                    <Icon name="close" className="text-sm" />
                    Clear all
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
                    className={`px-3 py-2 rounded-lg text-xs font-medium transition ${
                      selectedTypes.includes(qt.type)
                        ? "bg-[#3B82F6] text-white"
                        : TYPE_COLORS[qt.type] || "bg-slate-100 text-slate-600"
                    } hover:ring-2 hover:ring-blue-200`}
                  >
                    {QUESTION_TYPE_LABELS[qt.type] || qt.type}
                    <span className="ml-1.5 opacity-70">({qt.count})</span>
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Selected Filters Pills */}
      {selectedTypes.length > 0 && !showFilter && (
        <div className="mb-6 flex flex-wrap gap-2 items-center">
          <span className="text-xs text-slate-500">Active filters:</span>
          {selectedTypes.map((type) => (
            <span
              key={type}
              className="px-2.5 py-1 bg-[#EFF6FF] text-[#2563EB] rounded-full text-xs font-medium flex items-center gap-1"
            >
              {QUESTION_TYPE_LABELS[type] || type}
              <button onClick={() => setSelectedTypes((prev) => prev.filter((t) => t !== type))}>
                <Icon name="close" className="text-sm" />
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Results Count */}
      <div className="mb-4 text-sm text-slate-500">
        Showing <span className="font-medium text-slate-700">{pageItems.length}</span> of{" "}
        <span className="font-medium text-slate-700">{total}</span> results
      </div>

      {/* Article Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {loading ? (
          Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)
        ) : (
          pageItems.map((it, index) => (
            <motion.article
              key={it.id}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.03 }}
              onClick={() => handleGoToExam(it)}
              className="group relative cursor-pointer bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300 h-full flex flex-col"
            >
              {/* Image Area (Fixed Height) */}
              <div className="relative aspect-video overflow-hidden bg-slate-100 shrink-0">
                {it.imageUrl ? (
                  <img
                    src={it.imageUrl}
                    alt={it.title}
                    loading="lazy"
                    className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                ) : (
                  <div className="absolute inset-0 bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center">
                    <Icon name="article" className="text-5xl text-slate-300" />
                  </div>
                )}

                {/* Passage Badge - Top Left */}
                {(() => {
                  const passageInfo = getPassageInfo(it.title, index);
                  return (
                    <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm text-slate-800 text-xs font-bold px-2.5 py-1 rounded-md shadow-sm">
                      {passageInfo.label}
                    </div>
                  );
                })()}
              </div>

              {/* Content Area (Grows to fill space) */}
              <div className="p-5 flex flex-col flex-1">
                {/* Meta Row */}
                <div className="flex items-center gap-3 text-slate-400 text-xs uppercase tracking-wide mb-3">
                  <span className="flex items-center gap-1">
                    <Icon name="schedule" className="text-sm" />
                    {getDuration()} min
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <Icon name="visibility" className="text-sm" />
                    {getViewCount(it.id).toLocaleString()} views
                  </span>
                </div>

                {/* Title - Serif */}
                <h3 className="font-serif font-bold text-lg text-slate-900 leading-snug line-clamp-2 mb-3 group-hover:text-[#2563EB] transition-colors">
                  {it.title}
                </h3>

                {/* Tags Row */}
                <div className="flex flex-wrap gap-1.5 mb-4">
                  {(it.questionTypes || it.tags || [])
                    .slice(0, 3)
                    .map((type, idx) => (
                      <span
                        key={idx}
                        className={`text-xs px-2 py-1 rounded-md font-medium ${
                          TYPE_COLORS[type] || "bg-slate-100 text-slate-600"
                        }`}
                      >
                        {QUESTION_TYPE_LABELS[type] || type}
                      </span>
                    ))}
                </div>

                {/* Action Link (Pushed to Bottom with mt-auto) */}
                <div className="mt-auto pt-2 flex justify-end">
                  <span className="text-sm font-medium text-[#3B82F6] group-hover:text-[#2563EB] flex items-center gap-1">
                    Start Practice
                    <Icon name="arrow_forward" className="text-base group-hover:translate-x-0.5 transition-transform" />
                  </span>
                </div>
              </div>

              {/* Loading Overlay */}
              {loadingId === it.id && (
                <div className="absolute inset-0 bg-white/90 flex items-center justify-center z-30">
                  <div className="w-6 h-6 border-2 border-slate-200 border-t-[#3B82F6] rounded-full animate-spin" />
                </div>
              )}
            </motion.article>
          ))
        )}
      </div>

      {/* Empty State */}
      {!loading && total === 0 && (
        <div className="py-20 text-center">
          <Icon name="search_off" className="text-6xl text-slate-300 mb-4" />
          <p className="text-slate-500 text-lg">No results found</p>
          <p className="text-slate-400 text-sm mt-1">Try adjusting your search or filters</p>
        </div>
      )}

      {/* Pagination */}
      {total > pageSize && (
        <div className="mt-10 flex items-center justify-center gap-2">
          <button
            onClick={() => goPage(currentPage - 1)}
            disabled={currentPage === 1}
            className="w-10 h-10 rounded-lg bg-white border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-40 transition shadow-sm flex items-center justify-center"
          >
            <Icon name="chevron_left" className="text-xl" />
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
                className={`w-10 h-10 rounded-lg text-sm font-medium transition shadow-sm flex items-center justify-center ${
                  pageNum === currentPage
                    ? "bg-[#3B82F6] text-white"
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
            className="w-10 h-10 rounded-lg bg-white border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-40 transition shadow-sm flex items-center justify-center"
          >
            <Icon name="chevron_right" className="text-xl" />
          </button>
        </div>
      )}
    </section>
  );
}
