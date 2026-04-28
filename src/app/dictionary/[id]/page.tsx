"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { getDictionaryDetails } from "@/utils/api";
import { motion } from "framer-motion";

type Pronunciation = {
  region: string | null;
  ipa: string | null;
  mp3Url: string | null;
};

type WordForm = {
  form: string;
  tags: string[];
};

type Sense = {
  id: string;
  definitionEn: string;
  labels: string[];
  vietnamese: string[];
  examples: string[];
};

type DictionaryDetails = {
  id: number;
  word: string;
  pos: string;
  wordNorm: string;
  importedAt: string;
  pronunciations: Pronunciation[];
  forms: WordForm[];
  senses: Sense[];
  vietnamese: string[];
};

// =============================================
// AUDIO HELPER (Web Speech API)
// =============================================
function speakWord(word: string, region: "UK" | "US" = "UK") {
  if (typeof window === "undefined" || !window.speechSynthesis) return;

  const utterance = new SpeechSynthesisUtterance(word);
  utterance.lang = region === "UK" ? "en-GB" : "en-US";
  utterance.rate = 0.9;
  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(utterance);
}

export default function DictionaryDetailPage() {
  const params = useParams<{ id: string }>();
  const id = Number(params?.id);

  const [data, setData] = useState<DictionaryDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string>("");

  useEffect(() => {
    let alive = true;

    async function run() {
      try {
        setLoading(true);
        setErr("");

        if (!Number.isFinite(id)) throw new Error("Invalid ID");

        const res = (await getDictionaryDetails(id)) as DictionaryDetails;
        if (alive) setData(res);
      } catch (e: any) {
        if (alive) setErr(e?.message || "Could not load data.");
      } finally {
        if (alive) setLoading(false);
      }
    }

    run();
    return () => {
      alive = false;
    };
  }, [id]);

  const pronunciationsByRegion = useMemo(() => {
    if (!data?.pronunciations) return { uk: null, us: null };
    const uk = data.pronunciations.find((p) => p.region === "UK") || null;
    const us = data.pronunciations.find((p) => p.region === "US") || null;
    return { uk, us };
  }, [data]);

  const audioList = useMemo(() => {
    return (data?.pronunciations || [])
      .map((p) => p.mp3Url)
      .filter((x): x is string => !!x);
  }, [data]);

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="rounded-[2rem] border-[3px] border-[var(--border)] shadow-[0_4px_0_rgba(0,0,0,0.08)] bg-white p-8">
          <div className="h-8 w-48 animate-pulse rounded-full bg-[var(--border)]" />
          <div className="mt-4 h-4 w-72 animate-pulse rounded-full bg-[var(--background)]" />
          <div className="mt-8 h-24 w-full animate-pulse rounded-[1rem] bg-[var(--background)]" />
          <div className="mt-4 h-16 w-full animate-pulse rounded-[1rem] bg-[var(--background)]" />
        </div>
      </div>
    );
  }

  if (err) {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="rounded-[2rem] border-[3px] border-[var(--destructive)] shadow-[0_4px_0_rgba(0,0,0,0.08)] bg-white p-8 text-center">
          <h3
            className="text-xl font-bold text-[var(--foreground)] mb-2"
            style={{ fontFamily: "var(--font-sans)" }}
          >
            Something went wrong
          </h3>
          <p className="text-[var(--text-muted)] font-bold">{err}</p>
        </div>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="rounded-[2rem] border-[3px] border-[var(--border)] shadow-[0_4px_0_rgba(0,0,0,0.08)] bg-white p-8 md:p-10"
      >
        {/* Word Header */}
        <div className="border-b-[2px] border-[var(--border)] pb-6 mb-8">
          {/* Word */}
          <h1
            className="text-3xl font-bold text-[var(--text-heading)] mb-3"
            style={{ fontFamily: "var(--font-sans)" }}
          >
            {data.word}
          </h1>

          {/* Part of speech pill badge */}
          <div className="flex flex-wrap items-center gap-2 mb-4">
            <span className="rounded-full bg-[var(--primary-light)] text-[var(--primary)] px-3 py-1 text-sm font-bold border-[2px] border-[var(--skill-reading-border)]">
              {data.pos}
            </span>
            {data.vietnamese?.length > 0 && (
              <span className="rounded-full bg-[var(--skill-writing-light)] text-[var(--skill-writing)] px-3 py-1 text-sm font-bold border-[2px] border-[var(--skill-writing-border)]">
                {data.vietnamese.join(", ")}
              </span>
            )}
          </div>

          {/* Pronunciation: phonetic text + play 3D pill buttons */}
          <div className="flex flex-wrap gap-3">
            {pronunciationsByRegion.uk && pronunciationsByRegion.uk.ipa && (
              <button
                onClick={() => speakWord(data.word, "UK")}
                className="flex items-center gap-2 px-4 py-2 rounded-full border-[2px] border-[var(--border)] border-b-[4px] bg-[var(--background)] hover:border-[var(--primary)] hover:bg-[var(--primary-light)] active:translate-y-[2px] active:border-b-[2px] transition-all group"
              >
                <span className="text-[10px] font-bold text-[var(--primary)]">UK</span>
                <span
                  className="text-[var(--text-muted)] text-sm group-hover:text-[var(--primary)]"
                  style={{ fontFamily: "var(--font-mono)" }}
                >
                  {pronunciationsByRegion.uk.ipa}
                </span>
                <span className="text-[var(--text-muted)] text-xs font-bold group-hover:text-[var(--primary)]">
                  Play
                </span>
              </button>
            )}
            {pronunciationsByRegion.us && pronunciationsByRegion.us.ipa && (
              <button
                onClick={() => speakWord(data.word, "US")}
                className="flex items-center gap-2 px-4 py-2 rounded-full border-[2px] border-[var(--border)] border-b-[4px] bg-[var(--background)] hover:border-[var(--destructive)] hover:bg-red-50 active:translate-y-[2px] active:border-b-[2px] transition-all group"
              >
                <span className="text-[10px] font-bold text-[var(--destructive)]">US</span>
                <span
                  className="text-[var(--text-muted)] text-sm group-hover:text-[var(--destructive)]"
                  style={{ fontFamily: "var(--font-mono)" }}
                >
                  {pronunciationsByRegion.us.ipa}
                </span>
                <span className="text-[var(--text-muted)] text-xs font-bold group-hover:text-[var(--destructive)]">
                  Play
                </span>
              </button>
            )}
          </div>

          {/* Hidden audio elements for mp3 playback */}
          {audioList.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {audioList.map((src, idx) => (
                <audio
                  key={`audio-${idx}-${src}`}
                  controls
                  preload="none"
                  src={src}
                  className="h-8"
                />
              ))}
            </div>
          )}
        </div>

        {/* Definitions (Senses) - numbered list */}
        <div className="mb-8">
          <h2
            className="text-sm font-bold text-[var(--text-muted)] mb-4"
            style={{ fontFamily: "var(--font-sans)" }}
          >
            Definitions
          </h2>

          <div className="space-y-8">
            {data.senses?.map((s, idx) => (
              <motion.div
                key={`sense-${s.id}`}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, ease: "easeOut", delay: idx * 0.1 }}
              >
                <div className="flex gap-4">
                  {/* Numbered badge */}
                  <span
                    className="shrink-0 w-7 h-7 rounded-full bg-[var(--primary)] text-white flex items-center justify-center text-xs font-bold border-b-[2px] border-[var(--primary-dark)] mt-0.5"
                    style={{ fontFamily: "var(--font-mono)" }}
                  >
                    {idx + 1}
                  </span>

                  <div className="flex-1 space-y-3">
                    {/* Definition text */}
                    <div className="text-lg text-[var(--foreground)] font-bold leading-relaxed">
                      {s.definitionEn}
                    </div>

                    {/* Labels as pill badges */}
                    {s.labels?.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {s.labels.map((l, li) => (
                          <span
                            key={`sense-${s.id}-label-${li}-${l}`}
                            className="rounded-full border-[2px] border-[var(--border)] bg-[var(--background)] px-2.5 py-0.5 text-xs font-bold text-[var(--text-muted)]"
                          >
                            {l}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Vietnamese terms */}
                    {s.vietnamese?.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {s.vietnamese.map((v, i) => (
                          <span
                            key={`sense-${s.id}-vi-${i}-${v}`}
                            className="rounded-full bg-[var(--skill-writing-light)] text-[var(--skill-writing)] px-2.5 py-0.5 text-sm font-bold border-[2px] border-[var(--skill-writing-border)]"
                          >
                            {v}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Example sentences: italic, keyword highlighted */}
                    {s.examples?.length > 0 && (
                      <div className="pl-4 border-l-[4px] border-[var(--primary)] bg-[var(--background)] py-3 pr-4 rounded-r-[1rem]">
                        <ul className="space-y-2">
                          {s.examples.map((ex, i) => (
                            <li
                              key={`sense-${s.id}-ex-${i}`}
                              className="italic text-[var(--text-body)] text-base leading-relaxed"
                            >
                              &ldquo;{highlightWord(ex, data.word)}&rdquo;
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}

            {(!data.senses || data.senses.length === 0) && (
              <div className="rounded-[2rem] border-[2px] border-[var(--border)] bg-[var(--background)] p-6 text-sm text-[var(--text-muted)] font-bold text-center">
                No definitions available.
              </div>
            )}
          </div>
        </div>

        {/* Forms: horizontal scroll row of clickable word chips */}
        {data.forms?.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: "easeOut", delay: 0.3 }}
            className="border-t-[2px] border-[var(--border)] pt-6"
          >
            <h2
              className="text-sm font-bold text-[var(--text-muted)] mb-3"
              style={{ fontFamily: "var(--font-sans)" }}
            >
              Related forms
            </h2>
            <div className="flex gap-2 overflow-x-auto pb-2">
              {data.forms.map((f, fi) => (
                <span
                  key={`form-${fi}-${f.form}`}
                  className="shrink-0 rounded-full border-[2px] border-[var(--border)] bg-[var(--background)] px-3 py-1.5 text-sm font-bold text-[var(--text-body)] hover:border-[var(--primary)] hover:bg-[var(--primary-light)] hover:text-[var(--primary)] transition-all cursor-default"
                >
                  {f.form}
                  {f.tags?.length > 0 && (
                    <span className="text-[var(--text-muted)] text-xs ml-1">
                      ({f.tags.join(", ")})
                    </span>
                  )}
                </span>
              ))}
            </div>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}

/**
 * Highlights occurrences of `word` in `text` with a primary-light background.
 * Returns React nodes with <mark> elements for matches.
 */
function highlightWord(text: string, word: string): React.ReactNode {
  if (!word) return text;

  const regex = new RegExp(`(${word.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`, "gi");
  const parts = text.split(regex);

  if (parts.length <= 1) return text;

  return parts.map((part, i) =>
    regex.test(part) ? (
      <mark
        key={i}
        className="bg-[var(--primary-light)] text-[var(--foreground)] rounded px-0.5"
        style={{ fontStyle: "italic" }}
      >
        {part}
      </mark>
    ) : (
      <span key={i}>{part}</span>
    )
  );
}
