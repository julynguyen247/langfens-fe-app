"use client";

import { useState, useEffect, createContext, useContext } from "react";
import { motion, AnimatePresence } from "framer-motion";
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
    { id: "highlight", label: "Highlight", shortcut: "H" },
    { id: "notes", label: "Notes", shortcut: "N" },
    { id: "vocabulary", label: "Tra từ vựng", shortcut: "T" },
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
      <div className="w-20 shrink-0 border-r flex flex-col h-full" style={{ backgroundColor: "var(--background)", borderColor: "var(--border)" }}>
        {/* Header */}
        <div className="px-2 py-3 border-b" style={{ borderColor: "var(--border)", backgroundColor: "var(--background)" }}>
          <span className="block text-[10px] font-semibold tracking-wider text-center" style={{ color: "var(--text-muted)" }}>
            Công cụ
          </span>
        </div>

        {/* Tools */}
        <div className="flex-1 p-2 space-y-2">
          {tools.map((tool) => {
            const isActive = activeMode === tool.id;

            return (
              <button
                key={tool.id}
                onClick={() => handleToolClick(tool.id)}
                className={`w-full flex flex-col items-center gap-1 px-2 py-3 rounded-lg transition-all border ${
                  isActive
                    ? "text-white border-transparent shadow-md"
                    : "border hover:opacity-80"
                }`}
                style={
                  isActive
                    ? { backgroundColor: "var(--primary)" }
                    : {
                        backgroundColor: "var(--background)",
                        color: "var(--foreground)",
                        borderColor: "var(--border)",
                      }
                }
              >
                <span className="text-[9px] font-medium leading-tight text-center">
                  {tool.label}
                </span>
                <span className="text-[8px]" style={{ opacity: isActive ? 0.7 : 0.5 }}>
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
              className="p-2 border-t"
              style={{ borderColor: "var(--border)" }}
            >
              <div className="text-[9px] text-center leading-tight" style={{ color: "var(--text-muted)" }}>
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
            className="fixed z-[9999] w-80 rounded-[1.5rem] border-[3px] shadow-[0_4px_0_rgba(0,0,0,0.08)]"
            style={{
              left: Math.min(Math.max(notePopup.position.x - 160, 10), window.innerWidth - 340),
              top: Math.min(notePopup.position.y, window.innerHeight - 280),
              backgroundColor: "var(--background)",
              borderColor: "var(--border)",
            }}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-3 border-b" style={{ borderColor: "var(--border)" }}>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-sm" style={{ color: "var(--foreground)" }}>Thêm ghi chú</span>
              </div>
              <button
                onClick={closeNotePopup}
                className="p-1 rounded transition font-bold text-sm"
                style={{ color: "var(--text-muted)" }}
              >
                x
              </button>
            </div>

            {/* Selected text */}
            {notePopup.selectedText && (
              <div className="px-3 py-2 border-b" style={{ backgroundColor: "var(--primary-light)", borderColor: "var(--border)" }}>
                <p className="text-xs italic line-clamp-2" style={{ color: "var(--primary)" }}>
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
                className="w-full h-24 p-2 text-sm border rounded-lg resize-none focus:outline-none focus:ring-2"
                style={{
                  color: "var(--foreground)",
                  borderColor: "var(--border)",
                  // @ts-ignore
                  "--tw-ring-color": "var(--primary)",
                } as React.CSSProperties}
                autoFocus
              />
            </div>

            {/* Footer */}
            <div className="p-3 border-t flex gap-2" style={{ borderColor: "var(--border)" }}>
              <button
                onClick={closeNotePopup}
                className="flex-1 py-2 text-sm font-medium border rounded-full transition"
                style={{
                  color: "var(--foreground)",
                  borderColor: "var(--border)",
                  backgroundColor: "var(--background)",
                }}
              >
                Hủy
              </button>
              <button
                onClick={handleSaveNote}
                disabled={!noteContent.trim() || savingNote}
                className="flex-1 py-2 text-sm font-medium text-white rounded-full transition flex items-center justify-center gap-2 disabled:opacity-50 border-b-[4px]"
                style={{
                  backgroundColor: "var(--primary)",
                  borderBottomColor: "var(--primary-dark)",
                }}
              >
                {savingNote ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  "Lưu"
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
            className="fixed z-[9999] w-80 rounded-[1.5rem] border-[3px] shadow-[0_4px_0_rgba(0,0,0,0.08)]"
            style={{
              left: Math.min(wordPosition.x - 160, window.innerWidth - 340),
              top: Math.min(wordPosition.y, window.innerHeight - 300),
              backgroundColor: "var(--background)",
              borderColor: "var(--border)",
            }}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-3 border-b" style={{ borderColor: "var(--border)" }}>
              <div className="flex items-center gap-2">
                <span className="font-semibold" style={{ color: "var(--foreground)" }}>{selectedWord}</span>
              </div>
              <button
                onClick={closeDictionary}
                className="p-1 rounded transition font-bold text-sm"
                style={{ color: "var(--text-muted)" }}
              >
                x
              </button>
            </div>

            {/* Content */}
            <div className="p-3 max-h-64 overflow-y-auto">
              {loading && (
                <div className="flex items-center justify-center py-6">
                  <div className="w-6 h-6 border-2 rounded-full animate-spin" style={{ borderColor: "var(--border)", borderTopColor: "var(--primary)" }} />
                </div>
              )}

              {error && (
                <div className="text-center py-6 text-sm" style={{ color: "var(--text-muted)" }}>
                  {error}
                </div>
              )}

              {entry && !loading && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-lg font-bold" style={{ color: "var(--foreground)" }}>{entry.word}</span>
                    {entry.pos && (
                      <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ backgroundColor: "var(--primary-light)", color: "var(--primary)" }}>
                        {entry.pos}
                      </span>
                    )}
                    {entry.pronunciations?.[0]?.ipa && (
                      <button className="p-1 transition text-sm" style={{ color: "var(--text-muted)" }}>
                        Sound
                      </button>
                    )}
                  </div>

                  {entry.pronunciations?.[0]?.ipa && (
                    <div className="text-sm font-mono" style={{ color: "var(--text-muted)" }}>/{entry.pronunciations[0].ipa}/</div>
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
                          <div style={{ color: "var(--foreground)" }}>
                            <span className="inline-flex items-center justify-center w-5 h-5 text-xs font-medium rounded-full mr-2" style={{ color: "var(--primary)", backgroundColor: "var(--primary-light)" }}>
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
                            <div className="mt-1.5 text-xs italic pl-7 border-l-2 ml-2.5" style={{ color: "var(--text-muted)", borderColor: "var(--primary-light)" }}>
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
              <div className="p-3 border-t" style={{ borderColor: "var(--border)" }}>
                <button
                  onClick={handleAddToFlashcard}
                  className="w-full py-2.5 text-sm font-medium text-white rounded-full transition flex items-center justify-center gap-2 border-b-[4px]"
                  style={{
                    backgroundColor: "var(--primary)",
                    borderBottomColor: "var(--primary-dark)",
                  }}
                >
                  + Thêm vào Flashcard
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
