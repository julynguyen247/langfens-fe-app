"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FiFileText, FiTrash2, FiEdit2, FiX, FiCheck, FiClock, FiSearch, FiFilter } from "react-icons/fi";
import { getNotes, updateNote, deleteNote } from "@/utils/api";
import { useUserStore } from "@/app/store/userStore";

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
    if (!confirm("Bạn có chắc muốn xóa ghi chú này?")) return;
    
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
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <p className="text-slate-600">Vui lòng đăng nhập để xem ghi chú</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
              <FiFileText className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-800">Ghi chú của tôi</h1>
              <p className="text-sm text-slate-500">
                {total} ghi chú từ các bài đọc
              </p>
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="mb-6">
          <div className="relative">
            <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm kiếm ghi chú..."
              className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm"
            />
          </div>
        </div>

        {/* Notes List */}
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-8 h-8 border-2 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
          </div>
        ) : filteredNotes.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl border border-slate-200">
            <FiFileText className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <p className="text-lg text-slate-500 mb-2">Chưa có ghi chú nào</p>
            <p className="text-sm text-slate-400">
              Ghi chú sẽ xuất hiện ở đây khi bạn tạo trong lúc làm bài Reading
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <AnimatePresence mode="popLayout">
              {filteredNotes.map((note) => (
                <motion.div
                  key={note.id}
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden hover:shadow-md transition-shadow"
                >
                  {/* Selected text preview */}
                  {note.selectedText && (
                    <div className="px-5 py-3 bg-gradient-to-r from-blue-50 to-white border-b border-blue-100">
                      <p className="text-sm text-blue-700 italic line-clamp-2">
                        "{note.selectedText}"
                      </p>
                    </div>
                  )}

                  {/* Content */}
                  <div className="p-5">
                    {editingId === note.id ? (
                      <div className="space-y-4">
                        <textarea
                          value={editContent}
                          onChange={(e) => setEditContent(e.target.value)}
                          className="w-full h-32 p-3 text-sm text-slate-800 border border-slate-200 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                          autoFocus
                        />
                        <div className="flex gap-2 justify-end">
                          <button
                            onClick={handleCancelEdit}
                            className="px-4 py-2 text-sm font-medium text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200 transition flex items-center gap-2"
                          >
                            <FiX className="w-4 h-4" />
                            Hủy
                          </button>
                          <button
                            onClick={() => handleSaveEdit(note.id)}
                            disabled={saving || !editContent.trim()}
                            className="px-4 py-2 text-sm font-medium text-white bg-blue-500 rounded-lg hover:bg-blue-600 transition disabled:opacity-50 flex items-center gap-2"
                          >
                            {saving ? (
                              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                              <FiCheck className="w-4 h-4" />
                            )}
                            Lưu
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <p className="text-slate-700 whitespace-pre-wrap leading-relaxed">{note.content}</p>
                        
                        {/* Footer */}
                        <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-100">
                          <div className="flex items-center gap-1.5 text-xs text-slate-400">
                            <FiClock className="w-4 h-4" />
                            {formatDate(note.createdAt)}
                          </div>
                          
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleEdit(note)}
                              className="p-2 text-slate-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition flex items-center gap-1.5"
                              title="Sửa"
                            >
                              <FiEdit2 className="w-4 h-4" />
                              <span className="text-xs">Sửa</span>
                            </button>
                            <button
                              onClick={() => handleDelete(note.id)}
                              className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition flex items-center gap-1.5"
                              title="Xóa"
                            >
                              <FiTrash2 className="w-4 h-4" />
                              <span className="text-xs">Xóa</span>
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
          <div className="flex justify-center gap-2 mt-8">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-4 py-2 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              Trước
            </button>
            <div className="flex items-center px-4 py-2 text-sm text-slate-600 bg-white border border-slate-200 rounded-lg">
              {page} / {totalPages}
            </div>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="px-4 py-2 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              Sau
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
