"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { getQuestionTypes } from "@/utils/api";
import type { SkillId } from "./practice/colors";
import { PracticeCard } from "./practice/PracticeCard";
import { PracticeToolbar, type SortKey } from "./practice/PracticeToolbar";
import { SkeletonPracticeCard } from "./practice/SkeletonPracticeCard";

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
  // Optional metadata the redesigned card surfaces ONLY when the real item
  // provides it. No fabrication.
  totalQuestions?: number;
  passages?: number;
  sections?: number;
  source?: string;
  lastScore?: number;
  createdAt?: string;
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

function compareBySortKey(a: PracticeItem, b: PracticeItem, key: SortKey): number {
  // For each key, extract an optional comparable value plus a "has value" flag
  // so missing-data items sink to the end of the list.
  let aHas = false;
  let bHas = false;
  let aN: number | undefined;
  let bN: number | undefined;
  let aS: string | undefined;
  let bS: string | undefined;

  if (key === "newest") {
    if (a.createdAt) {
      const t = Date.parse(a.createdAt);
      if (!Number.isNaN(t)) {
        aN = t;
        aHas = true;
      }
    }
    if (b.createdAt) {
      const t = Date.parse(b.createdAt);
      if (!Number.isNaN(t)) {
        bN = t;
        bHas = true;
      }
    }
  } else if (key === "most_attempted") {
    if (typeof a.attempts === "number") {
      aN = a.attempts;
      aHas = true;
    }
    if (typeof b.attempts === "number") {
      bN = b.attempts;
      bHas = true;
    }
  } else if (key === "shortest") {
    if (typeof a.durationMin === "number" && a.durationMin >= 1) {
      aN = a.durationMin;
      aHas = true;
    }
    if (typeof b.durationMin === "number" && b.durationMin >= 1) {
      bN = b.durationMin;
      bHas = true;
    }
  } else {
    // by_type
    const ap = a.questionTypes?.[0] ?? a.tags?.[0];
    if (ap) {
      aS = ap.toLowerCase();
      aHas = true;
    }
    const bp = b.questionTypes?.[0] ?? b.tags?.[0];
    if (bp) {
      bS = bp.toLowerCase();
      bHas = true;
    }
  }

  // Items without a value sink to the end; original order otherwise.
  if (aHas && !bHas) return -1;
  if (!aHas && bHas) return 1;
  if (!aHas && !bHas) return 0;

  if (key === "newest") {
    return (bN as number) - (aN as number);
  }
  if (key === "most_attempted" || key === "shortest") {
    return (aN as number) - (bN as number);
  }
  // by_type: alphabetical
  const as = aS as string;
  const bs = bS as string;
  return as < bs ? -1 : as > bs ? 1 : 0;
}

export default function PracticeBank({
  items,
  pageSize = 9,
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
  const [sort, setSort] = useState<SortKey>("newest");

  const skillId: SkillId =
    skill === "reading" ||
    skill === "listening" ||
    skill === "writing" ||
    skill === "speaking"
      ? skill
      : "reading";

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

  const sorted = useMemo(() => {
    const arr = [...(items ?? [])];
    arr.sort((a, b) => compareBySortKey(a, b, sort));
    return arr;
  }, [items, sort]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return sorted.filter((it) => {
      if (!q) return true;
      const hay = `${it.title} ${it.summary}`.toLowerCase();
      return hay.includes(q);
    });
  }, [sorted, query]);

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

  return (
    <section className={`w-full ${className}`}>
      <PracticeToolbar
        skill={skillId}
        query={query}
        onQueryChange={(q) => {
          setQuery(q);
          setPage(1);
        }}
        showFilter={showFilter}
        onShowFilter={setShowFilter}
        selectedTypes={selectedTypes}
        onSelectedTypesChange={(t) => {
          setSelectedTypes(t);
          setPage(1);
        }}
        questionTypes={questionTypes}
        sort={sort}
        onSortChange={setSort}
        total={total}
        visible={pageItems.length}
      />

      {/* Cards grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {loading ? (
          Array.from({ length: 6 }).map((_, i) => <SkeletonPracticeCard key={i} />)
        ) : (
          pageItems.map((it, index) => (
            <PracticeCard
              key={it.id}
              item={it}
              index={index}
              skill={skillId}
              onStart={() => handleGoToExam(it)}
              loading={loadingId === it.id}
            />
          ))
        )}
      </div>

      {/* Empty State — keeps the existing inline pattern so the layout
          matches the original empty card. Uses a CSS-shape "?" per the
          no-emoji rule for new code. */}
      {!loading && total === 0 && (
        <div className="py-20 text-center">
          <div className="w-16 h-16 rounded-full bg-[var(--background)] border-[3px] border-[var(--border)] flex items-center justify-center mx-auto mb-4">
            <span
              className="block w-4 h-4 rounded-md border-[2px] border-[var(--text-muted)]"
              aria-hidden
            />
          </div>
          <p
            className="text-[var(--text-body)] text-lg font-semibold"
            style={{ fontFamily: "var(--font-heading)" }}
          >
            No exams found
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
            let pageNum: number;
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
