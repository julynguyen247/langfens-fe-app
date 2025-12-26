"use client";

import { useEffect, useState } from "react";
import { FiBookmark, FiTrash2, FiEdit2, FiFilter, FiX } from "react-icons/fi";
import { getBookmarks, deleteBookmark } from "@/utils/api";
import ReactMarkdown from "react-markdown";

type Bookmark = {
  id: string;
  questionId: string;
  questionContent: string | null;
  questionType: string | null;
  skill: string | null;
  note: string | null;
  createdAt: string;
  updatedAt: string | null;
};

type BookmarksResult = {
  items: Bookmark[];
  total: number;
  page: number;
  pageSize: number;
};

export default function BookmarksPage() {
  const [data, setData] = useState<BookmarksResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasNoteFilter, setHasNoteFilter] = useState<boolean | null>(null);
  const [page, setPage] = useState(1);

  useEffect(() => {
    async function fetchBookmarks() {
      try {
        setLoading(true);
        const res = await getBookmarks({
          hasNote: hasNoteFilter ?? undefined,
          page,
          pageSize: 20,
        });
        const result = (res as any).data?.data;
        setData(result);
      } catch (e) {
        console.error("Failed to fetch bookmarks:", e);
        setData(null);
      } finally {
        setLoading(false);
      }
    }
    fetchBookmarks();
  }, [hasNoteFilter, page]);

  const handleDelete = async (questionId: string) => {
    if (!confirm("Xóa bookmark này?")) return;
    try {
      await deleteBookmark(questionId);
      // Refresh data
      const res = await getBookmarks({
        hasNote: hasNoteFilter ?? undefined,
        page,
        pageSize: 20,
      });
      setData((res as any).data?.data);
    } catch (e) {
      console.error("Failed to delete bookmark:", e);
    }
  };

  const totalBookmarks = data?.total ?? 0;
  const maxPage = Math.ceil(totalBookmarks / 20) || 1;

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-6">
      {/* Header */}
      <div className="rounded-2xl border bg-gradient-to-br from-yellow-50 to-amber-100 p-5 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-yellow-500 rounded-xl flex items-center justify-center">
            <FiBookmark className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-yellow-800">
              Câu hỏi đã lưu
            </h1>
            <p className="text-sm text-yellow-700">
              Quản lý các câu hỏi bạn đã bookmark để ôn tập
            </p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 mb-6">
        <div className="flex flex-wrap items-center gap-3">
          <FiFilter className="h-4 w-4 text-slate-500" />

          <select
            value={hasNoteFilter === null ? "" : String(hasNoteFilter)}
            onChange={(e) => {
              const val = e.target.value;
              setHasNoteFilter(
                val === "" ? null : val === "true" ? true : false
              );
              setPage(1);
            }}
            className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-yellow-500"
          >
            <option value="">Tất cả bookmarks</option>
            <option value="true">Có ghi chú</option>
            <option value="false">Không có ghi chú</option>
          </select>

          {hasNoteFilter !== null && (
            <button
              onClick={() => {
                setHasNoteFilter(null);
                setPage(1);
              }}
              className="flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700"
            >
              <FiX className="h-4 w-4" />
              Xóa bộ lọc
            </button>
          )}

          <span className="ml-auto text-sm text-slate-500">
            {totalBookmarks} câu hỏi
          </span>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin h-8 w-8 border-4 border-yellow-500 border-t-transparent rounded-full" />
        </div>
      ) : totalBookmarks === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-10 text-center">
          <FiBookmark className="h-12 w-12 mx-auto text-slate-300 mb-4" />
          <h3 className="text-lg font-semibold text-slate-700">
            Chưa có bookmark
          </h3>
          <p className="text-slate-500 mt-2">
            Bạn chưa bookmark câu hỏi nào. Hãy thử bookmark một số câu hỏi khó để
            ôn tập sau!
          </p>
        </div>
      ) : (
        <>
          {/* Bookmark cards */}
          <div className="space-y-4">
            {data?.items.map((item) => (
              <article
                key={item.id}
                className="bg-white rounded-xl border border-slate-200 p-4"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    {item.skill || item.questionType ? (
                      <div className="flex items-center gap-2 mb-2">
                        {item.skill && (
                          <span className="inline-block rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700">
                            {item.skill}
                          </span>
                        )}
                        {item.questionType && (
                          <span className="inline-block rounded-full bg-orange-100 px-2 py-0.5 text-xs font-medium text-orange-700">
                            {item.questionType.replace(/_/g, " ")}
                          </span>
                        )}
                      </div>
                    ) : null}

                    <div className="prose prose-sm max-w-none text-slate-700 mb-3">
                      {item.questionContent ? (
                        <ReactMarkdown>{item.questionContent}</ReactMarkdown>
                      ) : (
                        <p className="text-slate-400 italic">
                          (Question content not available)
                        </p>
                      )}
                    </div>

                    {item.note && (
                      <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mt-3">
                        <p className="text-xs text-amber-700 font-medium mb-1">
                          Ghi chú:
                        </p>
                        <p className="text-sm text-amber-900">{item.note}</p>
                      </div>
                    )}

                    <div className="mt-3 flex items-center gap-4 text-xs text-slate-500">
                      <span>
                        Saved: {new Date(item.createdAt).toLocaleDateString("vi-VN")}
                      </span>
                      {item.updatedAt && (
                        <span>
                          Updated: {new Date(item.updatedAt).toLocaleDateString("vi-VN")}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col gap-2">
                    <button
                      onClick={() => handleDelete(item.questionId)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                      title="Delete bookmark"
                    >
                      <FiTrash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>

          {/* Pagination */}
          {maxPage > 1 && (
            <div className="mt-6 flex items-center justify-center gap-2 text-sm">
              <button
                onClick={() => setPage(Math.max(1, page - 1))}
                disabled={page === 1}
                className="rounded-md px-3 py-1.5 text-slate-700 hover:bg-slate-100 disabled:cursor-not-allowed disabled:text-slate-400"
              >
                ‹
              </button>
              <span className="inline-flex h-8 min-w-8 items-center justify-center rounded-md bg-yellow-600 px-2 text-white">
                {page}
              </span>
              <span className="text-slate-500">/ {maxPage}</span>
              <button
                onClick={() => setPage(Math.min(maxPage, page + 1))}
                disabled={page === maxPage}
                className="rounded-md px-3 py-1.5 text-slate-700 hover:bg-slate-100 disabled:cursor-not-allowed disabled:text-slate-400"
              >
                ›
              </button>
            </div>
          )}
        </>
      )}
    </main>
  );
}
