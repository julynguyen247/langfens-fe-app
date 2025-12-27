"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { FiAlertCircle, FiFilter, FiChevronDown, FiX, FiBook, FiCalendar, FiArrowRight } from "react-icons/fi";
import { getWrongAnswers, getQuestionTypes } from "@/utils/api";
import ReactMarkdown from "react-markdown";

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
  { label: "7 ngày", days: 7 },
  { label: "30 ngày", days: 30 },
  { label: "3 tháng", days: 90 },
  { label: "Tất cả", days: 365 },
];

const QUESTION_TYPE_LABELS: Record<string, string> = {
  "TRUE_FALSE_NOT_GIVEN": "True/False/Not Given",
  "YES_NO_NOT_GIVEN": "Yes/No/Not Given",
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
    <main className="mx-auto w-full max-w-6xl px-4 py-6">
      {/* Header */}
      <div className="rounded-2xl border bg-gradient-to-br from-red-50 to-orange-100 p-5 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-red-500 rounded-xl flex items-center justify-center">
            <FiAlertCircle className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-red-700">Ôn tập lỗi sai</h1>
            <p className="text-sm text-red-600">
              Xem lại các câu trả lời sai để không mắc lại lần sau
            </p>
          </div>
        </div>

        {/* Stats summary */}
        {data?.statsByType && Object.keys(data.statsByType).length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {Object.entries(data.statsByType).map(([type, count]) => (
              <span
                key={type}
                className="inline-flex items-center gap-1 rounded-full bg-white/80 px-3 py-1 text-xs font-medium text-red-700"
              >
                {type}: {count}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 mb-6">
        <div className="flex flex-wrap items-center gap-3">
          <FiFilter className="h-4 w-4 text-slate-500" />
          
          {/* Skill filter */}
          <select
            value={skillFilter}
            onChange={(e) => { setSkillFilter(e.target.value); setPage(1); }}
            className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Tất cả kỹ năng</option>
            {SKILLS.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>

          {/* Question type filter */}
          <select
            value={typeFilter}
            onChange={(e) => { setTypeFilter(e.target.value); setPage(1); }}
            className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Tất cả dạng câu</option>
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
            className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {DATE_RANGES.map((r) => (
              <option key={r.days} value={r.days}>{r.label}</option>
            ))}
          </select>

          {(skillFilter || typeFilter) && (
            <button
              onClick={clearFilters}
              className="flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700"
            >
              <FiX className="h-4 w-4" />
              Xóa bộ lọc
            </button>
          )}
          
          <span className="ml-auto text-sm text-slate-500">
            {totalErrors} câu sai
          </span>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin h-8 w-8 border-4 border-red-500 border-t-transparent rounded-full" />
        </div>
      ) : totalErrors === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-10 text-center">
          <FiBook className="h-12 w-12 mx-auto text-green-500 mb-4" />
          <h3 className="text-lg font-semibold text-slate-700">Tuyệt vời!</h3>
          <p className="text-slate-500 mt-2">
            {skillFilter || typeFilter 
              ? "Không có câu sai nào với bộ lọc này"
              : "Bạn chưa có câu sai nào trong khoảng thời gian này"
            }
          </p>
        </div>
      ) : (
        <>
          {/* Error cards */}
          <div className="space-y-4">
            {data?.items.map((item) => (
              <article
                key={item.answerId}
                onClick={() => setSelectedAnswer(item)}
                className="bg-white rounded-xl border border-slate-200 p-4 cursor-pointer hover:shadow-md transition"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="inline-block rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700">
                        {item.skill}
                      </span>
                      <span className="inline-block rounded-full bg-orange-100 px-2 py-0.5 text-xs font-medium text-orange-700">
                        {formatQuestionType(item.questionType)}
                      </span>
                    </div>
                    
                    <p className="text-sm text-slate-700 line-clamp-2">
                      {item.questionContent}
                    </p>
                    
                    <div className="mt-3 flex items-center gap-4 text-xs text-slate-500">
                      <span>{item.sectionTitle}</span>
                      <span className="flex items-center gap-1">
                        <FiCalendar className="h-3 w-3" />
                        {new Date(item.attemptDate).toLocaleDateString("vi-VN")}
                      </span>
                    </div>
                  </div>

                  <div className="text-right flex-shrink-0">
                    <div className="text-xs text-slate-500 mb-1">Bạn trả lời:</div>
                    <div className="text-sm font-medium text-red-600 line-through">
                      {item.userAnswer || "(Bỏ trống)"}
                    </div>
                    <div className="text-xs text-slate-500 mt-2 mb-1">Đáp án đúng:</div>
                    <div className="text-sm font-medium text-green-600">
                      {item.correctAnswer}
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </div>

          {/* Pagination */}
          {maxPage > 1 && (
            <div className="mt-6 flex items-center justify-center gap-2 text-sm">
              <button
                onClick={() => setPage(Math.max(1, page - 1))}
                disabled={page === 1}
                className="rounded-md px-3 py-1.5 text-slate-700 hover:bg-slate-100 disabled:cursor-not-allowed disabled:text-slate-400"
              >
                ‹
              </button>
              <span className="inline-flex h-8 min-w-8 items-center justify-center rounded-md bg-slate-900 px-2 text-white">
                {page}
              </span>
              <span className="text-slate-500">/ {maxPage}</span>
              <button
                onClick={() => setPage(Math.min(maxPage, page + 1))}
                disabled={page === maxPage}
                className="rounded-md px-3 py-1.5 text-slate-700 hover:bg-slate-100 disabled:cursor-not-allowed disabled:text-slate-400"
              >
                ›
              </button>
            </div>
          )}
        </>
      )}

      {/* Detail Modal */}
      {selectedAnswer && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-slate-200 p-4 flex items-center justify-between">
              <h3 className="font-semibold text-slate-900">Chi tiết câu hỏi</h3>
              <button
                onClick={() => setSelectedAnswer(null)}
                className="p-2 hover:bg-slate-100 rounded-lg"
              >
                <FiX className="h-5 w-5" />
              </button>
            </div>
            
            <div className="p-6">
              <div className="flex items-center justify-between gap-4 mb-4">
                <div className="flex items-center gap-2">
                  <span className="inline-block rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700">
                    {selectedAnswer.skill}
                  </span>
                  <span className="inline-block rounded-full bg-orange-100 px-2 py-0.5 text-xs font-medium text-orange-700">
                    {formatQuestionType(selectedAnswer.questionType)}
                  </span>
                </div>
                <Link
                  href={`/attempts/${selectedAnswer.attemptId}`}
                  className="text-sm text-blue-600 hover:text-blue-700 hover:underline flex items-center gap-1"
                >
                  Xem bài làm <FiArrowRight className="w-3 h-3" />
                </Link>
              </div>

              <div className="prose prose-sm max-w-none mb-6">
                <ReactMarkdown>{selectedAnswer.questionContent}</ReactMarkdown>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-red-50 rounded-lg p-4">
                  <div className="text-xs text-red-600 mb-1">Bạn trả lời:</div>
                  <div className="text-sm font-medium text-red-700">
                    {selectedAnswer.userAnswer || "(Bỏ trống)"}
                  </div>
                </div>
                <div className="bg-green-50 rounded-lg p-4">
                  <div className="text-xs text-green-600 mb-1">Đáp án đúng:</div>
                  <div className="text-sm font-medium text-green-700">
                    {selectedAnswer.correctAnswer}
                  </div>
                </div>
              </div>

              {selectedAnswer.explanation && (
                <div className="bg-blue-50 rounded-lg p-4">
                  <div className="text-xs text-blue-600 mb-2 font-medium">Giải thích:</div>
                  <div className="prose prose-sm max-w-none text-slate-700">
                    <ReactMarkdown>{selectedAnswer.explanation}</ReactMarkdown>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
