"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FiX, FiPlus, FiCheck, FiLoader, FiZap } from "react-icons/fi";
import { HiSparkles, HiCheckCircle } from "react-icons/hi2";
import { extractVocabulary, createDeck, createBulkCards, getOwnDecks } from "@/utils/api";
import { useUserStore } from "@/app/store/userStore";

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

const DEFAULT_DECK_TITLE = "My Vocabulary";
const DEFAULT_DECK_SLUG = "my-vocabulary";

export default function VocabularyExtractor({ passageText, onAddWords }: VocabularyExtractorProps) {
  const { user } = useUserStore();
  const [isOpen, setIsOpen] = useState(false);
  const [words, setWords] = useState<ExtractedWord[]>([]);
  const [selectedWords, setSelectedWords] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleExtract = async () => {
    setIsOpen(true);
    setLoading(true);
    setError(null);
    setWords([]);
    setSelectedWords(new Set());
    setSaved(false);

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

  const selectAll = () => setSelectedWords(new Set(words.map((_, idx) => idx)));
  const deselectAll = () => setSelectedWords(new Set());

  // Get or create default deck for user
  const getOrCreateDefaultDeck = async (): Promise<string | null> => {
    if (!user?.id) return null;

    try {
      // First, try to get existing decks
      const decksRes = await getOwnDecks(user.id);
      const decks = (decksRes as any)?.data?.data ?? (decksRes as any)?.data ?? [];
      
      // Find default deck
      const defaultDeck = decks.find((d: any) => d.slug === DEFAULT_DECK_SLUG || d.title === DEFAULT_DECK_TITLE);
      
      if (defaultDeck) {
        return defaultDeck.id;
      }

      // Create new default deck
      const createRes = await createDeck({
        slug: DEFAULT_DECK_SLUG,
        title: DEFAULT_DECK_TITLE,
        descriptionMd: "Từ vựng được trích xuất từ bài đọc IELTS",
        category: "general",
        status: "draft",
        userId: user.id,
      });
      
      const newDeck = (createRes as any)?.data?.data ?? (createRes as any)?.data;
      return newDeck?.id;
    } catch (err) {
      console.error("Failed to get/create deck:", err);
      return null;
    }
  };

  // Convert extracted words to flashcard format
  const wordsToFlashcards = (wordsToSave: ExtractedWord[]) => {
    return wordsToSave.map(word => ({
      frontMd: `**${word.word}** ${word.ipa ? `\`/${word.ipa}/\`` : ""}`,
      backMd: `${word.definition}\n\n${word.definitionVi ? `*${word.definitionVi}*` : ""}${word.example ? `\n\n> "${word.example}"` : ""}`,
      hintMd: word.level || undefined,
    }));
  };

  const handleSave = async () => {
    if (selectedWords.size === 0) return;

    setSaving(true);
    setError(null);

    try {
      // Get or create default deck
      const deckId = await getOrCreateDefaultDeck();
      
      if (!deckId) {
        setError("Không thể tạo bộ thẻ. Vui lòng đăng nhập và thử lại.");
        setSaving(false);
        return;
      }

      // Get selected words
      const selectedWordsList = words.filter((_, idx) => selectedWords.has(idx));
      
      // Convert to flashcard format
      const flashcards = wordsToFlashcards(selectedWordsList);
      
      // Create all cards
      await createBulkCards(deckId, flashcards);
      
      // Success!
      setSaved(true);
      
      // Callback if provided
      if (onAddWords) {
        onAddWords(selectedWordsList);
      }

      // Auto close after 2 seconds
      setTimeout(() => {
        setIsOpen(false);
        setSaved(false);
      }, 2000);
      
    } catch (err) {
      console.error("Failed to save words:", err);
      setError("Không thể lưu từ vựng. Vui lòng thử lại.");
    } finally {
      setSaving(false);
    }
  };

  const getLevelStyle = (level: string) => {
    switch (level?.toUpperCase()) {
      case "C1":
      case "C2":
        return "bg-purple-50 text-purple-700 border-purple-200";
      case "B1":
      case "B2":
        return "bg-blue-50 text-blue-700 border-blue-200";
      case "A1":
      case "A2":
        return "bg-green-50 text-green-700 border-green-200";
      default:
        return "bg-slate-50 text-slate-600 border-slate-200";
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

      {/* Floating Card */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => !saving && setIsOpen(false)}
              className="fixed inset-0 z-40 bg-black/10"
            />

            {/* Floating Vocabulary Card */}
            <motion.div
              initial={{ opacity: 0, y: -20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.95 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="fixed top-20 right-8 z-50 w-[400px] bg-white rounded-xl shadow-2xl border border-blue-100 flex flex-col max-h-[80vh] overflow-hidden"
            >
              {/* Header */}
              <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-slate-50 to-white border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <HiSparkles className="w-5 h-5 text-blue-500" />
                  <h3 className="font-bold text-slate-800">AI Vocabulary</h3>
                  {words.length > 0 && (
                    <span className="bg-blue-100 text-blue-700 text-xs font-bold px-2 py-0.5 rounded-full">
                      {words.length} found
                    </span>
                  )}
                </div>
                <button
                  onClick={() => !saving && setIsOpen(false)}
                  disabled={saving}
                  className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-slate-100 rounded-lg transition disabled:opacity-50"
                >
                  <FiX className="w-4 h-4" />
                </button>
              </div>

              {/* Success State */}
              {saved && (
                <div className="flex flex-col items-center justify-center py-16 px-4">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4"
                  >
                    <HiCheckCircle className="w-10 h-10 text-green-500" />
                  </motion.div>
                  <p className="text-lg font-semibold text-slate-800">Đã lưu thành công!</p>
                  <p className="text-sm text-slate-500 mt-1">
                    {selectedWords.size} từ đã được thêm vào Flashcard
                  </p>
                </div>
              )}

              {/* Loading State */}
              {loading && !saved && (
                <div className="flex flex-col items-center justify-center py-16 px-4">
                  <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center mb-4">
                    <FiLoader className="w-6 h-6 text-blue-600 animate-spin" />
                  </div>
                  <p className="text-sm text-slate-600 font-medium">AI đang phân tích bài đọc...</p>
                  <p className="text-xs text-slate-400 mt-1">Vui lòng đợi trong giây lát</p>
                </div>
              )}

              {/* Error State */}
              {error && !saved && (
                <div className="text-center py-12 px-4">
                  <div className="w-12 h-12 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
                    <FiX className="w-6 h-6 text-red-500" />
                  </div>
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              )}

              {/* Word List */}
              {!loading && !saved && words.length > 0 && (
                <>
                  {/* Select Controls */}
                  <div className="px-4 py-2 border-b border-slate-100 bg-white flex items-center justify-between">
                    <span className="text-xs text-slate-500">{selectedWords.size} từ đã chọn</span>
                    <div className="flex gap-2 text-xs">
                      <button onClick={selectAll} className="text-blue-600 hover:text-blue-700 font-medium">
                        Chọn tất cả
                      </button>
                      <span className="text-slate-300">|</span>
                      <button onClick={deselectAll} className="text-slate-500 hover:text-slate-700">
                        Bỏ chọn
                      </button>
                    </div>
                  </div>

                  {/* Scrollable Word List */}
                  <div className="flex-1 overflow-y-auto max-h-[400px] p-2 space-y-1 scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent">
                    {words.map((word, idx) => (
                      <div
                        key={idx}
                        onClick={() => toggleWord(idx)}
                        className={`flex items-start gap-3 p-3 rounded-lg cursor-pointer transition-colors group ${
                          selectedWords.has(idx)
                            ? "bg-blue-50/70 border border-blue-200"
                            : "hover:bg-slate-50 border border-transparent"
                        }`}
                      >
                        {/* Checkbox */}
                        <div
                          className={`mt-1 w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0 transition ${
                            selectedWords.has(idx)
                              ? "bg-blue-500 border-blue-500 text-white"
                              : "border-slate-300 bg-white group-hover:border-blue-400"
                          }`}
                        >
                          {selectedWords.has(idx) && <FiCheck className="w-2.5 h-2.5" />}
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          {/* Top Row */}
                          <div className="flex items-baseline justify-between gap-2">
                            <div className="flex items-baseline gap-2 flex-wrap">
                              <span className="font-bold text-slate-900 text-base">{word.word}</span>
                              {word.ipa && (
                                <span className="text-slate-400 font-mono text-xs">/{word.ipa}/</span>
                              )}
                            </div>
                            {word.level && (
                              <span
                                className={`text-[10px] font-bold px-1.5 py-0.5 rounded border flex-shrink-0 ${getLevelStyle(word.level)}`}
                              >
                                {word.level}
                              </span>
                            )}
                          </div>

                          {/* Definition */}
                          <p className="text-slate-600 text-sm mt-1 leading-snug line-clamp-2">
                            {word.definition}
                          </p>
                          {word.definitionVi && (
                            <p className="text-blue-600 text-sm mt-0.5">{word.definitionVi}</p>
                          )}

                          {/* Example */}
                          {word.example && (
                            <p className="text-slate-500 text-xs mt-1.5 italic opacity-0 group-hover:opacity-100 transition-opacity line-clamp-1">
                              "{word.example}"
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Footer */}
                  <div className="p-4 border-t border-slate-100 bg-white">
                    <button
                      onClick={handleSave}
                      disabled={selectedWords.size === 0 || saving}
                      className={`w-full py-2.5 font-medium rounded-lg flex items-center justify-center gap-2 transition-all active:scale-[0.98] ${
                        selectedWords.size > 0 && !saving
                          ? "bg-blue-500 hover:bg-blue-600 text-white shadow-sm"
                          : "bg-slate-100 text-slate-400 cursor-not-allowed"
                      }`}
                    >
                      {saving ? (
                        <>
                          <FiLoader className="w-4 h-4 animate-spin" />
                          Đang lưu...
                        </>
                      ) : (
                        <>
                          <FiPlus className="w-4 h-4" />
                          Lưu {selectedWords.size} từ vào Flashcard
                        </>
                      )}
                    </button>
                  </div>
                </>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
