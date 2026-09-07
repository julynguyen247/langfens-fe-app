"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { listExams, createExam, deleteExam } from "@/app/admin/_lib/adminApi";
import {
  AdminExamListItem,
  AdminExamCreate,
  ExamCategory,
  ExamLevel,
} from "@/app/admin/_lib/types";

function getErrorMessage(err: unknown): string {
  if (err && typeof err === "object") {
    if ("response" in err && err.response && typeof err.response === "object") {
      const resp = err.response;
      if ("data" in resp && resp.data && typeof resp.data === "object") {
        const data = resp.data;
        if ("message" in data && typeof data.message === "string") {
          return data.message;
        }
      }
    }
    if ("message" in err && typeof err.message === "string") {
      return err.message;
    }
  }
  return "An unexpected error occurred";
}
export default function AdminExamsPage() {
  const router = useRouter();
  const [exams, setExams] = useState<AdminExamListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");

  // Create Modal State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [createSubmitting, setCreateSubmitting] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [formData, setFormData] = useState<AdminExamCreate>({
    Title: "",
    Slug: "",
    DescriptionMd: "",
    Category: ExamCategory.IELTS,
    Level: ExamLevel.B2,
    DurationMin: 60,
    ImageUrl: "",
  });

  // Delete State
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const loadExams = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await listExams();
      setExams(data);
    } catch (err: unknown) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadExams();
  }, []);

  const filteredExams = useMemo(() => {
    return exams.filter((exam) => {
      const matchesSearch =
        searchQuery.trim() === "" ||
        exam.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        exam.slug.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesCat =
        selectedCategory === "ALL" || exam.category.toUpperCase() === selectedCategory.toUpperCase();

      return matchesSearch && matchesCat;
    });
  }, [exams, searchQuery, selectedCategory]);

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.Title.trim()) {
      setCreateError("Exam title is required");
      return;
    }

    try {
      setCreateSubmitting(true);
      setCreateError(null);
      const res = await createExam({
        ...formData,
        Slug: formData.Slug?.trim() || undefined,
        DescriptionMd: formData.DescriptionMd?.trim() || null,
        ImageUrl: formData.ImageUrl?.trim() || null,
        DurationMin: Number(formData.DurationMin) || 60,
      });

      setIsCreateModalOpen(false);
      setFormData({
        Title: "",
        Slug: "",
        DescriptionMd: "",
        Category: ExamCategory.IELTS,
        Level: ExamLevel.B2,
        DurationMin: 60,
        ImageUrl: "",
      });

      // Reload list or navigate directly to the new exam's editor
      if (res?.id) {
        router.push(`/admin/exams/${res.id}`);
      } else {
        await loadExams();
      }
    } catch (err: unknown) {
      setCreateError(getErrorMessage(err));
    } finally {
      setCreateSubmitting(false);
    }
  };

  const handleDelete = async (id: string, title: string) => {
    if (!window.confirm(`Are you sure you want to delete "${title}"? This cannot be undone.`)) {
      return;
    }

    try {
      setDeletingId(id);
      await deleteExam(id);
      setExams((prev) => prev.filter((x) => x.id !== id));
    } catch (err: unknown) {
      alert(getErrorMessage(err));
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Exams</h1>
          <p className="mt-1 text-sm text-slate-400">
            Create and manage exam configurations, sections, passages, and questions.
          </p>
        </div>
        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/30 transition active:scale-95"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          New Exam
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="mt-6 flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:w-80">
          <svg
            className="w-4 h-4 absolute left-3 top-3 text-slate-500"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
          </svg>
          <input
            type="text"
            placeholder="Search by title or slug..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-9 pr-4 py-2 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition"
          />
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1">
          {["ALL", ...Object.values(ExamCategory)].map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition shrink-0 ${
                selectedCategory.toUpperCase() === cat.toUpperCase()
                  ? "bg-indigo-600/30 text-indigo-300 border border-indigo-500/40"
                  : "bg-slate-900 text-slate-400 hover:text-slate-200 hover:bg-slate-800 border border-slate-800/80"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Main Table / State */}
      <div className="mt-6">
        {loading ? (
          <div className="p-12 text-center rounded-xl bg-slate-900/50 border border-slate-800">
            <div className="w-8 h-8 mx-auto border-2 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" />
            <p className="mt-3 text-sm text-slate-400">Loading exams from database...</p>
          </div>
        ) : error ? (
          <div className="p-6 rounded-xl bg-rose-950/20 border border-rose-900/50 text-center">
            <p className="text-sm font-medium text-rose-400">{error}</p>
            <button
              onClick={loadExams}
              className="mt-3 px-3 py-1.5 text-xs font-medium bg-rose-900/40 hover:bg-rose-900/60 text-rose-200 rounded-lg transition"
            >
              Retry
            </button>
          </div>
        ) : filteredExams.length === 0 ? (
          <div className="p-12 text-center rounded-xl bg-slate-900/30 border border-slate-800/80">
            <p className="text-sm text-slate-400">No exams found matching your search criteria.</p>
          </div>
        ) : (
          <div className="rounded-xl border border-slate-800 overflow-hidden bg-slate-900/40">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="bg-slate-900/80 border-b border-slate-800 text-xs font-semibold uppercase text-slate-400 tracking-wider">
                <tr>
                  <th className="px-6 py-3.5">Title & Slug</th>
                  <th className="px-6 py-3.5">Category</th>
                  <th className="px-6 py-3.5">Level</th>
                  <th className="px-6 py-3.5">Duration</th>
                  <th className="px-6 py-3.5">Status</th>
                  <th className="px-6 py-3.5">Updated</th>
                  <th className="px-6 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredExams.map((exam) => (
                  <tr
                    key={exam.id}
                    className="hover:bg-slate-800/30 transition group"
                  >
                    <td className="px-6 py-4">
                      <Link
                        href={`/admin/exams/${exam.id}`}
                        className="font-semibold text-slate-100 hover:text-indigo-400 transition"
                      >
                        {exam.title}
                      </Link>
                      <div className="text-xs text-slate-500 font-mono mt-0.5">
                        {exam.slug}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-block px-2 py-0.5 text-xs font-semibold rounded bg-slate-800 text-slate-300 border border-slate-700/50">
                        {exam.category}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-xs font-semibold text-indigo-300">
                        {exam.level}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-400">
                      {exam.durationMin} min
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-block px-2 py-0.5 text-[11px] font-bold tracking-wide rounded ${
                          exam.status?.toUpperCase() === "PUBLISHED"
                            ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                            : exam.status?.toUpperCase() === "ARCHIVED"
                            ? "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                            : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                        }`}
                      >
                        {exam.status || "DRAFT"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-500">
                      {new Date(exam.updatedAt || exam.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          href={`/admin/exams/${exam.id}`}
                          className="px-2.5 py-1 text-xs font-medium rounded-lg bg-indigo-600/20 text-indigo-300 hover:bg-indigo-600/30 border border-indigo-500/30 transition"
                        >
                          Edit
                        </Link>
                        <button
                          onClick={() => handleDelete(exam.id, exam.title)}
                          disabled={deletingId === exam.id}
                          className="px-2.5 py-1 text-xs font-medium rounded-lg bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 border border-rose-500/20 transition disabled:opacity-50"
                        >
                          {deletingId === exam.id ? "..." : "Delete"}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* New Exam Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4">
          <div className="w-full max-w-lg rounded-2xl bg-slate-900 border border-slate-800 p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <h2 className="text-lg font-bold text-white">Create New Exam</h2>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="text-slate-500 hover:text-slate-300 text-lg leading-none"
              >
                ✕
              </button>
            </div>

            {createError && (
              <div className="mt-4 p-3 rounded-lg bg-rose-950/40 border border-rose-900 text-xs text-rose-300">
                {createError}
              </div>
            )}

            <form onSubmit={handleCreateSubmit} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                  Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Cambridge IELTS 19 Academic Reading Test 1"
                  value={formData.Title}
                  onChange={(e) => setFormData({ ...formData, Title: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                  Slug (Optional)
                </label>
                <input
                  type="text"
                  placeholder="Auto-generated from title if blank"
                  value={formData.Slug || ""}
                  onChange={(e) => setFormData({ ...formData, Slug: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-indigo-500 font-mono text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                    Category
                  </label>
                  <select
                    value={formData.Category}
                    onChange={(e) => setFormData({ ...formData, Category: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-indigo-500"
                  >
                    {Object.values(ExamCategory).map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                    Level
                  </label>
                  <select
                    value={formData.Level}
                    onChange={(e) => setFormData({ ...formData, Level: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-indigo-500"
                  >
                    {Object.values(ExamLevel).map((lvl) => (
                      <option key={lvl} value={lvl}>
                        {lvl}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                    Duration (Minutes)
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={360}
                    value={formData.DurationMin}
                    onChange={(e) => setFormData({ ...formData, DurationMin: Number(e.target.value) })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                    Cover Image URL
                  </label>
                  <input
                    type="url"
                    placeholder="https://..."
                    value={formData.ImageUrl || ""}
                    onChange={(e) => setFormData({ ...formData, ImageUrl: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                  Description (Markdown)
                </label>
                <textarea
                  rows={3}
                  placeholder="Exam summary, instructions, or overview..."
                  value={formData.DescriptionMd || ""}
                  onChange={(e) => setFormData({ ...formData, DescriptionMd: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-indigo-500 font-mono text-xs"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createSubmitting}
                  className="px-4 py-2 text-xs font-medium rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/30 transition disabled:opacity-50"
                >
                  {createSubmitting ? "Creating..." : "Create Exam"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
