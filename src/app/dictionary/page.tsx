"use client";

import { useEffect, useMemo, useRef, useState } from "react";
async function mockFetchDictionary(term: string) {
  await new Promise((r) => setTimeout(r, 520));
  if (!term) return null;
  const base = term.toLowerCase();
  return {
    word: base,
    phonetics: [{ text: "/ˈ" + base.slice(0, 3) + "·.../", audio: "" }],
    level: ["A1", "A2", "B1", "B2", "C1"][Math.floor(Math.random() * 5)],
    frequency: ["common", "uncommon", "rare"][Math.floor(Math.random() * 3)],
    meanings: [
      {
        partOfSpeech: "noun",
        defs: [
          {
            def: `Definition of ${base} as a noun (mock).`,
            ex: `I looked up the word "${base}" in the dictionary.`,
          },
          {
            def: `Another common meaning of ${base}.`,
            ex: `This sentence illustrates ${base} clearly.`,
          },
        ],
        synonyms: ["term", "entry", "lexeme"],
        collocations: ["look up", `${base} meaning`, `${base} usage`],
      },
      {
        partOfSpeech: "verb",
        defs: [{ def: `To ${base} (verb form).`, ex: `They ${base} daily.` }],
        synonyms: ["use", "employ"],
        collocations: [`how to ${base}`, `${base} correctly`],
      },
    ],
    forms: ["plural: " + base + "s", "past: " + base + "ed"],
  } as const;
}
const LS_HISTORY = "lf_dict_history";
const LS_SAVED = "lf_dict_saved";
const saveJSON = (k: string, v: any) =>
  localStorage.setItem(k, JSON.stringify(v));
