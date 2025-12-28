"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { getBookmarks, deleteBookmark } from "@/utils/api";

// Material Icon Component
function Icon({ name, className = "" }: { name: string; className?: string }) {
  return <span className={`material-symbols-rounded ${className}`}>{name}</span>;
}

type Bookmark = {
  id: string;
  questionId: string;
  attemptId: string;
  skill: string;
  questionType: string;
  questionContent: string;
  note?: string;
  createdAt: string;
};

export default function BookmarksPage() {
  const router = useRouter();
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("all");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    loadBookmarks();
  }, [filter]);

  async function loadBookmarks() {
    setLoading(true);
    try {
      const opts = filter !== "all" ? { skill: filter } : undefined;
      const res = await getBookmarks(opts);
      // API returns { data: { items, total, page, pageSize } }
      const responseData = (res as any)?.data?.data ?? (res as any)?.data;
      const items = responseData?.items ?? responseData ?? [];
      setBookmarks(Array.isArray(items) ? items : []);
    } catch (error) {
      console.error("Failed to load bookmarks:", error);
      setBookmarks([]);
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(questionId: string) {
    setDeletingId(questionId);
    try {
      await deleteBookmark(questionId);
      setBookmarks((prev) => prev.filter((b) => b.questionId !== questionId));
    } catch (error) {
      console.error("Failed to delete bookmark:", error);
    } finally {
      setDeletingId(null);
    }
  }

  function getTypeIcon(type: string) {
    const icons: Record<string, string> = {
      reading: "auto_stories",
      listening: "headphones",
      writing: "edit_note",
      speaking: "mic",
    };
    return icons[type?.toLowerCase()] || "bookmark";
  }

  function formatDate(iso: string) {
    try {
      const d = new Date(iso);
      return d.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    } catch {
      return "";
    }
  }

  const filters = [
    { id: "all", label: "All" },
    { id: "reading", label: "Reading" },
    { id: "listening", label: "Listening" },
    { id: "writing", label: "Writing" },
    { id: "speaking", label: "Speaking" },
  ];

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <main className="max-w-4xl mx-auto px-4 py-10">
        
        {/* Header */}
        <div className="mb-8">
          <h1 className="font-serif text-3xl font-bold text-slate-900">Saved Items</h1>
          <p className="text-slate-500 mt-1">Questions you've bookmarked for review</p>
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-2">
          {filters.map((f) => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors whitespace-nowrap ${
                filter === f.id
                  ? "bg-slate-900 text-white"
                  : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Content */}
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white border border-slate-200 rounded-xl p-6 animate-pulse">
                <div className="flex gap-4">
                  <div className="w-10 h-10 bg-slate-200 rounded-lg" />
                  <div className="flex-1 space-y-2">
                    <div className="h-5 w-3/4 bg-slate-200 rounded" />
                    <div className="h-4 w-1/2 bg-slate-100 rounded" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : bookmarks.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-white border border-slate-200 rounded-2xl p-12 text-center"
          >
            <div className="w-16 h-16 mx-auto bg-slate-100 rounded-full flex items-center justify-center mb-4">
              <Icon name="bookmark_border" className="text-3xl text-slate-400" />
            </div>
            <h3 className="font-serif text-xl font-semibold text-slate-900 mb-2">
              No saved items yet
            </h3>
            <p className="text-slate-500 mb-6">
              Bookmark questions during practice to review them later
            </p>
            <button
              onClick={() => router.push("/practice")}
              className="bg-slate-900 text-white px-6 py-3 rounded-xl font-medium hover:bg-black transition-colors"
            >
              Start Practicing
            </button>
          </motion.div>
        ) : (
          <div className="space-y-3">
            <AnimatePresence>
              {bookmarks.map((bookmark) => (
                <motion.div
                  key={bookmark.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="bg-white border border-slate-200 rounded-xl p-5 hover:border-slate-300 transition-colors group"
                >
                  <div className="flex items-start gap-4">
                    {/* Icon */}
                    <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center shrink-0">
                      <Icon name={getTypeIcon(bookmark.skill)} className="text-xl text-slate-600" />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-800 line-clamp-2">
                        {bookmark.questionContent || "Bookmarked Question"}
                      </p>
                      <div className="flex items-center gap-3 mt-2 text-xs text-slate-400">
                        <span className="capitalize">{bookmark.skill}</span>
                        <span>•</span>
                        <span>{bookmark.questionType?.replace(/_/g, " ")}</span>
                        <span>•</span>
                        <span>{formatDate(bookmark.createdAt)}</span>
                      </div>
                      {bookmark.note && (
                        <p className="mt-2 text-xs text-slate-500 italic bg-slate-50 px-3 py-2 rounded">
                          Note: {bookmark.note}
                        </p>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => router.push(`/attempts/${bookmark.attemptId}`)}
                        className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                      >
                        View in Context
                      </button>
                      <button
                        onClick={() => handleDelete(bookmark.questionId)}
                        disabled={deletingId === bookmark.questionId}
                        className="p-2 text-slate-400 hover:text-red-500 transition-colors disabled:opacity-50"
                        title="Remove bookmark"
                      >
                        <Icon name={deletingId === bookmark.questionId ? "hourglass_empty" : "delete_outline"} className="text-xl" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}

        {/* Stats Footer */}
        {bookmarks.length > 0 && (
          <div className="mt-8 text-center text-sm text-slate-400">
            {bookmarks.length} item{bookmarks.length !== 1 ? "s" : ""} saved
          </div>
        )}

      </main>
    </div>
  );
}
