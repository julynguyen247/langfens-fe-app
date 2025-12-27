"use client";

import { useState, useEffect, createContext, useContext } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FiEdit3, FiFileText, FiBook, FiX, FiPlus, FiVolume2, FiSave } from "react-icons/fi";
import { lookupDictionary, createNote } from "@/utils/api";

export type ToolMode = "highlight" | "notes" | "vocabulary" | null;

export const ToolModeContext = createContext<{
  activeMode: ToolMode;
  setActiveMode: (mode: ToolMode) => void;
}>({
  activeMode: null,
  setActiveMode: () => {},
});

export function useToolMode() {
  return useContext(ToolModeContext);
}

type DictionaryEntry = {
  id: number;
  word: string;
  pos: string;
  pronunciations?: {
    region?: string;
    ipa?: string;
    mp3Url?: string;
  }[];
  vietnameseTerms?: string[];
  senses?: {
    definitionEn: string;
    definitionVi?: string;
    vietnameseTerms?: string[];
    examples?: string[];
    labels?: string[];
  }[];
};

type ReadingToolbarProps = {
  onAddToFlashcard?: (word: string, definition: string) => void;
  activeMode: ToolMode;
  onModeChange: (mode: ToolMode) => void;
  attemptId?: string;
  sectionId?: string;
};

