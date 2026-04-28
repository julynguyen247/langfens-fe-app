"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { getCourses } from "@/utils/api";

type Course = {
  id: string;
  slug: string;
  title: string;
  descriptionMd?: string;
  category?: string;
  level?: string;
  status: string;
  lessons?: { id: string; title: string }[];
};

export default function CoursesPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("ALL");
  const [page, setPage] = useState(1);
  const pageSize = 12;

  const categories = ["ALL", "GRAMMAR", "IELTS_GENERAL", "IELTS_ACADEMIC", "GENERAL_ENGLISH"];

  useEffect(() => {
    async function fetchCourses() {
      try {
        setLoading(true);
        const res = await getCourses({ status: "Published" });
        const data = (res as any).data?.data ?? [];
        setCourses(Array.isArray(data) ? data : []);
      } catch (e) {
        console.error("Failed to fetch courses:", e);
        setCourses([]);
      } finally {
        setLoading(false);
      }
    }
    fetchCourses();
  }, []);

  const filtered = useMemo(() => {
    let list = courses;

    // Filter by category
    if (categoryFilter !== "ALL") {
      list = list.filter((c) => c.category === categoryFilter);
    }

    // Filter by search query
    const q = query.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (c) =>
          c.title.toLowerCase().includes(q) ||
          (c.descriptionMd?.toLowerCase().includes(q))
      );
    }

    return list;
  }, [courses, categoryFilter, query]);

  const total = filtered.length;
  const maxPage = Math.max(1, Math.ceil(total / pageSize));
  const current = Math.min(page, maxPage);
  const start = (current - 1) * pageSize;
  const pageItems = filtered.slice(start, start + pageSize);

  const go = (p: number) => setPage(Math.min(Math.max(1, p), maxPage));

  if (loading) {
    return (
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin h-8 w-8 border-4 border-[var(--primary)] border-t-transparent rounded-full" />
          <span className="ml-3 text-[var(--text-muted)] font-bold">Loading courses...</span>
        </div>
      </main>
    );
  }

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="bg-white border-[3px] border-[var(--border)] rounded-[1.5rem] shadow-[0_4px_0_rgba(0,0,0,0.08)] p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1
              className="text-2xl font-bold text-[var(--foreground)]"
              style={{ fontFamily: "var(--font-sans)" }}
            >
              Courses
            </h1>
            <p className="text-sm text-[var(--text-muted)] font-bold mt-1">
              Browse Grammar, IELTS, and General English courses.
            </p>
          </div>

          {/* Search */}
          <div className="relative">
            <input
              value={query}
              onChange={(e) => {
                setPage(1);
                setQuery(e.target.value);
              }}
              placeholder="Search courses..."
              className="w-72 rounded-full border-[2px] border-[var(--border)] bg-[var(--background)] pl-4 pr-3 py-2.5 text-sm outline-none focus:border-[var(--primary)] text-[var(--foreground)] font-bold placeholder:text-[var(--text-muted)] transition-colors"
            />
          </div>
        </div>

        {/* Categories */}
        <div className="mt-4 flex flex-wrap gap-2">
          {categories.map((cat) => {
            const active = categoryFilter === cat;
            const label = cat === "ALL" ? "All" : cat.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
            return (
              <button
                key={cat}
                onClick={() => {
                  setCategoryFilter(cat);
                  setPage(1);
                }}
                className={`rounded-full px-4 py-1.5 text-sm font-bold transition-all ${
                  active
                    ? "bg-[var(--primary)] text-white border-b-[3px] border-[var(--primary-dark)]"
                    : "border-[2px] border-[var(--border)] bg-white text-[var(--text-body)] hover:border-[var(--primary)] hover:text-[var(--primary)]"
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Grid */}
      <section className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {pageItems.map((c) => (
          <article
            key={c.id}
            className="group overflow-hidden bg-white border-[3px] border-[var(--border)] rounded-[1.5rem] shadow-[0_4px_0_rgba(0,0,0,0.08)] transition-all duration-150 hover:-translate-y-[3px] hover:border-[var(--primary)] hover:shadow-[0_6px_0_rgba(0,0,0,0.08)]"
          >
            <Link href={`/courses/${c.slug}`} className="block">
              <div className="h-32 bg-[var(--primary)] flex items-center justify-center">
                <span className="text-4xl font-bold text-white/80" style={{ fontFamily: "var(--font-sans)" }}>
                  {c.title.charAt(0)}
                </span>
              </div>
              <div className="p-4">
                <span className="inline-block rounded-full bg-[var(--primary-light)] px-2.5 py-0.5 text-xs font-bold text-[var(--primary)] mb-2 border-[2px] border-blue-200">
                  {c.category?.replace(/_/g, " ") || "Course"}
                </span>
                <h3
                  className="line-clamp-2 text-sm font-bold text-[var(--foreground)]"
                  style={{ fontFamily: "var(--font-sans)" }}
                >
                  {c.title}
                </h3>
                {c.descriptionMd && (
                  <p className="mt-1 line-clamp-2 text-xs text-[var(--text-muted)]">
                    {c.descriptionMd.slice(0, 100)}...
                  </p>
                )}
                <div className="mt-3 flex items-center gap-3 text-xs text-[var(--text-muted)] font-bold">
                  <span style={{ fontFamily: "var(--font-mono)" }}>
                    {c.lessons?.length ?? 0} lessons
                  </span>
                  {c.level && (
                    <span className="capitalize">{c.level}</span>
                  )}
                </div>
              </div>
            </Link>
          </article>
        ))}
      </section>

      {/* Empty state */}
      {total === 0 && (
        <div className="mt-10 bg-white border-[3px] border-[var(--border)] rounded-[1.5rem] shadow-[0_4px_0_rgba(0,0,0,0.08)] p-6 text-center text-[var(--text-muted)] font-bold">
          {courses.length === 0
            ? "No courses available yet."
            : "No matching courses found."
          }
        </div>
      )}

      {/* Pagination */}
      {total > 0 && maxPage > 1 && (
        <div className="mt-6 flex items-center justify-center gap-2 text-sm">
          <button
            onClick={() => go(current - 1)}
            disabled={current === 1}
            className="rounded-full px-4 py-2 font-bold text-[var(--text-body)] border-[2px] border-[var(--border)] hover:border-[var(--primary)] hover:text-[var(--primary)] disabled:cursor-not-allowed disabled:opacity-40 transition-colors"
          >
            Prev
          </button>
          <span
            className="inline-flex h-9 min-w-9 items-center justify-center rounded-full bg-[var(--primary)] px-3 text-white font-bold border-b-[3px] border-[var(--primary-dark)]"
            style={{ fontFamily: "var(--font-mono)" }}
          >
            {current}
          </span>
          <span className="text-[var(--text-muted)] font-bold" style={{ fontFamily: "var(--font-mono)" }}>
            / {maxPage}
          </span>
          <button
            onClick={() => go(current + 1)}
            disabled={current === maxPage}
            className="rounded-full px-4 py-2 font-bold text-[var(--text-body)] border-[2px] border-[var(--border)] hover:border-[var(--primary)] hover:text-[var(--primary)] disabled:cursor-not-allowed disabled:opacity-40 transition-colors"
          >
            Next
          </button>
        </div>
      )}
    </main>
  );
}
