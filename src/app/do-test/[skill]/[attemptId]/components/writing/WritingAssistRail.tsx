"use client";

import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { lookupDictionary, suggestDictionary } from "@/utils/api";

type Tab = "dictionary" | "translate";

type Sense = {
  id: string;
  definitionEn: string;
  labels: string[];
  vietnamese?: string[];
  examples: string[];
};

type Pronunciation = {
  region: string | null;
  ipa: string | null;
  mp3Url: string | null;
};

type WordForm = {
  form: string;
  tags: string[];
};

type DictionaryEntry = {
  id: number;
  word: string;
  pos: string;
  wordNorm?: string;
  pronunciations?: Pronunciation[];
  forms?: WordForm[];
  senses?: Sense[];
  vietnamese?: string[];
};

type Suggestion = {
  id: number;
  word: string;
  pos: string;
};

interface WritingAssistRailProps {
  open: boolean;
  onClose: () => void;
  initialWord?: string;
}

function speakWord(word: string, region: "UK" | "US" = "UK") {
  if (typeof window === "undefined" || !window.speechSynthesis) return;
  const u = new SpeechSynthesisUtterance(word);
  u.lang = region === "UK" ? "en-GB" : "en-US";
  u.rate = 0.9;
  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(u);
}

export default function WritingAssistRail({
  open,
  onClose,
  initialWord = "",
}: WritingAssistRailProps) {
  const [tab, setTab] = useState<Tab>("dictionary");
  const [word, setWord] = useState(initialWord);
  const [searchInput, setSearchInput] = useState(initialWord);
  const [entry, setEntry] = useState<DictionaryEntry | null>(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);

  // Translate state
  const [translateDir, setTranslateDir] = useState<"en-vi" | "vi-en">("en-vi");
  const [translateInput, setTranslateInput] = useState("");
  const [translateOut, setTranslateOut] = useState<string | null>(null);
  const [translateLoading, setTranslateLoading] = useState(false);

  // Sync initial word
  useEffect(() => {
    if (initialWord) {
      setWord(initialWord);
      setSearchInput(initialWord);
    }
  }, [initialWord]);

  // Lookup when word changes
  useEffect(() => {
    let cancelled = false;
    async function run() {
      if (!word.trim()) {
        setEntry(null);
        setSuggestions([]);
        setErr(null);
        return;
      }
      setLoading(true);
      setErr(null);
      setEntry(null);
      setSuggestions([]);
      try {
        const res = (await lookupDictionary(word.trim())) as
          | { entry: DictionaryEntry | null; suggestions: Suggestion[] }
          | DictionaryEntry;
        if (cancelled) return;
        // The endpoint may return either an entry or a {entry, suggestions} shape
        if (res && typeof res === "object" && "entry" in res) {
          setEntry((res as any).entry ?? null);
          setSuggestions((res as any).suggestions ?? []);
        } else {
          setEntry(res as DictionaryEntry);
        }
        if (
          !(
            res &&
            typeof res === "object" &&
            "entry" in res &&
            (res as any).entry
          ) &&
          !(res as DictionaryEntry)?.senses
        ) {
          // fallback: try suggest to give the user some hints
          try {
            const sug = (await suggestDictionary(word.trim())) as Suggestion[];
            if (!cancelled) setSuggestions(sug ?? []);
          } catch {
            /* ignore */
          }
        }
      } catch (e: any) {
        if (!cancelled) {
          setErr(e?.message || "Could not look up that word.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    run();
    return () => {
      cancelled = true;
    };
  }, [word]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setWord(searchInput.trim());
  };

  // Build a flat list of Vietnamese translations from the entry
  const vietnameseList = useMemo(() => {
    if (!entry) return [] as string[];
    const fromEntry = entry.vietnamese ?? [];
    const fromSenses = (entry.senses ?? []).flatMap(
      (s) => s.vietnamese ?? []
    );
    return Array.from(new Set([...fromEntry, ...fromSenses].filter(Boolean)));
  }, [entry]);

  // Translate: try MyMemory public API for arbitrary text. For VI -> EN
  // single words we additionally fall back to a dictionary reverse lookup
  // (the dictionary is EN-first, so we use the suggest endpoint to find the
  // English headword by Vietnamese term match).
  const handleTranslate = async () => {
    const text = translateInput.trim();
    if (!text) return;
    setTranslateLoading(true);
    setTranslateOut(null);

    const pair = translateDir === "en-vi" ? "en|vi" : "vi|en";

    try {
      const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(
        text
      )}&langpair=${pair}`;
      const res = await fetch(url);
      const json = await res.json();
      const translated: string | undefined = json?.responseData?.translatedText;
      // MyMemory occasionally returns an upper-case "MYMEMORY WARNING ..." for
      // quota / unknown language pairs. Treat those as failures.
      if (translated && !/^MYMEMORY WARNING/i.test(translated)) {
        setTranslateOut(translated);
        return;
      }
      // Fallback for single-word VI -> EN via dictionary
      if (translateDir === "vi-en") {
        try {
          const sug = (await suggestDictionary(text)) as Suggestion[];
          if (sug && sug.length > 0) {
            setTranslateOut(`${sug[0].word} (${sug[0].pos})`);
            return;
          }
        } catch {
          /* ignore */
        }
      }
      // Fallback for single-word EN -> VI via dictionary
      if (translateDir === "en-vi") {
        const r = (await lookupDictionary(text)) as
          | DictionaryEntry
          | { entry: DictionaryEntry | null };
        const e: DictionaryEntry | null | undefined =
          "entry" in (r as any) ? (r as any).entry : (r as DictionaryEntry);
        if (e && (e.vietnamese?.length || e.senses?.length)) {
          const vi = e.vietnamese?.[0] ?? e.senses?.[0]?.vietnamese?.[0] ?? "";
          setTranslateOut(vi || "No translation found.");
          return;
        }
      }
      setTranslateOut("No translation found.");
    } catch {
      setTranslateOut("Translation failed. Check your connection.");
    } finally {
      setTranslateLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop on small screens */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/30 z-40 lg:hidden"
          />
          <motion.aside
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 260, damping: 30 }}
            className="fixed top-14 md:top-16 right-0 bottom-0 z-50 w-full sm:w-[360px] bg-white border-l-[3px] border-[var(--border)] shadow-[-6px_0_0_rgba(0,0,0,0.06)] flex flex-col"
            aria-label="Writing assist tools"
          >
            {/* Header */}
            <div className="shrink-0 h-14 border-b-[2px] border-[var(--border)] bg-[var(--skill-writing-light)] flex items-center justify-between px-4">
              <div className="flex items-center gap-2">
                <span
                  className="w-7 h-7 rounded-lg bg-white border-[2px] border-[var(--skill-writing-border)] flex items-center justify-center text-[var(--skill-writing)] font-bold text-xs"
                  style={{ fontFamily: "var(--font-heading)" }}
                >
                  A
                </span>
                <p
                  className="text-sm font-bold text-[var(--foreground)]"
                  style={{ fontFamily: "var(--font-heading)" }}
                >
                  Writing assist
                </p>
              </div>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-lg border-[2px] border-[var(--skill-writing-border)] bg-white text-[var(--skill-writing)] font-bold hover:-translate-y-0.5 active:translate-y-[1px] transition-transform"
                aria-label="Close assist panel"
                title="Close"
              >
                &times;
              </button>
            </div>

            {/* Tabs */}
            <div className="shrink-0 flex gap-2 px-4 pt-3">
              <button
                onClick={() => setTab("dictionary")}
                className={`flex-1 py-2 rounded-full text-sm font-bold border-[2px] border-b-[4px] transition-all ${
                  tab === "dictionary"
                    ? "bg-[var(--skill-writing)] text-white border-[#B45309]"
                    : "bg-white text-[var(--text-body)] border-[var(--border)] hover:-translate-y-0.5"
                }`}
                style={{ fontFamily: "var(--font-heading)" }}
              >
                Dictionary
              </button>
              <button
                onClick={() => setTab("translate")}
                className={`flex-1 py-2 rounded-full text-sm font-bold border-[2px] border-b-[4px] transition-all ${
                  tab === "translate"
                    ? "bg-[var(--skill-writing)] text-white border-[#B45309]"
                    : "bg-white text-[var(--text-body)] border-[var(--border)] hover:-translate-y-0.5"
                }`}
                style={{ fontFamily: "var(--font-heading)" }}
              >
                Translate
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 min-h-0 overflow-y-auto p-4 space-y-4">
              {tab === "dictionary" && (
                <>
                  <form onSubmit={handleSearchSubmit} className="flex gap-2">
                    <input
                      value={searchInput}
                      onChange={(e) => setSearchInput(e.target.value)}
                      placeholder="Type or double-click a word..."
                      className="flex-1 h-10 px-4 rounded-full border-[2px] border-[var(--border)] bg-white outline-none focus:border-[var(--skill-writing)] text-sm"
                      style={{ fontFamily: "var(--font-heading)" }}
                    />
                    <button
                      type="submit"
                      className="h-10 px-4 rounded-full bg-[var(--skill-writing)] text-white font-bold text-sm border-b-[4px] border-[#B45309] active:translate-y-[2px] active:border-b-[2px]"
                      style={{ fontFamily: "var(--font-heading)" }}
                    >
                      Look up
                    </button>
                  </form>

                  {loading && (
                    <div className="flex items-center gap-2 text-sm text-[var(--text-muted)]">
                      <div className="h-4 w-4 rounded-full border-[3px] border-[var(--skill-writing-border)] border-t-[var(--skill-writing)] animate-spin" />
                      Looking up...
                    </div>
                  )}

                  {err && !loading && (
                    <div className="text-sm text-[var(--destructive)] font-bold">
                      {err}
                    </div>
                  )}

                  {!loading && !err && entry && (
                    <div className="space-y-4">
                      <div>
                        <div className="flex items-baseline gap-2 flex-wrap">
                          <h3
                            className="text-2xl font-bold text-[var(--foreground)]"
                            style={{ fontFamily: "var(--font-heading)" }}
                          >
                            {entry.word}
                          </h3>
                          {entry.pos && (
                            <span
                              className="text-xs italic text-[var(--text-muted)]"
                              style={{ fontFamily: "var(--font-mono)" }}
                            >
                              {entry.pos}
                            </span>
                          )}
                        </div>
                        {entry.pronunciations?.[0]?.ipa && (
                          <div className="flex items-center gap-2 mt-1">
                            <span
                              className="text-sm text-[var(--text-muted)]"
                              style={{ fontFamily: "var(--font-mono)" }}
                            >
                              /{entry.pronunciations[0].ipa}/
                            </span>
                            <button
                              onClick={() => speakWord(entry.word, "US")}
                              className="text-xs font-bold text-[var(--skill-writing)] hover:underline"
                            >
                              Listen
                            </button>
                          </div>
                        )}
                      </div>

                      {vietnameseList.length > 0 && (
                        <div className="bg-[var(--skill-writing-light)] border-[2px] border-[var(--skill-writing-border)] rounded-2xl p-3">
                          <p
                            className="text-[10px] font-bold text-[var(--skill-writing)] uppercase tracking-wider mb-1"
                            style={{ fontFamily: "var(--font-heading)" }}
                          >
                            Vietnamese
                          </p>
                          <p
                            className="text-sm font-bold text-[var(--foreground)]"
                            style={{ fontFamily: "var(--font-heading)" }}
                          >
                            {vietnameseList.join(", ")}
                          </p>
                        </div>
                      )}

                      {entry.senses && entry.senses.length > 0 && (
                        <div className="space-y-3">
                          {entry.senses.map((s, i) => (
                            <div
                              key={s.id || i}
                              className="border-l-[3px] border-[var(--skill-writing-border)] pl-3"
                            >
                              {s.labels && s.labels.length > 0 && (
                                <p
                                  className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider mb-1"
                                  style={{
                                    fontFamily: "var(--font-heading)",
                                  }}
                                >
                                  {s.labels.join(", ")}
                                </p>
                              )}
                              <p
                                className="text-sm text-[var(--foreground)] leading-relaxed"
                                style={{ fontFamily: "var(--font-heading)" }}
                              >
                                {s.definitionEn}
                              </p>
                              {s.examples && s.examples.length > 0 && (
                                <ul className="mt-2 space-y-1">
                                  {s.examples.slice(0, 2).map((ex, j) => (
                                    <li
                                      key={j}
                                      className="text-xs text-[var(--text-muted)] italic"
                                    >
                                      &ldquo;{ex}&rdquo;
                                    </li>
                                  ))}
                                </ul>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {!loading && !err && !entry && word && (
                    <div className="space-y-3">
                      <p className="text-sm text-[var(--text-muted)]">
                        No exact match. Try a suggestion:
                      </p>
                      {suggestions.length === 0 ? (
                        <p className="text-xs text-[var(--text-muted)] italic">
                          No suggestions available.
                        </p>
                      ) : (
                        <div className="flex flex-wrap gap-2">
                          {suggestions.map((s) => (
                            <button
                              key={s.id}
                              onClick={() => {
                                setSearchInput(s.word);
                                setWord(s.word);
                              }}
                              className="px-3 py-1.5 rounded-full bg-white border-[2px] border-[var(--border)] text-sm font-bold text-[var(--text-body)] hover:border-[var(--skill-writing)] hover:text-[var(--skill-writing)]"
                              style={{ fontFamily: "var(--font-heading)" }}
                            >
                              {s.word}{" "}
                              <span className="text-[var(--text-muted)] text-xs">
                                {s.pos}
                              </span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {!word && (
                    <div className="text-sm text-[var(--text-muted)]">
                      <p className="mb-2">Tips:</p>
                      <ul className="space-y-1.5 list-disc pl-5">
                        <li>
                          Double-click any word in your essay to look it up.
                        </li>
                        <li>Or type a word above and press Look up.</li>
                      </ul>
                    </div>
                  )}
                </>
              )}

              {tab === "translate" && (
                <>
                  {/* Direction selector */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setTranslateDir("en-vi")}
                      className={`flex-1 py-2 rounded-full text-xs font-bold border-[2px] border-b-[4px] transition-all ${
                        translateDir === "en-vi"
                          ? "bg-[var(--skill-writing)] text-white border-[#B45309]"
                          : "bg-white text-[var(--text-body)] border-[var(--border)] hover:-translate-y-0.5"
                      }`}
                      style={{ fontFamily: "var(--font-heading)" }}
                    >
                      English
                    </button>
                    <button
                      onClick={() => {
                        setTranslateDir((d) => (d === "en-vi" ? "vi-en" : "en-vi"));
                        // Swap current input and output for quick re-translation
                        if (translateOut) {
                          setTranslateInput(translateOut);
                          setTranslateOut(null);
                        }
                      }}
                      title="Swap direction"
                      className="w-9 h-9 rounded-full bg-white border-[2px] border-[var(--skill-writing-border)] text-[var(--skill-writing)] font-bold hover:-translate-y-0.5 active:translate-y-[1px] transition-transform"
                      aria-label="Swap translation direction"
                    >
                      &#8646;
                    </button>
                    <button
                      onClick={() => setTranslateDir("vi-en")}
                      className={`flex-1 py-2 rounded-full text-xs font-bold border-[2px] border-b-[4px] transition-all ${
                        translateDir === "vi-en"
                          ? "bg-[var(--skill-writing)] text-white border-[#B45309]"
                          : "bg-white text-[var(--text-body)] border-[var(--border)] hover:-translate-y-0.5"
                      }`}
                      style={{ fontFamily: "var(--font-heading)" }}
                    >
                      Tiếng Việt
                    </button>
                  </div>

                  <textarea
                    value={translateInput}
                    onChange={(e) => setTranslateInput(e.target.value)}
                    placeholder={
                      translateDir === "en-vi"
                        ? "Enter an English sentence or phrase..."
                        : "Nhập câu hoặc cụm từ tiếng Việt..."
                    }
                    rows={4}
                    className="w-full p-3 rounded-2xl border-[2px] border-[var(--border)] bg-white outline-none focus:border-[var(--skill-writing)] text-sm resize-none"
                    style={{ fontFamily: "var(--font-heading)" }}
                  />
                  <button
                    onClick={handleTranslate}
                    disabled={translateLoading || !translateInput.trim()}
                    className={`w-full py-2.5 rounded-full font-bold text-sm border-b-[4px] transition-all ${
                      translateLoading || !translateInput.trim()
                        ? "bg-[var(--border)] text-[var(--text-muted)] border-[var(--border)] cursor-not-allowed"
                        : "bg-[var(--skill-writing)] text-white border-[#B45309] hover:-translate-y-0.5 active:translate-y-[2px] active:border-b-[2px]"
                    }`}
                    style={{ fontFamily: "var(--font-heading)" }}
                  >
                    {translateLoading
                      ? "Translating..."
                      : translateDir === "en-vi"
                      ? "Translate to Vietnamese"
                      : "Translate to English"}
                  </button>

                  {translateOut && (
                    <div className="bg-[var(--skill-writing-light)] border-[2px] border-[var(--skill-writing-border)] rounded-2xl p-3">
                      <p
                        className="text-[10px] font-bold text-[var(--skill-writing)] uppercase tracking-wider mb-1"
                        style={{ fontFamily: "var(--font-heading)" }}
                      >
                        {translateDir === "en-vi" ? "Vietnamese" : "English"}
                      </p>
                      <p
                        className="text-sm font-bold text-[var(--foreground)] leading-relaxed"
                        style={{ fontFamily: "var(--font-heading)" }}
                      >
                        {translateOut}
                      </p>
                    </div>
                  )}

                  <p className="text-[11px] text-[var(--text-muted)] italic">
                    {translateDir === "en-vi"
                      ? "Tip: for single words, switch to Dictionary for definitions and examples."
                      : "Mẹo: với từ đơn, hãy chuyển sang tab Dictionary để xem định nghĩa và ví dụ."}
                  </p>
                </>
              )}
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
