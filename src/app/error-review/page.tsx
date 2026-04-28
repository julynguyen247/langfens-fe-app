"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { getWrongAnswers, getQuestionTypes } from "@/utils/api";
import ReactMarkdown from "react-markdown";
import PenguinLottie from "@/components/PenguinLottie";

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

const SKILL_BADGE_STYLES: Record<string, string> = {
  READING: "bg-[var(--skill-reading-light)] text-[var(--skill-reading)] border-[var(--skill-reading-border)]",
  LISTENING: "bg-[var(--skill-listening-light)] text-[var(--skill-listening)] border-[var(--skill-listening-border)]",
  WRITING: "bg-[var(--skill-writing-light)] text-[var(--skill-writing)] border-[var(--skill-writing-border)]",
  SPEAKING: "bg-[var(--skill-speaking-light)] text-[var(--skill-speaking)] border-[var(--skill-speaking-border)]",
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

function formatCorrectAnswer(raw: string | undefined, questionType: string): string {
  if (!raw || raw.trim() === "") {
    return "(No answer key)";
  }

  let clean = String(raw)
    .replace(/^(feature|blank|label|heading|item|q|answer|key)[-_]?\d*:\s*/gi, "")
    .replace(/^[\w-]+:\s*/, "")
    .trim();

  if (clean.includes(" / ")) {
    clean = clean.split(" / ")[0].trim();
  }

  if (/^([A-Za-z0-9]+)\/\1$/i.test(clean)) {
    clean = clean.split("/")[0].trim();
  }

  const type = questionType.toUpperCase();

  if (type.includes("MATCHING") && clean.length <= 3) {
    if (/^[ivx]+$/i.test(clean)) {
      return `Heading ${clean}`;
    } else if (/^[A-H]$/i.test(clean)) {
      return `Paragraph ${clean}`;
    }
  }

  return clean || "(No answer key)";
}

function formatQuestionType(type: string): string {
  return QUESTION_TYPE_LABELS[type] || type.split("_").map(w => w.charAt(0) + w.slice(1).toLowerCase()).join(" ");
}

export default function ErrorReviewPage() {
  const [data, setData] = useState<WrongAnswersResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [questionTypes, setQuestionTypes] = useState<string[]>([]);

  const [skillFilter, setSkillFilter] = useState<string>("");
  const [typeFilter, setTypeFilter] = useState<string>("");
  const [dateRange, setDateRange] = useState(30);
  const [page, setPage] = useState(1);

  const [selectedAnswer, setSelectedAnswer] = useState<WrongAnswer | null>(null);

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
    <div className="min-h-screen w-full bg-[var(--background)]">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* PAGE HEADER */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between">
            <div>
              <h1
                className="text-3xl sm:text-4xl font-extrabold text-[var(--foreground)]"
                style={{ fontFamily: "var(--font-sans)" }}
              >
                Error Review
              </h1>
              <p className="text-[var(--text-muted)] text-sm mt-2">
                Review wrong answers to avoid repeating mistakes
              </p>
            </div>
            <div className="bg-red-50 border-[3px] border-red-200 rounded-[1.5rem] shadow-[0_4px_0_rgba(0,0,0,0.08)] px-5 py-3 text-center">
              <div
                className="text-2xl font-extrabold text-[var(--destructive)]"
                style={{ fontFamily: "var(--font-mono)" }}
              >
                {totalErrors}
              </div>
              <div className="text-xs font-bold text-[var(--text-muted)]">wrong answers</div>
            </div>
          </div>
        </motion.div>

        {/* STATS BY TYPE */}
        {data?.statsByType && Object.keys(data.statsByType).length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="bg-white border-[3px] border-[var(--border)] rounded-[1.5rem] shadow-[0_4px_0_rgba(0,0,0,0.08)] p-5 mb-6"
          >
            <span className="text-sm font-bold text-[var(--text-body)] mb-3 block">Errors by Type</span>
            <div className="flex flex-wrap gap-2">
              {Object.entries(data.statsByType).map(([type, count]) => (
                <span
                  key={type}
                  className="inline-flex items-center gap-1.5 rounded-full bg-red-50 px-3 py-1.5 text-xs font-bold text-red-700 border-[2px] border-red-200"
                >
                  {formatQuestionType(type)}
                  <span
                    className="px-1.5 py-0.5 bg-red-100 rounded-full text-red-800 font-extrabold"
                    style={{ fontFamily: "var(--font-mono)" }}
                  >
                    {count}
                  </span>
                </span>
              ))}
            </div>
          </motion.div>
        )}

        {/* FILTERS */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white border-[3px] border-[var(--border)] rounded-[1.5rem] shadow-[0_4px_0_rgba(0,0,0,0.08)] p-5 mb-6"
        >
          <div className="flex flex-wrap items-center gap-4">
            <span className="text-sm font-bold text-[var(--text-muted)]">Filters:</span>

            <select
              value={skillFilter}
              onChange={(e) => { setSkillFilter(e.target.value); setPage(1); }}
              className="rounded-full border-[3px] border-[var(--border)] px-4 py-2 text-sm font-bold text-[var(--text-body)] focus:outline-none focus:border-[var(--primary)] bg-white transition-all"
            >
              <option value="">All Skills</option>
              {SKILLS.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>

            <select
              value={typeFilter}
              onChange={(e) => { setTypeFilter(e.target.value); setPage(1); }}
              className="rounded-full border-[3px] border-[var(--border)] px-4 py-2 text-sm font-bold text-[var(--text-body)] focus:outline-none focus:border-[var(--primary)] bg-white transition-all"
            >
              <option value="">All Types</option>
              {questionTypes.map((t: any) => {
                const typeName = typeof t === "string" ? t : t.type || t.name || "";
                return (
                  <option key={typeName} value={typeName}>{formatQuestionType(String(typeName))}</option>
                );
              })}
            </select>

            <select
              value={dateRange}
              onChange={(e) => { setDateRange(Number(e.target.value)); setPage(1); }}
              className="rounded-full border-[3px] border-[var(--border)] px-4 py-2 text-sm font-bold text-[var(--text-body)] focus:outline-none focus:border-[var(--primary)] bg-white transition-all"
            >
              {DATE_RANGES.map((r) => (
                <option key={r.days} value={r.days}>{r.label}</option>
              ))}
            </select>

            {(skillFilter || typeFilter) && (
              <button
                onClick={clearFilters}
                className="text-sm font-bold text-[var(--destructive)] bg-red-50 px-4 py-2 rounded-full border-[2px] border-red-200 hover:bg-[var(--destructive)] hover:text-white hover:border-red-700 transition-all"
              >
                Clear filters
              </button>
            )}
          </div>
        </motion.div>

        {/* CONTENT */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin h-10 w-10 border-[3px] border-[var(--primary-light)] border-t-[var(--primary)] rounded-full" />
          </div>
        ) : totalErrors === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white border-[3px] border-[var(--border)] rounded-[1.5rem] shadow-[0_4px_0_rgba(0,0,0,0.08)] p-12 text-center"
          >
            <div className="w-32 h-32 mx-auto mb-6">
              <PenguinLottie />
            </div>
            <h3
              className="text-xl font-bold text-[var(--foreground)] mb-2"
              style={{ fontFamily: "var(--font-sans)" }}
            >
              {skillFilter || typeFilter ? "No errors match your filters" : "Great job!"}
            </h3>
            <p className="text-[var(--text-muted)] max-w-md mx-auto">
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
                    className="bg-white border-[3px] border-[var(--border)] rounded-[1.5rem] shadow-[0_4px_0_rgba(0,0,0,0.08)] p-5 cursor-pointer transition-all hover:-translate-y-[3px] hover:border-[var(--destructive)] hover:shadow-[0_6px_0_rgba(0,0,0,0.08)]"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        {/* Tags */}
                        <div className="flex items-center gap-2 mb-3 flex-wrap">
                          <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-bold border-[2px] ${SKILL_BADGE_STYLES[item.skill] || "bg-[var(--background)] text-[var(--text-body)] border-[var(--border)]"}`}>
                            {item.skill}
                          </span>
                          <span className="inline-flex rounded-full bg-orange-50 px-3 py-1 text-xs font-bold text-orange-700 border-[2px] border-orange-200">
                            {formatQuestionType(item.questionType)}
                          </span>
                        </div>

                        {/* Question Content */}
                        <p className="text-sm font-bold text-[var(--text-body)] line-clamp-2 mb-3">
                          {item.questionContent}
                        </p>

                        {/* Meta */}
                        <div className="flex items-center gap-4 text-xs font-bold text-[var(--text-muted)]">
                          <span>{item.sectionTitle}</span>
                          <span
                            style={{ fontFamily: "var(--font-mono)" }}
                          >
                            {new Date(item.attemptDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                          </span>
                        </div>
                      </div>

                      {/* Answer Comparison */}
                      <div className="text-right flex-shrink-0 space-y-2">
                        <div>
                          <div className="text-xs font-bold text-[var(--text-muted)] mb-0.5">Your answer:</div>
                          <div className="text-sm font-bold text-[var(--destructive)] bg-red-50 px-3 py-1 rounded-full border-[2px] border-red-200 line-through">
                            {item.userAnswer || "(Empty)"}
                          </div>
                        </div>
                        <div>
                          <div className="text-xs font-bold text-[var(--text-muted)] mb-0.5">Correct:</div>
                          <div className="text-sm font-bold text-[var(--skill-speaking)] bg-[var(--skill-speaking-light)] px-3 py-1 rounded-full border-[2px] border-[var(--skill-speaking-border)]">
                            {formatCorrectAnswer(item.correctAnswer, item.questionType)}
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
                  className="px-5 py-2.5 rounded-full bg-white border-[2px] border-[var(--border)] text-[var(--text-body)] font-bold hover:border-[var(--primary)] hover:-translate-y-0.5 disabled:opacity-40 transition-all"
                >
                  Prev
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
                        className={`w-10 h-10 rounded-full text-sm font-bold transition-all ${
                          pageNum === page
                            ? "bg-[var(--primary)] text-white border-b-[4px] border-[var(--primary-dark)]"
                            : "bg-white border-[2px] border-[var(--border)] text-[var(--text-body)] hover:border-[var(--primary)] hover:-translate-y-0.5"
                        }`}
                      >
                        <span style={{ fontFamily: "var(--font-mono)" }}>{pageNum}</span>
                      </button>
                    );
                  })}
                </div>

                <button
                  onClick={() => setPage(Math.min(maxPage, page + 1))}
                  disabled={page === maxPage}
                  className="px-5 py-2.5 rounded-full bg-white border-[2px] border-[var(--border)] text-[var(--text-body)] font-bold hover:border-[var(--primary)] hover:-translate-y-0.5 disabled:opacity-40 transition-all"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}

        {/* DETAIL MODAL */}
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
                className="bg-white border-[3px] border-[var(--border)] rounded-[1.5rem] shadow-lg max-w-2xl w-full max-h-[85vh] overflow-hidden"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Modal Header */}
                <div className="sticky top-0 bg-white border-b-[2px] border-[var(--border)] p-5 flex items-center justify-between">
                  <h3
                    className="text-lg font-bold text-[var(--foreground)]"
                    style={{ fontFamily: "var(--font-sans)" }}
                  >
                    Question Details
                  </h3>
                  <button
                    onClick={() => setSelectedAnswer(null)}
                    className="px-4 py-1.5 text-sm font-bold text-[var(--text-muted)] bg-[var(--background)] rounded-full border-[2px] border-[var(--border)] hover:border-[var(--text-muted)] transition-all"
                  >
                    Close
                  </button>
                </div>

                {/* Modal Body */}
                <div className="p-6 overflow-y-auto max-h-[calc(85vh-80px)]">
                  {/* Tags */}
                  <div className="flex items-center justify-between gap-4 mb-4">
                    <div className="flex items-center gap-2">
                      <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-bold border-[2px] ${SKILL_BADGE_STYLES[selectedAnswer.skill] || "bg-[var(--background)] text-[var(--text-body)] border-[var(--border)]"}`}>
                        {selectedAnswer.skill}
                      </span>
                      <span className="inline-flex rounded-full bg-orange-50 px-3 py-1 text-xs font-bold text-orange-700 border-[2px] border-orange-200">
                        {formatQuestionType(selectedAnswer.questionType)}
                      </span>
                    </div>
                    <Link
                      href={`/attempts/${selectedAnswer.attemptId}`}
                      className="text-sm font-bold text-[var(--primary)] bg-[var(--primary-light)] px-4 py-1.5 rounded-full border-[2px] border-[var(--skill-reading-border)] hover:bg-[var(--primary)] hover:text-white hover:border-[var(--primary-dark)] transition-all"
                    >
                      View attempt
                    </Link>
                  </div>

                  {/* Question Content */}
                  <div className="prose prose-sm max-w-none mb-6 p-4 bg-[var(--background)] rounded-[1rem] border-[2px] border-[var(--border)]">
                    <ReactMarkdown>{selectedAnswer.questionContent}</ReactMarkdown>
                  </div>

                  {/* Answer Comparison */}
                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="bg-red-50 rounded-[1.5rem] p-4 border-[3px] border-red-200">
                      <div className="text-xs font-bold text-[var(--destructive)] mb-2">
                        Your Answer
                      </div>
                      <div className="text-sm font-bold text-red-700">
                        {selectedAnswer.userAnswer || "(Empty)"}
                      </div>
                    </div>
                    <div className="bg-[var(--skill-speaking-light)] rounded-[1.5rem] p-4 border-[3px] border-[var(--skill-speaking-border)]">
                      <div className="text-xs font-bold text-[var(--skill-speaking)] mb-2">
                        Correct Answer
                      </div>
                      <div className="text-sm font-bold text-[var(--skill-speaking)]">
                        {formatCorrectAnswer(selectedAnswer.correctAnswer, selectedAnswer.questionType)}
                      </div>
                    </div>
                  </div>

                  {/* Explanation */}
                  {selectedAnswer.explanation && (
                    <div className="bg-[var(--primary-light)] rounded-[1.5rem] p-4 border-[3px] border-[var(--skill-reading-border)]">
                      <div className="text-xs font-bold text-[var(--primary)] mb-2">
                        Explanation
                      </div>
                      <div className="prose prose-sm max-w-none text-[var(--text-body)]">
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
