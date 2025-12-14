"use client";

import { suggestDictionary } from "@/utils/api";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import SleepPenguinMini from "@/components/SleepPenguinMini";

type SuggestItem = {
  id: number;
  word: string;
  pos: string;
  score: number;
};

export default function DictionaryPage() {
  const router = useRouter();

  const [q, setQ] = useState("");
  const [suggests, setSuggests] = useState<SuggestItem[]>([]);
  const [showSuggest, setShowSuggest] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);
  const boxRef = useRef<HTMLDivElement>(null);

  const debounceRef = useRef<number | null>(null);
  const suggestReqIdRef = useRef(0);

  const fetchSuggest = async (term: string) => {
    const t = term.trim();
    if (!t) {
      setSuggests([]);
      setShowSuggest(false);
      return;
    }

    const reqId = ++suggestReqIdRef.current;

    try {
      const data = await suggestDictionary(t);
      if (reqId !== suggestReqIdRef.current) return;

      setSuggests(Array.isArray(data) ? data : []);
      setShowSuggest(true);
    } catch {
      if (reqId !== suggestReqIdRef.current) return;
      setSuggests([]);
      setShowSuggest(false);
    }
  };

  const onChange = (v: string) => {
    setQ(v);

    if (debounceRef.current) window.clearTimeout(debounceRef.current);
    debounceRef.current = window.setTimeout(() => fetchSuggest(v), 250);
  };

  const goDetail = (id: number) => {
    setShowSuggest(false);
    router.push(`/dictionary/${id}`);
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Enter" && document.activeElement === inputRef.current) {
        if (suggests.length > 0) goDetail(suggests[0].id);
      }
      if (e.key === "Escape") setShowSuggest(false);
    };

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [suggests]);

  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      const el = boxRef.current;
      if (!el) return;
      if (!el.contains(e.target as Node)) setShowSuggest(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, []);

  return (
    <div className="min-h-screen bg-[#F7F8FA] text-gray-900">
      <div className="pointer-events-none fixed inset-0">
        <div className="absolute -top-24 left-1/2 h-72 w-72 -translate-x-1/2 rounded-full bg-blue-200/40 blur-3xl" />
        <div className="absolute -bottom-24 right-10 h-72 w-72 rounded-full bg-indigo-200/40 blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-4xl px-4 py-16">
        <div className="mx-auto max-w-2xl text-center">
          <h1 className="mt-4 text-3xl sm:text-4xl font-bold tracking-tight text-gray-900">
            Tra từ nhanh, gợi ý thông minh
          </h1>
          <p className="mt-2 text-sm sm:text-base text-gray-600">
            Gõ từ để xem gợi ý. Chọn một gợi ý để mở trang chi tiết theo id.
          </p>
        </div>
        <div className="mx-auto mt-8 max-w-2xl">
          <div
            ref={boxRef}
            className="relative rounded-2xl border border-gray-200 bg-white p-3 shadow-sm"
          >
            <div className="flex items-center gap-2 rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 focus-within:border-blue-300 focus-within:ring-4 focus-within:ring-blue-100">
              <span className="text-gray-400">⌕</span>
              <input
                ref={inputRef}
                value={q}
                onChange={(e) => onChange(e.target.value)}
                onFocus={() => {
                  if (suggests.length) setShowSuggest(true);
                  if (q.trim()) fetchSuggest(q);
                }}
                placeholder='Tra từ (ví dụ: "free", "dictionary", "define")'
                className="w-full bg-transparent outline-none text-gray-900 placeholder:text-gray-400"
              />
              <kbd className="hidden sm:inline-flex items-center gap-1 rounded-lg border border-gray-200 bg-white px-2 py-1 text-xs text-gray-500">
                Enter
              </kbd>
            </div>
            {showSuggest && suggests.length > 0 && (
              <div className="absolute left-0 right-0 z-50 mt-3 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-xl">
                <div className="max-h-[360px] overflow-auto">
                  {suggests.map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      onMouseDown={(e) => {
                        e.preventDefault();
                        setQ(s.word);
                        goDetail(s.id);
                      }}
                      className="w-full px-4 py-3 text-left hover:bg-gray-50 active:bg-gray-100 flex items-center justify-between"
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-gray-900 truncate">
                            {s.word}
                          </span>
                          <span className="rounded-full border border-gray-200 bg-gray-50 px-2 py-0.5 text-[11px] font-medium text-gray-600">
                            {s.pos}
                          </span>
                        </div>
                      </div>

                      <span className="ml-3 shrink-0 text-gray-400">→</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
          <div className="mt-4 grid gap-2 sm:grid-cols-3 text-center text-xs text-gray-600">
            <div className="rounded-xl border border-gray-200 bg-white p-3">
              <div className="font-semibold text-gray-900">Gợi ý</div>
              <div className="mt-1">Hiện danh sách theo từ bạn gõ</div>
            </div>
            <div className="rounded-xl border border-gray-200 bg-white p-3">
              <div className="font-semibold text-gray-900">Click</div>
              <div className="mt-1">Đi tới trang chi tiết</div>
            </div>
            <div className="rounded-xl border border-gray-200 bg-white p-3">
              <div className="font-semibold text-gray-900">Enter</div>
              <div className="mt-1">Mở gợi ý đầu tiên</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
