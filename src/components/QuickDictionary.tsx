"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FiX, FiPlus, FiVolume2, FiBookOpen, FiSearch, FiBook } from "react-icons/fi";
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
        className="fixed z-[9999] bg-white rounded-lg border border-slate-200 shadow-xl overflow-hidden"
        style={{ left: menuX, top: menuY, minWidth: menuMode === "context" ? 200 : 320 }}
      >
        {/* Context Menu Mode */}
        {menuMode === "context" && (
          <div className="py-1">
            <div className="px-3 py-1.5 text-xs font-medium text-slate-400 uppercase tracking-wide">
              "{selectedWord}"
            </div>
            <button
              onClick={lookupWord}
              className="w-full px-3 py-2 flex items-center gap-3 text-left text-sm text-slate-700 hover:bg-blue-50 hover:text-blue-600 transition-colors"
            >
              <FiSearch className="w-4 h-4" />
              <span>Tra từ điển</span>
            </button>
            <button
              onClick={handleQuickAdd}
              className="w-full px-3 py-2 flex items-center gap-3 text-left text-sm text-slate-700 
              hover:bg-green-50 hover:text-green-600 transition-colors"
            >
              <FiPlus className="w-4 h-4" />
              <span>Thêm vào từ vựng</span>
            </button>
          </div>
        )}

        {/* Lookup Mode - Dictionary Popup */}
        {menuMode === "lookup" && (
          <>
            {/* Header */}
            <div className="flex items-center justify-between p-3 border-b border-slate-100 bg-gradient-to-r from-blue-50 to-white">
              <div className="flex items-center gap-2">
                <FiBookOpen className="w-4 h-4 text-blue-500" />
                <span className="font-semibold text-slate-900">{selectedWord}</span>
              </div>
              <button
                onClick={handleClose}
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
                  {/* Word & POS & IPA */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-lg font-bold text-slate-900">{entry.word}</span>
                    {entry.pos && (
                      <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full font-medium">
                        {entry.pos}
                      </span>
                    )}
                    {entry.ipa && (
                      <button className="p-1 text-slate-400 hover:text-blue-500 transition">
                        <FiVolume2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  {entry.ipa && (
                    <div className="text-sm text-slate-500 font-mono">/{entry.ipa}/</div>
                  )}

                  {/* Definitions */}
                  {entry.senses && entry.senses.length > 0 && (
                    <div className="space-y-2 pt-1">
                      {entry.senses.slice(0, 3).map((sense, idx) => (
                        <div key={idx} className="text-sm">
                          <div className="text-slate-700">
                            <span className="inline-flex items-center justify-center w-5 h-5 text-xs font-medium text-blue-600 bg-blue-50 rounded-full mr-2">
                              {idx + 1}
                            </span>
                            {sense.definition}
                          </div>
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

            {/* Footer - Add to Flashcard */}
            {entry && !loading && (
              <div className="p-3 border-t border-slate-100 bg-slate-50">
                <button
                  onClick={handleAddToFlashcard}
                  className="w-full py-2.5 text-sm font-medium text-white 
                  rounded-lg transition flex items-center justify-center gap-2 shadow-sm"
                >
                  <FiPlus className="w-4 h-4" />
                  Thêm vào Flashcard
                </button>
              </div>
            )}
          </>
        )}
      </motion.div>
    </AnimatePresence>
  );
}
