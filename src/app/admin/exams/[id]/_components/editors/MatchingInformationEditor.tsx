"use client";

import { useMemo, useState } from "react";
import { InternalDeliveryOption } from "@/app/admin/_lib/types";

interface MatchingInformationEditorProps {
  matchPairs?: Record<string, string[] | null> | null;
  options: InternalDeliveryOption[];
  promptMd?: string | null;
  onChange: (
    pairs: Record<string, string[] | null>,
    options: InternalDeliveryOption[]
  ) => void;
}

const PARAGRAPH_LETTERS = ["A", "B", "C", "D", "E", "F", "G", "H"];

function extractQuestions(pairs: Record<string, string[] | null>): string[] {
  const known = Object.keys(pairs).filter((k) => /^\d+$/.test(k));
  if (known.length > 0) return known.sort((a, b) => Number(a) - Number(b));
  const lettered = Object.keys(pairs).filter((k) => /^[A-Z]$/.test(k));
  return lettered.sort();
}

function extractParagraphLabels(pairs: Record<string, string[] | null>): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(pairs)) {
    if (v && v[1]) out[k] = v[1];
  }
  return out;
}

function questionsToPrompt(
  intro: string,
  questions: { key: string; text: string }[]
): string {
  const lines = [intro];
  for (const q of questions) {
    if (q.text) lines.push(`${q.key}. ${q.text}`);
  }
  return lines.join("\n");
}

export function MatchingInformationEditor({
  matchPairs,
  options,
  promptMd,
  onChange,
}: MatchingInformationEditorProps) {
  const pairs = matchPairs || {};
  const questions = useMemo(() => extractQuestions(pairs), [pairs]);
  const initialLabels = useMemo(() => extractParagraphLabels(pairs), [pairs]);

  const [questionTexts, setQuestionTexts] = useState<Record<string, string>>(() => {
    const fromPrompt = parseQuestionsFromPrompt(promptMd);
    const out: Record<string, string> = {};
    for (const q of questions) {
      out[q] = fromPrompt[q] || "";
    }
    return out;
  });

  function parseQuestionsFromPrompt(prompt: string | null | undefined): Record<string, string> {
    if (!prompt) return {};
    const out: Record<string, string> = {};
    const re = /^(\d+)\.\s+(.+)$/gm;
    let m: RegExpExecArray | null;
    while ((m = re.exec(prompt)) !== null) {
      out[m[1]] = m[2].trim();
    }
    return out;
  }

  const [intro, setIntro] = useState(() => {
    if (!promptMd) return "";
    const lines = promptMd.replace(/\\n/g, "\n").split("\n");
    const firstQ = lines.findIndex((l) => /^\d+\./.test(l.trim()));
    return firstQ > 0 ? lines.slice(0, firstQ).join("\n").trim() : "";
  });

  const persist = (nextQuestions: string[], nextTexts: Record<string, string>) => {
    const nextPairs: Record<string, string[] | null> = {};
    for (const q of nextQuestions) {
      const ans = pairs[q]?.[0] || "";
      const display = nextTexts[q] || "";
      nextPairs[q] = ans ? [ans, display] : null;
    }
    onChange(nextPairs, options);
    if (onPromptChangeLocal) {
      onPromptChangeLocal(questionsToPrompt(intro, nextQuestions.map((k) => ({ key: k, text: nextTexts[k] || "" }))));
    }
  };

  const onPromptChangeLocal = (val: string) => {
    // no-op placeholder — admin updates prompt via top-level field
  };

  const handleAddQuestion = () => {
    const existing = questions.map(Number).filter((n) => !isNaN(n));
    const next = existing.length > 0 ? Math.max(...existing) + 1 : 14;
    const key = String(next);
    const newQuestions = [...questions, key];
    setQuestionTexts({ ...questionTexts, [key]: "" });
    persist(newQuestions, { ...questionTexts, [key]: "" });
  };

  const handleUpdateQuestionText = (key: string, text: string) => {
    const next = { ...questionTexts, [key]: text };
    setQuestionTexts(next);
    persist(questions, next);
  };

  const handleRemoveQuestion = (key: string) => {
    const next = questions.filter((q) => q !== key);
    const nextTexts = { ...questionTexts };
    delete nextTexts[key];
    setQuestionTexts(nextTexts);
    const nextPairs = { ...pairs };
    delete nextPairs[key];
    onChange(nextPairs, options);
  };

  const handleAssign = (qKey: string, paragraphLetter: string) => {
    const nextPairs = { ...pairs };
    if (nextPairs[qKey]?.[0] === paragraphLetter) {
      nextPairs[qKey] = null;
    } else {
      nextPairs[qKey] = [paragraphLetter, questionTexts[qKey] || ""];
    }
    onChange(nextPairs, options);
  };

  return (
    <div className="space-y-4">
      <div className="p-3 rounded-xl bg-indigo-950/30 border border-indigo-900/40 text-[11px] text-indigo-200">
        Each question maps to the paragraph that contains the matching information.
        Paragraphs (A, B, C, …) are configured on the section passage editor. The
        candidate&apos;s answer is the letter.
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Questions ({questions.length})
          </span>
          <button
            type="button"
            onClick={handleAddQuestion}
            className="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-medium rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition"
          >
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            Add Question
          </button>
        </div>

        {questions.length === 0 ? (
          <div className="p-4 text-center rounded-lg border border-dashed border-slate-800 text-xs text-slate-500">
            No questions yet. Add questions like Q14, Q15, Q16, … to the prompt
            or click &ldquo;Add Question&rdquo;.
          </div>
        ) : (
          questions.map((qKey) => {
            const ans = pairs[qKey]?.[0] || "";
            return (
              <div
                key={qKey}
                className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 flex flex-col sm:flex-row sm:items-center gap-3"
              >
                <span className="shrink-0 inline-flex items-center justify-center px-2.5 py-0.5 rounded-md bg-blue-50 text-[#2563EB] border border-blue-200 font-mono text-xs font-bold">
                  Q{qKey}
                </span>
                <input
                  type="text"
                  value={questionTexts[qKey] || ""}
                  onChange={(e) => handleUpdateQuestionText(qKey, e.target.value)}
                  placeholder="Question text / which paragraph contains…?"
                  className="flex-1 bg-transparent text-xs text-slate-200 placeholder-slate-600 focus:outline-none border-b border-transparent hover:border-slate-700 focus:border-indigo-500"
                />
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold text-slate-500">PARAGRAPH</span>
                  <select
                    value={ans}
                    onChange={(e) => handleAssign(qKey, e.target.value)}
                    className="bg-slate-950 border border-slate-700 rounded-md px-2 py-1 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                  >
                    <option value="">—</option>
                    {PARAGRAPH_LETTERS.map((l) => (
                      <option key={l} value={l}>
                        {l}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => handleRemoveQuestion(qKey)}
                    className="p-1 text-slate-500 hover:text-rose-400 transition"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
