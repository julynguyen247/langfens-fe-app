"use client";

import { useEffect, useState, use, useMemo, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { fetchAttemptResult } from "../_lib/resultApi";
import {
  AttemptAnswerItem,
  AttemptResultData,
  InternalDeliveryQuestion,
  QuestionGradeResult,
  UserAnswerValue,
} from "../_lib/types";
import { ResultHero } from "../_components/ResultHero";
import { ResultFilterTabs, ResultFilterType } from "../_components/ResultFilterTabs";
import { ResultNavigator } from "../_components/ResultNavigator";
import { PassagePanel } from "@/app/test-v2/_components/PassagePanel";
import { QuestionCard } from "@/app/test-v2/_components/QuestionCard";

function parseUserAnswer(ans?: AttemptAnswerItem): UserAnswerValue {
  if (!ans) return "";

  if (ans.selectedOptionIds && ans.selectedOptionIds.length > 0) {
    return ans.selectedOptionIds;
  }

  const raw = ans.textAnswer?.trim() || "";
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

export default function ResultV2Page({
  params,
}: {
  params: Promise<{ attemptId: string }>;
}) {
  const resolvedParams = use(params);
  const attemptId = resolvedParams.attemptId;
  const router = useRouter();

  const [result, setResult] = useState<AttemptResultData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Active section tab & filter
  const [activeSectionIdx, setActiveSectionIdx] = useState(0);
  const [activeFilter, setActiveFilter] = useState<ResultFilterType>("ALL");
  const [activeQuestionIdx, setActiveQuestionIdx] = useState<number | null>(null);

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
        if (err && typeof err === "object") {
          if ("message" in err && typeof err.message === "string") {
            msg = err.message;
          }
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

      // Map answers by questionId and idx
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
            if (!flattened.some((x) => x.displayIdx === q.displayIdx)) {
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

    // Find section containing question
    const secIndex = result.paper.sections.findIndex((sec) => {
      const inMain = (sec.questions || []).some((q) => (q.displayIdx ?? q.idx) === qIdx);
      const inGroup = (sec.questionGroups || []).some((g) =>
        (g.questions || []).some((q) => (q.displayIdx ?? q.idx) === qIdx)
      );
      return inMain || inGroup;
    });

    if (secIndex >= 0 && secIndex !== activeSectionIdx) {
      setActiveSectionIdx(secIndex);
    }

    setActiveQuestionIdx(qIdx);

    // If active filter excludes this question, reset filter to ALL
    const targetQ = allFlattenedQuestions.find((q) => (q.displayIdx ?? q.idx) === qIdx);
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

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#F8F9FA] text-slate-800 font-sans">
        <div className="w-12 h-12 border-4 border-blue-500/20 border-t-[#2563EB] rounded-full animate-spin" />
        <p className="mt-4 text-sm font-bold text-slate-600">
          Loading attempt review & score analysis...
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
              href="/admin/exams"
              className="px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition"
            >
              Back to Exams
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const currentSection = result.paper.sections[activeSectionIdx] || result.paper.sections[0];

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-[#F8F9FA] text-slate-900 overflow-hidden font-sans select-none">
      {/* Top Header */}
      <header className="h-16 border-b-2 border-slate-200 bg-white/95 backdrop-blur-md px-6 flex items-center justify-between shrink-0 shadow-xs z-30">
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => router.push("/admin/exams")}
            className="p-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition border border-transparent hover:border-slate-200"
            title="Back to exams"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
            </svg>
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm text-slate-900 truncate max-w-sm">
                {result.paper.title}
              </span>
              <span className="px-2 py-0.5 text-[10px] font-bold rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-300 uppercase tracking-wider">
                Reviewed
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {result.examId && (
            <Link
              href={`/test-v2/${result.examId}`}
              className="px-4 py-2 text-xs font-bold rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] text-white border-b-[3px] border-[#1E40AF] active:translate-y-0.5 shadow-xs transition-all"
            >
              Retake Exam
            </Link>
          )}
        </div>
      </header>

      {/* Main Split Screen */}
      <div className="flex-1 pb-16 flex overflow-hidden min-h-0">
        {/* Left Column: Passage Panel */}
        <div className="w-1/2 h-full flex flex-col min-w-0">
          <PassagePanel
            sections={result.paper.sections}
            activeSectionIdx={activeSectionIdx}
            onSelectSection={setActiveSectionIdx}
          />
        </div>

        {/* Right Column: Questions & Review Cards */}
        <div
          ref={rightPanelRef}
          className="w-1/2 h-full overflow-y-auto p-6 space-y-6 select-text"
        >
          {/* Result Hero Banner */}
          <ResultHero result={result} />

          {/* Section Heading & Filter Bar */}
          <div className="space-y-3 pb-3 border-b-2 border-slate-200">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-[#2563EB]">
                  Part {currentSection.idx + 1} Review
                </span>
                <h3 className="text-lg font-bold text-slate-900 tracking-tight mt-0.5">
                  {currentSection.title}
                </h3>
              </div>
            </div>

            {/* Filter Tabs */}
            <ResultFilterTabs
              activeFilter={activeFilter}
              totalCount={allFlattenedQuestions.length}
              correctCount={correctCount}
              incorrectCount={incorrectCount}
              unansweredCount={unansweredCount}
              onChange={setActiveFilter}
            />
          </div>

          {/* Question Groups if any */}
          {currentSection.questionGroups &&
            currentSection.questionGroups.map((grp) => {
              const matchingQuestions = grp.questions.filter(isQuestionMatchingFilter);
              if (matchingQuestions.length === 0 && activeFilter !== "ALL") return null;

              return (
                <div key={grp.id} className="space-y-4">
                  <div className="p-5 rounded-2xl bg-blue-50/70 border-2 border-blue-200 text-xs text-slate-800 leading-relaxed font-sans shadow-xs">
                    <span className="font-bold text-[#2563EB] block mb-1">
                      Questions {grp.startIdx} – {grp.endIdx} Instructions:
                    </span>
                    {grp.instructionMd}
                  </div>

                  {matchingQuestions.map((q) => {
                    const num = q.displayIdx ?? q.idx;
                    const ans = answersByDisplayIdx[num];
                    return (
                      <QuestionCard
                        key={q.id || num}
                        question={q}
                        value={parseUserAnswer(ans)}
                        isFlagged={false}
                        isReview={true}
                        gradeResult={gradeResultsByDisplayIdx[num]}
                        onAnswerChange={() => {}}
                        onToggleFlag={() => {}}
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
              .map((q) => {
                const num = q.displayIdx ?? q.idx;
                const ans = answersByDisplayIdx[num];
                return (
                  <QuestionCard
                    key={q.id || num}
                    question={q}
                    value={parseUserAnswer(ans)}
                    isFlagged={false}
                    isReview={true}
                    gradeResult={gradeResultsByDisplayIdx[num]}
                    onAnswerChange={() => {}}
                    onToggleFlag={() => {}}
                  />
                );
              })}
          </div>
        </div>
      </div>

      {/* Bottom Result Navigator */}
      <ResultNavigator
        totalQuestions={allFlattenedQuestions.length}
        answersByDisplayIdx={answersByDisplayIdx}
        activeIdx={activeQuestionIdx}
        onSelect={handleSelectQuestion}
      />
    </div>
  );
}
