"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { getWrongAnswers, getQuestionTypes } from "@/utils/api";
import ReactMarkdown from "react-markdown";
import PenguinLottie from "@/components/PenguinLottie";

// Material Icon Component
function Icon({ name, className = "" }: { name: string; className?: string }) {
  return <span className={`material-symbols-rounded ${className}`}>{name}</span>;
}

type WrongAnswer = {
  answerId: string;
  questionId: string;
  questionContent: string;
  questionType: string;
  skill: string;
  sectionTitle: string;
  userAnswer: string;
  correctAnswer: string;
  explanation?: string;
  attemptDate: string;
  examId: string;
  attemptId: string;
};

type WrongAnswersResult = {
  items: WrongAnswer[];
  total: number;
  page: number;
  pageSize: number;
  statsByType: Record<string, number>;
};

const SKILLS = ["READING", "LISTENING"];
const DATE_RANGES = [
  { label: "7 days", days: 7 },
  { label: "30 days", days: 30 },
  { label: "3 months", days: 90 },
  { label: "All time", days: 365 },
];

const SKILL_ICONS: Record<string, string> = {
  READING: "menu_book",
  LISTENING: "headphones",
  WRITING: "edit_note",
  SPEAKING: "mic",
};

const QUESTION_TYPE_LABELS: Record<string, string> = {
  "TRUE_FALSE_NOT_GIVEN": "T/F/NG",
  "YES_NO_NOT_GIVEN": "Y/N/NG",
  "MCQ_SINGLE": "Multiple Choice",
  "MCQ_MULTIPLE": "Multiple Selection",
  "MATCHING_HEADING": "Matching Headings",
  "MATCHING_INFORMATION": "Matching Information",
  "MATCHING_FEATURES": "Matching Features",
  "SUMMARY_COMPLETION": "Summary Completion",
  "TABLE_COMPLETION": "Table Completion",
  "SENTENCE_COMPLETION": "Sentence Completion",
  "DIAGRAM_LABEL": "Diagram Labelling",
  "SHORT_ANSWER": "Short Answer",
  "MAP_LABEL": "Map Labelling",
};

function formatQuestionType(type: string): string {
  return QUESTION_TYPE_LABELS[type] || type.split("_").map(w => w.charAt(0) + w.slice(1).toLowerCase()).join(" ");
}

