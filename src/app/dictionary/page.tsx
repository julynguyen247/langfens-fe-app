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

  // Fetch suggestions with debounce
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (query.trim().length < 2) {
      setSuggestions([]);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      try {
        const data = await suggestDictionary(query);
        setSuggestions(Array.isArray(data) ? data : []);
        setSelectedIdx(-1);
      } catch {
        setSuggestions([]);
      }
    }, 250);

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
    <div className="min-h-screen bg-[#F8FAFC] font-sans pb-20">

      {/* =============================================
          1. HERO & SEARCH (Floating Style)
      ============================================= */}
      <div className="max-w-3xl mx-auto pt-16 pb-12 px-4 text-center">
        <h1 className="font-serif text-4xl font-bold text-slate-900 mb-2">Langfens Dictionary</h1>
        <p className="text-slate-500 mb-8">Academic vocabulary power for IELTS Band 7.0+</p>

        <div className="relative z-20">
          <div className="bg-white border border-slate-200 rounded-2xl shadow-xl hover:shadow-2xl transition-all h-20 flex items-center p-2 focus-within:ring-4 focus-within:ring-blue-50">
            <span className="material-symbols-rounded text-slate-300 text-3xl ml-4">search</span>
            <input
              ref={inputRef}
              className="flex-1 h-full bg-transparent px-4 text-xl font-serif text-slate-800 placeholder:text-slate-400 outline-none"
              placeholder="Type a word (e.g., 'mitigate')..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setTimeout(() => setIsFocused(false), 200)}
              onKeyDown={handleKeyDown}
            />
            <button
              onClick={() => doSearch(query)}
              disabled={loading}
              className="h-16 w-20 bg-[#3B82F6] hover:bg-blue-700 text-white rounded-xl flex items-center justify-center transition-colors shadow-md disabled:opacity-50"
            >
              {loading ? (
                <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <span className="material-symbols-rounded text-2xl">arrow_forward</span>
              )}
            </button>
          </div>

          {/* Suggestions Dropdown */}
          {isFocused && suggestions.length > 0 && (
            <div className="absolute top-full mt-2 left-0 w-full bg-white border border-slate-100 rounded-xl shadow-xl overflow-hidden z-30 py-2">
              {suggestions.map((s, i) => (
                <button
                  key={s.id}
                  onMouseDown={() => doSearch(s.word)}
                  className={`w-full text-left px-6 py-3 flex items-center justify-between transition-colors ${
                    i === selectedIdx ? 'bg-blue-50' : 'hover:bg-slate-50'
                  }`}
                >
                  <span className="flex items-center gap-3">
                    <span className="material-symbols-rounded text-slate-300">search</span>
                    <span className="font-serif font-bold text-slate-800">{s.word}</span>
                  </span>
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-widest bg-slate-100 px-2 py-1 rounded">{s.pos}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* =============================================
          2. MAIN CONTENT AREA
      ============================================= */}
      <div className="max-w-4xl mx-auto px-4">

        {/* Loading State */}
        {loading && (
          <div className="bg-white border border-slate-200 rounded-[2rem] shadow-sm p-12 text-center">
            <div className="w-14 h-14 border-4 border-slate-100 border-t-[#3B82F6] rounded-full animate-spin mx-auto mb-6" />
            <p className="text-slate-400 font-serif text-lg">Looking up the word...</p>
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <div className="bg-white border border-slate-200 rounded-[2rem] shadow-sm p-12 text-center">
            <span className="material-symbols-rounded text-6xl text-red-100 mb-4 block">search_off</span>
            <h3 className="text-xl font-serif font-bold text-slate-800 mb-2">Word Not Found</h3>
            <p className="text-slate-500 mb-6">{error}</p>
            <button
              onClick={() => { setQuery(''); setError(null); inputRef.current?.focus(); }}
              className="text-[#3B82F6] font-bold hover:underline"
            >
              Try another word
            </button>
          </div>
        )}

        {/* Empty State: Word of the Day */}
        {!result && !loading && !error && (
          <div className="bg-white border border-slate-200 rounded-[2rem] shadow-sm p-12 text-center relative overflow-hidden group hover:border-blue-200 transition-colors">
            <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-blue-400 to-blue-600"></div>
            <div className="inline-flex items-center gap-2 bg-blue-50 text-blue-700 px-4 py-1.5 rounded-full mb-6 mt-2">
              <span className="material-symbols-rounded text-sm">wb_sunny</span>
              <span className="text-xs font-bold uppercase tracking-widest">Word of the Day</span>
            </div>
            <h2 className="text-6xl font-serif font-bold text-slate-900 mb-4">Serendipity</h2>
            <div className="text-lg text-slate-500 font-mono mb-8">/ˌser.ənˈdɪp.ə.ti/</div>
            <p className="text-xl font-serif text-slate-700 max-w-2xl mx-auto leading-relaxed">
              "The occurrence and development of events by chance in a happy or beneficial way."
            </p>
          </div>
        )}

        {/* Result Card */}
        {result && !loading && (
          <div className="bg-white border border-slate-200 rounded-[2rem] shadow-sm p-10 md:p-12 animate-in fade-in slide-in-from-bottom-4">

            {/* Word Header */}
            <div className="border-b border-slate-100 pb-8 mb-8 flex flex-col md:flex-row md:items-end justify-between gap-6">
              <div>
                <div className="flex items-baseline gap-4 mb-3">
                  <h2 className="text-5xl md:text-6xl font-serif font-bold text-slate-900">{result.word}</h2>
                  <span className="italic font-bold text-slate-400 text-xl">{result.pos}</span>
                </div>
                {/* Phonetics List with Audio */}
                <div className="flex flex-wrap gap-3">
                  {ukPronunciation && (
                    <button
                      onClick={() => speakWord(result.word, 'UK')}
                      className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-slate-200 bg-slate-50 hover:border-blue-300 hover:bg-blue-50 transition-colors group"
                    >
                      <span className="text-[10px] font-bold uppercase text-blue-600">🇬🇧 UK</span>
                      <span className="font-mono text-slate-600 text-sm group-hover:text-blue-700">{ukPronunciation.ipa}</span>
                      <span className="material-symbols-rounded text-slate-400 text-sm group-hover:text-blue-600">volume_up</span>
                    </button>
                  )}
                  {usPronunciation && (
                    <button
                      onClick={() => speakWord(result.word, 'US')}
                      className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-slate-200 bg-slate-50 hover:border-red-300 hover:bg-red-50 transition-colors group"
                    >
                      <span className="text-[10px] font-bold uppercase text-red-600">🇺🇸 US</span>
                      <span className="font-mono text-slate-600 text-sm group-hover:text-red-700">{usPronunciation.ipa}</span>
                      <span className="material-symbols-rounded text-slate-400 text-sm group-hover:text-red-600">volume_up</span>
                    </button>
                  )}
                </div>
              </div>
              <button
                onClick={toggleSave}
                className={`flex items-center gap-2 text-sm font-bold px-4 py-2 rounded-xl transition-colors ${
                  isSaved
                    ? 'text-yellow-700 bg-yellow-50 hover:bg-yellow-100'
                    : 'text-blue-600 hover:bg-blue-50'
                }`}
              >
                <span className="material-symbols-rounded">{isSaved ? 'bookmark' : 'bookmark_add'}</span>
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
                      <span className="shrink-0 flex items-center justify-center w-6 h-6 rounded bg-slate-900 text-white text-xs font-bold mt-1.5">
                        {idx + 1}
                      </span>

                      <div className="flex-1 space-y-3">
                        {/* English Definition */}
                        <div className="text-xl text-slate-800 font-medium leading-relaxed">
                          {sense.definitionEn}
                          {/* Vietnamese Badge */}
                          {sense.vietnameseTerms && sense.vietnameseTerms.length > 0 && (
                            <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-md text-sm font-medium bg-blue-50 text-blue-700 align-middle">
                              {sense.vietnameseTerms.join(', ')}
                            </span>
                          )}
                        </div>

                        {/* Labels */}
                        {sense.labels && sense.labels.length > 0 && (
                          <div className="text-xs font-bold text-slate-400 uppercase tracking-wide">
                            {sense.labels.join(', ')}
                          </div>
                        )}

                        {/* Examples Block (Blue Stripe) */}
                        {sense.examples && sense.examples.length > 0 && (
                          <div className="pl-4 border-l-4 border-[#3B82F6] bg-slate-50 py-3 pr-4 rounded-r-lg mt-3">
                            <ul className="space-y-2">
                              {sense.examples.slice(0, 2).map((ex, k) => (
                                <li key={k} className="font-serif italic text-slate-600 text-lg">
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
                <p className="text-slate-500 font-serif">No definitions available.</p>
              )}
            </div>

            {/* Footer: Forms */}
            {result.forms && result.forms.length > 0 && (
              <div className="mt-12 pt-6 border-t border-slate-100 flex flex-wrap gap-2 text-sm">
                <span className="font-bold text-slate-400 uppercase tracking-wider mr-2">Forms:</span>
                {result.forms.map((f, i) => (
                  <span key={i} className="text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                    {f.form} <span className="text-slate-400 text-xs">({f.tags.join(', ')})</span>
                  </span>
                ))}
              </div>
            )}
          </div>
        )}

        {/* History & Saved Words */}
        {(history.length > 0 || saved.length > 0) && (
          <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
            {history.length > 0 && (
              <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                <h3 className="font-bold text-slate-700 mb-4 flex items-center gap-2 text-sm">
                  <span className="material-symbols-rounded text-slate-400">history</span>
                  Recent Searches
                </h3>
                <div className="flex flex-wrap gap-2">
                  {history.slice(0, 8).map((h) => (
                    <button
                      key={h}
                      onClick={() => { setQuery(h); doSearch(h); }}
                      className="text-sm font-serif text-slate-600 bg-slate-50 border border-slate-100 px-3 py-1.5 rounded-full hover:bg-white hover:border-blue-300 hover:text-blue-600 transition-all"
                    >
                      {h}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {saved.length > 0 && (
              <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                <h3 className="font-bold text-slate-700 mb-4 flex items-center gap-2 text-sm">
                  <span className="material-symbols-rounded text-blue-500">bookmark</span>
                  Saved Words
                  <span className="ml-auto text-xs font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">{saved.length}</span>
                </h3>
                <div className="flex flex-wrap gap-2">
                  {saved.slice(0, 10).map((w) => (
                    <button
                      key={w}
                      onClick={() => { setQuery(w); doSearch(w); }}
                      className="text-sm font-serif font-bold text-blue-600 bg-blue-50 border border-blue-100 px-3 py-1.5 rounded-full hover:bg-blue-100 transition-all"
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