export default function ReadingToolbar({ 
  onAddToFlashcard, 
  activeMode,
  onModeChange,
  attemptId,
  sectionId
}: ReadingToolbarProps) {
  // Vocabulary lookup state
  const [selectedWord, setSelectedWord] = useState<string | null>(null);
  const [wordPosition, setWordPosition] = useState({ x: 0, y: 0 });
  const [entry, setEntry] = useState<DictionaryEntry | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Notes state
  const [notePopup, setNotePopup] = useState<{
    visible: boolean;
    selectedText: string;
    position: { x: number; y: number };
  }>({ visible: false, selectedText: "", position: { x: 0, y: 0 } });
  const [noteContent, setNoteContent] = useState("");
  const [savingNote, setSavingNote] = useState(false);

  const tools = [
    { id: "highlight", icon: FiEdit3, label: "Highlight", shortcut: "H", activeColor: "bg-blue-500" },
    { id: "notes", icon: FiFileText, label: "Notes", shortcut: "N", activeColor: "bg-blue-500" },
    { id: "vocabulary", icon: FiBook, label: "Tra từ vựng", shortcut: "T", activeColor: "bg-blue-500" },
  ];

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      
      switch (e.key.toLowerCase()) {
        case "h":
          onModeChange(activeMode === "highlight" ? null : "highlight");
          break;
        case "n":
          onModeChange(activeMode === "notes" ? null : "notes");
          break;
        case "t":
          onModeChange(activeMode === "vocabulary" ? null : "vocabulary");
          break;
        case "escape":
          onModeChange(null);
          setSelectedWord(null);
          closeNotePopup();
          break;
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [activeMode, onModeChange]);

  // Handle double-click for vocabulary lookup when in vocabulary mode
  useEffect(() => {
    if (activeMode !== "vocabulary") return;

    const handleDoubleClick = (e: MouseEvent) => {
      const selection = window.getSelection();
      const text = selection?.toString().trim();
      
      if (text && text.length > 1 && text.length < 50 && /^[a-zA-Z\-']+$/.test(text)) {
        const range = selection?.getRangeAt(0);
        const rect = range?.getBoundingClientRect();
        
        if (rect) {
          setWordPosition({
            x: rect.left + rect.width / 2,
            y: rect.bottom + 8,
          });
          setSelectedWord(text.toLowerCase());
        }
      }
    };

    document.addEventListener("dblclick", handleDoubleClick);
    return () => document.removeEventListener("dblclick", handleDoubleClick);
  }, [activeMode]);

  // Handle text selection for notes when in notes mode
  useEffect(() => {
    if (activeMode !== "notes") return;

    const handleMouseUp = (e: MouseEvent) => {
      const selection = window.getSelection();
      const text = selection?.toString().trim();
      
      if (text && text.length > 0) {
        const range = selection?.getRangeAt(0);
        const rect = range?.getBoundingClientRect();
        
        if (rect) {
          setNotePopup({
            visible: true,
            selectedText: text,
            position: {
              x: rect.left + rect.width / 2,
              y: rect.bottom + 8,
            },
          });
          setNoteContent("");
        }
      }
    };

    document.addEventListener("mouseup", handleMouseUp);
    return () => document.removeEventListener("mouseup", handleMouseUp);
  }, [activeMode]);

  // Fetch word definition
  useEffect(() => {
    if (!selectedWord) {
      setEntry(null);
      return;
    }

    const fetchDefinition = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const data = await lookupDictionary(selectedWord);
        setEntry(data);
      } catch (err: any) {
        if (err?.response?.status === 404) {
          setError("Không tìm thấy từ này");
        } else {
          setError("Lỗi khi tra từ");
        }
        setEntry(null);
      } finally {
        setLoading(false);
      }
    };

    fetchDefinition();
  }, [selectedWord]);

  const handleToolClick = (toolId: string) => {
    onModeChange(activeMode === toolId ? null : toolId as ToolMode);
    setSelectedWord(null);
    closeNotePopup();
  };

  const closeDictionary = () => {
    setSelectedWord(null);
    setEntry(null);
    window.getSelection()?.removeAllRanges();
  };

  const closeNotePopup = () => {
    setNotePopup({ visible: false, selectedText: "", position: { x: 0, y: 0 } });
    setNoteContent("");
    window.getSelection()?.removeAllRanges();
  };

  const handleSaveNote = async () => {
    if (!noteContent.trim()) return;
    
    try {
      setSavingNote(true);
      await createNote({
        attemptId,
        sectionId,
        selectedText: notePopup.selectedText,
        content: noteContent.trim(),
      });
      closeNotePopup();
    } catch (err) {
      console.error("Failed to save note:", err);
    } finally {
      setSavingNote(false);
    }
  };

  const handleAddToFlashcard = () => {
    if (entry && onAddToFlashcard) {
      const definition = entry.senses?.[0]?.definitionEn || entry.vietnameseTerms?.[0] || "";
      onAddToFlashcard(entry.word, definition);
      closeDictionary();
    }
  };

  return (
    <div>
      {/* Sidebar Toolbar - Takes layout space */}
      <div className="w-20 shrink-0 bg-white border-r border-slate-200 flex flex-col h-full">
        {/* Header */}
        <div className="px-2 py-3 border-b border-slate-100 bg-slate-50">
          <span className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider text-center">
            Công cụ
          </span>
        </div>
        
        {/* Tools */}
        <div className="flex-1 p-2 space-y-2">
          {tools.map((tool) => {
            const Icon = tool.icon;
            const isActive = activeMode === tool.id;
            
            return (
              <button
                key={tool.id}
                onClick={() => handleToolClick(tool.id)}
                className={`w-full flex flex-col items-center gap-1 px-2 py-3 rounded-lg transition-all border ${
                  isActive 
                    ? `${tool.activeColor} text-white border-transparent shadow-md` 
                    : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50 hover:border-slate-300"
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="text-[9px] font-medium leading-tight text-center">
                  {tool.label}
                </span>
                <span className={`text-[8px] ${isActive ? 'text-white/70' : 'text-slate-400'}`}>
                  Phím ({tool.shortcut})
                </span>
              </button>
            );
          })}
        </div>
        
        {/* Mode indicator */}
        <AnimatePresence>
          {activeMode && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="p-2 border-t border-slate-100"
            >
              <div className="text-[9px] text-slate-500 text-center leading-tight">
                {activeMode === "highlight" && "Bôi đen để highlight"}
                {activeMode === "notes" && "Chọn text để ghi chú"}
                {activeMode === "vocabulary" && "Double-click tra từ"}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {notePopup.visible && activeMode === "notes" && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="fixed z-[9999] w-80 bg-white rounded-lg border border-slate-200 shadow-xl"
            style={{
              left: Math.min(Math.max(notePopup.position.x - 160, 10), window.innerWidth - 340),
              top: Math.min(notePopup.position.y, window.innerHeight - 280),
            }}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-3 border-b border-slate-100 bg-gradient-to-r from-blue-50 to-white">
              <div className="flex items-center gap-2">
                <FiFileText className="w-4 h-4 text-blue-500" />
                <span className="font-semibold text-slate-900 text-sm">Thêm ghi chú</span>
              </div>
              <button
                onClick={closeNotePopup}
                className="p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded transition"
              >
                <FiX className="w-4 h-4" />
              </button>
            </div>

            {/* Selected text */}
            {notePopup.selectedText && (
              <div className="px-3 py-2 bg-blue-50 border-b border-blue-100">
                <p className="text-xs text-blue-700 italic line-clamp-2">
                  "{notePopup.selectedText}"
                </p>
              </div>
            )}

            {/* Note input */}
            <div className="p-3">
              <textarea
                value={noteContent}
                onChange={(e) => setNoteContent(e.target.value)}
                placeholder="Viết ghi chú của bạn..."
                className="w-full h-24 p-2 text-sm text-slate-800 border border-slate-200 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                autoFocus
              />
            </div>

            {/* Footer */}
            <div className="p-3 border-t border-slate-100 bg-slate-50 flex gap-2">
              <button
                onClick={closeNotePopup}
                className="flex-1 py-2 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition"
              >
                Hủy
              </button>
              <button
                onClick={handleSaveNote}
                disabled={!noteContent.trim() || savingNote}
                className="flex-1 py-2 text-sm font-medium text-white bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 rounded-lg transition flex items-center justify-center gap-2 shadow-sm disabled:opacity-50"
              >
                {savingNote ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <FiSave className="w-4 h-4" />
                    Lưu
                  </>
                )}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Dictionary Popup */}
      <AnimatePresence>
        {selectedWord && activeMode === "vocabulary" && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="fixed z-[9999] w-80 bg-white rounded-lg border border-slate-200 shadow-xl"
            style={{
              left: Math.min(wordPosition.x - 160, window.innerWidth - 340),
              top: Math.min(wordPosition.y, window.innerHeight - 300),
            }}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-3 border-b border-slate-100 
             from-blue-50 to-white">
              <div className="flex items-center gap-2">
                <FiBook className="w-4 h-4 text-blue-500" />
                <span className="font-semibold text-slate-900">{selectedWord}</span>
              </div>
              <button
                onClick={closeDictionary}
                className="p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded transition"
              >
                <FiX className="w-4 h-4" />
              </button>
            </div>

            {/* Content */}
            <div className="p-3 max-h-64 overflow-y-auto">
              {loading && (
                <div className="flex items-center justify-center py-6">
                  <div className="w-6 h-6 border-2 border-slate-200 border-t-blue-500 rounded-full animate-spin" />
                </div>
              )}

              {error && (
                <div className="text-center py-6 text-slate-500 text-sm">
                  {error}
                </div>
              )}

              {entry && !loading && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-lg font-bold text-slate-900">{entry.word}</span>
                    {entry.pos && (
                      <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full font-medium">
                        {entry.pos}
                      </span>
                    )}
                    {entry.pronunciations?.[0]?.ipa && (
                      <button className="p-1 text-slate-400 hover:text-blue-500 transition">
                        <FiVolume2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  {entry.pronunciations?.[0]?.ipa && (
                    <div className="text-sm text-slate-500 font-mono">/{entry.pronunciations[0].ipa}/</div>
                  )}

                  {/* Vietnamese meanings from entry level */}
                  {entry.vietnameseTerms && entry.vietnameseTerms.length > 0 && (
                    <div className="px-2 py-1.5 bg-amber-50 rounded-lg border border-amber-100">
                      <span className="text-sm font-medium text-amber-800">
                        {entry.vietnameseTerms.slice(0, 3).join(", ")}
                      </span>
                    </div>
                  )}

                  {entry.senses && entry.senses.length > 0 && (
                    <div className="space-y-3 pt-1">
                      {entry.senses.slice(0, 3).map((sense, idx) => (
                        <div key={idx} className="text-sm">
                          <div className="text-slate-700">
                            <span className="inline-flex items-center justify-center w-5 h-5 text-xs font-medium text-blue-600 bg-blue-50 rounded-full mr-2">
                              {idx + 1}
                            </span>
                            {sense.definitionEn}
                          </div>
                          {/* Vietnamese translation */}
                          {(sense.definitionVi || (sense.vietnameseTerms && sense.vietnameseTerms.length > 0)) && (
                            <div className="mt-1 pl-7 text-sm text-amber-700">
                              → {sense.definitionVi || sense.vietnameseTerms?.join(", ")}
                            </div>
                          )}
                          {sense.examples && sense.examples[0] && (
                            <div className="mt-1.5 text-xs text-slate-500 italic pl-7 border-l-2 border-blue-100 ml-2.5">
                              "{sense.examples[0]}"
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Footer */}
            {entry && !loading && onAddToFlashcard && (
              <div className="p-3 border-t border-slate-100 bg-slate-50">
                <button
                  onClick={handleAddToFlashcard}
                  className="w-full py-2.5 text-sm font-medium text-white bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 rounded-lg transition flex items-center justify-center gap-2 shadow-sm"
                >
                  <FiPlus className="w-4 h-4" />
                  Thêm vào Flashcard
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
