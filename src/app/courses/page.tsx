"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { FiSearch, FiBook, FiClock } from "react-icons/fi";
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
      <main className="mx-auto w-full max-w-6xl px-4 py-6">
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full" />
          <span className="ml-3 text-slate-600">Đang tải khóa học...</span>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-6">
      {/* Header */}
      <div className="rounded-2xl border border-slate-300 bg-gradient-to-br from-indigo-50 to-blue-100 p-5">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-[#3B82F6]">Khóa học</h1>
            <p className="text-sm text-[#3B82F6]">
              Xem qua các khóa học Grammar, IELTS, và tiếng Anh giao tiếp.
            </p>
          </div>

          {/* Search */}
          <div className="relative">
            <FiSearch className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              value={query}
              onChange={(e) => {
                setPage(1);
                setQuery(e.target.value);
              }}
              placeholder="Tìm khóa học..."
              className="w-72 rounded-xl border border-indigo-200 bg-white pl-9 pr-3 py-2 text-sm outline-none focus:border-[#3B82F6] text-slate-800"
            />
          </div>
        </div>

        {/* Categories */}
        <div className="mt-4 flex flex-wrap gap-2">
          {categories.map((cat) => {
            const active = categoryFilter === cat;
            const label = cat === "ALL" ? "Tất cả" : cat.replace(/_/g, " ");
            return (
              <button
                key={cat}
                onClick={() => {
                  setCategoryFilter(cat);
                  setPage(1);
                }}
                className={`rounded-full px-3 py-1 text-sm ${
                  active
                    ? "bg-[#3B82F6] text-white"
                    : "border border-indigo-200 bg-white text-[#3B82F6] hover:bg-indigo-50"
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
            className="group overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition hover:shadow-md"
          >
            <Link href={`/courses/${c.slug}`} className="block">
              <div className="h-32 bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                <FiBook className="h-12 w-12 text-white/80" />
              </div>
              <div className="p-4">
                <span className="inline-block rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700 mb-2">
                  {c.category?.replace(/_/g, " ") || "Course"}
                </span>
                <h3 className="line-clamp-2 text-sm font-semibold text-slate-900">
                  {c.title}
                </h3>
                {c.descriptionMd && (
                  <p className="mt-1 line-clamp-2 text-xs text-slate-600">
                    {c.descriptionMd.slice(0, 100)}...
                  </p>
                )}
                <div className="mt-3 flex items-center gap-3 text-xs text-slate-500">
                  <span className="flex items-center gap-1">
                    <FiBook className="h-3 w-3" />
                    {c.lessons?.length ?? 0} bài học
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
        <div className="mt-10 rounded-xl border border-slate-200 bg-white p-6 text-center text-slate-600">
          {courses.length === 0 
            ? "Chưa có khóa học nào. Hãy thêm khóa học từ admin panel."
            : "Không tìm thấy khóa học phù hợp."
          }
        </div>
      )}

      {/* Pagination */}
      {total > 0 && maxPage > 1 && (
        <div className="mt-6 flex items-center justify-center gap-2 text-sm">
          <button
            onClick={() => go(current - 1)}
            disabled={current === 1}
            className="rounded-md px-3 py-1.5 text-slate-700 hover:bg-slate-100 disabled:cursor-not-allowed disabled:text-slate-400"
          >
            ‹
          </button>
          <span className="inline-flex h-8 min-w-8 items-center justify-center rounded-md bg-slate-900 px-2 text-white">
            {current}
          </span>
          <span className="text-slate-500">/ {maxPage}</span>
          <button
            onClick={() => go(current + 1)}
            disabled={current === maxPage}
            className="rounded-md px-3 py-1.5 text-slate-700 hover:bg-slate-100 disabled:cursor-not-allowed disabled:text-slate-400"
          >
            ›
          </button>
        </div>
      )}
    </main>
  );
}
