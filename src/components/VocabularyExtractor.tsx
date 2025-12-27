"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FiX, FiPlus, FiCheck, FiLoader, FiBookOpen, FiZap } from "react-icons/fi";
import { extractVocabulary } from "@/utils/api";

type ExtractedWord = {
  word: string;
  definition: string;
  definitionVi: string;
  ipa: string;
  level: string;
  example: string;
};

type VocabularyExtractorProps = {
  passageText: string;
  onAddWords?: (words: ExtractedWord[]) => void;
};

export default function VocabularyExtractor({ passageText, onAddWords }: VocabularyExtractorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [words, setWords] = useState<ExtractedWord[]>([]);
  const [selectedWords, setSelectedWords] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleExtract = async () => {
    setIsOpen(true);
    setLoading(true);
    setError(null);
    setWords([]);
    setSelectedWords(new Set());

    try {
      const result = await extractVocabulary(passageText, 10);
      setWords(result);
      setSelectedWords(new Set(result.map((_: unknown, idx: number) => idx)));
    } catch (err) {
      setError("Không thể trích xuất từ vựng. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };

  const toggleWord = (idx: number) => {
    const newSelected = new Set(selectedWords);
    if (newSelected.has(idx)) {
      newSelected.delete(idx);
    } else {
      newSelected.add(idx);
    }
    setSelectedWords(newSelected);
  };

  const selectAll = () => {
    setSelectedWords(new Set(words.map((_, idx) => idx)));
  };

  const deselectAll = () => {
    setSelectedWords(new Set());
  };

  const handleAdd = () => {
    if (onAddWords) {
      const selected = words.filter((_, idx) => selectedWords.has(idx));
      onAddWords(selected);
    }
    setIsOpen(false);
  };

  const getLevelColor = (level: string) => {
    switch (level?.toUpperCase()) {
      case "B1": return "bg-green-100 text-green-700";
      case "B2": return "bg-blue-100 text-blue-700";
      case "C1": return "bg-purple-100 text-purple-700";
      case "C2": return "bg-red-100 text-red-700";
      default: return "bg-slate-100 text-slate-600";
    }
  };

  return (
    <>
      {/* Extract Button */}
      <button
        onClick={handleExtract}
        className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition"
      >
        <FiZap className="w-4 h-4" />
        Trích xuất từ vựng
      </button>

      {/* Modal */}
      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="absolute inset-0 bg-black/40"
            />

            {/* Modal */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.2 }}
              className="relative w-full max-w-lg mx-4 bg-white rounded-xl border border-slate-200 shadow-xl max-h-[80vh] flex flex-col"
            >
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <FiBookOpen className="w-5 h-5 text-blue-500" />
                  <span className="font-semibold text-slate-900">Từ vựng trích xuất</span>
                  {words.length > 0 && (
                    <span className="text-sm text-slate-500">({selectedWords.size}/{words.length} đã chọn)</span>
                  )}
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition"
                >
                  <FiX className="w-5 h-5" />
                </button>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto p-4">
                {loading && (
                  <div className="flex flex-col items-center justify-center py-12">
                    <FiLoader className="w-8 h-8 text-blue-500 animate-spin mb-3" />
                    <span className="text-sm text-slate-500">AI đang phân tích bài đọc...</span>
                  </div>
                )}

                {error && (
                  <div className="text-center py-8 text-red-500 text-sm">
                    {error}
                  </div>
                )}

                {!loading && words.length > 0 && (
                  <div className="space-y-2">
                    {/* Select controls */}
                    <div className="flex gap-2 mb-3">
                      <button
                        onClick={selectAll}
                        className="text-xs text-blue-600 hover:underline"
                      >
                        Chọn tất cả
                      </button>
                      <span className="text-slate-300">|</span>
                      <button
                        onClick={deselectAll}
                        className="text-xs text-slate-500 hover:underline"
                      >
                        Bỏ chọn
                      </button>
                    </div>

                    {/* Word list */}
                    {words.map((word, idx) => (
                      <div
                        key={idx}
                        onClick={() => toggleWord(idx)}
                        className={`p-3 rounded-lg border cursor-pointer transition ${
                          selectedWords.has(idx)
                            ? "border-blue-300 bg-blue-50"
                            : "border-slate-200 bg-white hover:border-slate-300"
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <div className={`w-5 h-5 rounded border flex items-center justify-center flex-shrink-0 mt-0.5 ${
                            selectedWords.has(idx)
                              ? "bg-blue-500 border-blue-500 text-white"
                              : "border-slate-300"
                          }`}>
                            {selectedWords.has(idx) && <FiCheck className="w-3 h-3" />}
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-semibold text-slate-900">{word.word}</span>
                              {word.ipa && (
                                <span className="text-xs text-slate-500">/{word.ipa}/</span>
                              )}
                              {word.level && (
                                <span className={`text-xs px-1.5 py-0.5 rounded ${getLevelColor(word.level)}`}>
                                  {word.level}
                                </span>
                              )}
                            </div>
                            
                            <div className="text-sm text-slate-600 mt-1">{word.definition}</div>
                            {word.definitionVi && (
                              <div className="text-sm text-blue-600">{word.definitionVi}</div>
                            )}
                            
                            {word.example && (
                              <div className="text-xs text-slate-500 mt-1 italic line-clamp-2">
                                "{word.example}"
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Footer */}
              {words.length > 0 && !loading && (
                <div className="p-4 border-t border-slate-100">
                  <button
                    onClick={handleAdd}
                    disabled={selectedWords.size === 0}
                    className={`w-full py-2.5 font-medium rounded-lg transition flex items-center justify-center gap-2 ${
                      selectedWords.size > 0
                        ? "bg-blue-500 hover:bg-blue-600 text-white"
                        : "bg-slate-100 text-slate-400 cursor-not-allowed"
                    }`}
                  >
                    <FiPlus className="w-4 h-4" />
                    Thêm {selectedWords.size} từ vào Flashcard
                  </button>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