export default function ErrorReviewPage() {
  const [data, setData] = useState<WrongAnswersResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [questionTypes, setQuestionTypes] = useState<string[]>([]);
  
  // Filters
  const [skillFilter, setSkillFilter] = useState<string>("");
  const [typeFilter, setTypeFilter] = useState<string>("");
  const [dateRange, setDateRange] = useState(30);
  const [page, setPage] = useState(1);
  
  // Modal
  const [selectedAnswer, setSelectedAnswer] = useState<WrongAnswer | null>(null);

  // Fetch question types
  useEffect(() => {
    async function fetchTypes() {
      try {
        const res = await getQuestionTypes();
        const types = (res as any).data?.data ?? [];
        setQuestionTypes(types);
      } catch (e) {
        console.error("Failed to fetch question types:", e);
      }
    }
    fetchTypes();
  }, []);

  // Fetch wrong answers
  useEffect(() => {
    async function fetchErrors() {
      try {
        setLoading(true);
        const fromDate = new Date();
        fromDate.setDate(fromDate.getDate() - dateRange);
        
        const res = await getWrongAnswers({
          skill: skillFilter || undefined,
          questionType: typeFilter || undefined,
          fromDate: fromDate.toISOString(),
          page,
          pageSize: 20,
        });
        
        const result = (res as any).data?.data;
        setData(result);
      } catch (e) {
        console.error("Failed to fetch wrong answers:", e);
        setData(null);
      } finally {
        setLoading(false);
      }
    }
    fetchErrors();
  }, [skillFilter, typeFilter, dateRange, page]);

  const clearFilters = () => {
    setSkillFilter("");
    setTypeFilter("");
    setDateRange(30);
    setPage(1);
  };

  const totalErrors = data?.total ?? 0;
  const maxPage = Math.ceil(totalErrors / 20) || 1;

  return (
    <div className="min-h-screen w-full bg-[#F8FAFC]">
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* =============================================
            PAGE HEADER
        ============================================= */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
                <Icon name="error" className="text-2xl text-red-600" />
              </div>
              <div>
                <h1 className="font-serif text-3xl font-bold text-slate-900">
                  Error Review
                </h1>
                <p className="text-slate-500 text-sm mt-1">
                  Review wrong answers to avoid repeating mistakes
                </p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-red-600">{totalErrors}</div>
              <div className="text-xs text-slate-500">wrong answers</div>
            </div>
          </div>
        </motion.div>

        {/* =============================================
            STATS BY TYPE
        ============================================= */}
        {data?.statsByType && Object.keys(data.statsByType).length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="bg-white rounded-xl border border-slate-200 p-4 mb-6 shadow-sm"
          >
            <div className="flex items-center gap-2 mb-3">
              <Icon name="analytics" className="text-lg text-slate-500" />
              <span className="text-sm font-medium text-slate-700">Errors by Type</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {Object.entries(data.statsByType).map(([type, count]) => (
                <span
                  key={type}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-red-50 px-3 py-1.5 text-xs font-medium text-red-700 border border-red-100"
                >
                  {formatQuestionType(type)}
                  <span className="px-1.5 py-0.5 bg-red-100 rounded text-red-800">{count}</span>
                </span>
              ))}
            </div>
          </motion.div>
        )}

        {/* =============================================
            FILTERS
        ============================================= */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-xl border border-slate-200 p-4 mb-6 shadow-sm"
        >
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2 text-slate-500">
              <Icon name="filter_list" className="text-lg" />
              <span className="text-sm font-medium">Filters:</span>
            </div>
            
            {/* Skill filter */}
            <select
              value={skillFilter}
              onChange={(e) => { setSkillFilter(e.target.value); setPage(1); }}
              className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#3B82F6] focus:border-transparent bg-white"
            >
              <option value="">All Skills</option>
              {SKILLS.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>

            {/* Question type filter */}
            <select
              value={typeFilter}
              onChange={(e) => { setTypeFilter(e.target.value); setPage(1); }}
              className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#3B82F6] focus:border-transparent bg-white"
            >
              <option value="">All Types</option>
              {questionTypes.map((t: any) => {
                const typeName = typeof t === "string" ? t : t.type || t.name || "";
                return (
                  <option key={typeName} value={typeName}>{formatQuestionType(String(typeName))}</option>
                );
              })}
            </select>

            {/* Date range */}
            <select
              value={dateRange}
              onChange={(e) => { setDateRange(Number(e.target.value)); setPage(1); }}
              className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#3B82F6] focus:border-transparent bg-white"
            >
              {DATE_RANGES.map((r) => (
                <option key={r.days} value={r.days}>{r.label}</option>
              ))}
            </select>

            {(skillFilter || typeFilter) && (
              <button
                onClick={clearFilters}
                className="flex items-center gap-1 text-sm text-slate-500 hover:text-red-600 transition-colors"
              >
                <Icon name="close" className="text-base" />
                Clear filters
              </button>
            )}
          </div>
        </motion.div>

        {/* =============================================
            CONTENT
        ============================================= */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin h-8 w-8 border-4 border-[#3B82F6] border-t-transparent rounded-full" />
          </div>
        ) : totalErrors === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-xl border border-slate-200 p-12 text-center shadow-sm"
          >
            <div className="w-32 h-32 mx-auto mb-6">
              <PenguinLottie />
            </div>
            <h3 className="font-serif text-xl font-semibold text-slate-900 mb-2">
              {skillFilter || typeFilter ? "No errors match your filters" : "Great job!"}
            </h3>
            <p className="text-slate-500 max-w-md mx-auto">
              {skillFilter || typeFilter 
                ? "Try adjusting your filters to see more results"
                : "You haven't made any mistakes in this time period. Keep it up!"
              }
            </p>
          </motion.div>
        ) : (
          <>
            {/* Error cards */}
            <div className="space-y-4">
              <AnimatePresence mode="popLayout">
                {data?.items.map((item, index) => (
                  <motion.article
                    key={item.answerId}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -50 }}
                    transition={{ delay: index * 0.03 }}
                    onClick={() => setSelectedAnswer(item)}
                    className="bg-white rounded-xl border border-slate-200 p-5 cursor-pointer hover:shadow-md hover:border-red-200 transition-all shadow-sm"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        {/* Tags */}
                        <div className="flex items-center gap-2 mb-3 flex-wrap">
                          <span className="inline-flex items-center gap-1.5 rounded-lg bg-red-50 px-2.5 py-1 text-xs font-medium text-red-700">
                            <Icon name={SKILL_ICONS[item.skill] || "help"} className="text-sm" />
                            {item.skill}
                          </span>
                          <span className="inline-flex rounded-lg bg-orange-50 px-2.5 py-1 text-xs font-medium text-orange-700">
                            {formatQuestionType(item.questionType)}
                          </span>
                        </div>
                        
                        {/* Question Content */}
                        <p className="text-sm text-slate-700 line-clamp-2 mb-3">
                          {item.questionContent}
                        </p>
                        
                        {/* Meta */}
                        <div className="flex items-center gap-4 text-xs text-slate-400">
                          <span className="flex items-center gap-1">
                            <Icon name="article" className="text-sm" />
                            {item.sectionTitle}
                          </span>
                          <span className="flex items-center gap-1">
                            <Icon name="calendar_today" className="text-sm" />
                            {new Date(item.attemptDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                          </span>
                        </div>
                      </div>

                      {/* Answer Comparison */}
                      <div className="text-right flex-shrink-0 space-y-2">
                        <div>
                          <div className="text-xs text-slate-400 mb-0.5">Your answer:</div>
                          <div className="text-sm font-medium text-red-600 bg-red-50 px-2 py-1 rounded line-through">
                            {item.userAnswer || "(Empty)"}
                          </div>
                        </div>
                        <div>
                          <div className="text-xs text-slate-400 mb-0.5">Correct:</div>
                          <div className="text-sm font-medium text-emerald-700 bg-emerald-50 px-2 py-1 rounded">
                            {item.correctAnswer}
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.article>
                ))}
              </AnimatePresence>
            </div>

            {/* Pagination */}
            {maxPage > 1 && (
              <div className="mt-10 flex items-center justify-center gap-2">
                <button
                  onClick={() => setPage(Math.max(1, page - 1))}
                  disabled={page === 1}
                  className="w-10 h-10 rounded-lg bg-white border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-40 transition shadow-sm flex items-center justify-center"
                >
                  <Icon name="chevron_left" className="text-xl" />
                </button>

                <div className="flex items-center gap-2">
                  {Array.from({ length: Math.min(5, maxPage) }, (_, i) => {
                    let pageNum = i + 1;
                    if (maxPage > 5) {
                      if (page <= 3) pageNum = i + 1;
                      else if (page >= maxPage - 2) pageNum = maxPage - 4 + i;
                      else pageNum = page - 2 + i;
                    }
                    return (
                      <button
                        key={pageNum}
                        onClick={() => setPage(pageNum)}
                        className={`w-10 h-10 rounded-lg text-sm font-medium transition shadow-sm flex items-center justify-center ${
                          pageNum === page
                            ? "bg-[#3B82F6] text-white"
                            : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                </div>

                <button
                  onClick={() => setPage(Math.min(maxPage, page + 1))}
                  disabled={page === maxPage}
                  className="w-10 h-10 rounded-lg bg-white border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-40 transition shadow-sm flex items-center justify-center"
                >
                  <Icon name="chevron_right" className="text-xl" />
                </button>
              </div>
            )}
          </>
        )}

        {/* =============================================
            DETAIL MODAL
        ============================================= */}
        <AnimatePresence>
          {selectedAnswer && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
              onClick={() => setSelectedAnswer(null)}
            >
              <motion.div 
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="bg-white rounded-2xl max-w-2xl w-full max-h-[85vh] overflow-hidden shadow-2xl"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Modal Header */}
                <div className="sticky top-0 bg-white border-b border-slate-200 p-5 flex items-center justify-between">
                  <h3 className="font-serif text-lg font-semibold text-slate-900">Question Details</h3>
                  <button
                    onClick={() => setSelectedAnswer(null)}
                    className="p-2 hover:bg-slate-100 rounded-lg transition"
                  >
                    <Icon name="close" className="text-xl text-slate-500" />
                  </button>
                </div>
                
                {/* Modal Body */}
                <div className="p-6 overflow-y-auto max-h-[calc(85vh-80px)]">
                  {/* Tags */}
                  <div className="flex items-center justify-between gap-4 mb-4">
                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center gap-1.5 rounded-lg bg-red-50 px-2.5 py-1 text-xs font-medium text-red-700">
                        <Icon name={SKILL_ICONS[selectedAnswer.skill] || "help"} className="text-sm" />
                        {selectedAnswer.skill}
                      </span>
                      <span className="inline-flex rounded-lg bg-orange-50 px-2.5 py-1 text-xs font-medium text-orange-700">
                        {formatQuestionType(selectedAnswer.questionType)}
                      </span>
                    </div>
                    <Link
                      href={`/attempts/${selectedAnswer.attemptId}`}
                      className="text-sm text-[#3B82F6] hover:text-[#2563EB] flex items-center gap-1 font-medium"
                    >
                      View attempt <Icon name="arrow_forward" className="text-base" />
                    </Link>
                  </div>

                  {/* Question Content */}
                  <div className="prose prose-sm max-w-none mb-6 p-4 bg-[#F8FAFC] rounded-lg border border-slate-100">
                    <ReactMarkdown>{selectedAnswer.questionContent}</ReactMarkdown>
                  </div>

                  {/* Answer Comparison */}
                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="bg-red-50 rounded-xl p-4 border border-red-100">
                      <div className="text-xs text-red-600 mb-2 font-medium flex items-center gap-1">
                        <Icon name="close" className="text-sm" />
                        Your Answer
                      </div>
                      <div className="text-sm font-medium text-red-700">
                        {selectedAnswer.userAnswer || "(Empty)"}
                      </div>
                    </div>
                    <div className="bg-emerald-50 rounded-xl p-4 border border-emerald-100">
                      <div className="text-xs text-emerald-600 mb-2 font-medium flex items-center gap-1">
                        <Icon name="check" className="text-sm" />
                        Correct Answer
                      </div>
                      <div className="text-sm font-medium text-emerald-700">
                        {selectedAnswer.correctAnswer}
                      </div>
                    </div>
                  </div>

                  {/* Explanation */}
                  {selectedAnswer.explanation && (
                    <div className="bg-[#EFF6FF] rounded-xl p-4 border border-blue-100">
                      <div className="text-xs text-[#2563EB] mb-2 font-medium flex items-center gap-1">
                        <Icon name="lightbulb" className="text-sm" />
                        Explanation
                      </div>
                      <div className="prose prose-sm max-w-none text-slate-700">
                        <ReactMarkdown>{selectedAnswer.explanation}</ReactMarkdown>
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
