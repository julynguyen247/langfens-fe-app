"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { lookupDictionary } from "@/utils/api";

type DictionaryEntry = {
  id: number;
  word: string;
  pos: string;
  ipa?: string;
  senses?: {
    definition: string;
    examples?: string[];
  }[];
};

type QuickDictionaryProps = {
  onAddToFlashcard?: (word: string, definition: string) => void;
};

type MenuMode = "context" | "lookup" | null;

export default function QuickDictionary({ onAddToFlashcard }: QuickDictionaryProps) {
  const [selectedWord, setSelectedWord] = useState<string | null>(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [entry, setEntry] = useState<DictionaryEntry | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [menuMode, setMenuMode] = useState<MenuMode>(null);
  const popupRef = useRef<HTMLDivElement>(null);

  // Handle right-click context menu
  const handleContextMenu = useCallback((e: MouseEvent) => {
    const selection = window.getSelection();
    const text = selection?.toString().trim();

    // Only show if text is selected and looks like a word
    if (text && text.length > 1 && text.length < 50 && /^[a-zA-Z\-']+$/.test(text)) {
      e.preventDefault();

      setPosition({ x: e.clientX, y: e.clientY });
      setSelectedWord(text.toLowerCase());
      setMenuMode("context");
      setEntry(null);
      setError(null);
    }
  }, []);

  // Listen for context menu events
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (popupRef.current && !popupRef.current.contains(e.target as Node)) {
        handleClose();
      }
    };

    document.addEventListener("contextmenu", handleContextMenu);
    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("contextmenu", handleContextMenu);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [handleContextMenu]);

  // Lookup word in dictionary
  const lookupWord = async () => {
    if (!selectedWord) return;

    setMenuMode("lookup");
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

  const handleClose = () => {
    setSelectedWord(null);
    setEntry(null);
    setMenuMode(null);
    window.getSelection()?.removeAllRanges();
  };

  const handleAddToFlashcard = () => {
    if (selectedWord && onAddToFlashcard) {
      const definition = entry?.senses?.[0]?.definition || "";
      onAddToFlashcard(selectedWord, definition);
      handleClose();
    }
  };

  const handleQuickAdd = () => {
    if (selectedWord && onAddToFlashcard) {
      // Quick add without looking up - will fetch definition
      onAddToFlashcard(selectedWord, "");
      handleClose();
    }
  };

  if (!selectedWord || !menuMode) return null;

  // Calculate position to keep menu in viewport
  const menuX = Math.min(position.x, window.innerWidth - 320);
  const menuY = Math.min(position.y, window.innerHeight - (menuMode === "lookup" ? 350 : 120));

  return (
    <AnimatePresence>
      <motion.div
        ref={popupRef}
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.12 }}
        className="fixed z-[9999] rounded-[1.5rem] border-[3px] shadow-[0_4px_0_rgba(0,0,0,0.08)] overflow-hidden"
        style={{
          left: menuX,
          top: menuY,
          minWidth: menuMode === "context" ? 200 : 320,
          backgroundColor: "var(--background)",
          borderColor: "var(--border)",
        }}
      >
        {/* Context Menu Mode */}
        {menuMode === "context" && (
          <div className="py-1">
            <div className="px-3 py-1.5 text-xs font-medium tracking-wide" style={{ color: "var(--text-muted)" }}>
              "{selectedWord}"
            </div>
            <button
              onClick={lookupWord}
              className="w-full px-3 py-2 flex items-center gap-3 text-left text-sm transition-colors"
              style={{ color: "var(--foreground)" }}
            >
              <span>Tra từ điển</span>
            </button>
            <button
              onClick={handleQuickAdd}
              className="w-full px-3 py-2 flex items-center gap-3 text-left text-sm transition-colors"
              style={{ color: "var(--foreground)" }}
            >
              <span>+ Thêm vào từ vựng</span>
            </button>
          </div>
        )}

        {/* Lookup Mode - Dictionary Popup */}
        {menuMode === "lookup" && (
          <>
            {/* Header */}
            <div className="flex items-center justify-between p-3 border-b" style={{ borderColor: "var(--border)" }}>
              <div className="flex items-center gap-2">
                <span className="font-semibold" style={{ color: "var(--foreground)" }}>{selectedWord}</span>
              </div>
              <button
                onClick={handleClose}
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
                  {/* Word & POS & IPA */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-lg font-bold" style={{ color: "var(--foreground)" }}>{entry.word}</span>
                    {entry.pos && (
                      <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ backgroundColor: "var(--primary-light)", color: "var(--primary)" }}>
                        {entry.pos}
                      </span>
                    )}
                    {entry.ipa && (
                      <button className="p-1 transition text-xs" style={{ color: "var(--text-muted)" }}>
                        Sound
                      </button>
                    )}
                  </div>

                  {entry.ipa && (
                    <div className="text-sm font-mono" style={{ color: "var(--text-muted)" }}>/{entry.ipa}/</div>
                  )}

                  {/* Definitions */}
                  {entry.senses && entry.senses.length > 0 && (
                    <div className="space-y-2 pt-1">
                      {entry.senses.slice(0, 3).map((sense, idx) => (
                        <div key={idx} className="text-sm">
                          <div style={{ color: "var(--foreground)" }}>
                            <span className="inline-flex items-center justify-center w-5 h-5 text-xs font-medium rounded-full mr-2" style={{ color: "var(--primary)", backgroundColor: "var(--primary-light)" }}>
                              {idx + 1}
                            </span>
                            {sense.definition}
                          </div>
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

            {/* Footer - Add to Flashcard */}
            {entry && !loading && (
              <div className="p-3 border-t" style={{ borderColor: "var(--border)" }}>
                <button
                  onClick={handleAddToFlashcard}
                  className="w-full py-2.5 text-sm font-medium text-white
                  rounded-full transition flex items-center justify-center gap-2 border-b-[4px]"
                  style={{
                    backgroundColor: "var(--primary)",
                    borderBottomColor: "var(--primary-dark)",
                  }}
                >
                  + Thêm vào Flashcard
                </button>
              </div>
            )}
          </>
        )}
      </motion.div>
    </AnimatePresence>
  );
}
