'use client';
import { useState, useEffect, useRef, useMemo } from 'react';
import { suggestDictionary, lookupDictionary } from '@/utils/api';

// =============================================
// TYPES (Based on backend JSON)
// =============================================
interface Pronunciation {
  region: string;
  ipa: string;
  mp3Url: string | null;
}

interface DictionaryForm {
  form: string;
  tags: string[];
}

interface DictionarySense {
  id: string;
  definitionEn: string;
  definitionVi?: string | null;
  vietnameseTerms?: string[];
  examples: string[];
  labels: string[];
}

interface DictionaryEntry {
  id: number;
  word: string;
  pos: string;
  pronunciations: Pronunciation[];
  senses: DictionarySense[];
  forms: DictionaryForm[];
  vietnameseTerms?: string[];
}

interface Suggestion {
  id: number;
  word: string;
  pos: string;
}

// =============================================
// LOCALSTORAGE HELPERS
// =============================================
const LS_HISTORY = "lf_dict_history";
const LS_SAVED = "lf_dict_saved";

const saveJSON = (k: string, v: any) =>
  typeof window !== 'undefined' && localStorage.setItem(k, JSON.stringify(v));

const readJSON = <T,>(k: string, fallback: T): T => {
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = localStorage.getItem(k);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
};

// =============================================
// AUDIO HELPER (Web Speech API)
// =============================================
function speakWord(word: string, region: 'UK' | 'US' = 'UK') {
  if (typeof window === 'undefined' || !window.speechSynthesis) return;

  const utterance = new SpeechSynthesisUtterance(word);
  utterance.lang = region === 'UK' ? 'en-GB' : 'en-US';
  utterance.rate = 0.9;
  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(utterance);
}

