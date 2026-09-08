"use client";

import React, { useEffect, useState, useMemo, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  AttemptAnswerItem,
  AttemptResultData,
  InternalDeliveryExam,
  InternalDeliverySection,
  InternalDeliveryQuestionGroup,
  InternalDeliveryQuestion,
  QuestionGradeResult,
  ResultFilterType,
  UserAnswerValue,
} from "@/components/exam-v3/types";
import { fetchAttemptResult } from "../_lib/resultApi";
import { ScoreReportModalV3 } from "./ScoreReportModalV3";
import { ResultFilterTabsV3 } from "./ResultFilterTabsV3";
import { PassagePanelV3 } from "@/components/exam-v3/PassagePanelV3";
import { QuestionCardV3 } from "@/components/exam-v3/QuestionCardV3";
import { QuestionNavigatorV3 } from "@/components/exam-v3/QuestionNavigatorV3";

function parseUserAnswer(ans?: AttemptAnswerItem): UserAnswerValue {
  if (!ans) return "";

  if (ans.selectedOptionIds && ans.selectedOptionIds.length > 0) {
    return ans.selectedOptionIds;
  }

  const raw = ans.textAnswer?.trim() || "";

  // Legacy format (pre-TestV2Runner): multi-line string with newline-separated
  // positional answers, e.g. "asdas\nasdas" for SENTENCE_COMPLETION /
  // FORM_COMPLETION / matching. Split into a positional dict keyed by 0-indexed
  // string keys so the value shape matches the new JSON format
  // ({"0": ..., "1": ...}) that the runner writes today. Single-line
  // strings fall through unchanged (no false-positive splitting).
  if (raw.includes("\n") && !raw.startsWith("{") && !raw.startsWith("[")) {
    const lines = raw.split("\n").map((l) => l.trim()).filter(Boolean);
    if (lines.length > 1) {
      const dict: Record<string, string> = {};
      lines.forEach((line, i) => {
        dict[String(i)] = line;
      });
      return dict;
    }
  }

  if (raw.startsWith("{") && raw.endsWith("}")) {
    try {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
        return parsed as Record<string, string>;
      }
    } catch {
      // ignore
    }
  }

  if (raw.startsWith("[") && raw.endsWith("]")) {
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed as string[];
      }
    } catch {
      // ignore
    }
  }

  return ans.selectedAnswerText || raw;
}

/**
 * Result-v3 review UI for an attempt: split-screen paper (PassagePanelV3
 * on left, QuestionCardV3 on right) with filter tabs, QuestionNavigatorV3,
 * and a ScoreReportModalV3. Used for reading/listening/generic attempts.
 */
