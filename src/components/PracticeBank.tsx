"use client";

import { useEffect, useMemo, useState } from "react";
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

// Skill-based filter chip colors using CSS variables
const SKILL_CHIP_COLORS: Record<
  string,
  { activeBg: string; activeText: string; activeBorder: string }
> = {
  reading: {
    activeBg: "var(--skill-reading-light)",
    activeText: "var(--skill-reading)",
    activeBorder: "var(--skill-reading-border)",
  },
  listening: {
    activeBg: "var(--skill-listening-light)",
    activeText: "var(--skill-listening)",
    activeBorder: "var(--skill-listening-border)",
  },
  writing: {
    activeBg: "var(--skill-writing-light)",
    activeText: "var(--skill-writing)",
    activeBorder: "var(--skill-writing-border)",
  },
  speaking: {
    activeBg: "var(--skill-speaking-light)",
    activeText: "var(--skill-speaking)",
    activeBorder: "var(--skill-speaking-border)",
  },
};

function SkeletonCard() {
  return (
    <div className="animate-pulse rounded-[2rem] bg-white border-[3px] border-[var(--border)] shadow-[0_4px_0_rgba(0,0,0,0.08)] p-6">
      <div className="flex items-center gap-2 mb-4">
        <div className="h-5 bg-[var(--border)] rounded-full w-20" />
        <div className="h-5 bg-[var(--border)] rounded-full w-16" />
      </div>
      <div className="h-6 bg-[var(--border)] rounded-full w-full mb-3" />
      <div className="h-6 bg-[var(--border)] rounded-full w-3/4 mb-4" />
      <div className="flex gap-1 mb-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="w-3 h-3 bg-[var(--border)] rounded-full" />
        ))}
      </div>
      <div className="h-3 bg-[var(--border)] rounded-full w-full mb-4" />
      <div className="h-10 bg-[var(--border)] rounded-full w-32" />
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

  const chipColors = SKILL_CHIP_COLORS[skill] || SKILL_CHIP_COLORS.reading;

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

  function getDifficulty(id: string): number {
    const hash = id.split("").reduce((a, b) => {
      a = (a << 5) - a + b.charCodeAt(0);
      return a & a;
    }, 0);
    return (Math.abs(hash) % 5) + 1;
  }

  function getProgress(id: string): number {
    const hash = id.split("").reduce((a, b) => {
      a = (a << 5) - a + b.charCodeAt(0);
      return a & a;
    }, 0);
    return Math.abs(hash % 101);
  }

  function getQuestionCount(id: string): number {
    const hash = id.split("").reduce((a, b) => {
      a = (a << 5) - a + b.charCodeAt(0);
      return a & a;
    }, 0);
    return (Math.abs(hash) % 35) + 10;
  }

  return (
    <section className={`w-full ${className}`}>
      {/* Search & Toolbar */}
      <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="relative flex-1 max-w-xl">
          <input
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setPage(1);
            }}
            placeholder="Search quests..."
            className="w-full rounded-full border-[2px] border-[var(--border)] bg-white py-3 pl-5 pr-4 text-sm outline-none focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]/20 text-[var(--foreground)] transition placeholder:text-[var(--text-muted)]"
            style={{ fontFamily: "var(--font-sans)" }}
          />
        </div>

        <div className="flex items-center gap-3">
          {questionTypes.length > 0 && (
            <button
              onClick={() => setShowFilter(!showFilter)}
              className={`rounded-full px-5 py-2.5 text-sm font-bold flex items-center gap-2 transition-all duration-150 ${
                showFilter || selectedTypes.length > 0
                  ? "bg-[var(--primary)] text-white border-b-[3px] border-[var(--primary-dark)]"
                  : "bg-white border-[2px] border-[var(--border)] text-[var(--text-body)] hover:border-[var(--primary)]"
              }`}
              style={{ fontFamily: "var(--font-sans)" }}
            >
              Filter
              {selectedTypes.length > 0 && (
                <span className="bg-white/20 px-1.5 rounded-full text-xs">
                  {selectedTypes.length}
                </span>
              )}
            </button>
          )}

          <button
            className="rounded-full px-5 py-2.5 text-sm font-bold bg-white border-[2px] border-[var(--border)] text-[var(--text-body)] hover:border-[var(--primary)] flex items-center gap-2 transition-colors"
            style={{ fontFamily: "var(--font-sans)" }}
          >
            Sort: Newest
          </button>
        </div>
      </div>

      {/* Filter Chips Panel */}
      <AnimatePresence>
        {showFilter && questionTypes.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden mb-6"
          >
            <div className="p-5 bg-white rounded-[2rem] border-[3px] border-[var(--border)] shadow-[0_4px_0_rgba(0,0,0,0.08)]">
              <div className="flex items-center justify-between mb-4">
                <span
                  className="text-sm font-bold text-[var(--foreground)]"
                  style={{ fontFamily: "var(--font-sans)" }}
                >
                  Filter by question type
                </span>
                {selectedTypes.length > 0 && (
                  <button
                    onClick={() => setSelectedTypes([])}
                    className="text-xs font-bold text-[var(--destructive)] hover:text-red-600"
                    style={{ fontFamily: "var(--font-sans)" }}
                  >
                    Clear all
                  </button>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                {questionTypes.map((qt) => {
                  const isActive = selectedTypes.includes(qt.type);
                  return (
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
                      className="rounded-full px-3 py-2 text-xs font-bold border-[2px] transition-all duration-150"
                      style={{
                        backgroundColor: isActive
                          ? chipColors.activeBg
                          : "white",
                        color: isActive
                          ? chipColors.activeText
                          : "var(--text-body)",
                        borderColor: isActive
                          ? chipColors.activeBorder
                          : "var(--border)",
                        fontFamily: "var(--font-sans)",
                      }}
                    >
                      {QUESTION_TYPE_LABELS[qt.type] || qt.type}
                      <span className="ml-1.5 opacity-70">({qt.count})</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Active Filter Chips Pills (when filter panel is closed) */}
      {selectedTypes.length > 0 && !showFilter && (
        <div className="mb-6 flex flex-wrap gap-2 items-center">
          <span
            className="text-xs text-[var(--text-muted)]"
            style={{ fontFamily: "var(--font-sans)" }}
          >
            Active filters:
          </span>
          {selectedTypes.map((type) => (
            <span
              key={type}
              className="rounded-full px-3 py-1 text-xs font-bold flex items-center gap-1 border-[2px]"
              style={{
                backgroundColor: chipColors.activeBg,
                color: chipColors.activeText,
                borderColor: chipColors.activeBorder,
                fontFamily: "var(--font-sans)",
              }}
            >
              {QUESTION_TYPE_LABELS[type] || type}
              <button
                onClick={() =>
                  setSelectedTypes((prev) => prev.filter((t) => t !== type))
                }
                className="ml-1 font-bold hover:opacity-70"
                style={{ color: chipColors.activeText }}
              >
                x
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Results Count */}
      <div className="mb-4 text-sm text-[var(--text-muted)]">
        Showing{" "}
        <span
          className="font-bold text-[var(--foreground)]"
          style={{ fontFamily: "var(--font-mono)" }}
        >
          {pageItems.length}
        </span>{" "}
        of{" "}
        <span
          className="font-bold text-[var(--foreground)]"
          style={{ fontFamily: "var(--font-mono)" }}
        >
          {total}
        </span>{" "}
        quests
      </div>

      {/* Quest Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {loading ? (
          Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)
        ) : (
          pageItems.map((it, index) => {
            const difficulty = getDifficulty(it.id);
            const progress = getProgress(it.id);
            const questionCount = getQuestionCount(it.id);
            const types = it.questionTypes || it.tags || [];

            return (
              <motion.article
                key={it.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.03, duration: 0.4, ease: "easeOut" }}
                onClick={() => handleGoToExam(it)}
                className="group relative cursor-pointer bg-white border-[3px] border-[var(--border)] rounded-[2rem] shadow-[0_4px_0_rgba(0,0,0,0.08)] hover:-translate-y-[3px] hover:border-[var(--primary)] hover:shadow-[0_6px_0_rgba(0,0,0,0.08)] transition-all duration-150 h-full flex flex-col overflow-hidden"
              >
                {/* Card Content */}
                <div className="p-6 flex flex-col flex-1">
                  {/* Top Row: Type label + Question count badge */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex flex-wrap gap-1.5">
                      {types.slice(0, 2).map((type, idx) => (
                        <span
                          key={idx}
                          className="rounded-full px-2.5 py-1 text-xs font-bold border-[2px]"
                          style={{
                            backgroundColor: chipColors.activeBg,
                            color: chipColors.activeText,
                            borderColor: chipColors.activeBorder,
                            fontFamily: "var(--font-sans)",
                          }}
                        >
                          {QUESTION_TYPE_LABELS[type] || type}
                        </span>
                      ))}
                    </div>

                    {/* Question count badge */}
                    <span
                      className="flex-shrink-0 rounded-full px-2.5 py-1 text-xs font-bold bg-[var(--background)] text-[var(--text-body)] border-[2px] border-[var(--border)]"
                      style={{ fontFamily: "var(--font-mono)" }}
                    >
                      {questionCount}q
                    </span>
                  </div>

                  {/* Title */}
                  <h3
                    className="font-bold text-lg text-[var(--foreground)] leading-snug line-clamp-2 mb-3 group-hover:text-[var(--primary)] transition-colors"
                    style={{ fontFamily: "var(--font-sans)" }}
                  >
                    {it.title}
                  </h3>

                  {/* Difficulty Circles */}
                  <div className="flex items-center gap-1.5 mb-4">
                    <span
                      className="text-xs font-semibold text-[var(--text-muted)] mr-1"
                      style={{ fontFamily: "var(--font-sans)" }}
                    >
                      Difficulty
                    </span>
                    {Array.from({ length: 5 }).map((_, i) => (
                      <span
                        key={i}
                        className="w-2.5 h-2.5 rounded-full transition-colors"
                        style={{
                          backgroundColor:
                            i < difficulty
                              ? "var(--primary)"
                              : "var(--border)",
                        }}
                      />
                    ))}
                  </div>

                  {/* Completion Progress Bar */}
                  <div className="mb-4">
                    <div className="flex items-center justify-between mb-1">
                      <span
                        className="text-xs text-[var(--text-muted)]"
                        style={{ fontFamily: "var(--font-sans)" }}
                      >
                        Completion
                      </span>
                      <span
                        className="text-xs font-bold text-[var(--primary)]"
                        style={{ fontFamily: "var(--font-mono)" }}
                      >
                        {progress}%
                      </span>
                    </div>
                    <div className="h-2.5 rounded-full bg-[var(--background)] border-[2px] border-[var(--border)] overflow-hidden">
                      <div
                        className="h-full rounded-full bg-[var(--primary)] transition-all duration-500"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>

                  {/* Start Practice Button */}
                  <div className="mt-auto pt-2">
                    <span
                      className="inline-flex items-center rounded-full bg-[var(--primary)] text-white font-bold px-5 py-2 text-sm border-b-[4px] border-[var(--primary-dark)] group-hover:-translate-y-0.5 group-hover:border-b-[5px] group-active:translate-y-[2px] group-active:border-b-[2px] transition-all duration-150"
                      style={{ fontFamily: "var(--font-sans)" }}
                    >
                      Start practice
                    </span>
                  </div>
                </div>

                {/* Loading Overlay */}
                {loadingId === it.id && (
                  <div className="absolute inset-0 bg-white/90 flex items-center justify-center z-30 rounded-[2rem]">
                    <div className="w-6 h-6 border-[3px] border-[var(--border)] border-t-[var(--primary)] rounded-full animate-spin" />
                  </div>
                )}
              </motion.article>
            );
          })
        )}
      </div>

      {/* Empty State */}
      {!loading && total === 0 && (
        <div className="py-20 text-center">
          <div className="w-16 h-16 rounded-full bg-[var(--background)] border-[3px] border-[var(--border)] flex items-center justify-center mx-auto mb-4">
            <span
              className="text-2xl font-bold text-[var(--text-muted)]"
              style={{ fontFamily: "var(--font-sans)" }}
            >
              ?
            </span>
          </div>
          <p
            className="text-[var(--text-body)] text-lg font-semibold"
            style={{ fontFamily: "var(--font-sans)" }}
          >
            No quests found
          </p>
          <p className="text-[var(--text-muted)] text-sm mt-1">
            Try adjusting your search or filters
          </p>
        </div>
      )}

      {/* Pagination */}
      {total > pageSize && (
        <div className="mt-10 flex items-center justify-center gap-2">
          <button
            onClick={() => goPage(currentPage - 1)}
            disabled={currentPage === 1}
            className="w-10 h-10 rounded-full bg-white border-[2px] border-[var(--border)] text-[var(--text-muted)] hover:border-[var(--primary)] disabled:opacity-40 transition flex items-center justify-center font-bold"
          >
            &lt;
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
                className={`w-10 h-10 rounded-full text-sm font-bold transition flex items-center justify-center ${
                  pageNum === currentPage
                    ? "bg-[var(--primary)] text-white border-b-[3px] border-[var(--primary-dark)]"
                    : "bg-white border-[2px] border-[var(--border)] text-[var(--text-body)] hover:border-[var(--primary)]"
                }`}
              >
                {pageNum}
              </button>
            );
          })}

          <button
            onClick={() => goPage(currentPage + 1)}
            disabled={currentPage === maxPage}
            className="w-10 h-10 rounded-full bg-white border-[2px] border-[var(--border)] text-[var(--text-muted)] hover:border-[var(--primary)] disabled:opacity-40 transition flex items-center justify-center font-bold"
          >
            &gt;
          </button>
        </div>
      )}
    </section>
  );
}
