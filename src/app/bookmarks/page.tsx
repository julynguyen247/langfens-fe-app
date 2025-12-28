"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { getBookmarks, deleteBookmark } from "@/utils/api";
import ReactMarkdown from "react-markdown";
import PenguinLottie from "@/components/PenguinLottie";

// Material Icon Component
function Icon({ name, className = "" }: { name: string; className?: string }) {
  return <span className={`material-symbols-rounded ${className}`}>{name}</span>;
}

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

const SKILL_ICONS: Record<string, string> = {
  reading: "menu_book",
  listening: "headphones",
  writing: "edit_note",
  speaking: "mic",
};

const SKILL_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  reading: { bg: "bg-[#EFF6FF]", text: "text-[#2563EB]", border: "border-blue-200" },
  listening: { bg: "bg-purple-50", text: "text-purple-600", border: "border-purple-200" },
  writing: { bg: "bg-emerald-50", text: "text-emerald-600", border: "border-emerald-200" },
  speaking: { bg: "bg-amber-50", text: "text-amber-600", border: "border-amber-200" },
};

const QUESTION_TYPE_LABELS: Record<string, string> = {
  "TRUE_FALSE_NOT_GIVEN": "True/False/NG",
  "YES_NO_NOT_GIVEN": "Yes/No/NG",
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
    if (!confirm("Remove this bookmark?")) return;
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
    <div className="min-h-screen w-full bg-[#F8FAFC]">
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* =============================================
            PAGE HEADER
        ============================================= */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-[#EFF6FF] rounded-xl flex items-center justify-center">
                <Icon name="bookmark" className="text-2xl text-[#3B82F6]" />
              </div>
              <div>
                <h1 className="font-serif text-3xl font-bold text-slate-900">
                  Saved Questions
                </h1>
                <p className="text-slate-500 text-sm mt-1">
                  {totalBookmarks} bookmarked questions
                </p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* =============================================
            FILTERS
        ============================================= */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-xl border border-slate-200 p-4 mb-6 shadow-sm"
        >
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2 text-slate-500">
              <Icon name="filter_list" className="text-lg" />
              <span className="text-sm font-medium">Filter by:</span>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => { setHasNoteFilter(null); setPage(1); }}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                  hasNoteFilter === null
                    ? "bg-[#3B82F6] text-white shadow-sm"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                All
              </button>
              <button
                onClick={() => { setHasNoteFilter(true); setPage(1); }}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition flex items-center gap-1 ${
                  hasNoteFilter === true
                    ? "bg-[#3B82F6] text-white shadow-sm"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                <Icon name="sticky_note_2" className="text-base" />
                With Notes
              </button>
              <button
                onClick={() => { setHasNoteFilter(false); setPage(1); }}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                  hasNoteFilter === false
                    ? "bg-[#3B82F6] text-white shadow-sm"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                Without Notes
              </button>
            </div>
          </div>
        </motion.div>

        {/* =============================================
            CONTENT
        ============================================= */}
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse bg-white rounded-xl p-6 shadow-sm border border-slate-200">
                <div className="flex gap-3 mb-4">
                  <div className="h-6 w-20 bg-slate-200 rounded-lg" />
                  <div className="h-6 w-32 bg-slate-200 rounded-lg" />
                </div>
                <div className="h-16 bg-slate-100 rounded-lg" />
              </div>
            ))}
          </div>
        ) : totalBookmarks === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-xl border border-slate-200 p-12 text-center shadow-sm"
          >
            <div className="w-32 h-32 mx-auto mb-6">
              <PenguinLottie />
            </div>
            <h3 className="font-serif text-xl font-semibold text-slate-900 mb-2">
              No bookmarks yet
            </h3>
            <p className="text-slate-500 max-w-md mx-auto">
              Bookmark difficult questions during practice to review them later!
            </p>
          </motion.div>
        ) : (
          <>
            {/* Bookmark cards */}
            <div className="space-y-4">
              <AnimatePresence mode="popLayout">
                {data?.items.map((item, index) => {
                  const skillColor = SKILL_COLORS[item.skill?.toLowerCase() ?? ""] || { bg: "bg-slate-100", text: "text-slate-600", border: "border-slate-200" };
                  const skillIcon = SKILL_ICONS[item.skill?.toLowerCase() ?? ""] || "help";
                  
                  return (
                    <motion.article
                      key={item.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, x: -100 }}
                      transition={{ delay: index * 0.03 }}
                      className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          {/* Tags */}
                          <div className="flex items-center gap-2 mb-3 flex-wrap">
                            {item.skill && (
                              <span className={`inline-flex items-center gap-1.5 rounded-lg ${skillColor.bg} px-2.5 py-1 text-xs font-medium ${skillColor.text}`}>
                                <Icon name={skillIcon} className="text-sm" />
                                {item.skill.charAt(0).toUpperCase() + item.skill.slice(1)}
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
                                (Question content not available)
                              </p>
                            )}
                          </div>

                          {/* Note */}
                          {item.note && (
                            <div className="mt-4 bg-[#EFF6FF] border-l-4 border-[#3B82F6] rounded-r-lg p-4">
                              <p className="text-xs text-[#2563EB] font-semibold mb-1 flex items-center gap-1">
                                <Icon name="sticky_note_2" className="text-sm" />
                                Your Note
                              </p>
                              <p className="text-sm text-slate-700">{item.note}</p>
                            </div>
                          )}

                          {/* Meta */}
                          <div className="mt-4 flex items-center gap-4 text-xs text-slate-400">
                            <span className="flex items-center gap-1">
                              <Icon name="calendar_today" className="text-sm" />
                              Saved: {new Date(item.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                            </span>
                          </div>
                        </div>

                        {/* Delete Button */}
                        <button
                          onClick={() => handleDelete(item.questionId)}
                          disabled={deletingId === item.questionId}
                          className="p-2.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition"
                          title="Remove bookmark"
                        >
                          {deletingId === item.questionId ? (
                            <span className="w-5 h-5 border-2 border-red-200 border-t-red-500 rounded-full animate-spin block" />
                          ) : (
                            <Icon name="delete" className="text-xl" />
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
              <div className="mt-10 flex items-center justify-center gap-2">
                <button
                  onClick={() => setPage(Math.max(1, page - 1))}
                  disabled={page === 1}
                  className="w-10 h-10 rounded-lg bg-white border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-40 transition shadow-sm flex items-center justify-center"
                >
                  <Icon name="chevron_left" className="text-xl" />
                </button>

                <div className="flex items-center gap-2">
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
                        className={`w-10 h-10 rounded-lg text-sm font-medium transition shadow-sm flex items-center justify-center ${
                          pageNum === page
                            ? "bg-[#3B82F6] text-white"
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
                  className="w-10 h-10 rounded-lg bg-white border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-40 transition shadow-sm flex items-center justify-center"
                >
                  <Icon name="chevron_right" className="text-xl" />
                </button>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