export function ResultV3Review({ attemptId }: { attemptId: string }) {
  const router = useRouter();

  const [result, setResult] = useState<AttemptResultData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Active section tab & filter
  const [activeSectionIdx, setActiveSectionIdx] = useState(0);
  const [activeFilter, setActiveFilter] = useState<ResultFilterType>("ALL");
  const [activeQuestionIdx, setActiveQuestionIdx] = useState<number | null>(null);
  const [isScoreModalOpen, setIsScoreModalOpen] = useState(false);

  const rightPanelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        setError(null);
        const data = await fetchAttemptResult(attemptId);
        setResult(data);
      } catch (err: unknown) {
        let msg = "Failed to load attempt results";
        if (err && typeof err === "object" && "message" in err && typeof err.message === "string") {
          msg = err.message;
        }
        setError(msg);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [attemptId]);

  // Index answers by question ID and sequential display index
  const { answersByDisplayIdx, gradeResultsByDisplayIdx, allFlattenedQuestions } =
    useMemo(() => {
      if (!result) {
        return {
          answersByDisplayIdx: {} as Record<number, AttemptAnswerItem>,
          gradeResultsByDisplayIdx: {} as Record<number, QuestionGradeResult>,
          allFlattenedQuestions: [] as InternalDeliveryQuestion[],
        };
      }

      const answerByQId = new Map<string, AttemptAnswerItem>();
      const answerByIdx = new Map<number, AttemptAnswerItem>();
      for (const a of result.answers) {
        if (a.questionId) answerByQId.set(a.questionId, a);
        answerByIdx.set(a.idx, a);
      }

      const answersByDisp: Record<number, AttemptAnswerItem> = {};
      const gradesByDisp: Record<number, QuestionGradeResult> = {};
      const flattened: InternalDeliveryQuestion[] = [];

      for (const sec of result.paper.sections || []) {
        for (const q of sec.questions || []) {
          flattened.push(q);
        }
        for (const grp of sec.questionGroups || []) {
          for (const q of grp.questions || []) {
            if (!flattened.some((x: InternalDeliveryQuestion) => x.displayIdx === q.displayIdx)) {
              flattened.push(q);
            }
          }
        }
      }

      flattened.sort((a, b) => (a.displayIdx ?? a.idx) - (b.displayIdx ?? b.idx));

      for (const q of flattened) {
        const dIdx = q.displayIdx ?? q.idx;
        const matchedAns = (q.id ? answerByQId.get(q.id) : null) || answerByIdx.get(q.idx);

        if (matchedAns) {
          answersByDisp[dIdx] = matchedAns;
          gradesByDisp[dIdx] = {
            questionIdx: dIdx,
            isCorrect: matchedAns.isCorrect === true,
            score: matchedAns.isCorrect ? 1 : 0,
            maxScore: 1,
            userAnswer: parseUserAnswer(matchedAns),
            correctAnswerText: matchedAns.correctAnswerText || "See explanation",
          };
        } else {
          gradesByDisp[dIdx] = {
            questionIdx: dIdx,
            isCorrect: false,
            score: 0,
            maxScore: 1,
            correctAnswerText: "Unanswered",
          };
        }
      }

      return {
        answersByDisplayIdx: answersByDisp,
        gradeResultsByDisplayIdx: gradesByDisp,
        allFlattenedQuestions: flattened,
      };
    }, [result]);

  // Counts for filter tabs
  const { correctCount, incorrectCount, unansweredCount } = useMemo(() => {
    let c = 0;
    let inc = 0;
    let un = 0;

    for (const q of allFlattenedQuestions) {
      const dIdx = q.displayIdx ?? q.idx;
      const ans = answersByDisplayIdx[dIdx];
      if (!ans || (ans.textAnswer === null && (!ans.selectedOptionIds || ans.selectedOptionIds.length === 0))) {
        un++;
      } else if (ans.isCorrect === true) {
        c++;
      } else {
        inc++;
      }
    }

    return { correctCount: c, incorrectCount: inc, unansweredCount: un };
  }, [allFlattenedQuestions, answersByDisplayIdx]);

  // Filter helper for questions
  const isQuestionMatchingFilter = (q: InternalDeliveryQuestion): boolean => {
    if (activeFilter === "ALL") return true;
    const dIdx = q.displayIdx ?? q.idx;
    const ans = answersByDisplayIdx[dIdx];

    if (activeFilter === "CORRECT") {
      return ans?.isCorrect === true;
    }
    if (activeFilter === "INCORRECT") {
      return ans?.isCorrect === false;
    }
    if (activeFilter === "UNANSWERED") {
      return !ans || (ans.textAnswer === null && (!ans.selectedOptionIds || ans.selectedOptionIds.length === 0));
    }
    return true;
  };

  // Scroll jump from navigator
  const handleSelectQuestion = (qIdx: number) => {
    if (!result) return;

    const secIndex = result.paper.sections.findIndex((sec: InternalDeliverySection) => {
      const inMain = (sec.questions || []).some((q: InternalDeliveryQuestion) => (q.displayIdx ?? q.idx) === qIdx);
      const inGroup = (sec.questionGroups || []).some((g: InternalDeliveryQuestionGroup) =>
        (g.questions || []).some((q: InternalDeliveryQuestion) => (q.displayIdx ?? q.idx) === qIdx)
      );
      return inMain || inGroup;
    });

    if (secIndex >= 0 && secIndex !== activeSectionIdx) {
      setActiveSectionIdx(secIndex);
    }

    setActiveQuestionIdx(qIdx);

    const targetQ = allFlattenedQuestions.find((q: InternalDeliveryQuestion) => (q.displayIdx ?? q.idx) === qIdx);
    if (targetQ && !isQuestionMatchingFilter(targetQ)) {
      setActiveFilter("ALL");
    }

    setTimeout(() => {
      const el = document.getElementById(`q-${qIdx}`);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }, 100);
  };

  // Paragraph Locator
  const handleLocateParagraph = (letter: string) => {
    const targetEl = document.getElementById(`para-${letter}`);
    if (targetEl) {
      targetEl.scrollIntoView({ behavior: "smooth", block: "center" });
      targetEl.classList.add("ring-4", "ring-amber-400", "bg-amber-100/60");
      setTimeout(() => {
        targetEl.classList.remove("ring-4", "ring-amber-400", "bg-amber-100/60");
      }, 2500);
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#F8F9FA] text-slate-800 font-sans">
        <div className="w-12 h-12 border-4 border-blue-500/20 border-t-[#2563EB] rounded-full animate-spin" />
        <p className="mt-4 text-sm font-bold text-slate-600">
          Loading attempt review & score analysis (Engine v3)...
        </p>
      </div>
    );
  }

  if (error || !result) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#F8F9FA] p-4 font-sans">
        <div className="max-w-md w-full p-8 rounded-3xl bg-white border-2 border-slate-200 shadow-xl text-center space-y-4">
          <h2 className="text-xl font-bold text-rose-600">Failed to load review</h2>
          <p className="text-xs text-slate-500">{error || "Attempt not found"}</p>
          <div className="pt-2 flex justify-center gap-3">
            <Link
              href="/history"
              className="px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition"
            >
              Back to History
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const currentSection = result.paper.sections[activeSectionIdx] || result.paper.sections[0];
  const partNum = (currentSection.idx ?? activeSectionIdx) + 1;

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-[#F8F9FA] text-slate-900 overflow-hidden font-sans select-none">
      {/* Top Header */}
      <header className="h-16 border-b-2 border-slate-200 bg-white/95 backdrop-blur-md px-6 flex items-center justify-between shrink-0 shadow-xs z-30 font-sans">
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => router.push("/history")}
            className="p-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition border border-transparent hover:border-slate-200 cursor-pointer"
            title="Back to history"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
            </svg>
          </button>
          <div className="flex items-center gap-3">
            <span className="bg-[#D32F2F] text-white text-[11px] font-black px-2 py-0.5 rounded tracking-wider uppercase shrink-0">
              IELTS
            </span>
            <div>
              <span className="font-bold text-sm text-slate-900 truncate max-w-xs sm:max-w-md block">
                {result.paper.title}
              </span>
              <span className="text-[10px] font-medium text-slate-500">
                Official Review Mode (v3)
              </span>
            </div>
          </div>
        </div>

        {/* Score Capsule & Actions */}
        <div className="flex items-center gap-3">
          <div className="hidden md:flex items-center gap-2 p-1.5 rounded-2xl bg-slate-100/80 border border-slate-200">
            <div className="px-3 py-1 rounded-xl bg-white border border-slate-200 shadow-2xs flex items-center gap-1.5">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Band</span>
              <span className="font-mono text-sm font-extrabold text-[#2563EB]">
                {result.ieltsBand ? result.ieltsBand.toFixed(1) : "N/A"}
              </span>
            </div>

            <div className="px-3 py-1 rounded-xl bg-white border border-slate-200 shadow-2xs flex items-center gap-1.5">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Score</span>
              <span className="font-mono text-sm font-bold text-slate-800">
                {result.correctCount} / {result.totalQuestion}
              </span>
            </div>

            <button
              type="button"
              onClick={() => setIsScoreModalOpen(true)}
              className="px-3 py-1 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-bold transition flex items-center gap-1 shadow-2xs cursor-pointer"
            >
              <span>📊</span>
              <span>Score Report</span>
            </button>
          </div>

          <button
            type="button"
            onClick={() => setIsScoreModalOpen(true)}
            className="md:hidden px-3 py-1.5 rounded-xl bg-[#2563EB] text-white text-xs font-bold transition flex items-center gap-1 shadow-xs cursor-pointer"
          >
            <span>📊</span>
            <span>Band {result.ieltsBand ? result.ieltsBand.toFixed(1) : "N/A"}</span>
          </button>

          {result.examId && (
            <Link
              href={`/test-v3/${result.examId}`}
              className="px-4 py-2 text-xs font-bold rounded-xl bg-slate-900 hover:bg-slate-800 text-white transition-all shadow-xs"
            >
              Retake Exam
            </Link>
          )}
        </div>
      </header>

      {/* Main Split Screen */}
      <div className="flex-1 flex overflow-hidden min-h-0">
        <div className="w-1/2 h-full flex flex-col min-w-0">
          <PassagePanelV3
            sections={result.paper.sections}
            activeSectionIdx={activeSectionIdx}
            onSelectSection={setActiveSectionIdx}
          />
        </div>

        {/* Right Column: Questions Panel */}
        <div
          ref={rightPanelRef}
          className="w-1/2 h-full overflow-y-auto p-6 space-y-6 select-text"
        >
          {/* Section Heading & Filter Tabs */}
          <div className="space-y-3 pb-3 border-b-2 border-slate-200">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-[#2563EB]">
                  Part {partNum} Questions Review
                </span>
                <h3 className="text-lg font-bold text-slate-900 tracking-tight mt-0.5">
                  {currentSection.title}
                </h3>
              </div>
            </div>

            <ResultFilterTabsV3
              activeFilter={activeFilter}
              totalCount={allFlattenedQuestions.length}
              correctCount={correctCount}
              incorrectCount={incorrectCount}
              unansweredCount={unansweredCount}
              onChange={setActiveFilter}
            />
          </div>

          {/* Question Groups */}
          {currentSection.questionGroups &&
            currentSection.questionGroups.map((grp: InternalDeliveryQuestionGroup) => {
              const matchingQuestions = grp.questions.filter(isQuestionMatchingFilter);
              if (matchingQuestions.length === 0 && activeFilter !== "ALL") return null;

              return (
                <div key={grp.id} className="space-y-4">
                  {/* Admin-like Group Instruction Banner */}
                  <div className="p-5 rounded-2xl bg-blue-50/80 border-2 border-blue-200 text-xs text-slate-800 leading-relaxed font-sans shadow-xs">
                    <span className="font-bold text-[#2563EB] block mb-1">
                      Questions {grp.startIdx} – {grp.endIdx} Instructions:
                    </span>
                    {grp.instructionMd}
                  </div>

                  {matchingQuestions.map((q: InternalDeliveryQuestion) => {
                    const num = q.displayIdx ?? q.idx;
                    const ans = answersByDisplayIdx[num];
                    return (
                      <QuestionCardV3
                        key={q.id || num}
                        question={q}
                        mode="review"
                        value={parseUserAnswer(ans)}
                        gradeResult={gradeResultsByDisplayIdx[num]}
                        onLocateParagraph={handleLocateParagraph}
                      />
                    );
                  })}
                </div>
              );
            })}

          {/* Root Section questions */}
          <div className="space-y-4">
            {currentSection.questions
              .filter(isQuestionMatchingFilter)
              .map((q: InternalDeliveryQuestion) => {
                const num = q.displayIdx ?? q.idx;
                const ans = answersByDisplayIdx[num];
                return (
                  <QuestionCardV3
                    key={q.id || num}
                    question={q}
                    mode="review"
                    value={parseUserAnswer(ans)}
                    gradeResult={gradeResultsByDisplayIdx[num]}
                    onLocateParagraph={handleLocateParagraph}
                  />
                );
              })}
          </div>
        </div>
      </div>

      {/* Bottom Navigator */}
      <QuestionNavigatorV3
        totalQuestions={allFlattenedQuestions.length}
        sections={result.paper.sections}
        mode="review"
        activeIdx={activeQuestionIdx}
        answersByDisplayIdx={answersByDisplayIdx}
        onSelect={handleSelectQuestion}
      />

      {/* Score Modal */}
      <ScoreReportModalV3
        isOpen={isScoreModalOpen}
        onClose={() => setIsScoreModalOpen(false)}
        result={result}
      />
    </div>
  );
}

export default ResultV3Review;
