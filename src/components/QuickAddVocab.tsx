"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
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
          className="relative w-full max-w-md mx-4 rounded-[1.5rem] border-[3px] shadow-[0_4px_0_rgba(0,0,0,0.08)]"
          style={{
            backgroundColor: "var(--background)",
            borderColor: "var(--border)",
          }}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b" style={{ borderColor: "var(--border)" }}>
            <div className="flex items-center gap-2">
              <span className="font-semibold" style={{ color: "var(--foreground)" }}>Thêm từ vựng nhanh</span>
            </div>
            <button
              onClick={handleClose}
              className="p-1.5 rounded-lg transition font-bold text-sm"
              style={{ color: "var(--text-muted)" }}
            >
              x
            </button>
          </div>

          {/* Content */}
          <div className="p-4 space-y-4">
            {/* Word Input */}
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: "var(--foreground)" }}>
                Nhập từ vựng
              </label>
              <input
                ref={inputRef}
                type="text"
                value={word}
                onChange={(e) => setWord(e.target.value)}
                placeholder="Nhập từ tiếng Anh..."
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2"
                style={{
                  borderColor: "var(--border)",
                  color: "var(--foreground)",
                  // @ts-ignore
                  "--tw-ring-color": "var(--primary)",
                } as React.CSSProperties}
              />
            </div>

            {/* Loading */}
            {loading && (
              <div className="flex items-center justify-center py-6">
                <div className="w-6 h-6 border-2 rounded-full animate-spin" style={{ borderColor: "var(--primary-light)", borderTopColor: "var(--primary)" }} />
                <span className="ml-2 text-sm" style={{ color: "var(--text-muted)" }}>Đang lấy thông tin từ AI...</span>
              </div>
            )}

            {/* Error */}
            {error && (
              <div className="text-center py-4 text-sm" style={{ color: "var(--destructive)" }}>
                {error}
              </div>
            )}

            {/* Enriched Data Preview */}
            {enrichedData && !loading && (
              <div className="space-y-3 p-3 rounded-lg border" style={{ backgroundColor: "var(--background)", borderColor: "var(--border)" }}>
                {/* Word & IPA */}
                <div className="flex items-center gap-2">
                  <span className="text-lg font-semibold" style={{ color: "var(--foreground)" }}>{enrichedData.word}</span>
                  {enrichedData.partOfSpeech && (
                    <span className="text-xs px-1.5 py-0.5 rounded" style={{ backgroundColor: "var(--primary-light)", color: "var(--primary)" }}>
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
                  <div className="flex items-center gap-2 text-sm" style={{ color: "var(--text-muted)" }}>
                    <span>/{enrichedData.ipa}/</span>
                    <button className="p-1 transition text-xs" style={{ color: "var(--text-muted)" }}>
                      Sound
                    </button>
                  </div>
                )}

                {/* Definition */}
                <div className="space-y-1">
                  <div className="text-sm font-medium" style={{ color: "var(--text-muted)" }}>Định nghĩa</div>
                  <div className="text-sm" style={{ color: "var(--foreground)" }}>{enrichedData.definition}</div>
                  {enrichedData.definitionVi && (
                    <div className="text-sm" style={{ color: "var(--primary)" }}>{enrichedData.definitionVi}</div>
                  )}
                </div>

                {/* Example */}
                {enrichedData.example && (
                  <div className="space-y-1">
                    <div className="text-sm font-medium" style={{ color: "var(--text-muted)" }}>Ví dụ</div>
                    <div className="text-sm italic" style={{ color: "var(--text-muted)" }}>"{enrichedData.example}"</div>
                  </div>
                )}

                {/* Synonyms */}
                {enrichedData.synonyms && enrichedData.synonyms.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {enrichedData.synonyms.map((syn, idx) => (
                      <span key={idx} className="text-xs px-2 py-0.5 rounded" style={{ backgroundColor: "var(--primary-light)", color: "var(--text-muted)" }}>
                        {syn}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-4 border-t" style={{ borderColor: "var(--border)" }}>
            <button
              onClick={handleAdd}
              disabled={!enrichedData || loading || added}
              className={`w-full py-2.5 font-medium rounded-full transition flex items-center justify-center gap-2 ${
                added
                  ? "bg-emerald-500 text-white"
                  : enrichedData && !loading
                  ? "text-white border-b-[4px]"
                  : "cursor-not-allowed"
              }`}
              style={
                added
                  ? {}
                  : enrichedData && !loading
                  ? { backgroundColor: "var(--primary)", borderBottomColor: "var(--primary-dark)" }
                  : { backgroundColor: "var(--border)", color: "var(--text-muted)" }
              }
            >
              {added ? (
                "Đã thêm!"
              ) : (
                "+ Thêm vào Flashcard"
              )}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
