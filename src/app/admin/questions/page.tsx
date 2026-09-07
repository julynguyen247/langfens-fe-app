"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  getQuestionBankTypes,
  getQuestionBankQuestions,
} from "@/app/admin/_lib/adminApi";
import { QuestionSkill } from "@/app/admin/_lib/types";

interface QuestionTypeCount {
  type: string;
  count: number;
}

interface QuestionBankOption {
  id: string;
  text: string;
  isCorrect: boolean;
  idx: number;
}

interface QuestionBankItem {
  id: string;
  idx: number;
  type: string;
  skill: string;
  difficulty: number;
  promptMd?: string | null;
  explanationMd?: string | null;
  sectionId: string;
  sectionTitle: string;
  examId: string;
  examTitle: string;
  options?: QuestionBankOption[] | null;
}

interface QuestionBankResult {
  items: QuestionBankItem[];
  totalCount: number;
  page: number;
  pageSize: number;
}

function parseErrorMessage(err: unknown): string {
  if (err && typeof err === "object") {
    if ("response" in err && err.response && typeof err.response === "object") {
      const resp = err.response;
      if ("data" in resp && resp.data && typeof resp.data === "object") {
        const data = resp.data;
        if ("message" in data && typeof data.message === "string") {
          return data.message;
        }
      }
    } else if ("message" in err && typeof err.message === "string") {
      return err.message;
    }
  }
  return "Failed to load question bank data";
}