// =============================================
// MAIN COMPONENT
// =============================================
export default function DictionaryPage() {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [isFocused, setIsFocused] = useState(false);
  const [selectedIdx, setSelectedIdx] = useState(-1);

  const [result, setResult] = useState<DictionaryEntry | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [history, setHistory] = useState<string[]>([]);
  const [saved, setSaved] = useState<string[]>([]);

  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  // Auto-focus on page load
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Init localStorage
  useEffect(() => {
    setHistory(readJSON<string[]>(LS_HISTORY, []));
    setSaved(readJSON<string[]>(LS_SAVED, []));
  }, []);

  // Keyboard: '/' focus
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === '/' && document.activeElement !== inputRef.current) {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  // Fetch suggestions with debounce (300ms per spec)
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (query.trim().length < 2) {
      setSuggestions([]);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      try {
        const data = await suggestDictionary(query);
        setSuggestions(Array.isArray(data) ? data.slice(0, 5) : []);
        setSelectedIdx(-1);
      } catch {
        setSuggestions([]);
      }
    }, 300);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query]);

  // Search word
  const doSearch = async (term: string) => {
    const t = term.trim();
    if (!t) return;

    setError(null);
    setLoading(true);
    setIsFocused(false);
    setSuggestions([]);

    try {
      const data = await lookupDictionary(t);
      setResult(data);
      setQuery(data.word);

      // Update history
      setHistory((prev) => {
        const next = [data.word, ...prev.filter((x) => x !== data.word)].slice(0, 15);
        saveJSON(LS_HISTORY, next);
        return next;
      });
    } catch (err: any) {
      if (err?.response?.status === 404) {
        setError("Word not found in our dictionary.");
      } else {
        setError("Failed to lookup. Please try again.");
      }
      setResult(null);
    } finally {
      setLoading(false);
    }
  };

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isFocused || suggestions.length === 0) {
      if (e.key === 'Enter') doSearch(query);
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIdx((prev) => Math.min(prev + 1, suggestions.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIdx((prev) => Math.max(prev - 1, -1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (selectedIdx >= 0) {
        doSearch(suggestions[selectedIdx].word);
      } else {
        doSearch(query);
      }
    } else if (e.key === 'Escape') {
      setIsFocused(false);
    }
  };

  // Toggle save word
  const toggleSave = () => {
    const w = result?.word;
    if (!w) return;
    setSaved((prev) => {
      const exists = prev.includes(w);
      const next = exists ? prev.filter((x) => x !== w) : [w, ...prev];
      saveJSON(LS_SAVED, next);
      return next;
    });
  };

  const isSaved = useMemo(() => {
    return result?.word ? saved.includes(result.word) : false;
  }, [result, saved]);

  // Get unique pronunciations by region
  const ukPronunciation = result?.pronunciations?.find(p => p.region === 'UK');
  const usPronunciation = result?.pronunciations?.find(p => p.region === 'US');

  return (
    <div className="min-h-screen bg-[var(--background)] pb-20">

      {/* Hero & Search */}
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-12 text-center">
        <h1
          className="text-3xl sm:text-4xl font-extrabold text-[var(--text-heading)] mb-2"
          style={{ fontFamily: "var(--font-sans)" }}
        >
          Word Explorer
        </h1>
        <p className="text-[var(--text-muted)] mb-8 font-bold">Academic vocabulary power for IELTS Band 7.0+</p>

        <div className="relative" style={{ zIndex: 20 }}>
          <input
            ref={inputRef}
            className="w-full text-xl rounded-[2rem] border-[3px] border-[var(--border)] border-b-[5px] focus:border-[var(--primary)] px-6 py-4 bg-white text-[var(--foreground)] placeholder:text-[var(--text-muted)] outline-none font-bold transition-colors"
            style={{ fontFamily: "var(--font-sans)" }}
            placeholder="Type a word (e.g., 'mitigate')..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setTimeout(() => setIsFocused(false), 200)}
            onKeyDown={handleKeyDown}
          />

          {/* Suggestions Dropdown */}
          {isFocused && suggestions.length > 0 && (
            <div
              className="absolute top-full mt-2 left-0 w-full bg-white rounded-[2rem] border-[3px] border-[var(--border)] shadow-[0_4px_0_rgba(0,0,0,0.08)] overflow-hidden py-2"
              style={{ zIndex: 20 }}
            >
              {suggestions.map((s, i) => (
                <button
                  key={s.id}
                  onMouseDown={() => doSearch(s.word)}
                  className={`w-full text-left px-6 py-3 flex items-center justify-between transition-colors ${
                    i === selectedIdx ? 'bg-[var(--primary-light)]' : 'hover:bg-[var(--background)]'
                  }`}
                >
                  <span className="font-bold text-[var(--foreground)]" style={{ fontFamily: "var(--font-sans)" }}>
                    {s.word}
                  </span>
                  <span className="text-xs font-bold text-[var(--text-muted)] bg-[var(--background)] px-2 py-1 rounded-full border-[2px] border-[var(--border)]">
                    {s.pos}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Search button below input */}
        <button
          onClick={() => doSearch(query)}
          disabled={loading}
          className="mt-4 h-12 px-8 rounded-full bg-[var(--primary)] text-white font-bold border-b-[4px] border-[var(--primary-dark)] hover:-translate-y-0.5 hover:border-b-[5px] active:translate-y-[2px] active:border-b-[2px] transition-all disabled:opacity-50"
        >
          {loading ? (
            <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin mx-auto" />
          ) : (
            "Search"
          )}
        </button>
      </div>

      {/* Main Content Area */}
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Loading State */}
        {loading && (
          <div className="rounded-[2rem] border-[3px] border-[var(--border)] shadow-[0_4px_0_rgba(0,0,0,0.08)] bg-white p-12 text-center">
            <div className="w-14 h-14 border-4 border-[var(--border)] border-t-[var(--primary)] rounded-full animate-spin mx-auto mb-6" />
            <p className="text-[var(--text-muted)] font-bold text-lg">Looking up the word...</p>
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <div className="rounded-[2rem] border-[3px] border-[var(--destructive)] shadow-[0_4px_0_rgba(0,0,0,0.08)] bg-white p-12 text-center">
            <h3
              className="text-xl font-bold text-[var(--foreground)] mb-2"
              style={{ fontFamily: "var(--font-sans)" }}
            >
              Word Not Found
            </h3>
            <p className="text-[var(--text-muted)] mb-6">{error}</p>
            <button
              onClick={() => { setQuery(''); setError(null); inputRef.current?.focus(); }}
              className="text-[var(--primary)] font-bold hover:text-[var(--primary-hover)] transition-colors"
            >
              Try another word
            </button>
          </div>
        )}

        {/* Empty State: Word of the Day */}
        {!result && !loading && !error && (
          <div className="rounded-[2rem] border-[3px] border-[var(--border)] shadow-[0_4px_0_rgba(0,0,0,0.08)] bg-white p-12 text-center relative overflow-hidden transition-all hover:-translate-y-[3px] hover:border-[var(--primary)] hover:shadow-[0_6px_0_rgba(0,0,0,0.08)]">
            <div className="absolute top-0 left-0 w-full h-[4px] bg-[var(--primary)]"></div>
            <div className="inline-flex items-center gap-2 bg-[var(--primary-light)] text-[var(--primary)] px-4 py-1.5 rounded-full mb-6 mt-2 border-[2px] border-[var(--skill-reading-border)]">
              <span className="text-xs font-bold">Word of the Day</span>
            </div>
            <h2
              className="text-5xl font-bold text-[var(--text-heading)] mb-4"
              style={{ fontFamily: "var(--font-sans)" }}
            >
              Serendipity
            </h2>
            <div
              className="text-lg text-[var(--text-muted)] mb-8"
              style={{ fontFamily: "var(--font-mono)" }}
            >
              /ser.enˈdɪp.e.ti/
            </div>
            <p className="text-xl text-[var(--text-body)] max-w-2xl mx-auto leading-relaxed">
              "The occurrence and development of events by chance in a happy or beneficial way."
            </p>
          </div>
        )}

        {/* Result Card */}
        {result && !loading && (
          <div className="rounded-[2rem] border-[3px] border-[var(--border)] shadow-[0_4px_0_rgba(0,0,0,0.08)] bg-white p-8 md:p-10">

            {/* Word Header */}
            <div className="border-b-[2px] border-[var(--border)] pb-8 mb-8 flex flex-col md:flex-row md:items-end justify-between gap-6">
              <div>
                <div className="flex items-baseline gap-4 mb-3">
                  <h2
                    className="text-3xl font-bold text-[var(--text-heading)]"
                    style={{ fontFamily: "var(--font-sans)" }}
                  >
                    {result.word}
                  </h2>
                  <span className="rounded-full bg-[var(--primary-light)] text-[var(--primary)] px-3 py-1 text-sm font-bold border-[2px] border-[var(--skill-reading-border)]">
                    {result.pos}
                  </span>
                </div>
                {/* Phonetics List with Audio */}
                <div className="flex flex-wrap gap-3">
                  {ukPronunciation && (
                    <button
                      onClick={() => speakWord(result.word, 'UK')}
                      className="flex items-center gap-2 px-4 py-2 rounded-full border-[2px] border-[var(--border)] border-b-[4px] bg-[var(--background)] hover:border-[var(--primary)] hover:bg-[var(--primary-light)] active:translate-y-[2px] active:border-b-[2px] transition-all group"
                    >
                      <span className="text-[10px] font-bold text-[var(--primary)]">UK</span>
                      <span
                        className="text-[var(--text-muted)] text-sm group-hover:text-[var(--primary)]"
                        style={{ fontFamily: "var(--font-mono)" }}
                      >
                        {ukPronunciation.ipa}
                      </span>
                      <span className="text-[var(--text-muted)] text-xs font-bold group-hover:text-[var(--primary)]">Play</span>
                    </button>
                  )}
                  {usPronunciation && (
                    <button
                      onClick={() => speakWord(result.word, 'US')}
                      className="flex items-center gap-2 px-4 py-2 rounded-full border-[2px] border-[var(--border)] border-b-[4px] bg-[var(--background)] hover:border-[var(--destructive)] hover:bg-red-50 active:translate-y-[2px] active:border-b-[2px] transition-all group"
                    >
                      <span className="text-[10px] font-bold text-[var(--destructive)]">US</span>
                      <span
                        className="text-[var(--text-muted)] text-sm group-hover:text-[var(--destructive)]"
                        style={{ fontFamily: "var(--font-mono)" }}
                      >
                        {usPronunciation.ipa}
                      </span>
                      <span className="text-[var(--text-muted)] text-xs font-bold group-hover:text-[var(--destructive)]">Play</span>
                    </button>
                  )}
                </div>
              </div>
              <button
                onClick={toggleSave}
                className={`flex items-center gap-2 text-sm font-bold px-4 py-2 rounded-full transition-all border-[2px] border-b-[4px] active:translate-y-[2px] active:border-b-[2px] ${
                  isSaved
                    ? 'text-[var(--skill-writing)] bg-[var(--skill-writing-light)] border-[var(--skill-writing-border)] hover:bg-[var(--skill-writing-light)]'
                    : 'text-[var(--primary)] border-[var(--border)] hover:border-[var(--primary)] hover:bg-[var(--primary-light)]'
                }`}
              >
                {isSaved ? 'Saved' : 'Save Word'}
              </button>
            </div>

            {/* Definitions (Senses) */}
            <div className="space-y-10">
              {result.senses && result.senses.length > 0 ? (
                result.senses.map((sense, idx) => (
                  <div key={sense.id || idx}>
                    <div className="flex gap-4">
                      {/* Index Number */}
                      <span
                        className="shrink-0 flex items-center justify-center w-7 h-7 rounded-full bg-[var(--primary)] text-white text-xs font-bold mt-1 border-b-[2px] border-[var(--primary-dark)]"
                        style={{ fontFamily: "var(--font-mono)" }}
                      >
                        {idx + 1}
                      </span>

                      <div className="flex-1 space-y-3">
                        {/* English Definition */}
                        <div className="text-xl text-[var(--foreground)] font-bold leading-relaxed">
                          {sense.definitionEn}
                          {/* Vietnamese Badge */}
                          {sense.vietnameseTerms && sense.vietnameseTerms.length > 0 && (
                            <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-sm font-bold bg-[var(--primary-light)] text-[var(--primary)] align-middle border-[2px] border-[var(--skill-reading-border)]">
                              {sense.vietnameseTerms.join(', ')}
                            </span>
                          )}
                        </div>

                        {/* Labels */}
                        {sense.labels && sense.labels.length > 0 && (
                          <div className="text-xs font-bold text-[var(--text-muted)]">
                            {sense.labels.join(', ')}
                          </div>
                        )}

                        {/* Examples Block */}
                        {sense.examples && sense.examples.length > 0 && (
                          <div className="pl-4 border-l-[4px] border-[var(--primary)] bg-[var(--background)] py-3 pr-4 rounded-r-[1rem] mt-3">
                            <ul className="space-y-2">
                              {sense.examples.slice(0, 2).map((ex, k) => (
                                <li key={k} className="italic text-[var(--text-body)] text-lg">
                                  "{ex}"
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-[var(--text-muted)] font-bold">No definitions available.</p>
              )}
            </div>

            {/* Footer: Forms */}
            {result.forms && result.forms.length > 0 && (
              <div className="mt-12 pt-6 border-t-[2px] border-[var(--border)]">
                <span className="font-bold text-[var(--text-muted)] text-sm mr-2">Forms</span>
                <div className="mt-3 flex flex-wrap gap-2 overflow-x-auto">
                  {result.forms.map((f, i) => (
                    <span
                      key={i}
                      className="text-[var(--text-body)] bg-[var(--background)] px-3 py-1.5 rounded-full font-bold border-[2px] border-[var(--border)] text-sm whitespace-nowrap"
                    >
                      {f.form} <span className="text-[var(--text-muted)] text-xs">({f.tags.join(', ')})</span>
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* History & Saved Words */}
        {(history.length > 0 || saved.length > 0) && (
          <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
            {history.length > 0 && (
              <div className="rounded-[2rem] border-[3px] border-[var(--border)] shadow-[0_4px_0_rgba(0,0,0,0.08)] bg-white p-6">
                <h3
                  className="font-bold text-[var(--text-body)] mb-4 text-sm"
                  style={{ fontFamily: "var(--font-sans)" }}
                >
                  Recent Searches
                </h3>
                <div className="flex flex-wrap gap-2">
                  {history.slice(0, 8).map((h) => (
                    <button
                      key={h}
                      onClick={() => { setQuery(h); doSearch(h); }}
                      className="text-sm font-bold text-[var(--text-body)] bg-[var(--background)] border-[2px] border-[var(--border)] px-3 py-1.5 rounded-full hover:bg-[var(--primary-light)] hover:border-[var(--primary)] hover:text-[var(--primary)] transition-all"
                    >
                      {h}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {saved.length > 0 && (
              <div className="rounded-[2rem] border-[3px] border-[var(--border)] shadow-[0_4px_0_rgba(0,0,0,0.08)] bg-white p-6">
                <h3
                  className="font-bold text-[var(--text-body)] mb-4 flex items-center gap-2 text-sm"
                  style={{ fontFamily: "var(--font-sans)" }}
                >
                  Saved Words
                  <span
                    className="ml-auto text-xs font-bold text-[var(--text-muted)] bg-[var(--background)] px-2 py-0.5 rounded-full border-[2px] border-[var(--border)]"
                    style={{ fontFamily: "var(--font-mono)" }}
                  >
                    {saved.length}
                  </span>
                </h3>
                <div className="flex flex-wrap gap-2">
                  {saved.slice(0, 10).map((w) => (
                    <button
                      key={w}
                      onClick={() => { setQuery(w); doSearch(w); }}
                      className="text-sm font-bold text-[var(--primary)] bg-[var(--primary-light)] border-[2px] border-[var(--skill-reading-border)] px-3 py-1.5 rounded-full hover:bg-[var(--skill-reading-light)] transition-all"
                    >
                      {w}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}
