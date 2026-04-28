"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { getNotes, updateNote, deleteNote } from "@/utils/api";

type Note = {
  id: string;
  attemptId?: string;
  sectionId?: string;
  selectedText?: string;
  content: string;
  createdAt: string;
  updatedAt: string;
};

type NotesPanelProps = {
  attemptId?: string;
  className?: string;
};

export default function NotesPanel({ attemptId, className = "" }: NotesPanelProps) {
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchNotes();
  }, [attemptId]);

  const fetchNotes = async () => {
    try {
      setLoading(true);
      const res = await getNotes({ attemptId, pageSize: 50 });
      const data = res.data?.data?.items ?? res.data?.items ?? [];
      setNotes(data);
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
    if (!confirm("Bạn có chắc muốn xóa ghi chú này?")) return;

    try {
      await deleteNote(noteId);
      setNotes(notes.filter(n => n.id !== noteId));
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

  if (loading) {
    return (
      <div className={`flex items-center justify-center py-8 ${className}`}>
        <div className="w-6 h-6 border-2 rounded-full animate-spin" style={{ borderColor: "var(--primary-light)", borderTopColor: "var(--primary)" }} />
      </div>
    );
  }

  if (notes.length === 0) {
    return (
      <div className={`text-center py-8 ${className}`}>
        <span className="text-4xl block mx-auto mb-3 font-bold" style={{ color: "var(--border)" }}>Notes</span>
        <p className="text-sm" style={{ color: "var(--text-muted)" }}>Chưa có ghi chú nào</p>
      </div>
    );
  }

  return (
    <div className={`space-y-3 ${className}`}>
      <div className="flex items-center gap-2 mb-4">
        <h3 className="font-semibold" style={{ color: "var(--foreground)" }}>Ghi chú ({notes.length})</h3>
      </div>

      <AnimatePresence mode="popLayout">
        {notes.map((note) => (
          <motion.div
            key={note.id}
            layout
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="border rounded-[1.5rem] shadow-[0_4px_0_rgba(0,0,0,0.08)] overflow-hidden"
            style={{
              backgroundColor: "var(--background)",
              borderColor: "var(--border)",
            }}
          >
            {/* Selected text preview */}
            {note.selectedText && (
              <div className="px-4 py-2 border-b" style={{ backgroundColor: "var(--primary-light)", borderColor: "var(--border)" }}>
                <p className="text-xs italic line-clamp-2" style={{ color: "var(--primary)" }}>
                  "{note.selectedText}"
                </p>
              </div>
            )}

            {/* Content */}
            <div className="p-4">
              {editingId === note.id ? (
                <div className="space-y-3">
                  <textarea
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    className="w-full h-24 p-2 text-sm border rounded-lg resize-none focus:outline-none focus:ring-2"
                    style={{
                      color: "var(--foreground)",
                      borderColor: "var(--border)",
                      // @ts-ignore
                      "--tw-ring-color": "var(--primary)",
                    } as React.CSSProperties}
                    autoFocus
                  />
                  <div className="flex gap-2 justify-end">
                    <button
                      onClick={handleCancelEdit}
                      className="px-3 py-1.5 text-xs font-medium rounded-full transition"
                      style={{
                        color: "var(--foreground)",
                        backgroundColor: "var(--primary-light)",
                      }}
                    >
                      Hủy
                    </button>
                    <button
                      onClick={() => handleSaveEdit(note.id)}
                      disabled={saving || !editContent.trim()}
                      className="px-3 py-1.5 text-xs font-medium text-white rounded-full transition disabled:opacity-50 flex items-center gap-1"
                      style={{ backgroundColor: "var(--primary)" }}
                    >
                      {saving ? (
                        <div className="w-3.5 h-3.5 border border-white/30 border-t-white rounded-full animate-spin" />
                      ) : (
                        "Lưu"
                      )}
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <p className="text-sm whitespace-pre-wrap" style={{ color: "var(--foreground)" }}>{note.content}</p>

                  {/* Footer */}
                  <div className="flex items-center justify-between mt-3 pt-3 border-t" style={{ borderColor: "var(--border)" }}>
                    <div className="flex items-center gap-1 text-xs" style={{ color: "var(--text-muted)" }}>
                      {formatDate(note.createdAt)}
                    </div>

                    <div className="flex gap-1">
                      <button
                        onClick={() => handleEdit(note)}
                        className="px-2 py-1 text-xs rounded-full transition"
                        style={{ color: "var(--primary)" }}
                        title="Sửa"
                      >
                        Sửa
                      </button>
                      <button
                        onClick={() => handleDelete(note.id)}
                        className="px-2 py-1 text-xs rounded-full transition"
                        style={{ color: "var(--destructive)" }}
                        title="Xóa"
                      >
                        Xóa
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
  );
}