export default function AdminQuestionBankPage() {
  const [selectedSkill, setSelectedSkill] = useState<string>("ALL");
  const [types, setTypes] = useState<QuestionTypeCount[]>([]);
  const [typesLoading, setTypesLoading] = useState(true);

  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [questionsResult, setQuestionsResult] = useState<QuestionBankResult | null>(null);
  const [questionsLoading, setQuestionsLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [error, setError] = useState<string | null>(null);

  // Load question types when skill changes
  useEffect(() => {
    async function fetchTypes() {
      try {
        setTypesLoading(true);
        setError(null);
        const skillParam = selectedSkill === "ALL" ? undefined : selectedSkill;
        const res = await getQuestionBankTypes(skillParam);

        let list: QuestionTypeCount[] = [];
        if (Array.isArray(res)) {
          list = res.map((item) => {
            if (item && typeof item === "object") {
              const t = "type" in item && typeof item.type === "string" ? item.type : "";
              const c = "count" in item && typeof item.count === "number" ? item.count : 0;
              return { type: t, count: c };
            }
            return { type: "", count: 0 };
          }).filter((x) => Boolean(x.type));
        }

        setTypes(list);
        if (list.length > 0) {
          // If current selected type isn't in list, select the first
          if (!selectedType || !list.some((x) => x.type === selectedType)) {
            setSelectedType(list[0].type);
          }
        } else {
          setSelectedType(null);
        }
      } catch (err: unknown) {
        setError(parseErrorMessage(err));
      } finally {
        setTypesLoading(false);
      }
    }

    fetchTypes();
  }, [selectedSkill]);

  // Load questions when selectedType or page changes
  useEffect(() => {
    if (!selectedType) {
      setQuestionsResult(null);
      return;
    }

    async function fetchQuestions() {
      try {
        setQuestionsLoading(true);
        setError(null);
        const skillParam = selectedSkill === "ALL" ? undefined : selectedSkill;
        const res = await getQuestionBankQuestions({
          type: selectedType || "",
          skill: skillParam,
          page,
          pageSize: 15,
        });

        if (res && typeof res === "object" && "items" in res && Array.isArray(res.items)) {
          setQuestionsResult({
            items: res.items,
            totalCount: typeof res.totalCount === "number" ? res.totalCount : res.items.length,
            page: typeof res.page === "number" ? res.page : page,
            pageSize: typeof res.pageSize === "number" ? res.pageSize : 15,
          });
        } else {
          setQuestionsResult({
            items: [],
            totalCount: 0,
            page: 1,
            pageSize: 15,
          });
        }
      } catch (err: unknown) {
        setError(parseErrorMessage(err));
      } finally {
        setQuestionsLoading(false);
      }
    }

    fetchQuestions();
  }, [selectedType, selectedSkill, page]);

  const totalPages = questionsResult
    ? Math.max(1, Math.ceil(questionsResult.totalCount / (questionsResult.pageSize || 15)))
    : 1;

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="pb-6 border-b border-slate-800">
        <h1 className="text-2xl font-bold tracking-tight text-white">Question Bank</h1>
        <p className="mt-1 text-sm text-slate-400">
          Browse, inspect, and analyze all questions indexed across active exams in the system.
        </p>
      </div>

      {/* Skill Filters */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2">
        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider mr-2 shrink-0">
          Skill:
        </span>
        {["ALL", ...Object.values(QuestionSkill)].map((s) => (
          <button
            key={s}
            onClick={() => {
              setSelectedSkill(s);
              setPage(1);
            }}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition shrink-0 ${
              selectedSkill === s
                ? "bg-indigo-600 text-white shadow-sm shadow-indigo-600/30"
                : "bg-slate-900 text-slate-400 hover:text-slate-200 hover:bg-slate-800 border border-slate-800"
            }`}
          >
            {s}
          </button>
        ))}
      </div>

      {/* Main 2-column layout: Left = Question Types List, Right = Questions Table */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-start">
        {/* Left column: Types List */}
        <div className="rounded-xl bg-slate-900/60 border border-slate-800 p-4 space-y-3 md:col-span-1">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800/80">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Question Types
            </span>
            <span className="text-xs text-slate-500 font-mono">
              ({types.length})
            </span>
          </div>

          {typesLoading ? (
            <div className="p-6 text-center text-xs text-slate-500">
              Loading types...
            </div>
          ) : types.length === 0 ? (
            <div className="p-4 text-center text-xs text-slate-500">
              No questions found for this skill.
            </div>
          ) : (
            <div className="space-y-1 max-h-[70vh] overflow-y-auto pr-1">
              {types.map((t) => (
                <button
                  key={t.type}
                  onClick={() => {
                    setSelectedType(t.type);
                    setPage(1);
                  }}
                  className={`w-full text-left px-3 py-2 rounded-lg text-xs font-medium transition flex items-center justify-between gap-2 ${
                    selectedType === t.type
                      ? "bg-indigo-600/20 text-indigo-300 border border-indigo-500/30 font-semibold"
                      : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
                  }`}
                >
                  <span className="truncate" title={t.type}>
                    {t.type}
                  </span>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-950 text-slate-400 shrink-0">
                    {t.count}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right column: Questions List */}
        <div className="md:col-span-3 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-slate-200">
                {selectedType || "Select a type"}
              </span>
              {questionsResult && (
                <span className="text-xs text-slate-500">
                  ({questionsResult.totalCount} total questions)
                </span>
              )}
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex items-center gap-2 text-xs">
                <button
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="px-2.5 py-1 rounded-md bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-100 disabled:opacity-30 transition"
                >
                  Previous
                </button>
                <span className="text-slate-500 font-mono">
                  {page} / {totalPages}
                </span>
                <button
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  className="px-2.5 py-1 rounded-md bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-100 disabled:opacity-30 transition"
                >
                  Next
                </button>
              </div>
            )}
          </div>

          {error && (
            <div className="p-4 rounded-xl bg-rose-950/20 border border-rose-900/40 text-xs text-rose-400">
              {error}
            </div>
          )}

          {questionsLoading ? (
            <div className="p-12 text-center rounded-xl bg-slate-900/40 border border-slate-800">
              <div className="w-8 h-8 mx-auto border-2 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" />
              <p className="mt-3 text-xs text-slate-400">Loading questions...</p>
            </div>
          ) : !questionsResult || questionsResult.items.length === 0 ? (
            <div className="p-12 text-center rounded-xl bg-slate-900/30 border border-dashed border-slate-800 text-xs text-slate-500">
              No questions found for this type and skill filter.
            </div>
          ) : (
            <div className="space-y-3">
              {questionsResult.items.map((item) => (
                <div
                  key={item.id}
                  className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 hover:border-slate-700/80 transition space-y-3"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-indigo-400">
                        Q{item.idx}
                      </span>
                      <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                        {item.skill}
                      </span>
                      <span className="text-xs text-slate-500">
                        Diff: {item.difficulty}/5
                      </span>
                    </div>

                    <Link
                      href={`/admin/exams/${item.examId}`}
                      className="inline-flex items-center gap-1 text-xs font-medium text-indigo-400 hover:text-indigo-300 transition"
                    >
                      <span>Exam: {item.examTitle || "Open Exam"}</span>
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                      </svg>
                    </Link>
                  </div>

                  {/* Section info */}
                  <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
                    <span className="text-slate-500">Section:</span>
                    <span className="font-medium text-slate-300">{item.sectionTitle}</span>
                  </div>

                  {/* Prompt preview */}
                  {item.promptMd && (
                    <div className="text-xs text-slate-200 font-serif leading-relaxed bg-slate-950/60 p-3 rounded-lg border border-slate-800/80">
                      {item.promptMd}
                    </div>
                  )}

                  {/* Options preview if present */}
                  {item.options && item.options.length > 0 && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                      {item.options.map((opt) => (
                        <div
                          key={opt.id || opt.idx}
                          className={`text-xs px-2.5 py-1.5 rounded-md border flex items-center gap-2 ${
                            opt.isCorrect
                              ? "bg-emerald-950/30 border-emerald-500/30 text-emerald-300 font-semibold"
                              : "bg-slate-950/40 border-slate-800 text-slate-400"
                          }`}
                        >
                          <span className="font-mono text-[10px] text-slate-500 shrink-0">
                            #{opt.idx}
                          </span>
                          <span className="truncate">{opt.text}</span>
                          {opt.isCorrect && (
                            <span className="text-[9px] px-1 rounded bg-emerald-500/20 text-emerald-400 uppercase font-bold ml-auto shrink-0">
                              Correct
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
