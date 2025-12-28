"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FiX, FiPlus, FiCheck, FiLoader, FiBookOpen, FiVolume2 } from "react-icons/fi";
import { enrichVocabulary } from "@/utils/api";

type EnrichedWord = {
  word: string;
  definition: string;
  definitionVi: string;
  ipa: string;
  partOfSpeech: string;
  example: string;
  synonyms: string[];
  level: string;
};

type QuickAddVocabProps = {
  isOpen: boolean;
  onClose: () => void;
  initialWord?: string;
  onAdd?: (word: EnrichedWord) => void;
};

export default function QuickAddVocab({ isOpen, onClose, initialWord = "", onAdd }: QuickAddVocabProps) {
  const [word, setWord] = useState(initialWord);
  const [enrichedData, setEnrichedData] = useState<EnrichedWord | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [added, setAdded] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
    if (isOpen && initialWord) {
      setWord(initialWord);
    }
  }, [isOpen, initialWord]);

  // Debounced AI enrichment
  useEffect(() => {
    if (!word || word.length < 2) {
      setEnrichedData(null);
      return;
    }

    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      setError(null);
      
      try {
        const data = await enrichVocabulary(word);
        setEnrichedData(data);
      } catch (err) {
        setError("Không thể lấy thông tin từ vựng");
        setEnrichedData(null);
      } finally {
        setLoading(false);
      }
    }, 500);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [word]);

  const handleAdd = () => {
    if (enrichedData && onAdd) {
      onAdd(enrichedData);
      setAdded(true);
      setTimeout(() => {
        setAdded(false);
        onClose();
        setWord("");
        setEnrichedData(null);
      }, 1000);
    }
  };

  const handleClose = () => {
    onClose();
    setWord("");
    setEnrichedData(null);
    setError(null);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={handleClose}
          className="absolute inset-0 bg-black/40"
        />

        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ duration: 0.2 }}
          className="relative w-full max-w-md mx-4 bg-white rounded-xl border border-slate-200 shadow-xl"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <FiBookOpen className="w-5 h-5 text-blue-500" />
              <span className="font-semibold text-slate-900">Thêm từ vựng nhanh</span>
            </div>
            <button
              onClick={handleClose}
              className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition"
            >
              <FiX className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <div className="p-4 space-y-4">
            {/* Word Input */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Nhập từ vựng
              </label>
              <input
                ref={inputRef}
                type="text"
                value={word}
                onChange={(e) => setWord(e.target.value)}
                placeholder="Nhập từ tiếng Anh..."
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-slate-900"
              />
            </div>

            {/* Loading */}
            {loading && (
              <div className="flex items-center justify-center py-6">
                <FiLoader className="w-6 h-6 text-blue-500 animate-spin" />
                <span className="ml-2 text-sm text-slate-500">Đang lấy thông tin từ AI...</span>
              </div>
            )}

            {/* Error */}
            {error && (
              <div className="text-center py-4 text-red-500 text-sm">
                {error}
              </div>
            )}

            {/* Enriched Data Preview */}
            {enrichedData && !loading && (
              <div className="space-y-3 p-3 bg-slate-50 rounded-lg border border-slate-100">
                {/* Word & IPA */}
                <div className="flex items-center gap-2">
                  <span className="text-lg font-semibold text-slate-900">{enrichedData.word}</span>
                  {enrichedData.partOfSpeech && (
                    <span className="text-xs px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded">
                      {enrichedData.partOfSpeech}
                    </span>
                  )}
                  {enrichedData.level && (
                    <span className="text-xs px-1.5 py-0.5 bg-amber-100 text-amber-700 rounded">
                      {enrichedData.level}
                    </span>
                  )}
                </div>

                {enrichedData.ipa && (
                  <div className="flex items-center gap-2 text-sm text-slate-500">
                    <span>/{enrichedData.ipa}/</span>
                    <button className="p-1 text-slate-400 hover:text-blue-500 transition">
                      <FiVolume2 className="w-4 h-4" />
                    </button>
                  </div>
                )}

                {/* Definition */}
                <div className="space-y-1">
                  <div className="text-sm font-medium text-slate-600">Định nghĩa</div>
                  <div className="text-sm text-slate-700">{enrichedData.definition}</div>
                  {enrichedData.definitionVi && (
                    <div className="text-sm text-blue-600">{enrichedData.definitionVi}</div>
                  )}
                </div>

                {/* Example */}
                {enrichedData.example && (
                  <div className="space-y-1">
                    <div className="text-sm font-medium text-slate-600">Ví dụ</div>
                    <div className="text-sm text-slate-500 italic">"{enrichedData.example}"</div>
                  </div>
                )}

                {/* Synonyms */}
                {enrichedData.synonyms && enrichedData.synonyms.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {enrichedData.synonyms.map((syn, idx) => (
                      <span key={idx} className="text-xs px-2 py-0.5 bg-slate-200 text-slate-600 rounded">
                        {syn}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-slate-100">
            <button
              onClick={handleAdd}
              disabled={!enrichedData || loading || added}
              className={`w-full py-2.5 font-medium rounded-lg transition flex items-center justify-center gap-2 ${
                added
                  ? "bg-emerald-500 text-white"
                  : enrichedData && !loading
                  ? "bg-blue-500 hover:bg-blue-600 text-white"
                  : "bg-slate-100 text-slate-400 cursor-not-allowed"
              }`}
            >
              {added ? (
                <>
                  <FiCheck className="w-4 h-4" />
                  Đã thêm!
                </>
              ) : (
                <>
                  <FiPlus className="w-4 h-4" />
                  Thêm vào Flashcard
                </>
              )}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
