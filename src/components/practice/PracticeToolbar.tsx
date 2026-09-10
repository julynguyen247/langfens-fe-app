"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { SkillId } from "./colors";
import { QUESTION_TYPE_LABELS, SKILL_CHIP_COLORS } from "./colors";

export type SortKey = "newest" | "most_attempted" | "shortest" | "by_type";

const SORT_LABELS: Record<SortKey, string> = {
  newest: "Newest",
  most_attempted: "Most attempted",
  shortest: "Shortest",
  by_type: "By question type",
};

const SORT_ORDER: SortKey[] = [
  "newest",
  "most_attempted",
  "shortest",
  "by_type",
];

type QuestionType = { type: string; count: number };

type PracticeToolbarProps = {
  skill: SkillId;
  query: string;
  onQueryChange: (q: string) => void;
  showFilter: boolean;
  onShowFilter: (b: boolean) => void;
  selectedTypes: string[];
  onSelectedTypesChange: (t: string[]) => void;
  questionTypes: QuestionType[];
  sort: SortKey;
  onSortChange: (s: SortKey) => void;
  total: number;
  visible: number;
};

function CaretDown() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M6 9l6 6 6-6" />
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <circle cx="11" cy="11" r="7" />
      <path d="M20 20l-3.5-3.5" />
    </svg>
  );
}

export function PracticeToolbar({
  skill,
  query,
  onQueryChange,
  showFilter,
  onShowFilter,
  selectedTypes,
  onSelectedTypesChange,
  questionTypes,
  sort,
  onSortChange,
  total,
  visible,
}: PracticeToolbarProps) {
  const chipColors = SKILL_CHIP_COLORS[skill] ?? SKILL_CHIP_COLORS.reading;
  const [sortOpen, setSortOpen] = useState(false);
  const sortRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!sortOpen) return;
    function onDown(e: MouseEvent) {
      if (!sortRef.current) return;
      if (!sortRef.current.contains(e.target as Node)) {
        setSortOpen(false);
      }
    }
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [sortOpen]);

  function toggleType(t: string) {
    if (selectedTypes.includes(t)) {
      onSelectedTypesChange(selectedTypes.filter((x) => x !== t));
    } else {
      onSelectedTypesChange([...selectedTypes, t]);
    }
  }

  return (
    <>
      {/* Top row: search + filter + sort */}
      <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="relative flex-1 max-w-xl w-full">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)] pointer-events-none">
            <SearchIcon />
          </span>
          <input
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            placeholder="Search exams..."
            className="w-full rounded-full border-[2px] border-[var(--border)] bg-white py-3 pl-11 pr-4 text-sm outline-none focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]/20 text-[var(--foreground)] transition placeholder:text-[var(--text-muted)]"
            style={{ fontFamily: "var(--font-heading)" }}
          />
        </div>

        <div className="flex items-center gap-3">
          {questionTypes.length > 0 && (
            <button
              onClick={() => onShowFilter(!showFilter)}
              className={`rounded-full px-5 py-2.5 text-sm font-bold flex items-center gap-2 transition-all duration-150 ${
                showFilter || selectedTypes.length > 0
                  ? "bg-[var(--primary)] text-white border-b-[3px] border-[var(--primary-dark)]"
                  : "bg-white border-[2px] border-[var(--border)] text-[var(--text-body)] hover:border-[var(--primary)]"
              }`}
              style={{ fontFamily: "var(--font-heading)" }}
            >
              Filter
              {selectedTypes.length > 0 && (
                <span className="bg-white/20 px-1.5 rounded-full text-xs">
                  {selectedTypes.length}
                </span>
              )}
            </button>
          )}

          <div className="relative" ref={sortRef}>
            <button
              type="button"
              onClick={() => setSortOpen((v) => !v)}
              className="rounded-full px-5 py-2.5 text-sm font-bold bg-white border-[2px] border-[var(--border)] text-[var(--text-body)] hover:border-[var(--primary)] flex items-center gap-2 transition-colors"
              style={{ fontFamily: "var(--font-heading)" }}
            >
              <span>Sort: {SORT_LABELS[sort]}</span>
              <CaretDown />
            </button>

            <AnimatePresence>
              {sortOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  transition={{ duration: 0.12, ease: "easeOut" }}
                  className="absolute right-0 mt-2 z-30 min-w-[200px] rounded-[1.25rem] bg-white border-[3px] border-[var(--border)] shadow-[0_4px_0_rgba(0,0,0,0.08)] overflow-hidden"
                >
                  {SORT_ORDER.map((key) => {
                    const isActive = sort === key;
                    return (
                      <button
                        key={key}
                        type="button"
                        onClick={() => {
                          onSortChange(key);
                          setSortOpen(false);
                        }}
                        className="w-full text-left px-4 py-2.5 text-sm font-semibold transition-colors"
                        style={{
                          fontFamily: "var(--font-heading)",
                          backgroundColor: isActive
                            ? chipColors.activeBg
                            : "transparent",
                          color: isActive ? chipColors.activeText : "var(--text-body)",
                        }}
                        onMouseEnter={(e) => {
                          if (!isActive) {
                            e.currentTarget.style.backgroundColor =
                              "var(--background)";
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (!isActive) {
                            e.currentTarget.style.backgroundColor = "transparent";
                          }
                        }}
                      >
                        {SORT_LABELS[key]}
                      </button>
                    );
                  })}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Filter panel */}
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
                  style={{ fontFamily: "var(--font-heading)" }}
                >
                  Filter by question type
                </span>
                {selectedTypes.length > 0 && (
                  <button
                    onClick={() => onSelectedTypesChange([])}
                    className="text-xs font-bold text-[var(--destructive)] hover:text-red-600"
                    style={{ fontFamily: "var(--font-heading)" }}
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
                      onClick={() => toggleType(qt.type)}
                      className="rounded-full px-3 py-2 text-xs font-bold border-[2px] transition-all duration-150"
                      style={{
                        backgroundColor: isActive
                          ? chipColors.activeBg
                          : "white",
                        color: isActive ? chipColors.activeText : "var(--text-body)",
                        borderColor: isActive
                          ? chipColors.activeBorder
                          : "var(--border)",
                        fontFamily: "var(--font-heading)",
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

      {/* Active filter chips when panel is closed */}
      {selectedTypes.length > 0 && !showFilter && (
        <div className="mb-6 flex flex-wrap gap-2 items-center">
          <span
            className="text-xs text-[var(--text-muted)]"
            style={{ fontFamily: "var(--font-heading)" }}
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
                fontFamily: "var(--font-heading)",
              }}
            >
              {QUESTION_TYPE_LABELS[type] || type}
              <button
                onClick={() =>
                  onSelectedTypesChange(selectedTypes.filter((t) => t !== type))
                }
                className="ml-1 font-bold hover:opacity-70"
                style={{ color: chipColors.activeText }}
                aria-label={`Remove ${type} filter`}
              >
                x
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Results count */}
      <div className="mb-4 text-sm text-[var(--text-muted)]">
        Showing{" "}
        <span
          className="font-bold text-[var(--foreground)]"
          style={{ fontFamily: "var(--font-mono)" }}
        >
          {visible}
        </span>{" "}
        of{" "}
        <span
          className="font-bold text-[var(--foreground)]"
          style={{ fontFamily: "var(--font-mono)" }}
        >
          {total}
        </span>{" "}
        exams
      </div>
    </>
  );
}
