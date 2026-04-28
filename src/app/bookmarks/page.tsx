"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { getBookmarks, deleteBookmark } from "@/utils/api";

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

  function getSkillBadgeStyle(skill: string) {
    const styles: Record<string, string> = {
      reading: "bg-[var(--skill-reading-light)] text-[var(--skill-reading)] border-[var(--skill-reading-border)]",
      listening: "bg-[var(--skill-listening-light)] text-[var(--skill-listening)] border-[var(--skill-listening-border)]",
      writing: "bg-[var(--skill-writing-light)] text-[var(--skill-writing)] border-[var(--skill-writing-border)]",
      speaking: "bg-[var(--skill-speaking-light)] text-[var(--skill-speaking)] border-[var(--skill-speaking-border)]",
    };
    return styles[skill?.toLowerCase()] || "bg-[var(--primary-light)] text-[var(--primary)] border-[var(--skill-reading-border)]";
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
    <div className="min-h-screen bg-[var(--background)]">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">

        {/* Header */}
        <div className="mb-8">
          <h1
            className="text-3xl sm:text-4xl font-extrabold text-[var(--foreground)]"
            style={{ fontFamily: "var(--font-sans)" }}
          >
            Saved Items
          </h1>
          <p className="text-[var(--text-muted)] mt-2">
            Questions you have bookmarked for review
          </p>
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-2">
          {filters.map((f) => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              className={`px-5 py-2.5 text-sm font-bold rounded-full transition-all whitespace-nowrap ${
                filter === f.id
                  ? "bg-[var(--primary)] text-white border-b-[4px] border-[var(--primary-dark)]"
                  : "bg-white text-[var(--text-body)] border-[2px] border-[var(--border)] hover:border-[var(--primary)] hover:-translate-y-0.5"
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
              <div
                key={i}
                className="bg-white border-[3px] border-[var(--border)] rounded-[1.5rem] shadow-[0_4px_0_rgba(0,0,0,0.08)] p-6 animate-pulse"
              >
                <div className="flex gap-4">
                  <div className="w-10 h-10 bg-[var(--border)] rounded-full" />
                  <div className="flex-1 space-y-2">
                    <div className="h-5 w-3/4 bg-[var(--border)] rounded-full" />
                    <div className="h-4 w-1/2 bg-[var(--background)] rounded-full" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : bookmarks.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white border-[3px] border-[var(--border)] rounded-[1.5rem] shadow-[0_4px_0_rgba(0,0,0,0.08)] p-12 text-center"
          >
            <div className="w-16 h-16 mx-auto bg-[var(--primary-light)] rounded-full flex items-center justify-center mb-4">
              <span
                className="text-2xl font-extrabold text-[var(--primary)]"
                style={{ fontFamily: "var(--font-sans)" }}
              >
                ?
              </span>
            </div>
            <h3
              className="text-xl font-bold text-[var(--foreground)] mb-2"
              style={{ fontFamily: "var(--font-sans)" }}
            >
              No saved items yet
            </h3>
            <p className="text-[var(--text-muted)] mb-6">
              Bookmark questions during practice to review them later
            </p>
            <button
              onClick={() => router.push("/practice")}
              className="rounded-full bg-[var(--primary)] text-white font-bold px-8 py-3 border-b-[4px] border-[var(--primary-dark)] hover:-translate-y-0.5 hover:border-b-[5px] active:translate-y-[2px] active:border-b-[2px] transition-all"
            >
              Start Practicing
            </button>
          </motion.div>
        ) : (
          <div className="space-y-4">
            <AnimatePresence>
              {bookmarks.map((bookmark) => (
                <motion.div
                  key={bookmark.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="bg-white border-[3px] border-[var(--border)] rounded-[1.5rem] shadow-[0_4px_0_rgba(0,0,0,0.08)] p-5 transition-all hover:-translate-y-[3px] hover:border-[var(--primary)] hover:shadow-[0_6px_0_rgba(0,0,0,0.08)] group"
                >
                  <div className="flex items-start gap-4">
                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-[var(--foreground)] line-clamp-2">
                        {bookmark.questionContent || "Bookmarked Question"}
                      </p>
                      <div className="flex items-center gap-2 mt-3 flex-wrap">
                        <span className={`px-3 py-1 text-xs font-bold rounded-full border-[2px] capitalize ${getSkillBadgeStyle(bookmark.skill)}`}>
                          {bookmark.skill}
                        </span>
                        <span className="px-3 py-1 text-xs font-bold rounded-full border-[2px] bg-[var(--background)] text-[var(--text-muted)] border-[var(--border)]">
                          {bookmark.questionType?.replace(/_/g, " ")}
                        </span>
                        <span className="text-xs text-[var(--text-muted)]">
                          {formatDate(bookmark.createdAt)}
                        </span>
                      </div>
                      {bookmark.note && (
                        <p className="mt-3 text-xs text-[var(--text-body)] bg-[var(--primary-light)] px-4 py-2 rounded-[1rem] border-[2px] border-[var(--skill-reading-border)]">
                          Note: {bookmark.note}
                        </p>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => router.push(`/attempts/${bookmark.attemptId}`)}
                        className="px-4 py-2 text-sm font-bold text-[var(--primary)] bg-[var(--primary-light)] rounded-full border-[2px] border-[var(--skill-reading-border)] hover:bg-[var(--primary)] hover:text-white hover:border-[var(--primary-dark)] transition-all"
                      >
                        View
                      </button>
                      <button
                        onClick={() => handleDelete(bookmark.questionId)}
                        disabled={deletingId === bookmark.questionId}
                        className="px-4 py-2 text-sm font-bold text-[var(--destructive)] bg-red-50 rounded-full border-[2px] border-red-200 hover:bg-[var(--destructive)] hover:text-white hover:border-red-700 transition-all disabled:opacity-50"
                      >
                        {deletingId === bookmark.questionId ? "..." : "Remove"}
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
          <div className="mt-8 text-center">
            <span
              className="text-sm font-bold text-[var(--text-muted)] bg-white px-4 py-2 rounded-full border-[2px] border-[var(--border)]"
              style={{ fontFamily: "var(--font-mono)" }}
            >
              {bookmarks.length} item{bookmarks.length !== 1 ? "s" : ""} saved
            </span>
          </div>
        )}

      </main>
    </div>
  );
}