const readJSON = <T,>(k: string, fallback: T): T => {
  try {
    const raw = localStorage.getItem(k);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
};

export default function DictionaryPage() {
  const [q, setQ] = useState("");
  const [results, setResults] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activePOS, setActivePOS] = useState<string | null>(null);

  const [history, setHistory] = useState<string[]>([]);
  const [saved, setSaved] = useState<string[]>([]);

  const inputRef = useRef<HTMLInputElement>(null);
  const debRef = useRef<number | null>(null);

  // init localStorage state
  useEffect(() => {
    setHistory(readJSON<string[]>(LS_HISTORY, []));
    setSaved(readJSON<string[]>(LS_SAVED, []));
  }, []);

  // keyboard: '/' focus, Enter search
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "/") {
        e.preventDefault();
        inputRef.current?.focus();
      }
      if (e.key === "Enter" && document.activeElement === inputRef.current) {
        doSearch(q);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [q]);

  const doSearch = async (term: string) => {
    const t = term.trim();
    if (!t) return;
    setError(null);
    setLoading(true);
    setResults(null);
    try {
      const data = await mockFetchDictionary(t);
      setResults(data);
      setActivePOS(data?.meanings?.[0]?.partOfSpeech ?? null);
      setHistory((prev) => {
        const next = [t, ...prev.filter((x) => x !== t)].slice(0, 15);
        saveJSON(LS_HISTORY, next);
        return next;
      });
    } catch {
      setError("Không thể tra từ. Thử lại nhé.");
    } finally {
      setLoading(false);
    }
  };

  // debounce while typing
  const onChange = (v: string) => {
    setQ(v);
    if (debRef.current) window.clearTimeout(debRef.current);
    debRef.current = window.setTimeout(() => {
      if (v.trim()) doSearch(v.trim());
    }, 400);
  };

  const toggleSave = (term?: string) => {
    const t = (term ?? results?.word ?? "").trim();
    if (!t) return;
    setSaved((prev) => {
      const exists = prev.includes(t);
      const next = exists ? prev.filter((x) => x !== t) : [t, ...prev];
      saveJSON(LS_SAVED, next);
      return next;
    });
  };

  const isSaved = useMemo(() => {
    const w = results?.word;
    if (!w) return false;
    return saved.includes(w);
  }, [results, saved]);

  return (
    <div className="min-h-[calc(100vh-56px)] bg-[#F7F8FA] text-gray-800">
      {/* Top bar */}
      <div className="border-b bg-white">
        <div className="mx-auto max-w-7xl px-4 py-3 flex items-center gap-3">
          <div className="text-xl font-extrabold tracking-tight text-blue-500">
            Dictionary
          </div>
          <div className="ml-auto flex items-center gap-2 w-full max-w-xl">
            <div className="relative flex-1">
              <svg
                viewBox="0 0 24 24"
                className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400"
                fill="currentColor"
              >
                <path d="M10 2a8 8 0 105.293 14.293l4.707 4.707 1.414-1.414-4.707-4.707A8 8 0 0010 2zm0 2a6 6 0 110 12A6 6 0 0110 4z" />
              </svg>
              <input
                ref={inputRef}
                value={q}
                onChange={(e) => onChange(e.target.value)}
                placeholder='Tra từ: ví dụ "definition", "collocation"... (phím tắt /)'
                className="w-full h-10 pl-9 pr-3 rounded-xl border border-gray-300 outline-none focus:ring-4 focus:ring-blue-200 placeholder-gray-400"
              />
            </div>
            <button
              onClick={() => doSearch(q)}
              className="h-10 px-4 rounded-xl bg-blue-600 text-white font-semibold hover:bg-blue-700 active:translate-y-[1px]"
            >
              Tra
            </button>
          </div>
        </div>
      </div>

      {/* Layout */}
      <div className="mx-auto max-w-7xl px-4 py-5 grid grid-cols-1 lg:grid-cols-[260px_1fr_280px] gap-5">
        {/* LEFT */}
        <div className="space-y-4 order-2 lg:order-1">
          <div className="bg-white border rounded-xl">
            <div className="px-4 py-3 border-b font-semibold">Lịch sử</div>
            <div className="p-4">
              {history.length === 0 ? (
                <p className="text-sm text-gray-600 font-medium">
                  Chưa có lịch sử tra cứu.
                </p>
              ) : (
                <ul className="space-y-1">
                  {history.map((h) => (
                    <li key={h}>
                      <button
                        onClick={() => {
                          setQ(h);
                          doSearch(h);
                        }}
                        className="w-full text-left px-2 py-1 rounded hover:bg-gray-100 text-sm flex items-center justify-between text-gray-700"
                      >
                        <span>{h}</span>
                        <svg
                          viewBox="0 0 24 24"
                          className="h-4 w-4 text-gray-400"
                          fill="currentColor"
                        >
                          <path d="M9 6l6 6-6 6" />
                        </svg>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          <div className="bg-white border rounded-xl">
            <div className="px-4 py-3 border-b font-semibold">Đã lưu</div>
            <div className="p-4">
              {saved.length === 0 ? (
                <p className="text-sm text-gray-600 font-medium">
                  Chưa có từ nào lưu.
                </p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {saved.map((s) => (
                    <button
                      key={s}
                      onClick={() => {
                        setQ(s);
                        doSearch(s);
                      }}
                      className="px-2 py-1 text-sm rounded-full bg-gray-100 hover:bg-gray-200 text-gray-800"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* CENTER */}
        <div className="order-1 lg:order-2">
          {!results && !loading && !error && (
            <div className="bg-white border rounded-xl">
              <div className="py-12 text-center text-gray-600">
                Gõ từ khóa để bắt đầu tra cứu.
              </div>
            </div>
          )}

          {loading && (
            <div className="bg-white border rounded-xl">
              <div className="py-12 flex items-center justify-center gap-2 text-gray-600">
                <svg
                  className="h-4 w-4 animate-spin"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path d="M12 2a10 10 0 100 20 10 10 0 000-20zm0 2a8 8 0 110 16A8 8 0 0112 4z" />
                </svg>
                Đang tải...
              </div>
            </div>
          )}

          {error && (
            <div className="bg-white border rounded-xl">
              <div className="py-12 text-center text-red-600 text-sm">
                {error}
              </div>
            </div>
          )}

          {results && !loading && (
            <div className="space-y-4">
              <div className="bg-white border rounded-xl">
                <div className="p-4 border-b">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-2xl font-extrabold tracking-tight text-gray-900">
                        {results.word}
                      </div>
                      <div className="mt-1 flex flex-wrap items-center gap-3 text-gray-700 font-medium">
                        {results.phonetics?.[0]?.text && (
                          <span className="text-sm">
                            {results.phonetics[0].text}
                          </span>
                        )}
                        <button className="inline-flex items-center gap-1 text-sm hover:text-gray-900">
                          <svg
                            viewBox="0 0 24 24"
                            className="h-4 w-4"
                            fill="currentColor"
                          >
                            <path d="M3 10v4h4l5 5V5L7 10H3zM16 7.82v8.36c1.21-.91 2-2.36 2-3.98s-.79-3.07-2-3.98z" />
                          </svg>
                          Nghe
                        </button>
                        <span className="px-2 py-0.5 rounded border text-xs">
                          CEFR {results.level}
                        </span>
                        <span className="px-2 py-0.5 rounded bg-gray-100 text-xs">
                          {results.frequency}
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => toggleSave()}
                      className={`h-9 px-3 rounded-xl font-semibold border ${
                        isSaved
                          ? "bg-yellow-100 border-yellow-300 text-yellow-700"
                          : "bg-blue-600 text-white border-blue-600 hover:bg-blue-700"
                      }`}
                    >
                      <span className="inline-flex items-center gap-2">
                        <svg
                          viewBox="0 0 24 24"
                          className={`h-4 w-4 ${
                            isSaved ? "text-yellow-600" : "text-current"
                          }`}
                          fill="currentColor"
                        >
                          <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
                        </svg>
                        {isSaved ? "Đã lưu" : "Lưu từ"}
                      </span>
                    </button>
                  </div>
                </div>

                <div className="p-4">
                  <div className="flex flex-wrap gap-2 mb-3">
                    {results.meanings.map((m: any) => (
                      <button
                        key={m.partOfSpeech}
                        onClick={() => setActivePOS(m.partOfSpeech)}
                        className={`px-3 py-1 rounded-full text-sm border ${
                          activePOS === m.partOfSpeech
                            ? "bg-gray-900 text-white"
                            : "bg-white hover:bg-gray-50"
                        }`}
                      >
                        {m.partOfSpeech}
                      </button>
                    ))}
                  </div>

                  {(results.meanings as any[])
                    .filter((m) => !activePOS || m.partOfSpeech === activePOS)
                    .map((m) => (
                      <div key={m.partOfSpeech} className="mb-6">
                        <div className="font-semibold mb-2 capitalize text-gray-900">
                          {m.partOfSpeech}
                        </div>
                        <ol className="space-y-3 list-decimal ml-5">
                          {m.defs.map((d: any, i: number) => (
                            <li key={i}>
                              <div className="font-medium text-gray-900">
                                {d.def}
                              </div>
                              {d.ex && (
                                <div className="text-gray-700 text-sm mt-1 italic">
                                  • {d.ex}
                                </div>
                              )}
                            </li>
                          ))}
                        </ol>

                        {m.synonyms?.length ? (
                          <div className="mt-3">
                            <div className="text-sm font-semibold mb-1 text-gray-900">
                              Synonyms
                            </div>
                            <div className="flex flex-wrap gap-2">
                              {m.synonyms.map((s: string) => (
                                <span
                                  key={s}
                                  className="px-2 py-0.5 rounded-full bg-gray-100 text-sm text-gray-800"
                                >
                                  {s}
                                </span>
                              ))}
                            </div>
                          </div>
                        ) : null}

                        {m.collocations?.length ? (
                          <div className="mt-3">
                            <div className="text-sm font-semibold mb-1 text-gray-900">
                              Collocations
                            </div>
                            <div className="flex flex-wrap gap-2">
                              {m.collocations.map((s: string) => (
                                <span
                                  key={s}
                                  className="px-2 py-0.5 rounded-full border text-sm text-gray-800"
                                >
                                  {s}
                                </span>
                              ))}
                            </div>
                          </div>
                        ) : null}
                      </div>
                    ))}

                  {results.forms?.length ? (
                    <div className="mt-2 text-sm text-gray-700">
                      <span className="font-semibold text-gray-900">
                        Word forms:
                      </span>{" "}
                      {results.forms.join(" • ")}
                    </div>
                  ) : null}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* RIGHT */}
        <div className="space-y-4 order-3">
          <div className="bg-white border rounded-xl p-4">
            <div className="font-semibold mb-2 text-gray-900">Mẹo sử dụng</div>
            <ul className="text-sm list-disc pl-5 space-y-1 text-gray-800">
              <li>
                Nhấn{" "}
                <kbd className="px-1 py-0.5 rounded border bg-gray-50">/</kbd>{" "}
                để focus ô tìm kiếm.
              </li>
              <li>
                Enter để tra nhanh, hoặc bấm nút <b>Tra</b>.
              </li>
              <li>
                Lưu từ để ôn tập lại trong mục <b>Đã lưu</b>.
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
