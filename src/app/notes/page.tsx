"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { getNotes, updateNote, deleteNote } from "@/utils/api";
import { useUserStore } from "@/app/store/userStore";
import { EmptyState } from "@/components/ui/EmptyState";

type Note = {
  id: string;
  attemptId?: string;
  sectionId?: string;
  selectedText?: string;
  content: string;
  createdAt: string;
  updatedAt: string;
};

export default function NotesPage() {
  const { user } = useUserStore();
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");
  const [saving, setSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const pageSize = 10;

  useEffect(() => {
    if (user) {
      fetchNotes();
    }
  }, [user, page]);

  const fetchNotes = async () => {
    try {
      setLoading(true);
      const res = await getNotes({ page, pageSize });
      const data = res.data?.data ?? res.data ?? {};
      setNotes(data.items ?? []);
      setTotal(data.total ?? 0);
    } catch (err) {
      console.error("Failed to fetch notes:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (note: Note) => {
    setEditingId(note.id);
    setEditContent(note.content);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditContent("");
  };

  const handleSaveEdit = async (noteId: string) => {
    if (!editContent.trim()) return;

    try {
      setSaving(true);
      await updateNote(noteId, editContent.trim());
      setNotes(notes.map(n =>
        n.id === noteId ? { ...n, content: editContent.trim(), updatedAt: new Date().toISOString() } : n
      ));
      setEditingId(null);
      setEditContent("");
    } catch (err) {
      console.error("Failed to update note:", err);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (noteId: string) => {
    if (!confirm("Are you sure you want to delete this note?")) return;

    try {
      await deleteNote(noteId);
      setNotes(notes.filter(n => n.id !== noteId));
      setTotal(t => t - 1);
    } catch (err) {
      console.error("Failed to delete note:", err);
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const filteredNotes = searchQuery
    ? notes.filter(n =>
        n.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
        n.selectedText?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : notes;

  const totalPages = Math.ceil(total / pageSize);

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--background)]">
        <div className="bg-white rounded-[2rem] border-[3px] border-[var(--border)] shadow-[0_4px_0_rgba(0,0,0,0.08)] p-8 text-center">
          <p className="text-[var(--text-body)] font-bold">Please log in to view notes</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1
            className="text-3xl sm:text-4xl font-extrabold text-[var(--foreground)]"
            style={{ fontFamily: "var(--font-sans)" }}
          >
            My Notes
          </h1>
          <p className="text-[var(--text-muted)] mt-2">
            <span style={{ fontFamily: "var(--font-mono)" }}>{total}</span> notes from reading passages
          </p>
        </motion.div>

        {/* Search */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="mb-8"
        >
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search notes..."
            className="w-full px-6 py-4 bg-white rounded-[2rem] border-[3px] border-[var(--border)] shadow-[0_4px_0_rgba(0,0,0,0.08)] text-[var(--foreground)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--primary)] font-bold text-sm transition-all"
          />
        </motion.div>

        {/* Notes Grid */}
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-10 h-10 border-[3px] border-[var(--primary-light)] border-t-[var(--primary)] rounded-full animate-spin" />
          </div>
        ) : filteredNotes.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-[2rem] border-[3px] border-[var(--border)] shadow-[0_4px_0_rgba(0,0,0,0.08)] p-8"
          >
            <EmptyState
              title="No notes yet"
              subtitle="Notes will appear here when you create them during Reading practice"
            />
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <AnimatePresence mode="popLayout">
              {filteredNotes.map((note, idx) => (
                <motion.div
                  key={note.id}
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ delay: idx * 0.03 }}
                  className="bg-white rounded-[2rem] border-[3px] border-[var(--border)] shadow-[0_4px_0_rgba(0,0,0,0.08)] overflow-hidden transition-all hover:-translate-y-[3px] hover:border-[var(--primary)] hover:shadow-[0_6px_0_rgba(0,0,0,0.08)]"
                >
                  {/* Selected text preview */}
                  {note.selectedText && (
                    <div className="px-6 py-3 bg-[var(--primary-light)] border-b-[2px] border-[var(--border)]">
                      <p className="text-sm text-[var(--primary)] font-bold italic line-clamp-2">
                        &ldquo;{note.selectedText}&rdquo;
                      </p>
                    </div>
                  )}

                  {/* Content */}
                  <div className="p-6">
                    {editingId === note.id ? (
                      <div className="space-y-4">
                        <textarea
                          value={editContent}
                          onChange={(e) => setEditContent(e.target.value)}
                          className="w-full h-32 p-4 text-sm text-[var(--foreground)] rounded-[1.5rem] border-[3px] border-[var(--border)] resize-none focus:outline-none focus:border-[var(--primary)] transition-all"
                          autoFocus
                        />
                        <div className="flex gap-2 justify-end">
                          <button
                            onClick={handleCancelEdit}
                            className="px-5 py-2 text-sm font-bold text-[var(--text-body)] bg-white rounded-full border-[2px] border-[var(--border)] hover:border-[var(--text-muted)] transition-all"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={() => handleSaveEdit(note.id)}
                            disabled={saving || !editContent.trim()}
                            className="px-5 py-2 text-sm rounded-full bg-[var(--primary)] text-white font-bold border-b-[4px] border-[var(--primary-dark)] hover:-translate-y-0.5 hover:border-b-[5px] active:translate-y-[2px] active:border-b-[2px] transition-all disabled:opacity-50"
                          >
                            {saving ? "Saving..." : "Save"}
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        {/* Title-like preview */}
                        <p className="text-[var(--text-body)] whitespace-pre-wrap leading-relaxed line-clamp-4">{note.content}</p>

                        {/* Footer */}
                        <div className="flex items-center justify-between mt-5 pt-4 border-t-[2px] border-[var(--border)]">
                          <span
                            className="text-xs font-bold text-[var(--text-muted)]"
                            style={{ fontFamily: "var(--font-mono)" }}
                          >
                            {formatDate(note.createdAt)}
                          </span>

                          <div className="flex gap-2">
                            <button
                              onClick={() => handleEdit(note)}
                              className="px-4 py-1.5 text-xs font-bold text-[var(--primary)] bg-[var(--primary-light)] rounded-full border-[2px] border-[var(--border)] hover:bg-[var(--primary)] hover:text-white hover:border-[var(--primary-dark)] transition-all"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDelete(note.id)}
                              className="px-4 py-1.5 text-xs font-bold text-[var(--destructive)] bg-red-50 rounded-full border-[2px] border-red-200 hover:bg-[var(--destructive)] hover:text-white hover:border-red-700 transition-all"
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex justify-center gap-2 mt-8"
          >
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-5 py-2.5 text-sm font-bold text-[var(--text-body)] bg-white rounded-full border-[2px] border-[var(--border)] hover:border-[var(--primary)] hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              Previous
            </button>
            <div
              className="flex items-center px-5 py-2.5 text-sm font-bold text-[var(--primary)] bg-[var(--primary-light)] rounded-full border-[2px] border-[var(--border)]"
              style={{ fontFamily: "var(--font-mono)" }}
            >
              {page} / {totalPages}
            </div>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="px-5 py-2.5 text-sm font-bold text-[var(--text-body)] bg-white rounded-full border-[2px] border-[var(--border)] hover:border-[var(--primary)] hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              Next
            </button>
          </motion.div>
        )}
      </div>
    </div>
  );
}
