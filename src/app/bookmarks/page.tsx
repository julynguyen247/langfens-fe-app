"use client";

import { useEffect, useState } from "react";
import { FiBookmark, FiTrash2, FiFilter, FiX, FiChevronLeft, FiChevronRight, FiSearch } from "react-icons/fi";
import { motion, AnimatePresence } from "framer-motion";
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

const SKILL_COLORS: Record<string, { bg: string; text: string }> = {
  reading: { bg: "bg-blue-100", text: "text-blue-700" },
  listening: { bg: "bg-purple-100", text: "text-purple-700" },
  writing: { bg: "bg-emerald-100", text: "text-emerald-700" },
  speaking: { bg: "bg-amber-100", text: "text-amber-700" },
};

const QUESTION_TYPE_LABELS: Record<string, string> = {
  "TRUE_FALSE_NOT_GIVEN": "True/False/Not Given",
  "YES_NO_NOT_GIVEN": "Yes/No/Not Given",
  "MCQ_SINGLE": "Multiple Choice",
  "MCQ_MULTIPLE": "Multiple Selection",
  "MATCHING_HEADING": "Matching Headings",
  "MATCHING_INFORMATION": "Matching Information",
  "MATCHING_FEATURES": "Matching Features",
  "SUMMARY_COMPLETION": "Summary Completion",
  "TABLE_COMPLETION": "Table Completion",
  "SENTENCE_COMPLETION": "Sentence Completion",
  "DIAGRAM_LABEL": "Diagram Labelling",
  "SHORT_ANSWER": "Short Answer",
  "MAP_LABEL": "Map Labelling",
  "GAP_FILLING": "Gap Filling",
};

function formatQuestionType(type: string): string {
  return QUESTION_TYPE_LABELS[type] || type.split("_").map(w => w.charAt(0) + w.slice(1).toLowerCase()).join(" ");
}

