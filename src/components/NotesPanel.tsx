"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FiFileText, FiTrash2, FiEdit2, FiX, FiCheck, FiClock } from "react-icons/fi";
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
        <div className="w-6 h-6 border-2 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
      </div>
    );
  }

  if (notes.length === 0) {
    return (
      <div className={`text-center py-8 ${className}`}>
        <FiFileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
        <p className="text-sm text-slate-500">Chưa có ghi chú nào</p>
      </div>
    );
  }

  return (
    <div className={`space-y-3 ${className}`}>
      <div className="flex items-center gap-2 mb-4">
        <FiFileText className="w-5 h-5 text-blue-500" />
        <h3 className="font-semibold text-slate-800">Ghi chú ({notes.length})</h3>
      </div>

      <AnimatePresence mode="popLayout">
        {notes.map((note) => (
          <motion.div
            key={note.id}
            layout
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden"
          >
            {/* Selected text preview */}
            {note.selectedText && (
              <div className="px-4 py-2 bg-blue-50 border-b border-blue-100">
                <p className="text-xs text-blue-700 italic line-clamp-2">
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
                    className="w-full h-24 p-2 text-sm text-slate-800 border border-slate-200 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                    autoFocus
                  />
                  <div className="flex gap-2 justify-end">
                    <button
                      onClick={handleCancelEdit}
                      className="px-3 py-1.5 text-xs font-medium text-slate-600 bg-slate-100 rounded hover:bg-slate-200 transition"
                    >
                      <FiX className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleSaveEdit(note.id)}
                      disabled={saving || !editContent.trim()}
                      className="px-3 py-1.5 text-xs font-medium text-white bg-blue-500 rounded hover:bg-blue-600 transition disabled:opacity-50 flex items-center gap-1"
                    >
                      {saving ? (
                        <div className="w-3.5 h-3.5 border border-white/30 border-t-white rounded-full animate-spin" />
                      ) : (
                        <FiCheck className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <p className="text-sm text-slate-700 whitespace-pre-wrap">{note.content}</p>
                  
                  {/* Footer */}
                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-100">
                    <div className="flex items-center gap-1 text-xs text-slate-400">
                      <FiClock className="w-3.5 h-3.5" />
                      {formatDate(note.createdAt)}
                    </div>
                    
                    <div className="flex gap-1">
                      <button
                        onClick={() => handleEdit(note)}
                        className="p-1.5 text-slate-400 hover:text-blue-500 hover:bg-blue-50 rounded transition"
                        title="Sửa"
                      >
                        <FiEdit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(note.id)}
                        className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded transition"
                        title="Xóa"
                      >
                        <FiTrash2 className="w-3.5 h-3.5" />
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