export default function BookmarksPage() {
  const [data, setData] = useState<BookmarksResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasNoteFilter, setHasNoteFilter] = useState<boolean | null>(null);
  const [page, setPage] = useState(1);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    fetchBookmarks();
  }, [hasNoteFilter, page]);

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

  const handleDelete = async (questionId: string) => {
    if (!confirm("Xóa bookmark này?")) return;
    setDeletingId(questionId);
    try {
      await deleteBookmark(questionId);
      await fetchBookmarks();
    } catch (e) {
      console.error("Failed to delete bookmark:", e);
    } finally {
      setDeletingId(null);
    }
  };

  const totalBookmarks = data?.total ?? 0;
  const maxPage = Math.ceil(totalBookmarks / 20) || 1;

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50/50 to-white">
      <main className="mx-auto w-full max-w-5xl px-4 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-gradient-to-br from-amber-400 to-orange-500 rounded-2xl flex items-center justify-center shadow-lg shadow-amber-200">
              <FiBookmark className="h-7 w-7 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-800">
                Câu hỏi đã lưu
              </h1>
              <p className="text-slate-500 text-sm">
                {totalBookmarks} câu hỏi đã bookmark
              </p>
            </div>
          </div>
        </motion.div>

        {/* Filters */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-2xl border border-slate-100 p-4 mb-6 shadow-sm"
        >
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 text-slate-500">
              <FiFilter className="h-4 w-4" />
              <span className="text-sm font-medium">Lọc theo:</span>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => { setHasNoteFilter(null); setPage(1); }}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition ${
                  hasNoteFilter === null
                    ? "bg-amber-500 text-white shadow-md"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                Tất cả
              </button>
              <button
                onClick={() => { setHasNoteFilter(true); setPage(1); }}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition ${
                  hasNoteFilter === true
                    ? "bg-amber-500 text-white shadow-md"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                Có ghi chú
              </button>
              <button
                onClick={() => { setHasNoteFilter(false); setPage(1); }}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition ${
                  hasNoteFilter === false
                    ? "bg-amber-500 text-white shadow-md"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                Chưa có ghi chú
              </button>
            </div>
          </div>
        </motion.div>

        {/* Content */}
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
                <div className="flex gap-3 mb-4">
                  <div className="h-6 w-20 bg-slate-200 rounded-full" />
                  <div className="h-6 w-32 bg-slate-200 rounded-full" />
                </div>
                <div className="h-20 bg-slate-100 rounded-xl" />
              </div>
            ))}
          </div>
        ) : totalBookmarks === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl border border-slate-100 p-16 text-center shadow-sm"
          >
            <div className="w-20 h-20 mx-auto mb-4 bg-amber-100 rounded-full flex items-center justify-center">
              <FiBookmark className="h-10 w-10 text-amber-400" />
            </div>
            <h3 className="text-xl font-semibold text-slate-700">
              Chưa có bookmark
            </h3>
            <p className="text-slate-500 mt-2 max-w-md mx-auto">
              Bạn chưa bookmark câu hỏi nào. Hãy thử bookmark những câu hỏi khó để ôn tập sau!
            </p>
          </motion.div>
        ) : (
          <>
            {/* Bookmark cards */}
            <div className="space-y-4">
              <AnimatePresence mode="popLayout">
                {data?.items.map((item, index) => {
                  const skillColor = SKILL_COLORS[item.skill?.toLowerCase() ?? ""] || { bg: "bg-slate-100", text: "text-slate-700" };
                  
                  return (
                    <motion.article
                      key={item.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, x: -100 }}
                      transition={{ delay: index * 0.05 }}
                      className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          {/* Tags */}
                          <div className="flex items-center gap-2 mb-3 flex-wrap">
                            {item.skill && (
                              <span className={`inline-flex items-center gap-1 rounded-lg ${skillColor.bg} px-2.5 py-1 text-xs font-medium ${skillColor.text}`}>
                                {item.skill === "reading" && "📖"}
                                {item.skill === "listening" && "🎧"}
                                {item.skill === "writing" && "✍️"}
                                {item.skill === "speaking" && "🎤"}
                                {item.skill}
                              </span>
                            )}
                            {item.questionType && (
                              <span className="inline-flex rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
                                {formatQuestionType(item.questionType)}
                              </span>
                            )}
                          </div>

                          {/* Question Content */}
                          <div className="prose prose-sm prose-slate max-w-none [&>p]:mb-2 [&>ul]:mb-2">
                            {item.questionContent ? (
                              <ReactMarkdown>{item.questionContent}</ReactMarkdown>
                            ) : (
                              <p className="text-slate-400 italic">
                                (Nội dung câu hỏi không khả dụng)
                              </p>
                            )}
                          </div>

                          {/* Note */}
                          {item.note && (
                            <div className="mt-4 bg-gradient-to-r from-amber-50 to-orange-50 border-l-4 border-amber-400 rounded-r-xl p-4">
                              <p className="text-xs text-amber-600 font-semibold mb-1 flex items-center gap-1">
                                📝 Ghi chú của bạn
                              </p>
                              <p className="text-sm text-amber-800">{item.note}</p>
                            </div>
                          )}

                          {/* Meta */}
                          <div className="mt-4 flex items-center gap-4 text-xs text-slate-400">
                            <span>
                              Lưu: {new Date(item.createdAt).toLocaleDateString("vi-VN")}
                            </span>
                          </div>
                        </div>

                        {/* Delete Button */}
                        <button
                          onClick={() => handleDelete(item.questionId)}
                          disabled={deletingId === item.questionId}
                          className="p-2.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition"
                          title="Xóa bookmark"
                        >
                          {deletingId === item.questionId ? (
                            <span className="w-5 h-5 border-2 border-red-200 border-t-red-500 rounded-full animate-spin block" />
                          ) : (
                            <FiTrash2 className="w-5 h-5" />
                          )}
                        </button>
                      </div>
                    </motion.article>
                  );
                })}
              </AnimatePresence>
            </div>

            {/* Pagination */}
            {maxPage > 1 && (
              <div className="mt-8 flex items-center justify-center gap-2">
                <button
                  onClick={() => setPage(Math.max(1, page - 1))}
                  disabled={page === 1}
                  className="p-2.5 rounded-xl bg-white border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-40 transition shadow-sm"
                >
                  <FiChevronLeft className="w-5 h-5" />
                </button>

                <div className="flex items-center gap-1 px-2">
                  {Array.from({ length: Math.min(5, maxPage) }, (_, i) => {
                    let pageNum = i + 1;
                    if (maxPage > 5) {
                      if (page <= 3) pageNum = i + 1;
                      else if (page >= maxPage - 2) pageNum = maxPage - 4 + i;
                      else pageNum = page - 2 + i;
                    }
                    return (
                      <button
                        key={pageNum}
                        onClick={() => setPage(pageNum)}
                        className={`min-w-10 h-10 rounded-xl text-sm font-medium transition shadow-sm ${
                          pageNum === page
                            ? "bg-amber-500 text-white"
                            : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                </div>

                <button
                  onClick={() => setPage(Math.min(maxPage, page + 1))}
                  disabled={page === maxPage}
                  className="p-2.5 rounded-xl bg-white border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-40 transition shadow-sm"
                >
                  <FiChevronRight className="w-5 h-5" />
                </button>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
